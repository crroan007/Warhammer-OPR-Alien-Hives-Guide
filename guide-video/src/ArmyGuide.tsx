import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  CalculateMetadataFunction,
} from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { SCENES, FPS, WIDTH, HEIGHT, audioPath } from "./scenes";

/* ---------- palette (matches the web guide) ---------- */
const C = {
  bg: "#0e1410",
  panel: "#16201a",
  ink: "#e9f1ea",
  muted: "#9fb3a4",
  acc: "#7ec850",
  acc2: "#46c0a0",
  warn: "#e2a23b",
  danger: "#e4675b",
  line: "#2a3a30",
};
const FONT =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

const TAIL = 18; // frames of silence after speech

/* ---------- data ---------- */
type Unit = {
  name: string;
  count: string;
  q: string;
  d: string;
  tag: string;
  tagColor: string;
  dice: string;
  use: string[];
  avoid: string[];
};

const UNITS: Unit[] = [
  {
    name: "Carnivo-Rex",
    count: "[1]",
    q: "4+",
    d: "2+",
    tag: "HAMMER",
    tagColor: C.acc,
    dice: "MELEE: roll 13 dice @ 4+  (9 claws + 4 stomp)",
    use: [
      "Advance up the middle beside the Toxico — grind his army rounds 1–3",
      "Charge his biggest blob or any Defense-2 vehicle — 13 AP1 dice shred both",
      "Round 4: park on a marker — Tough(12) won't be shifted",
    ],
    avoid: [
      "Never solo a Deadly(3) walker or tank — it out-trades you. Gang it",
      "Don't get tar-pitted by chaff — Fatigue means you then hit on 6s only",
    ],
  },
  {
    name: "Toxico-Rex",
    count: "[1]",
    q: "4+",
    d: "2+",
    tag: "ANVIL · LEAD WITH THIS",
    tagColor: C.acc2,
    dice: "MELEE: 12 @ 4+ (8 whip + 4 stomp)  ·  SHOOT: 2 @ 4+, Blast(3)",
    use: [
      "Push it ahead of the Carnivo to EAT the AP-Deadly fire",
      "Regeneration ignores about 1/3 of every wound",
      "Whip Limbs (Bane) shreds vehicles and ignores enemy Regeneration",
    ],
    avoid: [
      "Don't hide it — its whole job is to soak fire up front",
      "Don't fire Acid Spurt at a single big model (Blast caps at 1 hit)",
    ],
  },
  {
    name: "Hive Burrower",
    count: "[1]",
    q: "4+",
    d: "2+",
    tag: "AMBUSH",
    tagColor: C.warn,
    dice: "MELEE: roll 14 dice @ 4+  (9 claws + 5 stomp)",
    use: [
      "Keep in reserve. Round 2, drop behind his lines by his best gun or fast unit",
      "Charge it — kill what could reach and reclaim your markers",
      "You alternate placing reserves — denies his ambush free rein",
    ],
    avoid: [
      "Won't wipe a team — it kills about 1–2 of 3 models",
      "Can't seize the round it lands — don't drop onto a marker to hold it",
    ],
  },
  {
    name: "Soul-Snatchers",
    count: "[5]",
    q: "3+",
    d: "4+",
    tag: "SCORER · TANK-GRINDER",
    tagColor: C.acc,
    dice: "MELEE: roll 10 dice @ 3+, Rending  (5 models × 2)",
    use: [
      'Fast — 16" Rush. Tag a marker, then peel off and kill — don\'t camp',
      "Hunt his transports and pop them before the cargo climbs out",
      "Rending 6s become high-AP — grind the Defense-2 tanks monsters can't reach",
    ],
    avoid: [
      'Don\'t push 9"+ ahead of a monster — D4 / 5 wounds, they melt to one shot',
      "Don't waste them as a speed bump — they're your scorers",
    ],
  },
  {
    name: "Mortar Beast",
    count: "[1]",
    q: "4+",
    d: "3+",
    tag: "ANTI-HORDE",
    tagColor: C.acc2,
    dice: "SHOOT: roll 2 dice @ 4+ (5+ if it moved)  ·  Blast(3), Indirect",
    use: [
      "Park it in the backfield and NEVER move it",
      "Gun down anything creeping toward your seized markers — no line of sight needed",
      "Blast3 is also your answer to a massed Ork swarm",
    ],
    avoid: [
      "Don't move it — −1 to hit halves its output",
      "Don't shoot single big models (Blast caps at 1)",
    ],
  },
  {
    name: "Snatcher Lord",
    count: "[1]",
    q: "3+",
    d: "4+",
    tag: "FAST FLANKER · HERO",
    tagColor: C.warn,
    dice: "MELEE: roll 4 dice @ 3+, Rending",
    use: [
      "Send him wide to tag a far marker early — control sticks, it stays yours",
      "Then hunt his backfield units that could circle back to reclaim it",
    ],
    avoid: [
      "Keep him behind a beast vs snipers — Takedown one-shots a Tough(3) hero",
      'Strider, NOT Fast — only 6" / 12" of movement',
    ],
  },
];

/* ---------- props + dynamic duration ---------- */
type Props = { durs: number[]; hasAudio: boolean[] };

export const calculateMetadata: CalculateMetadataFunction<Props> = async () => {
  const durs: number[] = [];
  const hasAudio: boolean[] = [];
  for (const s of SCENES) {
    try {
      const sec = await getAudioDurationInSeconds(staticFile(audioPath(s.id)));
      durs.push(Math.max(Math.ceil(sec * FPS) + TAIL, s.min));
      hasAudio.push(true);
    } catch {
      durs.push(s.min);
      hasAudio.push(false);
    }
  }
  return {
    durationInFrames: durs.reduce((a, b) => a + b, 0),
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
    props: { durs, hasAudio },
  };
};

/* ---------- helpers ---------- */
const Rise: React.FC<{
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 26, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: 18,
  });
  return (
    <div
      style={{
        ...style,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

const Wrap: React.FC<{ dur: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  dur,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, dur - 14, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        opacity,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 300], [0, 40], { extrapolateRight: "extend" });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at ${30 + drift}% 18%, rgba(126,200,80,.10), transparent 60%), radial-gradient(900px 700px at 80% 95%, rgba(70,192,160,.08), transparent 60%)`,
        }}
      />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 320px rgba(0,0,0,.75)" }} />
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = C.acc,
}) => (
  <span
    style={{
      display: "inline-block",
      padding: "8px 20px",
      borderRadius: 999,
      background: color,
      color: "#06120e",
      fontWeight: 800,
      fontSize: 26,
      letterSpacing: 1,
    }}
  >
    {children}
  </span>
);

/* ---------- scenes ---------- */
const TitleScene: React.FC<{ dur: number }> = ({ dur }) => (
  <Wrap dur={dur}>
    <Rise delay={0}>
      <div style={{ fontSize: 40, color: C.acc2, letterSpacing: 8, fontWeight: 700 }}>
        🐛 GRIMDARK FUTURE · FIELD GUIDE
      </div>
    </Rise>
    <Rise delay={8}>
      <div
        style={{
          fontSize: 150,
          fontWeight: 900,
          color: C.ink,
          lineHeight: 1.02,
          textAlign: "center",
          marginTop: 10,
          textShadow: "0 6px 30px rgba(0,0,0,.5)",
        }}
      >
        ALIEN HIVES
      </div>
    </Rise>
    <Rise delay={16}>
      <div style={{ fontSize: 46, color: C.muted, marginTop: 8 }}>
        How to play your army · 1500 pts
      </div>
    </Rise>
    <Rise delay={26} style={{ marginTop: 34 }}>
      <Chip color={C.acc}>YOU WIN ON MARKERS — NOT KILLS</Chip>
    </Rise>
  </Wrap>
);

const Pillar: React.FC<{ delay: number; icon: string; head: string; sub: string }> = ({
  delay,
  icon,
  head,
  sub,
}) => (
  <Rise delay={delay} style={{ flex: 1 }}>
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        padding: "30px 28px",
        height: "100%",
      }}
    >
      <div style={{ fontSize: 64 }}>{icon}</div>
      <div style={{ fontSize: 40, fontWeight: 800, color: C.acc, marginTop: 8 }}>{head}</div>
      <div style={{ fontSize: 30, color: C.muted, marginTop: 10, lineHeight: 1.35 }}>{sub}</div>
    </div>
  </Rise>
);

const BigIdeaScene: React.FC<{ dur: number }> = ({ dur }) => (
  <Wrap dur={dur} style={{ padding: "0 120px" }}>
    <Rise delay={0}>
      <div style={{ fontSize: 64, fontWeight: 900, color: C.ink, textAlign: "center" }}>
        THE BIG IDEA
      </div>
    </Rise>
    <Rise delay={8}>
      <div
        style={{
          fontSize: 34,
          color: C.muted,
          textAlign: "center",
          marginTop: 12,
          maxWidth: 1300,
          lineHeight: 1.4,
        }}
      >
        Tag a marker and it's <b style={{ color: C.ink }}>yours — even after you leave</b>, until he touches it. Both on one = only a <b style={{ color: C.ink }}>tie</b>. So <b style={{ color: C.acc }}>seize early, then drive in and kill.</b>
      </div>
    </Rise>
    <div style={{ display: "flex", gap: 26, marginTop: 46, width: "100%", maxWidth: 1500 }}>
      <Pillar delay={20} icon="🚩" head="Seize early" sub="Tag markers turn 1 — control sticks; they stay yours after you leave." />
      <Pillar delay={30} icon="🦖" head="Then go kill" sub="Drive the monsters into his army. A dead unit can't take your ground back." />
      <Pillar delay={40} icon="🎯" head="Own, don't tie" sub="Clear enemies off a marker to own it. A shared marker scores nobody." />
    </div>
  </Wrap>
);

const StatBadge: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div
    style={{
      flex: 1,
      background: C.panel,
      border: `1px solid ${C.line}`,
      borderRadius: 14,
      padding: "14px 0",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: 22, letterSpacing: 2, color: C.muted, fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: 64, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
  </div>
);

const Bullet: React.FC<{ delay: number; text: string; color: string; mark: string }> = ({
  delay,
  text,
  color,
  mark,
}) => (
  <Rise delay={delay} y={16}>
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", margin: "10px 0" }}>
      <div
        style={{
          flex: "0 0 auto",
          width: 30,
          height: 30,
          borderRadius: 8,
          background: color,
          color: "#06120e",
          fontWeight: 900,
          fontSize: 22,
          textAlign: "center",
          lineHeight: "30px",
        }}
      >
        {mark}
      </div>
      <div style={{ fontSize: 30, color: C.ink, lineHeight: 1.32 }}>{text}</div>
    </div>
  </Rise>
);

const UnitScene: React.FC<{ unit: Unit; index: number; dur: number }> = ({ unit, index, dur }) => (
  <Wrap dur={dur}>
    <div
      style={{
        width: 1500,
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 24px 70px rgba(0,0,0,.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 34px",
          background: "linear-gradient(180deg,#2f5a27,#1d3f19)",
          borderBottom: `3px solid ${C.acc}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: "#f3fbef" }}>{unit.name}</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#bfe7ab" }}>{unit.count}</div>
        </div>
        <span
          style={{
            background: unit.tagColor,
            padding: "8px 18px",
            borderRadius: 999,
            fontWeight: 800,
            letterSpacing: 1,
            fontSize: 26,
            color: "#06120e",
          }}
        >
          {unit.tag}
        </span>
      </div>

      <div style={{ display: "flex", gap: 26, padding: 30 }}>
        <div style={{ flex: "0 0 420px" }}>
          <div style={{ display: "flex", gap: 14 }}>
            <StatBadge label="QUALITY" value={unit.q} color={C.acc} />
            <StatBadge label="DEFENSE" value={unit.d} color={C.acc2} />
          </div>
          <Rise delay={10}>
            <div
              style={{
                marginTop: 16,
                background: "rgba(226,162,59,.12)",
                border: `1px solid ${C.line}`,
                borderRadius: 14,
                padding: "18px",
              }}
            >
              <div style={{ fontSize: 22, letterSpacing: 1.5, color: C.warn, fontWeight: 800 }}>
                🎲 DICE TO ROLL
              </div>
              <div style={{ fontSize: 28, color: C.ink, marginTop: 8, lineHeight: 1.3 }}>
                {unit.dice}
              </div>
            </div>
          </Rise>
        </div>

        <div style={{ flex: 1 }}>
          <Rise delay={6}>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.acc, letterSpacing: 1, marginBottom: 2 }}>
              ✓ WHEN &amp; HOW TO USE IT
            </div>
          </Rise>
          {unit.use.map((t, i) => (
            <Bullet key={i} delay={14 + i * 6} text={t} color={C.acc} mark="✓" />
          ))}
          <Rise delay={38}>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.danger, letterSpacing: 1, margin: "16px 0 2px" }}>
              ✕ AVOID / KEEP IT AWAY FROM
            </div>
          </Rise>
          {unit.avoid.map((t, i) => (
            <Bullet key={i} delay={44 + i * 6} text={t} color={C.danger} mark="✕" />
          ))}
        </div>
      </div>
    </div>
    <Rise delay={4}>
      <div style={{ marginTop: 18, fontSize: 24, color: C.muted, letterSpacing: 2 }}>
        UNIT {index + 1} / {UNITS.length}
      </div>
    </Rise>
  </Wrap>
);

const Round: React.FC<{ delay: number; n: string; head: string; body: string; color: string }> = ({
  delay,
  n,
  head,
  body,
  color,
}) => (
  <Rise delay={delay} y={20}>
    <div
      style={{
        display: "flex",
        gap: 22,
        alignItems: "center",
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderLeft: `6px solid ${color}`,
        borderRadius: 14,
        padding: "20px 26px",
        margin: "12px 0",
        width: 1400,
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 900, color, flex: "0 0 150px" }}>{n}</div>
      <div>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.ink }}>{head}</div>
        <div style={{ fontSize: 28, color: C.muted, marginTop: 4 }}>{body}</div>
      </div>
    </div>
  </Rise>
);

const StrategyScene: React.FC<{ dur: number }> = ({ dur }) => (
  <Wrap dur={dur}>
    <Rise delay={0}>
      <div style={{ fontSize: 64, fontWeight: 900, color: C.ink, marginBottom: 18 }}>
        THE GAME PLAN
      </div>
    </Rise>
    <Round delay={10} n="R1" head="TAG THE MARKERS" body="Rush out and seize the nearest markers — they stay yours after you leave." color={C.acc2} />
    <Round delay={22} n="R2–3" head="KILL EVERYTHING" body="Drive the monsters into his army — destroy anything that could reach and reclaim your markers." color={C.acc} />
    <Round delay={34} n="R4" head="OWN OUTRIGHT" body="Clear every enemy off the markers you want. Don't settle for a contested tie." color={C.warn} />
    <Round delay={46} n="WIN" head="MOST MARKERS = VICTORY" body="Kill him off the ground and own the count when Round 4 ends." color={C.danger} />
  </Wrap>
);

const OutroScene: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const pulse = 1 + 0.03 * Math.sin((frame / FPS) * 3);
  return (
    <Wrap dur={dur}>
      <div style={{ transform: `scale(${pulse})`, textAlign: "center" }}>
        <div style={{ fontSize: 44, color: C.acc2, letterSpacing: 6, fontWeight: 700 }}>
          REMEMBER
        </div>
        <div style={{ fontSize: 96, fontWeight: 900, color: C.ink, lineHeight: 1.05, marginTop: 10 }}>
          Most markers @ end of
          <br />
          Round 4 = WIN
        </div>
      </div>
      <Rise delay={20} style={{ marginTop: 40 }}>
        <Chip color={C.acc}>BEASTS SOAK · FAST UNITS SCORE · KILL BILL 🐛</Chip>
      </Rise>
    </Wrap>
  );
};

/* ---------- root composition ---------- */
const renderScene = (i: number, dur: number) => {
  if (i === 0) return <TitleScene dur={dur} />;
  if (i === 1) return <BigIdeaScene dur={dur} />;
  if (i === SCENES.length - 2) return <StrategyScene dur={dur} />;
  if (i === SCENES.length - 1) return <OutroScene dur={dur} />;
  return <UnitScene unit={UNITS[i - 2]} index={i - 2} dur={dur} />;
};

export const ArmyGuide: React.FC<Props> = ({ durs, hasAudio }) => {
  let cursor = 0;
  const items = SCENES.map((s, i) => {
    const from = cursor;
    cursor += durs[i];
    return { id: s.id, i, from, dur: durs[i] };
  });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Background />
      {items.map(({ id, i, from, dur }) => (
        <Sequence key={id} from={from} durationInFrames={dur}>
          {hasAudio[i] ? <Audio src={staticFile(audioPath(id))} /> : null}
          {renderScene(i, dur)}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

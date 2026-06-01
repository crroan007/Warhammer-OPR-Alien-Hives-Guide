// Generates ElevenLabs narration MP3s into public/voiceover/.
// Run: node generate-voiceover.mjs   (key comes from guide-video/.env)
import {
  writeFileSync,
  existsSync,
  readFileSync,
  mkdirSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VOICE_ID = "wyWA56cQNU2KqUW4eCsI";

// Narration — keep IDs in sync with src/scenes.ts
const SCENES = [
  { id: "00-title", text: "Welcome to your Alien Hives field guide. The one rule that matters most: you win on objective markers, not on kills." },
  { id: "01-idea", text: "Scoring is the final snapshot. Whoever holds the most markers when round four ends, wins. So grind his army for three rounds, then flood the markers. Your beasts soak the fire while your fast units score." },
  { id: "02-carnivo", text: "The Carnivo-Rex is your hammer. Thirteen attacks shred an infantry blob or a Defense-two vehicle. Just never let it fight a Deadly-three walker alone, and don't let cheap troops tar-pit it." },
  { id: "03-toxico", text: "The Toxico-Rex is your anvil, so lead with it. Regeneration lets it eat the enemy's best guns, and its Bane whip ignores their armour and their healing. Don't hide it; its whole job is to soak fire up front." },
  { id: "04-burrower", text: "The Hive Burrower waits in reserve, then ambushes on round two, dropping next to his scariest gun and charging it. It cripples and pins the crew. Just remember it can't grab a marker the turn it arrives." },
  { id: "05-soulsnatchers", text: "Soul-Snatchers are your scorers and your tank-grinders. They're fast, so hunt his transports and pop them before the troops climb out, then flood the markers. Don't push them out ahead of your monsters." },
  { id: "06-mortar", text: "The Mortar Beast is your anti-horde gun. Park it in the back and never move it. Indirect fire ignores cover and needs no line of sight. This is your answer to a swarm." },
  { id: "07-snatcherlord", text: "The Snatcher Lord guards your home marker and denies his ambush a place to land. Late game, he darts in to contest. Keep him behind a beast, because snipers love a lone hero." },
  { id: "08-strategy", text: "Here's the plan. Rounds one and two: cross the table and soak his fire. Rounds two and three: grind him down. Round four: flood every marker and contest his. Most markers at the end wins." },
  { id: "09-outro", text: "Remember: most markers at the end of round four. Beasts soak, fast units score. Now go kill Bill." },
];

function loadKey() {
  let key = process.env.ELEVENLABS_API_KEY;
  const envPath = join(__dirname, ".env");
  if (!key && existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) key = m[1].replace(/^['"]|['"]$/g, "");
    }
  }
  return key && key.trim();
}

const key = loadKey();
if (!key) {
  console.error(
    "NO_KEY — run setup-elevenlabs-key.ps1 first to write guide-video/.env",
  );
  process.exit(2);
}

const outDir = join(__dirname, "public", "voiceover");
mkdirSync(outDir, { recursive: true });

for (const s of SCENES) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: s.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.25,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`FAIL ${s.id}: HTTP ${res.status} ${body.slice(0, 300)}`);
    process.exit(3);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(outDir, `${s.id}.mp3`), buf);
  console.log(`ok ${s.id}  (${(buf.length / 1024).toFixed(0)} KB)`);
}
console.log("DONE — all 10 narration files written.");

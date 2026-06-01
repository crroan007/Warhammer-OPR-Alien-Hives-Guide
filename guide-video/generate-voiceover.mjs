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
  { id: "00-title", text: "Welcome to your Alien Hives field guide. This army is a tank-and-kill spearhead. You seize the markers early, then you destroy everything that could take them back." },
  { id: "01-idea", text: "Here's what matters. When you tag a marker, it stays yours, even after you leave, until he touches it again. And if you both stand on one, it's only a tie. So don't camp. Seize early, then send your monsters in to kill. Every unit you destroy is one that can't take your ground back." },
  { id: "02-carnivo", text: "The Carnivo-Rex is your hammer. Thirteen attacks shred an infantry blob or a Defense-two vehicle. Throw it straight into his line and kill. Just never let it fight a Deadly-three walker alone." },
  { id: "03-toxico", text: "The Toxico-Rex is your anvil, so lead with it. Regeneration lets it eat his best guns while it carves through his army, and its Bane whip ignores armour and healing. Push it forward; never hide it." },
  { id: "04-burrower", text: "The Hive Burrower waits in reserve, then ambushes on round two, dropping behind his lines to murder a key gun or a fast unit before it can ever reach your markers. Hit what hurts you most." },
  { id: "05-soulsnatchers", text: "Soul-Snatchers are your taggers and tank-grinders. Sprint out, seize a marker, then peel off and kill. Hunt his transports and pop them before the troops climb out. Tag, then go aggressive." },
  { id: "06-mortar", text: "The Mortar Beast is your fire support. Park it in the back and never move it. Indirect fire ignores cover and needs no line of sight, so use it to gun down anything creeping toward your markers." },
  { id: "07-snatcherlord", text: "The Snatcher Lord is your fast flanker. Send him wide to tag a far marker early, then hunt his backfield. Keep him behind cover, because snipers love a lone hero." },
  { id: "08-strategy", text: "The plan. Round one: rush out and tag the markers; they stay yours. Rounds two and three: drive your monsters into his army and kill everything that could take your ground. Round four: clear any enemy off the markers you want, and own them outright. Don't settle for a tie; kill him off it." },
  { id: "09-outro", text: "Seize early, then go aggressive. Kill everything that could take your ground. That is how you win. Now go kill Bill." },
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

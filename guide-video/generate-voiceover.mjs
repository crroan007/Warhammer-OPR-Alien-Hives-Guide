// Generates ElevenLabs narration MP3s into public/voiceover/.
// Run: node generate-voiceover.mjs   (key comes from guide-video/.env)
//
// SINGLE SOURCE OF TRUTH: scene ids/text and the VOICE_ID are imported from
// src/scenes.ts (Node 24 strips the TS types natively). Do NOT re-declare them
// here — that's what previously left the voiceover stale vs the rendered video.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SCENES, VOICE_ID } from "./src/scenes.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

console.log(`Voice ${VOICE_ID} · ${SCENES.length} scenes`);
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
console.log(`DONE — ${SCENES.length} narration files written.`);

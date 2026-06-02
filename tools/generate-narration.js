#!/usr/bin/env node
/* Generate ElevenLabs narration clips from audio/manifest.json.
 * Key comes from env ELEVENLABS_API_KEY (use generate-narration.ps1 so it's never echoed).
 * Usage:
 *   node tools/generate-narration.js --list                 # list your account voices (id + name)
 *   node tools/generate-narration.js --voice <voiceId>      # generate all missing clips
 *   node tools/generate-narration.js --voice <id> --force   # re-render everything
 *   node tools/generate-narration.js --voice <id> --only act_charge   # only ids starting with prefix
 *   node tools/generate-narration.js --dry                  # no API calls; print plan + char/cost estimate
 */
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = path.resolve(__dirname, '..');
const AUDIO = path.join(ROOT, 'audio');
const manifest = JSON.parse(fs.readFileSync(path.join(AUDIO, 'manifest.json'), 'utf8'));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const LIST = flag('--list'), FORCE = flag('--force'), DRY = flag('--dry');
const ONLY = opt('--only');
const VOICE = opt('--voice') || process.env.ELEVEN_VOICE_ID;
const KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
const MODEL = opt('--model') || manifest.model || 'eleven_multilingual_v2';
const VS = manifest.voiceSettings || { stability: 0.4, similarity_boost: 0.85, style: 0.35 };

function req(opts, body) {
  return new Promise((res, rej) => {
    const r = https.request(opts, (x) => {
      const d = [];
      x.on('data', (c) => d.push(c));
      x.on('end', () => {
        const buf = Buffer.concat(d);
        if (x.statusCode >= 200 && x.statusCode < 300) res({ status: x.statusCode, buf });
        else rej(new Error('HTTP ' + x.statusCode + ': ' + buf.toString().slice(0, 300)));
      });
    });
    r.on('error', rej);
    if (body) r.write(body);
    r.end();
  });
}

// Build the full id -> text map: explicit clips + generated number/round/section building blocks.
function buildClips() {
  const out = Object.assign({}, manifest.clips || {});
  const nw = manifest.numWords || [], r = manifest.ranges || {};
  for (let i = 0; i <= (r.num || 0) && i < nw.length; i++) out['num_' + i] = nw[i];
  for (let i = 1; i <= (r.round || 0) && i < nw.length; i++) out['round_' + i] = 'Round ' + nw[i] + '.';
  for (let i = 1; i <= (r.section || 0) && i < nw.length; i++) out['section_' + i] = 'Section ' + nw[i] + '.';
  return out;
}

async function listVoices() {
  const { buf } = await req({ method: 'GET', hostname: 'api.elevenlabs.io', path: '/v1/voices', headers: { 'xi-api-key': KEY } });
  const j = JSON.parse(buf.toString());
  console.log('Your ElevenLabs voices:');
  (j.voices || []).forEach((v) => {
    const labels = v.labels ? Object.values(v.labels).join(', ') : '';
    console.log('  ' + v.voice_id + '  ' + v.name + (labels ? '  [' + labels + ']' : ''));
  });
}

async function ttsOne(id, text) {
  const body = JSON.stringify({ text, model_id: MODEL, voice_settings: VS });
  const { buf } = await req({
    method: 'POST', hostname: 'api.elevenlabs.io',
    path: '/v1/text-to-speech/' + encodeURIComponent(VOICE) + '?output_format=mp3_44100_128',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json', accept: 'audio/mpeg' }
  }, body);
  fs.writeFileSync(path.join(AUDIO, id + '.mp3'), buf);
}

(async () => {
  const clips = buildClips();
  let ids = Object.keys(clips);
  if (ONLY) ids = ids.filter((id) => id.indexOf(ONLY) === 0);

  if (DRY) {
    const chars = ids.reduce((s, id) => s + clips[id].length, 0);
    console.log('Plan: ' + ids.length + ' clips, ' + chars + ' characters total (~$' + (chars / 1000 * 0.30).toFixed(2) + ' at $0.30/1k on a paid tier).');
    ids.slice(0, 8).forEach((id) => console.log('  ' + id + ': ' + JSON.stringify(clips[id])));
    console.log('  ... (' + Math.max(0, ids.length - 8) + ' more)');
    return;
  }
  if (!KEY) { console.error('No API key. Set ELEVENLABS_API_KEY (run generate-narration.ps1, which prompts hidden).'); process.exit(2); }
  if (LIST) { await listVoices(); return; }
  if (!VOICE) { console.error('No voice id. Pass --voice <id> or set ELEVEN_VOICE_ID. Run with --list to see your voices.'); process.exit(2); }

  if (!fs.existsSync(AUDIO)) fs.mkdirSync(AUDIO, { recursive: true });
  let done = 0, skip = 0, fail = 0;
  for (const id of ids) {
    const f = path.join(AUDIO, id + '.mp3');
    if (!FORCE && fs.existsSync(f)) { skip++; continue; }
    try { await ttsOne(id, clips[id]); done++; process.stdout.write('.'); }
    catch (e) { fail++; console.error('\nFAIL ' + id + ': ' + e.message); }
    await new Promise((r) => setTimeout(r, 250)); // be gentle on the API
  }
  console.log('\nDone. generated=' + done + ' skipped=' + skip + ' failed=' + fail + ' total=' + ids.length);
  console.log('Clips are in ' + AUDIO + ' — commit them, then the page will play them.');
})();

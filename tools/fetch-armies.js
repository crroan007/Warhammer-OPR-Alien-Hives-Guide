#!/usr/bin/env node
/* Bake the official Grimdark Future army data from Army Forge into ./data/ so the
 * narrator's in-app army picker can read it same-origin (the AF API has no CORS,
 * so the browser can't fetch it live). Re-run when OPR ships a balance patch.
 *   node tools/fetch-armies.js
 */
const https = require('https'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data'), ADIR = path.join(DATA, 'armies');
function get(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (r) => {
      const d = []; r.on('data', c => d.push(c)); r.on('end', () => res(Buffer.concat(d).toString()));
    }).on('error', rej);
  });
}
function trimUnit(u) {
  return { id: u.id, name: u.name, size: u.size, cost: u.cost, quality: u.quality, defense: u.defense,
    rules: (u.rules || []).map(r => r.name || r.label || r), weapons: u.weapons || [], upgrades: u.upgrades || [] };
}
(async () => {
  if (!fs.existsSync(ADIR)) fs.mkdirSync(ADIR, { recursive: true });
  const idxRaw = await get('https://army-forge.onepagerules.com/api/army-books?filters=official&gameSystemSlug=grimdark-future');
  const idxJson = JSON.parse(idxRaw);
  const list = Array.isArray(idxJson) ? idxJson : (idxJson.armyBooks || idxJson.data || []);
  const index = list.map(b => ({ uid: b.uid, name: b.name, faction: b.factionName || b.factionNameGeneric || '', units: b.unitCount || 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(path.join(DATA, 'armies-index.json'), JSON.stringify(index));
  console.log('index: ' + index.length + ' armies');
  let ok = 0, fail = 0, bytes = 0;
  for (const a of index) {
    try {
      const raw = await get('https://army-forge.onepagerules.com/api/army-books/' + a.uid + '?gameSystem=2');
      const book = JSON.parse(raw);
      const out = { uid: a.uid, name: book.name, faction: a.faction, units: (book.units || []).map(trimUnit) };
      const s = JSON.stringify(out);
      fs.writeFileSync(path.join(ADIR, a.uid + '.json'), s);
      bytes += s.length; ok++; process.stdout.write('.');
    } catch (e) { fail++; console.error('\nFAIL ' + a.name + ': ' + e.message); }
    await new Promise(r => setTimeout(r, 150));
  }
  console.log('\nbaked ' + ok + ' armies, ' + fail + ' failed, ' + (bytes / 1024 / 1024).toFixed(2) + ' MB total in data/armies/');
})();

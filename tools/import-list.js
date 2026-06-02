#!/usr/bin/env node
/* Import an Army Forge shared list (upgrades already applied) into the narrator.
 * The AF API has no CORS, so this runs server-side and bakes data/ai-army.json,
 * which the narrator loads via its "Load Army Forge list" button.
 *   node tools/import-list.js "https://army-forge.onepagerules.com/share?id=XXXX&name=..."
 *   node tools/import-list.js XXXX
 */
const https = require('https'), fs = require('fs'), path = require('path');
const DATA = path.resolve(__dirname, '..', 'data');
const arg = process.argv[2] || '';
const m = arg.match(/[?&]id=([^&]+)/);
const id = m ? m[1] : arg.trim();
if (!id) { console.error('Usage: node tools/import-list.js <army-forge-share-link-or-id>'); process.exit(2); }

function get(p) { return new Promise((res, rej) => { https.get('https://army-forge.onepagerules.com' + p, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (r) => { const d = []; r.on('data', c => d.push(c)); r.on('end', () => res({ status: r.statusCode, body: Buffer.concat(d).toString() })); }).on('error', rej); }); }

// Map an Army Forge unit (with its final post-upgrade loadout) to the narrator's model.
function derive(u, i) {
  const weps = u.loadout || u.weapons || [];
  const ranged = weps.filter(w => (w.range || 0) > 0), melee = weps.filter(w => !(w.range || 0));
  const type = (ranged.length && !melee.length) ? 'shooting' : ((melee.length && !ranged.length) ? 'melee' : 'hybrid');
  const rl = (u.rules || []).map(r => ((r.name || r.label || r) + '').toLowerCase());
  const has = n => rl.some(r => r.indexOf(n) >= 0);
  const flags = { fast: has('fast'), ambush: has('ambush'), scout: has('scout'), artillery: has('artillery'), aircraft: has('aircraft'), counter: has('counter'), caster: has('caster') };
  let pool = (type === 'melee' ? melee : ranged); if (!pool.length) pool = weps;
  let best = null, bn = -1; pool.forEach(w => { const n = (w.count || 1) * (w.attacks || 0); if (n > bn) { bn = n; best = w; } });
  const weapon = {};
  if (best) {
    weapon.a = (best.count || 1) * (best.attacks || 0); weapon.q = u.quality || 4;
    const srs = best.specialRules || []; const sr = n => srs.find(s => (s.name || '').toLowerCase() === n);
    const ap = sr('ap'); weapon.ap = ap ? ap.rating : 0; const bl = sr('blast'); if (bl) weapon.blast = bl.rating;
    weapon.rending = !!sr('rending'); weapon.reliable = !!sr('reliable'); weapon.relentless = !!sr('relentless'); weapon.furious = !!sr('furious'); weapon.surge = !!sr('surge'); weapon.indirect = !!sr('indirect');
  }
  return { name: (u.customName || u.name), type, section: (i % 3) + 1, flags, weapon, cost: u.cost || 0 };
}

(async () => {
  const r = await get('/api/tts?id=' + encodeURIComponent(id));
  if (r.status !== 200) { console.error('fetch failed: HTTP ' + r.status); process.exit(2); }
  let list; try { list = JSON.parse(r.body); } catch (e) { console.error('not JSON (bad id?)'); process.exit(2); }
  const units = (list.units || []).map(derive);
  const out = { name: list.name, points: list.listPoints || units.reduce((s, u) => s + (u.cost || 0), 0), source: id, units };
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(path.join(DATA, 'ai-army.json'), JSON.stringify(out));
  console.log('Imported "' + out.name + '": ' + units.length + ' units, ' + out.points + ' pts -> data/ai-army.json');
  units.forEach(u => console.log('  [sec' + u.section + '] ' + u.name + '  (' + u.type + ', ' + u.cost + 'pts' + (u.weapon && u.weapon.a ? ', A' + u.weapon.a + '/Q' + u.weapon.q + (u.weapon.ap ? '/AP' + u.weapon.ap : '') : '') + ')' + (Object.keys(u.flags).filter(k => u.flags[k]).length ? ' {' + Object.keys(u.flags).filter(k => u.flags[k]).join(',') + '}' : '')));
})();

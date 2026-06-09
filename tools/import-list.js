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
// (usage check moved into the CLI IIFE below so this module can be require()d for tests without exiting)

function get(p) { return new Promise((res, rej) => { https.get('https://army-forge.onepagerules.com' + p, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (r) => { const d = []; r.on('data', c => d.push(c)); r.on('end', () => res({ status: r.statusCode, body: Buffer.concat(d).toString() })); }).on('error', rej); }); }

// Map an Army Forge unit (with its final post-upgrade loadout) to the narrator's model.
function derive(u, i) {
  const weps = u.loadout || u.weapons || [];
  const ranged = weps.filter(w => (w.range || 0) > 0), melee = weps.filter(w => !(w.range || 0));
  const type = (ranged.length && !melee.length) ? 'shooting' : ((melee.length && !ranged.length) ? 'melee' : 'hybrid');
  const rl = (u.rules || []).map(r => ((r.name || r.label || r) + '').toLowerCase());
  const has = n => rl.some(r => r.indexOf(n) >= 0);
  const flags = { fast: has('fast'), ambush: has('ambush'), scout: has('scout'), artillery: has('artillery'), aircraft: has('aircraft'), counter: has('counter'), caster: has('caster') };
  // F7: best-by-(count*attacks) within a pool. Reused for ranged/melee so hybrids capture both.
  const buildWeapon = pool => {
    if (!pool || !pool.length) return null;
    let best = null, bn = -1; pool.forEach(w => { const n = (w.count || 1) * (w.attacks || 0); if (n > bn) { bn = n; best = w; } });
    if (!best) return null;
    const weapon = { a: (best.count || 1) * (best.attacks || 0), q: u.quality || 4 };
    const srs = best.specialRules || []; const sr = n => srs.find(s => (s.name || '').toLowerCase() === n);
    const ap = sr('ap'); weapon.ap = ap ? ap.rating : 0; const bl = sr('blast'); if (bl) weapon.blast = bl.rating;
    weapon.rending = !!sr('rending'); weapon.reliable = !!sr('reliable'); weapon.relentless = !!sr('relentless'); weapon.furious = !!sr('furious'); weapon.surge = !!sr('surge'); weapon.indirect = !!sr('indirect');
    return weapon;
  };
  const wRanged = buildWeapon(ranged), wMelee = buildWeapon(melee);
  // Back-compat: u.weapon stays the single/primary profile (ranged for shooters/hybrids, melee for melee-only).
  let primaryPool = (type === 'melee' ? melee : ranged); if (!primaryPool.length) primaryPool = weps;
  const weapon = buildWeapon(primaryPool) || {};
  const out = { name: (u.customName || u.name), type, section: (i % 3) + 1, flags, weapon, cost: u.cost || 0 };
  // F7 dual-profile contract: ADD weaponMelee ONLY for a true hybrid that has BOTH a ranged and a melee weapon.
  // weapon (above) is the ranged profile for hybrids; weaponMelee is the melee profile. Single-weapon units keep only weapon.
  if (type === 'hybrid' && wRanged && wMelee) { out.weaponMelee = wMelee; }
  return out;
}

// F8: Collapse Army Forge list-instance merges into one activation each.
// AF unit shape (from /api/tts): each entry has selectionId (instance id), name, cost, size,
// combined (bool: BOTH halves of a merged multi-model unit are flagged true), and
// joinToUnit (host unit's selectionId when this entry is a Hero attached to that unit), loadout[].
// Rules: combined units count as ONE unit/ONE activation (AdvancedRules v3.5.1 L126, L130-134);
// a joined hero "counts as part of that unit" and "may never leave its unit" (L398) -> ONE activation.
// The narrator is per-activation (one state.units entry == one activation), so each merge MUST
// collapse to a single entry or the AI gets phantom extra turns and double-counted points/threat.
// JUSTIFICATION for the join choice: we FOLD the hero into its host's single activation (not keep-separate-with-a-tag).
// The narrator has no "activates-with" concept; a separate entry IS a separate activation in eligible()/
// selectActivation, which is exactly the L398 violation. Folding preserves the one-activation invariant.
// We surface the hero in the host's name ("Host + Hero") and add its attacks to the dominant weapon so
// threatOf() (untouched) reflects the buffed swing. Same for a combined pair: sum cost/size, add the twin's attacks.
function totalA(weps) { return (weps || []).reduce((s, w) => s + (w.count || 1) * (w.attacks || 0), 0); }
function bumpAttacks(au, extraA) {
  // Raise the dominant weapon's TOTAL attacks by EXACTLY extraA so derive()'s best-pick + threatOf()
  // see the buffed swing. derive() reads weapon.a as (count*attacks), so we lift the product losslessly:
  // attacks := (count*attacks + extraA) / count. attacks may go fractional, which is fine — nothing
  // downstream reads per-model attacks alone, only the count*attacks product (a clean integer total).
  const weps = au.loadout || au.weapons || [];
  if (!weps.length || extraA <= 0) return;
  let best = weps[0], bn = (best.count || 1) * (best.attacks || 0);
  weps.forEach(w => { const n = (w.count || 1) * (w.attacks || 0); if (n > bn) { bn = n; best = w; } });
  const cnt = best.count || 1;
  best.attacks = (cnt * (best.attacks || 0) + extraA) / cnt;
}
function mergeAF(units) {
  units = units || [];
  const consumed = {}, out = [];
  units.forEach(u => {
    if (consumed[u.selectionId]) return;
    // pair combined halves: same name + combined truthy, not already consumed, a different non-hero instance
    const twin = u.combined ? units.find(v => v !== u && v.combined && v.name === u.name &&
      !consumed[v.selectionId] && !v.joinToUnit) : null;
    let merged = Object.assign({}, u, { loadout: (u.loadout || u.weapons || []).map(w => Object.assign({}, w)) });
    if (twin) {
      consumed[twin.selectionId] = true;
      merged.cost = (u.cost || 0) + (twin.cost || 0);
      merged.size = (u.size || 1) + (twin.size || 1);
      bumpAttacks(merged, totalA(twin.loadout || twin.weapons));
    }
    // fold joined heroes that target THIS host unit
    units.filter(h => h.joinToUnit && h.joinToUnit === u.selectionId).forEach(h => {
      consumed[h.selectionId] = true;
      merged.name = (merged.customName || merged.name) + ' + ' + (h.customName || h.name);
      merged.cost = (merged.cost || 0) + (h.cost || 0);
      merged.size = (merged.size || 1) + (h.size || 1);
      bumpAttacks(merged, totalA(h.loadout || h.weapons));
    });
    out.push(merged);
  });
  return out;
}

// Export the pure transforms for unit tests; the network IIFE only runs when invoked directly.
module.exports = { derive, mergeAF, totalA };

if (require.main === module) (async () => {
  if (!id) { console.error('Usage: node tools/import-list.js <army-forge-share-link-or-id>'); process.exit(2); }
  const r = await get('/api/tts?id=' + encodeURIComponent(id));
  if (r.status !== 200) { console.error('fetch failed: HTTP ' + r.status); process.exit(2); }
  let list; try { list = JSON.parse(r.body); } catch (e) { console.error('not JSON (bad id?)'); process.exit(2); }
  const units = mergeAF(list.units).map(derive);
  const out = { name: list.name, points: list.listPoints || units.reduce((s, u) => s + (u.cost || 0), 0), source: id, units };
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(path.join(DATA, 'ai-army.json'), JSON.stringify(out));
  console.log('Imported "' + out.name + '": ' + units.length + ' units, ' + out.points + ' pts -> data/ai-army.json');
  units.forEach(u => console.log('  [sec' + u.section + '] ' + u.name + '  (' + u.type + ', ' + u.cost + 'pts' + (u.weapon && u.weapon.a ? ', A' + u.weapon.a + '/Q' + u.weapon.q + (u.weapon.ap ? '/AP' + u.weapon.ap : '') : '') + ')' + (Object.keys(u.flags).filter(k => u.flags[k]).length ? ' {' + Object.keys(u.flags).filter(k => u.flags[k]).join(',') + '}' : '')));
})();

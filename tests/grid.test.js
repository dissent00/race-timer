// Tap grid helpers: range expansion, tile filtering and tile ordering.
// Pulls the shipped function source out of index.html. Run: node tests/grid.test.js
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

function grab(name) {
  const start = script.indexOf('function ' + name + '(');
  if (start < 0) { throw new Error('missing function ' + name); }
  let i = script.indexOf('{', start), depth = 0;
  for (; i < script.length; i++) {
    if (script[i] === '{') { depth++; }
    if (script[i] === '}') { depth--; if (depth === 0) { break; } }
  }
  return script.slice(start, i + 1);
}
const names = ['expandRanges', 'filterTiles', 'orderTiles'];
const fns = new Function(names.map(grab).join('\n') + '; return { ' + names.join(', ') + ' };')();

let fail = 0, total = 0;
function eq(label, got, want) {
  total++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fail++; console.log('FAIL', label, '\n  got ', g, '\n  want', w); }
}

// ---- expandRanges
eq('range span', fns.expandRanges('1-5', 100), [1, 2, 3, 4, 5]);
eq('range list', fns.expandRanges('1-3, 9, 20-21', 100), [1, 2, 3, 9, 20, 21]);
eq('range unique and sorted', fns.expandRanges('5, 1-3, 2-4', 100), [1, 2, 3, 4, 5]);
eq('range en dash', fns.expandRanges('1–3', 100), [1, 2, 3]);
eq('range spaces', fns.expandRanges(' 1 - 3 ,7 ', 100), [1, 2, 3, 7]);
eq('range reversed ignored', fns.expandRanges('5-1', 100), []);
eq('range junk ignored', fns.expandRanges('abc, 4, x-9', 100), [4]);
eq('range zero ignored', fns.expandRanges('0, 0-2', 100), [1, 2]);
eq('range over 9999 ignored', fns.expandRanges('9998-10001', 100), [9998, 9999]);
eq('range empty', fns.expandRanges('', 100), []);
eq('range null', fns.expandRanges(null, 100), []);
eq('range cap', fns.expandRanges('1-100', 10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
eq('range cap across parts', fns.expandRanges('1-5, 20-30', 7), [1, 2, 3, 4, 5, 20, 21]);
eq('range huge span stays capped', fns.expandRanges('1-9999', 25).length, 25);

// ---- filterTiles
const tiles = [
  { bib: '7', name: 'Ana Diaz' }, { bib: '37', name: 'Bo Chen' }, { bib: '105', name: 'Cy Ana' },
  { bib: '12', name: '' }, { bib: '70', name: 'Di Roe' },
];
eq('filter empty returns all', fns.filterTiles(tiles, '').length, 5);
eq('filter blank spaces returns all', fns.filterTiles(tiles, '   ').length, 5);
eq('filter digits are a bib prefix', fns.filterTiles(tiles, '7').map((t) => t.bib), ['7', '70']);
eq('filter digits also match names', fns.filterTiles([{ bib: '9', name: 'Agent 7' }], '7').length, 1);
eq('filter name case-insensitive', fns.filterTiles(tiles, 'ANA').map((t) => t.bib), ['7', '105']);
eq('filter name substring', fns.filterTiles(tiles, 'hen').map((t) => t.bib), ['37']);
eq('filter no match', fns.filterTiles(tiles, 'zzz'), []);
eq('filter does not mutate', tiles.length, 5);

// ---- orderTiles
const raceOf = (bib) => ({ '7': 'A', '37': 'B', '105': 'A', '70': null }[bib] || null);
const bibs = (arr) => arr.map((t) => t.bib);
eq('order by bib numeric', bibs(fns.orderTiles(tiles, 'bib', null, raceOf)), ['7', '12', '37', '70', '105']);
eq('order by name, empty last', bibs(fns.orderTiles(tiles, 'name', null, raceOf)), ['7', '37', '105', '70', '12']);
eq('order active race first, then unknown, then other', bibs(fns.orderTiles(tiles, 'bib', 'A', raceOf)), ['7', '105', '12', '70', '37']);
eq('order does not mutate', bibs(tiles), ['7', '37', '105', '12', '70']);
eq('order name ties fall back to bib', bibs(fns.orderTiles([{ bib: '9', name: 'Sam' }, { bib: '3', name: 'Sam' }], 'name', null, raceOf)), ['3', '9']);

console.log(fail ? fail + ' of ' + total + ' FAILED' : 'all ' + total + ' grid tests passed');
process.exit(fail ? 1 : 0);

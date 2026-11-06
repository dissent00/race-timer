// Pure-function checks. Pulls the function source out of index.html so the test runs the
// shipped code, not a copy. Run: node tests/pure.test.js
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

function grab(name) {
  const start = script.indexOf('function ' + name + '(');
  if (start < 0) { throw new Error('missing ' + name); }
  let i = script.indexOf('{', start), depth = 0;
  for (; i < script.length; i++) {
    if (script[i] === '{') { depth++; }
    if (script[i] === '}') { depth--; if (depth === 0) { break; } }
  }
  return script.slice(start, i + 1);
}
const names = ['pad2', 'fmt', 'csvCell', 'inRange', 'parseAgo'];
const fns = new Function(names.map(grab).join('\n') + '; return { ' + names.join(', ') + ' };')();

let fail = 0;
function eq(label, got, want) {
  if (got !== want) { fail++; console.log('FAIL', label, 'got', JSON.stringify(got), 'want', JSON.stringify(want)); }
}

// fmt: sweep against an independent computation (integer ms, floor to the tenth).
const ref = (ms, tenths) => {
  const totalTenths = Math.floor(ms / 100);
  const s = Math.floor(totalTenths / 10);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return `${h}:${p(m)}:${p(sec)}` + (tenths ? '.' + (totalTenths % 10) : '');
};
let n = 0;
for (let ms = 0; ms < 6 * 3600 * 1000; ms += 37) {
  for (const t of [true, false]) { n++; const g = fns.fmt(ms, t); const w = ref(ms, t); if (g !== w) { eq('fmt ' + ms + ' ' + t, g, w); if (fail > 10) { process.exit(1); } } }
}
for (const ms of [0, 99, 100, 999, 1000, 59999, 60000, 3599999, 3600000, 3600100]) { eq('fmt edge ' + ms, fns.fmt(ms, true), ref(ms, true)); }
eq('fmt negative clamps', fns.fmt(-5000, true), '0:00:00.0');
console.log('fmt swept', n, 'values');

// csvCell
eq('csv plain', fns.csvCell('10 miles'), '10 miles');
eq('csv comma', fns.csvCell('Kids, 1 mile'), '"Kids, 1 mile"');
eq('csv quote', fns.csvCell('The "Big" one'), '"The ""Big"" one"');
eq('csv newline', fns.csvCell('a\nb'), '"a\nb"');
eq('csv null', fns.csvCell(null), '');

// inRange
eq('range single', fns.inRange('37', '37'), true);
eq('range single miss', fns.inRange('37', '38'), false);
eq('range span', fns.inRange('1-50', '50'), true);
eq('range span low', fns.inRange('1-50', '1'), true);
eq('range span out', fns.inRange('1-50', '51'), false);
eq('range list', fns.inRange('1-50, 61', '61'), true);
eq('range spaces', fns.inRange(' 1 - 50 ,61 ', '25'), true);
eq('range en dash', fns.inRange('1–50', '25'), true);
eq('range reversed span matches nothing', fns.inRange('50-1', '25'), false);
eq('range empty', fns.inRange('', '5'), false);
eq('range junk', fns.inRange('abc', '5'), false);
eq('range trailing comma', fns.inRange('1-5,', '3'), true);

// parseAgo
eq('ago minutes', fns.parseAgo('12'), 12 * 60000);
eq('ago m:ss', fns.parseAgo('12:30'), 750000);
eq('ago h:mm:ss', fns.parseAgo('1:02:03'), 3723000);
eq('ago blank', fns.parseAgo(''), null);
eq('ago junk', fns.parseAgo('x'), null);
eq('ago too many', fns.parseAgo('1:2:3:4'), null);
eq('ago negative', fns.parseAgo('-5'), null);
eq('ago decimal', fns.parseAgo('1.5'), null);
eq('ago seconds over 59 rejected', fns.parseAgo('1:99'), null);
eq('ago minutes over 59 rejected in h:mm:ss', fns.parseAgo('1:75:00'), null);

console.log(fail ? fail + ' FAILED' : 'all pure tests passed');
process.exit(fail ? 1 : 0);

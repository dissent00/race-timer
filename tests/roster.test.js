// Roster import: CSV parsing, roster rules, and how a roster survives sanitize and salvage.
// Pulls the shipped function source out of index.html. Run: node tests/roster.test.js
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
const names = ['newId', 'cleanTime', 'cleanStr', 'mkRace', 'blankEvent', 'parseCsv', 'parseRoster', 'sanitize', 'salvage'];
const fns = new Function('var MAX_RACES = 6, ROSTER_MAX = 5000;\n' + names.map(grab).join('\n') + '; return { ' + names.join(', ') + ' };')();

let fail = 0, total = 0;
function eq(label, got, want) {
  total++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fail++; console.log('FAIL', label, '\n  got ', g, '\n  want', w); }
}
const races = [{ id: 'r1', name: '10 miles' }, { id: 'r2', name: 'Kids, 1 mile' }, { id: 'r3', name: '5K' }];
const ro = (text, max) => fns.parseRoster(text, races, max || 5000);

// ---- parseCsv
eq('csv simple', fns.parseCsv('a,b,c\n1,2,3'), [['a', 'b', 'c'], ['1', '2', '3']]);
eq('csv quoted comma', fns.parseCsv('1,"Diaz, Ana"'), [['1', 'Diaz, Ana']]);
eq('csv escaped quote', fns.parseCsv('1,"The ""Flash"""'), [['1', 'The "Flash"']]);
eq('csv embedded newline', fns.parseCsv('1,"a\nb"\n2,c'), [['1', 'a\nb'], ['2', 'c']]);
eq('csv CRLF', fns.parseCsv('1,a\r\n2,b\r\n'), [['1', 'a'], ['2', 'b']]);
eq('csv CR only', fns.parseCsv('1,a\r2,b'), [['1', 'a'], ['2', 'b']]);
eq('csv BOM', fns.parseCsv('﻿bib,name\n1,a'), [['bib', 'name'], ['1', 'a']]);
eq('csv blank lines skipped', fns.parseCsv('1,a\n\n\n2,b\n'), [['1', 'a'], ['2', 'b']]);
eq('csv empty fields kept', fns.parseCsv('1,,x'), [['1', '', 'x']]);
eq('csv semicolon', fns.parseCsv('bib;name\n1;Ana'), [['bib', 'name'], ['1', 'Ana']]);
eq('csv tab', fns.parseCsv('bib\tname\n1\tAna'), [['bib', 'name'], ['1', 'Ana']]);
eq('csv semicolon inside quoted comma file', fns.parseCsv('1,"a;b"'), [['1', 'a;b']]);
eq('csv empty', fns.parseCsv(''), []);
eq('csv only blanks', fns.parseCsv('\n\r\n  \n'), []);
eq('csv unterminated quote keeps text', fns.parseCsv('1,"abc'), [['1', 'abc']]);

// ---- parseRoster basics
let r = ro('bib,name\n37,Ana Diaz\n105,Bo Chen');
eq('roster header rows', r.rows, [{ bib: '37', name: 'Ana Diaz', race: null }, { bib: '105', name: 'Bo Chen', race: null }]);
eq('roster header no rejects', [r.rejected.length, r.duplicates, r.unmatchedRaces, r.capped], [0, 0, 0, false]);
r = ro('37,Ana Diaz\n105,Bo Chen');
eq('roster no header', r.rows.length, 2);
eq('roster no header first row kept', r.rows[0].bib, '37');
r = ro('Name,Bib\nAna Diaz,37');
eq('roster header order swapped', r.rows, [{ bib: '37', name: 'Ana Diaz', race: null }]);
r = ro('Number,Runner\n7,Cy');
eq('roster header synonyms', r.rows, [{ bib: '7', name: 'Cy', race: null }]);
r = ro('First name,Last name,Bib\nAna,Diaz,37');
eq('roster first+last', r.rows, [{ bib: '37', name: 'Ana Diaz', race: null }]);
r = ro('bib,name\n');
eq('roster header only', [r.rows.length, r.rejected.length], [0, 0]);
eq('roster empty text', ro('').rows, []);

// ---- bib rules
r = ro('#37,Ana');
eq('bib hash prefix', r.rows[0].bib, '37');
r = ro('007,Ana');
eq('bib leading zeros', r.rows[0].bib, '7');
r = ro('0,Zero\n12345,Big\nabc,Letters\n,Blank\n-5,Neg\n3.5,Dec');
eq('bib rejects', [r.rows.length, r.rejected.length], [0, 6]);
eq('bib reject reasons present', r.rejected.every((x) => typeof x.reason === 'string' && x.reason.length > 0 && Number.isInteger(x.line)), true);
r = ro('9999,Max');
eq('bib 4 digits ok', r.rows[0].bib, '9999');
r = ro('37,Ana\n37,Other\n38,Bo');
eq('duplicate keeps first', [r.rows.map((x) => x.name), r.duplicates], [['Ana', 'Bo'], 1]);
r = ro('007,Ana\n7,Other');
eq('duplicate after normalising', [r.rows.length, r.duplicates], [1, 1]);

// ---- names
r = ro('1,  Ana   Maria\t Diaz  ');
eq('name whitespace collapsed', r.rows[0].name, 'Ana Maria Diaz');
r = ro('1');
eq('bib only row ok', r.rows, [{ bib: '1', name: '', race: null }]);
r = ro('1,' + 'x'.repeat(100));
eq('long name truncated to 60', r.rows[0].name.length, 60);
r = ro('1,"Zoë O\'Brien-Núñez"');
eq('unicode kept', r.rows[0].name, "Zoë O'Brien-Núñez");
r = ro('1,<b>x</b> & "q"');
eq('html chars kept as text', r.rows[0].name, '<b>x</b> & "q"');

// ---- race column
r = ro('bib,name,race\n1,Ana,10 MILES\n2,Bo,"kids, 1 mile"\n3,Cy,5k\n4,Di,Marathon\n5,Ed,');
eq('race matched case-insensitively', r.rows.map((x) => x.race), ['r1', 'r2', 'r3', null, null]);
eq('race unmatched counted', r.unmatchedRaces, 1);
r = ro('1,Ana,5K');
eq('race column without header', r.rows[0].race, 'r3');
r = ro('bib,name,distance\n1,Ana,5K');
eq('race header synonym', r.rows[0].race, 'r3');

// ---- cap
const big = Array.from({ length: 30 }, (_, i) => (i + 1) + ',N' + (i + 1)).join('\n');
r = ro(big, 25);
eq('cap rows', [r.rows.length, r.capped], [25, true]);
r = ro(big, 30);
eq('at cap not capped', [r.rows.length, r.capped], [30, false]);

// ---- sanitize with a roster
const base = { epoch: 'e', name: 'T', races: [{ id: 'r1', name: 'A', range: '', start: null }], active: 'r1', entries: [], deleted: [] };
let s = fns.sanitize(base);
eq('sanitize old event without roster', [s.ok, s.state.roster], [true, []]);
s = fns.sanitize({ ...base, roster: [{ bib: '37', name: 'Ana', race: 'r1' }, { bib: '38', name: 'Bo', race: 'gone' }, { bib: 'x', name: 'Bad', race: null }, null, { bib: '37', name: 'Dup', race: null }, { bib: '40', name: 5, race: null }] });
eq('sanitize roster', s.state.roster, [{ bib: '37', name: 'Ana', race: 'r1' }, { bib: '38', name: 'Bo', race: null }, { bib: '40', name: '', race: null }]);
s = fns.sanitize({ ...base, roster: 'nope' });
eq('sanitize non-array roster', s.state.roster, []);
s = fns.sanitize({ ...base, roster: Array.from({ length: 6000 }, (_, i) => ({ bib: String((i % 9999) + 1), name: 'n', race: null })) });
eq('sanitize roster capped', s.state.roster.length <= 5000, true);
s = fns.sanitize({ ...base, roster: [{ bib: '1', name: 'x'.repeat(200), race: null }] });
eq('sanitize name length', s.state.roster[0].name.length, 60);
s = fns.sanitize({ ...base, entries: [{ id: 'a', t: 1, bib: '37', race: 'r1' }], roster: [{ bib: '37', name: 'Ana', race: null }] });
eq('sanitize keeps entries beside roster', s.state.entries.length, 1);

// ---- gridRange survives sanitize, defaults to empty, and is length-capped
s = fns.sanitize({ ...base, gridRange: '1-50, 61' });
eq('sanitize gridRange kept', s.state.gridRange, '1-50, 61');
s = fns.sanitize(base);
eq('sanitize gridRange default', s.state.gridRange, '');
s = fns.sanitize({ ...base, gridRange: 12 });
eq('sanitize gridRange non-string', s.state.gridRange, '');
s = fns.sanitize({ ...base, gridRange: 'x'.repeat(200) });
eq('sanitize gridRange capped', s.state.gridRange.length, 80);

// ---- salvage keeps roster names, including quotes and backslashes, from a cut-off write
const ev = { epoch: 'e', name: 'Cut', races: [{ id: 'r1', name: 'A', range: '', start: null }], active: 'r1',
  entries: [{ id: 'a', t: 1, bib: '1', race: 'r1' }, { id: 'b', t: 2, bib: '2', race: 'r1' }], deleted: [],
  roster: [{ bib: '1', name: 'Ana "AJ" Diaz', race: null }, { bib: '2', name: 'Back\\slash', race: 'r1' }, { bib: '3', name: 'Last', race: null }] };
const raw = JSON.stringify(ev);
const cut = raw.slice(0, raw.length - 30);
const sv = fns.salvage(cut);
eq('salvage entries', sv.entries.length, 2);
eq('salvage roster names', sv.roster.slice(0, 2).map((x) => x.name), ['Ana "AJ" Diaz', 'Back\\slash']);
eq('salvage roster through sanitize', fns.sanitize(sv).state.roster.length >= 2, true);

console.log(fail ? fail + ' of ' + total + ' FAILED' : 'all ' + total + ' roster tests passed');
process.exit(fail ? 1 : 0);

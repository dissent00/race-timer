# Race Finish Timer

Finish-line timing for small races. Press START at the gun, then type each runner's bib number and press Record. The time is stamped when you press the button.

One static page. No server, no account, no upload: everything stays in the browser's own storage. Works offline once loaded, and installs to a phone's home screen.

## Use

- Up to 6 races per event, each with its own gun time. Races are named in "Races, gun times and bib ranges".
- Press START on a race card at the gun, or set the gun time afterwards as a clock time or as "how long ago". Finishers already recorded re-time themselves.
- Optional bib ranges (`1-50, 61`) pick the race for a bib. Otherwise the highlighted race card is used.
- Mark Time stamps a finisher you cannot name yet; add the number later from the log.
- Keys: `0-9` bib, `Enter` record, `Space` mark time, `Backspace` / `Esc` fix or clear, `A`-`F` pick race.
- Roster (optional): import a CSV of `bib,name[,race]` (header row detected; first and last name columns are joined). Recorded bibs then show the runner's name, a bib not on the roster is flagged, and a race name that matches picks the race for the bib. Preview shows duplicates and rejected rows before anything is replaced; the previous roster can be brought back. The roster belongs to its event.
- Several events can live in one browser. Each keeps its own races, gun times and finishers.
- Export: copy or download CSV (columns `place,bib,name,race,elapsed,wall_clock,gun_clock`; wall-clock times let any time be recomputed), download a JSON backup. Restoring a backup creates a new event; it never overwrites one.

## Data and failure behavior

- Saved under `raceFinishTimer:*` in `localStorage`. Browsers can clear site data, so download a backup after each event.
- A failed save shows a red bar. Damaged saved data is recovered entry by entry, and a raw copy is kept.
- Two tabs on the same event merge instead of overwriting each other.
- Clear and recover: Start over keeps the previous log until the next clear.
- A system clock jump of more than 1.5 s shows a warning. Times come from the device clock, so keep automatic time on.

Results are hand-timed. Accuracy depends on whoever presses the button.

## Host it

Any static host works. For GitHub Pages: Settings, Pages, deploy from the `main` branch root. The service worker needs HTTPS (or localhost).

`sw.js` is network-first, so a reload online picks up a new version. Bump `VERSION` in `index.html` and `CACHE` in `sw.js` together on every change.

## Test

```
node tests/pure.test.js
node tests/roster.test.js
```

Sweeps the time formatting against an independent calculation and checks bib ranges, the "ago" parser and CSV quoting. `roster.test.js` covers the CSV parser, roster rules, and how a roster survives sanitize and salvage after a cut-off write. The page-level behavior (failed saves, damaged data, two tabs, restore, events, offline reload) was exercised by hand in a browser; there is no automated browser suite.

Not tested on a physical phone: screen lock behavior and the Copy CSV clipboard button.

## Licence

MIT. See `LICENSE`. No third-party code or fonts are included; the page uses the system font stack.

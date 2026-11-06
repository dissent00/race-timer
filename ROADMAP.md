# Roadmap

Next items, in order. Each lists what it must do, the data it touches, and what to test.

## 1. Roster import: bib and name

Load a CSV of bib, name (optional race) so a recorded bib shows the runner's name.

- Import: `bib,name[,race]` with or without a header row. Handle quoted commas, a UTF-8 BOM, CRLF, blank lines.
- Stored per event as `roster: [{bib, name, race?}]`. Part of the event backup and its sanitizer.
- A bib listed twice keeps the first row and reports the duplicates. Bibs over four digits are rejected, as the keypad takes four.
- If `race` matches a race name, it picks the race for that bib, ahead of the bib ranges.
- Import never edits or deletes recorded finishers. Re-importing replaces the roster only, after a one-level undo like Clear.
- Show the name in the entry panel as soon as digits match a roster bib ("#37 Ana Diaz"), in the log rows, in results, and as a `name` column in the CSV export.
- A bib that is not on the roster is recorded as normal and flagged "not on roster".
- Names stay in the browser, like everything else. The footer says so, and the export is the only way names leave.

Test: CSV parser against awkward files; roster merge into sanitize and restore; names escaped in CSV and rendered with `textContent`; a damaged saved event still recovers its entries when the roster part is unreadable.

## 2. Tap-to-record view

A second entry mode: a grid of runners, one tile each, tap the tile as the runner crosses.

- Works with a roster (tile shows bib and name) and without one (bib tiles only, built from the bib ranges or a typed range).
- The tap stamps the time at the press, the same as Record. A recorded tile greys out and shows its time; tapping it again asks before it records a second finish, since it is a duplicate.
- Filter box and sort by bib or name. Tiles for the selected race first when races have bib ranges.
- Switchable with the keypad view without losing state. Both write the same entries, so the log, results and export do not change.
- Large grids (a few hundred tiles) must stay responsive on a phone.

Test: tap accuracy (timestamp taken in the handler, before any render); duplicate-tap guard; modes interleaved in one event; 500 tiles.

## Open questions

- Should a roster tile also let you "mark time, name later"? Probably the same Mark button.
- One roster per event, or shared across events at the same race?
- Does the tap view need a "recently finished" strip so a mis-tap is easy to undo?

## Not yet verified

- Screen lock behavior and the Copy CSV button on a physical phone.
- Merge on save when a second tab misses the storage event.
- A browser test suite. The page-level behavior was exercised by hand.

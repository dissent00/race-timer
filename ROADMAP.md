# Roadmap

## Decisions

- Mark Time works from the tap grid, for several finishers at once.
- The roster is per event and stored with that event. It is not permanent and not shared between events.
- The tap view has a "recently finished" strip so a mis-tap can be undone.

## Done

### 2.1: roster import (bib and name)

- CSV import of `bib,name[,race]` from a file or pasted text. Comma, semicolon or tab; BOM, CRLF, quoted fields; header row detected, first and last name columns joined.
- A preview reports the runner count, repeated bibs (first kept), rows rejected with the reason, and race names that did not match. Nothing changes until "Use this roster".
- Replace, clear and "bring back previous roster" (one level). Importing never touches recorded finishers.
- A matching race column picks the race for a bib ahead of bib ranges.
- The name shows as digits are typed, in the log, in results, and in the CSV export (`name` column). A bib not on the roster still records and is flagged.
- Part of the event backup and of damaged-data recovery. Up to 5000 runners per event.

## Next: tap-to-record view

A second entry mode: a grid of runners, one tile each, tap the tile as the runner crosses.

- Works with a roster (tile shows bib and name) and without one (bib tiles from the bib ranges or a typed range).
- The tap stamps the time in the handler, before any redraw, the same as Record. A recorded tile greys out and shows its time; tapping it again asks before it records a second finish.
- Mark Time button on the grid.
- A "recently finished" strip with a one-tap undo for each entry.
- Filter box and sort by bib or name. Tiles for the selected race first when races have bib ranges.
- Switchable with the keypad view without losing state. Both write the same entries, so the log, results and export do not change.
- A few hundred tiles must stay responsive on a phone.

Test: timestamp taken before render; duplicate-tap guard; modes interleaved in one event; 500 tiles.

## Not yet verified

- Screen lock behavior and the Copy CSV button on a physical phone.
- Merge on save when a second tab misses the storage event. The roster is not merged between tabs; the last write wins if the sync event is missed.
- A browser test suite. The page-level behavior was exercised by hand.
- CSV export writes names as given. A name starting with `=`, `+`, `-` or `@` can be read as a formula by a spreadsheet.

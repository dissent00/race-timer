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

### 2.2: tap-to-record grid

- Keypad / Tap grid switch; the choice is remembered on the device. Both views write the same entries, so the log, results and export do not change.
- Tiles from the roster (bib and name), or from the race bib ranges plus a typed range when there is no roster. Up to 1000 tiles are drawn; the filter reaches the rest.
- Find by bib (prefix) or name; sort by bib or name; with several races the highlighted race's tiles come first, then tiles with no known race.
- The tap stamps the time in the handler before any redraw. A recorded tile greys out with its time and a count; tapping it again asks ("Again?") for four seconds before it records a second finish.
- Mark Time from the grid. "Name it" on a marked entry in Recently finished arms the next tile tap to name that mark instead of recording a new finish.
- Recently finished: the last six entries, each with a one-tap Undo.
- Digit, Enter and Backspace keys only act in the keypad view; Space (mark) and A-F (race) work in both.

## Later

- Pointer-down timestamps for the grid (about 50-100 ms earlier than the click). Hand timing is coarser than that, so it is not planned.
- Grid tiles for bibs recorded but not on the list.

## Not yet verified

- Screen lock behavior and the Copy CSV button on a physical phone.
- Merge on save when a second tab misses the storage event. The roster is not merged between tabs; the last write wins if the sync event is missed.
- A browser test suite. The page-level behavior was exercised by hand.
- CSV export writes names as given. A name starting with `=`, `+`, `-` or `@` can be read as a formula by a spreadsheet.

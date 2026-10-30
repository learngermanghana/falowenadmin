# A2 classroom speaking slides

Every A2 lesson contains one clearly named **Common mistakes · Häufige Fehler** slide and one **Presentation · Teil 1 Sprechen** slide before the workbook handover. Corrections retain their existing individual answer reveals. The presentation shows the existing workbook question and speaking points; sentence starters open individually. It creates no recording, submission, score or runtime translation request.

Day 8 preserves the workbook's restaurant role-play and its five steps rather than showing the unused cooking mind map. Day 22's current workbook is a speaking mock: its slide lets the teacher choose a question from the same A2 Teil 2 pool (Von sich erzählen). This classroom choice does not select or alter any learner's graded mock task.

The snapshot in `src/data/a2WorkbookPresentations.js` records its source paths and student repository commit. Refresh or verify it against a checked-out student repository:

```sh
node scripts/syncA2WorkbookPresentations.mjs /path/to/falowenexamtrainer
node scripts/syncA2WorkbookPresentations.mjs /path/to/falowenexamtrainer --check
```

Responsive cards use two columns on wide screens and one on narrow screens, with wrapping text and the presenter's existing scrolling. Real-presenter DOM tests navigate all 28 A2 lessons, open corrections and sentence starters, change the Day 22 question, and verify navigation resets. These tests do not measure pixel layout. B1 is unchanged.

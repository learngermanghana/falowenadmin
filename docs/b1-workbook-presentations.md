# B1 workbook presentation slides

All 28 B1 lessons contain one saved workbook speaking task before the workbook handover. B1 has its own renderer, separate from A2's short speaking points:

- **Aufgabe** shows the existing question, instructions and workbook preparation time.
- **Gliederung** shows the workbook's live B1 outline. Standardized presentation lessons retain topic, advantages with examples, disadvantages with examples, home-country situation, opinion and conclusion. Custom speaking and role-play outlines are preserved.
- **Ideen & Redemittel** opens the existing idea bank and useful phrases individually, where available.

Day 5 retains the apartment-viewing role-play and four-question requirement. Day 23 uses the current speaking mock's B1 Teil 2 topic pool for ungraded classroom practice. The selection does not modify a learner's graded mock task. The existing Common mistakes slide is clearly named. A2 remains unchanged.

The snapshot includes the source commit and workbook paths. Its generator follows the current `CourseLessonPage` B1 route map, captures the speaking content from real page props or preserved JSX, and reads the live `b1SpeakingStructureRuntime` outline. Media, submission and account widgets are excluded during extraction; their content is not needed by the slide.

```sh
node scripts/syncB1WorkbookPresentations.mjs /path/to/falowenexamtrainer
node scripts/syncB1WorkbookPresentations.mjs /path/to/falowenexamtrainer --check
```

The presenter makes no runtime request for the saved tasks and adds no recording, submission or grading action. Tabs wrap on smaller screens and the support panel scrolls within a bounded height. Real-presenter DOM tests cover all B1 tasks, tab/keyboard controls, optional reveals, mock topic selection and navigation reset. They do not measure pixel layout.

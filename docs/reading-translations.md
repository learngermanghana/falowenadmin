# A2 and B1 reading translations

All 28 A2 and 28 B1 lesson readings have saved English meanings for their five German sentences (280 pairs). In the reading presenter, click a sentence number, then Translate. Only that sentence's English appears. While English is open, selecting another number replaces the meaning; Hide translation closes it. Navigating away clears the selection and English, including when returning to the reading.

Translations are bundled in `src/data/presenterReadingTranslations.js`; no translation API is called during teaching. Lookup requires the assignment, reading section and exact German sentence. If German changes, update its saved translation; the coverage test catches missing pairs and the UI never substitutes an old meaning.

The translation sits below the reading in normal document flow. Controls wrap, reading typography adapts to screen height, and the English panel has bounded scrolling. Opening or changing the meaning remeasures presenter fit. DOM tests exercise the real presenter on every A2/B1 reading; they do not measure rendered pixel layout.

Validation: run the reading-translations GitHub workflow's Node tests and `npm run build`.

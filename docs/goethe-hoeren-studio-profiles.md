# Goethe-style Hören profiles in Falowen Admin AI Studio

Owner-only page: https://admin.falowen.app/ai-studio

## Separate editor workflows

The AI Studio now has two visible modes. **Course Book Audio** supports flexible listening lessons at A1–C2 with an editable recording type, topic and Richtig/Falsch or multiple-choice question format. An existing lesson can be selected at the start of the workflow; teacher-approved five-question A1–B1 lessons still use the existing publishing endpoint. Course Book audio can also be created and downloaded without questions, but direct publication still requires five verified questions.

**Goethe Exam Audio** supports the A2–C2 level/Teil presets below. The selected task locks the recording structure, exact question kind and count, and one/two-playback default. Its question-format selector is completely hidden: only the question content and answer key remain editable for teacher review. Goethe exercises export locally and are never sent to the Course Book publishing endpoint.

A pre-audio checker validates transcript notation, segment and question counts, literal supporting evidence, and C1 Teil 1's shared Buch 1/2/3 answer options. Warnings flag unusual word counts or speakers. These are structural checks, **not** automatic guarantees that the listening answers are semantically correct. A teacher must check correctness.

The sentence editor can change one speaker's line without discarding other voice clips. Successful clips are cached in the current browser session under voice model + speaker + exact text. Only missing clips call Google's TTS API; rearranging or remixing unchanged clips is free of further synthesis requests. Reloading or closing the page discards this ephemeral cache.

## Selection

Choose **A2, B1, B2 or C1**, then **Hören Teil 1–4**. Choose **C2**, then **Hören Aufgabe 1–3** (Goethe C2 uses *Aufgabe*, not *Teil*, in its listening model exam). A1 remains available under the Course Book Audio workflow.

The profile changes:
- Recording structure (podcast, interview, lecture, announcements, discussion, etc.).
- Script prompt, CEFR target, spoken word target, and preview scaffold.
- Question format and number of questions.
- One or two complete playbacks (mixed locally; no extra TTS requests).
- Recommended quiet studio soundscape to avoid intrusive atmosphere.

**C1 Hören Teil 1** has six statements matched to three original books (Buch 1/2/3) in one podcast, about 420 spoken words, one playback, and 60 seconds task-reading time in the Goethe model.

Do not copy official copyrighted audio/texts. All generation is original exam-style *practice*, not a Goethe-branded recording.

## Constraints and fidelity

The existing studio uses a maximum of 18 TTS clips per recording (320 characters each), 36 clips/day, and five script/question generation requests per day. Higher-level texts use longer scripts split into up to 18 speech segments and may exhaust a day's clip allowance on one activity. **The Studio never launches speech generation automatically** after creating a script.

C2 Aufgabe 1 and certain lower-level mixed/picture-matching tasks are **adapted practice segments**, not complete official-format exam reproductions: image choices and mixed answer modes are represented using text Richtig/Falsch or a–c selection. Editors must review each question and evidence and confirm the selected Teil fits learner objectives. The description on screen explains each format. C2 Aufgabe 1 uses one excerpt with five statements, not all 15 statements from five excerpts.

Only existing five-question A1–B1 **Course Book Audio** activities can currently be published directly. Higher levels and longer exercise formats remain **local MP3/WAV/transcript/question-key exports**, with publish disabled. Do not bypass that safeguard until student rendering, storage, grading and scoring are updated for all Goethe-style answer modes.

Server controls: `functions/hoerenExamProfiles.js`, `functions/hoerenStudioApi.js`, `functions/hoerenQuestions.js`.
Client: `src/pages/HoerenStudioPage.jsx`, `src/utils/hoerenQuestions.js`, `src/services/hoerenStudioService.js`.

## Reference sources

- Goethe C1 model / handbook: https://www.goethe.de/pro/relaunch/prf/sr/Handbuch_Pruefungsziele_Testbeschreibung_C1.pdf
- Goethe C1 model: https://www.goethe.de/pro/relaunch/prf/materialien/C1_modular/c1-modular_modellsatz.pdf
- Accessible sample modules: https://bfu.goethe.de/a2_mod_2MX5/hoeren.php, https://bfu.goethe.de/b1_mod/hoeren.php, https://bfu.goethe.de/b2_mod_2MX6/hoeren.php, https://bfu.goethe.de/c1mod/, https://bfu.goethe.de/c2_mod/hoeren.php

## Testing

Run `node --test tests/hoeren-studio.test.js tests/hoeren-question-publishing.test.js` and the normal production build, then manually generate the C1 book task once under a configured owner account and listen for natural transitions between books. Verify generated evidence, question counts, audio, and export before enabling other workflows.

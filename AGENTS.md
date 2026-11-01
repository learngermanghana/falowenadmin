# Falowen Admin — AI agent instructions

This is the **Admin and tutor** repository for Falowen. The student Campus and public Music site are in [learngermanghana/falowenexamtrainer](https://github.com/learngermanghana/falowenexamtrainer).

Read [the Admin AI documentation hub](docs/ai/README.md) before changing application code. This repository is public. Keep secrets, student records and service-account credentials out of GitHub commits, logs, examples and CI artifacts.

## Ownership
- Admin React/Vite UI lives in `src/`; the Vercel API router lives in `api/router.js`; Firebase Functions live in `functions/`.
- Teacher lesson presentation, attendance, communication and approval workflows belong here. Learner workbook routes and official student pages belong in the student repository.
- Use [architecture](docs/ai/architecture.md) and [source-of-truth matrix](docs/ai/content-source-of-truth.md) before editing contracts shared with learner Campus.

## Constraints for safe changes
- **Official marks:** respect canonical student task identity, answer-key versions, confidence thresholds, review gates and the existing submission contract. See [automatic marking](docs/automatic-course-marking.md), [structured submissions](docs/structured-submission-contract.md).
- **Music Studio:** generation, lyrics, exports and saved teacher material are not proof of published lyrics/timings on `music.falowen.app`. Match exact recording text and review source. See [music studio](docs/music-studio.md) and [learner music workflow](https://github.com/learngermanghana/falowenexamtrainer/blob/main/docs/workflows/music-and-lyrics.md).
- **Analytics:** maintain consent and do not expose user accounts, grades or personal practice logs in public GA4 reporting. See [music analytics](docs/music-analytics.md).
- **Students and classes:** cohort, Zoom, billing and result changes require teacher/staff permissions and matching student-side tests. Never infer private data from public docs.
- **Infrastructure:** avoid unreviewed scheduled tasks, AI API spending, new Firestore readers, or function invocations. Keep secrets server-side.
- **Documentation:** update impacted documents in both repos when an interface changes; run `node scripts/checkAiDocumentation.mjs` for docs PRs.
- **Release:** merge only with passing scoped checks. A merge or build success alone is not a verified deployed API.

## Environment
Use `.env.example` for documentation and a private local `.env` file for development. The existing historical tracked `.env` contains client-side Vite configuration; it must be audited and migrated to deployment/local environment configuration before removing it from history or the source tree. Never add server credentials there.

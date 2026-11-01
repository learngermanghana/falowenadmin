## What changed
Explain the teacher/Admin behavior and any cross-repository contract change.

## Verification
- [ ] Relevant build/tests completed (list results).
- [ ] Reviewed [Admin AGENTS.md](AGENTS.md) and [source-of-truth map](docs/ai/content-source-of-truth.md).
- [ ] Updated affected marking, Music Studio, analytics, live-class or event-hub docs, or documented why not needed.
- [ ] Verified learner/Admin payload parity if student submissions or result identities changed.
- [ ] Reviewed permissions, consent, privacy and AI/cloud costs.
- [ ] No credentials or student records in code, CI logs or documentation.
- [ ] Distinguished GitHub merge, Vercel deployment, Firebase deployment and observed live behavior.

## Rollback / operations
Describe the scope of rollback; data or Firestore migrations do not automatically revert when source code is rolled back.

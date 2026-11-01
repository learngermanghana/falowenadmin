# Admin AI documentation hub

Reviewed: 2026-11-01.

| Topic | Guide |
| --- | --- |
| Agent instructions | [AGENTS.md](../../AGENTS.md) |
| System boundaries | [Architecture](architecture.md) |
| Where changes belong | [Source of truth](content-source-of-truth.md) |
| AI marking | [Automatic marking](../automatic-course-marking.md) |
| Structured student submissions | [Submission contract](../structured-submission-contract.md) |
| Teacher Music Studio | [Music Studio](../music-studio.md) |
| Music analytics and consent | [Music analytics](../music-analytics.md) |
| Live classes | [Curriculum contract](../live-class-curriculum-contract.md) |
| Event / webhook changes | [Integration event hub](../integration-event-hub.md) |
| Student platform | [Learner AGENTS.md](https://github.com/learngermanghana/falowenexamtrainer/blob/main/AGENTS.md) |

Admin and learner apps are deployed independently, but some identifiers and payloads cross repository boundaries. Update their contracts and regression tests together. Never derive individual learner account state from public help.

# Structured submission marking contract

Falowen Campus may now send a single student textarea together with `structuredSections`.

Admin marking must prefer the structured fields because the canonical Teil ownership is already known by the campus. `resolveStructuredSubmissionText` reconstructs the standard `Teil N` text expected by the existing deterministic parser. If structured fields are missing, the legacy submission text is used unchanged so historical submissions remain markable.

### A1 Day 19 speaking workbook

New `A1-5.9` workbook submissions carry `workbookRevision: "a1-5.9-tutor-speaking-v1"`, the transcripts of saved parts, and named recording links in `attachments`. The automatic marking worker routes this revision directly to tutor review. In Marking, open the attached recordings and enter the tutor score. Partial submissions can have fewer than three recordings, including zero when the timer expired before any answer was saved.

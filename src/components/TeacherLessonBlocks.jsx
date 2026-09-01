import { buildTeacherSlideSupport } from "../data/teacherSlideSupport.js";
import { getTeacherLessonGuidance } from "../data/teacherLessonGuidance.js";
import "./TeacherLessonBlocks.css";

const FALOWEN_BASE_URL = "https://www.falowen.app";

function List({ items = [], ordered = false }) {
  const Tag = ordered ? "ol" : "ul";
  return <Tag>{items.map((item) => <li key={item}>{item}</li>)}</Tag>;
}

function SectionHeading({ step, title, subtitle }) {
  return (
    <div className="teacher-section-heading">
      <span className="teacher-section-step">{step}</span>
      <div>
        <h2>{title}</h2>
        {subtitle ? <p className="slide-panel-subtitle">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function falowenHref(path = "") {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${FALOWEN_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function WorkbookConnection({ connection }) {
  if (!connection) return null;
  const parts = Array.isArray(connection.parts) ? connection.parts : [];
  const grammarHref = falowenHref(connection.grammarUrl);
  const workbookHref = falowenHref(connection.workbookUrl);
  const subtitle = connection.subtitle ||
    "Teach toward the same Grammar, Sprechen, Schreiben, Lesen and Hören tasks students see in Falowen.";

  return (
    <section className="slide-panel teacher-section-wide teacher-workbook-panel">
      <div className="teacher-workbook-header">
        <SectionHeading
          step="03"
          title="Workbook connection"
          subtitle={subtitle}
        />
        <div className="teacher-workbook-links no-print">
          {grammarHref ? <a href={grammarHref} target="_blank" rel="noreferrer">Open grammar notes</a> : null}
          {workbookHref ? <a href={workbookHref} target="_blank" rel="noreferrer">Open student workbook</a> : null}
        </div>
      </div>

      <div className="teacher-workbook-grid">
        {parts.map((part) => (
          <article key={part.label} className="teacher-workbook-card">
            <strong>{part.label}</strong>
            <p>{part.detailEn}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function TeacherLessonBlocks({ slide, handoutMode = false }) {
  const support = buildTeacherSlideSupport(slide);
  const guidance = getTeacherLessonGuidance(slide);

  if (handoutMode) {
    return (
      <>
        <section className="slide-panel slide-panel-highlight">
          <h2>Warm-up (DE)</h2>
          <List items={slide.warmupQuestionsDe} />
        </section>

        <section className="slide-panel">
          <h2>Vocabulary & useful language (DE)</h2>
          <List items={slide.keyPhrasesDe} />
        </section>

        <section className="slide-panel">
          <h2>Model examples (DE)</h2>
          <List items={support.modelExamplesDe} />
        </section>

        <section className="slide-panel">
          <h2>Speaking questions (DE)</h2>
          <List items={slide.studentQuestionsDe} ordered />
        </section>

        <section className="slide-panel">
          <h2>Wrap-up task (DE)</h2>
          <p>{slide.wrapUpTaskDe}</p>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="slide-panel teacher-section-wide teacher-overview-panel">
        <SectionHeading step="01" title="Lesson overview" subtitle="Teacher view" />
        <p className="teacher-overview-copy">{support.lessonOverviewEn}</p>
        <div className="teacher-overview-meta">
          <span><strong>Assignment:</strong> {slide.assignmentId}</span>
          <span><strong>Duration:</strong> {slide.estimatedDuration}</span>
        </div>
      </section>

      <section className="slide-panel teacher-section-wide teacher-objective-panel">
        <SectionHeading step="02" title="Teaching objective" />
        <p className="teacher-objective-copy">{slide.objective}</p>
      </section>

      <WorkbookConnection connection={slide.workbookConnection} />

      <section className="slide-panel slide-panel-highlight">
        <SectionHeading step={guidance.steps.warmup} title="Warm-up" subtitle="Activate what students already know before teaching new language." />
        <List items={slide.warmupQuestionsDe} />
      </section>

      <section className="slide-panel">
        <SectionHeading step={guidance.steps.vocabulary} title="Vocabulary & useful language" subtitle="Keep these visible while students speak." />
        <List items={slide.keyPhrasesDe} />
      </section>

      <section className="slide-panel teacher-grammar-panel">
        <SectionHeading step={guidance.steps.grammar} title="Grammar focus" subtitle={guidance.grammarSubtitle} />
        <List items={support.grammarFocusEn} />
      </section>

      <section className="slide-panel">
        <SectionHeading step={guidance.steps.examples} title="Model examples" subtitle="Give students a complete model before asking for freer production." />
        <List items={support.modelExamplesDe} />
      </section>

      <section className="slide-panel teacher-notes-panel">
        <SectionHeading step={guidance.steps.notes} title="Teacher notes" subtitle={guidance.notesSubtitle} />
        <List items={slide.teacherNotesEn} />
      </section>

      <section className="slide-panel teacher-section-wide">
        <SectionHeading step={guidance.steps.guidedPractice} title="Guided practice" subtitle={guidance.guidedPracticeSubtitle} />
        <ol className="teacher-flow-list">
          {slide.interactionFlow.map((item) => (
            <li key={item.phase}>
              <strong>{item.phase}</strong>
              <span>{item.detailEn}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="slide-panel teacher-section-wide">
        <div className="slide-panel-heading">
          <SectionHeading step={guidance.steps.speaking} title="Speaking questions" subtitle={guidance.speakingSubtitle} />
          <span className="slide-question-count">{slide.studentQuestionsDe.length} prompts</span>
        </div>
        <List items={slide.studentQuestionsDe} ordered />
      </section>

      <section className="slide-panel teacher-mistakes-panel">
        <SectionHeading step={guidance.steps.mistakes} title="Common mistakes to watch" subtitle={guidance.mistakesSubtitle} />
        <List items={support.commonMistakesEn} />
      </section>

      <section className="slide-panel teacher-wrapup-panel">
        <SectionHeading step={guidance.steps.wrapUp} title="Wrap-up" subtitle={guidance.wrapUpSubtitle} />
        <p className="teacher-wrapup-task">{slide.wrapUpTaskDe}</p>
      </section>
    </>
  );
}

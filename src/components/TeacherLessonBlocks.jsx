import { buildTeacherSlideSupport } from "../data/teacherSlideSupport.js";
import "./TeacherLessonBlocks.css";

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

export default function TeacherLessonBlocks({ slide, handoutMode = false }) {
  const support = buildTeacherSlideSupport(slide);

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

      <section className="slide-panel slide-panel-highlight">
        <SectionHeading step="03" title="Warm-up" subtitle="Activate what students already know before teaching new language." />
        <List items={slide.warmupQuestionsDe} />
      </section>

      <section className="slide-panel">
        <SectionHeading step="04" title="Vocabulary & useful language" subtitle="Keep these visible while students speak." />
        <List items={slide.keyPhrasesDe} />
      </section>

      <section className="slide-panel teacher-grammar-panel">
        <SectionHeading step="05" title="Grammar focus" subtitle="What the teacher should watch and reinforce during this lesson." />
        <List items={support.grammarFocusEn} />
      </section>

      <section className="slide-panel">
        <SectionHeading step="06" title="Model examples" subtitle="Give students a complete model before asking for freer production." />
        <List items={support.modelExamplesDe} />
      </section>

      <section className="slide-panel teacher-notes-panel">
        <SectionHeading step="07" title="Teacher notes" subtitle="Delivery guidance for this lesson." />
        <List items={slide.teacherNotesEn} />
      </section>

      <section className="slide-panel teacher-section-wide">
        <SectionHeading step="08" title="Guided practice" subtitle="Move from controlled practice to freer production." />
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
          <SectionHeading step="09" title="Speaking questions" subtitle="Use these for pair work, follow-ups, or whole-class discussion." />
          <span className="slide-question-count">{slide.studentQuestionsDe.length} prompts</span>
        </div>
        <List items={slide.studentQuestionsDe} ordered />
      </section>

      <section className="slide-panel teacher-mistakes-panel">
        <SectionHeading step="10" title="Common mistakes to watch" subtitle="Correct selectively after the speaking phase instead of interrupting every answer." />
        <List items={support.commonMistakesEn} />
      </section>

      <section className="slide-panel teacher-wrapup-panel">
        <SectionHeading step="11" title="Wrap-up" subtitle="Finish with one short production task that checks the lesson objective." />
        <p className="teacher-wrapup-task">{slide.wrapUpTaskDe}</p>
      </section>
    </>
  );
}

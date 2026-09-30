import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { VISITOR_GUIDE_PROFILE, VISITOR_PURPOSES, LEARNING_PREFERENCES } from "../data/visitorGuideProfile.js";
import { loadShareablePublicClasses } from "../services/publicBrochureClassService.js";
import {
  buildClassBrochureUrl,
  formatBrochureDate,
  formatBrochureFee,
  formatBrochureSchedule,
} from "../utils/brochureWhatsapp.js";
import "./VisitorGuidePage.css";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const DEFAULT_SIGNUP_URL = "https://www.falowen.app/signup";

function classKey(klass = {}) {
  return String(klass.id || klass.slug || klass.classId || klass.title || klass.name || "").trim();
}

function classTitle(klass = {}) {
  return String(klass.title || klass.name || klass.className || klass.classId || "").trim();
}

function classLevel(klass = {}) {
  const explicit = String(klass.level || klass.levelId || "").trim().toUpperCase();
  if (LEVELS.includes(explicit)) return explicit;
  const match = classTitle(klass).match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
  return match ? match[1].toUpperCase() : "";
}

function classEndLabel(klass = {}) {
  const value = klass.endDate || klass.endsAt || klass.contractEnd;
  return value ? formatBrochureDate(value) : "Approximately 10 weeks after the course starts";
}

function classStartLabel(klass = {}) {
  if (klass.availability === "always" || klass.isSelfLearning) return "Start anytime";
  return formatBrochureDate(klass.startDate || klass.startsAt);
}

function classMeetingLabel(klass = {}) {
  if (klass.availability === "always" || klass.isSelfLearning) return "Self-learning";
  return formatBrochureSchedule(klass);
}

function classVenueLabel(klass = {}) {
  if (klass.availability === "always" || klass.isSelfLearning) return "Online";
  return String(klass.location || klass.venue || klass.city || "In person / online").trim();
}

function classModeLabel(klass = {}, fallback = "Hybrid") {
  if (klass.availability === "always" || klass.isSelfLearning) {
    return "Self-learning with Falowen support";
  }
  return String(klass.format || klass.learningMode || fallback || "Hybrid").trim();
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function printableDate(value) {
  return value ? formatBrochureDate(value) : formatBrochureDate(todayInputValue());
}

function CredentialList({ items }) {
  return (
    <div className="visitor-guide-credential-list">
      {items.map((item) => <span key={item}>{item}</span>)}
    </div>
  );
}

function GuidePage({ number, eyebrow, title, children, className = "" }) {
  return (
    <section className={`visitor-guide-sheet ${className}`}>
      <div className="visitor-guide-sheet-top">
        <span>{eyebrow}</span>
        <span>Visitor Guide · {number}</span>
      </div>
      <h2>{title}</h2>
      {children}
      <footer>
        <strong>Learn Language Education Academy</strong>
        <span>Powered by Falowen</span>
      </footer>
    </section>
  );
}

export default function VisitorGuidePage({ publicView = false }) {
  const profile = VISITOR_GUIDE_PROFILE;
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classError, setClassError] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitDate, setVisitDate] = useState(todayInputValue());
  const [presenter, setPresenter] = useState(profile.founder.name);
  const [assistant, setAssistant] = useState(profile.assistant.name);
  const [selectedClassKey, setSelectedClassKey] = useState("");
  const [level, setLevel] = useState("A1");
  const [learningPreference, setLearningPreference] = useState("Hybrid");
  const [purpose, setPurpose] = useState("General enquiry");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingClasses(true);
    setClassError("");
    loadShareablePublicClasses()
      .then((rows) => {
        if (!active) return;
        setClasses(rows || []);
      })
      .catch((error) => {
        if (!active) return;
        setClassError(error?.message || "Could not load the public class catalogue.");
      })
      .finally(() => {
        if (active) setLoadingClasses(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedClass = useMemo(
    () => classes.find((klass) => classKey(klass) === selectedClassKey) || null,
    [classes, selectedClassKey],
  );

  useEffect(() => {
    if (!selectedClass) return;
    const selectedLevel = classLevel(selectedClass);
    if (selectedLevel) setLevel(selectedLevel);
    if (selectedClass.availability === "always" || selectedClass.isSelfLearning) {
      setLearningPreference("Self-learning");
    } else if (selectedClass.format) {
      setLearningPreference(selectedClass.format);
    }
  }, [selectedClass]);

  const programme = useMemo(() => {
    const title = selectedClass ? classTitle(selectedClass) : `${level} German Programme`;
    const fee = selectedClass ? formatBrochureFee(selectedClass) : level === "A1" ? "GHS 2,800" : "GHS 3,000";
    const brochureUrl = selectedClass ? buildClassBrochureUrl(selectedClass) : DEFAULT_SIGNUP_URL;
    return {
      title,
      level,
      fee,
      start: selectedClass ? classStartLabel(selectedClass) : "To be confirmed",
      end: selectedClass ? classEndLabel(selectedClass) : "Approximately 10 weeks after the course starts",
      meetings: selectedClass ? classMeetingLabel(selectedClass) : "Schedule to be confirmed",
      venue: selectedClass ? classVenueLabel(selectedClass) : learningPreference === "Online" || learningPreference === "Self-learning" ? "Online" : "LLEA / Online",
      mode: selectedClass ? classModeLabel(selectedClass, learningPreference) : learningPreference,
      duration: selectedClass?.availability === "always" || selectedClass?.isSelfLearning ? "Flexible" : "Approximately 10 weeks",
      access: "6 months of Falowen access with full payment",
      brochureUrl,
    };
  }, [selectedClass, level, learningPreference]);

  const preparedFor = visitorName.trim() || "Prospective student / family";
  const visitorNotes = notes.trim();

  const printGuide = () => {
    const previousTitle = document.title;
    document.title = `Falowen Visitor Guide - ${preparedFor} - ${programme.level}`;
    window.print();
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 500);
  };

  return (
    <div className="visitor-guide-page">
      {!publicView ? <section className="visitor-guide-config">
        <div>
          <p className="visitor-guide-kicker">Admissions · Visitor Guide</p>
          <h1>Create a personalised school visit guide</h1>
          <p>
            Prepare a client-facing walkthrough of the school, the selected course, Falowen and the support team.
            Use <strong>Print / Save PDF</strong> to create the PDF after reviewing the preview.
          </p>
        </div>

        <div className="visitor-guide-form-grid">
          <label>
            <span>Visitor / client name</span>
            <input value={visitorName} onChange={(event) => setVisitorName(event.target.value)} placeholder="e.g. Ama Mensah" />
          </label>

          <label>
            <span>Visit date</span>
            <input type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} />
          </label>

          <label>
            <span>Presented by</span>
            <input value={presenter} onChange={(event) => setPresenter(event.target.value)} />
          </label>

          <label>
            <span>Academic assistant</span>
            <input value={assistant} onChange={(event) => setAssistant(event.target.value)} />
          </label>

          <label>
            <span>Interested level</span>
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              {LEVELS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label>
            <span>Selected class</span>
            <select value={selectedClassKey} onChange={(event) => setSelectedClassKey(event.target.value)}>
              <option value="">General enquiry / no class selected</option>
              {classes.map((klass) => (
                <option key={classKey(klass)} value={classKey(klass)}>
                  {classTitle(klass)} · {formatBrochureFee(klass)}
                </option>
              ))}
            </select>
            <small>
              {loadingClasses
                ? "Loading public classes…"
                : classError
                  ? classError
                  : "Class fee, dates and schedule are pulled from the live public catalogue."}
            </small>
          </label>

          <label>
            <span>Learning preference</span>
            <select value={learningPreference} onChange={(event) => setLearningPreference(event.target.value)}>
              {LEARNING_PREFERENCES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label>
            <span>Purpose</span>
            <select value={purpose} onChange={(event) => setPurpose(event.target.value)}>
              {VISITOR_PURPOSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label className="visitor-guide-notes-field">
            <span>Visit notes <small>(optional)</small></span>
            <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Important goals, questions or next steps discussed during the visit." />
          </label>
        </div>

        <div className="visitor-guide-config-actions">
          <button type="button" onClick={printGuide}>Print / Save PDF</button>
          <a href={programme.brochureUrl} target="_blank" rel="noreferrer">Open selected class brochure</a>
        </div>
      </section> : null}

      {!publicView ? <div className="visitor-guide-preview-label">PDF preview</div> : null}

      <div className="visitor-guide-print" id="visitor-guide-print">
        <GuidePage number="1" eyebrow="Welcome" title={profile.school.name} className="visitor-guide-cover">
          <div className="visitor-guide-cover-mark">FALOWEN</div>
          <p className="visitor-guide-lede">
            A personalised introduction to the school, your selected programme and the learning system that supports you.
          </p>
          <div className="visitor-guide-trust-row">
            <strong>Established {profile.school.establishedYear}</strong>
            <strong>{profile.school.examPerformance}</strong>
            <strong>{profile.school.levels}</strong>
          </div>
          <div className="visitor-guide-cover-details">
            <div><span>Prepared for</span><strong>{preparedFor}</strong></div>
            <div><span>Visit date</span><strong>{printableDate(visitDate)}</strong></div>
            <div><span>Presented by</span><strong>{presenter || profile.founder.name}</strong></div>
            <div><span>Academic assistant</span><strong>{assistant || profile.assistant.name}</strong></div>
            <div><span>Interested in</span><strong>{programme.title}</strong></div>
            <div><span>Purpose</span><strong>{purpose}</strong></div>
          </div>
        </GuidePage>

        <GuidePage number="2" eyebrow="About us" title="The school behind Falowen">
          <p className="visitor-guide-lede">{profile.school.summary}</p>
          <div className="visitor-guide-big-stats">
            <div><span>Established</span><strong>{profile.school.establishedYear}</strong></div>
            <div><span>Exam performance</span><strong>{profile.school.examPerformance}</strong><small>{profile.school.examScope}</small></div>
            <div><span>German learning</span><strong>A1–C2</strong></div>
          </div>
          <div className="visitor-guide-two-column">
            <article>
              <h3>What students receive</h3>
              <ul>
                <li>Structured German lessons and course books</li>
                <li>Live, online and digital learning options</li>
                <li>Tutor-marked writing and selected assignments</li>
                <li>Attendance, scores and progress tracking</li>
                <li>Exam-style reading, listening, writing and speaking practice</li>
              </ul>
            </article>
            <article>
              <h3>How we work</h3>
              <p>
                Teaching and technology work together. The teacher leads the academic journey while Falowen keeps lessons,
                practice, assignments, results and progress organised in one learning environment.
              </p>
            </article>
          </div>
        </GuidePage>

        <GuidePage number="3" eyebrow="People" title="Meet the team supporting your learning">
          <div className="visitor-guide-team-grid">
            <article className="visitor-guide-person-card">
              <span className="visitor-guide-role">Founder & Director</span>
              <h3>{profile.founder.name}</h3>
              <strong>{profile.founder.secondaryRole}</strong>
              <p>{profile.founder.bio}</p>
              <CredentialList items={profile.founder.credentials} />
            </article>
            <article className="visitor-guide-person-card">
              <span className="visitor-guide-role">{profile.assistant.role}</span>
              <h3>{profile.assistant.name}</h3>
              <p>{profile.assistant.bio}</p>
              <CredentialList items={profile.assistant.credentials} />
            </article>
          </div>
        </GuidePage>

        <GuidePage number="4" eyebrow="Your programme" title={programme.title}>
          <div className="visitor-guide-programme-grid">
            <div><span>Level</span><strong>{programme.level}</strong></div>
            <div><span>Course fee</span><strong>{programme.fee}</strong></div>
            <div><span>Start</span><strong>{programme.start}</strong></div>
            <div><span>Course end</span><strong>{programme.end}</strong></div>
            <div><span>Duration</span><strong>{programme.duration}</strong></div>
            <div><span>Meeting times</span><strong>{programme.meetings}</strong></div>
            <div><span>Venue</span><strong>{programme.venue}</strong></div>
            <div><span>Learning mode</span><strong>{programme.mode}</strong></div>
            <div><span>Falowen access</span><strong>{programme.access}</strong></div>
          </div>
          <p className="visitor-guide-note">
            Your exact timetable and class arrangements are confirmed during registration. The selected public class information
            above is loaded from Falowen when available.
          </p>
        </GuidePage>

        <GuidePage number="5" eyebrow="Platform" title="How Falowen supports the student">
          <div className="visitor-guide-flow">
            {[
              ["Campus", "See your course, next lesson, attendance and latest results."],
              ["Course Book", "Move through grammar, vocabulary, reading, listening, writing and speaking."],
              ["Assignments", "Complete tutor-marked and automatically checked learning tasks."],
              ["Results", "Review scores, corrections and areas that need more work."],
              ["Exam Room", "Practise exam-style tasks and prepare for the next examination step."],
            ].map(([name, detail], index) => (
              <div key={name}>
                <span>{index + 1}</span>
                <article><h3>{name}</h3><p>{detail}</p></article>
              </div>
            ))}
          </div>
        </GuidePage>

        <GuidePage number="6" eyebrow="Learning journey" title="What happens during the course">
          <div className="visitor-guide-timeline">
            {[
              ["Registration", "Create the student account, choose the class and activate access."],
              ["Orientation", "Understand the class, Falowen, assignments and expectations."],
              ["Weekly learning", "Attend class and continue practice in Falowen between sessions."],
              ["Tutor-marked work", "Receive feedback on selected writing and course assignments."],
              ["Progress monitoring", "Track attendance, results and areas that need improvement."],
              ["Exam preparation", "Practise the skills and task types needed for German-language examinations."],
            ].map(([name, detail], index) => (
              <div key={name}>
                <strong>{index + 1}</strong>
                <article><h3>{name}</h3><p>{detail}</p></article>
              </div>
            ))}
          </div>
        </GuidePage>

        <GuidePage number="7" eyebrow="Support" title="The student is supported by people and technology">
          <div className="visitor-guide-support-grid">
            <article><h3>Teacher / Director</h3><p>Academic direction, live instruction, explanations and course standards.</p></article>
            <article><h3>Academic Assistant</h3><p>Enquiries, onboarding, student guidance and day-to-day support.</p></article>
            <article><h3>Falowen</h3><p>Lessons, assignments, attendance, results, progress and exam practice in one place.</p></article>
            <article><h3>The Student</h3><p>Attendance, independent practice, assignments and consistent revision.</p></article>
          </div>
          <p className="visitor-guide-note">
            Falowen supports the teaching process; it does not replace the teacher. Students combine guided instruction with structured independent practice.
          </p>
        </GuidePage>

        <GuidePage number="8" eyebrow="After the course" title="Learning continues after the final class">
          <div className="visitor-guide-after-flow">
            <strong>Course complete</strong><span>→</span>
            <strong>Revision access</strong><span>→</span>
            <strong>Exam preparation</strong><span>→</span>
            <strong>Certificate of Completion</strong><span>→</span>
            <strong>Progress to the next level</strong>
          </div>
          <div className="visitor-guide-two-column">
            <article>
              <h3>Revision and progress</h3>
              <p>
                Full payment gives six months of Falowen access from enrollment, so students can continue revising after scheduled classes end.
              </p>
            </article>
            <article>
              <h3>Certificate</h3>
              <p>
                LLEA/Falowen issues a Certificate of Completion for completed courses. It does not replace an official Goethe-Institut or
                another recognised language certificate when an official certificate is required.
              </p>
            </article>
          </div>
        </GuidePage>

        <GuidePage number="9" eyebrow="Next step" title="Your next step with Falowen">
          <div className="visitor-guide-final-grid">
            <div>
              <p className="visitor-guide-lede">You explored:</p>
              <h3>{programme.title}</h3>
              <dl>
                <div><dt>Fee</dt><dd>{programme.fee}</dd></div>
                <div><dt>Start</dt><dd>{programme.start}</dd></div>
                <div><dt>Mode</dt><dd>{programme.mode}</dd></div>
                <div><dt>Purpose</dt><dd>{purpose}</dd></div>
              </dl>
              {visitorNotes ? (
                <div className="visitor-guide-visit-notes">
                  <strong>Notes from your visit</strong>
                  <p>{visitorNotes}</p>
                </div>
              ) : null}
            </div>
            <div className="visitor-guide-qr">
              <QRCodeSVG value={programme.brochureUrl || DEFAULT_SIGNUP_URL} size={154} level="M" />
              <strong>{selectedClass ? "Open your selected class brochure" : "Open Falowen registration"}</strong>
              <small>{programme.brochureUrl || DEFAULT_SIGNUP_URL}</small>
            </div>
          </div>
          <div className="visitor-guide-final-callout">
            <strong>Ready to continue?</strong>
            <span>Register, start your trial, or speak with the LLEA team about the programme that fits your goals.</span>
          </div>
        </GuidePage>
      </div>
    </div>
  );
}

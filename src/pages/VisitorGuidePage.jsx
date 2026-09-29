import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { VISITOR_GUIDE_PROFILE, VISITOR_PURPOSES, LEARNING_PREFERENCES } from "../data/visitorGuideProfile.js";
import { loadShareablePublicClasses } from "../services/publicBrochureClassService.js";
import {
  buildClassBrochureUrl,
  brochureClassSlug,
  formatBrochureDate,
  formatBrochureFee,
  formatBrochureSchedule,
} from "../utils/brochureWhatsapp.js";
import "./VisitorGuidePage.css";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const DEFAULT_SIGNUP_URL = "https://www.falowen.app/signup";
const PRESENTATION_TOTAL = 10;
const SAVED_GUIDES_KEY = "falowenVisitorGuides.v1";
const DRAFT_GUIDE_KEY = "falowenVisitorGuideDraft.v1";
const GUIDE_STATUSES = ["Interested", "Trial started", "Registered", "Not proceeding"];

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

function buildRegistrationUrl(selectedClass, level) {
  const url = new URL(DEFAULT_SIGNUP_URL);
  const slug = selectedClass ? brochureClassSlug(selectedClass) : "";
  if (slug) {
    url.searchParams.set("class", slug);
  } else if (level) {
    url.searchParams.set("level", level);
    if (["A1", "A2", "B1"].includes(level)) url.searchParams.set("enquiry", "1");
  }
  return url.toString();
}

function buildWhatsappShareUrl({ preparedFor, programmeTitle, shareUrl }) {
  const greeting = preparedFor && preparedFor !== "Prospective student / family"
    ? `Hello ${preparedFor},`
    : "Hello,";
  const message = [
    greeting,
    "",
    `Here is your personalised Falowen Visitor Guide for ${programmeTitle}.`,
    shareUrl,
    "",
    "You can review the school, your programme, how Falowen works and the next steps from this link.",
  ].join("\n");
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function readSavedGuides() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_GUIDES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedGuides(guides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_GUIDES_KEY, JSON.stringify(guides));
}

function readDraftGuide() {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DRAFT_GUIDE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDraftGuide(guide) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_GUIDE_KEY, JSON.stringify(guide));
}

function readVisitorGuideLinkContext() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const level = String(params.get("level") || "").toUpperCase();
  const mode = params.get("mode") || "";
  const purpose = params.get("purpose") || "";
  return {
    visitorName: params.get("name") || "",
    visitDate: params.get("date") || "",
    presenter: params.get("presenter") || "",
    assistant: params.get("assistant") || "",
    selectedClassKey: params.get("class") || "",
    level: LEVELS.includes(level) ? level : "",
    learningPreference: LEARNING_PREFERENCES.includes(mode) ? mode : "",
    purpose: VISITOR_PURPOSES.includes(purpose) ? purpose : "",
    programmeSnapshot: {
      title: params.get("programme") || "",
      fee: params.get("fee") || "",
      start: params.get("start") || "",
      end: params.get("end") || "",
      meetings: params.get("meetings") || "",
      venue: params.get("venue") || "",
      mode: params.get("programmeMode") || "",
      duration: params.get("duration") || "",
      access: params.get("access") || "",
      brochureUrl: params.get("brochure") || "",
    },
  };
}

export function buildVisitorGuideShareUrl({
  origin,
  visitorName,
  visitDate,
  presenter,
  assistant,
  selectedClassKey,
  level,
  learningPreference,
  purpose,
  programmeSnapshot = {},
}) {
  const baseOrigin = origin || (typeof window !== "undefined" ? window.location.origin : "https://admin.falowen.app");
  const url = new URL("/visitor-guide/public", baseOrigin);
  const values = {
    name: visitorName,
    date: visitDate,
    presenter,
    assistant,
    class: selectedClassKey,
    level,
    mode: learningPreference,
    purpose,
    programme: programmeSnapshot.title,
    fee: programmeSnapshot.fee,
    start: programmeSnapshot.start,
    end: programmeSnapshot.end,
    meetings: programmeSnapshot.meetings,
    venue: programmeSnapshot.venue,
    programmeMode: programmeSnapshot.mode,
    duration: programmeSnapshot.duration,
    access: programmeSnapshot.access,
    brochure: programmeSnapshot.brochureUrl,
  };
  Object.entries(values).forEach(([key, value]) => {
    const clean = String(value || "").trim();
    if (clean) url.searchParams.set(key, clean);
  });
  return url.toString();
}

function CredentialList({ items }) {
  return (
    <div className="visitor-guide-credential-list">
      {items.map((item) => <span key={item}>{item}</span>)}
    </div>
  );
}

function FalowenExperiencePreview() {
  const screens = [
    {
      title: "Dashboard",
      detail: "Attendance, class participation, next recommendations and missed work are visible from the student dashboard.",
      image: "/visitor-guide/falowen-dashboard.webp",
      alt: "Falowen student dashboard showing home metrics, attendance, participation, recommendations and missed items.",
    },
    {
      title: "Course Book",
      detail: "Learners follow their level, completion, next lesson, mastery and lesson list from the Course Book.",
      image: "/visitor-guide/falowen-course-book.webp",
      alt: "Falowen A1 Course Book showing course completion, next lesson, mastery and lesson navigation.",
    },
    {
      title: "Results",
      detail: "Results history can be searched and filtered so learners can review marks, feedback and weak points.",
      image: "/visitor-guide/falowen-results.webp",
      alt: "Falowen Results history interface with search, level filter and minimum score filter.",
    },
    {
      title: "Exam Room",
      detail: "Campus connects directly to the Exams Room for speaking, writing, listening, reading and exam readiness.",
      image: "/visitor-guide/falowen-exam-room.webp",
      alt: "Falowen Campus and Exams Room cards showing daily learning and exam practice areas.",
    },
  ];

  return (
    <div className="visitor-guide-screen-grid" aria-label="Real Falowen student interface screenshots">
      {screens.map((screen) => (
        <article key={screen.title} className="visitor-guide-screen-card">
          <img src={screen.image} alt={screen.alt} loading="lazy" />
          <div className="visitor-guide-screen-caption">
            <h3>{screen.title}</h3>
            <p>{screen.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function GuidePage({ number, eyebrow, title, children, className = "", presenterMode = false, presenterPage = 1 }) {
  const presenterHidden = presenterMode && Number(number) !== presenterPage;
  return (
    <section
      id={`visitor-guide-page-${number}`}
      className={`visitor-guide-sheet ${className}`}
      hidden={presenterHidden}
      data-guide-page={number}
    >
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
  const linkContext = useMemo(
    () => publicView ? readVisitorGuideLinkContext() : {},
    [publicView],
  );
  const draftContext = useMemo(
    () => publicView ? {} : readDraftGuide(),
    [publicView],
  );
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classError, setClassError] = useState("");
  const [visitorName, setVisitorName] = useState(linkContext.visitorName || draftContext.visitorName || "");
  const [visitDate, setVisitDate] = useState(linkContext.visitDate || draftContext.visitDate || todayInputValue());
  const [presenter, setPresenter] = useState(linkContext.presenter || draftContext.presenter || profile.founder.name);
  const [assistant, setAssistant] = useState(linkContext.assistant || draftContext.assistant || profile.assistant.name);
  const [selectedClassKey, setSelectedClassKey] = useState(linkContext.selectedClassKey || draftContext.selectedClassKey || "");
  const [level, setLevel] = useState(linkContext.level || draftContext.level || "A1");
  const [learningPreference, setLearningPreference] = useState(linkContext.learningPreference || draftContext.learningPreference || "Hybrid");
  const [purpose, setPurpose] = useState(linkContext.purpose || draftContext.purpose || "General enquiry");
  const [notes, setNotes] = useState(publicView ? "" : (draftContext.notes || ""));
  const [copyState, setCopyState] = useState("");
  const [presenterMode, setPresenterMode] = useState(false);
  const [presenterPage, setPresenterPage] = useState(1);
  const [savedGuides, setSavedGuides] = useState(() => publicView ? [] : readSavedGuides());
  const [activeSavedId, setActiveSavedId] = useState("");
  const [guideStatus, setGuideStatus] = useState(
    publicView || !GUIDE_STATUSES.includes(draftContext.status) ? "Interested" : draftContext.status,
  );

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

  useEffect(() => {
    if (!presenterMode) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        setPresenterPage((page) => Math.min(PRESENTATION_TOTAL, page + 1));
      } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        setPresenterPage((page) => Math.max(1, page - 1));
      } else if (event.key === "Home") {
        setPresenterPage(1);
      } else if (event.key === "End") {
        setPresenterPage(PRESENTATION_TOTAL);
      } else if (event.key === "Escape") {
        setPresenterMode(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [presenterMode]);

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

  useEffect(() => {
    if (publicView) return;
    writeDraftGuide({
      visitorName,
      visitDate,
      presenter,
      assistant,
      selectedClassKey,
      level,
      learningPreference,
      purpose,
      notes,
      status: guideStatus,
      updatedAt: new Date().toISOString(),
    });
  }, [
    publicView,
    visitorName,
    visitDate,
    presenter,
    assistant,
    selectedClassKey,
    level,
    learningPreference,
    purpose,
    notes,
    guideStatus,
  ]);

  const programme = useMemo(() => {
    const snapshot = publicView ? linkContext.programmeSnapshot : null;
    if (snapshot?.title) {
      return {
        title: snapshot.title,
        level,
        fee: snapshot.fee || "Fee to be confirmed",
        start: snapshot.start || "To be confirmed",
        end: snapshot.end || "To be confirmed",
        meetings: snapshot.meetings || "Schedule to be confirmed",
        venue: snapshot.venue || "To be confirmed",
        mode: snapshot.mode || learningPreference,
        duration: snapshot.duration || "Approximately 10 weeks",
        access: snapshot.access || "6 months of Falowen access with full payment",
        brochureUrl: snapshot.brochureUrl || DEFAULT_SIGNUP_URL,
      };
    }

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
  }, [selectedClass, level, learningPreference, publicView, linkContext.programmeSnapshot]);

  const preparedFor = visitorName.trim() || "Prospective student / family";
  const visitorNotes = notes.trim();
  const shareUrl = useMemo(
    () => buildVisitorGuideShareUrl({
      origin: typeof window !== "undefined" ? window.location.origin : "https://admin.falowen.app",
      visitorName,
      visitDate,
      presenter,
      assistant,
      selectedClassKey,
      level,
      learningPreference,
      purpose,
      programmeSnapshot: programme,
    }),
    [visitorName, visitDate, presenter, assistant, selectedClassKey, level, learningPreference, purpose, programme],
  );

  const registrationUrl = useMemo(
    () => buildRegistrationUrl(selectedClass, programme.level),
    [selectedClass, programme.level],
  );
  const whatsappShareUrl = useMemo(
    () => buildWhatsappShareUrl({ preparedFor, programmeTitle: programme.title, shareUrl }),
    [preparedFor, programme.title, shareUrl],
  );

  const guidePageProps = (number) => ({
    number,
    presenterMode,
    presenterPage,
  });

  const startPresentation = () => {
    setPresenterPage(1);
    setPresenterMode(true);
  };

  const saveGuide = () => {
    if (publicView) return;
    const now = new Date().toISOString();
    const id = activeSavedId || `visitor-${Date.now()}`;
    const snapshot = {
      id,
      visitorName: visitorName.trim(),
      visitDate,
      presenter: presenter.trim(),
      assistant: assistant.trim(),
      selectedClassKey,
      selectedClassTitle: programme.title,
      level: programme.level,
      learningPreference,
      purpose,
      notes: notes.trim(),
      status: guideStatus,
      shareUrl,
      savedAt: now,
    };
    const next = activeSavedId
      ? savedGuides.map((item) => item.id === id ? snapshot : item)
      : [snapshot, ...savedGuides];
    setSavedGuides(next);
    writeSavedGuides(next);
    setActiveSavedId(id);
    setCopyState(activeSavedId ? "Saved visitor guide updated." : "Visitor guide saved on this Admin browser.");
  };

  const loadSavedGuide = (saved) => {
    setActiveSavedId(saved.id);
    setVisitorName(saved.visitorName || "");
    setVisitDate(saved.visitDate || todayInputValue());
    setPresenter(saved.presenter || profile.founder.name);
    setAssistant(saved.assistant || profile.assistant.name);
    setSelectedClassKey(saved.selectedClassKey || "");
    setLevel(saved.level || "A1");
    setLearningPreference(saved.learningPreference || "Hybrid");
    setPurpose(saved.purpose || "General enquiry");
    setNotes(saved.notes || "");
    setGuideStatus(GUIDE_STATUSES.includes(saved.status) ? saved.status : "Interested");
    setCopyState(`Loaded ${saved.visitorName || saved.selectedClassTitle || "saved visitor guide"}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateSavedStatus = (id, status) => {
    const next = savedGuides.map((item) => item.id === id ? { ...item, status } : item);
    setSavedGuides(next);
    writeSavedGuides(next);
    if (id === activeSavedId) setGuideStatus(status);
  };

  const deleteSavedGuide = (id) => {
    const next = savedGuides.filter((item) => item.id !== id);
    setSavedGuides(next);
    writeSavedGuides(next);
    if (id === activeSavedId) {
      setActiveSavedId("");
      setGuideStatus("Interested");
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("Visitor link copied.");
    } catch {
      setCopyState("Could not copy automatically. Open the link and copy it from the address bar.");
    }
  };

  return (
    <div className={`visitor-guide-page ${publicView ? "visitor-guide-page-public" : ""} ${presenterMode ? "visitor-guide-presenting" : ""}`}>
      {publicView ? (
        <section className="visitor-guide-public-bar">
          <div>
            <p className="visitor-guide-kicker">Falowen · Visitor Guide</p>
            <strong>Prepared for {preparedFor}</strong>
            <span>{programme.title} · {printableDate(visitDate)}</span>
          </div>
          <div className="visitor-guide-public-actions">
            <nav aria-label="Visitor guide sections">
              {Array.from({ length: PRESENTATION_TOTAL }, (_, index) => index + 1).map((page) => (
                <a key={page} href={`#visitor-guide-page-${page}`}>{page}</a>
              ))}
            </nav>
            <button type="button" onClick={startPresentation}>Start Presentation</button>
          </div>
        </section>
      ) : (
      <section className="visitor-guide-config">
        <div>
          <p className="visitor-guide-kicker">Admissions · Visitor Guide</p>
          <h1>Create a personalised school visit guide</h1>
          <p>
            Prepare a client-facing walkthrough, then generate one public visitor link you can open on a tablet,
            send on WhatsApp, or share after the meeting. The visitor does not need an Admin login.
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

          <label>
            <span>Admissions status</span>
            <select value={guideStatus} onChange={(event) => setGuideStatus(event.target.value)}>
              {GUIDE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label className="visitor-guide-notes-field">
            <span>Visit notes <small>(optional)</small></span>
            <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Important goals, questions or next steps discussed during the visit." />
          </label>
        </div>

        <div className="visitor-guide-link-box">
          <label>
            <span>Generated visitor link</span>
            <input value={shareUrl} readOnly aria-label="Generated visitor guide link" />
          </label>
          <p>Visit notes are kept privately in this Admin browser and are never included in the public visitor link.</p>
          <div className="visitor-guide-config-actions">
            <button type="button" onClick={copyShareLink}>Copy visitor link</button>
            <button type="button" onClick={startPresentation}>Start Presentation</button>
            <button type="button" onClick={saveGuide}>{activeSavedId ? "Update saved guide" : "Save visitor guide"}</button>
            <a href={shareUrl} target="_blank" rel="noreferrer">Open visitor guide</a>
            <a href={whatsappShareUrl} target="_blank" rel="noreferrer">Send on WhatsApp</a>
            <a href={programme.brochureUrl} target="_blank" rel="noreferrer">Open class brochure</a>
          </div>
          {copyState ? <small role="status">{copyState}</small> : null}
        </div>
      </section>
      )}

      {!publicView && savedGuides.length ? (
        <section className="visitor-guide-saved">
          <div className="visitor-guide-saved-header">
            <div>
              <p className="visitor-guide-kicker">Admissions follow-up</p>
              <h2>Saved visitor guides</h2>
            </div>
            <span>{savedGuides.length} saved on this browser</span>
          </div>
          <div className="visitor-guide-saved-grid">
            {savedGuides.map((saved) => (
              <article key={saved.id}>
                <div>
                  <strong>{saved.visitorName || "Unnamed visitor"}</strong>
                  <span>{saved.selectedClassTitle || saved.level || "German programme"} · {printableDate(saved.visitDate)}</span>
                </div>
                <select
                  value={saved.status || "Interested"}
                  onChange={(event) => updateSavedStatus(saved.id, event.target.value)}
                  aria-label={`Admissions status for ${saved.visitorName || "visitor"}`}
                >
                  {GUIDE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <div className="visitor-guide-saved-actions">
                  <button type="button" onClick={() => loadSavedGuide(saved)}>Open in Admin</button>
                  <a href={saved.shareUrl} target="_blank" rel="noreferrer">Open client link</a>
                  <button type="button" className="visitor-guide-danger-button" onClick={() => deleteSavedGuide(saved.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!publicView ? <div className="visitor-guide-preview-label">Shareable guide preview</div> : null}

      {presenterMode ? (
        <div className="visitor-guide-presenter-controls" role="toolbar" aria-label="Visitor Guide presentation controls">
          <button type="button" onClick={() => setPresenterMode(false)}>Exit</button>
          <button type="button" onClick={() => setPresenterPage((page) => Math.max(1, page - 1))} disabled={presenterPage === 1}>Previous</button>
          <span>{presenterPage} / {PRESENTATION_TOTAL}</span>
          <div className="visitor-guide-presenter-progress" aria-hidden="true">
            <span style={{ width: `${(presenterPage / PRESENTATION_TOTAL) * 100}%` }} />
          </div>
          <button type="button" onClick={() => setPresenterPage((page) => Math.min(PRESENTATION_TOTAL, page + 1))} disabled={presenterPage === PRESENTATION_TOTAL}>Next</button>
        </div>
      ) : null}

      <div className={`visitor-guide-print ${presenterMode ? "visitor-guide-print-presenting" : ""}`} id="visitor-guide-print">
        <GuidePage {...guidePageProps(1)} eyebrow="Welcome" title={profile.school.name} className="visitor-guide-cover">
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

        <GuidePage {...guidePageProps(2)} eyebrow="About us" title="The school behind Falowen">
          <p className="visitor-guide-lede">{profile.school.summary}</p>
          <div className="visitor-guide-big-stats">
            <div><span>Established</span><strong>{profile.school.establishedYear}</strong></div>
            <div><span>Exam performance</span><strong>{profile.school.examPerformance}</strong><small>{profile.school.examScope}</small></div>
            <div><span>German learning</span><strong>A1–C2</strong></div>
          </div>
          <div className="visitor-guide-two-column">
            <article>
              <h3>What your learning package includes</h3>
              <ul>
                <li><strong>Hybrid learning:</strong> attend in person, join online, or use recorded lectures where available.</li>
                <li><strong>Advanced teaching slides:</strong> structured lesson presentations designed for the selected German level.</li>
                <li><strong>Six months of Falowen access:</strong> full-payment students keep access for continued study, revision and exam preparation.</li>
                <li><strong>Tutor support:</strong> selected assignments, writing feedback and academic guidance throughout the course.</li>
                <li><strong>Progress visibility:</strong> attendance, results and learning progress are organised in one system.</li>
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

        <GuidePage {...guidePageProps(3)} eyebrow="Why LLEA + Falowen" title="A hybrid learning system built around the student">
          <div className="visitor-guide-value-grid">
            {[
              ["Hybrid learning", "Learn in person, join online, and use recorded lectures where available."],
              ["Advanced teaching slides", "Structured teaching presentations keep each lesson focused and consistent."],
              ["Six months of Falowen access", "Full-payment students can keep learning and revising beyond the final class."],
              ["High exam pass rate", "The academy has maintained a high pass rate across German-language examinations."],
              ["Tutor-marked work", "Selected writing and assignments receive teacher feedback, not only automated scoring."],
              ["Progress tracking", "Attendance, results and learning progress are visible in one connected system."],
            ].map(([title, detail]) => (
              <article key={title}>
                <strong>{title}</strong>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </GuidePage>

        <GuidePage {...guidePageProps(4)} eyebrow="People" title="Meet the team supporting your learning">
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

        <GuidePage {...guidePageProps(5)} eyebrow="Your programme" title={programme.title}>
          <div className="visitor-guide-programme-hero">
            <div>
              <span>Your selected programme</span>
              <strong>{programme.title}</strong>
              <small>{programme.mode}</small>
            </div>
            <div>
              <span>Course fee</span>
              <strong>{programme.fee}</strong>
              <small>{programme.access}</small>
            </div>
          </div>
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
          <div className="visitor-guide-registration-steps">
            {[
              ["1", "Register", "Choose the class and create the student account."],
              ["2", "Activate access", "Start the 7-day trial or choose a payment option."],
              ["3", "Orientation", "Learn how classes, assignments and Falowen work."],
              ["4", "Begin learning", "Join the class and continue practice inside Falowen."],
            ].map(([step, title, detail]) => (
              <article key={step}>
                <span>{step}</span>
                <div><strong>{title}</strong><p>{detail}</p></div>
              </article>
            ))}
          </div>
          <p className="visitor-guide-note">
            Your exact timetable and class arrangements are confirmed during registration. The selected public class information
            above is loaded from Falowen when available.
          </p>
        </GuidePage>

        <GuidePage {...guidePageProps(6)} eyebrow="Platform" title="See how the Falowen learning experience is organised">
          <FalowenExperiencePreview />
          <p className="visitor-guide-note">
            These are real Falowen student-interface screenshots. The live account adapts to the learner’s level, class and completed work.
          </p>
        </GuidePage>

        <GuidePage {...guidePageProps(7)} eyebrow="Learning journey" title="What happens during the course">
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

        <GuidePage {...guidePageProps(8)} eyebrow="Support" title="The student is supported by people and technology">
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

        <GuidePage {...guidePageProps(9)} eyebrow="After the course" title="Learning continues after the final class">
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

        <GuidePage {...guidePageProps(10)} eyebrow="Next step" title="Your next step with Falowen">
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
            <span>Choose the next step that fits you. The Falowen signup flow starts with the 7-day trial option selected by default.</span>
            <div className="visitor-guide-final-actions">
              <a href={registrationUrl} target="_blank" rel="noreferrer">Register / choose payment</a>
              <a href={registrationUrl} target="_blank" rel="noreferrer">Start 7-day trial</a>
              <a href={whatsappShareUrl} target="_blank" rel="noreferrer">WhatsApp the LLEA team</a>
            </div>
          </div>
        </GuidePage>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { listClasses } from "../services/classesService";
import { saveAnnouncementRow } from "../services/communicationService";
import { listStudentsByClass } from "../services/studentsService";
import { useToast } from "../context/ToastContext";

const QUICK_TEMPLATES = [
  {
    label: "Class starting soon",
    topic: "Class Reminder",
    announcement: "Hi everyone, class is about to start. Please join on time.",
  },
  {
    label: "Cancel class",
    topic: "Class Cancellation",
    announcement: "Today's class has been cancelled. We will share the replacement schedule shortly.",
  },
  {
    label: "Course complete",
    topic: "Course Completion",
    announcement: "Congratulations! Your course has ended. Your transcript/certificate is ready.",
    attachCertificate: true,
  },
  {
    label: "No class on holiday",
    topic: "Holiday Notice",
    announcement: "No class on {date} due to holiday. Replacement class details will follow.",
  },
  {
    label: "NRW class time update",
    topic: "Class Time Update",
    announcement:
      "Hi NRW class, your class time has been updated to {new_time} starting {date}. Please reply if you have any conflicts.",
  },
  {
    label: "Course material updated",
    topic: "Course Material Update",
    announcement:
      "Hi everyone, today's course material has been updated. Please use the latest version here: {link}",
  },
  {
    label: "Tab bug fixed",
    topic: "Bug Fix Notice",
    announcement: "The tab bug has been fixed. You can now safely use it.",
  },
  {
    label: "Exam practice reminder",
    topic: "Exam Preparation Reminder",
    announcement:
      "Hi {student_name}, great work so far. Your exam is still pending, so please keep practicing regularly to stay confident and ready.",
  },
  {
    label: "Power outage notice",
    topic: "Light Out Notice",
    announcement:
      "Hi everyone, there is a light out right now, so please hold on. Once the light is back, you will be notified.",
  },
  {
    label: "First day orientation congrats",
    topic: "Orientation Attendance Congrats",
    announcement:
      "Congratulations on attending your first day orientation! Stay consistent with class attendance and participation. We have helped many students, and we want to add your story to our success stories too.",
  },
];

const ALL_ACTIVE_AUDIENCE = "all_active";
const ALL_ACTIVE_AUDIENCE_LABEL = "Everyone / all active students";
const ACCOUNT_UPGRADE_LINK = "https://www.falowen.app/campus/account";

const UPCOMING_CLASS_PROMO = {
  label: "Upcoming class ad",
  topic: "Next Class Registration",
  announcement:
    "Hi everyone, your current level is almost complete. Our next class, {upcoming_class}, starts on {upcoming_start_date}. When you are ready, go to your account and upgrade here: {account_link}. Class details: {class_details}",
};

function toDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string") return value.includes("T") ? value.slice(0, 10) : value.slice(0, 10);
  const date = typeof value?.toDate === "function" ? value.toDate() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function isUpcomingClass(klass = {}, today = new Date().toISOString().slice(0, 10)) {
  const status = String(klass.status || "").toLowerCase();
  const startDate = toDateInputValue(klass.startDate);
  if (["archived", "graduated", "inactive"].includes(status)) return false;
  return status === "upcoming" || (startDate && startDate >= today);
}

function classRegistrationLink(klass = {}) {
  return String(klass.registrationLink || klass.classUrl || klass.link || "").trim();
}

function formatMoney(value, currency = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  const currencyText = String(currency || "").trim();
  return currencyText && !text.includes(currencyText) ? `${currencyText} ${text}` : text;
}

function formatScheduleRules(rules = []) {
  if (!Array.isArray(rules) || !rules.length) return "";
  return rules
    .map((rule) => {
      const day = String(rule.day || rule.weekday || "").trim();
      const time = String(rule.time || rule.startTime || "").trim();
      return [day, time].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .join(", ");
}

function buildClassDetails(klass = {}) {
  const details = [
    ["Start date", toDateInputValue(klass.startDate)],
    ["End date", toDateInputValue(klass.endDate)],
    ["Price", formatMoney(klass.price || klass.fee || klass.tuition, klass.currency)],
    ["Schedule", formatScheduleRules(klass.scheduleRules)],
    ["Timezone", klass.timezone],
    ["Registration link", classRegistrationLink(klass)],
    ["Account upgrade link", ACCOUNT_UPGRADE_LINK],
  ];

  return details
    .filter(([, value]) => String(value || "").trim())
    .map(([label, value]) => `${label}: ${value}`)
    .join("; ");
}

function buildUpcomingClassAnnouncement(template, klass = {}) {
  const upcomingClass = String(klass.name || klass.className || klass.classId || "").trim();
  const startDate = toDateInputValue(klass.startDate) || "soon";
  const link = classRegistrationLink(klass) || ACCOUNT_UPGRADE_LINK;
  const classDetails = buildClassDetails(klass) || `Account upgrade link: ${ACCOUNT_UPGRADE_LINK}`;
  return template.announcement
    .replaceAll("{upcoming_class}", upcomingClass || "the next class")
    .replaceAll("{upcoming_start_date}", startDate)
    .replaceAll("{registration_link}", link)
    .replaceAll("{account_link}", ACCOUNT_UPGRADE_LINK)
    .replaceAll("{class_details}", classDetails);
}

const fieldStyle = { display: "grid", gap: 6 };
const inputStyle = { padding: 10, borderRadius: 8, border: "1px solid #d0d7de" };

export default function CommunicationPage() {
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [form, setForm] = useState({
    announcement: "",
    className: "",
    date: new Date().toISOString().slice(0, 10),
    link: "",
    topic: "",
    email: "",
    attachCertificate: false,
    certLevel: "",
    studentId: "",
    studentName: "",
    promoClassId: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingClasses(true);
      try {
        const rows = await listClasses();
        setClasses(rows);
      } catch {
        setClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    })();
  }, []);

  useEffect(() => {
    const className = form.className.trim();
    if (!className || className === ALL_ACTIVE_AUDIENCE) {
      setStudents([]);
      return;
    }

    (async () => {
      setLoadingStudents(true);
      try {
        const rows = await listStudentsByClass(className);
        setStudents(rows);
      } catch {
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, [form.className]);

  const upcomingClasses = useMemo(() => classes.filter((klass) => isUpcomingClass(klass)), [classes]);

  const canSubmit = useMemo(() => {
    return Boolean(form.announcement.trim() && form.className.trim() && form.date.trim() && !saving);
  }, [form.announcement, form.className, form.date, saving]);

  function updateField(field, value) {
    setForm((current) => {
      if (field === "className") {
        return { ...current, className: value, studentId: "", studentName: "" };
      }
      return { ...current, [field]: value };
    });
  }

  function onSelectStudent(studentId) {
    const selectedStudent = students.find((student) => String(student.id || "") === studentId);

    setForm((current) => ({
      ...current,
      studentId,
      email: selectedStudent ? String(selectedStudent.email || selectedStudent.contactEmail || "") : current.email,
      studentName: selectedStudent ? String(selectedStudent.name || "") : "",
      announcement:
        selectedStudent && current.announcement.includes("{student_name}")
          ? current.announcement.replaceAll("{student_name}", String(selectedStudent.name || ""))
          : current.announcement,
    }));
  }

  function applyTemplate(template) {
    setForm((current) => ({
      ...current,
      topic: template.topic,
      announcement: template.announcement,
      attachCertificate: Boolean(template.attachCertificate),
    }));
  }

  function applyUpcomingClassPromo(classId) {
    const selectedClass = classes.find((klass) => String(klass.classId || klass.id || klass.name || "") === classId);

    setForm((current) => ({
      ...current,
      promoClassId: classId,
      topic: UPCOMING_CLASS_PROMO.topic,
      announcement: selectedClass ? buildUpcomingClassAnnouncement(UPCOMING_CLASS_PROMO, selectedClass) : UPCOMING_CLASS_PROMO.announcement,
      link: selectedClass ? classRegistrationLink(selectedClass) || ACCOUNT_UPGRADE_LINK : current.link,
    }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const receipt = await saveAnnouncementRow(form);

      if (receipt?.sheet?.success && receipt?.sheet?.unverified) {
        toast.info(receipt.sheet.message || "Broadcast request was sent, but the browser cannot verify sheet delivery.");
      } else if (receipt?.sheet?.success || receipt?.firestore?.success) {
        toast.success(receipt?.sheet?.message || receipt?.firestore?.message || "Broadcast saved successfully.");
      }

      setForm((current) => ({
        ...current,
        announcement: "",
        link: "",
        topic: "",
        email: "",
        attachCertificate: false,
        certLevel: "",
        studentId: "",
        studentName: "",
        promoClassId: "",
      }));
    } catch (error) {
      toast.error(error?.message || "Failed to save broadcast.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 16, maxWidth: 860 }}>
      <div>
        <h2 style={{ marginBottom: 6 }}>Communication</h2>
        <p style={{ marginTop: 0, opacity: 0.8 }}>
          Save tutor broadcasts in-app and auto-send each entry to your announcement sheet.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[...QUICK_TEMPLATES, UPCOMING_CLASS_PROMO].map((template) => (
          <button key={template.label} type="button" onClick={() => applyTemplate(template)}>
            {template.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={fieldStyle}>
          <span>Announcement *</span>
          <textarea
            style={{ ...inputStyle, minHeight: 90 }}
            value={form.announcement}
            onChange={(event) => updateField("announcement", event.target.value)}
            placeholder="Broadcast message"
            required
          />
        </label>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label style={fieldStyle}>
            <span>Audience class *</span>
            <select
              style={inputStyle}
              value={form.className}
              onChange={(event) => updateField("className", event.target.value)}
              disabled={loadingClasses}
              required
            >
              <option value="">{loadingClasses ? "Loading classes..." : "Select audience"}</option>
              <option value={ALL_ACTIVE_AUDIENCE}>{ALL_ACTIVE_AUDIENCE_LABEL} — sends all_active to sheet</option>
              {classes.map((klass) => {
                const className = String(klass.name || klass.className || klass.classId || klass.id || "").trim();
                return className ? <option key={klass.classId || klass.id || className} value={className}>{className}</option> : null;
              })}
            </select>
            <small style={{ opacity: 0.75 }}>
              Selecting {ALL_ACTIVE_AUDIENCE_LABEL} writes <code>{ALL_ACTIVE_AUDIENCE}</code> in the sheet class column.
            </small>
          </label>


          <label style={fieldStyle}>
            <span>Promote upcoming class</span>
            <select
              style={inputStyle}
              value={form.promoClassId}
              onChange={(event) => applyUpcomingClassPromo(event.target.value)}
              disabled={loadingClasses}
            >
              <option value="">Select upcoming class to advertise</option>
              {upcomingClasses.map((klass) => {
                const classId = String(klass.classId || klass.id || klass.name || "");
                const startDate = toDateInputValue(klass.startDate);
                return (
                  <option key={classId} value={classId}>
                    {klass.name || klass.classId}{startDate ? ` — starts ${startDate}` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Student</span>
            <select
              style={inputStyle}
              value={form.studentId}
              onChange={(event) => onSelectStudent(event.target.value)}
              disabled={!form.className.trim() || form.className === ALL_ACTIVE_AUDIENCE || loadingStudents}
            >
              <option value="">{loadingStudents ? "Loading students..." : "Select student (optional)"}</option>
              {students.map((student) => {
                const studentId = String(student.id || "");
                return (
                  <option key={studentId} value={studentId}>
                    {student.name || "Unnamed student"}
                  </option>
                );
              })}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Date *</span>
            <input type="date" style={inputStyle} value={form.date} onChange={(event) => updateField("date", event.target.value)} required />
          </label>

          <label style={fieldStyle}>
            <span>Topic</span>
            <input style={inputStyle} value={form.topic} onChange={(event) => updateField("topic", event.target.value)} placeholder="Topic" />
          </label>

          <label style={fieldStyle}>
            <span>Email</span>
            <input
              type="email"
              style={inputStyle}
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="Optional target email"
            />
          </label>

          <label style={fieldStyle}>
            <span>Link</span>
            <input style={inputStyle} value={form.link} onChange={(event) => updateField("link", event.target.value)} placeholder="Meeting/Document link" />
          </label>

          <label style={fieldStyle}>
            <span>Certificate Level</span>
            <input
              style={inputStyle}
              value={form.certLevel}
              onChange={(event) => updateField("certLevel", event.target.value)}
              placeholder="A1, A2, B1..."
            />
          </label>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={form.attachCertificate}
            onChange={(event) => updateField("attachCertificate", event.target.checked)}
          />
          Attach certificate
        </label>

        <div>
          <button type="submit" disabled={!canSubmit}>
            {saving ? "Saving..." : "Save broadcast"}
          </button>
        </div>
      </form>
    </div>
  );
}

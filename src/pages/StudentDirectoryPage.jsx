import { useEffect, useMemo, useState } from "react";
import { createStudent, listAllStudents, updateStudentById } from "../services/studentsService";
import { useToast } from "../context/ToastContext";
import StudentSupportTools from "../components/StudentSupportTools";

const editableFields = [
  "email",
  "phone",
  "studentCode",
  "level",
  "className",
  "program",
  "location",
  "status",
  "tuitionFee",
  "initialPaymentAmount",
  "paymentIntentAmount",
  "balanceDue",
  "paymentStatus",
  "contractStart",
  "contractEnd",
  "contractTermMonths",
];

const dateFields = new Set(["contractStart", "contractEnd"]);

const fieldLabels = {
  email: "Email",
  phone: "Phone",
  studentCode: "Student code",
  level: "Level",
  className: "Class name",
  program: "Program",
  location: "Location",
  status: "Status",
  tuitionFee: "Tuition fee",
  initialPaymentAmount: "Initial payment amount",
  paymentIntentAmount: "Payment intent amount",
  balanceDue: "Balance due",
  paymentStatus: "Payment status",
  contractStart: "Contract start",
  contractEnd: "Contract end",
  contractTermMonths: "Contract term months",
};

const addStudentFields = [
  "name",
  "email",
  "phone",
  "studentCode",
  "studentcode",
  "className",
  "level",
  "location",
  "learningMode",
  "program",
  "address",
  "tuitionFee",
  "initialPaymentAmount",
  "paymentIntentAmount",
  "balanceDue",
  "balance",
  "paid",
  "status",
  "paymentStatus",
  "contractStart",
  "contractEnd",
  "contractTermMonths",
  "enrollDate",
  "dailyLimit",
  "uid",
];

const addStudentLabels = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  studentCode: "Student code",
  studentcode: "Student code (legacy)",
  className: "Class name",
  level: "Level",
  location: "Location",
  learningMode: "Learning mode",
  program: "Program",
  address: "Address",
  tuitionFee: "Tuition fee",
  initialPaymentAmount: "Initial payment amount",
  paymentIntentAmount: "Payment intent amount",
  balanceDue: "Balance due",
  balance: "Balance",
  paid: "Paid",
  status: "Status",
  paymentStatus: "Payment status",
  contractStart: "Contract start",
  contractEnd: "Contract end",
  contractTermMonths: "Contract term months",
  enrollDate: "Enroll date",
  dailyLimit: "Daily limit",
  uid: "UID",
};

const addStudentDefaultDraft = {
  name: "",
  email: "",
  phone: "",
  studentCode: "",
  studentcode: "",
  className: "",
  level: "",
  location: "",
  learningMode: "",
  program: "",
  address: "",
  tuitionFee: "0",
  initialPaymentAmount: "0",
  paymentIntentAmount: "0",
  balanceDue: "0",
  balance: "0",
  paid: "0",
  status: "Paid",
  paymentStatus: "Paid",
  contractStart: "",
  contractEnd: "",
  contractTermMonths: "2",
  enrollDate: "",
  dailyLimit: "0",
  uid: "",
};

const addStudentNumericFields = new Set(["balance", "paid", "dailyLimit"]);
const addStudentDateFields = new Set(["contractStart", "contractEnd"]);

const followUpTemplates = [
  {
    key: "balance",
    label: "Balance reminder",
    helper: "For students who still owe fees.",
  },
  {
    key: "assignment",
    label: "Assignment reminder",
    helper: "For students who have not submitted class work.",
  },
  {
    key: "exam",
    label: "Exam practice reminder",
    helper: "For Goethe/exam preparation follow-up.",
  },
  {
    key: "contract",
    label: "Contract ending reminder",
    helper: "For students whose class contract is ending soon.",
  },
  {
    key: "classUpdate",
    label: "Class update",
    helper: "General update for class time, level, or learning plan.",
  },
];

function buildStudentCodeFromName(name) {
  const safeName = String(name || "")
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");
  const suffix = Math.floor(Math.random() * 900 + 100);
  return safeName ? `${safeName}${suffix}` : `student${Date.now()}`;
}

function normalizeEditableValue(value) {
  return String(value ?? "");
}

function normalizeDateValue(value) {
  const raw = normalizeEditableValue(value).trim();
  if (!raw) return "";

  const asDate = new Date(raw);
  if (Number.isNaN(asDate.getTime())) return raw;

  const utcYear = asDate.getUTCFullYear();
  const utcMonth = String(asDate.getUTCMonth() + 1).padStart(2, "0");
  const utcDay = String(asDate.getUTCDate()).padStart(2, "0");
  return `${utcYear}-${utcMonth}-${utcDay}`;
}

function toNumber(value) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatGhs(value) {
  const amount = toNumber(value);
  return `GHS ${amount.toLocaleString("en-GH", { maximumFractionDigits: 2 })}`;
}

function displayValue(...values) {
  return values.map((value) => String(value ?? "").trim()).find(Boolean) || "";
}

function resolveStudentName(student) {
  return displayValue(student?.name, student?.displayName, student?.studentCode, student?.id) || "Student";
}

function resolveStudentPhone(student, draft = {}) {
  return displayValue(draft.phone, student?.phone, student?.whatsapp, student?.phoneNumber, student?.guardianPhone);
}

function resolveStudentClass(student, draft = {}) {
  return displayValue(draft.className, draft.level, draft.program, student?.className, student?.level, student?.program, student?.location) || "your German class";
}

function resolveBalance(student, draft = {}) {
  return displayValue(draft.balanceDue, student?.balanceDue, student?.balance, student?.outstandingBalance, student?.amountDue);
}

function resolveContractEnd(student, draft = {}) {
  return displayValue(draft.contractEnd, student?.contractEnd);
}

function daysUntilDate(value) {
  const normalized = normalizeDateValue(value);
  if (!normalized) return null;
  const target = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function formatDisplayDate(value) {
  const normalized = normalizeDateValue(value);
  if (!normalized) return "not set";
  const date = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return normalized;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizePhoneForWhatsapp(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

function buildFollowUpMessage(templateKey, student, draft = {}) {
  const name = resolveStudentName(student);
  const className = resolveStudentClass(student, draft);
  const balance = resolveBalance(student, draft);
  const contractEnd = resolveContractEnd(student, draft);
  const daysLeft = daysUntilDate(contractEnd);
  const contractDate = formatDisplayDate(contractEnd);

  if (templateKey === "balance") {
    const balanceText = toNumber(balance) > 0 ? formatGhs(balance) : "your outstanding balance";
    return `Hello ${name}, this is a reminder from Learn Language Education Academy / Falowen. Your ${className} record shows a balance of ${balanceText}. Kindly make payment early so your learning can continue smoothly. Please update us after payment. Thank you.`;
  }

  if (templateKey === "assignment") {
    return `Hello ${name}, kindly remember to complete and submit your pending ${className} assignment. Consistent practice is very important for your German progress. Please submit it and update us when done.`;
  }

  if (templateKey === "exam") {
    return `Hello ${name}, this is your exam practice reminder. Please practise one German task today: Schreiben, Sprechen, Lesen, or Hören. Focus on your weak area and send an update on your progress. Do not wait until exam week before practising.`;
  }

  if (templateKey === "contract") {
    const remainingText = daysLeft == null ? "soon" : daysLeft <= 0 ? "today or has already ended" : `in ${daysLeft} day(s)`;
    return `Hello ${name}, your ${className} learning contract ends ${remainingText}${contractEnd ? ` (${contractDate})` : ""}. Kindly contact us if you want to continue, renew, or complete any pending payment/assignment before the end date.`;
  }

  return `Hello ${name}, this is an update from Learn Language Education Academy / Falowen concerning your ${className}. Kindly check your class information, continue your lessons consistently, and contact us if you need help. Thank you.`;
}

function whatsappUrl(phone, message) {
  const normalizedPhone = normalizePhoneForWhatsapp(phone);
  if (!normalizedPhone) return "";
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export default function StudentDirectoryPage() {
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState("directory");
  const [students, setStudents] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [query, setQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [createDraft, setCreateDraft] = useState(addStudentDefaultDraft);
  const [error, setError] = useState("");
  const [followUpType, setFollowUpType] = useState("balance");
  const [followUpMessage, setFollowUpMessage] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const records = await listAllStudents();
        setStudents(records);
      } catch (err) {
        setError(err?.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return students;

    return students.filter((student) => {
      const haystack = [
        student.name,
        student.email,
        student.studentCode,
        student.className,
        student.status,
        student.phone,
        student.level,
        student.program,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return haystack.includes(normalizedQuery);
    });
  }, [students, query]);

  useEffect(() => {
    if (filteredStudents.length === 0) {
      setSelectedStudentId("");
      return;
    }

    const hasSelected = filteredStudents.some((student) => student.id === selectedStudentId);
    if (!hasSelected) {
      setSelectedStudentId(filteredStudents[0].id);
    }
  }, [filteredStudents, selectedStudentId]);

  const getDraft = (student) => {
    const currentDraft = drafts[student.id];
    if (currentDraft) return currentDraft;

    return editableFields.reduce((acc, field) => {
      const normalized = dateFields.has(field) ? normalizeDateValue(student[field]) : normalizeEditableValue(student[field]);
      acc[field] = normalized;
      return acc;
    }, {});
  };

  const selectedStudent = useMemo(
    () => filteredStudents.find((student) => student.id === selectedStudentId) || null,
    [filteredStudents, selectedStudentId],
  );

  useEffect(() => {
    if (!selectedStudent) {
      setFollowUpMessage("");
      return;
    }
    setFollowUpMessage(buildFollowUpMessage(followUpType, selectedStudent, getDraft(selectedStudent)));
  }, [followUpType, selectedStudent, selectedStudentId, drafts]);

  const updateDraftField = (studentId, field, value, student) => {
    setDrafts((prev) => {
      const existing = prev[studentId] || getDraft(student);
      return {
        ...prev,
        [studentId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const saveStudent = async (student) => {
    const draft = getDraft(student);
    const payload = {};

    for (const field of editableFields) {
      const incomingValue = normalizeEditableValue(draft[field]).trim();
      const originalValue = dateFields.has(field)
        ? normalizeDateValue(student[field]).trim()
        : normalizeEditableValue(student[field]).trim();

      if (incomingValue !== originalValue) {
        payload[field] = incomingValue;
      }
    }

    if (Object.keys(payload).length === 0) {
      pushToast({ type: "info", message: `No changes to save for ${student.name || student.id}.` });
      return;
    }

    setSavingId(student.id);
    try {
      await updateStudentById(student.id, payload);
      setStudents((prev) => prev.map((record) => (record.id === student.id ? { ...record, ...payload } : record)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[student.id];
        return next;
      });
      pushToast({ type: "success", message: `Saved ${student.name || student.id}.` });
    } catch (err) {
      pushToast({ type: "error", message: err?.message || "Failed to save student" });
    } finally {
      setSavingId("");
    }
  };

  const handleSupportStudentUpdated = (studentId, payload) => {
    setStudents((prev) => prev.map((record) => (record.id === studentId ? { ...record, ...payload } : record)));
    setDrafts((prev) => {
      const existing = prev[studentId];
      if (!existing) return prev;
      return {
        ...prev,
        [studentId]: {
          ...existing,
          ...payload,
        },
      };
    });
  };

  const updateCreateDraftField = (field, value) => {
    setCreateDraft((prev) => ({ ...prev, [field]: value }));
  };

  const createStudentRecord = async () => {
    const name = normalizeEditableValue(createDraft.name).trim();
    if (!name) {
      pushToast({ type: "error", message: "Name is required to create a student." });
      return;
    }

    const candidateCode = normalizeEditableValue(createDraft.studentCode || createDraft.studentcode).trim();
    const studentCode = candidateCode || buildStudentCodeFromName(name);
    const studentId = studentCode;
    const nextPayload = {
      ...createDraft,
      name,
      studentCode,
      studentcode: studentCode,
      notificationsLastSeenAt: Date.now(),
    };

    for (const field of addStudentFields) {
      const incoming = normalizeEditableValue(nextPayload[field]).trim();
      if (addStudentNumericFields.has(field)) {
        const parsed = Number(incoming || "0");
        nextPayload[field] = Number.isFinite(parsed) ? parsed : 0;
      } else if (addStudentDateFields.has(field)) {
        nextPayload[field] = incoming;
      } else {
        nextPayload[field] = incoming;
      }
    }

    setCreatingStudent(true);
    try {
      await createStudent(studentId, nextPayload);
      const records = await listAllStudents();
      setStudents(records);
      setCreateDraft(addStudentDefaultDraft);
      setSelectedStudentId(studentId);
      setActiveTab("directory");
      pushToast({ type: "success", message: `Created ${name}.` });
    } catch (err) {
      pushToast({ type: "error", message: err?.message || "Failed to create student" });
    } finally {
      setCreatingStudent(false);
    }
  };

  const copyFollowUpMessage = async () => {
    if (!followUpMessage.trim()) return;
    try {
      await navigator.clipboard.writeText(followUpMessage);
      pushToast({ type: "success", message: "WhatsApp message copied." });
    } catch {
      pushToast({ type: "info", message: "Select and copy the message manually." });
    }
  };

  const openWhatsappFollowUp = () => {
    if (!selectedStudent) return;
    const phone = resolveStudentPhone(selectedStudent, getDraft(selectedStudent));
    const url = whatsappUrl(phone, followUpMessage);
    if (!url) {
      pushToast({ type: "error", message: "This student has no valid WhatsApp/phone number." });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ display: "grid", gap: 12, padding: 16 }}>
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 14, background: "#fff" }}>
        <h1 style={{ margin: "0 0 8px" }}>Student Directory</h1>
        <p style={{ margin: "0 0 12px", opacity: 0.8 }}>
          Open one student at a time to view details, edit records, and generate WhatsApp follow-up messages.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            style={{
              border: activeTab === "directory" ? "1px solid #2563eb" : "1px solid #d1d5db",
              background: activeTab === "directory" ? "#eff6ff" : "#fff",
              color: "#1a2233",
            }}
          >
            Student Directory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("add")}
            style={{
              border: activeTab === "add" ? "1px solid #2563eb" : "1px solid #d1d5db",
              background: activeTab === "add" ? "#eff6ff" : "#fff",
              color: "#1a2233",
            }}
          >
            Add Student
          </button>
        </div>

        {activeTab === "directory" && (
          <>
            <label htmlFor="student-search" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              Search students
            </label>
            <input
              id="student-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, class, student code..."
              style={{ width: "100%", maxWidth: 460, padding: "8px 10px", borderRadius: 8, border: "1px solid #ccd4e2" }}
            />
          </>
        )}
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 14, background: "#fff" }}>
        {activeTab === "directory" && (
          <>
            {loading && <p>Loading students...</p>}
            {error && <p style={{ color: "#a00000" }}>❌ {error}</p>}

            {!loading && !error && (
              <>
                <p style={{ marginTop: 0 }}>
                  Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> student records.
                </p>

                {filteredStudents.length === 0 && <p>No students found for this search.</p>}

                {filteredStudents.length > 0 && (
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                    <aside style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, maxHeight: 520, overflowY: "auto" }}>
                      {filteredStudents.map((student) => {
                        const isSelected = student.id === selectedStudentId;
                        return (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => setSelectedStudentId(student.id)}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              border: isSelected ? "1px solid #2563eb" : "1px solid #e5e7eb",
                              background: isSelected ? "#eff6ff" : "#fff",
                              borderRadius: 8,
                              padding: "10px 8px",
                              marginBottom: 8,
                              cursor: "pointer",
                              color: "#1a2233",
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{student.name || "Unnamed"}</div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>{student.studentCode || "No student code"}</div>
                            <div style={{ fontSize: 12, opacity: 0.75 }}>{student.className || "No class"}</div>
                          </button>
                        );
                      })}
                    </aside>

                    {selectedStudent && (
                      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
                        <h2 style={{ marginTop: 0, marginBottom: 8 }}>{selectedStudent.name || "Student details"}</h2>
                        <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.75 }}>
                          Edit this student profile and save changes.
                        </p>

                        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
                          {editableFields.map((field) => {
                            const draft = getDraft(selectedStudent);
                            const isSaving = savingId === selectedStudent.id;
                            return (
                              <label key={`${selectedStudent.id}-${field}`} style={{ display: "grid", gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{fieldLabels[field] || field}</span>
                                <input
                                  type={dateFields.has(field) ? "date" : "text"}
                                  value={draft[field]}
                                  onChange={(event) => updateDraftField(selectedStudent.id, field, event.target.value, selectedStudent)}
                                  style={{ width: "100%", padding: "8px 9px", borderRadius: 6, border: "1px solid #ccd4e2" }}
                                  disabled={isSaving}
                                />
                              </label>
                            );
                          })}
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <button
                            type="button"
                            onClick={() => saveStudent(selectedStudent)}
                            disabled={savingId === selectedStudent.id}
                          >
                            {savingId === selectedStudent.id ? "Saving..." : "Save student"}
                          </button>
                        </div>

                        <StudentSupportTools
                          student={selectedStudent}
                          draft={getDraft(selectedStudent)}
                          onStudentUpdated={handleSupportStudentUpdated}
                          pushToast={pushToast}
                        />

                        <section
                          style={{
                            marginTop: 18,
                            border: "1px solid #c7d2fe",
                            borderRadius: 14,
                            padding: 14,
                            background: "linear-gradient(135deg, #eef2ff, #ffffff)",
                            display: "grid",
                            gap: 12,
                          }}
                        >
                          <div>
                            <h3 style={{ margin: "0 0 4px" }}>WhatsApp follow-up generator</h3>
                            <p style={{ margin: 0, color: "#64748b" }}>
                              Generate a ready message for balances, assignments, exams, contract renewal, or class updates.
                            </p>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                            {followUpTemplates.map((template) => (
                              <button
                                key={template.key}
                                type="button"
                                onClick={() => setFollowUpType(template.key)}
                                style={{
                                  textAlign: "left",
                                  border: followUpType === template.key ? "1px solid #4f46e5" : "1px solid #cbd5e1",
                                  background: followUpType === template.key ? "#eef2ff" : "#fff",
                                  color: "#0f172a",
                                  borderRadius: 12,
                                  padding: "10px 12px",
                                  boxShadow: followUpType === template.key ? "0 12px 28px -22px rgba(79,70,229,.9)" : "none",
                                }}
                              >
                                <strong style={{ display: "block" }}>{template.label}</strong>
                                <small style={{ color: "#64748b" }}>{template.helper}</small>
                              </button>
                            ))}
                          </div>

                          <label style={{ display: "grid", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Generated message</span>
                            <textarea
                              rows={6}
                              value={followUpMessage}
                              onChange={(event) => setFollowUpMessage(event.target.value)}
                              style={{
                                width: "100%",
                                border: "1px solid #cbd5e1",
                                borderRadius: 12,
                                padding: 12,
                                background: "#fff",
                                minHeight: 140,
                              }}
                            />
                          </label>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button type="button" onClick={openWhatsappFollowUp}>
                              Open WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={copyFollowUpMessage}
                              style={{ background: "#fff", color: "#1a2233", border: "1px solid #cbd5e1" }}
                            >
                              Copy message
                            </button>
                            <button
                              type="button"
                              onClick={() => setFollowUpMessage(buildFollowUpMessage(followUpType, selectedStudent, getDraft(selectedStudent)))}
                              style={{ background: "#fff", color: "#1a2233", border: "1px solid #cbd5e1" }}
                            >
                              Reset text
                            </button>
                          </div>

                          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                            Phone used: <strong>{resolveStudentPhone(selectedStudent, getDraft(selectedStudent)) || "No phone number found"}</strong>
                          </p>
                        </section>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "add" && (
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Add student</h2>
            <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.8 }}>
              Create a new student record in Firestore with the same structure used in existing student documents.
            </p>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
              {addStudentFields.map((field) => (
                <label key={`create-${field}`} style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{addStudentLabels[field] || field}</span>
                  <input
                    type={addStudentDateFields.has(field) ? "date" : "text"}
                    value={createDraft[field]}
                    onChange={(event) => updateCreateDraftField(field, event.target.value)}
                    style={{ width: "100%", padding: "8px 9px", borderRadius: 6, border: "1px solid #ccd4e2" }}
                    disabled={creatingStudent}
                  />
                </label>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="button" onClick={createStudentRecord} disabled={creatingStudent}>
                {creatingStudent ? "Creating..." : "Create student"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

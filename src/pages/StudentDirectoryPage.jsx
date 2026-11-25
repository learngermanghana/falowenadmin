import { extendContractDate } from "../utils/contractExtension.js";
import "./StudentDirectoryPage.css";
import { STUDENT_DETAIL_TABS, nextStudentDetailTab } from "../utils/studentDetailTabs.js";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createStudent, listAllStudents, updateStudentById, activateExistingStudentTrial, reviewUniversityStudent } from "../services/studentsService";
import { listClassCohorts } from "../services/liveClassService";
import { useToast } from "../context/ToastContext";
import StudentSupportTools from "../components/StudentSupportTools";
import StudentAccountActivationPanel from "../components/StudentAccountActivationPanel.jsx";
import SignupAccountLookup from "../components/SignupAccountLookup.jsx";
import StudentPaymentTools from "../components/StudentPaymentTools";
import StudentLevelEnrollments from "../components/StudentLevelEnrollments";
import StudentUpgradeTools from "../components/StudentUpgradeTools";
import CompletionPackPanel from "../components/CompletionPackPanel.jsx";
import BrochureWhatsappPanel from "../components/BrochureWhatsappPanel.jsx";
import { StudentClassTransferDisclosure } from "../components/StudentClassTransferPanel.jsx";
import StudentAccessOverview from "../components/StudentAccessOverview.jsx";
import StudentCourseTypePanel, { resolveCourseType } from "../components/StudentCourseTypePanel.jsx";
import StudentLearningStatusPanel from "../components/StudentLearningStatusPanel.jsx";
import StudentEmergencyContact from "../components/StudentEmergencyContact.jsx";
import { matchesStudentDirectorySearch } from "../utils/studentDirectorySearch.js";
import { emergencyContactEditorValues, emergencyContactEditedFields } from "../utils/studentEmergencyContact.js";
import { calculatePaystackCharge, calculatePaystackGrossAmount, parseMoneyValue, PAYSTACK_CHARGE_RATE, STUDENT_PAYSTACK_CHARGE_SHARE } from "../utils/paystackCharges";
import { getEffectiveClassEndDate } from "../utils/liveClassScheduling";
import { isArchivedStudent, isTrialOrUnpaidStudent, resolveStudentLearningStatus, sortStudentsByAttention, summarizeStudentAttention } from "../utils/studentAttention";

const editableFields = STUDENT_DETAIL_TABS.flatMap((tab) => tab.fields);

const dateFields = new Set(["contractStart", "contractEnd"]);
const STATUS_CHOICES = {
  status: ["Paid", "Active", "Pending", "trial_active", "trial_expired", "Expired", "Archived"],
  paymentStatus: ["Paid", "Partially Paid", "Pending", "Unpaid", "Overdue", "Expired"],
};
function statusOptions(field, current) {
  return [...new Set([...(STATUS_CHOICES[field] || []), String(current || "").trim()].filter(Boolean))];
}


const fieldLabels = {
  name: "Name",
  email: "Contact email",
  phone: "Phone",
  emergencyContactPhoneNumber: "Emergency contact number",
  studentCode: "Student code",
  level: "Level",
  className: "Class name",
  program: "Course languages",
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

const courseLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
const languageName = program => program === "swahili" ? "Swahili" : "German";

const addStudentFields = [
  "name",
  "email",
  "phone",
  "emergencyContactPhoneNumber",
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
];

const addStudentLabels = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  emergencyContactPhoneNumber: "Emergency contact number",
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
};

const addStudentDefaultDraft = {
  name: "",
  email: "",
  phone: "",
  emergencyContactPhoneNumber: "",
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
  status: "Pending",
  paymentStatus: "Pending",
  contractStart: "",
  contractEnd: "",
  contractTermMonths: "6",
  enrollDate: "",
  dailyLimit: "0",
};

const addStudentNumericFields = new Set(["tuitionFee", "initialPaymentAmount", "paymentIntentAmount", "balanceDue", "balance", "paid", "dailyLimit"]);
const addStudentDateFields = new Set(["contractStart", "contractEnd"]);
const REVIEW_LINK = "https://g.page/r/Cdogveq3Hy69EBM/review";

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
  {
    key: "review",
    label: "Review request",
    helper: "Send the Google review link for course, school, and app feedback.",
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
  return parseMoneyValue(value);
}

function formatGhs(value) {
  const amount = toNumber(value);
  return `GHS ${amount.toLocaleString("en-GH", { maximumFractionDigits: 2 })}`;
}

function displayValue(...values) {
  return values.map((value) => String(value ?? "").trim()).find(Boolean) || "";
}

function normalizeClassLookupValue(value) {
  return displayValue(value).toLowerCase();
}

function findStudentClass(student = {}, draft = {}, classes = []) {
  const wanted = [draft.className, student.className, draft.level, student.level, draft.program, student.program, student.location]
    .map(normalizeClassLookupValue)
    .filter(Boolean);
  if (!wanted.length) return null;

  return classes.find((klass) => {
    const candidates = [klass.id, klass.name, klass.className, klass.title, klass.levelId, klass.level, klass.program, klass.location]
      .map(normalizeClassLookupValue)
      .filter(Boolean);
    return wanted.some((value) => candidates.includes(value));
  }) || null;
}

function resolveStudentName(student) {
  return displayValue(student?.name, student?.displayName, student?.studentCode, student?.id) || "Student";
}

function resolveStudentPhone(student, draft = {}) {
  return displayValue(draft.phone, student?.phone, student?.whatsapp, student?.phoneNumber, student?.guardianPhone);
}

function resolveStudentClass(student, draft = {}) {
  const upgradeLevel = String(student?.upgradeStatus || "").toLowerCase() === "pending"
    ? displayValue(student?.paymentReminderLevel, student?.upgradeToLevel)
    : "";
  return displayValue(upgradeLevel, draft.className, draft.level, draft.program, student?.className, student?.level, student?.program, student?.location) || "your German class";
}

function resolveBalance(student, draft = {}) {
  return displayValue(draft.balanceDue, student?.balanceDue, student?.balance, student?.outstandingBalance, student?.amountDue);
}

function resolveContractEnd(student, draft = {}, classes = []) {
  const explicitEnd = displayValue(draft.contractEnd, student?.contractEnd);
  if (explicitEnd) return explicitEnd;

  const klass = findStudentClass(student, draft, classes);
  return klass ? getEffectiveClassEndDate(klass) : "";
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

function callUrl(phone) {
  const normalizedPhone = String(phone || "").trim().replace(/(?!^)\+|[^\d+]/g, "");
  return normalizedPhone ? `tel:${normalizedPhone}` : "";
}

function buildFollowUpMessage(templateKey, student, draft = {}, classes = []) {
  const name = resolveStudentName(student);
  const className = resolveStudentClass(student, draft);
  const balance = resolveBalance(student, draft);
  const contractEnd = resolveContractEnd(student, draft, classes);
  const daysLeft = daysUntilDate(contractEnd);
  const contractDate = formatDisplayDate(contractEnd);

  if (templateKey === "balance") {
    const balanceText = toNumber(balance) > 0 ? formatGhs(balance) : "your outstanding balance";
    const paymentLink = displayValue(
      student?.paymentLink,
      student?.paystackPaymentLink,
      student?.checkoutUrl,
      student?.paymentUrl,
    );
    const accessText = contractEnd
      ? `If the balance is still unpaid, your Falowen access is scheduled to stop on ${contractDate}.`
      : "Please make payment early so your Falowen access can continue without interruption.";
    const paymentText = paymentLink
      ? `You can pay here: ${paymentLink}`
      : "Please contact us if you need a payment link.";
    return `Hello ${name}, this is a payment reminder from Learn Language Education Academy / Falowen. Your ${className} outstanding balance is ${balanceText}. ${accessText} ${paymentText} Please update us after payment. Thank you.`;
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

  if (templateKey === "review") {
    return `Hello ${name}, thank you for learning with Learn Language Education Academy / Falowen. Please share a review about your course, the school, and the app here: ${REVIEW_LINK}. Your feedback helps us improve and helps other students find us. Thank you.`;
  }

  return `Hello ${name}, this is an update from Learn Language Education Academy / Falowen concerning your ${className}. Kindly check your class information, continue your lessons consistently, and contact us if you need help. Thank you.`;
}

function whatsappUrl(phone, message) {
  const normalizedPhone = normalizePhoneForWhatsapp(phone);
  if (!normalizedPhone) return "";
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

const SIGNUP_DAY_MS = 24 * 60 * 60 * 1000;
const SIGNUP_DATE_FIELDS = [
  "signupAt", "signupDate", "registeredAt", "registered_at",
  "registrationDate", "registration_date", "joinedAt", "joined_at",
  "createdAt", "created_at", "enrollDate", "enrollmentDate",
];
const signupDateFormatter = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeZone: "Africa/Accra",
});

function getSignupTime(student) {
  for (const field of SIGNUP_DATE_FIELDS) {
    const value = student[field];
    if (!value) continue;
    const time = typeof value.toMillis === "function" ? value.toMillis()
      : typeof value === "string" ? Date.parse(value)
      : value instanceof Date ? value.getTime()
      : typeof value === "number" ? (value < 1e12 ? value * 1000 : value)
      : typeof value.seconds === "number" ? value.seconds * 1000
      : NaN;
    if (Number.isFinite(time) && time > 0) return time;
  }
  return null;
}

function getStudentLanguages({ program, secondaryProgram }) {
  const primary = String(program || "").trim().toLowerCase() || "german";
  const secondary = String(secondaryProgram || "").trim().toLowerCase();
  return [...new Set([primary, secondary])].filter((language) => language === "german" || language === "swahili");
}

const DIRECTORY_VIEWS = new Set(["all", "trials", "attention", "archived", "university"]);

const HAMBURG_SIGNUP_LINK = "https://www.falowen.app/signup?invite=UH-KISWAHILI-A1";

function isHamburgCohortStudent(student) {
  return student?.registrationSource === "university-invite" &&
    student?.institutionId === "university-hamburg" &&
    student?.cohortId === "university-hamburg-kiswahili-a1";
}

function normalizeDirectoryView(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return DIRECTORY_VIEWS.has(normalized) ? normalized : "all";
}

export default function StudentDirectoryPage() {
  const { pushToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const directoryView = normalizeDirectoryView(searchParams.get("view"));
  const [activeTab, setActiveTab] = useState("directory");
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [query, setQuery] = useState(() => searchParams.get("search") || "");
  const [languageFilter, setLanguageFilter] = useState("");
  const [courseTypeFilter, setCourseTypeFilter] = useState("");
  const [signupDays, setSignupDays] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [detailTab, setDetailTab] = useState("overview");
  const [mobileDetails, setMobileDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [createDraft, setCreateDraft] = useState(addStudentDefaultDraft);
  const [activatingTrialId, setActivatingTrialId] = useState("");
  const [reviewingUniversityId, setReviewingUniversityId] = useState("");
  const [error, setError] = useState("");
  const [followUpType, setFollowUpType] = useState("balance");
  const [followUpMessage, setFollowUpMessage] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [records, classRows] = await Promise.all([listAllStudents(), listClassCohorts()]);
        setStudents(records);
        setClasses(classRows);
      } catch (err) {
        setError(err?.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const attentionSummary = useMemo(() => summarizeStudentAttention(students), [students]);
  const attentionStudentIds = useMemo(
    () => new Set(attentionSummary.rows.map(({ student }) => student.id)),
    [attentionSummary.rows],
  );

  const viewStudents = useMemo(() => {
    if (directoryView === "trials") return students.filter((student) => !isHamburgCohortStudent(student) && isTrialOrUnpaidStudent(student));
    if (directoryView === "university") return students.filter(isHamburgCohortStudent);
    if (directoryView === "attention") return sortStudentsByAttention(students).map(({ student }) => student);
    if (directoryView === "archived") return students.filter(isArchivedStudent);
    return students.filter((student) => !isArchivedStudent(student));
  }, [directoryView, students]);

  const directoryCounts = useMemo(() => ({
    all: students.filter((student) => !isArchivedStudent(student)).length,
    trials: students.filter((student) => !isHamburgCohortStudent(student) && isTrialOrUnpaidStudent(student)).length,
    university: students.filter(isHamburgCohortStudent).length,
    attention: attentionSummary.total,
    archived: students.filter(isArchivedStudent).length,
  }), [attentionSummary.total, students]);

  const signupTimes = useMemo(
    () => new Map(students.map((student) => [student.id, getSignupTime(student)])),
    [students],
  );

  const filteredStudents = useMemo(() => {
    const now = Date.now();
    const earliestSignup = now - Number(signupDays) * SIGNUP_DAY_MS;
    const matches = viewStudents.filter((student) => {
      const languages = getStudentLanguages(student);
      if (courseTypeFilter && resolveCourseType(student) !== courseTypeFilter) return false;
      if (languageFilter === "both" ? languages.length !== 2 : languageFilter && !languages.includes(languageFilter)) {
        return false;
      }
      const signupTime = signupTimes.get(student.id);
      if (signupDays && (signupTime === null || signupTime < earliestSignup || signupTime > now)) {
        return false;
      }
      return matchesStudentDirectorySearch(student, query, resolveStudentPhone(student));
    });
    if (signupDays) matches.sort((a, b) => signupTimes.get(b.id) - signupTimes.get(a.id));
    return matches;
  }, [viewStudents, query, languageFilter, courseTypeFilter, signupDays, signupTimes]);

  const selectDirectoryView = (view) => {
    const nextView = normalizeDirectoryView(view);
    const next = new URLSearchParams(searchParams);
    if (nextView === "all") next.delete("view");
    else next.set("view", nextView);
    setSearchParams(next, { replace: true });
    setActiveTab("directory");
  };

  useEffect(() => {
    if (filteredStudents.length === 0) {
      setSelectedStudentId("");
      setMobileDetails(false);
      return;
    }

    const hasSelected = filteredStudents.some((student) => student.id === selectedStudentId);
    if (!hasSelected) {
      setSelectedStudentId(filteredStudents[0].id);
      setDetailTab("overview");
      setMobileDetails(false);
    }
  }, [filteredStudents, selectedStudentId]);

  const getDraft = (student) => {
    const currentDraft = drafts[student.id];
    if (currentDraft) return currentDraft;

    const emergencyFields = emergencyContactEditorValues(student);
    return editableFields.reduce((acc, field) => {
      const normalized = Object.prototype.hasOwnProperty.call(emergencyFields, field)
        ? emergencyFields[field]
        : dateFields.has(field) ? normalizeDateValue(student[field]) : normalizeEditableValue(student[field]);
      acc[field] = field === "program" && student.secondaryProgram ? "both" : normalized;
      return acc;
    }, {});
  };

  const selectedStudent = useMemo(
    () => filteredStudents.find((student) => student.id === selectedStudentId) || null,
    [filteredStudents, selectedStudentId],
  );

  useEffect(() => {
    if (selectedStudent && isHamburgCohortStudent(selectedStudent) && ["payments","payment-links","contracts","enrollments"].includes(detailTab)) {
      setDetailTab("overview");
    }
  }, [selectedStudent, detailTab]);

  useEffect(() => {
    if (!selectedStudent) {
      setFollowUpMessage("");
      return;
    }
    setFollowUpMessage(buildFollowUpMessage(followUpType, selectedStudent, getDraft(selectedStudent), classes));
  }, [followUpType, selectedStudent, selectedStudentId, drafts, classes]);

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

    const emergencyFields = emergencyContactEditorValues(student);
    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(emergencyFields, field)) continue;
      const incomingValue = normalizeEditableValue(draft[field]).trim();
      const originalValue = dateFields.has(field)
        ? normalizeDateValue(student[field]).trim()
        : normalizeEditableValue(student[field]).trim();

      if (field === "program") {
        const primary = String(student.program || "german").toLowerCase();
        const mode = draft.program || primary;
        if (mode !== (student.secondaryProgram ? "both" : primary) || draft.secondaryLevel !== undefined || draft.secondaryClassName !== undefined || draft.grantSecondaryAccess === true || draft.secondaryAccessEnd !== undefined || draft.secondaryContractStart !== undefined || draft.secondaryContractTermMonths !== undefined || draft.secondaryAccessType !== undefined) {
          payload.courseEnrollment = { mode, expectedPrimary: primary, secondaryLevel: draft.secondaryLevel, secondaryClassName: draft.secondaryClassName, grantSecondaryAccess: draft.grantSecondaryAccess, secondaryAccessEnd: draft.secondaryAccessEnd, secondaryContractStart: draft.secondaryContractStart, secondaryContractTermMonths: draft.secondaryContractTermMonths, secondaryAccessType: draft.secondaryAccessType ?? (!student.secondaryProgram && !student.coursePlacements?.[primary === "german" ? "swahili" : "german"] && mode === "both" && !draft.grantSecondaryAccess ? "pending" : undefined) };
        }
        continue;
      }
      if (incomingValue !== originalValue) {
        payload[field] = dateFields.has(field) && !incomingValue ? null : incomingValue;
      }
    }

    Object.assign(payload, emergencyContactEditedFields(student, draft));

    if (Object.keys(payload).length === 0) {
      pushToast({ type: "info", message: `No changes to save for ${student.name || student.id}.` });
      return;
    }

    setSavingId(student.id);
    try {
      const result = await updateStudentById(student.id, payload);
      if (payload.courseEnrollment && !Object.hasOwn(result?.updates || {}, "secondaryProgram")) throw new Error("The enrollment API needs to be deployed. Reload the student and retry.");
      const appliedUpdates = result?.updates || payload;
      setStudents((prev) => prev.map((record) => (record.id === student.id ? { ...record, ...appliedUpdates } : record)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[student.id];
        return next;
      });
      if (Object.prototype.hasOwnProperty.call(payload, "email")) {
        const signInEmail = String(result?.authIdentity?.email || "").trim();
        pushToast({
          type: "success",
          message: signInEmail
            ? `Saved contact email. Falowen sign-in remains linked to ${signInEmail} and the student's Firebase UID.`
            : "Saved contact email. Falowen sign-in remains linked to the student's existing Firebase UID.",
        });
      } else {
        pushToast({ type: "success", message: `Saved ${student.name || student.id}.` });
      }
    } catch (err) {
      pushToast({ type: "error", message: err?.message || "Failed to save student" });
    } finally {
      setSavingId("");
    }
  };


  const reviewUniversityRegistration = async (student, decision) => {
    const isApproved = student.institutionVerification === "approved";
    const studentName = student.name || student.id;
    const confirmation = decision === "revoke"
      ? `Suspend complimentary access for ${studentName} until re-verification?`
      : isApproved
        ? `Complete the Swahili class and six-month contract for ${studentName}?`
        : `Approve complimentary Kiswahili A1 access for ${studentName}? Verify this student belongs to Ruth's University of Hamburg course first.`;
    if (!window.confirm(confirmation)) return;
    setReviewingUniversityId(student.id);
    try {
      const result = await reviewUniversityStudent(student.id, decision);
      setStudents((previous) => previous.map((record) => record.id === student.id
        ? { ...record, ...result.updates } : record));
      if (decision === "approve") {
        setDrafts((previous) => {
          if (!previous[student.id]) return previous;
          const draft = { ...previous[student.id] };
          for (const field of dateFields) {
            if (Object.hasOwn(result.updates || {}, field)) {
              draft[field] = normalizeDateValue(result.updates[field]);
            }
          }
          return { ...previous, [student.id]: draft };
        });
      }
      pushToast({ type: "success", message: decision === "approve" && isApproved
        ? "Swahili class and contract updated."
        : result.message || "Verification updated." });
    } catch (error) {
      pushToast({ type: "error", message: error?.message || "University verification failed." });
    } finally {
      setReviewingUniversityId("");
    }
  };

  const activateTrialForStudent = async (student) => {
    if (!window.confirm("Start a NEW seven-day trial from today? This keeps the existing login, student code and unpaid balance.")) return;
    setActivatingTrialId(student.id);
    try {
      const result = await activateExistingStudentTrial(student.id);
      setStudents(previous => previous.map(record => record.id === student.id
        ? { ...record, ...result.trial } : record));
      setDrafts(previous => { const next = { ...previous }; delete next[student.id]; return next; });
      pushToast({type: "success",message: `Seven-day trial activated through ${new Date(result.trial.trialEndsAt).toLocaleDateString("en-GB")}. The existing login was retained.`});
    } catch (error) {
      pushToast({type: "error",message: error?.message || "Could not activate student trial"});
    } finally {
      setActivatingTrialId("");
    }
  };

  const handleSupportStudentDeleted = (studentId) => {
    setStudents((prev) => prev.filter((record) => record.id !== studentId));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
    setSelectedStudentId("");
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

  const handleStudentTransferred = (studentId, payload = {}) => {
    setStudents((prev) => prev.map((record) => (
      record.id === studentId ? { ...record, ...payload } : record
    )));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const updateCreateDraftField = (field, value) => {
    setCreateDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "initialPaymentAmount") {
        next.paymentIntentAmount = String(calculatePaystackGrossAmount(value));
      }
      if (field === "status" && value === "trial_active") {
        next.paymentStatus = "Pending";
        next.paid = "0";
        next.initialPaymentAmount = "0";
        next.paymentIntentAmount = "0";
        const cost = Number(next.tuitionFee || "0");
        if (cost > 0) { next.balanceDue = String(cost); next.balance = String(cost); }
      }
      return next;
    });
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
    if (students.some((row) => row.id === studentId || row.studentCode === studentCode)) {
      pushToast({ type: "error", message: "Student code already exists. Choose another code before saving." });
      return;
    }
    const nextPayload = {
      ...createDraft,
      name,
      studentCode,
      studentcode: studentCode,
      paymentIntentAmount: calculatePaystackGrossAmount(createDraft.initialPaymentAmount),
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

    // Manual trial creation must carry trial timestamps, not only a status label.
    if (nextPayload.status === "trial_active") {
      const startedAt = new Date();
      nextPayload.trialStatus = "active";
      nextPayload.trialStartedAt = startedAt.toISOString();
      nextPayload.trialEndsAt = new Date(startedAt.getTime() + 7 * 86400000).toISOString();
      nextPayload.paymentStatus = "Pending";
      nextPayload.paid = 0;
      nextPayload.initialPaymentAmount = 0;
      nextPayload.paymentIntentAmount = 0;
      if (Number(nextPayload.tuitionFee) > 0) {
        nextPayload.balanceDue = Number(nextPayload.tuitionFee);
        nextPayload.balance = Number(nextPayload.tuitionFee);
      }
    }
    setCreatingStudent(true);
    try {
      await createStudent(studentId, nextPayload);
      const records = await listAllStudents();
      setStudents(records);
      setCreateDraft(addStudentDefaultDraft);
      setSelectedStudentId(studentId);
      selectDirectoryView("all");
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

  const renderEditableFields = (fields) => (
    <div className="student-detail-fields">
      {fields.map((field) => {
        const draft = getDraft(selectedStudent);
        const isSaving = savingId === selectedStudent.id;
        return (
          <label key={`${selectedStudent.id}-${field}`} style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{fieldLabels[field] || field}</span>
            {field === "program" ? (
              <>
                <select value={draft.program || "german"} disabled={isSaving}
                  onChange={(event) => updateDraftField(selectedStudent.id, field, event.target.value, selectedStudent)}
                  style={{ width: "100%", padding: "8px 9px", borderRadius: 6, border: "1px solid #ccd4e2" }}>
                  <option value="german">German</option>
                  <option value="swahili">Swahili (Kiswahili)</option>
                  <option value="both">German + Swahili</option>
                  {draft.program && !["german", "swahili", "both"].includes(draft.program) && (
                    <option value={draft.program} disabled>{draft.program} (current record)</option>
                  )}
                </select>
                <small style={{ color: "#64748b" }}>Save to update this student’s course access.</small>
              </>
            ) : STATUS_CHOICES[field] ? (
              <select value={draft[field]} disabled={isSaving}
                onChange={(event) => {
                  if (field === "status" && event.target.value === "trial_active") activateTrialForStudent(selectedStudent);
                  else updateDraftField(selectedStudent.id, field, event.target.value, selectedStudent);
                }}
                style={{ width: "100%", padding: "8px 9px", borderRadius: 6, border: "1px solid #ccd4e2" }}>
                {!draft[field] ? <option value="">Select status</option> : null}
                {statusOptions(field, draft[field]).map(value => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
              </select>
            ) : (
              dateFields.has(field) ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="date" value={draft[field] || ""}
                    onChange={(event) => updateDraftField(selectedStudent.id, field, event.target.value, selectedStudent)}
                    disabled={isSaving} style={{ flex: 1, minWidth: 0, padding: "8px 9px", borderRadius: 6, border: "1px solid #ccd4e2" }}/>
                  <button type="button" className="hoeren-quiet" disabled={isSaving || !draft[field]}
                    onClick={() => updateDraftField(selectedStudent.id, field, "", selectedStudent)}>
                    Clear
                  </button>
                </div>
              ) : (
                <input type={field === "emergencyContactPhoneNumber" ? "tel" : "text"} value={draft[field]}
                  onChange={(event) => updateDraftField(selectedStudent.id, field, event.target.value, selectedStudent)}
                  style={{ width: "100%", padding: "8px 9px", borderRadius: 6, border: "1px solid #ccd4e2" }}
                  disabled={isSaving}/>
              )
            )}
            {dateFields.has(field) ? <small style={{ color: "#64748b" }}>Clear and save to store a null contract date. This does not reset the 7-day trial.</small> : null}
            {field === "email" ? (
              <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.45 }}>
                Contact email can change without moving the account. Login, progress, scores and class history stay attached to the Firebase UID.
                {selectedStudent.authEmail && selectedStudent.authEmail !== draft.email
                  ? ` Current sign-in email: ${selectedStudent.authEmail}.`
                  : ""}
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="student-directory">
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 14, background: "#fff" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Find a student</h2>
        <p style={{ margin: "0 0 12px", opacity: 0.8 }}>
          Search for a student, call them directly, edit records, and generate WhatsApp follow-up messages.
        </p>
        <div style={{ display: "grid", gap: 9, marginBottom: 12 }}>
          {directoryView === "university" && (
            <div style={{ border: "1px solid #bfdbfe", background: "#eff6ff", padding: 12, borderRadius: 10, display: "grid", gap: 6 }}>
              <strong>University of Hamburg · Kiswahili A1</strong>
              <span>Registration invitation for Ruth's students (approval required)</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <a href={HAMBURG_SIGNUP_LINK} target="_blank" rel="noopener noreferrer">{HAMBURG_SIGNUP_LINK}</a>
                <button type="button" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(HAMBURG_SIGNUP_LINK);
                    pushToast({ type: "success", message: "University invitation link copied." });
                  } catch {
                    pushToast({ type: "info", message: "Select and copy the invitation link." });
                  }
                }}>Copy link</button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="tablist" aria-label="Student directory views">
            {[
              ["all", "All students"],
              ["trials", "Trials & unpaid"],
              ["attention", "Needs attention"],
              ["archived", "Archived"],
              ["university", "University of Hamburg"],
            ].map(([view, label]) => (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={activeTab === "directory" && directoryView === view}
                onClick={() => selectDirectoryView(view)}
                style={{
                  border: activeTab === "directory" && directoryView === view ? "1px solid #2563eb" : "1px solid #d1d5db",
                  background: activeTab === "directory" && directoryView === view ? "#eff6ff" : "#fff",
                  color: "#1a2233",
                  fontWeight: 700,
                }}
              >
                {label} ({directoryCounts[view]})
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={()=>setActiveTab("subscriptions")}>Subscription overview</button>
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
            <button
              type="button"
              onClick={() => setActiveTab("brochure")}
              style={{
                border: activeTab === "brochure" ? "1px solid #2563eb" : "1px solid #d1d5db",
                background: activeTab === "brochure" ? "#eff6ff" : "#fff",
                color: "#1a2233",
              }}
            >
              Send Brochure
            </button>
          </div>
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
              placeholder="Search by name, phone, email, class, student code..."
              style={{ width: "100%", maxWidth: 460, padding: "8px 10px", borderRadius: 8, border: "1px solid #ccd4e2" }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: 12, marginTop: 12 }}>
              <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
                Course language
                <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)}>
                  <option value="">All languages</option>
                  <option value="german">German (includes dual enrolment)</option>
                  <option value="swahili">Swahili (includes dual enrolment)</option>
                  <option value="both">German and Swahili</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
                Course type
                <select value={courseTypeFilter} onChange={event => setCourseTypeFilter(event.target.value)}>
                  <option value="">All course types</option>
                  <option value="full_course">Full Course</option>
                  <option value="exam_preparation">Exam Preparation</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
                Signup date
                <select value={signupDays} onChange={(event) => setSignupDays(event.target.value)}>
                  <option value="">Any time</option>
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                </select>
              </label>
              {(languageFilter || courseTypeFilter || signupDays) && (
                <button type="button" onClick={() => {
                  setLanguageFilter("");
                  setCourseTypeFilter("");
                  setSignupDays("");
                }}>
                  Clear filters
                </button>
              )}
            </div>
            <SignupAccountLookup email={query} />
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
                  Showing <strong>{filteredStudents.length}</strong> student record{filteredStudents.length === 1 ? "" : "s"} in <strong>{
                    directoryView === "attention" ? "Needs attention" :
                    directoryView === "trials" ? "Trials & unpaid" :
                    directoryView === "archived" ? "Archived" : "All students"
                  }</strong>.
                  {directoryView === "attention" ? " This queue is calculated from data already loaded in Admin; opening it creates no new intervention write." : ""}
                </p>

                {filteredStudents.length === 0 && <p>No student records match your search and filters.</p>}

                {filteredStudents.length > 0 && (
                  <div className={`student-workspace ${mobileDetails ? "is-detail-view" : "is-list-view"}`} style={{display:"block"}}>
                    {!mobileDetails && <aside className="student-sidebar" aria-label="Student list">
                      {filteredStudents.map((student) => {
                        const isSelected = student.id === selectedStudentId;
                        const phone = resolveStudentPhone(student, getDraft(student));
                        const phoneCallUrl = callUrl(phone);
                        const languages = getStudentLanguages(student);
                        const signupTime = signupTimes.get(student.id);
                        const learningStatus = attentionStudentIds.has(student.id)
                          ? resolveStudentLearningStatus(student)
                          : null;
                        return (
                          <div
                            key={student.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns: phoneCallUrl ? "minmax(0, 1fr) auto" : "1fr",
                              gap: 8,
                              alignItems: "stretch",
                              marginBottom: 8,
                            }}
                          >
                            <button
                              type="button"
                              id={`student-list-${student.id}`}
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                setDetailTab("overview");
                                setMobileDetails(true);
                                requestAnimationFrame(() => document.getElementById("student-tab-overview")?.focus());
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                border: isSelected ? "1px solid #2563eb" : "1px solid #e5e7eb",
                                background: isSelected ? "#eff6ff" : "#fff",
                                borderRadius: 8,
                                padding: "10px 8px",
                                cursor: "pointer",
                                color: "#1a2233",
                              }}
                            >
                              <div style={{ fontWeight: 600 }}>{student.name || "Unnamed"}</div>
                              <div style={{ fontSize: 12, opacity: 0.8 }}>{student.studentCode || "No student code"}</div>
                              <div style={{ fontSize: 12, opacity: 0.75 }}>{student.className || "No class"}</div>
                              <div style={{ fontSize: 12 }}>{resolveCourseType(student) === "exam_preparation" ? "Exam Preparation" : "Full Course"}</div>
                              <div style={{ fontSize: 12, opacity: 0.8 }}>
                                {languages.length ? languages.map(languageName).join(" + ") : "Language unspecified"}
                                {signupTime !== null && ` · Signed up ${signupDateFormatter.format(signupTime)}`}
                              </div>
                              {learningStatus?.primaryReason ? (
                                <div
                                  style={{
                                    marginTop: 5,
                                    width: "fit-content",
                                    borderRadius: 999,
                                    padding: "3px 7px",
                                    fontSize: 11,
                                    fontWeight: 800,
                                    background: "#fff7ed",
                                    color: "#c2410c",
                                    border: "1px solid #fdba74",
                                  }}
                                >
                                  {learningStatus.primaryReason.label}
                                </div>
                              ) : null}
                              {phone && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{phone}</div>}
                            </button>
                            {phoneCallUrl && (
                              <a
                                href={phoneCallUrl}
                                aria-label={`Call ${resolveStudentName(student)} at ${phone}`}
                                title={`Call ${phone}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  alignSelf: "stretch",
                                  minWidth: 68,
                                  padding: "8px 10px",
                                  border: "1px solid #15803d",
                                  borderRadius: 8,
                                  background: "#16a34a",
                                  color: "#fff",
                                  fontWeight: 700,
                                  textDecoration: "none",
                                }}
                              >
                                📞 Call
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </aside>}

                    {selectedStudent && mobileDetails && (
                      <div className="student-details" key={selectedStudent.id}>
                        <button type="button" className="student-back-button" style={{display:"inline-flex"}} onClick={() => {
                          setMobileDetails(false);
                          requestAnimationFrame(() => document.getElementById(`student-list-${selectedStudent.id}`)?.focus());
                        }}>← Back to students</button>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                          <h2 style={{ marginTop: 0, marginBottom: 8 }}>{selectedStudent.name || "Student details"}</h2>
                          {!isHamburgCohortStudent(selectedStudent) && <button
                            type="button"
                            onClick={() => {
                              setDetailTab("payment-links");
                              requestAnimationFrame(() => document.getElementById("student-tab-payment-links")?.focus());
                            }}
                            aria-label="Generate payment link for selected student"
                            style={{
                              minHeight: 42,
                              border: "1px solid #1d4ed8",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              borderRadius: 10,
                              padding: "8px 12px",
                              fontWeight: 700,
                            }}
                          >
                            Generate payment link →
                          </button>}
                        </div>
                        <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.75 }}>
                          Use the tabs to manage this student’s records, then save your changes. Use <strong>Transfer class</strong> in the Class tab for class changes so attendance and participation history stay intact.
                        </p>

                        <div className="student-detail-tabs" role="tablist" aria-label="Student details">
                          {STUDENT_DETAIL_TABS.filter((tab) => !isHamburgCohortStudent(selectedStudent) || !["payments","payment-links","contracts","enrollments"].includes(tab.id)).map((tab) => (
                            <button key={tab.id} id={`student-tab-${tab.id}`} type="button" role="tab"
                              aria-selected={detailTab === tab.id} aria-controls={`student-panel-${tab.id}`}
                              tabIndex={detailTab === tab.id ? 0 : -1}
                              onClick={() => setDetailTab(tab.id)}
                              onKeyDown={(event) => {
                                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                                event.preventDefault();
                                const next = nextStudentDetailTab(tab.id, event.key);
                                setDetailTab(next);
                                document.getElementById(`student-tab-${next}`)?.focus();
                              }}>{tab.label}</button>
                          ))}
                        </div>

                        {STUDENT_DETAIL_TABS.filter((tab) => tab.fields.length > 0 && tab.id === detailTab).map((tab) => (
                          <section key={tab.id} id={`student-panel-${tab.id}`} role="tabpanel"
                            aria-labelledby={`student-tab-${tab.id}`} hidden={detailTab !== tab.id}
                            className="student-detail-panel">
                            <h3>{tab.label === "Class" ? "Class and contract" : tab.label}</h3>
                            {tab.id === "profile" && isHamburgCohortStudent(selectedStudent) && (
                              <div data-university-verification style={{ marginBottom: 14, padding: 14, border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 10 }}>
                                <strong>University of Hamburg · Kiswahili A1</strong>
                                <p style={{ margin: "8px 0", fontSize: 13 }}>Instructor: Ruth · Source: university invitation</p>
                                <p style={{ margin: "8px 0", fontSize: 13 }}>
                                  Eligibility: <strong>{selectedStudent.institutionVerification === "approved" ? "Approved — complimentary access" : "Awaiting verification — no access or payment"}</strong>
                                </p>
                                <p style={{ margin: "8px 0", fontSize: 12 }}>
                                  Confirm this student is enrolled in Ruth's STiNE Kiswahili class before approving.
                                </p>
                                <p style={{ margin: "8px 0", fontSize: 13 }}>
                                  Class: <strong>{selectedStudent.className || "Not assigned"}</strong>
                                  {" · Contract starts: "}<strong>{normalizeDateValue(selectedStudent.contractStart) || "Not set"}</strong>
                                  {" · Contract ends: "}<strong>{normalizeDateValue(selectedStudent.contractEnd) || "Not set"}</strong>
                                </p>
                                {selectedStudent.institutionVerification === "approved" &&
                                  (!selectedStudent.classRecordId || !normalizeDateValue(selectedStudent.contractStart) || !normalizeDateValue(selectedStudent.contractEnd)) && (
                                  <button type="button" disabled={Boolean(reviewingUniversityId)}
                                    onClick={() => reviewUniversityRegistration(selectedStudent, "approve")}>
                                    Complete class and contract
                                  </button>
                                )}
                                <button type="button" disabled={Boolean(reviewingUniversityId)}
                                  onClick={() => reviewUniversityRegistration(selectedStudent, selectedStudent.institutionVerification === "approved" ? "revoke" : "approve")}>
                                  {reviewingUniversityId === selectedStudent.id ? "Saving…" : selectedStudent.institutionVerification === "approved" ? "Suspend complimentary access" : "Approve university access"}
                                </button>
                              </div>
                            )}
                            {tab.id === "profile" && <StudentLearningStatusPanel student={selectedStudent} />}

                            {tab.id === "profile" && !isHamburgCohortStudent(selectedStudent) && ![selectedStudent.paymentStatus, selectedStudent.status].some(value => ["paid", "partially paid", "partial", "completed", "success"].includes(String(value || "").toLowerCase().replace(/[_-]+/g, " "))) && !["paid", "paidAmount", "amountPaid", "initialPaymentAmount", "tuitionPaid", "totalPaid"].some(field => Number(String(selectedStudent[field] ?? "0").replace(/[^0-9.-]/g, "")) > 0) && (
                              <div className="student-trial-activation" style={{marginBottom:14,padding:12,border:"1px solid #c7d2fe",borderRadius:10}}>
                                <strong>Trial access</strong>
                                <p style={{margin:"6px 0",fontSize:13}}>Current trial: {selectedStudent.trialStatus || selectedStudent.status || "Not set"}. Start: {selectedStudent.trialStartedAt ? new Date(selectedStudent.trialStartedAt).toLocaleDateString("en-GB") : "missing"} · Ends: {selectedStudent.trialEndsAt ? new Date(selectedStudent.trialEndsAt).toLocaleDateString("en-GB") : "missing"}.</p>
                                <p style={{margin:"6px 0",fontSize:13}}>A manual trial needs valid dates in Firestore. Editing the Google Sheet alone does not grant account access.</p>
                                <button type="button" disabled={Boolean(activatingTrialId) || !selectedStudent.uid}
                                  onClick={() => activateTrialForStudent(selectedStudent)}>
                                  {activatingTrialId === selectedStudent.id ? "Activating trial…" : "Activate 7-day trial from today"}
                                </button>
                                {!selectedStudent.uid && <p role="alert">This record has no Firebase UID. Link the existing sign-in before activating a trial.</p>}
                              </div>
                            )}
                            {tab.id === "class" ? (() => {
                              const draft = getDraft(selectedStudent);
                              const primary = String(selectedStudent.program || "german").toLowerCase();
                              const secondary = primary === "german" ? "swahili" : "german";
                              const mode = draft.program || primary;
                              const programs = mode === "both" ? ["german", "swahili"] : [mode];
                              const saved = selectedStudent.coursePlacements?.[secondary];
                              const disabled = savingId === selectedStudent.id;
                              const change = (field,value) => updateDraftField(selectedStudent.id,field,value,selectedStudent);
                              return <>
                                {renderEditableFields(["program"])}
                                <div style={{display:"grid",gap:14,marginTop:12}}>
                                  {programs.map(program => {
                                    const isPrimary = program === primary;
                                    const level = isPrimary ? draft.level : draft.secondaryLevel ?? saved?.level ?? "A1";
                                    const label = languageName(program);
                                    const type = isPrimary ? selectedStudent.accessType || selectedStudent.paymentStatus || "Unconfirmed" : draft.secondaryAccessType ?? saved?.accessType ?? (saved && selectedStudent.secondaryProgram ? "Legacy enrollment" : "pending");
                                    const granting = !isPrimary && (draft.grantSecondaryAccess || type === "complimentary");
                                    const start = isPrimary ? draft.contractStart : draft.secondaryContractStart ?? normalizeDateValue(saved?.contractStart);
                                    const end = isPrimary ? draft.contractEnd : draft.secondaryAccessEnd ?? normalizeDateValue(saved?.contractEnd);
                                    const term = isPrimary ? draft.contractTermMonths : draft.secondaryContractTermMonths ?? saved?.contractTermMonths ?? (granting ? 3 : "");
                                    const persisted = isPrimary || selectedStudent.secondaryProgram === program;
                                    const field = key => isPrimary ? key : ({contractStart:"secondaryContractStart",contractEnd:"secondaryAccessEnd",contractTermMonths:"secondaryContractTermMonths"}[key]);
                                    return <section key={program} style={{border:"1px solid #dbe4ee",borderRadius:12,padding:14,display:"grid",gap:12,minWidth:0}}>
                                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                                        <h3 style={{margin:0}}>{label}</h3><small>{isPrimary ? "Primary · original billing" : "Secondary · separate access"}</small>
                                      </div>
                                      <div className="student-detail-fields">
                                        <label>{label} level<select value={level || ""} disabled={disabled} onChange={event=>change(isPrimary?"level":"secondaryLevel",event.target.value)}>
                                          {!courseLevels.includes(level) && <option value={level || ""}>{level || "Select level"}</option>}
                                          {courseLevels.map(value=><option key={value}>{value}</option>)}
                                        </select></label>
                                        <label>{label} class<input readOnly value={(isPrimary ? selectedStudent.className : saved?.className) || "Not assigned"} /></label>
                                        <label>Access type<input readOnly value={granting ? "Complimentary" : type} /></label>
                                      </div>
                                      {!isPrimary && !saved?.accessType?.match(/^(complimentary|invitation_pending)$/) && !saved?.contractEnd && !Number(saved?.paid || saved?.paidAmount || 0) && <label style={{display:"flex",alignItems:"center",gap:8}}>
                                        <input type="checkbox" checked={Boolean(draft.grantSecondaryAccess)} disabled={disabled} onChange={event=>change("grantSecondaryAccess",event.target.checked)} />
                                        {program === "swahili" ? "Grant complimentary Swahili access (default 3 months for paid German learners)" : "Explicitly approve complimentary German access (set expiry)"}
                                      </label>}
                                      <div className="student-detail-fields">
                                        <label>Contract start<input type="date" value={start || ""} disabled={disabled || (!isPrimary && !granting && !saved?.contractStart)} onChange={event=>change(field("contractStart"),event.target.value)} /></label>
                                        <label>Contract end<input type="date" value={end || ""} disabled={disabled || (!isPrimary && !granting && !saved?.contractEnd)} onChange={event=>change(field("contractEnd"),event.target.value)} /></label>
                                        <label>Contract term months<input type="number" min="1" max="36" value={term} disabled={disabled || (!isPrimary && !granting && !saved?.contractEnd)} onChange={event=>change(field("contractTermMonths"),event.target.value)} /></label>
                                      </div>
                                      <small>{isPrimary ? "Original billing and trial records stay attached to this language." : granting ? "Dates are independent of the primary contract. Saving other details does not renew access." : "No automatic complimentary grant. Existing access is preserved."}</small>
                                      <div className="student-contract-extension-actions">
                                        {[1,3,6].map(months=><button key={months} type="button" disabled={disabled || !end} onClick={()=>{
                                          try {change(field("contractEnd"),extendContractDate(end,months));}
                                          catch(error){pushToast({type:"error",message:error.message});}
                                        }}>+{months} {months === 1 ? "month" : "months"}</button>)}
                                      </div>
                                      {persisted && detailTab === "class" ? <StudentClassTransferDisclosure key={selectedStudent.id+":"+program} student={selectedStudent} program={program} classes={classes} onTransferred={handleStudentTransferred} pushToast={pushToast} /> : <small>Save the enrollment before assigning a class.</small>}
                                    </section>;
                                  })}
                                </div>
                              </>;
                            })() : tab.id==="payments" ? null : renderEditableFields(tab.fields)}
                            {/* STUDENT_EMERGENCY_CONTACT_FIELD: Emergency contact stays in the staff-only Profile tab. */}
                            {tab.id === "profile" && <StudentAccountActivationPanel student={selectedStudent} draft={getDraft(selectedStudent)} onStudentUpdated={handleSupportStudentUpdated} pushToast={pushToast} />}
                            {tab.id === "profile" && <StudentEmergencyContact student={selectedStudent} />}
                            {tab.id === "payments" && !isHamburgCohortStudent(selectedStudent) && <StudentLevelEnrollments key={selectedStudent.id+":payments"} student={selectedStudent} pushToast={pushToast} classes={classes} mode="history" legacyHistory={hasLevels=><>{!hasLevels&&<div className="student-detail-fields">{renderEditableFields(tab.fields)}</div>}<StudentPaymentTools mode="history" legacyOnly readOnlyHistory student={selectedStudent} draft={getDraft(selectedStudent)} onStudentUpdated={handleSupportStudentUpdated} pushToast={pushToast}/></>} />}
                          </section>
                        ))}

                        {detailTab === "overview" && <section className="student-detail-panel" role="tabpanel" id="student-panel-overview" aria-labelledby="student-tab-overview">
                          <h3>Student overview</h3>
                          <div className="student-detail-fields">
                            <label>Current level<input readOnly value={selectedStudent.level || "Not set"} /></label>
                            <label>Class<input readOnly value={selectedStudent.className || "Not assigned"} /></label>
                            <label>Recorded balance<input readOnly value={formatGhs(selectedStudent.balanceDue ?? selectedStudent.balance ?? 0)} /></label>
                            <label>Payment status<input readOnly value={selectedStudent.paymentStatus || "Not set"} /></label>
                          </div>
                          {!isHamburgCohortStudent(selectedStudent) && <button type="button" onClick={()=>setDetailTab("enrollments")}>Manage enrollments</button>}
                        </section>}
                        {detailTab === "enrollments" && !isHamburgCohortStudent(selectedStudent) && <section className="student-detail-panel" role="tabpanel" id="student-panel-enrollments" aria-labelledby="student-tab-enrollments">
                          <StudentLevelEnrollments student={selectedStudent} pushToast={pushToast} classes={classes} />
                        </section>}
                        {detailTab === "payment-links" && !isHamburgCohortStudent(selectedStudent) && <section className="student-detail-panel" role="tabpanel" id="student-panel-payment-links" aria-labelledby="student-tab-payment-links">
                          <StudentPaymentTools mode="links" student={selectedStudent} draft={getDraft(selectedStudent)} onStudentUpdated={handleSupportStudentUpdated} pushToast={pushToast} />
                        </section>}
                        {detailTab === "contracts" && !isHamburgCohortStudent(selectedStudent) && <section className="student-detail-panel" role="tabpanel" id="student-panel-contracts" aria-labelledby="student-tab-contracts">
                          <StudentUpgradeTools student={selectedStudent} draft={getDraft(selectedStudent)} onStudentUpdated={handleSupportStudentUpdated} pushToast={pushToast} />
                        </section>}
                        <section id="student-panel-access" role="tabpanel" aria-labelledby="student-tab-access" hidden={detailTab !== "access"} className="student-detail-panel">
                          {detailTab === "access" && <>
                            <StudentAccessOverview key={selectedStudent.id} student={selectedStudent} onManage={setDetailTab} />
                            {!isHamburgCohortStudent(selectedStudent) && <StudentCourseTypePanel key={selectedStudent.id} student={selectedStudent} onStudentUpdated={handleSupportStudentUpdated} />}
                            <button type="button" onClick={()=>setDetailTab("profile")}>Manage trial and login</button>
                          </>}
                        </section>
                        <section id="student-panel-support" role="tabpanel"
                          aria-labelledby="student-tab-support" hidden={detailTab !== "support"}
                          className="student-detail-panel">
                        {detailTab === "support" && <>
                        <StudentSupportTools
                          student={selectedStudent}
                          draft={getDraft(selectedStudent)}
                          onStudentDeleted={handleSupportStudentDeleted}
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
                              onClick={() => setFollowUpMessage(buildFollowUpMessage(followUpType, selectedStudent, getDraft(selectedStudent), classes))}
                              style={{ background: "#fff", color: "#1a2233", border: "1px solid #cbd5e1" }}
                            >
                              Reset text
                            </button>
                          </div>

                          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                            Phone used: <strong>{resolveStudentPhone(selectedStudent, getDraft(selectedStudent)) || "No phone number found"}</strong>
                          </p>
                        </section>
                        </>}
                        </section>
                        <section id="student-panel-documents" role="tabpanel"
                          aria-labelledby="student-tab-documents" hidden={detailTab !== "documents"}
                          className="student-detail-panel">
                        {detailTab === "documents" && <CompletionPackPanel
                          student={selectedStudent}
                          draft={getDraft(selectedStudent)}
                          pushToast={pushToast}
                        />}

                        </section>
                        {["profile","payments","class"].includes(detailTab) && <div style={{ marginTop: 14 }}>
                          <button
                            type="button"
                            onClick={() => saveStudent(selectedStudent)}
                            disabled={savingId === selectedStudent.id}
                          >
                            {savingId === selectedStudent.id ? "Saving..." : "Save student"}
                          </button>
                        </div>}

                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "subscriptions" && <StudentAccessOverview key="subscriptions" students={students} />}
        {activeTab === "add" && (
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Add student</h2>
            <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.8 }}>
              Create a new student record in Firestore with the same structure used in existing student documents.
            </p>
            <div style={{ margin: "0 0 12px", padding: 12, border: "1px solid #bfdbfe", borderRadius: 10, background: "#eff6ff", color: "#1e3a8a" }}>
              Paystack charge is split with the student. For example, an initial payment of
              {" "}<strong>{formatGhs(createDraft.initialPaymentAmount)}</strong> becomes
              {" "}<strong>{formatGhs(calculatePaystackGrossAmount(createDraft.initialPaymentAmount))}</strong>,
              so the student's estimated share is {" "}
              <strong>{formatGhs(calculatePaystackCharge(createDraft.initialPaymentAmount))}</strong>
              {" "}({(STUDENT_PAYSTACK_CHARGE_SHARE * 100).toFixed(0)}% of the Paystack fee at {(PAYSTACK_CHARGE_RATE * 100).toFixed(2)}%).
            </div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
              {addStudentFields.map((field) => (
                <label key={`create-${field}`} style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{addStudentLabels[field] || field}</span>
                  {STATUS_CHOICES[field] ? (
                    <select value={createDraft[field]} disabled={creatingStudent}
                      onChange={(event) => updateCreateDraftField(field, event.target.value)}
                      style={{ width: "100%", padding: "8px 9px", borderRadius: 6, border: "1px solid #ccd4e2" }}>
                      {statusOptions(field, createDraft[field]).map(value => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
                    </select>
                  ) : (
                    <input
                      type={addStudentDateFields.has(field) ? "date" : field === "emergencyContactPhoneNumber" ? "tel" : "text"}
                      value={createDraft[field]}
                      onChange={(event) => updateCreateDraftField(field, event.target.value)}
                      style={{ width: "100%", padding: "8px 9px", borderRadius: 6, border: "1px solid #ccd4e2" }}
                      disabled={creatingStudent}
                    />
                  )}
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

        {activeTab === "brochure" && <BrochureWhatsappPanel pushToast={pushToast} />}
      </section>
    </div>
  );
}

export const STUDENT_DETAIL_TABS = [
  { id: "profile", label: "Profile", fields: ["name", "email", "phone", "studentCode", "location", "status"] },
  { id: "payments", label: "Payments", fields: ["tuitionFee", "initialPaymentAmount", "paymentIntentAmount", "balanceDue", "paymentStatus"] },
  { id: "class", label: "Class", fields: ["level", "program", "contractStart", "contractEnd", "contractTermMonths"] },
  { id: "support", label: "Support", fields: [] },
  { id: "documents", label: "Documents", fields: [] },
];

export function nextStudentDetailTab(current, key) {
  const index = STUDENT_DETAIL_TABS.findIndex((tab) => tab.id === current);
  if (key === "Home") return STUDENT_DETAIL_TABS[0].id;
  if (key === "End") return STUDENT_DETAIL_TABS.at(-1).id;
  const direction = key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0;
  if (!direction) return current;
  return STUDENT_DETAIL_TABS[(index + direction + STUDENT_DETAIL_TABS.length) % STUDENT_DETAIL_TABS.length].id;
}

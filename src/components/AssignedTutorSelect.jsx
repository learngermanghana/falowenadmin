import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AssignedTutorSelect({ language, value, onChange }) {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!user) return;
    const abort = new AbortController();
    async function load() {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/staff-management", {
          headers: { Authorization: `Bearer ${token}` },
          signal: abort.signal,
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error("Could not load staff.");
        if (abort.signal.aborted) return;
        setStaff(result.staff || []);
        setStatus("ready");
      } catch {
        if (!abort.signal.aborted) setStatus("failed");
      }
    }
    load();
    return () => abort.abort();
  }, [user]);

  const eligible = staff.filter((member) =>
    member.active && member.staffRole === "teacher" && member.languages?.includes((language || "German").toLowerCase()));
  const existing = staff.find((member) => member.uid === value);

  return <label>Assigned tutor
    <select value={value} disabled={status !== "ready"} onChange={(event) => onChange(event.target.value)}>
      <option value="">Unassigned</option>
      {value && !eligible.some((member) => member.uid === value) && <option value={value}>
        {existing?.name || existing?.email || "Current assignment"} (unavailable)
      </option>}
      {eligible.map((member) => <option key={member.uid} value={member.uid}>{member.name || member.email}</option>)}
    </select>
    {status === "loading" && <small>Loading teaching staff…</small>}
    {status === "failed" && <small>Staff directory unavailable. Reload to choose a tutor.</small>}
  </label>;
}

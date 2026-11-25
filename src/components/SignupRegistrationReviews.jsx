import { useEffect, useState, useCallback } from "react";
import { collection, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

// Mounted only on Students > Needs attention. No polling or listeners.
const OPEN_STATUSES = ["pending", "ip_flag"];
export default function SignupRegistrationReviews() {
  const { role, user } = useAuth();
  if (role !== "admin" || !user) return null;
  return <ReviewQueue user={user} />;
}

function ReviewQueue({ user }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const snapshot = await getDocs(query(collection(db,"signupRegistrationReviews"),
        where("status","in",OPEN_STATUSES),limit(50)));
      setRows(snapshot.docs.map(record=>({id:record.id,...record.data()}))
        .sort((a,b)=>(b.updatedAt?.toMillis?.()||0)-(a.updatedAt?.toMillis?.()||0)));
    } catch { setError("Could not load registration reviews. Check Admin permissions and deployment of the new Firestore rules."); }
    finally { setLoading(false); }
  }, []);
  useEffect(()=>{void reload();},[reload]);
  const decide = async (row,status) => {
    if (busy) return;
    if (status === "rejected" && !window.confirm("Reject this applicant's trial request? They can contact admissions for help.")) return;
    if (status === "approved" && !window.confirm("Approve this applicant to retry registration using the same email, phone and language?")) return;
    setBusy(row.id);setError("");
    try {
      await updateDoc(doc(db,"signupRegistrationReviews",row.id),{
        status,reviewedBy:user.uid,reviewedAt:serverTimestamp(),
      });
      setRows(current=>current.filter(item=>item.id!==row.id));
    } catch {setError("The review decision could not be saved. Refresh and try again.");}
    finally {setBusy("");}
  };
  return <section aria-label="Duplicate registration reviews" style={{border:"1px solid #d1d5db",borderRadius:10,padding:12,marginBottom:16,display:"grid",gap:10}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
      <strong>Duplicate registration ({rows.length}{rows.length===50?"+":""})</strong>
      <button type="button" disabled={loading||Boolean(busy)} onClick={reload}>Refresh</button>
    </div>
    <p style={{margin:0,color:"#475569",fontSize:13}}>Browser matches hold a new free trial. Shared IP addresses alone do not block registration. An approved applicant must submit the same details again.</p>
    {loading && <p role="status">Loading registration reviews…</p>}
    {error && <p role="alert" style={{color:"#991b1b"}}>{error}</p>}
    {!loading&&!error&&!rows.length&&<p style={{margin:0}}>No open duplicate registration reviews.</p>}
    {rows.map(row=><article key={row.id} style={{border:"1px solid #e2e8f0",borderRadius:8,padding:10,display:"grid",gap:6}}>
      <strong style={{overflowWrap:"anywhere"}}>{row.email} · {row.program==="swahili"?"Kiswahili":"German"}</strong>
      <span>{row.status==="pending"?"Trial on hold — verification required":"IP match — registration allowed"}</span>
      <small>{row.browserMatch?"Browser match":"No browser match"} · {row.ipMatch?"IP match":"No IP match"}</small>
      {row.createdAt?.toDate && <small>Requested {row.createdAt.toDate().toLocaleString("en-GB")}</small>}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {row.status==="pending"?<>
          <button type="button" disabled={Boolean(busy)} onClick={()=>decide(row,"approved")}>Approve registration</button>
          <button type="button" disabled={Boolean(busy)} onClick={()=>decide(row,"rejected")}>Reject trial</button>
        </>:<button type="button" disabled={Boolean(busy)} onClick={()=>decide(row,"acknowledged")}>Acknowledge</button>}
      </div>
    </article>)}
  </section>;
}

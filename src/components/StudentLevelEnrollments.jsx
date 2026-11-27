import {useEffect,useState,useRef} from "react";
import {auth} from "../firebase.js";
import {isLevelPaymentOverdue} from "../utils/levelPaymentOverdue.js";
import {enrollmentClassNames} from "../utils/enrollmentClassNames.js";
import {paymentProgress} from "../utils/levelPaymentProgress.js";
function EnrollmentClassSelect({classes,program,level,value,onChange,existingName="",disabled=false}){
 const options=enrollmentClassNames(classes,program,level);
 const retainExisting=existingName&& !options.includes(existingName);
 return <label>Class<select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}><option value="">No class assigned</option>{retainExisting&&<option value={existingName}>{existingName} (existing assignment)</option>}{options.map(name=><option key={name} value={name}>{name}</option>)}</select>{!options.length&&<small>No open classes for this language and level. You can save without assigning a class.</small>}</label>;
}
const initial={program:"german",level:"A1",tuitionFee:"",paid:"0",className:"",contractStart:"",contractEnd:"",paymentDeadline:"",status:"active",accessType:"paid"};
const statuses=["planned","active","completed","expired","cancelled"];
const dateLabels={contractStart:"Contract start",contractEnd:"Contract end",paymentDeadline:"Payment deadline"};
const amountLabel=value=>value==null||value===""?"Not set":"GH₵"+Number(value).toLocaleString("en-GH",{minimumFractionDigits:2,maximumFractionDigits:2});
const balanceLabel=values=>values.tuitionFee===""?"Not set":amountLabel(Math.max(0,Number(values.tuitionFee)-Number(values.paid||0)));
const invalidTotals=values=>Number(values.paid)<0||Number(values.tuitionFee)<0||(values.tuitionFee!==""&&Number(values.paid)>Number(values.tuitionFee));
function suggestedDate(start,months){
 if(!start)return "";
 const [year,month,day]=start.split("-").map(Number);
 const date=new Date(Date.UTC(year,month-1+months,1));
 const lastDay=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
 date.setUTCDate(Math.min(day,lastDay));
 return date.toISOString().slice(0,10);
}
function suggestDates(values){return {...values,contractEnd:values.contractEnd||suggestedDate(values.contractStart,values.accessType==="complimentary"?3:6),paymentDeadline:values.paymentDeadline||suggestedDate(values.contractStart,1)};}
async function request(id,body,suffix=""){
 const token=await auth.currentUser?.getIdToken();
 const response=await fetch("/api/students/"+encodeURIComponent(id)+"/level-enrollments"+suffix,{method:body?"POST":"GET",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},...(body?{body:JSON.stringify(body)}:{})});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||!result.ok)throw new Error(result.error||"Enrollment API unavailable ("+response.status+")");
 return result;
}

function ExistingCourseEditor({course,busy,onSave,classes,onRenewTrial}){
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState({});
 const [confirm,setConfirm]=useState(false);
 const [message,setMessage]=useState("");
 const [converting,setConverting]=useState(false);
 const owner=auth.currentUser?.emailVerified===true&&auth.currentUser.email?.toLowerCase()==="moxflex@gmail.com";
 const label=course.program==="swahili"?"Kiswahili":"German";
 const disabled=!!course.blockedReason||!owner||(!course.canPaid&&!course.canFree&&!course.canConvertTrial);
 const begin=()=>{setConverting(false);setDraft({accessType:course.canPaid?"paid":course.accessType==="complimentary"?"complimentary":"",contractStart:course.contractStart,contractEnd:course.contractEnd,paymentDeadline:course.paymentDeadline});setConfirm(false);setMessage("");setEditing(true);};
 const beginConversion=()=>{const today=new Date().toISOString().slice(0,10);setConverting(true);setDraft(suggestDates({accessType:"paid",tuitionFee:course.tuitionFee>0?String(course.tuitionFee):"",className:course.className,contractStart:today,contractEnd:"",paymentDeadline:""}));setMessage("");setEditing(true);};
 const save=async()=>{setMessage("");try{await onSave({id:course.id,revision:course.revision,...draft,convertTrial:converting,confirmComplimentary:confirm});setEditing(false);}catch(e){setMessage(e.message);}};
 return <div style={{border:"1px solid #e2e8f0",borderRadius:10,padding:12,display:"grid",gap:8}}>
 <strong>{label} · {course.level}</strong>
 <small>Existing course · {course.className||"No class assigned"} · {course.paymentStatus||"Payment not confirmed"}</small>
 <div>Contract: {course.contractStart||"Not recorded"} → {course.contractEnd||"Not recorded"}</div>
 <small>Recorded tuition: {amountLabel(course.tuitionFee)} · Paid: {amountLabel(course.paid)} · Balance: {amountLabel(course.balanceDue)}</small>
 {disabled?<small>{course.blockedReason||(!owner?"Only the verified owner can migrate existing contracts.":"Review the historical course payment totals before migration.")}</small>:!editing?<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{course.canConvertTrial&&<><button type="button" disabled={busy} onClick={beginConversion}>Convert to paid course</button>{onRenewTrial&&<button type="button" disabled={busy} onClick={onRenewTrial}>Renew 7-day trial</button>}</>}{(course.canPaid||course.canFree)&&<button type="button" disabled={busy} onClick={begin}>Edit existing course</button>}</div>:<div className="student-detail-fields">
 <p style={{gridColumn:"1 / -1",margin:0}}>{converting?"Prepare this existing trial for payment. No paid access is granted until payment is recorded.":"Save this existing course as a managed enrollment. Its language, level, class and recorded payments are preserved. No new payment or receipt is created."}</p>
 {converting?<><label>Tuition fee (GH₵)<input type="number" min="0.01" step="0.01" value={draft.tuitionFee} onChange={e=>setDraft({...draft,tuitionFee:e.target.value})}/></label><EnrollmentClassSelect classes={classes} program={course.program} level={course.level} value={draft.className} existingName={course.className} onChange={value=>setDraft({...draft,className:value})} disabled={busy}/></>:<label>Access type<select value={draft.accessType} onChange={e=>{setDraft({...draft,accessType:e.target.value});setConfirm(false);}}><option value="">Choose access type</option>{course.canPaid&&<option value="paid">Paid course (preserve recorded totals)</option>}{course.canFree&&<option value="complimentary">Complimentary (free access)</option>}</select></label>}
 {["contractStart","contractEnd","paymentDeadline"].filter(k=>k!=="paymentDeadline"||draft.accessType==="paid").map(k=><label key={k}>{dateLabels[k]}<input type="date" value={draft[k]||""} onChange={e=>setDraft({...draft,[k]:e.target.value})}/></label>)}
 {draft.accessType==="complimentary"&&<label><input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/> I confirm this course is free and no historical payment or outstanding tuition is being replaced.</label>}
 {message&&<p role="alert">{message}</p>}
 <button type="button" disabled={busy||!draft.accessType||!draft.contractStart||!draft.contractEnd||draft.contractEnd<draft.contractStart||(draft.accessType==="complimentary"&&!confirm)||(draft.accessType==="paid"&&course.balanceDue>0&&!draft.paymentDeadline)||(converting&&(!(Number(draft.tuitionFee)>0)||!draft.paymentDeadline||draft.paymentDeadline<draft.contractStart||draft.paymentDeadline>draft.contractEnd))} onClick={save}>{converting?"Save & manage payment":"Save existing course"}</button>
 <button type="button" disabled={busy} onClick={()=>setEditing(false)}>Cancel</button>
 </div>}
 </div>;
}

export default function StudentLevelEnrollments({student,pushToast,classes=[],mode="all",legacyHistory=null,onStudentUpdated,legacyControls=null,onRenewTrial=null,trialRenewing=false}){
 const [rows,setRows]=useState([]),[draft,setDraft]=useState(initial),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [legacyCourses,setLegacyCourses]=useState([]);
 const id=student.id;
 const refreshProfile=async()=>{try{const r=await request(id,{},"/reconcile-profile");if(r.profile?.effectiveEnrollmentId||r.profile?.secondaryProgram)onStudentUpdated?.(id,r.profile);}catch(e){pushToast?.({type:"error",message:"Enrollment saved, but profile refresh failed: "+e.message});}};
 const [selected,setSelected]=useState(""),[payments,setPayments]=useState([]),[payment,setPayment]=useState({method:"momo",reference:"",amount:"",receivedDate:""}),[paymentBusy,setPaymentBusy]=useState(false),[paymentError,setPaymentError]=useState("");
 useEffect(()=>{let live=true;setPayments([]);setPaymentError("");if(!selected||mode==="links")return;setPaymentBusy(true);request(id,null,"/"+encodeURIComponent(selected)+"/payments").then(r=>{if(live)setPayments([...r.payments].sort((a,b)=>String(b.receivedDate||"").localeCompare(String(a.receivedDate||""))))}).catch(e=>{if(live)setPaymentError(e.message)}).finally(()=>{if(live)setPaymentBusy(false)});return()=>{live=false};},[id,selected,mode]);
 const record=async()=>{setPaymentBusy(true);setPaymentError("");try{const r=await request(id,payment,"/"+encodeURIComponent(selected)+"/payments");setRows(old=>old.map(row=>row.id===selected?r.enrollment:row));setPayments(old=>[r.payment,...old]);await refreshProfile();setPayment({method:"momo",reference:"",amount:"",receivedDate:""});pushToast?.({type:"success",message:"Payment allocated to selected level"});}catch(e){setPaymentError(e.message);}finally{setPaymentBusy(false);}};
 useEffect(()=>{let live=true;setRows([]);setLegacyCourses([]);setSelected("");setContractId("");setError("");setOpen(false);setBusy(true);request(id).then(r=>{if(live){setRows(r.enrollments);setLegacyCourses(r.legacyCourses||[]);}}).catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setBusy(false)});return()=>{live=false};},[id]);
 const save=async()=>{setBusy(true);try{const r=await request(id,draft);setRows(old=>[...old,r.enrollment]);await refreshProfile();setOpen(false);setDraft(initial);pushToast?.({type:"success",message:"Level enrollment created"});}catch(e){pushToast?.({type:"error",message:e.message});}finally{setBusy(false);}};
 const saveExisting=async(input)=>{setBusy(true);try{const r=await request(id,input,"/edit-existing-course");setRows(old=>[...old.filter(x=>x.id!==r.enrollment.id),r.enrollment]);setLegacyCourses(old=>old.filter(x=>x.id!==r.enrollment.id));await refreshProfile();if(input.convertTrial)setSelected(r.enrollment.id);pushToast?.({type:"success",message:input.convertTrial?"Contract prepared. Record payment below to activate access.":"Existing course saved. No payment created."});}finally{setBusy(false);}};
 const [checkout,setCheckout]=useState(null),[linkAmount,setLinkAmount]=useState("");
 const [verifyReference,setVerifyReference]=useState(""),[verifyBusy,setVerifyBusy]=useState(false),[verifyMessage,setVerifyMessage]=useState("");
 const verificationInFlight=useRef(false);
 const verifyPayments=async(reference="",silent=false)=>{
  if(verificationInFlight.current)return;
  verificationInFlight.current=true;setVerifyBusy(true);setVerifyMessage("");
  try{
   const token=await auth.currentUser?.getIdToken();
   const response=await fetch("/api/payments/reconcile-enrollment/"+encodeURIComponent(id),{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({reference:reference.trim()})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result.ok)throw Error(result.error||"Payment verification failed ("+response.status+")");
   const issues=result.results.filter(r=>r.error);
   const paid=result.results.filter(r=>r.status==="paid"&&r.sheetStatus==="synced");
   if(issues.length)setVerifyMessage(issues.map(r=>r.reference+": "+r.error).join("; "));
   else if(paid.length)setVerifyMessage(paid.length+" verified payment(s); sheet synchronized.");
   else if(!silent)setVerifyMessage(result.results.length?"Paystack payment not completed yet.":"No pending level payment links found. Enter an exact reference to retry a paid transaction.");
   const refreshed=await request(id);setRows(refreshed.enrollments);setLegacyCourses(refreshed.legacyCourses||[]);
   if(paid.length)await refreshProfile();
  }catch(e){setVerifyMessage(e.message);}finally{verificationInFlight.current=false;setVerifyBusy(false);}
 };
 // One check on opening the payment-link panel and one delayed check after generating a link.
 // No persistent polling, timers after unmount, or new cloud scheduler.
 useEffect(()=>{if(mode==="links")verifyPayments("",true);},[id,mode]);
 useEffect(()=>{if(mode!=="links"||!checkout?.reference)return;const timer=setTimeout(()=>verifyPayments(checkout.reference,true),90000);return()=>clearTimeout(timer);},[id,mode,checkout?.reference]);
 const recoveryControls=<div style={{display:"grid",gap:6}}><label>Payment reference (optional)<input value={verifyReference} onChange={e=>setVerifyReference(e.target.value)} placeholder="FAL-..." disabled={verifyBusy}/></label><button type="button" disabled={verifyBusy} onClick={()=>verifyPayments(verifyReference)}>{verifyBusy?"Verifying Paystack…":"Verify Paystack / recover payment"}</button>{verifyMessage&&<p role="status">{verifyMessage}</p>}</div>;
 useEffect(()=>{setCheckout(null);setLinkAmount("");},[selected]);
 const generate=async()=>{setPaymentBusy(true);setPaymentError("");try{
 const token=await auth.currentUser?.getIdToken();
 const response=await fetch("/api/payments/enrollment-link",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({studentId:id,enrollmentId:selected,amount:linkAmount})});
 const result=await response.json().catch(()=>({}));if(!response.ok||!result.ok)throw new Error(result.error||"Enrollment checkout unavailable ("+response.status+")");setCheckout(result.payment);setVerifyReference(result.payment.reference);
 }catch(e){setPaymentError(e.message);}finally{setPaymentBusy(false);}};
 const [legacyOpen,setLegacyOpen]=useState(false);
 const [contractId,setContractId]=useState(""),[contract,setContract]=useState({});
 const updateContract=async()=>{setBusy(true);try{const current=rows.find(row=>row.id===contractId);const patch=Object.fromEntries(Object.entries(contract).filter(([k,v])=>String(current?.[k]??(k==="paid"?0:k==="accessType"?"paid":""))!==String(v)));const r=await request(id,patch,"/"+encodeURIComponent(contractId)+"/contract");setRows(old=>old.map(row=>row.id===contractId?r.enrollment:row));await refreshProfile();setContractId("");pushToast?.({type:"success",message:"Level details saved"});}catch(e){pushToast?.({type:"error",message:e.message});}finally{setBusy(false);}};
 
 const sync=async(row)=>{setBusy(true);try{await request(id,{},"/"+encodeURIComponent(row.id)+"/sync-sheet");const r=await request(id);setRows(r.enrollments);await refreshProfile();pushToast?.({type:"success",message:"Enrollment sheet synchronized"});}catch(e){pushToast?.({type:"error",message:e.message});}finally{setBusy(false);}};
 const change=(key,value)=>setDraft(old=>({...old,[key]:value,...(key==="accessType"&&value==="complimentary"?{tuitionFee:"0",paid:"0"}:{}),...(["program","level"].includes(key)&&old[key]!==value?{className:""}:{})}));
 if(mode==="links"){
  const payable=rows.filter(r=>r.accessType!=="complimentary"&&typeof r.balanceDue==="number"&&r.balanceDue>0&&["active","planned","expired","completed"].includes(r.status));
  const row=payable.find(r=>r.id===selected);
  return <section style={{display:"grid",gap:12}}><h3>Generate payment link</h3><p>Select the language and level. Payment is credited only to that enrollment.</p>{recoveryControls}{busy&&<p>Loading enrollments…</p>}{error&&<p role="alert">{error}</p>}{!busy&&!error&&rows.length>0&&<>{payable.length?<><label>Enrollment<select value={selected} onChange={e=>setSelected(e.target.value)} disabled={paymentBusy}><option value="">Select language and level</option>{payable.map(r=><option key={r.id} value={r.id}>{r.program==="swahili"?"Kiswahili":"German"} · {r.level} · {amountLabel(r.balanceDue)} due</option>)}</select></label>{row&&<><p>Remaining tuition: <strong>{amountLabel(row.balanceDue)}</strong></p><label>Tuition amount<input type="number" min="0.01" max={row.balanceDue} step="0.01" value={linkAmount} onChange={e=>setLinkAmount(e.target.value)} disabled={paymentBusy}/></label><button type="button" disabled={paymentBusy||!(Number(linkAmount)>0)||Number(linkAmount)>row.balanceDue} onClick={generate}>{paymentBusy?"Generating…":"Generate Paystack link"}</button>{checkout&&<div><a href={checkout.authorizationUrl} target="_blank" rel="noreferrer">Open checkout</a> <button type="button" onClick={()=>navigator.clipboard.writeText(checkout.authorizationUrl)}>Copy link</button> <a href={"https://wa.me/?text="+encodeURIComponent("Falowen "+row.program+" "+row.level+" payment link: "+checkout.authorizationUrl)} target="_blank" rel="noreferrer">Send on WhatsApp</a></div>}</>}</>:<p>No outstanding level balances.</p>}</>}{paymentError&&<p role="alert">{paymentError}</p>}{!busy&&!error&&!rows.length&&legacyControls?.(rows)}</section>;
 }
 return <div style={{display:"grid",gap:12}}>
 <h3>{mode==="history"?"Payment progress by level":"Level enrollments"}</h3>{mode==="history"&&recoveryControls}
 <p style={{margin:0}}>One student, separate payments and contracts for each language and level. Opening balances and subsequent payments are not counted twice. Sheet sync runs after changes when configured.</p>
 <p style={{margin:0,fontSize:13}}>Set the enrollment status independently of payment. Fees and dates can be entered later. Saving totals does not issue a receipt.</p>
 {busy&&<p>Loading…</p>}{error&&<p role="alert">{error}</p>}
 {!busy&&!error&&!rows.length&&(mode==="history"||!legacyCourses.length)&&<p>No independent level records yet. Use Enrollments to enter verified level totals, or review the original payment history below.</p>}
 {mode!=="history"&&!error&&legacyCourses.filter(course=>!rows.some(row=>row.id===course.id)).map(course=><ExistingCourseEditor key={id+":"+course.id+":"+course.revision} course={course} busy={busy||trialRenewing} onSave={saveExisting} classes={classes} onRenewTrial={onRenewTrial}/>)}
 {rows.map(row=><div key={row.id} style={{border:"1px solid #e2e8f0",borderRadius:10,padding:12}}><strong>{row.program} · {row.level}</strong><div>{row.className||"No class"} · {row.status}</div><div>Tuition: {amountLabel(row.tuitionFee)} · Paid: {amountLabel(row.paid)} · Balance: {amountLabel(row.balanceDue)} · {row.accessType==="complimentary"?"Complimentary":row.paymentStatus||"Unpaid"} {isLevelPaymentOverdue(row)&&<strong style={{color:"#b91c1c"}}> · Payment overdue</strong>}</div><div style={{margin:"10px 0",display:"grid",gap:4}}>{paymentProgress(row).percent===null?<small>Payment progress unavailable — fee not set or totals need review.</small>:<><div style={{display:"flex",justifyContent:"space-between"}}><small>Tuition paid</small><strong>{paymentProgress(row).percent}%</strong></div><progress aria-label={`${row.program} ${row.level} tuition paid`} value={paymentProgress(row).percent} max={100} style={{width:"100%",height:12,accentColor:"#15803d"}}/></>}</div><small>Contract: {row.contractStart||"Not set"} → {row.contractEnd||"Not set"} · Payment deadline: {row.paymentDeadline||"Not set"} · Sheet: {row.sheetSyncStatus||"pending"}</small>{row.sheetSyncError&&<p role="alert">{row.sheetSyncError}</p>}{mode!=="history"&&<div><button type="button" disabled={busy} onClick={()=>sync(row)}>Sync sheet / refresh</button> <button type="button" disabled={busy} onClick={()=>{setContractId(contractId===row.id?"":row.id);setContract({tuitionFee:String(row.tuitionFee??""),paid:String(row.paid??0),contractStart:row.contractStart||"",contractEnd:row.contractEnd||"",paymentDeadline:row.paymentDeadline||"",status:row.status||"planned",accessType:row.accessType||"paid"});}}>Edit level</button></div>}{mode!=="history"&&contractId===row.id&&<div className="student-detail-fields"><label>Access type<select value={contract.accessType} onChange={e=>setContract({...contract,accessType:e.target.value})}><option value="paid">Paid course</option><option value="complimentary">Complimentary</option></select></label><label>Tuition fee (optional)<input type="number" min="0" step="0.01" value={contract.tuitionFee} onChange={e=>setContract({...contract,tuitionFee:e.target.value})}/></label><label>Total already paid<input type="number" min="0" max={contract.tuitionFee||undefined} step="0.01" value={contract.paid} onChange={e=>setContract({...contract,paid:e.target.value})}/></label><div>Balance: {balanceLabel(contract)}</div><small>Enter the correct total, including any payments already recorded for this level. Saving does not issue a receipt.</small>{["contractStart","contractEnd","paymentDeadline"].map(k=><label key={k}>{dateLabels[k]}<input type="date" value={contract[k]} onChange={e=>setContract({...contract,[k]:e.target.value})}/></label>)}<button type="button" disabled={!contract.contractStart} onClick={()=>setContract(suggestDates(contract))}>Suggest contract dates</button><small>Current class: {row.className||"Not assigned"}. Use the Class tab to transfer without losing attendance history.</small><label>Enrollment status<select value={contract.status} onChange={e=>setContract({...contract,status:e.target.value})}>{statuses.map(v=><option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></label><small>Enrollment status and payment status are separate. An expired earlier contract may still permit revision through an active higher level.</small><button type="button" disabled={busy||invalidTotals(contract)} onClick={updateContract}>Save level</button></div>}<div><button type="button" onClick={()=>setSelected(selected===row.id?"":row.id)}>{selected===row.id?"Close payments":mode==="history"?"View level payment history":"Manage level payments"}</button></div>{selected===row.id&&<div style={{display:"grid",gap:8,marginTop:10}}><h4>{row.level} payment history</h4>{paymentBusy?<small>Loading transactions…</small>:!paymentError&&<><small>Recorded transaction total: {amountLabel(paymentProgress(row,payments).tracked)}. {paymentProgress(row,payments).openingOrAdjustment>0?`Opening balance / historical credit: ${amountLabel(paymentProgress(row,payments).openingOrAdjustment)} (included in total paid; no invented dates or receipts).`:paymentProgress(row,payments).openingOrAdjustment<0?"Recorded transactions exceed current paid total; review adjustments.":""}</small>{!payments.length&&<small>No individual transactions recorded for this level yet.</small>}{payments.map(p=><div key={p.id} style={{padding:"8px 0",borderBottom:"1px solid #e2e8f0"}}><strong>{amountLabel(p.amount)}</strong> · {p.receivedDate||"Date not recorded"} · {p.method} <small style={{display:"block",overflowWrap:"anywhere"}}>{p.reference}</small></div>)}</>}{paymentError&&<p role="alert">{paymentError}</p>}{mode!=="history"&&row.balanceDue>0&&<><label>Method<select value={payment.method} onChange={e=>setPayment({...payment,method:e.target.value})}><option value="momo">MoMo</option><option value="bank">Bank transfer</option><option value="cash">Cash</option><option value="paystack">Existing Paystack payment</option></select></label><label>Reference<input value={payment.reference} onChange={e=>setPayment({...payment,reference:e.target.value})}/></label>{payment.method!=="paystack"&&<><label>Amount<input type="number" min="0.01" step="0.01" value={payment.amount} onChange={e=>setPayment({...payment,amount:e.target.value})}/></label><label>Payment date<input type="date" value={payment.receivedDate} onChange={e=>setPayment({...payment,receivedDate:e.target.value})}/></label></>}<button type="button" disabled={paymentBusy||!payment.reference.trim()||(payment.method!=="paystack"&&(!payment.receivedDate||!(Number(payment.amount)>0)))} onClick={record}>Record level payment</button></>}</div>}</div>)}
 {mode==="history"&&legacyHistory&&<details onToggle={e=>setLegacyOpen(e.currentTarget.open)}><summary>Original account payment history (not allocated by level)</summary><p style={{fontSize:13}}>Historical account payments may already be included in level totals. Do not add them together.</p>{legacyOpen&&legacyHistory(rows.length>0)}</details>}
 {mode!=="history"&&legacyControls&&!busy&&!error&&legacyControls(rows)}
 {mode!=="history"&&<button type="button" disabled={busy||Boolean(error)} onClick={()=>setOpen(!open)}>{open?"Cancel":"+ Add level"}</button>}
 {open&&<div className="student-detail-fields">
 <label>Language<select value={draft.program} onChange={e=>change("program",e.target.value)}><option value="german">German</option><option value="swahili">Kiswahili</option></select></label>
 <label>Level<select value={draft.level} onChange={e=>change("level",e.target.value)}>{["A1","A2","B1","B2","C1","C2"].map(l=><option key={l}>{l}</option>)}</select></label>
 <label>Access type<select value={draft.accessType} onChange={e=>change("accessType",e.target.value)}><option value="paid">Paid course</option><option value="complimentary">Complimentary</option></select></label>
 <label>Tuition fee (optional)<input type="number" min="0" step="0.01" value={draft.tuitionFee} onChange={e=>change("tuitionFee",e.target.value)}/></label>
 <label>Total already paid<input type="number" min="0" max={draft.tuitionFee||undefined} step="0.01" value={draft.paid} onChange={e=>change("paid",e.target.value)}/></label>
 <div>Balance: {balanceLabel(draft)}</div>
 <EnrollmentClassSelect classes={classes} program={draft.program} level={draft.level} value={draft.className} disabled={busy} onChange={value=>change("className",value)}/>
 {["contractStart","contractEnd","paymentDeadline"].map(k=><label key={k}>{dateLabels[k]}<input type="date" value={draft[k]} onChange={e=>change(k,e.target.value)}/></label>)}
 <button type="button" disabled={!draft.contractStart} onClick={()=>setDraft(suggestDates(draft))}>Suggest dates (6 months / 1 month)</button>
 <label>Enrollment status<select value={draft.status} onChange={e=>change("status",e.target.value)}>{statuses.map(v=><option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></label>
 <button type="button" disabled={busy||invalidTotals(draft)} onClick={save}>Save level</button></div>}
 </div>;
}

import {useEffect,useState} from "react";
import {auth} from "../firebase.js";
const initial={program:"german",level:"A1",tuitionFee:"",paid:"0",className:"",contractStart:"",contractEnd:"",paymentDeadline:"",status:"active"};
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
function suggestDates(values){return {...values,contractEnd:values.contractEnd||suggestedDate(values.contractStart,6),paymentDeadline:values.paymentDeadline||suggestedDate(values.contractStart,1)};}
async function request(id,body,suffix=""){
 const token=await auth.currentUser?.getIdToken();
 const response=await fetch("/api/students/"+encodeURIComponent(id)+"/level-enrollments"+suffix,{method:body?"POST":"GET",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},...(body?{body:JSON.stringify(body)}:{})});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||!result.ok)throw new Error(result.error||"Enrollment API unavailable ("+response.status+")");
 return result;
}
export default function StudentLevelEnrollments({student,pushToast,mode="enrollments",legacyFallback=null,legacyHistory=null}){
 const [loadedId,setLoadedId]=useState(""),[showHistory,setShowHistory]=useState(false);
 const [rows,setRows]=useState([]),[draft,setDraft]=useState(initial),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const id=student.id;
 const [selected,setSelected]=useState(""),[payments,setPayments]=useState([]),[payment,setPayment]=useState({method:"momo",reference:"",amount:"",receivedDate:""}),[paymentBusy,setPaymentBusy]=useState(false),[paymentError,setPaymentError]=useState("");
 useEffect(()=>{let live=true;setPayments([]);setPaymentError("");if(!selected||mode==="links"||mode==="overview")return;setPaymentBusy(true);request(id,null,"/"+encodeURIComponent(selected)+"/payments").then(r=>{if(live)setPayments(r.payments)}).catch(e=>{if(live)setPaymentError(e.message)}).finally(()=>{if(live)setPaymentBusy(false)});return()=>{live=false};},[id,selected,mode]);
 const record=async()=>{setPaymentBusy(true);setPaymentError("");try{const r=await request(id,payment,"/"+encodeURIComponent(selected)+"/payments");setRows(old=>old.map(row=>row.id===selected?r.enrollment:row));setPayments(old=>[r.payment,...old]);setPayment({method:"momo",reference:"",amount:"",receivedDate:""});pushToast?.({type:"success",message:"Payment allocated to selected level"});}catch(e){setPaymentError(e.message);}finally{setPaymentBusy(false);}};
 useEffect(()=>{let live=true;setLoadedId("");setRows([]);setSelected("");setShowHistory(false);setError("");setOpen(false);setBusy(true);request(id).then(r=>{if(live){setRows(r.enrollments);setLoadedId(id)}}).catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setBusy(false)});return()=>{live=false};},[id]);
 const save=async()=>{setBusy(true);try{const r=await request(id,draft);setRows(old=>[...old,r.enrollment]);setOpen(false);setDraft(initial);pushToast?.({type:"success",message:"Level enrollment created"});}catch(e){pushToast?.({type:"error",message:e.message});}finally{setBusy(false);}};
 const [checkout,setCheckout]=useState(null),[linkAmount,setLinkAmount]=useState("");
 useEffect(()=>{setCheckout(null);const row=rows.find(r=>r.id===selected);setLinkAmount(row?.balanceDue>0?String(row.balanceDue):"");},[selected,id]);
 const generate=async()=>{setPaymentBusy(true);setPaymentError("");try{
 const token=await auth.currentUser?.getIdToken();
 const response=await fetch("/api/payments/enrollment-link",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({studentId:id,enrollmentId:selected,amount:linkAmount})});
 const result=await response.json().catch(()=>({}));if(!response.ok||!result.ok)throw new Error(result.error||"Enrollment checkout unavailable ("+response.status+")");setCheckout(result.payment);
 }catch(e){setPaymentError(e.message);}finally{setPaymentBusy(false);}};
 const [contractId,setContractId]=useState(""),[contract,setContract]=useState({});
 const updateContract=async()=>{setBusy(true);try{const r=await request(id,contract,"/"+encodeURIComponent(contractId)+"/contract");setRows(old=>old.map(row=>row.id===contractId?r.enrollment:row));setContractId("");pushToast?.({type:"success",message:"Level details saved"});}catch(e){pushToast?.({type:"error",message:e.message});}finally{setBusy(false);}};
 
 const sync=async(row)=>{setBusy(true);try{await request(id,{},"/"+encodeURIComponent(row.id)+"/sync-sheet");const r=await request(id);setRows(r.enrollments);pushToast?.({type:"success",message:"Enrollment sheet synchronized"});}catch(e){pushToast?.({type:"error",message:e.message});}finally{setBusy(false);}};
 const change=(key,value)=>setDraft(old=>({...old,[key]:value}));
 if(mode!=="enrollments"&&loadedId!==id)return <p role={error?"alert":"status"}>{error||"Loading level balances…"}</p>;
 if(mode!=="enrollments"&&rows.length===0)return legacyFallback;
 return <div style={{display:"grid",gap:12}}>
 <h3>{mode==="payments"?"Payments by level":mode==="links"?"Payment links by level":mode==="overview"?"Level balances":"Level enrollments"}</h3>
 {mode==="enrollments"?<p style={{margin:0}}>Set the enrollment status independently of payment. Fees and dates can be entered later. Saving totals does not issue a receipt. Campus access and older account records are unchanged.</p>:<p style={{margin:0}}>These are the same saved balances shown in Enrollments. Each level is billed separately.</p>}
 {busy&&<p>Loading…</p>}{error&&<p role="alert">{error}</p>}
 {rows.map(row=><div key={row.id} style={{border:"1px solid #e2e8f0",borderRadius:10,padding:12}}><strong>{row.program} · {row.level}</strong><div>{row.className||"No class"} · {row.status}</div><div>Tuition: {amountLabel(row.tuitionFee)} · Paid: {amountLabel(row.paid)} · Balance: {amountLabel(row.balanceDue)} · {row.paymentStatus||"Unpaid"}</div><small>Payment deadline: {row.paymentDeadline||"Not set"}{mode==="enrollments"?" · Sheet: "+(row.sheetSyncStatus||"pending"):""}</small>{mode==="enrollments"&&<div><button type="button" disabled={busy} onClick={()=>sync(row)}>Sync sheet / refresh</button> <button type="button" disabled={busy} onClick={()=>{setContractId(contractId===row.id?"":row.id);setContract({tuitionFee:String(row.tuitionFee??""),paid:String(row.paid??0),contractStart:row.contractStart||"",contractEnd:row.contractEnd||"",paymentDeadline:row.paymentDeadline||"",className:row.className||"",status:row.status||"planned"});}}>Edit level</button></div>}{mode==="enrollments"&&contractId===row.id&&<div className="student-detail-fields"><label>Tuition fee (optional)<input type="number" min="0" step="0.01" value={contract.tuitionFee} onChange={e=>setContract({...contract,tuitionFee:e.target.value})}/></label><label>Total already paid<input type="number" min="0" max={contract.tuitionFee||undefined} step="0.01" value={contract.paid} onChange={e=>setContract({...contract,paid:e.target.value})}/></label><div>Balance: {balanceLabel(contract)}</div><small>Enter the correct total, including any payments already recorded for this level. Saving does not issue a receipt.</small>{["contractStart","contractEnd","paymentDeadline"].map(k=><label key={k}>{dateLabels[k]}<input type="date" value={contract[k]} onChange={e=>setContract({...contract,[k]:e.target.value})}/></label>)}<button type="button" disabled={!contract.contractStart} onClick={()=>setContract(suggestDates(contract))}>Suggest dates (6 months / 1 month)</button><label>Class<input value={contract.className} onChange={e=>setContract({...contract,className:e.target.value})}/></label><label>Enrollment status<select value={contract.status} onChange={e=>setContract({...contract,status:e.target.value})}>{statuses.map(v=><option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></label><small>Enrollment status does not yet change campus access.</small><button type="button" disabled={busy||invalidTotals(contract)} onClick={updateContract}>Save level</button></div>}{mode!=="overview"&&<div><button type="button" disabled={mode==="links"&&!(row.balanceDue>0)} onClick={()=>setSelected(selected===row.id?"":row.id)}>{selected===row.id?"Close":mode==="links"?"Generate payment link":"Manage level payments"}</button></div>}{mode!=="overview"&&selected===row.id&&<div style={{display:"grid",gap:8,marginTop:10}}>{mode!=="links"&&<><h4>Payment history</h4>{payments.map(p=><div key={p.id}>{p.receivedDate} · GH₵{p.amount} · {p.method} · {p.reference}</div>)}</>}{paymentError&&<p role="alert">{paymentError}</p>}{row.balanceDue>0&&<>{mode!=="links"&&<><label>Method<select value={payment.method} onChange={e=>setPayment({...payment,method:e.target.value})}><option value="momo">MoMo</option><option value="bank">Bank transfer</option><option value="cash">Cash</option><option value="paystack">Existing Paystack payment</option></select></label><label>Reference<input value={payment.reference} onChange={e=>setPayment({...payment,reference:e.target.value})}/></label>{payment.method!=="paystack"&&<><label>Amount<input type="number" min="0.01" step="0.01" value={payment.amount} onChange={e=>setPayment({...payment,amount:e.target.value})}/></label><label>Payment date<input type="date" value={payment.receivedDate} onChange={e=>setPayment({...payment,receivedDate:e.target.value})}/></label></>}<button type="button" disabled={paymentBusy||!payment.reference.trim()||(payment.method!=="paystack"&&(!payment.receivedDate||!(Number(payment.amount)>0)))} onClick={record}>Record level payment</button></>}{mode!=="payments"&&<><h4>Level payment link</h4><label>Tuition amount<input type="number" min="0.01" max={row.balanceDue} step="0.01" value={linkAmount} onChange={e=>setLinkAmount(e.target.value)}/></label><button type="button" disabled={paymentBusy||!(Number(linkAmount)>0)||Number(linkAmount)>row.balanceDue} onClick={generate}>Generate Paystack link</button>{checkout&&<div><a href={checkout.authorizationUrl} target="_blank" rel="noreferrer">Open checkout</a><button type="button" onClick={()=>navigator.clipboard.writeText(checkout.authorizationUrl)}>Copy link</button></div>}</>}</>}</div>}</div>)}
 {mode==="payments"&&legacyHistory&&<div><button type="button" onClick={()=>setShowHistory(v=>!v)}>{showHistory?"Hide older Paystack history":"View older Paystack history"}</button>{showHistory&&<div><p>Historical account payments; not automatically assigned to a level.</p>{legacyHistory}</div>}</div>}
 {mode==="enrollments"&&<button type="button" disabled={busy||Boolean(error)} onClick={()=>setOpen(!open)}>{open?"Cancel":"+ Add level"}</button>}
 {mode==="enrollments"&&open&&<div className="student-detail-fields">
 <label>Language<select value={draft.program} onChange={e=>change("program",e.target.value)}><option value="german">German</option><option value="swahili">Kiswahili</option></select></label>
 <label>Level<select value={draft.level} onChange={e=>change("level",e.target.value)}>{["A1","A2","B1","B2","C1","C2"].map(l=><option key={l}>{l}</option>)}</select></label>
 <label>Tuition fee (optional)<input type="number" min="0" step="0.01" value={draft.tuitionFee} onChange={e=>change("tuitionFee",e.target.value)}/></label>
 <label>Total already paid<input type="number" min="0" max={draft.tuitionFee||undefined} step="0.01" value={draft.paid} onChange={e=>change("paid",e.target.value)}/></label>
 <div>Balance: {balanceLabel(draft)}</div>
 <label>Class<input value={draft.className} onChange={e=>change("className",e.target.value)}/></label>
 {["contractStart","contractEnd","paymentDeadline"].map(k=><label key={k}>{dateLabels[k]}<input type="date" value={draft[k]} onChange={e=>change(k,e.target.value)}/></label>)}
 <button type="button" disabled={!draft.contractStart} onClick={()=>setDraft(suggestDates(draft))}>Suggest dates (6 months / 1 month)</button>
 <label>Enrollment status<select value={draft.status} onChange={e=>change("status",e.target.value)}>{statuses.map(v=><option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></label>
 <button type="button" disabled={busy||invalidTotals(draft)} onClick={save}>Save level</button></div>}
 </div>;
}

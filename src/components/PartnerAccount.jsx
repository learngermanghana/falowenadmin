import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, reload, signOut } from "firebase/auth";
import { partnerAuth, partnerRequest, downloadPartnerAgreement } from "../utils/organisationPartnerAccount.js";
import "./PartnerAccount.css";
const money = value => value == null ? 'Not verified' : new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(value);
const sections = ['Overview', 'Students', 'Payments', 'Agreements', 'Account'];
function PartnerDashboard({ profile, enrolment, children, refresh, run, busy, messages }) {
  const [tab, setTab] = useState(enrolment ? 'Students' : 'Overview');
  const [history, setHistory] = useState(null), [batchId, setBatchId] = useState(''), [billing, setBilling] = useState(null);
  const [editing, setEditing] = useState(false);
  const approved = profile.agreement?.status === 'approved';
  const loadHistory = async () => {
    const uid = partnerAuth.currentUser?.uid;
    const data = await partnerRequest('organisation-partners/submissions');
    if (uid !== partnerAuth.currentUser?.uid) return;
    setHistory(data);
    if (!batchId && data.submissions.length === 1) {
      const id = data.submissions[0].id;
      setBatchId(id);
      await loadBilling(id);
    }
  };
  const loadBilling = async id => {
    const uid = partnerAuth.currentUser?.uid;
    setBilling(null);
    const data = await partnerRequest('organisation-partners/billing/' + encodeURIComponent(id));
    if (uid === partnerAuth.currentUser?.uid) setBilling(data);
  };
  useEffect(() => { if (enrolment) run(loadHistory); }, [enrolment]);
  const select = next => {
    setTab(next);
    if ((next === 'Students' || next === 'Payments') && !history) run(loadHistory);
  };
  const pay = reference => run(async () => {
    const uid = partnerAuth.currentUser?.uid;
    const data = await partnerRequest('organisation-partners/billing/' + encodeURIComponent(batchId));
    if (uid !== partnerAuth.currentUser?.uid) return;
    setBilling(data);
    const invoice = data.payments.find(item => item.reference === reference);
    if (!invoice?.payUrl) throw new Error(invoice?.reason || 'This invoice is no longer payable. Refresh and contact Falowen.');
    window.location.assign(invoice.payUrl);
  });
  const billingPicker = <div className="partner-billing-picker">
    <label>Student group / submission<select value={batchId} disabled={busy} onChange={event => { const id = event.target.value; setBatchId(id); setBilling(null); if (id) run(() => loadBilling(id)); }}>
      <option value="">Select a group</option>{history?.submissions.map((batch, index) => <option key={batch.id} value={batch.id}>Group {index + 1} · {batch.students.length} student(s) · {batch.students.slice(0, 2).map(s => s.name).join(', ')}</option>)}
    </select></label>
    <button type="button" disabled={busy} onClick={() => run(async () => { await loadHistory(); if (batchId) await loadBilling(batchId); })}>Refresh groups and balances</button>
    {history?.truncated && <p>Showing up to 50 groups. Contact Falowen for older records.</p>}
    {history?.submissions.length === 0 && <p>No student groups submitted yet.</p>}
    {billing?.truncated && <p role="alert">History is incomplete. Contact Falowen for a full payment review.</p>}
  </div>;
  return <>
    <section className="partner-account partner-dashboard">
      <div className="partner-dashboard-heading"><div><p className="partner-dashboard-eyebrow">Organisation dashboard</p><h2>{profile.name}</h2><p>Agreement: <strong>{profile.agreement?.status || 'Not signed'}</strong></p></div>
      {approved && <button className="partner-pay-primary" type="button" disabled={busy} onClick={() => select('Payments')}>Pay student fees</button>}</div>
      <nav className="partner-dashboard-tabs" aria-label="Partner account sections">{sections.map(name => <button key={name} type="button" disabled={busy} aria-current={tab === name ? 'page' : undefined} onClick={() => select(name)}>{name}</button>)}</nav>
      {tab === 'Overview' && <div className="partner-dashboard-body"><h3>Welcome to your partner account</h3><p>{approved ? 'Manage your students, review fees and pay approved invoices without waiting for another email.' : 'Complete your partnership agreement and wait for Falowen approval before adding students or paying new invoices.'}</p>
        <div className="partner-dashboard-cards"><button type="button" disabled={busy} onClick={() => select('Students')}><strong>Students</strong><span>View submissions, classes and fee balances</span></button><button type="button" disabled={busy} onClick={() => select('Payments')}><strong>Payments</strong><span>Pay approved invoices and view payment history</span></button><button type="button" disabled={busy} onClick={() => select('Agreements')}><strong>Agreement</strong><span>Check approval or download your signed copy</span></button></div></div>}
      {tab === 'Students' && <div className="partner-dashboard-body"><h3>Students</h3>{approved && !enrolment && <a className="partner-pay-primary" href="/organisation-enrolment">Add students</a>}
        {billingPicker}
        {history?.submissions.find(group => group.id === batchId) && <ul className="partner-student-list">{history.submissions.find(group => group.id === batchId).students.map((student, index) => <li key={index}>{student.name} · {student.level} · {student.status}</li>)}</ul>}
        {billing?.students.map((student, index) => <article className="partner-billing-card" key={index}><h4>{student.name} · {student.level}</h4><p>{student.className || 'Class not assigned'} · {student.paymentStatus}</p><dl><div><dt>Tuition</dt><dd>{money(student.tuitionFee)}</dd></div><div><dt>Paid</dt><dd>{money(student.paid)}</dd></div><div><dt>Outstanding</dt><dd>{money(student.balanceDue)}</dd></div></dl>{student.paymentDeadline && <p>Payment deadline: {student.paymentDeadline}</p>}{student.accessEndDate && <p>Access ends: {student.accessEndDate}</p>}</article>)}
        <p>Academic attendance and results are not shared through this account.</p>
      </div>}
      {tab === 'Payments' && <div className="partner-dashboard-body"><h3>Student fees and invoices</h3><p>Select a student group. Pay only an approved invoice; your agreed first-payment share and any checkout charge are already calculated by Falowen.</p>{billingPicker}
        {billing && <><h4>Outstanding student fees</h4>{billing.students.length ? <ul className="partner-student-list">{billing.students.map((student, index) => <li key={index}>{student.name} · {student.level}: <strong>{money(student.balanceDue)}</strong></li>)}</ul> : <p>No approved student records in this group.</p>}
        <h4>Invoices and payment history</h4>{!billing.payments.length && <p>No invoice issued yet. Falowen must confirm the fees and issue an invoice before you can pay.</p>}
        {billing.payments.map(invoice => <article className="partner-billing-card" key={invoice.reference}><div className="partner-dashboard-heading"><h4>{invoice.status === 'paid' ? 'Verified payment' : 'Invoice'} · {invoice.status.replaceAll('_', ' ')}</h4>{invoice.payUrl && <button type="button" disabled={busy} className="partner-pay-primary" onClick={() => pay(invoice.reference)}>Pay now · {money(invoice.checkoutAmount)}</button>}</div><p>Reference: {invoice.reference}</p>
          <dl><div><dt>Tuition payable</dt><dd>{money(invoice.tuitionCredit)}</dd></div><div><dt>Partner deduction</dt><dd>{money(invoice.discount)}</dd></div><div><dt>Processing charge</dt><dd>{money(invoice.processingShare)}</dd></div><div><dt>Total checkout</dt><dd>{money(invoice.checkoutAmount)}</dd></div></dl>
          <details><summary>Student allocations</summary><ul>{invoice.lines.map((line, index) => <li key={index}>{line.name} · tuition {money(line.grossAmount)} · deduction {money(line.discount)} · net {money(line.tuitionCredit)}</li>)}</ul></details>
          {invoice.reason && <p role="alert">{invoice.reason}</p>}
          {invoice.status === 'paid' && <p>Payment verified. Receipt email: {invoice.receiptStatus || 'Not confirmed'}.</p>}
          {invoice.status === 'paid_needs_review' && <p>Payment requires Falowen review. Do not pay again.</p>}
        </article>)}</>}
      </div>}
      {tab === 'Agreements' && <div className="partner-dashboard-body"><h3>Partnership agreement</h3><p>Status: {profile.agreement?.status || 'Not signed'}</p>{profile.agreement ? <button disabled={busy} onClick={() => run(downloadPartnerAgreement)}>Download signed agreement</button> : enrolment ? <a href="/partnerships">Sign your agreement</a> : <p>Complete the agreement below.</p>}<button disabled={busy} onClick={() => run(refresh)}>Refresh approval status</button></div>}
      {tab === 'Account' && <div className="partner-dashboard-body"><h3>Account details</h3><p>Partner ID: {profile.id}</p><p>{profile.contactName} · {profile.email} · {profile.phone}</p><button type="button" disabled={busy} onClick={() => setEditing(!editing)}>Update contact</button><button disabled={busy} onClick={() => run(() => signOut(partnerAuth))}>Sign out</button>
      {editing && <form onSubmit={event => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); run(async () => { await partnerRequest('organisation-partners/contact', body); await refresh(); setEditing(false); }); }}><label>Contact name<input name="contactName" maxLength={150} defaultValue={profile.contactName} required /></label><label>Phone<input name="phone" type="tel" maxLength={40} defaultValue={profile.phone} required /></label><p>Contact Falowen to change the registered email or organisation name.</p><button disabled={busy}>Save contact</button></form>}</div>}
      {messages}
    </section>
    {enrolment && !approved ? <section className="partner-account"><p>{profile.agreement ? 'Your partnership needs Falowen approval before you can add students.' : 'Sign your agreement on the Partnerships page first.'}</p><a href="/partnerships">Open Partnerships</a></section> : enrolment && tab === 'Students' ? children({ profile, refresh }) : !enrolment && !profile.agreement ? children({ profile, refresh }) : null}
  </>;
}
export default function PartnerAccount({ children, enrolment = false }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [profile, setProfile] = useState(null);
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [mode, setMode] = useState('signin');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const run = async action => { setBusy(true); setError(''); setNotice(''); try { await action(); } catch(e) { setError(e.code === 'auth/email-already-in-use' ? 'This email already has an account. Choose Existing partner — sign in, or use Set password / forgot password.' : e.message); } finally { setBusy(false); } };
  async function refresh() {
    await reload(partnerAuth.currentUser);
    await partnerAuth.currentUser.getIdToken(true);
    setUser({ email: partnerAuth.currentUser.email, verified: partnerAuth.currentUser.emailVerified });
    if (partnerAuth.currentUser.emailVerified) {
      try { const data = await partnerRequest('organisation-partners/me'); setProfile(data.profile); }
      catch(e) { if(e.status !== 404) throw e; setProfile(null); }
    }
  }
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(partnerAuth, async current => {
      if (!active) return;
      setProfile(null); setError('');
      setUser(current ? { email: current.email, verified: current.emailVerified } : null);
      try { if(current?.emailVerified) { const data = await partnerRequest('organisation-partners/me'); if(active && partnerAuth.currentUser?.uid === current.uid) setProfile(data.profile); } }
      catch(e) { if(active && e.status !== 404) setError(e.message); }
      finally { if(active) setLoading(false); }
    });
    return () => { active = false; unsubscribe(); };
  }, []);
  const messages = <>{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}</>;
  if(loading) return <section className="partner-account" role="status">Loading partner account…</section>;
  if(!user) return <section className="partner-account"><h2>Your organisation partner account</h2><p>One account for your agreement and every student group. Student and staff accounts remain separate.</p>
    <div className="partner-account-actions"><button type="button" onClick={() => { setMode('signin'); setError(''); }}>Existing partner — sign in</button><button type="button" onClick={() => { setMode('signup'); setError(''); }}>New organisation — create account</button></div>
    <h3>{mode === 'signup' ? 'Create your partner login' : 'Partner sign in'}</h3>
    <form onSubmit={event => { event.preventDefault(); run(async () => {
      if(mode === 'signup') { const result = await createUserWithEmailAndPassword(partnerAuth, email.trim(), password); await sendEmailVerification(result.user, { url: 'https://www.falowen.app/partnerships' }); setNotice('Verification email sent. Verify your email, then return here.'); }
      else await signInWithEmailAndPassword(partnerAuth, email.trim(), password);
      setPassword('');
    }); }}><label>Registered organisation email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /></label><button disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button></form>
    <button type="button" disabled={busy || !email.trim()} onClick={() => run(async () => { try { await sendPasswordResetEmail(partnerAuth, email.trim(), { url: 'https://www.falowen.app/partnerships' }); } catch(e) { if(e.code !== 'auth/user-not-found') throw e; } setNotice('If an account is available for this email, a password setup/reset email has been requested.'); })}>Set password / forgot password?</button>
    <p>Already submitted students? Use the email from those submissions. Falowen can prepare your existing account and send a setup email. If you no longer use that email, contact Falowen for verification.</p>{messages}</section>;
  if(!user.verified) return <section className="partner-account"><h2>Verify your partner email</h2><p>Signed in as {user.email}. Email verification is required before accessing company records, including after setting a password.</p><button disabled={busy} onClick={() => run(async () => { await sendEmailVerification(partnerAuth.currentUser, { url: 'https://www.falowen.app/partnerships' }); setNotice('Verification email sent.'); })}>Send verification email</button><button disabled={busy} onClick={() => run(refresh)}>I verified my email — continue</button><button disabled={busy} onClick={() => run(() => signOut(partnerAuth))}>Sign out</button>{messages}</section>;
  if(!profile) return <section className="partner-account"><h2>Register your organisation profile</h2><p>Verified email: {user.email}. If you previously submitted students or signed an agreement, ask Falowen to activate that existing profile instead of registering again.</p><form onSubmit={event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); run(async () => { await partnerRequest('organisation-partners/register', data); await refresh(); }); }}><label>Organisation name<input name="name" maxLength={150} required /></label><label>Authorised contact name<input name="contactName" maxLength={150} required /></label><label>Contact phone<input name="phone" type="tel" maxLength={40} required /></label><label>Address<input name="address" maxLength={300} required /></label><button disabled={busy}>Save organisation profile</button></form><button disabled={busy} onClick={() => run(refresh)}>Check existing account activation</button><button disabled={busy} onClick={() => run(() => signOut(partnerAuth))}>Sign out</button>{messages}</section>;
  return <PartnerDashboard key={profile.id} profile={profile} enrolment={enrolment} refresh={refresh} run={run} busy={busy} messages={messages}>{children}</PartnerDashboard>;
}

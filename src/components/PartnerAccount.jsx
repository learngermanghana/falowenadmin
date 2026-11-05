import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, reload, signOut } from "firebase/auth";
import { partnerAuth, partnerRequest, downloadPartnerAgreement } from "../utils/organisationPartnerAccount.js";
import "./PartnerAccount.css";
export default function PartnerAccount({ children, enrolment = false }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [profile, setProfile] = useState(null);
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [mode, setMode] = useState('signin');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(null), [editing, setEditing] = useState(false);
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
      setProfile(null); setHistory(null); setError('');
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
  const approved = profile.agreement?.status === 'approved';
  return <><section className="partner-account"><h2>{profile.name}</h2><p>Partner ID: <strong>{profile.id}</strong></p><p>{profile.contactName} · {profile.email} · {profile.phone}</p><p>Agreement: <strong>{profile.agreement ? profile.agreement.status : 'Not signed'}</strong></p><div className="partner-account-actions"><a href="/partnerships">Agreement and profile</a>{approved && <a href="/organisation-enrolment">Add students</a>}<button disabled={busy} onClick={() => run(refresh)}>Refresh approval status</button><button disabled={busy} onClick={() => setEditing(!editing)}>Update contact</button><button disabled={busy} onClick={() => run(() => signOut(partnerAuth))}>Sign out</button></div>
    {editing && <form onSubmit={event => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); run(async () => { await partnerRequest('organisation-partners/contact', body); await refresh(); setEditing(false); }); }}><label>Contact name<input name="contactName" maxLength={150} defaultValue={profile.contactName} required /></label><label>Phone<input name="phone" type="tel" maxLength={40} defaultValue={profile.phone} required /></label><p>Changing your contact keeps the same profile. Contact Falowen to change the registered email or company name.</p><button disabled={busy}>Save contact</button></form>}
    {profile.agreement && <button disabled={busy} onClick={() => run(downloadPartnerAgreement)}>Download signed agreement</button>}
    <button disabled={busy} onClick={() => run(async () => { const uid = partnerAuth.currentUser?.uid; const data = await partnerRequest('organisation-partners/submissions'); if (uid === partnerAuth.currentUser?.uid) setHistory(data); })}>View previous student submissions</button>
    {history && <div>{history.submissions.length === 0 && <p>No submissions found.</p>}{history.submissions.map(batch => <article key={batch.id}><h3>Submission {batch.id}</h3><ul>{batch.students.map((student, index) => <li key={index}>{student.name} · {student.level} · {student.status}</li>)}</ul></article>)}{history.truncated && <p>Showing up to 50 submissions. Contact Falowen for older records.</p>}</div>}{messages}
  </section>{enrolment && !approved ? <section className="partner-account"><p>{profile.agreement ? 'Your partnership needs Falowen approval before you can add students.' : 'Sign your agreement on the Partnerships page first.'}</p><a href="/partnerships">Open Partnerships</a></section> : (!enrolment && profile.agreement) ? <section className="partner-account"><p>{approved ? 'Your organisation is approved. You can add students using the same account whenever needed.' : 'Your agreement is saved. Falowen will review your partnership. No need to sign again.'}</p></section> : children({ profile, refresh })}</>;
}

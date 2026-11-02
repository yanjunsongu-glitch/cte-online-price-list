'use client';
import {useState} from 'react';
import './register.css';

const DEPARTMENTS=['Sales','Pre-sales','After-sales','Finance','Warehouse','Management','Other'];

export default function Register(){
  const [form,setForm]=useState({fullName:'',username:'',email:'',phone:'',department:'Sales'});
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const [done,setDone]=useState(false);

  async function submit(e){
    e.preventDefault();
    setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/system/register',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify(form)
      });
      const j=await r.json().catch(()=>({}));
      if(!r.ok){setMsg(j.error||'Could not submit account request.');return}
      setDone(true);
    }finally{setBusy(false)}
  }

  return <main className="register-page">
    <section className="register-card">
      <a className="register-brand" href="/login"><img src="/icon.svg" alt="CTE"/><div><b>CTE Online</b><small>Staff Account Request</small></div></a>
      {!done?<>
        <div className="register-copy">
          <span>CTE STAFF ACCOUNT</span>
          <h1>Request an account</h1>
          <p>Submit your staff details. An Admin will review your request, set your initial password, and assign the correct access.</p>
        </div>
        <form onSubmit={submit}>
          <div className="register-grid">
            <label>Full name<input required value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></label>
            <label>Username<input required value={form.username} onChange={e=>setForm({...form,username:e.target.value.toLowerCase()})} placeholder="your.username"/></label>
            <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
            <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
            <label>Department<select value={form.department} onChange={e=>setForm({...form,department:e.target.value})}>{DEPARTMENTS.map(x=><option key={x}>{x}</option>)}</select></label>
          </div>
          <div className="register-note"><b>Request rules</b><span>Self-registration always creates a Pending Staff request. Admin and Super Admin roles cannot be requested from this page.</span></div>
          {msg&&<div className="register-error">{msg}</div>}
          <button disabled={busy}>{busy?'Submitting…':'Submit account request'}</button>
        </form>
        <div className="register-footer"><span>Already have an account?</span><a href="/login">Sign in</a></div>
      </>:<div className="register-success">
        <div>✓</div>
        <h1>Request submitted</h1>
        <p>Your request is pending. An Admin or Super Admin will review it, set your initial password, and activate your access.</p>
        <a href="/login">Back to Sign in</a>
      </div>}
    </section>
  </main>
}

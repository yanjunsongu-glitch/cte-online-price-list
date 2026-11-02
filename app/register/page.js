'use client';
import {useState} from 'react';
import './register.css';

const DEPARTMENTS=['Sales','Pre-sales','After-sales','Finance','Warehouse','Management','Other'];

export default function Register(){
  const [form,setForm]=useState({fullName:'',username:'',email:'',phone:'',department:'Sales',password:'',confirmPassword:''});
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const [done,setDone]=useState(false);

  async function submit(e){
    e.preventDefault();
    setBusy(true);setMsg('');
    try{
      if(form.password.length<8){setMsg('Password must be at least 8 characters.');return}
      if(form.password!==form.confirmPassword){setMsg('Passwords do not match.');return}
      const r=await fetch('/api/system/register',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({fullName:form.fullName,username:form.username,email:form.email,phone:form.phone,department:form.department,password:form.password})
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
          <p>Create your CTE staff account and set your own password. New accounts are activated immediately with standard Staff access.</p>
        </div>
        <form onSubmit={submit}>
          <div className="register-grid">
            <label>Full name<input required value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></label>
            <label>Username<input required value={form.username} onChange={e=>setForm({...form,username:e.target.value.toLowerCase()})} placeholder="your.username"/></label>
            <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
            <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
            <label>Department<select value={form.department} onChange={e=>setForm({...form,department:e.target.value})}>{DEPARTMENTS.map(x=><option key={x}>{x}</option>)}</select></label>
            <label>Password<input required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Minimum 8 characters"/></label>
            <label>Confirm password<input required minLength={8} type="password" autoComplete="new-password" value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})} placeholder="Enter password again"/></label>
          </div>
          <div className="register-note"><b>Account rules</b><span>Self-registration always creates a normal Staff account. You cannot choose Admin or Super Admin. Default access is limited and can be expanded later by an Admin.</span></div>
          {msg&&<div className="register-error">{msg}</div>}
          <button disabled={busy}>{busy?'Creating account…':'Create account'}</button>
        </form>
        <div className="register-footer"><span>Already have an account?</span><a href="/login">Sign in</a></div>
      </>:<div className="register-success">
        <div>✓</div>
        <h1>Account created</h1>
        <p>Your Staff account is active now. You can sign in with the username and password you just created.</p>
        <a href="/login">Sign in now</a>
      </div>}
    </section>
  </main>
}

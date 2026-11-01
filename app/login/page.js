'use client';
import {useEffect,useState} from 'react';
import './login.css';

export default function Login(){
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    fetch('/api/system/me',{cache:'no-store'}).then(r=>{
      if(r.ok){const next=new URLSearchParams(window.location.search).get('next');window.location.replace(next&&next.startsWith('/')?next:'/system');}
    }).catch(()=>{});
  },[]);

  async function submit(e){
    e.preventDefault();
    setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/system/login',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({username,password})
      });
      const j=await r.json().catch(()=>({}));
      if(!r.ok){setMsg(j.error||'Login failed.');return}
      const next=new URLSearchParams(window.location.search).get('next');window.location.replace(next&&next.startsWith('/')?next:'/system');
    }finally{setBusy(false)}
  }

  return <main className="cte-login">
    <section className="cte-login-panel">
      <a className="cte-login-brand" href="/system"><img src="/icon.svg" alt="CTE"/><div><b>CTE Online</b><small>Internal Business System</small></div></a>
      <div className="cte-login-copy">
        <span>CTE ACCOUNT</span>
        <h1>Sign in to your workspace</h1>
        <p>One account for Price List, Quotations, Finance, Warehouse and Administration.</p>
      </div>
      <form onSubmit={submit}>
        <label>Username<input autoFocus value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" placeholder="your.username"/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••"/></label>
        <button disabled={busy||!username||!password}>{busy?'Signing in…':'Sign in'}</button>
        {msg&&<div className="cte-login-error">{msg}</div>}
      </form>
      <footer><span>CTE Myanmar</span><small>Authorized staff only</small></footer>
    </section>
    <section className="cte-login-side">
      <div>
        <span>ONE WORKSPACE</span>
        <h2>From pricing to delivery.</h2>
        <p>Use one secure account across your daily CTE operations.</p>
      </div>
      <div className="cte-login-modules">
        <div><b>Price List</b><span>Products, prices & customer sharing</span></div>
        <div><b>Quotations</b><span>BOQ, customer offers & approvals</span></div>
        <div><b>Finance</b><span>Invoices, payments & outstanding</span></div>
        <div><b>Warehouse</b><span>Inventory, reservations & stock flow</span></div>
      </div>
    </section>
  </main>
}

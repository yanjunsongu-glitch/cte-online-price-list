'use client';
import {useEffect,useState} from 'react';
import './activity.css';

function fmt(v){
  if(!v)return '—';
  try{return new Intl.DateTimeFormat('en-GB',{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(v))}
  catch{return v}
}
function label(v){return String(v||'').replaceAll('-',' ').replace(/w/g,m=>m.toUpperCase())}

export default function Activity(){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  useEffect(()=>{
    fetch('/api/system/activity?limit=100',{cache:'no-store'}).then(async r=>{
      if(r.status===401){window.location.replace('/login?next=/admin/activity');return}
      if(r.status===403){setMsg('Your account does not have permission to view the audit log.');setLoading(false);return}
      if(!r.ok){setMsg('Could not load activity log.');setLoading(false);return}
      const j=await r.json();setItems(j.items||[]);setLoading(false);
    }).catch(()=>{setMsg('Could not load activity log.');setLoading(false)});
  },[]);

  return <main className="activity-page">
    <header className="activity-top">
      <a href="/system" className="activity-brand"><img src="/icon.svg" alt="CTE"/><div><b>CTE Online</b><small>Audit & Security</small></div></a>
      <a href="/admin/users">Users & Access</a>
    </header>
    <div className="activity-wrap">
      <section className="activity-heading"><div><span>ADMINISTRATION</span><h1>Activity Log</h1><p>Append-only history of important account and business changes.</p></div><a href="/system">← Back to Dashbook</a></section>
      {msg&&<div className="activity-message">{msg}</div>}
      {loading?<div className="activity-empty">Loading activity…</div>:items.length?<div className="activity-list">
        {items.map(x=><article key={x.id}>
          <div className={'activity-icon module-'+x.module}>{String(x.module||'S').slice(0,1).toUpperCase()}</div>
          <div className="activity-main"><div><strong>{x.actor}</strong><span>{label(x.action)}</span><b>{label(x.module)}</b></div><p>{label(x.objectType)} {x.objectId?('· '+x.objectId):''}</p></div>
          <time>{fmt(x.createdAt)}</time>
          <details><summary>Details</summary><pre>{JSON.stringify({before:x.before,after:x.after,meta:x.meta},null,2)}</pre></details>
        </article>)}
      </div>:<div className="activity-empty">No audited activity yet.</div>}
    </div>
  </main>
}

'use client';
import {useEffect,useMemo,useState} from 'react';
import './system.css';

function money(v,currency='RMB'){
  const n=Number(v||0);
  if(!Number.isFinite(n))return '—';
  const label=currency==='MMK'?'MMK':currency==='CNY'?'CNY':'RMB';
  return n.toLocaleString('en-US',{maximumFractionDigits:2})+' '+label;
}
function shortDate(v){
  if(!v)return 'Not published yet';
  try{return new Intl.DateTimeFormat('en-GB',{month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}
  catch{return '—'}
}
function todayLabel(){
  try{return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date())}
  catch{return ''}
}
function Icon({type}){
  const p={viewBox:'0 0 24 24','aria-hidden':'true'};
  if(type==='home')return <svg {...p}><path d="m4 10 8-6 8 6v9H5v-9"/><path d="M9 19v-6h6v6"/></svg>;
  if(type==='price')return <svg {...p}><path d="M4 4h8l8 8-8 8-8-8V4Z"/><circle cx="8.2" cy="8.2" r="1.2"/></svg>;
  if(type==='quote')return <svg {...p}><path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 12h6M9 16h5"/></svg>;
  if(type==='finance')return <svg {...p}><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/></svg>;
  if(type==='warehouse')return <svg {...p}><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z"/><path d="m4 7 8 4 8-4M12 11v10"/></svg>;
  if(type==='staff')return <svg {...p}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 19c.6-3.2 2.7-5 6-5s5.4 1.8 6 5M15 15c2.9 0 4.8 1.3 5.5 4"/></svg>;
  if(type==='rate')return <svg {...p}><path d="M6 7h12M6 17h12M9 4 6 7l3 3M15 14l3 3-3 3"/></svg>;
  if(type==='arrow')return <svg {...p}><path d="M7 17 17 7M9 7h8v8"/></svg>;
  if(type==='plus')return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
}
function Kpi({type,label,value,sub,tone='blue',href}){
  const body=<>
    <div className={'kpi-icon '+tone}><Icon type={type}/></div>
    <div className="kpi-copy"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>
  </>;
  return href?<a className="kpi-card" href={href}>{body}</a>:<div className="kpi-card">{body}</div>;
}
function ModuleCard({type,title,desc,href,tone='blue',locked=false,badge}){
  return <a className={'module-tile '+tone+(locked?' locked':'')} href={href}>
    <div className="module-icon"><Icon type={type}/></div>
    <div className="module-tile-top">{badge&&<span>{badge}</span>}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
    <div className="module-open"><span>{locked?'Restricted':'Open module'}</span><Icon type="arrow"/></div>
  </a>
}

export default function SystemDashboard(){
  const [dash,setDash]=useState(null);
  const [catalog,setCatalog]=useState(null);
  const [loading,setLoading]=useState(true);
  const [accountOpen,setAccountOpen]=useState(false);

  useEffect(()=>{
    let active=true;
    Promise.allSettled([
      fetch('/api/system/dashboard',{cache:'no-store'}).then(r=>r.ok?r.json():null),
      fetch('/api/catalog',{cache:'no-store'}).then(r=>r.ok?r.json():null)
    ]).then(results=>{
      if(!active)return;
      setDash(results[0].status==='fulfilled'?results[0].value:null);
      setCatalog(results[1].status==='fulfilled'?results[1].value:null);
      setLoading(false);
    });
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    if(!accountOpen)return;
    const close=e=>{if(e.key==='Escape'||(e.type==='pointerdown'&&!e.target.closest('.account-wrap')))setAccountOpen(false)};
    window.addEventListener('keydown',close);window.addEventListener('pointerdown',close);
    return()=>{window.removeEventListener('keydown',close);window.removeEventListener('pointerdown',close)};
  },[accountOpen]);

  const role=dash?.role||'Guest';
  const username=dash?.username||'Team Member';
  const displayName=dash?.fullName||username;
  const liveCatalog=catalog||dash?.catalog||null;
  const rate=liveCatalog?.rate;
  const activeProductCount=catalog
    ?(catalog.sections||[]).reduce((sum,s)=>sum+(s.rows||[]).filter(r=>r.visible!==false&&r.archived!==true).length,0)
    :dash?.catalog?.activeProductCount;
  const quotation=dash?.quotations;
  const finance=dash?.finance;

  const openWork=useMemo(()=>{
    const rows=[];
    for(const q of quotation?.recent||[]){
      if(['Draft','Sent'].includes(q.status))rows.push({
        type:'Quotation',title:q.customer||q.quotationNo,ref:q.quotationNo,status:q.status,
        amount:money(q.subtotal,q.currency),href:'/quotation',icon:'quote'
      });
    }
    for(const inv of finance?.recent||[]){
      if(inv.paymentStatus!=='Paid')rows.push({
        type:'Invoice',title:inv.customer||inv.invoiceNo,ref:inv.invoiceNo,status:inv.paymentStatus,
        amount:money(inv.grandTotal,inv.currency),href:'/finance',icon:'finance'
      });
    }
    return rows.slice(0,5);
  },[quotation,finance]);

  async function logout(){
    await fetch('/api/system/logout',{method:'POST'}).catch(()=>{});
    window.location.replace('/login');
  }

  return <main className="dashbook">
    <aside className="dash-sidebar">
      <a className="dash-brand" href="/system">
        <img src="/icon.svg" alt="CTE"/>
        <div><strong>CTE</strong><span>Dashbook</span></div>
      </a>

      <div className="side-label">CONTROL CENTER</div>
      <nav className="side-nav">
        <a className="active" href="/system"><Icon type="home"/><span>Dashbook</span></a>
        <a href="/"><Icon type="price"/><span>Price List</span></a>
        {dash?.permissions?.quotation&&<a href="/quotation"><Icon type="quote"/><span>Quotations</span></a>}
        {dash?.permissions?.finance&&<a href="/finance"><Icon type="finance"/><span>Finance</span></a>}
        {dash?.permissions?.warehouse&&<a href="/warehouse"><Icon type="warehouse"/><span>Warehouse</span></a>}
        {dash?.permissions?.users&&<a href="/admin/users"><Icon type="staff"/><span>Staff Console</span></a>}
      </nav>

      <div className="side-divider"/>
      <div className="side-label">SYSTEM</div>
      <nav className="side-nav side-secondary">
        {dash?.permissions?.admin&&<a href="/admin"><Icon type="price"/><span>Price Admin</span></a>}
        <a href="/login"><Icon type="staff"/><span>Account</span></a>
      </nav>

      <div className="side-ribbon" aria-hidden="true"/>
      <div className="side-footer"><span>CTE Myanmar</span><small>Internal Operations</small></div>
    </aside>

    <section className="dash-content">
      <header className="dash-topbar">
        <div className="dash-search">
          <span>⌕</span><input aria-label="Search" placeholder="Search in CTE Dashbook…" readOnly/>
          <kbd>⌘ K</kbd>
        </div>

        <div className="account-wrap">
          <button className="top-account" onClick={()=>setAccountOpen(v=>!v)}>
            <div className="top-avatar">{displayName.slice(0,1).toUpperCase()}</div>
            <div><strong>{displayName}</strong><span>{role}</span></div>
            <b>⌄</b>
          </button>
          {accountOpen&&<div className="account-popover">
            <div className="account-pop-head"><strong>{displayName}</strong><span>{role==='Guest'?'Not signed in':role}</span></div>
            <a href="/system">Dashbook</a>
            <a href="/">Price List</a>
            {dash?.permissions?.users&&<a href="/admin/users">Users & Access</a>}
            {dash?.permissions?.admin&&<a href="/admin">Price List Admin</a>}
            {role==='Guest'?<a className="account-primary" href="/login">Sign in</a>:<button onClick={logout}>Sign out</button>}
          </div>}
        </div>
      </header>

      <div className="dash-scroll">
        <section className="hero">
          <div className="hero-ribbon ribbon-red"/>
          <div className="hero-ribbon ribbon-yellow"/>
          <div className="hero-copy">
            <span className="hero-eyebrow">CTE INTERNAL OPERATIONS</span>
            <h1>{role==='Guest'?'Welcome to CTE Dashbook':'Welcome back, '+displayName}</h1>
            <p>Your integrated workspace for pricing, quotations, finance, warehouse, and people operations.</p>
            <div className="hero-meta"><span>{todayLabel()}</span><i/> <span className="online"><b/>Workspace online</span></div>
          </div>
          <img className="hero-mark" src="/icon.svg" alt=""/>
        </section>

        <section className="kpi-grid">
          <Kpi type="rate" label="CNY → MMK" value={rate?('1 : '+Number(rate).toLocaleString('en-US')):(loading?'Checking…':'—')} sub={rate?'Current baseline rate':'Rate unavailable'} tone="blue" href="/"/>
          <Kpi type="price" label="Active Price Items" value={activeProductCount!==undefined?activeProductCount:(loading?'…':'—')} sub={liveCatalog?.updatedAt?'Published '+shortDate(liveCatalog.updatedAt):'Current catalog'} tone="yellow" href="/"/>
          <Kpi type="quote" label="Open Quotations" value={quotation?((quotation.counts?.Draft||0)+(quotation.counts?.Sent||0)):(loading?'…':'Locked')} sub={quotation?((quotation.counts?.Draft||0)+' Draft · '+(quotation.counts?.Sent||0)+' Sent'):'Sign in required'} tone="red" href="/quotation"/>
          <Kpi type="finance" label="Finance Pending" value={finance?((finance.counts?.Unpaid||0)+(finance.counts?.Partial||0)):(loading?'…':'Locked')} sub={finance?((finance.counts?.Unpaid||0)+' Unpaid · '+(finance.counts?.Partial||0)+' Partial'):'Sign in required'} tone="blue" href="/finance"/>
        </section>

        <section className="dash-section">
          <div className="section-heading"><div><span>WORKSPACE</span><h2>Modules</h2></div><p>Core operations, all in one place.</p></div>
          <div className="modules-layout">
            <div className="module-grid">
              <ModuleCard type="price" title="Price List" desc="Manage product pricing, customer pricing, validity, and sharing." href="/" tone="primary"/>
              <ModuleCard type="quote" title="Quotations" desc="Create, manage, and track customer quotations." href="/quotation" tone="red" locked={!dash?.permissions?.quotation}/>
              <ModuleCard type="finance" title="Finance" desc="Monitor invoices, payment status, and outstanding records." href="/finance" tone="yellow" locked={!dash?.permissions?.finance}/>
              <ModuleCard type="warehouse" title="Warehouse" desc="Track inventory, stock movement, reservations, and delivery." href="/warehouse" tone="blue" badge="In development"/>
              {dash?.permissions?.users&&<ModuleCard type="staff" title="Staff Console" desc="Manage staff information, access, and internal permissions." href="/admin/users" tone="purple"/>}
            </div>

            <aside className="quick-panel">
              <div className="quick-head"><div><span>⚡</span><h3>Quick Actions</h3></div><small>Common tasks, one click away.</small></div>
              <div className="quick-list">
                {dash?.permissions?.quotation&&<a href="/quotation?new=true"><Icon type="quote"/><span>New Quotation</span><b>›</b></a>}
                {dash?.permissions?.admin&&<a href="/admin"><Icon type="price"/><span>Update Price List</span><b>›</b></a>}
                {dash?.permissions?.priceShare&&<a href="/?share=true"><Icon type="price"/><span>Share Price List</span><b>›</b></a>}
                {dash?.permissions?.finance&&<a href="/finance?new=true"><Icon type="finance"/><span>Create Invoice</span><b>›</b></a>}
                {dash?.permissions?.users&&<a href="/admin/users"><Icon type="staff"/><span>Manage Staff Access</span><b>›</b></a>}
                {role==='Guest'&&<a href="/login"><Icon type="staff"/><span>Sign in to CTE Account</span><b>›</b></a>}
              </div>
            </aside>
          </div>
        </section>

        <section className="work-panel">
          <div className="section-heading"><div><span>OPEN WORK</span><h2>Needs attention</h2></div><p>Draft quotations and outstanding invoices from live system data.</p></div>
          {openWork.length?<div className="work-list">
            {openWork.map((x,i)=><a href={x.href} key={x.type+x.ref+i}>
              <div className={'work-icon '+(x.type==='Invoice'?'invoice':'quotation')}><Icon type={x.icon}/></div>
              <div className="work-main"><strong>{x.title}</strong><span>{x.ref} · {x.type}</span></div>
              <span className={'work-status '+String(x.status).toLowerCase()}>{x.status}</span>
              <b>{x.amount}</b><em>›</em>
            </a>)}
          </div>:<div className="work-empty"><div>✓</div><strong>{role==='Guest'?'Private activity is locked':'Nothing urgent right now'}</strong><span>{role==='Guest'?'Sign in to load quotation and finance work.':'No Draft/Sent quotations or unpaid invoices are currently surfaced.'}</span></div>}
        </section>

        <footer className="dash-footer"><span>CTE Myanmar · Dashbook</span><small>{role}</small></footer>
      </div>
    </section>
  </main>
}

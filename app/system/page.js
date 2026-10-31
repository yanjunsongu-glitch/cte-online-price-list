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
  try{
    return new Intl.DateTimeFormat('en-GB',{
      month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'
    }).format(new Date(v));
  }catch{return '—'}
}

function todayLabel(){
  try{
    return new Intl.DateTimeFormat('en-GB',{
      weekday:'long',day:'2-digit',month:'long',year:'numeric'
    }).format(new Date());
  }catch{return ''}
}

function Arrow(){
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>;
}

function MiniIcon({type}){
  const common={viewBox:'0 0 24 24','aria-hidden':'true'};
  if(type==='rate')return <svg {...common}><path d="M6 7h12M6 17h12M9 4 6 7l3 3M15 14l3 3-3 3"/></svg>;
  if(type==='price')return <svg {...common}><path d="M4 4h7.8L20 12.2 12.2 20 4 11.8V4Z"/><circle cx="8" cy="8" r="1.4"/></svg>;
  if(type==='quote')return <svg {...common}><path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 12h6M9 16h5"/></svg>;
  if(type==='finance')return <svg {...common}><path d="M4 7h15v12H4V7Z"/><path d="M6 7V5h10M15 12h4v3h-4a1.5 1.5 0 0 1 0-3Z"/></svg>;
  return <svg {...common}><path d="M4 7 12 3l8 4v10l-8 4-8-4V7Z"/><path d="m4 7 8 4 8-4M12 11v10"/></svg>;
}

function StatusCard({icon,label,value,sub,accent='neutral',href}){
  const inner=<>
    <div className={'status-icon accent-'+accent}><MiniIcon type={icon}/></div>
    <div className="status-copy">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
    {href&&<div className="status-arrow"><Arrow/></div>}
  </>;
  return href
    ? <a className="today-card" href={href}>{inner}</a>
    : <div className="today-card">{inner}</div>;
}

export default function SystemDashboard(){
  const [dash,setDash]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    fetch('/api/system/dashboard',{cache:'no-store'})
      .then(r=>r.json())
      .then(j=>setDash(j))
      .catch(()=>setDash(null))
      .finally(()=>setLoading(false));
  },[]);

  const role=dash?.role||'Guest';
  const username=dash?.username||'Team Member';
  const rate=dash?.catalog?.rate;
  const quotation=dash?.quotations;
  const finance=dash?.finance;

  const needsAttention=useMemo(()=>{
    const rows=[];
    if(quotation?.recent){
      for(const q of quotation.recent){
        if(['Draft','Sent'].includes(q.status)){
          rows.push({
            kind:'Quotation',
            title:q.customer||q.quotationNo,
            ref:q.quotationNo,
            status:q.status,
            amount:money(q.subtotal,q.currency),
            href:'/quotation'
          });
        }
      }
    }
    if(finance?.recent){
      for(const inv of finance.recent){
        if(inv.paymentStatus!=='Paid'){
          rows.push({
            kind:'Invoice',
            title:inv.customer||inv.invoiceNo,
            ref:inv.invoiceNo,
            status:inv.paymentStatus,
            amount:money(inv.grandTotal,inv.currency),
            href:'/finance'
          });
        }
      }
    }
    return rows.slice(0,5);
  },[quotation,finance]);

  return <main className="ops-page">
    <header className="ops-header">
      <a className="ops-brand" href="/system">
        <div className="ops-logo">CTE</div>
        <div><strong>CTE Online</strong><span>Internal workspace</span></div>
      </a>

      <nav className="ops-nav">
        <a className="active" href="/system">Dashboard</a>
        <a href="/">Price List</a>
        <a href="/quotation">Quotations</a>
        <a href="/finance">Finance</a>
        <a href="/warehouse">Warehouse</a>
      </nav>

      <div className="account-chip">
        <div className="account-avatar">{username==='Team Member'?'T':username.slice(0,1).toUpperCase()}</div>
        <div><strong>{username}</strong><span>{role}</span></div>
        {dash?.permissions?.admin&&<a href="/admin" aria-label="Open admin">⋯</a>}
      </div>
    </header>

    <div className="ops-main">
      <section className="ops-welcome">
        <div>
          <span>{todayLabel()}</span>
          <h1>{role==='Guest'?'CTE Online System':'Welcome back, '+username}</h1>
          <p>{role==='Guest'
            ? 'Open a module below. Sign in inside Quotations or Finance to see private business summaries here.'
            : 'Here’s what needs attention today.'}</p>
        </div>
        <div className="workspace-state"><i/>Workspace online</div>
      </section>

      <section className="today-grid">
        <StatusCard
          icon="rate"
          label="CNY → MMK"
          value={rate?('1 CNY = '+Number(rate).toLocaleString('en-US')):'—'}
          sub={rate?'Current price-list baseline':'No rate configured'}
          accent="purple"
          href="/"
        />
        <StatusCard
          icon="price"
          label="Price List"
          value={dash?.catalog?.activeProductCount!==undefined?dash.catalog.activeProductCount+' active products':'—'}
          sub={dash?.catalog?.updatedAt?'Published '+shortDate(dash.catalog.updatedAt):dash?.catalog?.validity||'Open current price list'}
          accent="blue"
          href="/"
        />
        <StatusCard
          icon="quote"
          label="Quotations"
          value={quotation
            ? ((quotation.counts?.Draft||0)+(quotation.counts?.Sent||0))+' need attention'
            : (loading?'Loading…':'Sign in to view')}
          sub={quotation
            ? (quotation.counts?.Draft||0)+' Draft · '+(quotation.counts?.Sent||0)+' Sent'
            : 'Private sales data'}
          accent="violet"
          href="/quotation"
        />
        <StatusCard
          icon="finance"
          label="Finance"
          value={finance
            ? ((finance.counts?.Unpaid||0)+(finance.counts?.Partial||0))+' pending'
            : (loading?'Loading…':'Sign in to view')}
          sub={finance
            ? (finance.counts?.Unpaid||0)+' Unpaid · '+(finance.counts?.Partial||0)+' Partial'
            : 'Private finance data'}
          accent="green"
          href="/finance"
        />
      </section>

      <section className="quick-panel">
        <div className="panel-heading">
          <div><span>QUICK ACTIONS</span><h2>Start working</h2></div>
          <p>High-frequency tasks, one click away.</p>
        </div>
        <div className="quick-buttons">
          <a className="quick-primary" href="/quotation?new=true"><span>＋</span> New Quotation</a>
          <a href="/finance?new=true"><span>＋</span> Create Invoice</a>
          <a href="/?share=true"><span>↗</span> Share Price List</a>
          <a className="quick-muted" href="/warehouse"><span>□</span> Check Stock <small>Preview</small></a>
        </div>
      </section>

      <section className="attention-panel">
        <div className="panel-heading">
          <div><span>NEEDS ATTENTION</span><h2>Open work</h2></div>
          <p>Draft quotations and unpaid invoices you can act on.</p>
        </div>

        {needsAttention.length
          ? <div className="attention-list">
              {needsAttention.map((x,i)=><a href={x.href} className="attention-row" key={x.kind+x.ref+i}>
                <div className={'attention-type type-'+x.kind.toLowerCase()}>{x.kind==='Quotation'?'QT':'INV'}</div>
                <div className="attention-main">
                  <strong>{x.title}</strong>
                  <span>{x.ref} · {x.kind}</span>
                </div>
                <div className={'attention-status state-'+String(x.status).toLowerCase()}>{x.status}</div>
                <b>{x.amount}</b>
                <Arrow/>
              </a>)}
            </div>
          : <div className="attention-empty">
              <div>✓</div>
              <strong>{role==='Guest'?'No private activity loaded':'Nothing urgent right now'}</strong>
              <span>{role==='Guest'?'Sign in to Quotations or Finance to surface work here.':'Your current dashboard has no open Draft/Sent quotations or unpaid invoices.'}</span>
            </div>
        }
      </section>

      <section className="module-section">
        <div className="panel-heading">
          <div><span>WORKSPACE</span><h2>Business modules</h2></div>
          <p>Each card shows useful module context instead of repeating navigation.</p>
        </div>

        <div className="module-grid">
          <article className="module-card price-card">
            <div className="module-card-head">
              <div><MiniIcon type="price"/><span>Price List</span></div>
              <a href="/">Open <Arrow/></a>
            </div>
            <h3>{dash?.catalog?.title||'CTE Price List'}</h3>
            <p>{dash?.catalog?.validity||'Current published price list'}</p>
            <div className="catalog-meta">
              <div><span>Rate</span><b>{rate?('1 CNY = '+Number(rate).toLocaleString('en-US')+' MMK'):'—'}</b></div>
              <div><span>Last published</span><b>{dash?.catalog?.updatedAt?shortDate(dash.catalog.updatedAt):'Not recorded yet'}</b></div>
              <div><span>Products</span><b>{dash?.catalog?.activeProductCount??'—'}</b></div>
            </div>
            <div className="featured-products">
              {(dash?.catalog?.featured||[]).map(x=><div key={x.id}><span>{x.name}</span><b>{x.retail!==''?money(x.retail,'RMB'):'—'}</b></div>)}
            </div>
          </article>

          <article className="module-card quote-card">
            <div className="module-card-head">
              <div><MiniIcon type="quote"/><span>Quotations</span></div>
              <a href="/quotation">Open <Arrow/></a>
            </div>
            {quotation
              ? <>
                  <div className="metric-row">
                    <div><b>{quotation.counts?.Draft||0}</b><span>Draft</span></div>
                    <div><b>{quotation.counts?.Sent||0}</b><span>Sent</span></div>
                    <div><b>{quotation.counts?.Accepted||0}</b><span>Accepted</span></div>
                  </div>
                  <div className="recent-list">
                    {(quotation.recent||[]).map(x=><div key={x.id}>
                      <span><strong>{x.customer}</strong><small>{x.quotationNo}</small></span>
                      <b>{x.status}</b>
                    </div>)}
                  </div>
                </>
              : <div className="locked-summary"><span>Sales data is private.</span><a href="/quotation">Sign in to Quotations →</a></div>}
          </article>

          <article className="module-card finance-card">
            <div className="module-card-head">
              <div><MiniIcon type="finance"/><span>Finance</span></div>
              <a href="/finance">Open <Arrow/></a>
            </div>
            {finance
              ? <>
                  <div className="metric-row">
                    <div><b>{finance.counts?.Unpaid||0}</b><span>Unpaid</span></div>
                    <div><b>{finance.counts?.Partial||0}</b><span>Partial</span></div>
                    <div><b>{finance.counts?.Paid||0}</b><span>Paid</span></div>
                  </div>
                  <div className="finance-outstanding">
                    <span>Outstanding</span>
                    <div>
                      {Number(finance.byCurrency?.CNY||0)>0&&<b>{money(finance.byCurrency.CNY,'CNY')}</b>}
                      {Number(finance.byCurrency?.MMK||0)>0&&<b>{money(finance.byCurrency.MMK,'MMK')}</b>}
                      {!Number(finance.byCurrency?.CNY||0)&&!Number(finance.byCurrency?.MMK||0)&&<b>0</b>}
                    </div>
                  </div>
                </>
              : <div className="locked-summary"><span>Finance data is private.</span><a href="/finance">Sign in to Finance →</a></div>}
          </article>

          <article className="module-card warehouse-card">
            <div className="module-card-head">
              <div><MiniIcon type="warehouse"/><span>Warehouse</span></div>
              <span className="development-pill">In Development</span>
            </div>
            <h3>Inventory & stock control</h3>
            <p>Available stock, reserved stock, incoming goods and serial-number tracking.</p>
            <div className="warehouse-preview">
              <div><span>Available</span><b>—</b></div>
              <div><span>Reserved</span><b>—</b></div>
              <div><span>Incoming</span><b>—</b></div>
            </div>
            <a className="preview-link" href="/warehouse">Preview module →</a>
          </article>
        </div>
      </section>
    </div>

    <footer className="ops-footer">
      <div><b>CTE</b><span>Online System</span></div>
      <span>{role}</span>
      <small>CTE Myanmar · Internal workspace</small>
    </footer>
  </main>
}

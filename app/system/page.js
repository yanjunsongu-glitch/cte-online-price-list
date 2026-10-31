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

function StatusCard({icon,label,value,sub,href,attention=false,locked=false}){
  const inner=<>
    <div className="status-card-top">
      <span>{label}</span>
      <div className="status-card-tools">
        <MiniIcon type={icon}/>
        {href&&<Arrow/>}
      </div>
    </div>
    <div className="status-card-value">{value}</div>
    <div className="status-card-sub">{sub}</div>
  </>;
  const cls='today-card'+(attention?' has-attention':'')+(locked?' is-locked':'');
  return href
    ? <a className={cls} href={href}>{inner}</a>
    : <div className={cls}>{inner}</div>;
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
      const dashboard=results[0].status==='fulfilled'?results[0].value:null;
      const liveCatalog=results[1].status==='fulfilled'?results[1].value:null;
      setDash(dashboard);
      setCatalog(liveCatalog);
      setLoading(false);
    });
    return ()=>{active=false};
  },[]);

  useEffect(()=>{
    if(!accountOpen)return;
    const onKey=e=>{if(e.key==='Escape')setAccountOpen(false)};
    const onClick=e=>{
      if(!e.target.closest('.account-menu-wrap'))setAccountOpen(false);
    };
    window.addEventListener('keydown',onKey);
    window.addEventListener('pointerdown',onClick);
    return ()=>{
      window.removeEventListener('keydown',onKey);
      window.removeEventListener('pointerdown',onClick);
    };
  },[accountOpen]);

  const role=dash?.role||'Guest';
  const username=dash?.username||'Team Member';
  const liveCatalog=catalog||dash?.catalog||null;
  const rate=liveCatalog?.rate;
  const activeProductCount=catalog
    ? (catalog.sections||[]).reduce((sum,s)=>sum+(s.rows||[]).filter(r=>r.visible!==false).length,0)
    : dash?.catalog?.activeProductCount;
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

      <div className="account-menu-wrap">
        <button className={accountOpen?'account-chip is-open':'account-chip'} onClick={()=>setAccountOpen(x=>!x)} aria-expanded={accountOpen}>
          <div className="account-avatar">{username==='Team Member'?'T':username.slice(0,1).toUpperCase()}</div>
          <div><strong>{username}</strong><span>{role}</span></div>
          <span className="account-chevron">⌄</span>
        </button>

        {accountOpen&&<div className="account-menu">
          <div className="account-menu-head">
            <div className="account-menu-avatar">{username==='Team Member'?'T':username.slice(0,1).toUpperCase()}</div>
            <div><strong>{username}</strong><span>{role==='Guest'?'Not signed in':role}</span></div>
          </div>

          <div className="account-menu-section">
            <span>WORKSPACE</span>
            <a href="/"><b>Price List</b><small>Open current prices</small></a>
            <a href="/quotation">
              <b>{dash?.permissions?.quotation?'Quotations':'Sign in to Quotations'}</b>
              <small>{dash?.permissions?.quotation?'Open sales workspace':'Sales access required'}</small>
            </a>
            <a href="/finance">
              <b>{dash?.permissions?.finance?'Finance':'Sign in to Finance'}</b>
              <small>{dash?.permissions?.finance?'Open finance workspace':'Finance access required'}</small>
            </a>
            <a href="/warehouse"><b>Warehouse</b><small>Preview inventory module</small></a>
          </div>

          <div className="account-menu-admin">
            <a href="/admin"><span>Admin Console</span><small>{dash?.permissions?.admin?'Super Admin access':'Restricted access'}</small></a>
          </div>
        </div>}
      </div>
    </header>

    <div className="ops-main">
      <section className="ops-welcome">
        <div className="welcome-copy">
          <div className="welcome-meta">
            <span>{todayLabel()}</span>
            <i>·</i>
            <span className="workspace-inline"><b/>Workspace online</span>
          </div>
          <h1>{role==='Guest'?'CTE Online System':'Welcome back, '+username}</h1>
          {role==='Guest'&&<p>Sign in to Quotations or Finance to see private business summaries.</p>}
        </div>

        <div className="welcome-actions">
          <a className="welcome-primary" href="/quotation?new=true"><span>＋</span> New Quotation</a>
          <a href="/finance?new=true"><span>＋</span> Create Invoice</a>
          <a href="/?share=true"><span>↗</span> Share Price List</a>
        </div>
      </section>

      <section className="today-grid">
        <StatusCard
          icon="rate"
          label="CNY → MMK"
          value={rate?('1 CNY = '+Number(rate).toLocaleString('en-US')+' MMK'):(loading?'Checking rate…':'Rate unavailable')}
          sub={rate?'Current price-list baseline':'Open Price List to configure rate'}
          href="/"
        />
        <StatusCard
          icon="price"
          label="Price List"
          value={activeProductCount!==undefined?activeProductCount+' active products':(loading?'Checking products…':'Product data unavailable')}
          sub={liveCatalog?.updatedAt?'Published '+shortDate(liveCatalog.updatedAt):liveCatalog?.validity||'Current product catalog'}
          href="/"
        />
        <StatusCard
          icon="quote"
          label="Quotations"
          value={quotation
            ? ((quotation.counts?.Draft||0)+(quotation.counts?.Sent||0))+' need attention'
            : (loading?'Checking access…':'Locked')}
          sub={quotation
            ? (quotation.counts?.Draft||0)+' Draft · '+(quotation.counts?.Sent||0)+' Sent'
            : (loading?'Verifying session':'Sign in required')}
          attention={Boolean(quotation&&((quotation.counts?.Draft||0)+(quotation.counts?.Sent||0)>0))}
          locked={!quotation&&!loading}
          href="/quotation"
        />
        <StatusCard
          icon="finance"
          label="Finance"
          value={finance
            ? ((finance.counts?.Unpaid||0)+(finance.counts?.Partial||0))+' pending'
            : (loading?'Checking access…':'Locked')}
          sub={finance
            ? (finance.counts?.Unpaid||0)+' Unpaid · '+(finance.counts?.Partial||0)+' Partial'
            : (loading?'Verifying session':'Sign in required')}
          attention={Boolean(finance&&((finance.counts?.Unpaid||0)+(finance.counts?.Partial||0)>0))}
          locked={!finance&&!loading}
          href="/finance"
        />
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
          <p>Live status and key metrics across your core operations.</p>
        </div>

        <div className="module-grid">
          <article className="module-card price-card">
            <div className="module-card-head">
              <div><MiniIcon type="price"/><span>Price List</span></div>
              <a href="/">Open <Arrow/></a>
            </div>
            <h3>{liveCatalog?.title||'CTE Price List'}</h3>
            <p>{liveCatalog?.validity||'Current published price list'}</p>
            <div className="catalog-meta">
              <div><span>Rate</span><b>{rate?('1 CNY = '+Number(rate).toLocaleString('en-US')+' MMK'):'—'}</b></div>
              <div><span>Last published</span><b>{liveCatalog?.updatedAt?shortDate(liveCatalog.updatedAt):'Not recorded yet'}</b></div>
              <div><span>Products</span><b>{activeProductCount??'—'}</b></div>
            </div>
            <div className="featured-products">
              {(catalog
                ? (catalog.sections||[]).flatMap(s=>(s.rows||[]).filter(r=>r.visible!==false)).slice(0,3).map(r=>({id:r.id,name:r.spec,retail:r.retail}))
                : (dash?.catalog?.featured||[])
              ).map(x=><div key={x.id}><span>{x.name}</span><b>{x.retail!==''?money(x.retail,'RMB'):'—'}</b></div>)}
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

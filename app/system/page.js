'use client';
import './system.css';

const modules=[
  {key:'price',title:'Price List',kicker:'Live pricing',desc:'Prices, customer share links and datasheets.',href:'/',status:'Live',icon:'tag'},
  {key:'quotation',title:'Quotation',kicker:'Sales',desc:'Build and save customer BOQ quotations.',href:'/quotation',status:'Beta',icon:'file'},
  {key:'finance',title:'Finance',kicker:'Billing',desc:'Invoices, payment status and finance history.',href:'/finance',status:'Beta',icon:'wallet'},
  {key:'warehouse',title:'Warehouse',kicker:'Operations',desc:'Inventory, stock movement and serial numbers.',href:'/warehouse',status:'Soon',icon:'box'}
];

function Icon({name}){
  if(name==='tag') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7.8L20 12.2 12.2 20 4 11.8V4Z"/><circle cx="8" cy="8" r="1.5"/></svg>;
  if(name==='file') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 12h6M9 16h5"/></svg>;
  if(name==='wallet') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h15v12H4V7Z"/><path d="M6 7V5h10M15 12h4v3h-4a1.5 1.5 0 0 1 0-3Z"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7 12 3l8 4v10l-8 4-8-4V7Z"/><path d="m4 7 8 4 8-4M12 11v10"/></svg>;
}

function Arrow(){
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>;
}

function cardMove(e){
  if(typeof window!=='undefined' && window.matchMedia('(hover:none)').matches) return;
  const r=e.currentTarget.getBoundingClientRect();
  const x=(e.clientX-r.left)/r.width;
  const y=(e.clientY-r.top)/r.height;
  e.currentTarget.style.setProperty('--mx',(x*100)+'%');
  e.currentTarget.style.setProperty('--my',(y*100)+'%');
  e.currentTarget.style.setProperty('--rx',((.5-y)*2.2)+'deg');
  e.currentTarget.style.setProperty('--ry',((x-.5)*2.2)+'deg');
}
function cardLeave(e){
  e.currentTarget.style.setProperty('--rx','0deg');
  e.currentTarget.style.setProperty('--ry','0deg');
  e.currentTarget.style.setProperty('--mx','50%');
  e.currentTarget.style.setProperty('--my','50%');
}

export default function SystemDashboard(){
  return <main className="os-page">
    <div className="os-blob blob-a"/>
    <div className="os-blob blob-b"/>
    <div className="os-noise"/>

    <header className="os-header">
      <a className="os-brand" href="/system">
        <div className="os-logo">CTE</div>
        <div><strong>CTE Online</strong><span>Myanmar workspace</span></div>
      </a>

      <nav className="os-nav">
        <a className="active" href="/system">Home</a>
        <a href="/">Prices</a>
        <a href="/quotation">Quotes</a>
        <a href="/finance">Finance</a>
        <a href="/warehouse">Stock</a>
      </nav>

      <div className="os-header-right">
        <div className="os-online"><i/> Online</div>
        <a className="os-avatar" href="/admin" aria-label="Super Admin">A</a>
      </div>
    </header>

    <section className="os-hero">
      <div className="hero-copy">
        <div className="hero-pill"><span>NEW</span> CTE Online System</div>
        <h1>Work moves faster<br/><em>when everything connects.</em></h1>
        <p>One clean CTE workspace for pricing, quotations, finance and warehouse operations.</p>

        <div className="hero-buttons">
          <a className="hero-go" href="/">Open workspace <Arrow/></a>
          <a className="hero-admin" href="/admin">Admin settings</a>
        </div>
      </div>

      <div className="hero-preview-stage">
        <div className="preview-browser browser-back">
          <div className="browser-bar"><i/><i/><i/><span>cte / quotation</span></div>
          <div className="browser-body quote-mock">
            <div className="mock-title"><span>Quotation</span><b>Draft</b></div>
            <div className="mock-line wide"/><div className="mock-line"/><div className="mock-line short"/>
            <div className="mock-table"><span/><span/><span/><span/></div>
          </div>
        </div>

        <div className="preview-browser browser-front">
          <div className="browser-bar"><i/><i/><i/><span>cte / price-list</span></div>
          <div className="browser-body">
            <div className="mock-kicker">PRICE LIST</div>
            <div className="mock-heading">CTE Myanmar</div>
            <div className="mock-product"><b>LFP16076</b><span>21,099</span></div>
            <div className="mock-product"><b>CIS240KWH</b><span>288,000</span></div>
            <div className="mock-product"><b>CIS261KWH</b><span>299,000</span></div>
          </div>
        </div>

        <div className="preview-float float-finance"><span>Finance</span><b>Invoice ready</b></div>
        <div className="preview-float float-stock"><span>Warehouse</span><b>Stock synced</b></div>
      </div>
    </section>

    <section className="os-section">
      <div className="section-title">
        <div><span>YOUR WORKSPACE</span><h2>Pick a module</h2></div>
        <p>Fast access to the tools your team uses every day.</p>
      </div>

      <div className="bento-grid">
        {modules.map(m=><a
          key={m.key}
          href={m.href}
          className={'bento-card card-'+m.key}
          onPointerMove={cardMove}
          onPointerLeave={cardLeave}
        >
          <div className="card-shine"/>
          <div className="card-top">
            <div className="app-icon"><Icon name={m.icon}/></div>
            <div className={'app-status status-'+m.status.toLowerCase()}><i/>{m.status}</div>
          </div>

          <div className="card-copy">
            <span>{m.kicker}</span>
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
          </div>

          <div className="card-bottom">
            <span>Open</span>
            <div className="round-arrow"><Arrow/></div>
          </div>

          {m.key==='price'&&<div className="price-preview">
            <div className="preview-row"><span>LFP16076</span><b>21,099</b></div>
            <div className="preview-row"><span>CIS240KWH</span><b>288,000</b></div>
            <div className="preview-row"><span>CIS261KWH</span><b>299,000</b></div>
          </div>}

          {m.key==='warehouse'&&<div className="warehouse-bars">
            <span style={{'--w':'78%'}}/><span style={{'--w':'55%'}}/><span style={{'--w':'88%'}}/>
          </div>}
        </a>)}

        <a className="bento-card card-admin" href="/admin" onPointerMove={cardMove} onPointerLeave={cardLeave}>
          <div className="card-shine"/>
          <div className="mini-admin-icon">A</div>
          <div className="card-copy">
            <span>Control center</span>
            <h3>Super Admin</h3>
            <p>Products, prices, customer links and system settings.</p>
          </div>
          <div className="card-bottom"><span>Manage</span><div className="round-arrow"><Arrow/></div></div>
        </a>

        <div className="bento-card card-coming">
          <div className="coming-badge">NEXT</div>
          <div className="card-copy">
            <span>Coming next</span>
            <h3>Users & Roles</h3>
            <p>One login. Different access for Sales, Finance, Warehouse and Management.</p>
          </div>
          <div className="role-stack"><b>S</b><b>F</b><b>W</b><b>M</b><span>+ team</span></div>
        </div>
      </div>
    </section>

    <section className="quick-wrap">
      <div className="quick-copy">
        <span>QUICK START</span>
        <h2>What do you want to do?</h2>
      </div>
      <div className="quick-actions">
        <a href="/admin"><span>Update prices</span><Arrow/></a>
        <a href="/quotation"><span>New quotation</span><Arrow/></a>
        <a href="/finance"><span>Create invoice</span><Arrow/></a>
        <a href="/warehouse"><span>Check stock</span><Arrow/></a>
      </div>
    </section>

    <footer className="os-footer">
      <div><b>CTE</b><span>Online System</span></div>
      <p>Sales · Quotation · Finance · Warehouse</p>
      <small>V1 · CTE Myanmar</small>
    </footer>
  </main>
}
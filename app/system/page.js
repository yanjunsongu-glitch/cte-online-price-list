'use client';
import {useMemo,useState} from 'react';
import './system.css';

const modules=[
  {key:'price',tag:'SALES',title:'Price List',desc:'Manage live prices, customer views, datasheets and secure customer share links.',href:'/',action:'Open Price List',meta:['Live pricing','Customer share','Print / PDF'],status:'LIVE',tone:'blue',mark:'PL',accent:'Pricing & customer sharing'},
  {key:'quotation',tag:'SALES',title:'Quotation',desc:'Create and save customer quotations based on the CTE BOQ workflow.',href:'/quotation',action:'Open Quotation',meta:['BOQ','History','Datasheets'],status:'BETA',tone:'violet',mark:'QT',accent:'Sales proposal workflow'},
  {key:'finance',tag:'FINANCE',title:'Finance',desc:'Prepare invoices, save customer billing records and track payment status.',href:'/finance',action:'Open Finance',meta:['Invoice','Payment status','History'],status:'BETA',tone:'green',mark:'FN',accent:'Billing & collections'},
  {key:'warehouse',tag:'OPERATIONS',title:'Warehouse',desc:'Inventory, stock in/out, product serial numbers and delivery preparation.',href:'/warehouse',action:'Open Warehouse',meta:['Inventory','Stock movement','Serial No.'],status:'COMING',tone:'amber',mark:'WH',accent:'Stock & delivery operations'}
];

const quick=[
  {label:'Update Price List',href:'/admin',hint:'Master data'},
  {label:'Create Quotation',href:'/quotation',hint:'Sales'},
  {label:'Create Invoice',href:'/finance',hint:'Finance'},
  {label:'Check Warehouse',href:'/warehouse',hint:'Operations'}
];

export default function SystemDashboard(){
  const [activeKey,setActiveKey]=useState('price');
  const active=useMemo(()=>modules.find(x=>x.key===activeKey)||modules[0],[activeKey]);

  return <main className="system-shell">
    <div className="system-ambient ambient-one"/>
    <div className="system-ambient ambient-two"/>
    <div className="system-grid-bg"/>

    <header className="system-topbar">
      <a className="system-brand" href="/system">
        <div className="system-logo"><span>CTE</span></div>
        <div><span>CTE MYANMAR</span><strong>ONLINE SYSTEM</strong></div>
      </a>

      <nav className="system-nav">
        <a className="active" href="/system">Dashboard</a>
        <a href="/">Price List</a>
        <a href="/quotation">Quotation</a>
        <a href="/finance">Finance</a>
        <a href="/warehouse">Warehouse</a>
      </nav>

      <div className="system-top-actions">
        <div className="system-live"><i/>System Online</div>
        <a className="system-admin-link" href="/admin">Super Admin <span>↗</span></a>
      </div>
    </header>

    <section className="system-hero">
      <div className="system-hero-copy">
        <div className="system-eyebrow"><i/> CTE BUSINESS OPERATIONS</div>
        <h1>One system.<br/><span>Every CTE workflow.</span></h1>
        <p>Pricing, quotation, finance and warehouse operations — connected in one clean workspace for the CTE Myanmar team.</p>

        <div className="hero-actions">
          <a href="/" className="hero-primary">Open Price List <span>→</span></a>
          <a href="/admin" className="hero-secondary">System Admin</a>
        </div>

        <div className="hero-trust">
          <div><b>04</b><span>Business modules</span></div>
          <div><b>24/7</b><span>Online access</span></div>
          <div><b>V1</b><span>Unified framework</span></div>
        </div>
      </div>

      <div className={'system-focus-panel tone-'+active.tone} key={active.key}>
        <div className="focus-orbit orbit-a"/>
        <div className="focus-orbit orbit-b"/>
        <div className="focus-top">
          <div><span>MODULE FOCUS</span><strong>{active.tag}</strong></div>
          <div className={'focus-status status-'+active.status.toLowerCase()}><i/>{active.status}</div>
        </div>
        <div className="focus-mark">{active.mark}</div>
        <div className="focus-copy">
          <small>{active.accent}</small>
          <h2>{active.title}</h2>
          <p>{active.desc}</p>
        </div>
        <div className="focus-meta">
          {active.meta.map((x,i)=><div key={x}><span>0{i+1}</span><b>{x}</b></div>)}
        </div>
        <a href={active.href} className="focus-open">{active.action}<span>↗</span></a>
      </div>
    </section>

    <section className="system-status-strip">
      <div className="status-strip-label"><i/> LIVE WORKSPACE</div>
      <div className="status-strip-track">
        <span>Price List <b>LIVE</b></span>
        <span>Quotation <b>BETA</b></span>
        <span>Finance <b>BETA</b></span>
        <span>Warehouse <b>COMING</b></span>
        <span>Customer Share <b>ACTIVE</b></span>
      </div>
    </section>

    <section className="system-section modules-section">
      <div className="system-section-head">
        <div><span>WORKSPACE</span><h2>Business Modules</h2></div>
        <p>Move between CTE workflows without leaving the system.</p>
      </div>

      <div className="system-module-grid">
        {modules.map((m,i)=><a
          href={m.href}
          className={'system-module-card module-'+m.key+' '+(activeKey===m.key?'is-active':'')}
          key={m.key}
          onMouseEnter={()=>setActiveKey(m.key)}
          onFocus={()=>setActiveKey(m.key)}
        >
          <div className="module-glow"/>
          <div className="module-top">
            <div className="module-icon"><span>{m.mark}</span></div>
            <div className={'module-status status-'+m.status.toLowerCase()}><i/>{m.status}</div>
          </div>
          <div className="module-index">0{i+1}</div>
          <div className="module-tag">{m.tag}</div>
          <h3>{m.title}</h3>
          <p>{m.desc}</p>
          <div className="module-meta">{m.meta.map(x=><span key={x}>{x}</span>)}</div>
          <div className="module-open"><span>{m.action}</span><b>↗</b></div>
        </a>)}
      </div>
    </section>

    <section className="system-section system-quick-section">
      <div className="system-section-head compact">
        <div><span>QUICK ACCESS</span><h2>Start a task</h2></div>
      </div>
      <div className="quick-grid">
        {quick.map((x,i)=><a href={x.href} key={x.label}>
          <div className="quick-index">0{i+1}</div>
          <div><strong>{x.label}</strong><small>{x.hint}</small></div>
          <span>→</span>
        </a>)}
      </div>
    </section>

    <section className="system-section system-management">
      <div className="system-section-head">
        <div><span>CONTROL CENTER</span><h2>System Administration</h2></div>
        <p>Central access, permissions and audit tools.</p>
      </div>

      <div className="management-grid">
        <a href="/admin" className="management-card live-card">
          <div className="management-symbol">SA</div>
          <div><span>AVAILABLE NOW</span><h3>Super Admin</h3><p>Manage master price-list data, customer links and system settings.</p></div>
          <b>Open →</b>
        </a>

        <div className="management-card disabled">
          <div className="management-symbol">UR</div>
          <div><span>NEXT PHASE</span><h3>User & Role Management</h3><p>Control Sales, Finance, Warehouse and Management permissions.</p></div>
          <b>Planned</b>
        </div>

        <div className="management-card disabled">
          <div className="management-symbol">AL</div>
          <div><span>NEXT PHASE</span><h3>Activity Log</h3><p>Track changes to prices, quotations, invoices and inventory.</p></div>
          <b>Planned</b>
        </div>
      </div>
    </section>

    <section className="system-roadmap">
      <div><span>CTE ONLINE SYSTEM</span><h2>Built to grow with the business.</h2></div>
      <div className="roadmap-line">
        <span className="done">Price List</span><i/>
        <span className="done">Quotation</span><i/>
        <span className="done">Finance</span><i/>
        <span>Warehouse</span><i/>
        <span>Unified Login</span><i/>
        <span>ERP Workflow</span>
      </div>
    </section>

    <footer className="system-footer">
      <span>CTE MYANMAR CO.,LTD</span>
      <span>Sales · Quotation · Finance · Warehouse</span>
      <span>CTE Online System · V1</span>
    </footer>
  </main>
}
'use client';
import './system.css';

const modules=[
  {
    key:'price',
    tag:'SALES',
    title:'Price List',
    desc:'Manage live prices, customer views, datasheets and secure customer share links.',
    href:'/',
    action:'Open Price List',
    meta:['Live pricing','Customer share','Print / PDF'],
    status:'LIVE'
  },
  {
    key:'quotation',
    tag:'SALES',
    title:'Quotation',
    desc:'Create and save customer quotations based on the CTE BOQ workflow.',
    href:'/quotation',
    action:'Open Quotation',
    meta:['BOQ','History','Datasheets'],
    status:'BETA'
  },
  {
    key:'finance',
    tag:'FINANCE',
    title:'Finance',
    desc:'Prepare invoices, save customer billing records and track payment status.',
    href:'/finance',
    action:'Open Finance',
    meta:['Invoice','Payment status','History'],
    status:'BETA'
  },
  {
    key:'warehouse',
    tag:'OPERATIONS',
    title:'Warehouse',
    desc:'Inventory, stock in/out, product serial numbers and delivery preparation.',
    href:'/warehouse',
    action:'Open Warehouse',
    meta:['Inventory','Stock movement','Serial No.'],
    status:'COMING'
  }
];

export default function SystemDashboard(){
  return <main className="system-shell">
    <header className="system-topbar">
      <a className="system-brand" href="/system">
        <div className="system-logo">CTE</div>
        <div>
          <span>CTE MYANMAR</span>
          <strong>ONLINE SYSTEM</strong>
        </div>
      </a>
      <nav className="system-nav">
        <a className="active" href="/system">Dashboard</a>
        <a href="/">Price List</a>
        <a href="/quotation">Quotation</a>
        <a href="/finance">Finance</a>
        <a href="/warehouse">Warehouse</a>
      </nav>
      <a className="system-admin-link" href="/admin">Super Admin</a>
    </header>

    <section className="system-hero">
      <div>
        <div className="system-eyebrow">CTE BUSINESS OPERATIONS</div>
        <h1>CTE Online System</h1>
        <p>One workspace for pricing, quotation, finance and warehouse operations.</p>
      </div>
      <div className="system-version">
        <span>FRAMEWORK</span>
        <strong>V1</strong>
      </div>
    </section>

    <section className="system-summary-grid">
      <div><span>04</span><strong>Business Modules</strong><small>Price · Quotation · Finance · Warehouse</small></div>
      <div><span>01</span><strong>Super Admin</strong><small>Central control planned</small></div>
      <div><span>24/7</span><strong>Online Access</strong><small>Web-based CTE workspace</small></div>
    </section>

    <section className="system-section">
      <div className="system-section-head">
        <div>
          <span>WORKSPACE</span>
          <h2>Business Modules</h2>
        </div>
        <p>Open a module to continue your work.</p>
      </div>

      <div className="system-module-grid">
        {modules.map((m,i)=><a href={m.href} className={"system-module-card module-"+m.key} key={m.key}>
          <div className="module-top">
            <div className="module-number">{String(i+1).padStart(2,'0')}</div>
            <div className={"module-status status-"+m.status.toLowerCase()}>{m.status}</div>
          </div>
          <div className="module-tag">{m.tag}</div>
          <h3>{m.title}</h3>
          <p>{m.desc}</p>
          <div className="module-meta">
            {m.meta.map(x=><span key={x}>{x}</span>)}
          </div>
          <div className="module-open">{m.action}<span>→</span></div>
        </a>)}
      </div>
    </section>

    <section className="system-section system-management">
      <div className="system-section-head">
        <div>
          <span>MANAGEMENT</span>
          <h2>System Administration</h2>
        </div>
        <p>Initial framework only — unified permissions come next.</p>
      </div>

      <div className="management-grid">
        <a href="/admin" className="management-card">
          <span>ADMIN</span>
          <h3>Super Admin</h3>
          <p>Manage master price-list data and customer links.</p>
          <b>Open Admin →</b>
        </a>
        <div className="management-card disabled">
          <span>USERS</span>
          <h3>User & Role Management</h3>
          <p>Sales, Finance, Warehouse and Management permissions.</p>
          <b>Next Phase</b>
        </div>
        <div className="management-card disabled">
          <span>ACTIVITY</span>
          <h3>Activity Log</h3>
          <p>See who changed prices, quotations, invoices and inventory.</p>
          <b>Next Phase</b>
        </div>
      </div>
    </section>

    <footer className="system-footer">
      <span>CTE MYANMAR CO.,LTD</span>
      <span>CTE Online System · Initial Framework</span>
    </footer>
  </main>
}
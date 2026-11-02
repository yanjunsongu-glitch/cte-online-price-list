'use client';
import {useEffect,useMemo,useState} from 'react';
import './users.css';

const PERMISSIONS=[
  ['price.view','View Price List'],['price.edit','Edit Products & Prices'],['price.publish','Publish Price List'],['price.share','Customer Share'],
  ['quotation.view','View Quotations'],['quotation.create','Create Quotations'],['quotation.edit','Edit Quotations'],
  ['finance.view','View Finance'],['finance.create','Create Invoices'],['finance.edit','Edit Finance'],
  ['warehouse.view','View Warehouse'],['warehouse.edit','Manage Warehouse'],
  ['users.view','View Users'],['users.manage','Manage Staff'],['system.settings','System Settings'],['activity.view','Activity Log']
];
const DEPARTMENTS=['Management','Sales','Pre-sales','After-sales','Finance','Warehouse','Other'];

function roleLabel(v){return v==='super_admin'?'Super Admin':v==='admin'?'Admin':'Staff'}
function statusLabel(v){return v==='pending'?'Pending Approval':v==='setup_required'?'Waiting for Password':v==='active'?'Active':'Disabled'}
function date(v){if(!v)return 'Never';try{return new Date(v).toLocaleString()}catch{return '—'}}

export default function Users(){
  const [me,setMe]=useState(null);
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');
  const [setupLink,setSetupLink]=useState('');
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({fullName:'',username:'',email:'',phone:'',role:'staff',department:'Sales',status:'active',permissions:[]});

  async function load(){
    const [a,b]=await Promise.all([
      fetch('/api/system/me',{cache:'no-store'}),
      fetch('/api/system/users',{cache:'no-store'})
    ]);
    if(a.status===401){window.location.replace('/login');return}
    const aj=await a.json().catch(()=>null);setMe(aj?.user||null);
    if(b.ok){const j=await b.json();setUsers(j.items||[])}
    else if(b.status===403)setMsg('Your account does not have permission to manage users.');
    setLoading(false);
  }
  useEffect(()=>{load()},[]);

  const canManage=useMemo(()=>me&&(me.role==='super_admin'||me.permissions?.includes('*')||me.permissions?.includes('users.manage')),[me]);

  function startNew(){
    setEditing(null);setForm({fullName:'',username:'',email:'',phone:'',role:'staff',department:'Sales',status:'active',permissions:[]});setOpen(true);setMsg('');setSetupLink('');
  }
  function startEdit(u){
    setEditing(u.id);setForm({fullName:u.fullName||'',username:u.username,email:u.email||'',phone:u.phone||'',role:u.role,department:u.department||'Other',status:u.status==='setup_required'?'active':u.status||'active',permissions:u.permissions||[]});setOpen(true);setMsg('');setSetupLink('');
  }
  function togglePermission(p){
    setForm(x=>({...x,permissions:x.permissions.includes(p)?x.permissions.filter(y=>y!==p):[...x.permissions,p]}));
  }
  async function save(e){
    e.preventDefault();setMsg('Saving account…');
    const method=editing?'PATCH':'POST';
    const body={...form,...(editing?{id:editing}:{})};
    const r=await fetch('/api/system/users',{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok){setMsg(j.error||'Could not save account.');return}
    if(j.setupToken){setSetupLink(window.location.origin+'/activate#'+encodeURIComponent(j.setupToken));setMsg('Approved. Share the one-time activation link with the employee. It expires in 24 hours.');}
    else setMsg(editing?'Account updated.':'Account created.');
    setOpen(false);await load();
  }
  async function logout(){
    await fetch('/api/system/logout',{method:'POST'});window.location.replace('/login');
  }

  if(loading)return <main className="users-page"><div className="users-loading">Loading accounts…</div></main>;
  return <main className="users-page">
    <header className="users-top">
      <a href="/system" className="users-brand"><img src="/icon.svg" alt="CTE"/><div><b>CTE Online</b><small>User Management</small></div></a>
      <div className="users-account"><span>{me?.fullName||me?.username}</span><b>{roleLabel(me?.role)}</b><button onClick={logout}>Sign out</button></div>
    </header>

    <div className="users-wrap">
      <section className="users-heading">
        <div><span>ADMINISTRATION</span><h1>Users & Access</h1><p>Manage CTE accounts, roles, departments and module permissions.</p></div>
        {canManage&&<button onClick={startNew}>＋ Add User</button>}
      </section>

      {msg&&<div className="users-message">{msg}</div>}

      <section className="users-summary">
        <div><span>Total users</span><b>{users.length}</b></div>
        <div><span>Super Admin</span><b>{users.filter(x=>x.role==='super_admin').length}</b></div>
        <div><span>Admin</span><b>{users.filter(x=>x.role==='admin').length}</b></div>
        <div><span>Staff</span><b>{users.filter(x=>x.role==='staff').length}</b></div>
        <div><span>Pending</span><b>{users.filter(x=>x.status==='pending'||x.status==='setup_required').length}</b></div>
      </section>

      <section className="users-card">
        <div className="users-table-head"><span>User</span><span>Role</span><span>Department</span><span>Access</span><span>Status</span><span>Last login</span><span></span></div>
        <div className="users-list">
          {users.map(u=><div className="users-row" key={u.id}>
            <div className="user-person"><span>{(u.fullName||u.username).slice(0,1).toUpperCase()}</span><div><b>{u.fullName||u.username}</b><small>@{u.username}{u.email?' · '+u.email:''}</small></div></div>
            <div><span className={'role-pill role-'+u.role}>{roleLabel(u.role)}</span></div>
            <div className="muted">{u.department||'—'}</div>
            <div className="muted">{u.permissions?.includes('*')?'All modules':(u.permissions||[]).length+' permissions'}</div>
            <div><span className={'status-pill status-'+u.status}>{statusLabel(u.status)}</span></div>
            <div className="muted">{date(u.lastLoginAt)}</div>
            <div>{canManage&&<button className="edit-user" onClick={()=>startEdit(u)}>{u.status==='pending'||u.status==='setup_required'?'Review':'Edit'}</button>}</div>
          </div>)}
          {!users.length&&<div className="users-empty">No CTE accounts yet.</div>}
        </div>
      </section>

      {setupLink&&<div className="users-message"><b>Employee activation link</b><div style={{marginTop:8,wordBreak:'break-all'}}>{setupLink}</div><button type="button" onClick={()=>navigator.clipboard?.writeText(setupLink)} style={{marginTop:8}}>Copy activation link</button></div>}
      <div className="users-note"><b>Access hierarchy</b><span>Self-registered colleagues enter as Pending Staff. Review permissions and approve the account. CTE Online then creates a one-time activation link so the employee sets the first password privately. Admin never needs to know the employee password.</span></div>
    </div>

    {open&&<div className="user-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
      <form className="user-modal" onSubmit={save}>
        <div className="user-modal-head"><div><span>{editing?'EDIT ACCOUNT':'NEW ACCOUNT'}</span><h2>{editing?'Update user':'Create CTE account'}</h2></div><button type="button" onClick={()=>setOpen(false)}>×</button></div>
        <div className="user-fields">
          <label>Full name<input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></label>
          <label>Username<input disabled={Boolean(editing)} value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></label>
          <label>Email<input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
          <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <label>Department<select value={form.department} onChange={e=>setForm({...form,department:e.target.value})}>{DEPARTMENTS.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} disabled={me?.role!=='super_admin'}>
            {me?.role==='super_admin'&&<option value="super_admin">Super Admin</option>}
            {me?.role==='super_admin'&&<option value="admin">Admin</option>}
            <option value="staff">Staff</option>
          </select></label>
          <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="pending">Pending Approval</option><option value="active">Approve / Active</option><option value="disabled">Disabled</option></select></label>
        </div>

        {form.role!=='super_admin'&&<div className="permission-box">
          <div><b>Module Permissions</b><span>Grant only what this user needs.</span></div>
          <div className="permission-grid">
            {PERMISSIONS.map(([key,label])=><label key={key}><input type="checkbox" checked={form.permissions.includes(key)} onChange={()=>togglePermission(key)}/><span><b>{label}</b><small>{key}</small></span></label>)}
          </div>
        </div>}

        <div className="user-modal-actions"><button type="button" onClick={()=>setOpen(false)}>Cancel</button><button className="save-user">{editing?'Save / Approve':'Create User'}</button></div>
      </form>
    </div>}
  </main>
}

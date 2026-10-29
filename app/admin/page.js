'use client';
import {useEffect,useState} from 'react';
const cp=x=>JSON.parse(JSON.stringify(x));

export default function Admin(){
  const [u,setU]=useState('admin');
  const [p,setP]=useState('');
  const [d,setD]=useState(null);
  const [msg,setMsg]=useState('');

  async function load(){
    const r=await fetch('/api/admin/catalog',{cache:'no-store'});
    if(r.ok){
      const j=await r.json();
      j.labels=j.labels||{};
      j.company=j.company||{};
      setD(j);
    }
  }
  useEffect(()=>{load()},[]);

  async function login(e){
    e.preventDefault();
    const r=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:u,password:p})});
    if(r.ok){setMsg('Logged in');load()}else setMsg('Login failed');
  }

  function patch(si,ri,k,v){
    setD(x=>{const n=cp(x);n.sections[si].rows[ri][k]=v;return n});
  }

  function patchSection(si,k,v){
    setD(x=>{const n=cp(x);n.sections[si][k]=v;return n});
  }

  function patchHead(si,hi,v){
    setD(x=>{const n=cp(x);n.sections[si].heads[hi]=v;return n});
  }

  async function upload(si,ri,kind,file){
    if(!file)return;
    setMsg('Uploading…');
    const row=d.sections[si].rows[ri],fd=new FormData();
    fd.append('file',file);fd.append('productId',row.id);fd.append('kind',kind);
    const r=await fetch('/api/admin/upload',{method:'POST',body:fd});
    if(!r.ok){setMsg('Upload failed');return}
    const j=await r.json();
    setD(x=>{
      const n=cp(x),z=n.sections[si].rows[ri];
      if(kind==='image')z.image=j.url;
      else z.datasheets=[...(z.datasheets||[]),j];
      return n
    });
    setMsg('Uploaded. Click Save & Publish.');
  }

  async function save(){
    setMsg('Saving…');
    const r=await fetch('/api/admin/catalog',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(d)});
    setMsg(r.ok?'Published successfully.':'Save failed');
  }

  if(!d)return <main className="admin-shell"><div className="login-card"><h1>CTE Price List Admin</h1><form onSubmit={login}><input value={u} onChange={e=>setU(e.target.value)} placeholder="Username"/><input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Password"/><button>Login</button></form><p>{msg||'Authorized staff only.'}</p><a href="/">Customer View</a></div></main>;

  return <main className="admin-shell">
    <div className="admin-top">
      <div><h1>CTE Price List Admin</h1><p>Edit prices, photos, datasheets, headings and visibility.</p></div>
      <div><button onClick={save}>Save & Publish</button><a href="/" target="_blank">Customer View</a></div>
    </div>
    <p className="status">{msg}</p>

    <div className="settings settings-wide">
      <label>Title<input value={d.title||''} onChange={e=>setD({...d,title:e.target.value})}/></label>
      <label>Validity<input value={d.validity||''} onChange={e=>setD({...d,validity:e.target.value})}/></label>
      <label>Exchange Rate 1 Label<input value={d.rateLabel1||'CNY / MMK'} onChange={e=>setD({...d,rateLabel1:e.target.value})}/></label>
      <label>Exchange Rate 1<input value={d.rate||''} onChange={e=>setD({...d,rate:e.target.value})}/></label>
      <label>Exchange Rate 2 Label<input value={d.rateLabel2||'USD / MMK'} onChange={e=>setD({...d,rateLabel2:e.target.value})}/></label>
      <label>Exchange Rate 2<input value={d.rate2||''} onChange={e=>setD({...d,rate2:e.target.value})}/></label>
      <label>Top Note<input value={d.note||''} onChange={e=>setD({...d,note:e.target.value})}/></label>
      <label>Company Name<input value={d.company?.name||''} onChange={e=>setD({...d,company:{...d.company,name:e.target.value}})}/></label>
      <label>Company Address<input value={d.company?.address||''} onChange={e=>setD({...d,company:{...d.company,address:e.target.value}})}/></label>
      <label>Company Tel<input value={d.company?.tel||''} onChange={e=>setD({...d,company:{...d.company,tel:e.target.value}})}/></label>
    </div>

    <div className="heading-editor">
      <h2>Table Headings</h2>
      <div className="heading-grid">
        <label>No. heading<input value={d.labels?.no||'No.'} onChange={e=>setD({...d,labels:{...d.labels,no:e.target.value}})}/></label>
        <label>Product heading<input value={d.labels?.product||'Product Specification'} onChange={e=>setD({...d,labels:{...d.labels,product:e.target.value}})}/></label>
        <label>Preview heading<input value={d.labels?.preview||'Preview'} onChange={e=>setD({...d,labels:{...d.labels,preview:e.target.value}})}/></label>
        <label>Remarks heading<input value={d.labels?.remarks||'Remarks'} onChange={e=>setD({...d,labels:{...d.labels,remarks:e.target.value}})}/></label>
      </div>
    </div>

    {d.sections.map((s,si)=><section className="admin-section" key={si}>
      <div className="section-editor">
        <label>Section Title<input className="section-name" value={s.name} onChange={e=>patchSection(si,'name',e.target.value)}/></label>
        <div className="heading-grid section-headings">
          {s.heads.map((h,hi)=><label key={hi}>Column {hi+1} heading<input value={h} onChange={e=>patchHead(si,hi,e.target.value)}/></label>)}
        </div>
      </div>

      {s.rows.map((r,ri)=><div className="product-card" key={r.id}>
        <div className="media">
          {r.image&&<img src={r.image} alt=""/>}
          <label>Replace photo<input type="file" accept="image/*" onChange={e=>upload(si,ri,'image',e.target.files?.[0])}/></label>
          <label>Upload Datasheet (PDF / Image)<input type="file" accept="application/pdf,image/*,.pdf" onChange={e=>upload(si,ri,'datasheet',e.target.files?.[0])}/></label>
          {(r.datasheets||[]).map((x,di)=><div className="file" key={x.url}><a href={x.url} target="_blank" rel="noreferrer">{x.type==='pdf'?'PDF · ':x.type==='image'?'Image · ':''}{x.name}</a><button onClick={()=>{const n=cp(d);n.sections[si].rows[ri].datasheets.splice(di,1);setD(n)}}>Remove</button></div>)}
        </div>
        <div className="fields">
          <label>Product Specification<input value={r.spec} onChange={e=>patch(si,ri,'spec',e.target.value)}/></label>
          <div className="grid4">
            <label>Price 1<input value={r.retail} onChange={e=>patch(si,ri,'retail',e.target.value)}/></label>
            <label>Price 2<input value={r.installer} onChange={e=>patch(si,ri,'installer',e.target.value)}/></label>
            <label>Price 3<input value={r.wholesale} onChange={e=>patch(si,ri,'wholesale',e.target.value)}/></label>
            <label>Price 4<input value={r.rebate} onChange={e=>patch(si,ri,'rebate',e.target.value)}/></label>
          </div>
          <label>Remarks<textarea value={r.remarks} onChange={e=>patch(si,ri,'remarks',e.target.value)}/></label>
          <label className="check"><input type="checkbox" checked={r.visible!==false} onChange={e=>patch(si,ri,'visible',e.target.checked)}/> Show to customers</label>
        </div>
      </div>)}
    </section>)}
  </main>
}
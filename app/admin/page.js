'use client';
import {useEffect,useState} from 'react';
import {upload as blobUpload} from '@vercel/blob/client';
const cp=x=>JSON.parse(JSON.stringify(x));
const LOCAL_CATALOG_KEY='cteEmergencyCatalogV1';
const LOCAL_IMAGE_DB='cteEmergencyImagesV1';
const LOCAL_IMAGE_STORE='images';
const LOCAL_IMAGE_PREFIX='local-image:';

function readLocalCatalog(){
  if(typeof window==='undefined')return null;
  try{return JSON.parse(localStorage.getItem(LOCAL_CATALOG_KEY)||'null')}catch{return null}
}
function catalogForLocalStorage(v){
  const n=cp(v);
  for(const s of n?.sections||[]){
    for(const r of s.rows||[]){
      if(String(r.image||'').startsWith('blob:'))r.image=LOCAL_IMAGE_PREFIX+r.id;
    }
  }
  return n;
}
function writeLocalCatalog(v){
  if(typeof window==='undefined')return;
  localStorage.setItem(LOCAL_CATALOG_KEY,JSON.stringify(catalogForLocalStorage(v)));
}
function openLocalImageDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(LOCAL_IMAGE_DB,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(LOCAL_IMAGE_STORE))req.result.createObjectStore(LOCAL_IMAGE_STORE)};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('IndexedDB unavailable'));
  });
}
async function putLocalImage(productId,file){
  const db=await openLocalImageDb();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(LOCAL_IMAGE_STORE,'readwrite');
    tx.objectStore(LOCAL_IMAGE_STORE).put(file,productId);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error||new Error('Local image save failed'));
    tx.onabort=()=>reject(tx.error||new Error('Local image save aborted'));
  });
  db.close();
  return URL.createObjectURL(file);
}
async function getLocalImageUrl(productId){
  const db=await openLocalImageDb();
  const blob=await new Promise((resolve,reject)=>{
    const tx=db.transaction(LOCAL_IMAGE_STORE,'readonly');
    const req=tx.objectStore(LOCAL_IMAGE_STORE).get(productId);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error||new Error('Local image read failed'));
  });
  db.close();
  return blob?URL.createObjectURL(blob):'';
}
async function hydrateLocalCatalog(v){
  const n=cp(v);
  for(const s of n?.sections||[]){
    for(const r of s.rows||[]){
      const image=String(r.image||'');
      if(image.startsWith(LOCAL_IMAGE_PREFIX)){
        try{
          const url=await getLocalImageUrl(image.slice(LOCAL_IMAGE_PREFIX.length));
          if(url)r.image=url;
        }catch{}
      }
    }
  }
  return n;
}

export default function Admin(){
  const [d,setD]=useState(null);
  const [msg,setMsg]=useState('');
  const [shares,setShares]=useState([]);

  async function load(){
    const r=await fetch('/api/admin/catalog',{cache:'no-store'});
    if(r.status===401||r.status===403){
      window.location.replace('/login?next=/admin');
      return;
    }
    if(r.ok){
      const j=await r.json();
      const local=readLocalCatalog();
      let source=local||j;
      source=await hydrateLocalCatalog(source);
      source.labels=source.labels||{};
      source.company=source.company||{};
      setD(source);
      if(local)setMsg('Emergency local mode: edits and uploaded photos on this computer are loaded locally.');
      loadShares();
    }
  }

  async function loadShares(){
    const r=await fetch('/api/admin/shares',{cache:'no-store'});
    if(r.ok){
      const j=await r.json();
      setShares(j.items||[]);
    }
  }

  async function toggleShare(token,active){
    setMsg(active?'Enabling customer link…':'Disabling customer link…');
    const r=await fetch('/api/admin/shares',{
      method:'PATCH',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({token,active})
    });
    if(r.ok){
      setMsg(active?'Customer link enabled.':'Customer link disabled.');
      loadShares();
    }else setMsg('Could not update customer link.');
  }

  async function copyCustomerLink(token){
    const url=window.location.origin+'/share/'+token;
    try{
      await navigator.clipboard.writeText(url);
      setMsg('Customer link copied.');
    }catch{
      setMsg(url);
    }
  }
  useEffect(()=>{load()},[]);


  function patch(si,ri,k,v){
    setD(x=>{const n=cp(x);n.sections[si].rows[ri][k]=v;return n});
  }

  function patchSection(si,k,v){
    setD(x=>{const n=cp(x);n.sections[si][k]=v;return n});
  }

  function patchColumn(si,ci,k,v){
    setD(x=>{
      const n=cp(x);
      n.sections[si].columns=n.sections[si].columns||[];
      n.sections[si].columns[ci]={...n.sections[si].columns[ci],[k]:v};
      return n;
    });
  }

  async function upload(si,ri,kind,file){
    if(!file)return null;
    if(file.size>15*1024*1024){
      setMsg(file.name+' is larger than 15MB.');
      return null;
    }
    const isPdf=file.type==='application/pdf'||/\.pdf$/i.test(file.name||'');
    const isImage=(file.type||'').startsWith('image/');
    if(kind==='datasheet'&&!isPdf&&!isImage){
      setMsg(file.name+' must be a PDF or image.');
      return null;
    }
    if((kind==='image'||kind==='logo')&&!isImage){
      setMsg(file.name+' must be an image.');
      return null;
    }

    const row=d.sections[si]?.rows[ri];
    const productId=row?.id||'file';
    setMsg('Uploading '+file.name+'…');

    try{
      const blob=await blobUpload(file.name,file,{
        access:'public',
        handleUploadUrl:'/api/admin/upload',
        clientPayload:JSON.stringify({
          productId,
          kind,
          fileName:file.name
        })
      });
      const result={
        url:blob.url,
        name:file.name,
        type:isPdf?'pdf':isImage?'image':'file'
      };
      setD(x=>{
        const n=cp(x),z=n.sections[si].rows[ri];
        if(kind==='image')z.image=result.url;
        else z.datasheets=[...(z.datasheets||[]),result];
        return n;
      });
      return result;
    }catch(e){
      console.error(e);
      if(kind==='image'){
        try{
          const url=await putLocalImage(productId,file);
          setD(x=>{
            const n=cp(x),z=n.sections[si].rows[ri];
            z.image=url;
            writeLocalCatalog(n);
            return n;
          });
          setMsg('Vercel Blob is paused. Photo saved locally on this computer using emergency storage.');
          return {url,name:file.name,type:'image',localOnly:true};
        }catch(localError){
          console.error('Emergency local image save failed',localError);
          setMsg('Cloud storage is suspended and local emergency image storage failed. Try JPG/PNG under 10MB in Chrome.');
          return null;
        }
      }
      setMsg(kind==='datasheet'
        ? 'Datasheet upload is unavailable while Vercel Blob is paused.'
        : 'Upload failed: '+(e?.message||file.name));
      return null;
    }
  }
  async function uploadDatasheets(si,ri,files){
    const list=Array.from(files||[]);
    if(!list.length)return;
    let ok=0,failed=0;
    setMsg('Uploading '+list.length+' datasheet files…');
    for(const file of list){
      try{
        const result=await upload(si,ri,'datasheet',file);
        if(result) ok++; else failed++;
      }catch(e){failed++}
    }
    setMsg((ok?ok+' uploaded':'No files uploaded')+(failed?' · '+failed+' failed':'')+'. Click Save & Publish.');
  }

  async function uploadLogo(file){
    if(!file)return;
    if(file.size>15*1024*1024){setMsg('Logo is larger than 15MB.');return}
    if(!(file.type||'').startsWith('image/')){setMsg('Logo must be an image.');return}
    setMsg('Uploading company logo…');
    try{
      const blob=await blobUpload(file.name,file,{
        access:'public',
        handleUploadUrl:'/api/admin/upload',
        clientPayload:JSON.stringify({
          productId:'company',
          kind:'logo',
          fileName:file.name
        })
      });
      setD(x=>({...x,company:{...(x.company||{}),logo:blob.url}}));
      setMsg('Logo uploaded. Click Save & Publish.');
    }catch(e){
      console.error(e);
      try{
        const url=await fileToDataUrl(file,1200,.9);
        setD(x=>{
          const n={...x,company:{...(x.company||{}),logo:url}};
          writeLocalCatalog(n);
          return n;
        });
        setMsg('Cloud upload is unavailable. Logo saved locally on this computer.');
      }catch{
        setMsg('Logo upload failed: '+(e?.message||'Unknown error'));
      }
    }
  }
  async function save(){
    setMsg('Saving…');
    const r=await fetch('/api/admin/catalog',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(d)});
    if(r.ok){
      if(typeof window!=='undefined')localStorage.removeItem(LOCAL_CATALOG_KEY);
      setMsg('Published successfully.');
      return;
    }
    const j=await r.json().catch(()=>({}));
    if(j.storageUnavailable||r.status===503){
      writeLocalCatalog(d);
      setMsg('Vercel Blob is paused. Changes are saved locally on this computer and will appear in Customer View on this browser.');
      return;
    }
    setMsg('Save failed: '+(j.error||r.status));
  }

  if(!d)return <main className="admin-shell"><a className="system-back-link" href="/system">← CTE Online System</a><div className="login-card"><img className="admin-brand-logo" src="/icon.svg" alt="CTE"/><h1>Loading Price List Admin…</h1><p>Checking your CTE Account permissions.</p></div></main>;

  return <main className="admin-shell">
    <div className="admin-top">
      <div className="admin-title-brand"><img className="admin-brand-logo" src="/icon.svg" alt="CTE"/><div><h1>CTE Price List Admin</h1><p>Edit prices, photos, datasheets, headings and visibility.</p></div></div>
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
      <label className="company-logo-setting">Company Logo
        {d.company?.logo && <img src={d.company.logo} alt="CTE Logo" className="admin-company-logo"/>}
        <input type="file" accept="image/*" onChange={e=>uploadLogo(e.target.files?.[0])}/>
      </label>
    </div>

    <div className="share-admin-panel">
      <div className="share-admin-head">
        <div>
          <span>CUSTOMER SHARING</span>
          <h2>Customer Links</h2>
          <p>Links created from the price list can be copied, disabled or re-enabled here.</p>
        </div>
        <button onClick={loadShares}>Refresh</button>
      </div>
      {shares.length===0?<div className="share-admin-empty">No customer links created yet.</div>:<div className="share-admin-list">
        {shares.map(x=><div className="share-admin-item" key={x.token}>
          <div className="share-admin-main">
            <strong>{x.customerName||'Unnamed customer'}</strong>
            <span>{x.productCount} product(s) · {x.columnCount} column(s) · {x.currencyDisplay==='both'?'CNY + MMK':String(x.currencyDisplay||'cny').toUpperCase()}</span>
            <small>Created by <b>{x.createdBy||'Unknown'}</b> · {new Date(x.createdAt).toLocaleString()} {x.expiresAt?'· Expires '+new Date(x.expiresAt).toLocaleString():'· No expiry'}</small>
          </div>
          <div className="share-admin-status">
            <b className={'share-status-'+x.status}>{x.status}</b>
          </div>
          <div className="share-admin-actions">
            <button onClick={()=>copyCustomerLink(x.token)}>Copy Link</button>
            <a href={'/share/'+x.token} target="_blank" rel="noreferrer">Open</a>
            {x.active
              ?<button className="danger" onClick={()=>toggleShare(x.token,false)}>Disable</button>
              :<button className="success" onClick={()=>toggleShare(x.token,true)}>Enable</button>}
          </div>
        </div>)}
      </div>}
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
          {(s.columns||[]).map((col,ci)=><label key={col.key}>Column {ci+1} heading<input value={col.label||''} onChange={e=>patchColumn(si,ci,'label',e.target.value)}/></label>)}
        </div>
      </div>

      {s.rows.map((r,ri)=><div className="product-card" key={r.id}>
        <div className="media">
          {r.image&&<img src={r.image} alt=""/>}
          <label>Replace photo<input type="file" accept="image/*" onChange={e=>upload(si,ri,'image',e.target.files?.[0])}/></label>
          <label>Upload Datasheet (PDF / Image)
            <input type="file" multiple accept="application/pdf,image/*,.pdf" onChange={e=>uploadDatasheets(si,ri,e.target.files)}/>
            <span className="upload-help">Multiple files allowed · Max 15MB per file</span>
          </label>
          {(r.datasheets||[]).map((x,di)=><div className="file" key={x.url}><a href={x.url} target="_blank" rel="noreferrer">{x.type==='pdf'?'PDF · ':x.type==='image'?'Image · ':''}{x.name}</a><button onClick={()=>{const n=cp(d);n.sections[si].rows[ri].datasheets.splice(di,1);setD(n)}}>Remove</button></div>)}
        </div>
        <div className="fields">
          <label>Product Specification<input value={r.spec} onChange={e=>patch(si,ri,'spec',e.target.value)}/></label>
          <div className="dynamic-value-grid">
            {(s.columns||[]).map(col=><label key={col.key}>{col.label}<input value={r[col.key]??''} onChange={e=>patch(si,ri,col.key,e.target.value)}/></label>)}
          </div>
          <label>Remarks<textarea value={r.remarks} onChange={e=>patch(si,ri,'remarks',e.target.value)}/></label>
          <label className="check"><input type="checkbox" checked={r.visible!==false} onChange={e=>patch(si,ri,'visible',e.target.checked)}/> Show to customers</label>
        </div>
      </div>)}
    </section>)}
  </main>
}
'use client';
import {useEffect,useMemo,useState} from 'react';
import './quotation.css';

const CTE_BRAND_LOGO='data:image/png;base64,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';

const uid=()=>crypto.randomUUID();
const today=()=>new Date().toISOString().slice(0,10);
const emptyItem=()=>({id:uid(),productId:'',description:'',brand:'CTE',unit:'Pcs',qty:1,priceSource:'retail',unitPrice:'',discountPct:0,remark:'',warranty:'',image:'',datasheets:[]});
const emptyQuotation=()=>({
  id:'',quotationNo:'',quotationDate:today(),validUntil:'',
  systemName:'125kW Solar Hybrid Installation System',
  coverTitle:'Battery & Inverter Prices List BOQ',
  customerCompany:'',contactPerson:'',customerAddress:'',customerPhone:'',
  currency:'RMB',exchangeRate:'',salesperson:'',paymentTerms:'',deliveryTime:'',
  status:'Draft',includeDatasheets:true,includeCover:true,notes:'',items:[emptyItem()]
});

function fmt(v){
  const n=Number(v||0);
  return Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:2}):String(v||'');
}
function brandFor(name){
  const s=String(name||'').toUpperCase();
  if(s.includes('SOLIS'))return 'Solis';
  if(s.includes('SOLINTEG'))return 'Solinteg';
  if(s.includes('SOSEN'))return 'Sosen';
  if(s.includes('VEICHI'))return 'Veichi';
  return 'CTE';
}
function warrantyFor(name,remarks){
  const s=(String(name||'')+' '+String(remarks||'')).toLowerCase();
  if(s.includes('battery')||s.includes('16076')||s.includes('cis'))return '10 Years';
  if(s.includes('inverter')||s.includes('solis')||s.includes('solinteg')||s.includes('sosen')||s.includes('veichi'))return '5 Years';
  return '';
}

export default function Quotation(){
  const [logged,setLogged]=useState(null);
  const [user,setUser]=useState('');
  const [pass,setPass]=useState('');
  const [catalog,setCatalog]=useState(null);
  const [history,setHistory]=useState([]);
  const [q,setQ]=useState(emptyQuotation());
  const [msg,setMsg]=useState('');
  const [tab,setTab]=useState('edit');

  const products=useMemo(()=>!catalog?[]:catalog.sections.flatMap(section=>
    section.rows.map(row=>({section:section.name,...row}))
  ),[catalog]);

  async function load(){
    const [a,b]=await Promise.all([
      fetch('/api/quotation/records',{cache:'no-store'}),
      fetch('/api/catalog',{cache:'no-store'})
    ]);
    if(a.status===401){setLogged(false);return}
    if(a.ok){
      const j=await a.json();
      setHistory(j.items||[]);
      setLogged(true);
    }
    if(b.ok){
      const c=await b.json();
      setCatalog(c);
      setQ(x=>({...x,exchangeRate:x.exchangeRate||String(c.rate||'')}));
    }
  }
  useEffect(()=>{load()},[]);

  useEffect(()=>{
    if(logged!==true||!catalog||typeof window==='undefined')return;
    const params=new URLSearchParams(window.location.search);
    if(params.get('new')!=='true')return;
    const n=emptyQuotation();
    n.exchangeRate=String(catalog.rate||'');
    setQ(n);
    setTab('edit');
    setMsg('New quotation ready.');
    window.history.replaceState({},'',window.location.pathname);
  },[logged,catalog]);

  async function login(e){
    e.preventDefault();
    const r=await fetch('/api/quotation/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:user,password:pass})});
    if(!r.ok){setMsg('Login failed');return}
    setPass('');setMsg('');await load();
  }
  async function logout(){
    await fetch('/api/quotation/logout',{method:'POST'});
    setLogged(false);setHistory([]);setQ(emptyQuotation());
  }

  function patch(k,v){setQ(x=>({...x,[k]:v}))}
  function patchItem(i,k,v){
    setQ(x=>({...x,items:x.items.map((it,idx)=>idx===i?{...it,[k]:v}:it)}));
  }

  function selectProduct(i,pid){
    const p=products.find(x=>x.id===pid);
    setQ(x=>{
      const items=x.items.map((it,idx)=>{
        if(idx!==i)return it;
        if(!p)return {...it,productId:'',description:'',unitPrice:'',image:'',datasheets:[]};
        const retail=Number(p.retail||0);
        return {
          ...it,
          productId:p.id,
          description:p.spec,
          brand:brandFor(p.spec),
          unit:'Pcs',
          priceSource:'retail',
          unitPrice:retail||'',
          remark:p.remarks||'',
          warranty:warrantyFor(p.spec,p.remarks),
          image:p.image||'',
          datasheets:Array.isArray(p.datasheets)?p.datasheets:[]
        };
      });
      return {...x,items};
    });
  }

  function changePriceSource(i,source){
    const it=q.items[i];
    const p=products.find(x=>x.id===it.productId);
    let value=it.unitPrice;
    if(p && source!=='custom'){
      const v=Number(p[source]||0);
      if(v>0)value=v;
    }
    setQ(x=>({...x,items:x.items.map((row,idx)=>idx===i?{...row,priceSource:source,unitPrice:value}:row)}));
  }
  function addItem(){setQ(x=>({...x,items:[...x.items,emptyItem()]}))}
  function removeItem(i){setQ(x=>({...x,items:x.items.filter((_,idx)=>idx!==i)}))}

  const calc=useMemo(()=>{
    const rows=q.items.map(x=>{
      const qty=Number(x.qty||0),price=Number(x.unitPrice||0),disc=Number(x.discountPct||0);
      const gross=qty*price;
      const total=gross-(gross*disc/100);
      return {...x,gross,total};
    });
    return {rows,subtotal:rows.reduce((s,x)=>s+x.total,0)};
  },[q.items]);

  async function save(){
    if(!q.contactPerson&&!q.customerCompany){setMsg('Customer / Contact Person is required.');return}
    setMsg('Saving quotation…');
    const r=await fetch('/api/quotation/records',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(q)});
    if(!r.ok){setMsg('Save failed');return}
    const j=await r.json();
    setQ(j);setMsg('Quotation saved.');
    await load();
  }
  async function openRecord(id){
    const r=await fetch('/api/quotation/records?id='+encodeURIComponent(id),{cache:'no-store'});
    if(r.ok){setQ(await r.json());setTab('edit');setMsg('Quotation loaded.')}
  }
  function newQuotation(){
    const n=emptyQuotation();
    if(catalog)n.exchangeRate=String(catalog.rate||'');
    setQ(n);setMsg('');
  }
  function printQuotation(){setTab('preview');setTimeout(()=>window.print(),120)}

  const selectedDatasheets=useMemo(()=>{
    const out=[];
    for(const item of q.items){
      for(const d of item.datasheets||[]){
        out.push({product:item.description,...d});
      }
    }
    return out;
  },[q.items]);

  if(logged===null)return <main className="quotation-shell"><div className="quotation-loading">Loading Quotation System…</div></main>;
  if(logged===false)return <main className="quotation-login-page">
    <form className="quotation-login-card" onSubmit={login}>
      <img className="quotation-login-logo" src={CTE_BRAND_LOGO} alt="CTE"/>
      <h1>Quotation System</h1>
      <p>Create professional CTE customer quotations.</p>
      <label>Username<input value={user} onChange={e=>setUser(e.target.value)} autoComplete="username"/></label>
      <label>Password<input type="password" value={pass} onChange={e=>setPass(e.target.value)} autoComplete="current-password"/></label>
      <button>Login</button>
      <span>{msg}</span>
      <a href="/">Back to Price List</a>
    </form>
  </main>;

  return <main className="quotation-shell">
    <header className="quotation-top no-print"><a className="module-system-link" href="/system">← CTE Online System</a>
      <div>
        <span>CTE SALES</span>
        <h1>Quotation System</h1>
        <p>Based on the current CTE Solar Hybrid quotation format.</p>
      </div>
      <div className="quotation-actions">
        <button className="secondary" onClick={newQuotation}>New</button>
        <button onClick={save}>Save</button>
        <button className="preview" onClick={()=>setTab(tab==='edit'?'preview':'edit')}>{tab==='edit'?'Preview':'Edit'}</button>
        <button className="print" onClick={printQuotation}>Print / PDF</button>
        <button className="secondary" onClick={logout}>Logout</button>
      </div>
    </header>

    <div className="quotation-layout">
      <section className={tab==='preview'?'quotation-editor preview-mode':'quotation-editor'}>
        <div className="quotation-form no-print">
          <div className="quotation-form-section">
            <h2>Quotation Information</h2>
            <div className="quotation-fields">
              <label>System Name<input value={q.systemName} onChange={e=>patch('systemName',e.target.value)}/></label>
              <label>Cover Title<input value={q.coverTitle} onChange={e=>patch('coverTitle',e.target.value)}/></label>
              <label>Quotation No.<input value={q.quotationNo} onChange={e=>patch('quotationNo',e.target.value)} placeholder="Auto if blank"/></label>
              <label>Date<input type="date" value={q.quotationDate} onChange={e=>patch('quotationDate',e.target.value)}/></label>
              <label>Valid Until<input type="date" value={q.validUntil} onChange={e=>patch('validUntil',e.target.value)}/></label>
              <label>Salesperson<input value={q.salesperson} onChange={e=>patch('salesperson',e.target.value)}/></label>
              <label>Currency<select value={q.currency} onChange={e=>patch('currency',e.target.value)}><option>RMB</option><option>MMK</option></select></label>
              <label>Exchange Rate<input type="number" value={q.exchangeRate} onChange={e=>patch('exchangeRate',e.target.value)}/></label>
              <label>Status<select value={q.status} onChange={e=>patch('status',e.target.value)}><option>Draft</option><option>Sent</option><option>Accepted</option><option>Rejected</option><option>Expired</option></select></label>
              <label className="quotation-check"><input type="checkbox" checked={q.includeCover!==false} onChange={e=>patch('includeCover',e.target.checked)}/> Include Cover Page</label>
              <label className="quotation-check"><input type="checkbox" checked={q.includeDatasheets!==false} onChange={e=>patch('includeDatasheets',e.target.checked)}/> Include Datasheets</label>
            </div>
          </div>

          <div className="quotation-form-section">
            <h2>Customer</h2>
            <div className="quotation-fields">
              <label>Company<input value={q.customerCompany} onChange={e=>patch('customerCompany',e.target.value)}/></label>
              <label>Contact Person<input value={q.contactPerson} onChange={e=>patch('contactPerson',e.target.value)}/></label>
              <label className="wide">Address<textarea value={q.customerAddress} onChange={e=>patch('customerAddress',e.target.value)}/></label>
              <label>Phone<input value={q.customerPhone} onChange={e=>patch('customerPhone',e.target.value)}/></label>
              <label>Payment Terms<input value={q.paymentTerms} onChange={e=>patch('paymentTerms',e.target.value)}/></label>
              <label>Delivery Time<input value={q.deliveryTime} onChange={e=>patch('deliveryTime',e.target.value)}/></label>
            </div>
          </div>

          <div className="quotation-form-section">
            <div className="quotation-section-head"><h2>BOQ Items</h2><button onClick={addItem}>+ Add Product</button></div>
            <div className="quotation-items">
              {q.items.map((it,i)=><div className="quotation-item-card" key={it.id}>
                <div className="quotation-item-no">{i+1}</div>
                <div className="quotation-item-fields">
                  <label className="wide">Product
                    <select value={it.productId} onChange={e=>selectProduct(i,e.target.value)}>
                      <option value="">Select from Price List</option>
                      {products.map(p=><option key={p.id} value={p.id}>{p.spec}</option>)}
                    </select>
                  </label>
                  <label className="wide">Description<input value={it.description} onChange={e=>patchItem(i,'description',e.target.value)}/></label>
                  <label>Brand<input value={it.brand} onChange={e=>patchItem(i,'brand',e.target.value)}/></label>
                  <label>Unit<input value={it.unit} onChange={e=>patchItem(i,'unit',e.target.value)}/></label>
                  <label>Qty<input type="number" min="0" value={it.qty} onChange={e=>patchItem(i,'qty',e.target.value)}/></label>
                  <label>Price Source<select value={it.priceSource} onChange={e=>changePriceSource(i,e.target.value)}><option value="retail">Retail</option><option value="installer">Installer</option><option value="wholesale">Wholesale</option><option value="custom">Custom</option></select></label>
                  <label>Unit Price<input type="number" min="0" step="0.01" value={it.unitPrice} onChange={e=>patchItem(i,'unitPrice',e.target.value)}/></label>
                  <label>Discount %<input type="number" min="0" max="100" step="0.01" value={it.discountPct} onChange={e=>patchItem(i,'discountPct',e.target.value)}/></label>
                  <label>Warranty<input value={it.warranty} onChange={e=>patchItem(i,'warranty',e.target.value)}/></label>
                  <label className="wide">Remark<input value={it.remark} onChange={e=>patchItem(i,'remark',e.target.value)}/></label>
                </div>
                <div className="quotation-item-side">
                  {it.image?<img src={it.image} alt=""/>:<div>No image</div>}
                  <b>{fmt(calc.rows[i]?.total)} {q.currency}</b>
                  <span>{(it.datasheets||[]).length} datasheet(s)</span>
                  <button onClick={()=>removeItem(i)}>Remove</button>
                </div>
              </div>)}
            </div>
          </div>

          <div className="quotation-form-section">
            <h2>Notes</h2>
            <textarea className="quotation-notes" value={q.notes} onChange={e=>patch('notes',e.target.value)} placeholder="Additional commercial terms or notes…"/>
          </div>
          <div className="quotation-msg">{msg}</div>
        </div>

        <div className="quotation-print-document">
          {q.includeCover!==false && <section className="qt-page qt-cover">
            <div className="qt-date">Date - {q.quotationDate}</div>
            <div className="qt-cover-center">
              <div className="qt-logo-mark">CTE</div>
              <div className="qt-myanmar">MYANMAR</div>
              <h1>{catalog?.company?.name||'CTE Myanmar Co.,Ltd'}</h1>
              <h3>Solar, Inverter & Battery</h3>
              <p>{catalog?.company?.address}</p>
              <p>{catalog?.company?.tel}</p>
              <h2>{q.coverTitle}</h2>
              <strong>( {q.systemName} )</strong>
            </div>
          </section>}

          <section className="qt-page qt-boq">
            <div className="qt-date">Date - {q.quotationDate}</div>
            <header className="qt-boq-head">
              <div>
                <h1>{catalog?.company?.name||'CTE MYANMAR Co., Ltd'}</h1>
                <p>Solar, Inverter & Battery</p>
                <p>{catalog?.company?.address}</p>
                <p>{catalog?.company?.tel}</p>
              </div>
              <img className="qt-company-logo qt-company-logo-side" src={CTE_BRAND_LOGO} alt="CTE"/>
            </header>

            <div className="qt-customer">
              <div>
                <h3>Bill To</h3>
                <p><b>Company :</b> {q.customerCompany}</p>
                <p><b>Contact Person :</b> {q.contactPerson}</p>
                <p><b>Adds :</b> {q.customerAddress}</p>
                <p><b>Phone :</b> {q.customerPhone}</p>
              </div>
              <div>
                <h3>For</h3>
                <p><b>{q.systemName}</b></p>
                {q.quotationNo&&<p>Quotation No. : {q.quotationNo}</p>}
                {q.validUntil&&<p>Valid Until : {q.validUntil}</p>}
              </div>
            </div>

            <table className="qt-table">
              <thead><tr><th>No</th><th>Description</th><th>Brand</th><th>Unit</th><th>Qty</th><th>Unit Price<br/>({q.currency})</th><th>Total Price<br/>({q.currency})</th><th>Remark</th></tr></thead>
              <tbody>
                {calc.rows.map((it,i)=><tr key={it.id}>
                  <td>{i+1}</td><td>{it.description}</td><td>{it.brand}</td><td>{it.unit}</td><td>{it.qty}</td>
                  <td className="num">{fmt(it.unitPrice)}</td><td className="num">{fmt(it.total)}</td>
                  <td className="qt-item-remark">{it.remark||''}</td>
                </tr>)}
                <tr className="qt-subtotal"><td></td><td colSpan="5">Sub Total ( {q.currency} )</td><td className="num">{fmt(calc.subtotal)}</td><td></td></tr>
              </tbody>
            </table>

            {q.currency==='RMB'&&Number(q.exchangeRate)>0&&<div className="qt-mmk">MMK Equivalent: <b>{fmt(calc.subtotal*Number(q.exchangeRate))} MMK</b> @ {q.exchangeRate}</div>}

            <div className="qt-warranty">
              <div className="qt-warranty-head"><span>Product</span><span>Warranty</span></div>
              {q.items.filter(x=>x.warranty).map((it,i)=><div key={it.id}><span>{it.description}</span><span>{it.warranty}</span></div>)}
            </div>

            {(q.paymentTerms||q.deliveryTime||q.notes)&&<div className="qt-terms">
              {q.paymentTerms&&<p><b>Payment Terms:</b> {q.paymentTerms}</p>}
              {q.deliveryTime&&<p><b>Delivery Time:</b> {q.deliveryTime}</p>}
              {q.notes&&<p><b>Notes:</b> {q.notes}</p>}
            </div>}
          </section>

          {q.includeDatasheets!==false && selectedDatasheets.map((d,i)=><section className="qt-page qt-datasheet" key={d.url||i}>
            <div className="qt-date">Date - {q.quotationDate}</div>
            <div className="qt-datasheet-title">{d.product}</div>
            {d.type==='pdf'||String(d.url||'').toLowerCase().endsWith('.pdf')
              ? <div className="qt-pdf-sheet"><h2>Product Datasheet (PDF)</h2><p>{d.name}</p><a href={d.url} target="_blank" rel="noreferrer">Open attached PDF datasheet</a></div>
              : <img src={d.url} alt={d.name||d.product}/>}
          </section>)}
        </div>
      </section>

      <aside className="quotation-history no-print">
        <div className="quotation-history-head"><div><span>HISTORY</span><h2>Quotations</h2></div><b>{history.length}</b></div>
        <div className="quotation-history-list">
          {history.length===0?<div className="quotation-empty">No saved quotations yet.</div>:history.map(h=><button key={h.id} className={q.id===h.id?'quotation-history-item active':'quotation-history-item'} onClick={()=>openRecord(h.id)}>
            <div><strong>{h.quotationNo}</strong><span>{h.customerCompany||h.contactPerson||'No customer'}</span><small>{h.systemName}</small></div>
            <div><b>{fmt(h.subtotal)} {h.currency}</b><span className={'qt-status '+String(h.status).toLowerCase()}>{h.status}</span></div>
          </button>)}
        </div>
      </aside>
    </div>
  </main>
}

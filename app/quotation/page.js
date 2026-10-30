'use client';
import {useEffect,useMemo,useState} from 'react';

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
      <div className="quotation-login-logo">CTE</div>
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
    <header className="quotation-top no-print">
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
              <div className="qt-logo-side">CTE<span>MYANMAR</span></div>
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
              <thead><tr><th>No</th><th>Description</th><th>Brand</th><th>Unit</th><th>Qty</th><th>Unit Price<br/>({q.currency})</th><th>Total Price<br/>({q.currency})</th></tr></thead>
              <tbody>
                {calc.rows.map((it,i)=><tr key={it.id}>
                  <td>{i+1}</td><td>{it.description}</td><td>{it.brand}</td><td>{it.unit}</td><td>{it.qty}</td>
                  <td className="num">{fmt(it.unitPrice)}</td><td className="num">{fmt(it.total)}</td>
                </tr>)}
                <tr className="qt-subtotal"><td></td><td colSpan="5">Sub Total ( {q.currency} )</td><td className="num">{fmt(calc.subtotal)}</td></tr>
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

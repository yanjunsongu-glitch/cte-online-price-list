'use client';
import {useEffect,useMemo,useState} from 'react';

const emptyItem=()=>({id:crypto.randomUUID(),productId:'',productName:'',priceSource:'retail',qty:1,unitPrice:'',discountPct:0});
const emptyInvoice=()=>({
  id:'',
  invoiceNo:'',
  invoiceDate:new Date().toISOString().slice(0,10),
  dueDate:'',
  customerName:'',
  customerAddress:'',
  customerPhone:'',
  customerTaxId:'',
  poNo:'',
  salesperson:'',
  currency:'CNY',
  exchangeRate:'',
  paymentStatus:'Unpaid',
  paymentMethod:'',
  taxPct:0,
  items:[emptyItem()],
  notes:''
});

function fmt(v){
  const n=Number(v||0);
  return Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:2}):v;
}

export default function Finance(){
  const [logged,setLogged]=useState(null);
  const [user,setUser]=useState('');
  const [pass,setPass]=useState('');
  const [catalog,setCatalog]=useState(null);
  const [history,setHistory]=useState([]);
  const [inv,setInv]=useState(emptyInvoice());
  const [msg,setMsg]=useState('');

  const products=useMemo(()=>!catalog?[]:catalog.sections.flatMap(section=>
    section.rows.map(row=>({section:section.name,...row}))
  ),[catalog]);

  async function load(){
    const [a,b]=await Promise.all([
      fetch('/api/finance/invoices',{cache:'no-store'}),
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
      setInv(x=>({...x,exchangeRate:x.exchangeRate||String(c.rate||'')}));
    }
  }

  useEffect(()=>{load()},[]);

  useEffect(()=>{
    if(logged!==true||!catalog||typeof window==='undefined')return;
    const params=new URLSearchParams(window.location.search);
    if(params.get('new')!=='true')return;
    const n=emptyInvoice();
    n.exchangeRate=String(catalog.rate||'');
    setInv(n);
    setMsg('New invoice ready.');
    window.history.replaceState({},'',window.location.pathname);
  },[logged,catalog]);

  async function login(e){
    e.preventDefault();
    const r=await fetch('/api/finance/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:user,password:pass})});
    if(!r.ok){setMsg('Login failed');return}
    setPass('');
    setMsg('');
    await load();
  }

  async function logout(){
    await fetch('/api/finance/logout',{method:'POST'});
    setLogged(false);setHistory([]);setInv(emptyInvoice());
  }

  function patch(k,v){setInv(x=>({...x,[k]:v}))}
  function patchItem(i,k,v){
    setInv(x=>{
      const items=x.items.map((it,idx)=>idx===i?{...it,[k]:v}:it);
      return {...x,items};
    });
  }

  function selectProduct(i,pid){
    const p=products.find(x=>x.id===pid);
    setInv(x=>{
      const items=x.items.map((it,idx)=>{
        if(idx!==i)return it;
        if(!p)return {...it,productId:'',productName:'',unitPrice:''};
        const price=Number(p.retail||0);
        return {...it,productId:p.id,productName:p.spec,priceSource:'retail',unitPrice:price||''};
      });
      return {...x,items};
    });
  }

  function changePriceSource(i,source){
    const it=inv.items[i];
    const p=products.find(x=>x.id===it.productId);
    const value=p?Number(p[source]||0):0;
    setInv(x=>{
      const items=x.items.map((row,idx)=>idx===i?{...row,priceSource:source,unitPrice:value||row.unitPrice}:row);
      return {...x,items};
    });
  }

  function addItem(){setInv(x=>({...x,items:[...x.items,emptyItem()]}))}
  function removeItem(i){setInv(x=>({...x,items:x.items.filter((_,idx)=>idx!==i)}))}

  const calc=useMemo(()=>{
    const rows=inv.items.map(x=>{
      const qty=Number(x.qty||0),price=Number(x.unitPrice||0),disc=Number(x.discountPct||0);
      const gross=qty*price;
      const total=gross-(gross*disc/100);
      return {...x,gross,total};
    });
    const subtotal=rows.reduce((s,x)=>s+x.total,0);
    const tax=subtotal*Number(inv.taxPct||0)/100;
    return {rows,subtotal,tax,grand:subtotal+tax};
  },[inv.items,inv.taxPct]);

  async function save(){
    if(!inv.customerName){setMsg('Customer name is required.');return}
    setMsg('Saving invoice…');
    const r=await fetch('/api/finance/invoices',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(inv)});
    if(!r.ok){setMsg('Save failed');return}
    const j=await r.json();
    setInv(j);
    setMsg('Invoice saved.');
    await load();
  }

  async function openInvoice(id){
    const r=await fetch('/api/finance/invoices?id='+encodeURIComponent(id),{cache:'no-store'});
    if(r.ok){setInv(await r.json());setMsg('Invoice loaded.')}
  }

  function newInvoice(){
    const n=emptyInvoice();
    if(catalog)n.exchangeRate=String(catalog.rate||'');
    setInv(n);setMsg('');
  }

  if(logged===null)return <main className="finance-shell"><div className="finance-loading">Loading Finance…</div></main>;
  if(logged===false)return <main className="finance-login-page">
    <form className="finance-login-card" onSubmit={login}>
      <div className="finance-login-logo">CTE</div>
      <h1>CTE Finance</h1>
      <p>Invoice System · Authorized staff only</p>
      <label>Username<input value={user} onChange={e=>setUser(e.target.value)} autoComplete="username"/></label>
      <label>Password<input type="password" value={pass} onChange={e=>setPass(e.target.value)} autoComplete="current-password"/></label>
      <button>Login</button>
      <span className="finance-login-msg">{msg}</span>
      <a href="/">Back to Price List</a>
    </form>
  </main>;

  return <main className="finance-shell">
    <header className="finance-top no-print"><a className="module-system-link" href="/system">← CTE Online System</a>
      <div><span className="finance-eyebrow">CTE FINANCE</span><h1>Invoice System</h1><p>Create, save and print customer invoices.</p></div>
      <div className="finance-top-actions">
        <button className="finance-secondary" onClick={newInvoice}>New Invoice</button>
        <button onClick={save}>Save Invoice</button>
        <button className="finance-print" onClick={()=>window.print()}>Print / PDF</button>
        <button className="finance-secondary" onClick={logout}>Logout</button>
      </div>
    </header>

    <div className="finance-workspace">
      <section className="invoice-editor">
        <div className="invoice-doc">
          <div className="invoice-header">
            <div>
              <div className="invoice-logo">CTE</div>
              <h2>{catalog?.company?.name||'CTE MYANMAR CO.,LTD'}</h2>
              <p>{catalog?.company?.address}</p>
              <p>{catalog?.company?.tel}</p>
            </div>
            <div className="invoice-title">
              <h1>INVOICE</h1>
              <label>Invoice No.<input value={inv.invoiceNo} onChange={e=>patch('invoiceNo',e.target.value)} placeholder="Auto if blank"/></label>
              <label>Date<input type="date" value={inv.invoiceDate} onChange={e=>patch('invoiceDate',e.target.value)}/></label>
              <label>Due Date<input type="date" value={inv.dueDate} onChange={e=>patch('dueDate',e.target.value)}/></label>
            </div>
          </div>

          <div className="invoice-parties">
            <div>
              <h3>Bill To</h3>
              <label>Customer Name<input value={inv.customerName} onChange={e=>patch('customerName',e.target.value)}/></label>
              <label>Address<textarea value={inv.customerAddress} onChange={e=>patch('customerAddress',e.target.value)}/></label>
              <div className="invoice-grid-2">
                <label>Phone<input value={inv.customerPhone} onChange={e=>patch('customerPhone',e.target.value)}/></label>
                <label>Tax ID<input value={inv.customerTaxId} onChange={e=>patch('customerTaxId',e.target.value)}/></label>
              </div>
            </div>
            <div>
              <h3>Invoice Details</h3>
              <div className="invoice-grid-2">
                <label>PO No.<input value={inv.poNo} onChange={e=>patch('poNo',e.target.value)}/></label>
                <label>Salesperson<input value={inv.salesperson} onChange={e=>patch('salesperson',e.target.value)}/></label>
                <label>Currency<select value={inv.currency} onChange={e=>patch('currency',e.target.value)}><option>CNY</option><option>MMK</option></select></label>
                <label>Exchange Rate<input type="number" value={inv.exchangeRate} onChange={e=>patch('exchangeRate',e.target.value)}/></label>
                <label>Status<select value={inv.paymentStatus} onChange={e=>patch('paymentStatus',e.target.value)}><option>Unpaid</option><option>Partial</option><option>Paid</option></select></label>
                <label>Payment Method<input value={inv.paymentMethod} onChange={e=>patch('paymentMethod',e.target.value)}/></label>
              </div>
            </div>
          </div>

          <div className="invoice-items-wrap">
            <table className="invoice-items">
              <thead><tr><th>#</th><th>Product</th><th>Price Source</th><th>Qty</th><th>Unit Price</th><th>Discount %</th><th>Total</th><th className="no-print"></th></tr></thead>
              <tbody>
                {inv.items.map((it,i)=><tr key={it.id}>
                  <td>{i+1}</td>
                  <td>
                    <select value={it.productId} onChange={e=>selectProduct(i,e.target.value)}>
                      <option value="">Select product</option>
                      {products.map(p=><option key={p.id} value={p.id}>{p.spec}</option>)}
                    </select>
                    <input className="invoice-custom-name" value={it.productName} onChange={e=>patchItem(i,'productName',e.target.value)} placeholder="Product / service description"/>
                  </td>
                  <td><select value={it.priceSource} onChange={e=>changePriceSource(i,e.target.value)}><option value="retail">Retail</option><option value="installer">Installer</option><option value="wholesale">Wholesale</option><option value="custom">Custom</option></select></td>
                  <td><input type="number" min="0" step="1" value={it.qty} onChange={e=>patchItem(i,'qty',e.target.value)}/></td>
                  <td><input type="number" min="0" step="0.01" value={it.unitPrice} onChange={e=>patchItem(i,'unitPrice',e.target.value)}/></td>
                  <td><input type="number" min="0" max="100" step="0.01" value={it.discountPct} onChange={e=>patchItem(i,'discountPct',e.target.value)}/></td>
                  <td className="invoice-line-total">{fmt(calc.rows[i]?.total)}</td>
                  <td className="no-print"><button className="invoice-remove" onClick={()=>removeItem(i)}>×</button></td>
                </tr>)}
              </tbody>
            </table>
            <button className="invoice-add no-print" onClick={addItem}>+ Add Item</button>
          </div>

          <div className="invoice-bottom">
            <div className="invoice-notes">
              <label>Notes<textarea value={inv.notes} onChange={e=>patch('notes',e.target.value)} placeholder="Payment terms, bank information or other notes…"/></label>
            </div>
            <div className="invoice-totals">
              <div><span>Subtotal</span><b>{fmt(calc.subtotal)} {inv.currency}</b></div>
              <div><span>Tax %</span><input type="number" min="0" step="0.01" value={inv.taxPct} onChange={e=>patch('taxPct',e.target.value)}/></div>
              <div><span>Tax Amount</span><b>{fmt(calc.tax)} {inv.currency}</b></div>
              <div className="grand"><span>Grand Total</span><b>{fmt(calc.grand)} {inv.currency}</b></div>
              {inv.currency==='CNY' && Number(inv.exchangeRate)>0 && <div className="mmk-total"><span>MMK Equivalent</span><b>{fmt(calc.grand*Number(inv.exchangeRate))} MMK</b></div>}
            </div>
          </div>

          <div className="invoice-signature">
            <div><span>Prepared by</span><strong>{inv.createdBy||'Finance'}</strong></div>
            <div><span>Customer Signature</span><strong>______________________</strong></div>
          </div>
        </div>
        <div className="finance-status no-print">{msg}</div>
      </section>

      <aside className="invoice-history no-print">
        <div className="history-head"><div><span>HISTORY</span><h2>Invoices</h2></div><b>{history.length}</b></div>
        <div className="history-list">
          {history.length===0?<div className="history-empty">No invoices yet.</div>:history.map(h=><button key={h.id} className={inv.id===h.id?'history-item active':'history-item'} onClick={()=>openInvoice(h.id)}>
            <div><strong>{h.invoiceNo}</strong><span>{h.customerName||'No customer'}</span></div>
            <div><b>{fmt(h.grandTotal)} {h.currency}</b><span className={'status-'+String(h.paymentStatus).toLowerCase()}>{h.paymentStatus}</span></div>
          </button>)}
        </div>
      </aside>
    </div>
  </main>
}

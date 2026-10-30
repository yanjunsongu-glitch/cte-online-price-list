'use client';
import {useEffect,useMemo,useState} from 'react';
import './share.css';

function fmt(v){
  if(v===null||v===undefined||v==='')return '';
  if(v==='/'||String(v).includes('%'))return String(v);
  const n=Number(v);
  return Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:2}):String(v);
}

export default function SharedPriceList({params}){
  const [token,setToken]=useState('');
  const [data,setData]=useState(null);
  const [status,setStatus]=useState('loading');
  const [viewer,setViewer]=useState(null);
  const [slide,setSlide]=useState(0);

  useEffect(()=>{
    Promise.resolve(params).then(p=>{
      const t=p?.token||'';
      setToken(t);
      return fetch('/api/share/'+encodeURIComponent(t),{cache:'no-store'});
    }).then(async r=>{
      const j=await r.json().catch(()=>({}));
      if(!r.ok){setStatus(j.status||'missing');return}
      setData(j);
      setStatus('active');
    }).catch(()=>setStatus('missing'));
  },[params]);

  const snapshot=data?.snapshot;
  const sections=useMemo(()=>snapshot?.sections||[],[snapshot]);

  function priceValue(row,col){
    const raw=row?.[col.key];
    if(col.type!=='price')return <span className="share-discount">{fmt(raw)}</span>;
    if(raw===null||raw===undefined||raw==='')return '';
    const n=Number(raw);
    if(!Number.isFinite(n))return <span>{raw}</span>;
    const display=snapshot?.currencyDisplay||'cny';
    const rate=Number(snapshot?.exchangeRate||0);
    const mmk=rate>0?Math.round(n*rate):null;
    return <span className="share-price-stack">
      {(display==='cny'||display==='both')&&<b className="share-cny">{n.toLocaleString('en-US')}</b>}
      {(display==='mmk'||display==='both')&&mmk!==null&&<em className="share-mmk">{mmk.toLocaleString('en-US')} <small>MMK</small></em>}
    </span>;
  }

  function open(row){
    const items=[
      ...(row.image?[{type:'image',url:row.image,name:'Product Photo'}]:[]),
      ...((row.datasheets||[]).map((d,i)=>({type:d.type||'file',url:d.url,name:d.name||('Datasheet '+(i+1))})))
    ];
    if(!items.length)return;
    setViewer({row,items});setSlide(0);
  }

  if(status==='loading')return <main className="share-status-page"><div>Loading customer price list…</div></main>;
  if(status!=='active')return <main className="share-status-page">
    <div className="share-status-card">
      <div className="share-status-mark">CTE</div>
      <h1>{status==='expired'?'This price list has expired':status==='disabled'?'This price list is no longer available':'Price list not found'}</h1>
      <p>Please contact CTE Myanmar for an updated customer price list.</p>
    </div>
  </main>;

  const logo=snapshot.company?.logo||'';
  const opts=snapshot.options||{};

  return <main className="shared-page">
    <header className="shared-hero">
      <div className="shared-brand">
        {logo?<img src={logo} alt="CTE"/>:<div className="shared-logo-fallback">CTE</div>}
        <div>
          <div className="shared-eyebrow">CUSTOMER PRICE LIST</div>
          <h1>{snapshot.company?.name||'CTE MYANMAR CO.,LTD'}</h1>
          {snapshot.company?.address&&<p>{snapshot.company.address}</p>}
          {snapshot.company?.tel&&<p>{snapshot.company.tel}</p>}
        </div>
      </div>
      <div className="shared-title">
        <h2>{snapshot.title||'CTE Price List'}</h2>
        <p>{snapshot.validity}</p>
        {data.customerName&&<div className="shared-for">Prepared for <b>{data.customerName}</b></div>}
        {opts.rate&&snapshot.exchangeRate&&<div className="shared-rate">{snapshot.rateLabel||'CNY / MMK'} <b>{snapshot.exchangeRate}</b></div>}
      </div>
    </header>

    {snapshot.note&&<div className="shared-note">{snapshot.note}</div>}

    {opts.print&&<div className="shared-actions no-print">
      <button onClick={()=>window.print()}>Print / Save PDF</button>
    </div>}

    <div className="shared-sections">
      {sections.map((section,si)=><section className="shared-section" key={section.name}>
        <div className="shared-section-head"><span>{String(si+1).padStart(2,'0')}</span><h3>{section.name}</h3></div>
        <div className="shared-table-wrap">
          <table className="shared-table">
            <thead><tr>
              <th>No.</th>
              <th>Product Specification</th>
              {(opts.images||opts.datasheets)&&<th>Preview</th>}
              {(section.columns||[]).map(col=><th key={col.key}>{col.label}</th>)}
              {opts.remarks&&<th>Remarks</th>}
            </tr></thead>
            <tbody>
              {(section.rows||[]).map((row,ri)=><tr key={row.id}>
                <td data-label="No.">{ri+1}</td>
                <td className="shared-spec" data-label="Product">{row.spec}</td>
                {(opts.images||opts.datasheets)&&<td className="shared-preview" data-label="Preview">
                  {(row.image||(row.datasheets||[]).length)?<button onClick={()=>open(row)}>
                    {row.image?<img src={row.image} alt=""/>:<span>Open</span>}
                    <small>View</small>
                  </button>:<span className="shared-no-file">-</span>}
                </td>}
                {(section.columns||[]).map(col=><td className={col.type==='price'?'shared-price-cell':'shared-discount-cell'} data-label={col.label} key={col.key}>{priceValue(row,col)}</td>)}
                {opts.remarks&&<td className="shared-remarks" data-label="Remarks">{row.remarks}</td>}
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>)}
    </div>

    <footer className="shared-footer">
      <span>{snapshot.company?.name}</span>
      <span>Official Customer Price List</span>
    </footer>

    {viewer&&<div className="shared-modal no-print" onClick={()=>setViewer(null)}>
      <div className="shared-viewer" onClick={e=>e.stopPropagation()}>
        <div className="shared-viewer-head"><strong>{viewer.row.spec}</strong><button onClick={()=>setViewer(null)}>×</button></div>
        <div className="shared-viewer-body">
          {viewer.items[slide]?.type==='image'
            ?<img src={viewer.items[slide]?.url} alt=""/>
            :<iframe src={viewer.items[slide]?.url}/>}
        </div>
        <div className="shared-viewer-nav">
          <button disabled={slide===0} onClick={()=>setSlide(x=>x-1)}>Previous</button>
          <span>{viewer.items[slide]?.name} · {slide+1}/{viewer.items.length}</span>
          <button disabled={slide===viewer.items.length-1} onClick={()=>setSlide(x=>x+1)}>Next</button>
        </div>
      </div>
    </div>}
  </main>
}

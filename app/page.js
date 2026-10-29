'use client';
import {useEffect,useMemo,useState} from 'react';

function money(v){
  if(v===null||v===undefined||v==='') return '';
  if(v==='/'||String(v).includes('%')) return v;
  const n=Number(v);
  return Number.isFinite(n)?n.toLocaleString('en-US'):v;
}

export default function Home(){
  const [data,setData]=useState(null);
  const [q,setQ]=useState('');
  const [viewer,setViewer]=useState(null);
  const [slide,setSlide]=useState(0);

  useEffect(()=>{
    fetch('/api/catalog',{cache:'no-store'}).then(r=>r.json()).then(setData)
  },[]);

  const sections=useMemo(()=>!data?[]:data.sections.map(s=>({
    ...s,
    rows:s.rows.filter(r=>r.visible!==false && (!q || (r.spec+' '+r.remarks).toLowerCase().includes(q.toLowerCase())))
  })).filter(s=>s.rows.length),[data,q]);

  const labels={
    no:data?.labels?.no||'No.',
    product:data?.labels?.product||'Product Specification',
    preview:data?.labels?.preview||'Preview',
    remarks:data?.labels?.remarks||'Remarks'
  };

  function open(r){
    const items=[
      ...(r.image?[{type:'image',url:r.image,name:'Product Photo'}]:[]),
      ...((r.datasheets||[]).map((d,i)=>({type:d.type||'file',url:d.url,name:d.name||`Datasheet ${i+1}`})))
    ];
    if(!items.length) return;
    setViewer({product:r,items});
    setSlide(0);
  }

  function renderPreviewCell(r){
    const hasAssets = Boolean(r.image) || Boolean(r.datasheets?.length);
    if(!hasAssets) return <span className="no-asset">No file</span>;
    return (
      <button className="image-btn no-print" onClick={()=>open(r)}>
        <div className="thumb-frame">
          {r.image ? <img src={r.image} alt={r.spec}/> : <div className="thumb-placeholder">PDF / Datasheet</div>}
        </div>
        <span>{r.image ? labels.preview : 'Open file'}</span>
      </button>
    );
  }

  if(!data) return <main className="shell"><div className="loading">Loading CTE price list…</div></main>;

  return (
    <main className="shell">
      <header className="hero">
        <div className="brand">
          {data.company?.logo && <img src={data.company.logo} alt="CTE"/>}
          <div>
            <h1>{data.company?.name||'CTE MYANMAR CO.,LTD'}</h1>
            <p>{data.company?.address}</p>
            <p>{data.company?.tel}</p>
          </div>
        </div>
        <div className="title">
          <h2>{data.title||'CTE Price List'}</h2>
          <div>{data.validity}</div>
          <div className="note">{data.note}</div>
        </div>
      </header>

      <div className="toolbar no-print">
        <input placeholder="Search product…" value={q} onChange={e=>setQ(e.target.value)}/>
        <button onClick={()=>window.print()}>Print / Save PDF</button>
        <a href="/admin">Staff Login</a>
      </div>

      {sections.map((s)=>(
        <section key={s.name} className="section">
          <h3>{s.name}</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{labels.no}</th>
                  <th>{labels.product}</th>
                  <th>{labels.preview}</th>
                  {s.heads.map((h,i)=><th key={i}>{h}</th>)}
                  <th>{labels.remarks}</th>
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r,ri)=>(
                  <tr key={r.id}>
                    <td>{ri+1}</td>
                    <td className="spec">{r.spec}</td>
                    <td className="preview-col">
                      {renderPreviewCell(r)}
                      <div className="print-image">{r.image&&<img src={r.image} alt=""/>}</div>
                    </td>
                    <td>{money(r.retail)}</td>
                    <td>{money(r.installer)}</td>
                    <td>{money(r.wholesale)}</td>
                    <td>{money(r.rebate)}</td>
                    <td className="remarks">{r.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <footer>{data.company?.name} · Online price list</footer>

      {viewer && (
        <div className="modal no-print" onClick={()=>setViewer(null)}>
          <div className="viewer" onClick={e=>e.stopPropagation()}>
            <div className="viewer-head">
              <strong>{viewer.product.spec}</strong>
              <button onClick={()=>setViewer(null)}>×</button>
            </div>
            <div className="viewer-stage">
              {viewer.items[slide]?.type==='image'||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(viewer.items[slide]?.url||'')
                ? <img src={viewer.items[slide]?.url} alt=""/>
                : <iframe src={viewer.items[slide]?.url}/>
              }
            </div>
            <div className="viewer-nav">
              <button disabled={slide===0} onClick={()=>setSlide(x=>x-1)}>Previous</button>
              <span>{viewer.items[slide]?.name} · {slide+1}/{viewer.items.length}</span>
              <button disabled={slide>=viewer.items.length-1} onClick={()=>setSlide(x=>x+1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
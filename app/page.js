'use client';
import {useEffect,useMemo,useRef,useState} from 'react';

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
  const [zoom,setZoom]=useState(1);
  const [selectMode,setSelectMode]=useState(false);
  const [selected,setSelected]=useState({});
  const [printMode,setPrintMode]=useState(null);
  const [printPriceLevel,setPrintPriceLevel]=useState('retail');
  const stageRef=useRef(null);
  const dragRef=useRef(null);

  useEffect(()=>{
    fetch('/api/catalog',{cache:'no-store'}).then(r=>r.json()).then(setData)
  },[]);

  useEffect(()=>{
    const done=()=>setPrintMode(null);
    window.addEventListener('afterprint',done);
    return ()=>window.removeEventListener('afterprint',done);
  },[]);

  useEffect(()=>{
    setZoom(1);
    requestAnimationFrame(()=>{
      if(stageRef.current){
        stageRef.current.scrollLeft=0;
        stageRef.current.scrollTop=0;
      }
    });
  },[slide,viewer?.product?.id]);

  const sections=useMemo(()=>!data?[]:data.sections.map(s=>({
    ...s,
    rows:s.rows.filter(r=>r.visible!==false && (!q || (r.spec+' '+r.remarks).toLowerCase().includes(q.toLowerCase())))
  })).filter(s=>s.rows.length),[data,q]);

  const visibleIds=useMemo(()=>sections.flatMap(s=>s.rows.map(r=>r.id)),[sections]);

  const labels={
    no:data?.labels?.no||'No.',
    product:data?.labels?.product||'Product Specification',
    preview:data?.labels?.preview||'Preview',
    remarks:data?.labels?.remarks||'Remarks'
  };

  const printPriceCount={retail:1,installer:2,wholesale:3,all:4}[printPriceLevel]||1;
  const rate1Label=data?.rateLabel1||'CNY / MMK';
  const rate2Label=data?.rateLabel2||'USD / MMK';

  const printSections=useMemo(()=>{
    if(!data) return [];
    return data.sections.map(s=>({
      ...s,
      rows:s.rows.filter(r=>r.visible!==false && (printMode==='all' || (printMode==='selected' && selected[r.id])))
    })).filter(s=>s.rows.length);
  },[data,printMode,selected]);

  function open(r){
    const items=[
      ...(r.image?[{type:'image',url:r.image,name:'Product Photo'}]:[]),
      ...((r.datasheets||[]).map((d,i)=>({type:d.type||'file',url:d.url,name:d.name||`Datasheet ${i+1}`})))
    ];
    if(!items.length) return;
    setViewer({product:r,items});
    setSlide(0);
  }

  function setZoomLevel(next){
    setZoom(Math.max(.5,Math.min(3,next)));
  }

  function zoomBy(delta){
    setZoom(z=>Math.max(.5,Math.min(3,Number((z+delta).toFixed(2)))));
  }

  function resetViewer(){
    setZoom(1);
    requestAnimationFrame(()=>{
      if(stageRef.current){
        stageRef.current.scrollLeft=0;
        stageRef.current.scrollTop=0;
      }
    });
  }

  function onWheel(e){
    if(!viewer) return;
    e.preventDefault();
    zoomBy(e.deltaY<0?.15:-.15);
  }

  function onPointerDown(e){
    const el=stageRef.current;
    if(!el || zoom<=1) return;
    el.setPointerCapture?.(e.pointerId);
    dragRef.current={
      x:e.clientX,
      y:e.clientY,
      left:el.scrollLeft,
      top:el.scrollTop
    };
    el.classList.add('is-dragging');
  }

  function onPointerMove(e){
    const el=stageRef.current;
    const d=dragRef.current;
    if(!el||!d) return;
    el.scrollLeft=d.left-(e.clientX-d.x);
    el.scrollTop=d.top-(e.clientY-d.y);
  }

  function onPointerUp(e){
    const el=stageRef.current;
    if(el){
      el.releasePointerCapture?.(e.pointerId);
      el.classList.remove('is-dragging');
    }
    dragRef.current=null;
  }

  function toggleProduct(id){
    setSelected(s=>({...s,[id]:!s[id]}));
  }

  function selectAllVisible(){
    const next={...selected};
    visibleIds.forEach(id=>next[id]=true);
    setSelected(next);
  }

  function clearVisible(){
    const next={...selected};
    visibleIds.forEach(id=>next[id]=false);
    setSelected(next);
  }

  function beginPrint(mode){
    if(mode==='selected'){
      const count=Object.values(selected).filter(Boolean).length;
      if(!count){
        alert('Please select at least one product to print.');
        return;
      }
    }
    setPrintMode(mode);
    setTimeout(()=>window.print(),120);
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

  function PrintDocument(){
    if(!printMode) return null;
    return <div className="print-document">
      <div className="pq-header">
        <div className="pq-brand">
          <img src={data.company?.logo||'/logo.jpg'} alt="CTE logo"/>
          <div>
            <h1>{data.company?.name||'CTE MYANMAR CO.,LTD'}</h1>
            <p>{data.company?.address}</p>
            <p>TEL: {data.company?.tel}</p>
          </div>
        </div>
        <div className="pq-validity">{data.validity}</div>
      </div>

      <div className="pq-blue-line"></div>

      <div className="pq-titlebar">
        <strong>{data.printTitle||'Product Quotation'}</strong>
        <span>{printPriceLevel==='retail'?'RETAIL':printPriceLevel==='installer'?'FOR INSTALLERS':printPriceLevel==='wholesale'?'FOR WHOLESALE':'FULL PRICE LIST'}</span>
      </div>

      <div className="pq-note">{data.note||'Prices exclude installation charges.'}</div>

      <div className="pq-ratebar">
        <div>{'CURRENCY: '+(data.currency||'CNY')}</div>
        <div className="pq-rates">
          {data.rate && <span>{rate1Label}: <b>{data.rate}</b></span>}
          {data.rate2 && <span>{rate2Label}: <b>{data.rate2}</b></span>}
        </div>
      </div>

      {printSections.map((section,si)=><section className="pq-section" key={section.name}>
        <div className="pq-section-head">
          <span className="pq-section-no">{String(si+1).padStart(2,'0')}</span>
          <strong>{section.name}</strong>
        </div>

        <table className="pq-table">
          <thead>
            <tr>
              <th>{labels.no}</th>
              <th>{labels.product}</th>
              <th>{data.printImageLabel||'Product Image'}</th>
              {section.heads.slice(0,printPriceCount).map((h,i)=><th key={i}>{h}<br/>{data.currency||'CNY'}</th>)}
              <th>{labels.remarks}</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((r,ri)=><tr key={r.id}>
              <td>{ri+1}</td>
              <td className="pq-spec">{r.spec}</td>
              <td className="pq-image-cell">{r.image?<img src={r.image} alt=""/>:'-'}</td>
              {printPriceCount>=1 && <td className="pq-price">{money(r.retail)}</td>}
              {printPriceCount>=2 && <td className="pq-price">{money(r.installer)}</td>}
              {printPriceCount>=3 && <td className="pq-price">{money(r.wholesale)}</td>}
              {printPriceCount>=4 && <td className="pq-price">{money(r.rebate)}</td>}
              <td className="pq-remarks">{r.remarks}</td>
            </tr>)}
          </tbody>
        </table>
      </section>)}

      <div className="pq-footer">
        <span>{data.company?.name}</span>
        <span>Official Customer Price List</span>
      </div>
    </div>
  }

  if(!data) return <main className="shell"><div className="loading">Loading CTE price list…</div></main>;

  const item=viewer?.items?.[slide];
  const isImage=item && (item.type==='image'||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(item.url||''));

  return <>
    <main className="shell screen-content">
      <header className="hero premium-hero">
        <div className="brand premium-brand">
          <div className="brand-logo-wrap">
            <img src={data.company?.logo||'/logo.jpg'} alt="CTE"/>
          </div>
          <div>
            <div className="brand-eyebrow">PHOTOVOLTAIC · ENERGY STORAGE</div>
            <h1>{data.company?.name||'CTE MYANMAR CO.,LTD'}</h1>
            <p>{data.company?.address}</p>
            <p>{data.company?.tel}</p>
          </div>
        </div>
        <div className="title premium-title">
          <div className="price-list-badge">LIVE PRICE LIST</div>
          <h2>{data.title||'CTE Price List'}</h2>
          <div className="validity-line">{data.validity}</div>
          <div className="rate-pills">
            {data.rate && <span><b>{rate1Label}</b>{data.rate}</span>}
            {data.rate2 && <span><b>{rate2Label}</b>{data.rate2}</span>}
          </div>
          <div className="note">{data.note}</div>
        </div>
      </header>

      <div className="toolbar no-print">
        <input placeholder="Search product…" value={q} onChange={e=>setQ(e.target.value)}/>
        <button className={selectMode?'secondary-active':''} onClick={()=>setSelectMode(x=>!x)}>{selectMode?'Done Selecting':'Select Products'}</button>
        <label className="print-level-control">
          <span>Print Price</span>
          <select value={printPriceLevel} onChange={e=>setPrintPriceLevel(e.target.value)}>
            <option value="retail">Retail only</option>
            <option value="installer">Retail + Installer</option>
            <option value="wholesale">Retail + Installer + Wholesale</option>
            <option value="all">All price columns</option>
          </select>
        </label>
        <button onClick={()=>beginPrint('all')}>Print All</button>
        <button className="print-selected-btn" onClick={()=>beginPrint('selected')}>Print Selected</button>
        <a href="/admin">Staff Login</a>
      </div>

      {selectMode && <div className="selection-bar no-print">
        <strong>{visibleIds.filter(id=>selected[id]).length} selected</strong>
        <button onClick={selectAllVisible}>Select all visible</button>
        <button onClick={clearVisible}>Clear</button>
        <span>Select only the products you want to send to the customer.</span>
      </div>}

      {sections.map((s)=>(
        <section key={s.name} className="section">
          <h3>{s.name}</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {selectMode&&<th className="select-col no-print">✓</th>}
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
                    {selectMode&&<td className="select-col no-print"><input className="row-check" type="checkbox" checked={Boolean(selected[r.id])} onChange={()=>toggleProduct(r.id)}/></td>}
                    <td>{ri+1}</td>
                    <td className="spec">{r.spec}</td>
                    <td className="preview-col">{renderPreviewCell(r)}</td>
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
          <div className="viewer viewer-v2" onClick={e=>e.stopPropagation()}>
            <div className="viewer-head">
              <strong>{viewer.product.spec}</strong>
              <div className="viewer-actions">
                {isImage && <>
                  <button onClick={()=>zoomBy(-.2)}>−</button>
                  <span>{Math.round(zoom*100)}%</span>
                  <button onClick={()=>zoomBy(.2)}>+</button>
                  <button className="reset-view" onClick={resetViewer}>Fit</button>
                </>}
                {!isImage && item?.url && <a className="open-file-tab" href={item.url} target="_blank" rel="noreferrer">Open PDF</a>}
                <button className="close-viewer" onClick={()=>setViewer(null)}>×</button>
              </div>
            </div>

            <div
              ref={stageRef}
              className={`viewer-canvas ${zoom>1?'can-pan':''}`}
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {isImage
                ? <div className="viewer-image-wrap" style={{width:`${zoom*100}%`,height:`${zoom*100}%`}}>
                    <img src={item?.url} alt="" draggable="false"/>
                  </div>
                : <iframe src={item?.url}/>
              }
            </div>

            <div className="viewer-nav">
              <button disabled={slide===0} onClick={()=>setSlide(x=>x-1)}>Previous</button>
              <span>{item?.name} · {slide+1}/{viewer.items.length}</span>
              <button disabled={slide>=viewer.items.length-1} onClick={()=>setSlide(x=>x+1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </main>
    <PrintDocument/>
  </>
}
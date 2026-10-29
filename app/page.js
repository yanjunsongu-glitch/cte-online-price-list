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
  const [zoom,setZoom]=useState(1);
  const [pos,setPos]=useState({x:0,y:0});
  const [drag,setDrag]=useState(null);
  const [selectMode,setSelectMode]=useState(false);
  const [selected,setSelected]=useState({});
  const [printingSelected,setPrintingSelected]=useState(false);

  useEffect(()=>{
    fetch('/api/catalog',{cache:'no-store'}).then(r=>r.json()).then(setData)
  },[]);

  useEffect(()=>{
    const done=()=>setPrintingSelected(false);
    window.addEventListener('afterprint',done);
    return ()=>window.removeEventListener('afterprint',done);
  },[]);

  useEffect(()=>{ resetView(); },[slide,viewer?.product?.id]);

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

  function open(r){
    const items=[
      ...(r.image?[{type:'image',url:r.image,name:'Product Photo'}]:[]),
      ...((r.datasheets||[]).map((d,i)=>({type:d.type||'file',url:d.url,name:d.name||`Datasheet ${i+1}`})))
    ];
    if(!items.length) return;
    setViewer({product:r,items});
    setSlide(0);
  }

  function resetView(){
    setZoom(1);
    setPos({x:0,y:0});
    setDrag(null);
  }

  function changeZoom(delta){
    setZoom(z=>Math.max(.5,Math.min(4,Number((z+delta).toFixed(2)))));
  }

  function onWheel(e){
    e.preventDefault();
    changeZoom(e.deltaY<0?.2:-.2);
  }

  function onPointerDown(e){
    if(zoom<=1) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({x:e.clientX,y:e.clientY,px:pos.x,py:pos.y});
  }

  function onPointerMove(e){
    if(!drag) return;
    setPos({x:drag.px+(e.clientX-drag.x),y:drag.py+(e.clientY-drag.y)});
  }

  function onPointerUp(e){
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDrag(null);
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

  function printAll(){
    setPrintingSelected(false);
    setTimeout(()=>window.print(),30);
  }

  function printSelected(){
    const count=visibleIds.filter(id=>selected[id]).length;
    if(!count){
      alert('Please select at least one product to print.');
      return;
    }
    setPrintingSelected(true);
    setTimeout(()=>window.print(),80);
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
    <main className={`shell ${printingSelected?'print-selected-mode':''}`}>
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
        <button className={selectMode?'secondary-active':''} onClick={()=>setSelectMode(x=>!x)}>{selectMode?'Done Selecting':'Select Products'}</button>
        <button onClick={printAll}>Print All</button>
        <button className="print-selected-btn" onClick={printSelected}>Print Selected</button>
        <a href="/admin">Staff Login</a>
      </div>

      {selectMode && <div className="selection-bar no-print">
        <strong>{visibleIds.filter(id=>selected[id]).length} selected</strong>
        <button onClick={selectAllVisible}>Select all visible</button>
        <button onClick={clearVisible}>Clear</button>
        <span>Tick only the products you want to send to the customer, then choose Print Selected.</span>
      </div>}

      {sections.map((s)=>{
        const sectionHasSelected=s.rows.some(r=>selected[r.id]);
        return <section key={s.name} className="section" data-section-selected={sectionHasSelected?'true':'false'}>
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
                  <tr key={r.id} data-selected={selected[r.id]?'true':'false'}>
                    {selectMode&&<td className="select-col no-print"><input className="row-check" type="checkbox" checked={Boolean(selected[r.id])} onChange={()=>toggleProduct(r.id)}/></td>}
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
      })}

      <footer>{data.company?.name} · Online price list</footer>

      {viewer && (
        <div className="modal no-print" onClick={()=>setViewer(null)}>
          <div className="viewer" onClick={e=>e.stopPropagation()}>
            <div className="viewer-head">
              <strong>{viewer.product.spec}</strong>
              <div className="viewer-actions">
                {(viewer.items[slide]?.type==='image'||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(viewer.items[slide]?.url||'')) && <>
                  <button onClick={()=>changeZoom(-.25)} title="Zoom out">−</button>
                  <span>{Math.round(zoom*100)}%</span>
                  <button onClick={()=>changeZoom(.25)} title="Zoom in">+</button>
                  <button className="reset-view" onClick={resetView}>Reset</button>
                </>}
                <button className="close-viewer" onClick={()=>setViewer(null)}>×</button>
              </div>
            </div>
            <div className={`viewer-stage ${zoom>1?'can-pan':''}`} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
              {viewer.items[slide]?.type==='image'||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(viewer.items[slide]?.url||'')
                ? <img className="zoomable-image" draggable="false" style={{transform:`translate(${pos.x}px,${pos.y}px) scale(${zoom})`}} src={viewer.items[slide]?.url} alt=""/>
                : <iframe src={viewer.items[slide]?.url}/>
              }
            </div>
            <div className="viewer-nav">
              <button disabled={slide===0} onClick={()=>{setSlide(x=>x-1);resetView()}}>Previous</button>
              <span>{viewer.items[slide]?.name} · {slide+1}/{viewer.items.length}</span>
              <button disabled={slide>=viewer.items.length-1} onClick={()=>{setSlide(x=>x+1);resetView()}}>Next</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
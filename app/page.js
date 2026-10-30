'use client';
import {useEffect,useMemo,useRef,useState} from 'react';

const CTE_LOGO='data:image/jpeg;base64,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';

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
  const [selectedColumnKeys,setSelectedColumnKeys]=useState(['retail','installer','wholesale','packageDiscount','repeatDiscount','specialDiscount']);
  const [currencyDisplay,setCurrencyDisplay]=useState('both');
  const [todayRate,setTodayRate]=useState('');
  const [settingsOpen,setSettingsOpen]=useState(false);
  const stageRef=useRef(null);
  const toolbarRef=useRef(null);
  const dragRef=useRef(null);

  useEffect(()=>{
    fetch('/api/catalog',{cache:'no-store'}).then(r=>r.json()).then(j=>{
      setData(j);
      const saved=typeof window!=='undefined'?window.localStorage.getItem('cteTodayCnyMmkRate'):'';
      setTodayRate(saved||String(j.rate||''));
    })
  },[]);

  useEffect(()=>{
    const done=()=>setPrintMode(null);
    window.addEventListener('afterprint',done);
    return ()=>window.removeEventListener('afterprint',done);
  },[]);

  useEffect(()=>{
    if(!settingsOpen) return;
    const onKey=e=>{if(e.key==='Escape') setSettingsOpen(false)};
    window.addEventListener('keydown',onKey);
    const old=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return ()=>{
      window.removeEventListener('keydown',onKey);
      document.body.style.overflow=old;
    };
  },[settingsOpen]);

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

  const rate1Label=data?.rateLabel1||'CNY / MMK';

  function sectionColumns(section){
    if(Array.isArray(section.columns)) return section.columns;
    return (section.heads||[]).map((label,i)=>({
      key:['retail','installer','wholesale','rebate'][i]||('value'+i),
      label,
      type:i<3?'price':'discount'
    }));
  }

  function visibleColumns(section){
    return sectionColumns(section).filter(col=>selectedColumnKeys.includes(col.key));
  }

  function toggleColumn(key){
    setSelectedColumnKeys(keys=>keys.includes(key)?keys.filter(k=>k!==key):[...keys,key]);
  }

  function selectAllColumns(){
    const keys=Array.from(new Set((data?.sections||[]).flatMap(s=>sectionColumns(s).map(c=>c.key))));
    setSelectedColumnKeys(keys);
  }

  function clearColumns(){
    setSelectedColumnKeys([]);
  }

  const columnChoices=useMemo(()=>{
    if(!data) return [];
    const map=new Map();
    for(const section of data.sections||[]){
      for(const col of sectionColumns(section)){
        if(!map.has(col.key)) map.set(col.key,{key:col.key,label:col.label,type:col.type});
      }
    }
    return Array.from(map.values());
  },[data]);

  function renderValue(row,col,print=false){
    const v=row?.[col.key];
    return col.type==='price'?dualPrice(v,print):<span className={print?'discount-value discount-value-print':'discount-value'}>{v||''}</span>;
  }

  function updateTodayRate(v){
    setTodayRate(v);
    if(typeof window!=='undefined') window.localStorage.setItem('cteTodayCnyMmkRate',v);
  }

  function dualPrice(v,print=false){
    if(v===null||v===undefined||v==='') return '';
    if(v==='/'||String(v).includes('%')) return <span>{v}</span>;
    const n=Number(v);
    if(!Number.isFinite(n)) return <span>{v}</span>;
    const r=Number(todayRate);
    const mmk=Number.isFinite(r)&&r>0?Math.round(n*r):null;
    return <span className={print?'dual-price dual-price-print':'dual-price'}>
      {(currencyDisplay==='cny'||currencyDisplay==='both') && <b className="price-cny">{n.toLocaleString('en-US')}</b>}
      {(currencyDisplay==='mmk'||currencyDisplay==='both') && mmk!==null && <em className="price-mmk">{mmk.toLocaleString('en-US')} <small>MMK</small></em>}
    </span>
  }

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

  function scrollToolbar(e){
    const el=toolbarRef.current;
    if(!el || el.scrollWidth<=el.clientWidth) return;
    if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){
      el.scrollLeft+=e.deltaY;
    }
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
          <img src={logoSrc} onError={e=>{e.currentTarget.src=CTE_LOGO}} alt="CTE logo"/>
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
        <span>{selectedColumnKeys.length?selectedColumnKeys.map(k=>k.replace(/([A-Z])/g,' $1')).join(' + ').toUpperCase():'CUSTOM'}</span>
      </div>

      <div className="pq-note">{data.note||'Prices exclude installation charges.'}</div>

      <div className="pq-ratebar">
        <div>{'CURRENCY: '+(data.currency||'CNY')}</div>
        <div className="pq-rates">
          {todayRate && <span>Today's {rate1Label}: <b>{todayRate}</b></span>}
        </div>
      </div>

      {printSections.map((section,si)=>{
        const startNo=printSections.slice(0,si).reduce((n,x)=>n+x.rows.length,0);
        return <section className="pq-section" key={section.name}>
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
              {visibleColumns(section).map((col,i)=><th key={col.key}>{col.label}{col.type==='price'?<><br/>{data.currency||'CNY'}</>:null}</th>)}
              <th>{labels.remarks}</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((r,ri)=><tr key={r.id}>
              <td>{startNo+ri+1}</td>
              <td className="pq-spec">{r.spec}</td>
              <td className="pq-image-cell">{r.image?<img src={r.image} alt=""/>:'-'}</td>
              {visibleColumns(section).map(col=><td className={col.type==='price'?'pq-price':'pq-discount'} key={col.key}>{renderValue(r,col,true)}</td>)}
              <td className="pq-remarks">{r.remarks}</td>
            </tr>)}
          </tbody>
        </table>
      </section>})}

      <div className="pq-footer">
        <span>{data.company?.name}</span>
        <span>Official Customer Price List</span>
      </div>
    </div>
  }

  if(!data) return <main className="shell"><div className="loading">Loading CTE price list…</div></main>;

  const logoSrc=(data.company?.logo && data.company.logo!=='/logo.jpg')?data.company.logo:CTE_LOGO;
  const item=viewer?.items?.[slide];
  const isImage=item && (item.type==='image'||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(item.url||''));

  return <>
    <main className="shell screen-content">
      <header className="hero premium-hero">
        <div className="brand premium-brand">
          <div className="brand-logo-wrap">
            <img src={logoSrc} onError={e=>{e.currentTarget.src=CTE_LOGO}} alt="CTE"/>
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
            {todayRate && <span><b>Today's {rate1Label}</b>{todayRate}</span>}
          </div>
          <div className="note">{data.note}</div>
        </div>
      </header>

      <div ref={toolbarRef} className="toolbar toolbar-scroll no-print" onWheel={scrollToolbar}>
        <input className="toolbar-search" placeholder="Search product…" value={q} onChange={e=>setQ(e.target.value)}/>
        <button className={selectMode?'secondary-active':''} onClick={()=>setSelectMode(x=>!x)}>{selectMode?'Done Selecting':'Select Products'}</button>
        <button className="display-settings-btn" onClick={()=>setSettingsOpen(true)}>
          <span>Display Settings</span>
          <small>{selectedColumnKeys.length} columns · {currencyDisplay==='cny'?'CNY':currencyDisplay==='mmk'?'MMK':'CNY + MMK'}</small>
        </button>
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

      {settingsOpen && <div className="display-settings-overlay no-print" onClick={()=>setSettingsOpen(false)}>
        <div className="display-settings-sheet" onClick={e=>e.stopPropagation()}>
          <div className="settings-handle"></div>
          <div className="display-settings-head">
            <div>
              <div className="settings-kicker">PRICE LIST VIEW</div>
              <h3>Display Settings</h3>
              <p>Choose exactly what customers should see.</p>
            </div>
            <button className="settings-close" onClick={()=>setSettingsOpen(false)}>×</button>
          </div>

          <section className="settings-section">
            <div className="settings-section-title">
              <div>
                <strong>Price Columns</strong>
                <span>{selectedColumnKeys.length} selected</span>
              </div>
              <div className="settings-mini-actions">
                <button type="button" onClick={selectAllColumns}>All</button>
                <button type="button" onClick={clearColumns}>Clear</button>
              </div>
            </div>

            <div className="preset-row">
              <button type="button" onClick={()=>setSelectedColumnKeys(['retail'])}>Retail only</button>
              <button type="button" onClick={()=>setSelectedColumnKeys(['retail','installer'])}>Retail + Installer</button>
              <button type="button" onClick={()=>setSelectedColumnKeys(['retail','repeatDiscount'])}>Retail + Repeat Dis</button>
            </div>

            <div className="column-choice-grid">
              {columnChoices.map(col=>{
                const active=selectedColumnKeys.includes(col.key);
                return <button type="button" key={col.key} className={active?'column-choice active':'column-choice'} onClick={()=>toggleColumn(col.key)}>
                  <span className="choice-check">{active?'✓':''}</span>
                  <span className="choice-copy">
                    <strong>{col.label}</strong>
                    <small>{col.type==='price'?'Price column':'Discount column'}</small>
                  </span>
                </button>
              })}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">
              <div>
                <strong>Currency Display</strong>
                <span>Choose how product prices appear</span>
              </div>
            </div>
            <div className="currency-segment">
              <button className={currencyDisplay==='cny'?'active':''} onClick={()=>setCurrencyDisplay('cny')}>CNY</button>
              <button className={currencyDisplay==='mmk'?'active':''} onClick={()=>setCurrencyDisplay('mmk')}>MMK</button>
              <button className={currencyDisplay==='both'?'active':''} onClick={()=>setCurrencyDisplay('both')}>Both</button>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">
              <div>
                <strong>Today&apos;s Exchange Rate</strong>
                <span>CNY → MMK</span>
              </div>
            </div>
            <div className="settings-rate-row">
              <input type="number" min="0" step="0.01" value={todayRate} onChange={e=>updateTodayRate(e.target.value)} placeholder="e.g. 693"/>
              <button type="button" onClick={()=>updateTodayRate(String(data.rate||''))}>Use Default</button>
            </div>
          </section>

          <div className="display-settings-footer">
            <button className="settings-done" onClick={()=>setSettingsOpen(false)}>Done</button>
          </div>
        </div>
      </div>}

      {sections.map((s,si)=>{
        const startNo=sections.slice(0,si).reduce((n,x)=>n+x.rows.length,0);
        return <section key={s.name} className="section">
          <h3>{s.name}</h3>
          <div className="table-wrap customer-table-wrap">
            <table className="price-table">
              <thead>
                <tr>
                  {selectMode&&<th className="select-col no-print">✓</th>}
                  <th>{labels.no}</th>
                  <th>{labels.product}</th>
                  <th>{labels.preview}</th>
                  {visibleColumns(s).map(col=><th key={col.key}>{col.label}</th>)}
                  <th>{labels.remarks}</th>
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r,ri)=>(
                  <tr key={r.id}>
                    {selectMode&&<td className="select-col no-print" data-label="Select"><input className="row-check" type="checkbox" checked={Boolean(selected[r.id])} onChange={()=>toggleProduct(r.id)}/></td>}
                    <td data-label={labels.no}>{startNo+ri+1}</td>
                    <td className="spec" data-label={labels.product}>{r.spec}</td>
                    <td className="preview-col" data-label={labels.preview}>{renderPreviewCell(r)}</td>
                    {visibleColumns(s).map(col=><td key={col.key} className={col.type==='price'?'price-cell':'discount-cell'} data-label={col.label}>{renderValue(r,col)}</td>)}
                    <td className="remarks" data-label={labels.remarks}>{r.remarks}</td>
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
    <style>{`
      .display-settings-btn{display:flex!important;flex-direction:column;align-items:flex-start!important;justify-content:center!important;min-width:210px;border-radius:12px!important;background:#0b5ba7!important;color:#fff!important;border:0!important;padding:8px 14px!important}
      .display-settings-btn span{font-size:13px;font-weight:800}.display-settings-btn small{margin-top:2px;font-size:10px;font-weight:600;opacity:.85}
      .display-settings-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(7,22,37,.55);backdrop-filter:blur(7px)}
      .display-settings-sheet{width:min(760px,94vw);max-height:88vh;overflow:auto;border:1px solid #d8e3ed;border-radius:24px;background:#fff;box-shadow:0 30px 80px rgba(8,31,52,.30)}
      .settings-handle{display:none}.display-settings-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:22px 24px 16px;border-bottom:1px solid #e8eef4}
      .settings-kicker{margin-bottom:5px;color:#d92b2f;font-size:10px;font-weight:800;letter-spacing:1.5px}.display-settings-head h3{margin:0;color:#123d68;font-size:24px;line-height:1.1}.display-settings-head p{margin:6px 0 0;color:#6a7b8d;font-size:13px}
      .settings-close{width:38px!important;height:38px!important;min-width:38px!important;padding:0!important;border:0!important;border-radius:12px!important;background:#f0f5f9!important;color:#21425f!important;font-size:24px!important;line-height:1!important}
      .settings-section{padding:18px 24px;border-bottom:1px solid #edf2f6}.settings-section-title{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.settings-section-title>div:first-child{display:flex;flex-direction:column;gap:3px}.settings-section-title strong{color:#173d63;font-size:14px}.settings-section-title span{color:#7a8998;font-size:11px}
      .settings-mini-actions{display:flex;gap:7px}.settings-mini-actions button{min-height:30px!important;padding:5px 9px!important;border:1px solid #cbd9e6!important;border-radius:9px!important;background:#fff!important;color:#0b5ba7!important;font-size:11px!important}
      .preset-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.preset-row button{min-height:34px!important;padding:7px 10px!important;border:1px solid #c9d9e8!important;border-radius:10px!important;background:#f8fbff!important;color:#24547e!important;font-size:11px!important;font-weight:700!important}
      .column-choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.column-choice{display:flex!important;align-items:flex-start!important;gap:10px!important;min-height:66px!important;padding:11px 12px!important;border:1px solid #d8e3ed!important;border-radius:13px!important;background:#fff!important;color:#243d55!important;text-align:left!important}.column-choice.active{border-color:#5e9fd6!important;background:#eef7ff!important;box-shadow:inset 0 0 0 1px #5e9fd6}
      .choice-check{display:flex;align-items:center;justify-content:center;width:22px;height:22px;flex:0 0 22px;margin-top:1px;border:1.5px solid #b7c9da;border-radius:7px;background:#fff;color:#fff;font-size:13px;font-weight:900}.column-choice.active .choice-check{border-color:#0b5ba7;background:#0b5ba7}
      .choice-copy{display:flex;flex-direction:column;gap:3px}.choice-copy strong{color:#173d63;font-size:12px;line-height:1.3}.choice-copy small{color:#7b8997;font-size:10px}
      .currency-segment{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:4px;border-radius:12px;background:#eef3f7}.currency-segment button{min-height:40px!important;border:0!important;border-radius:9px!important;background:transparent!important;color:#637587!important;font-size:12px!important;font-weight:800!important}.currency-segment button.active{background:#fff!important;color:#0b5ba7!important;box-shadow:0 3px 10px rgba(24,54,84,.10)}
      .settings-rate-row{display:grid;grid-template-columns:1fr auto;gap:9px}.settings-rate-row input{min-width:0;height:42px;padding:0 12px;border:1px solid #cbd9e6;border-radius:10px;font-size:14px;font-weight:700;color:#173d63}.settings-rate-row button{min-height:42px!important;border:1px solid #bdd0e2!important;border-radius:10px!important;background:#f8fbff!important;color:#0b5ba7!important;font-weight:800!important}
      .display-settings-footer{position:sticky;bottom:0;padding:14px 24px 18px;background:linear-gradient(180deg,rgba(255,255,255,.90),#fff 35%)}.settings-done{width:100%;min-height:46px!important;border-radius:12px!important;background:#0b5ba7!important;color:#fff!important;font-size:14px!important;font-weight:800!important}
      @media(max-width:720px){
        .toolbar{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;overflow:visible!important;padding:10px 12px!important}.toolbar>*{width:100%!important;min-width:0!important}.toolbar-search{grid-column:1/-1!important}.toolbar a{display:none!important}
        .display-settings-overlay{align-items:flex-end;padding:0}.display-settings-sheet{width:100%;max-height:88dvh;border:0;border-radius:24px 24px 0 0;box-shadow:0 -20px 60px rgba(8,31,52,.25)}.settings-handle{display:block;width:42px;height:4px;margin:9px auto 0;border-radius:999px;background:#c8d4df}
        .display-settings-head{padding:14px 16px 12px}.display-settings-head h3{font-size:20px}.display-settings-head p{font-size:11px}.settings-section{padding:14px 16px}.column-choice-grid{grid-template-columns:1fr;gap:8px}.column-choice{min-height:58px!important}.preset-row{flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px}.preset-row button{flex:0 0 auto}.display-settings-footer{padding:12px 16px max(14px,env(safe-area-inset-bottom))}
      }
    `}</style>
  </>
}
import {list,put} from '@vercel/blob';
import seed from '@/data/seed.json';

const PATH='catalog/catalog.json';

function allRows(catalog){
  return (catalog?.sections||[]).flatMap(s=>s.rows||[]);
}

function migrateCatalog(current){
  if(!current) return seed;
  if(current.catalogVersion===seed.catalogVersion) return current;

  const oldRows=new Map(allRows(current).map(r=>[r.id,r]));
  const next=JSON.parse(JSON.stringify(seed));

  // Keep user-managed company details and uploaded logo when they are valid.
  next.company={...next.company,...(current.company||{})};
  if(!next.company.logo || next.company.logo==='/logo.jpg'){
    next.company.logo=seed.company.logo;
  }

  // Keep the default FX rate the admin may have maintained.
  if(current.rate!==undefined && current.rate!=='') next.rate=current.rate;
  if(current.rateLabel1) next.rateLabel1=current.rateLabel1;

  // Preserve uploaded product photos, datasheets and hidden legacy records by stable product ID.
  for(const section of next.sections||[]){
    for(const row of section.rows||[]){
      const old=oldRows.get(row.id);
      if(!old) continue;
      if(old.image && !String(old.image).startsWith('/products/nov1101/')) row.image=old.image;
      if(Array.isArray(old.datasheets) && old.datasheets.length) row.datasheets=old.datasheets;
      if(old.legacy===true || row.legacy===true) row.visible=false;
    }
  }

  return next;
}

async function readStoredCatalog(){
  const r=await list({prefix:PATH,limit:10});
  const h=r.blobs?.find(x=>x.pathname===PATH);
  if(!h) return null;
  const q=await fetch(h.url,{cache:'no-store'});
  return q.ok?await q.json():null;
}

export async function getCatalog(){
  try{
    const current=await readStoredCatalog();
    if(!current) return seed;
    const migrated=migrateCatalog(current);
    if(current.catalogVersion!==migrated.catalogVersion){
      await put(PATH,JSON.stringify(migrated),{
        access:'public',
        addRandomSuffix:false,
        allowOverwrite:true,
        contentType:'application/json'
      });
    }
    return migrated;
  }catch(e){
    console.error(e);
    return seed;
  }
}

export async function saveCatalog(d){
  const c=JSON.parse(JSON.stringify(d));
  await put(PATH,JSON.stringify(c),{
    access:'public',
    addRandomSuffix:false,
    allowOverwrite:true,
    contentType:'application/json'
  });
  return c;
}
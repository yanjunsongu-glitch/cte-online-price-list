import seed from '@/data/seed.json';
import {readSharedText,writeSharedText} from '@/lib/dataStore';

const PATH='catalog/catalog.json';

function allRows(catalog){
  return (catalog?.sections||[]).flatMap(s=>s.rows||[]);
}

function applyStaticProductImages(catalog){
  const out=JSON.parse(JSON.stringify(catalog||seed));
  const staticImages=new Map(
    allRows(seed)
      .filter(row=>String(row.image||'').startsWith('/products/nov1101/'))
      .map(row=>[row.id,row.image])
  );
  for(const row of allRows(out)){
    const local=staticImages.get(row.id);
    const current=String(row.image||'');
    const staleBlob=/\.public\.blob\.vercel-storage\.com|blob\.vercel-storage\.com/i.test(current);
    if(local&&(!current||staleBlob))row.image=local;
  }
  return out;
}

function migrateCatalog(current){
  if(!current)return applyStaticProductImages(seed);
  if(current.catalogVersion===seed.catalogVersion)return applyStaticProductImages(current);

  const oldRows=new Map(allRows(current).map(r=>[r.id,r]));
  const next=JSON.parse(JSON.stringify(seed));

  next.company={...next.company,...(current.company||{})};
  if(!next.company.logo||next.company.logo==='/logo.jpg')next.company.logo=seed.company.logo;
  if(current.rate!==undefined&&current.rate!=='')next.rate=current.rate;
  if(current.rateLabel1)next.rateLabel1=current.rateLabel1;

  for(const section of next.sections||[]){
    for(const row of section.rows||[]){
      const old=oldRows.get(row.id);
      if(!old)continue;
      if(old.image&&!String(old.image).startsWith('/products/nov1101/'))row.image=old.image;
      if(Array.isArray(old.datasheets)&&old.datasheets.length)row.datasheets=old.datasheets;
      if(old.legacy===true||row.legacy===true)row.visible=false;
    }
  }
  return applyStaticProductImages(next);
}

async function readStoredCatalog(){
  const raw=await readSharedText(PATH,{migrate:true,contentType:'application/json'});
  return raw?JSON.parse(raw):null;
}

async function writeStoredCatalog(catalog){
  return writeSharedText(PATH,JSON.stringify(catalog),{contentType:'application/json'});
}

export async function getCatalog(){
  try{
    const current=await readStoredCatalog();
    if(!current)return applyStaticProductImages(seed);
    const migrated=migrateCatalog(current);
    if(current.catalogVersion!==migrated.catalogVersion)await writeStoredCatalog(migrated);
    return applyStaticProductImages(migrated);
  }catch(e){
    console.error(e);
    return applyStaticProductImages(seed);
  }
}

export async function saveCatalog(d,username=''){
  const c=applyStaticProductImages(d);
  c.updatedAt=new Date().toISOString();
  if(username)c.updatedBy=username;
  await writeStoredCatalog(c);
  return c;
}

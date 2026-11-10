import {list,put} from '@vercel/blob';
import {isNeonConfigured,listNeonEntries,readNeonText,writeNeonText} from '@/lib/neonStore';

async function readBlobText(key){
  const r=await list({prefix:key,limit:10});
  const b=r.blobs?.find(x=>x.pathname===key);
  if(!b)return null;
  const res=await fetch(b.url,{cache:'no-store'});
  if(!res.ok)throw new Error('Legacy Blob read failed for '+key);
  return res.text();
}

export async function readSharedText(key,{migrate=true,contentType='text/plain'}={}){
  if(isNeonConfigured()){
    const existing=await readNeonText(key);
    if(existing!==null)return existing;
    if(migrate){
      try{
        const legacy=await readBlobText(key);
        if(legacy!==null){
          await writeNeonText(key,legacy,{contentType});
          return legacy;
        }
      }catch(e){
        console.warn('Legacy Blob read deferred for '+key,e?.message||e);
      }
    }
    return null;
  }
  return readBlobText(key);
}

export async function writeSharedText(key,value,{contentType='text/plain'}={}){
  if(isNeonConfigured()){
    await writeNeonText(key,String(value),{contentType});
    return 'neon';
  }
  await put(key,String(value),{
    access:'public',addRandomSuffix:false,allowOverwrite:true,contentType
  });
  return 'vercel-blob';
}

export async function listSharedText(prefix,{limit=100,migrateLegacy=true,contentType='text/plain'}={}){
  const safeLimit=Math.min(Math.max(Number(limit)||100,1),500);
  if(isNeonConfigured()){
    let rows=await listNeonEntries(prefix,safeLimit);
    if(migrateLegacy&&rows.length===0){
      try{
        const legacy=await list({prefix,limit:safeLimit});
        for(const b of legacy.blobs||[]){
          try{
            const res=await fetch(b.url,{cache:'no-store'});
            if(!res.ok)continue;
            const value=await res.text();
            await writeNeonText(b.pathname,value,{contentType});
          }catch{}
        }
        rows=await listNeonEntries(prefix,safeLimit);
      }catch(e){
        console.warn('Legacy Blob prefix migration deferred for '+prefix,e?.message||e);
      }
    }
    return rows.map(x=>({
      key:x.key,value:x.value,contentType:x.content_type||contentType,updatedAt:x.updated_at
    }));
  }
  const r=await list({prefix,limit:safeLimit});
  const out=[];
  for(const b of r.blobs||[]){
    try{
      const res=await fetch(b.url,{cache:'no-store'});
      if(res.ok)out.push({key:b.pathname,value:await res.text(),contentType,updatedAt:b.uploadedAt});
    }catch{}
  }
  return out;
}

const DEFAULT_ASSET_BUCKET='cte-assets';
const DEFAULT_DATA_BUCKET='cte-data';
const MAX_FILE_SIZE=15*1024*1024;

function config(){
  const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';
  return {url,key};
}

export function isSupabaseConfigured(){
  const {url,key}=config();
  return Boolean(url&&key);
}

export function assetBucket(){
  return process.env.SUPABASE_ASSET_BUCKET||DEFAULT_ASSET_BUCKET;
}

export function dataBucket(){
  return process.env.SUPABASE_DATA_BUCKET||DEFAULT_DATA_BUCKET;
}

function apiHeaders(extra={}){
  const {key}=config();
  const headers={apikey:key,...extra};
  // Legacy service_role keys are JWTs; new sb_secret_* keys must not be used as Bearer tokens.
  if(key&&key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
  return headers;
}

function storageUrl(path){
  const {url}=config();
  return url+'/storage/v1/'+path.replace(/^\/+/, '');
}

function encodeObjectPath(path){
  return String(path||'').split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

async function ensureBucket(name,{publicBucket=false,allowedMimeTypes=null}={}){
  if(!isSupabaseConfigured())throw new Error('Supabase is not configured.');
  const get=await fetch(storageUrl('bucket/'+encodeURIComponent(name)),{
    headers:apiHeaders(),
    cache:'no-store'
  });
  if(get.ok)return true;
  if(get.status!==404){
    throw new Error('Supabase bucket check failed: '+get.status+' '+await get.text());
  }
  const create=await fetch(storageUrl('bucket'),{
    method:'POST',
    headers:apiHeaders({'content-type':'application/json'}),
    body:JSON.stringify({
      id:name,
      name,
      public:publicBucket,
      file_size_limit:MAX_FILE_SIZE,
      allowed_mime_types:allowedMimeTypes
    })
  });
  if(!create.ok&&create.status!==409){
    throw new Error('Supabase bucket create failed: '+create.status+' '+await create.text());
  }
  return true;
}

export async function uploadSharedAsset({path,body,contentType='application/octet-stream'}){
  const bucket=assetBucket();
  await ensureBucket(bucket,{
    publicBucket:true,
    allowedMimeTypes:['image/*','application/pdf']
  });
  const objectPath=encodeObjectPath(path);
  const res=await fetch(storageUrl('object/'+encodeURIComponent(bucket)+'/'+objectPath),{
    method:'POST',
    headers:apiHeaders({
      'content-type':contentType,
      'x-upsert':'true',
      'cache-control':'3600'
    }),
    body
  });
  if(!res.ok)throw new Error('Supabase upload failed: '+res.status+' '+await res.text());
  return publicAssetUrl(path);
}

export function publicAssetUrl(path){
  const {url}=config();
  return url+'/storage/v1/object/public/'+encodeURIComponent(assetBucket())+'/'+encodeObjectPath(path);
}

export async function readSharedJson(path){
  if(!isSupabaseConfigured())return null;
  const bucket=dataBucket();
  await ensureBucket(bucket,{publicBucket:false,allowedMimeTypes:['application/json']});
  const res=await fetch(storageUrl('object/'+encodeURIComponent(bucket)+'/'+encodeObjectPath(path)),{
    headers:apiHeaders(),
    cache:'no-store'
  });
  if(res.status===404)return null;
  if(!res.ok)throw new Error('Supabase data read failed: '+res.status+' '+await res.text());
  return res.json();
}

export async function writeSharedJson(path,value){
  const bucket=dataBucket();
  await ensureBucket(bucket,{publicBucket:false,allowedMimeTypes:['application/json']});
  const res=await fetch(storageUrl('object/'+encodeURIComponent(bucket)+'/'+encodeObjectPath(path)),{
    method:'POST',
    headers:apiHeaders({
      'content-type':'application/json',
      'x-upsert':'true',
      'cache-control':'0'
    }),
    body:JSON.stringify(value)
  });
  if(!res.ok)throw new Error('Supabase data write failed: '+res.status+' '+await res.text());
  return true;
}

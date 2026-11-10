import crypto from 'crypto';
import {listSharedText,writeSharedText} from '@/lib/dataStore';

const PREFIX='system/activity/';

function secrets(){
  return [...new Set([process.env.CTE_SYSTEM_DATA_SECRET,process.env.CTE_AUTH_SECRET,'change-me-system-data'].filter(Boolean))];
}
function key(secret){return crypto.createHash('sha256').update(secret).digest()}
function encrypt(obj){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key(secrets()[0]),iv);
  const body=Buffer.concat([cipher.update(JSON.stringify(obj),'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return ['v1',iv.toString('base64url'),tag.toString('base64url'),body.toString('base64url')].join('.');
}
function decryptWithSecret(txt,secret){
  const [v,ivB,tagB,bodyB]=String(txt||'').split('.');
  if(v!=='v1')throw new Error('Unsupported activity format');
  const decipher=crypto.createDecipheriv('aes-256-gcm',key(secret),Buffer.from(ivB,'base64url'));
  decipher.setAuthTag(Buffer.from(tagB,'base64url'));
  const out=Buffer.concat([decipher.update(Buffer.from(bodyB,'base64url')),decipher.final()]);
  return JSON.parse(out.toString('utf8'));
}
function decrypt(txt){
  let lastError=null;
  for(const secret of secrets()){
    try{return decryptWithSecret(txt,secret)}catch(e){lastError=e}
  }
  throw lastError||new Error('Unsupported activity format');
}
function safe(value){
  if(value===undefined)return null;
  const clone=JSON.parse(JSON.stringify(value));
  const strip=obj=>{
    if(!obj||typeof obj!=='object')return;
    for(const k of Object.keys(obj)){
      if(/password|secret|token|cookie/i.test(k)){delete obj[k];continue}
      strip(obj[k]);
    }
  };
  strip(clone);
  return clone;
}
export async function writeActivity(entry){
  const now=new Date().toISOString();
  const id=crypto.randomUUID();
  const record={
    id,createdAt:now,
    actor:String(entry.actor||'system'),
    module:String(entry.module||'system'),
    action:String(entry.action||'update'),
    objectType:String(entry.objectType||''),
    objectId:String(entry.objectId||''),
    before:safe(entry.before),
    after:safe(entry.after),
    meta:safe(entry.meta)
  };
  try{
    await writeSharedText(PREFIX+now.slice(0,10)+'/'+id+'.enc',encrypt(record),{contentType:'text/plain'});
  }catch(e){
    return {...record,storageSkipped:true};
  }
  return record;
}
export async function listActivity(limit=100){
  try{
    const rows=await listSharedText(PREFIX,{limit:Math.min(Math.max(limit,1),100),migrateLegacy:true,contentType:'text/plain'});
    const docs=rows.map(x=>{try{return decrypt(x.value)}catch{return null}});
    return docs.filter(Boolean).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,limit);
  }catch{return []}
}

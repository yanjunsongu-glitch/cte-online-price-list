import crypto from 'crypto';
import {listSharedText,readSharedText,writeSharedText} from '@/lib/dataStore';

const PREFIX='shares/customer/';

function secrets(){
  return [...new Set([process.env.CTE_SHARE_DATA_SECRET,process.env.CTE_AUTH_SECRET,'change-me-share-data'].filter(Boolean))];
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
  if(v!=='v1')throw new Error('Unsupported share data');
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
  throw lastError||new Error('Unsupported share data');
}
function safeToken(v){
  return /^[A-Za-z0-9_-]{20,80}$/.test(String(v||''))?String(v):null;
}
function expiresAt(days){
  if(!days||days==='never') return null;
  const n=Number(days);
  if(!Number.isFinite(n)||n<=0)return null;
  return new Date(Date.now()+n*86400000).toISOString();
}
export async function createShare(snapshot,{expiryDays='7',createdBy='staff',customerName=''}={}){
  const token=crypto.randomBytes(24).toString('base64url');
  const record={
    token,
    active:true,
    customerName:String(customerName||''),
    createdBy:String(createdBy||'staff'),
    createdAt:new Date().toISOString(),
    expiresAt:expiresAt(expiryDays),
    snapshot
  };
  await writeSharedText(PREFIX+token+'.enc',encrypt(record),{contentType:'text/plain'});
  return record;
}
async function readRecord(key){
  const raw=await readSharedText(key,{migrate:true,contentType:'text/plain'});
  return raw?decrypt(raw):null;
}
export async function getShare(token){
  const t=safeToken(token);
  if(!t)return null;
  return readRecord(PREFIX+t+'.enc');
}
export function shareStatus(record){
  if(!record)return 'missing';
  if(record.active===false)return 'disabled';
  if(record.expiresAt && Date.now()>new Date(record.expiresAt).getTime())return 'expired';
  return 'active';
}
export async function listShares(limit=100){
  const rows=await listSharedText(PREFIX,{limit:Math.min(Math.max(limit,1),100),migrateLegacy:true,contentType:'text/plain'});
  const docs=rows.map(x=>{try{return decrypt(x.value)}catch{return null}});
  return docs.filter(Boolean).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).map(x=>({
    token:x.token,
    active:x.active!==false,
    customerName:x.customerName||'',
    createdBy:x.createdBy||'',
    createdAt:x.createdAt,
    expiresAt:x.expiresAt,
    status:shareStatus(x),
    title:x.snapshot?.title||'Customer Price List',
    productCount:(x.snapshot?.sections||[]).reduce((n,s)=>n+(s.rows?.length||0),0),
    columnCount:(x.snapshot?.selectedColumnKeys||[]).length,
    currencyDisplay:x.snapshot?.currencyDisplay||'cny'
  }));
}
export async function setShareActive(token,active){
  const record=await getShare(token);
  if(!record)return null;
  record.active=Boolean(active);
  record.updatedAt=new Date().toISOString();
  await writeSharedText(PREFIX+record.token+'.enc',encrypt(record),{contentType:'text/plain'});
  return record;
}

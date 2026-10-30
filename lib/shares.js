import crypto from 'crypto';
import {list,put} from '@vercel/blob';

const PREFIX='shares/customer/';

function secret(){
  return process.env.CTE_SHARE_DATA_SECRET || process.env.CTE_AUTH_SECRET || 'change-me-share-data';
}
function key(){return crypto.createHash('sha256').update(secret()).digest()}
function encrypt(obj){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const body=Buffer.concat([cipher.update(JSON.stringify(obj),'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return ['v1',iv.toString('base64url'),tag.toString('base64url'),body.toString('base64url')].join('.');
}
function decrypt(txt){
  const [v,ivB,tagB,bodyB]=String(txt||'').split('.');
  if(v!=='v1') throw new Error('Unsupported share data');
  const decipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(ivB,'base64url'));
  decipher.setAuthTag(Buffer.from(tagB,'base64url'));
  const out=Buffer.concat([decipher.update(Buffer.from(bodyB,'base64url')),decipher.final()]);
  return JSON.parse(out.toString('utf8'));
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
  await put(PREFIX+token+'.enc',encrypt(record),{
    access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'text/plain'
  });
  return record;
}
async function readBlob(blob){
  const r=await fetch(blob.url,{cache:'no-store'});
  if(!r.ok) throw new Error('Share read failed');
  return decrypt(await r.text());
}
export async function getShare(token){
  const t=safeToken(token);
  if(!t)return null;
  const r=await list({prefix:PREFIX+t+'.enc',limit:10});
  const b=r.blobs?.find(x=>x.pathname===PREFIX+t+'.enc');
  return b?readBlob(b):null;
}
export function shareStatus(record){
  if(!record)return 'missing';
  if(record.active===false)return 'disabled';
  if(record.expiresAt && Date.now()>new Date(record.expiresAt).getTime())return 'expired';
  return 'active';
}
export async function listShares(limit=100){
  const r=await list({prefix:PREFIX,limit:Math.min(Math.max(limit,1),100)});
  const docs=await Promise.all((r.blobs||[]).map(async b=>{try{return await readBlob(b)}catch{return null}}));
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
  await put(PREFIX+record.token+'.enc',encrypt(record),{
    access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'text/plain'
  });
  return record;
}

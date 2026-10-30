import crypto from 'crypto';
import {list,put} from '@vercel/blob';

const PREFIX='quotation/records/';

function secret(){
  return process.env.CTE_QUOTATION_DATA_SECRET || process.env.CTE_AUTH_SECRET || 'change-me-quotation-data';
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
  if(v!=='v1')throw new Error('Unsupported quotation data format');
  const decipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(ivB,'base64url'));
  decipher.setAuthTag(Buffer.from(tagB,'base64url'));
  const out=Buffer.concat([decipher.update(Buffer.from(bodyB,'base64url')),decipher.final()]);
  return JSON.parse(out.toString('utf8'));
}
function n(v){const x=Number(v);return Number.isFinite(x)?x:0}
function r2(v){return Math.round((n(v)+Number.EPSILON)*100)/100}
function codeDate(d=new Date()){
  const p=x=>String(x).padStart(2,'0');
  return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate());
}
export function normalizeQuotation(input,username){
  const now=new Date();
  const id=input.id||crypto.randomUUID();
  const items=(input.items||[]).map((x,i)=>{
    const qty=Math.max(0,n(x.qty));
    const unitPrice=Math.max(0,n(x.unitPrice));
    const discountPct=Math.max(0,Math.min(100,n(x.discountPct)));
    const gross=r2(qty*unitPrice);
    const total=r2(gross-gross*discountPct/100);
    return {
      id:x.id||crypto.randomUUID(),
      productId:String(x.productId||''),
      description:String(x.description||x.productName||('Item '+(i+1))),
      brand:String(x.brand||'CTE'),
      unit:String(x.unit||'Pcs'),
      qty,
      priceSource:String(x.priceSource||'Custom'),
      unitPrice,
      discountPct,
      total,
      remark:String(x.remark||''),
      warranty:String(x.warranty||''),
      image:String(x.image||''),
      datasheets:Array.isArray(x.datasheets)?x.datasheets:[]
    };
  }).filter(x=>x.description&&x.qty>0);
  const subtotal=r2(items.reduce((s,x)=>s+x.total,0));
  return {
    id,
    quotationNo:input.quotationNo||('CTE-QT-'+codeDate(now)+'-'+id.slice(0,6).toUpperCase()),
    quotationDate:input.quotationDate||now.toISOString().slice(0,10),
    validUntil:String(input.validUntil||''),
    systemName:String(input.systemName||'Solar Hybrid Installation System'),
    coverTitle:String(input.coverTitle||'Battery & Inverter Prices List BOQ'),
    customerCompany:String(input.customerCompany||''),
    contactPerson:String(input.contactPerson||''),
    customerAddress:String(input.customerAddress||''),
    customerPhone:String(input.customerPhone||''),
    currency:input.currency==='MMK'?'MMK':'RMB',
    exchangeRate:Math.max(0,n(input.exchangeRate)),
    salesperson:String(input.salesperson||''),
    paymentTerms:String(input.paymentTerms||''),
    deliveryTime:String(input.deliveryTime||''),
    status:['Draft','Sent','Accepted','Rejected','Expired'].includes(input.status)?input.status:'Draft',
    includeCover:input.includeCover!==false,
    includeDatasheets:input.includeDatasheets!==false,
    notes:String(input.notes||''),
    items,
    subtotal,
    createdBy:input.createdBy||username||'quotation',
    createdAt:input.createdAt||now.toISOString(),
    updatedAt:now.toISOString()
  };
}
export async function saveQuotation(input,username){
  const q=normalizeQuotation(input,username);
  await put(PREFIX+q.id+'.enc',encrypt(q),{
    access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'text/plain'
  });
  return q;
}
async function readBlob(blob){
  const r=await fetch(blob.url,{cache:'no-store'});
  if(!r.ok)throw new Error('Quotation read failed');
  return decrypt(await r.text());
}
export async function getQuotation(id){
  const r=await list({prefix:PREFIX+id+'.enc',limit:10});
  const b=r.blobs?.find(x=>x.pathname===PREFIX+id+'.enc');
  return b?readBlob(b):null;
}
export async function listQuotations(limit=100){
  const r=await list({prefix:PREFIX,limit:Math.min(Math.max(limit,1),100)});
  const docs=await Promise.all((r.blobs||[]).map(async b=>{try{return await readBlob(b)}catch{return null}}));
  return docs.filter(Boolean).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).map(x=>({
    id:x.id,quotationNo:x.quotationNo,quotationDate:x.quotationDate,customerCompany:x.customerCompany,
    contactPerson:x.contactPerson,systemName:x.systemName,currency:x.currency,subtotal:x.subtotal,status:x.status,
    createdBy:x.createdBy,updatedAt:x.updatedAt
  }));
}

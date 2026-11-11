import crypto from 'crypto';
import {listSharedText,readSharedText,writeSharedText} from '@/lib/dataStore';

const PREFIX='quotation/records/';

function secrets(){
  return [...new Set([
    process.env.CTE_QUOTATION_DATA_SECRET,
    process.env.CTE_AUTH_SECRET,
    'change-me-quotation-data'
  ].filter(Boolean))];
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
  if(v!=='v1')throw new Error('Unsupported quotation data format');
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
  throw lastError||new Error('Unsupported quotation data format');
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
    const gross=r2(qty*unitPrice);
    const legacyPct=Math.max(0,Math.min(100,n(x.discountPct)));
    const requestedDiscount=x.discountAmount!==undefined&&x.discountAmount!==null&&x.discountAmount!==''
      ? Math.max(0,n(x.discountAmount))
      : r2(gross*legacyPct/100);
    const discountAmount=r2(Math.min(gross,requestedDiscount));
    const total=r2(Math.max(0,gross-discountAmount));
    return {
      id:x.id||crypto.randomUUID(),
      productId:String(x.productId||''),
      description:String(x.description||x.productName||('Item '+(i+1))),
      brand:String(x.brand||'CTE'),
      unit:String(x.unit||'Pcs'),
      qty,
      priceSource:String(x.priceSource||'Custom'),
      unitPrice,
      discountAmount,
      discountPct:0,
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
  await writeSharedText(PREFIX+q.id+'.enc',encrypt(q),{contentType:'text/plain'});
  return q;
}
async function readRecord(key){
  const raw=await readSharedText(key,{migrate:true,contentType:'text/plain'});
  return raw?decrypt(raw):null;
}
export async function getQuotation(id){
  return readRecord(PREFIX+id+'.enc');
}
export async function listQuotations(limit=100){
  const rows=await listSharedText(PREFIX,{limit:Math.min(Math.max(limit,1),100),migrateLegacy:true,contentType:'text/plain'});
  const docs=rows.map(x=>{try{return decrypt(x.value)}catch{return null}});
  return docs.filter(Boolean).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).map(x=>({
    id:x.id,quotationNo:x.quotationNo,quotationDate:x.quotationDate,customerCompany:x.customerCompany,
    contactPerson:x.contactPerson,systemName:x.systemName,currency:x.currency,subtotal:x.subtotal,status:x.status,
    createdBy:x.createdBy,updatedAt:x.updatedAt
  }));
}

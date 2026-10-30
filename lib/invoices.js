import crypto from 'crypto';
import {list,put} from '@vercel/blob';

const PREFIX='finance/invoices/';

function secret(){
  return process.env.CTE_FINANCE_DATA_SECRET || process.env.CTE_AUTH_SECRET || 'change-me-finance-data';
}

function key(){
  return crypto.createHash('sha256').update(secret()).digest();
}

function encrypt(obj){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const body=Buffer.concat([cipher.update(JSON.stringify(obj),'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return ['v1',iv.toString('base64url'),tag.toString('base64url'),body.toString('base64url')].join('.');
}

function decrypt(txt){
  const [v,ivB,tagB,bodyB]=String(txt||'').split('.');
  if(v!=='v1') throw new Error('Unsupported invoice data format');
  const decipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(ivB,'base64url'));
  decipher.setAuthTag(Buffer.from(tagB,'base64url'));
  const out=Buffer.concat([decipher.update(Buffer.from(bodyB,'base64url')),decipher.final()]);
  return JSON.parse(out.toString('utf8'));
}

function num(v){
  const n=Number(v);
  return Number.isFinite(n)?n:0;
}

function round2(v){
  return Math.round((num(v)+Number.EPSILON)*100)/100;
}

function dateCode(d=new Date()){
  const p=n=>String(n).padStart(2,'0');
  return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate());
}

export function normalizeInvoice(input,username){
  const now=new Date();
  const id=input.id||crypto.randomUUID();
  const items=(input.items||[]).map((x,i)=>{
    const qty=Math.max(0,num(x.qty)||0);
    const unitPrice=Math.max(0,num(x.unitPrice)||0);
    const discountPct=Math.max(0,Math.min(100,num(x.discountPct)||0));
    const gross=round2(qty*unitPrice);
    const discountAmount=round2(gross*discountPct/100);
    const total=round2(gross-discountAmount);
    return {
      id:x.id||crypto.randomUUID(),
      productId:String(x.productId||''),
      productName:String(x.productName||'Item '+(i+1)),
      priceSource:String(x.priceSource||'Custom'),
      qty,
      unitPrice,
      discountPct,
      gross,
      discountAmount,
      total
    };
  }).filter(x=>x.qty>0 && x.productName);

  const subtotal=round2(items.reduce((s,x)=>s+x.total,0));
  const taxPct=Math.max(0,num(input.taxPct)||0);
  const taxAmount=round2(subtotal*taxPct/100);
  const grandTotal=round2(subtotal+taxAmount);

  return {
    id,
    invoiceNo:input.invoiceNo||('CTE-INV-'+dateCode(now)+'-'+id.slice(0,6).toUpperCase()),
    invoiceDate:input.invoiceDate||now.toISOString().slice(0,10),
    dueDate:input.dueDate||'',
    customerName:String(input.customerName||''),
    customerAddress:String(input.customerAddress||''),
    customerPhone:String(input.customerPhone||''),
    customerTaxId:String(input.customerTaxId||''),
    poNo:String(input.poNo||''),
    salesperson:String(input.salesperson||''),
    currency:input.currency==='MMK'?'MMK':'CNY',
    exchangeRate:Math.max(0,num(input.exchangeRate)||0),
    paymentStatus:['Unpaid','Partial','Paid'].includes(input.paymentStatus)?input.paymentStatus:'Unpaid',
    paymentMethod:String(input.paymentMethod||''),
    taxPct,
    items,
    subtotal,
    taxAmount,
    grandTotal,
    notes:String(input.notes||''),
    createdBy:input.createdBy||username||'finance',
    createdAt:input.createdAt||now.toISOString(),
    updatedAt:now.toISOString()
  };
}

export async function saveInvoice(input,username){
  const invoice=normalizeInvoice(input,username);
  await put(PREFIX+invoice.id+'.enc',encrypt(invoice),{
    access:'public',
    addRandomSuffix:false,
    allowOverwrite:true,
    contentType:'text/plain'
  });
  return invoice;
}

async function readBlob(blob){
  const r=await fetch(blob.url,{cache:'no-store'});
  if(!r.ok) throw new Error('Invoice read failed');
  return decrypt(await r.text());
}

export async function getInvoice(id){
  const r=await list({prefix:PREFIX+id+'.enc',limit:10});
  const blob=r.blobs?.find(x=>x.pathname===PREFIX+id+'.enc');
  if(!blob)return null;
  return readBlob(blob);
}

export async function listInvoices(limit=100){
  const r=await list({prefix:PREFIX,limit:Math.min(Math.max(limit,1),100)});
  const docs=await Promise.all((r.blobs||[]).map(async b=>{
    try{return await readBlob(b)}catch{return null}
  }));
  return docs.filter(Boolean).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).map(x=>({
    id:x.id,
    invoiceNo:x.invoiceNo,
    invoiceDate:x.invoiceDate,
    customerName:x.customerName,
    currency:x.currency,
    grandTotal:x.grandTotal,
    paymentStatus:x.paymentStatus,
    createdBy:x.createdBy,
    createdAt:x.createdAt
  }));
}

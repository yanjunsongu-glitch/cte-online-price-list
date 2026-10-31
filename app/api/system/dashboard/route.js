import {NextResponse} from 'next/server';
import {getCatalog} from '@/lib/catalog';
import {sessionFromRequest} from '@/lib/auth';
import {quotationSessionFromRequest} from '@/lib/quotationAuth';
import {financeSessionFromRequest} from '@/lib/financeAuth';
import {listQuotations} from '@/lib/quotations';
import {listInvoices} from '@/lib/invoices';

function summarizeQuotations(items=[]){
  const counts={Draft:0,Sent:0,Accepted:0,Rejected:0,Expired:0};
  for(const x of items) if(counts[x.status]!==undefined) counts[x.status]++;
  return {
    counts,
    recent:items.slice(0,3).map(x=>({
      id:x.id,quotationNo:x.quotationNo,customer:x.customerCompany||x.contactPerson||'No customer',
      status:x.status,currency:x.currency,subtotal:x.subtotal,updatedAt:x.updatedAt
    }))
  };
}
function summarizeInvoices(items=[]){
  const counts={Unpaid:0,Partial:0,Paid:0};
  let outstanding=0;
  const byCurrency={CNY:0,MMK:0};
  for(const x of items){
    if(counts[x.paymentStatus]!==undefined) counts[x.paymentStatus]++;
    if(x.paymentStatus!=='Paid'){
      outstanding+=Number(x.grandTotal||0);
      const cur=x.currency==='MMK'?'MMK':'CNY';
      byCurrency[cur]+=Number(x.grandTotal||0);
    }
  }
  return {
    counts,outstanding,byCurrency,
    recent:items.slice(0,3).map(x=>({
      id:x.id,invoiceNo:x.invoiceNo,customer:x.customerName||'No customer',
      paymentStatus:x.paymentStatus,currency:x.currency,grandTotal:x.grandTotal,createdAt:x.createdAt
    }))
  };
}

export async function GET(req){
  const admin=sessionFromRequest(req);
  const quotation=quotationSessionFromRequest(req);
  const finance=financeSessionFromRequest(req);

  const catalog=await getCatalog();
  const role=admin?'Super Admin':finance?'Finance':quotation?'Sales':'Guest';
  const username=admin?.username||finance?.username||quotation?.username||'';

  let quotationSummary=null;
  let financeSummary=null;

  if(admin||quotation){
    try{quotationSummary=summarizeQuotations(await listQuotations(100))}catch{}
  }
  if(admin||finance){
    try{financeSummary=summarizeInvoices(await listInvoices(100))}catch{}
  }

  const activeRows=(catalog.sections||[]).flatMap(s=>(s.rows||[]).filter(r=>r.visible!==false));
  const featured=activeRows.slice(0,3).map(r=>({
    id:r.id,name:r.spec,retail:r.retail??'',installer:r.installer??'',wholesale:r.wholesale??''
  }));

  return NextResponse.json({
    role,username,
    permissions:{
      admin:Boolean(admin),
      quotation:Boolean(admin||quotation),
      finance:Boolean(admin||finance),
      warehouse:false
    },
    catalog:{
      title:catalog.title||'CTE Price List',
      validity:catalog.validity||'',
      rate:catalog.rate||'',
      rateLabel1:catalog.rateLabel1||'CNY / MMK',
      updatedAt:catalog.updatedAt||'',
      updatedBy:catalog.updatedBy||'',
      activeProductCount:activeRows.length,
      featured
    },
    quotations:quotationSummary,
    finance:financeSummary,
    generatedAt:new Date().toISOString()
  },{headers:{'Cache-Control':'no-store'}});
}

import {NextResponse} from 'next/server';
import {getCatalog} from '@/lib/catalog';
import {hasPermission,systemSessionFromRequest} from '@/lib/systemAuth';
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
  const byCurrency={CNY:0,MMK:0};
  for(const x of items){
    if(counts[x.paymentStatus]!==undefined) counts[x.paymentStatus]++;
    if(x.paymentStatus!=='Paid'){
      const cur=x.currency==='MMK'?'MMK':'CNY';
      byCurrency[cur]+=Number(x.grandTotal||0);
    }
  }
  return {
    counts,byCurrency,
    recent:items.slice(0,3).map(x=>({
      id:x.id,invoiceNo:x.invoiceNo,customer:x.customerName||'No customer',
      paymentStatus:x.paymentStatus,currency:x.currency,grandTotal:x.grandTotal,createdAt:x.createdAt
    }))
  };
}
function roleLabel(session){
  if(session?.role==='super_admin')return 'Super Admin';
  if(session?.role==='admin')return 'Admin';
  if(session?.role==='staff')return 'Staff';
  return 'Staff';
}

export async function GET(req){
  const session=systemSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});

  const catalog=await getCatalog();
  const quotationAllowed=hasPermission(session,'quotation.view');
  const financeAllowed=hasPermission(session,'finance.view');
  const priceAdminAllowed=hasPermission(session,'price.edit');
  const userAdminAllowed=hasPermission(session,'users.view')||hasPermission(session,'users.manage');
  const warehouseAllowed=hasPermission(session,'warehouse.view');

  let quotationSummary=null;
  let financeSummary=null;
  if(quotationAllowed){
    try{quotationSummary=summarizeQuotations(await listQuotations(100))}catch{}
  }
  if(financeAllowed){
    try{financeSummary=summarizeInvoices(await listInvoices(100))}catch{}
  }

  const activeRows=(catalog.sections||[]).flatMap(s=>(s.rows||[]).filter(r=>r.visible!==false&&r.archived!==true));
  const featured=activeRows.slice(0,3).map(r=>({
    id:r.id,name:r.spec,retail:r.retail??'',installer:r.installer??'',wholesale:r.wholesale??''
  }));

  return NextResponse.json({
    role:roleLabel(session),
    username:session.username||'',
    fullName:session.fullName||session.username||'',
    department:session.department||'',
    permissions:{
      admin:priceAdminAllowed,
      users:userAdminAllowed,
      quotation:quotationAllowed,
      finance:financeAllowed,
      warehouse:warehouseAllowed,
      priceShare:hasPermission(session,'price.share')
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

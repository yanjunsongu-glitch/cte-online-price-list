import {NextResponse} from 'next/server';
import {getCatalog} from '@/lib/catalog';
import {sessionFromRequest} from '@/lib/auth';
import {quotationSessionFromRequest} from '@/lib/quotationAuth';
import {financeSessionFromRequest} from '@/lib/financeAuth';
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
  if(!session)return null;
  if(session.role==='super_admin')return 'Super Admin';
  if(session.role==='admin')return 'Admin';
  if(session.role==='staff')return 'Staff';
  return null;
}

export async function GET(req){
  const unified=systemSessionFromRequest(req);
  const legacyAdmin=!unified?sessionFromRequest(req):null;
  const quotation=!unified?quotationSessionFromRequest(req):null;
  const finance=!unified?financeSessionFromRequest(req):null;

  const catalog=await getCatalog();
  const role=roleLabel(unified)||(legacyAdmin?'Super Admin':finance?'Finance':quotation?'Sales':'Guest');
  const username=unified?.username||legacyAdmin?.username||finance?.username||quotation?.username||'';
  const fullName=unified?.fullName||username;
  const department=unified?.department||'';

  const quotationAllowed=unified?hasPermission(unified,'quotation.view'):Boolean(legacyAdmin||quotation);
  const financeAllowed=unified?hasPermission(unified,'finance.view'):Boolean(legacyAdmin||finance);
  const priceAdminAllowed=unified?hasPermission(unified,'price.edit'):Boolean(legacyAdmin);
  const userAdminAllowed=unified?hasPermission(unified,'users.view')||hasPermission(unified,'users.manage'):false;
  const warehouseAllowed=unified?hasPermission(unified,'warehouse.view'):false;

  let quotationSummary=null;
  let financeSummary=null;
  if(quotationAllowed){
    try{quotationSummary=summarizeQuotations(await listQuotations(100))}catch{}
  }
  if(financeAllowed){
    try{financeSummary=summarizeInvoices(await listInvoices(100))}catch{}
  }

  const activeRows=(catalog.sections||[]).flatMap(s=>(s.rows||[]).filter(r=>r.visible!==false));
  const featured=activeRows.slice(0,3).map(r=>({
    id:r.id,name:r.spec,retail:r.retail??'',installer:r.installer??'',wholesale:r.wholesale??''
  }));

  return NextResponse.json({
    role,username,fullName,department,
    permissions:{
      admin:priceAdminAllowed,
      users:userAdminAllowed,
      quotation:quotationAllowed,
      finance:financeAllowed,
      warehouse:warehouseAllowed,
      priceShare:unified?hasPermission(unified,'price.share'):Boolean(legacyAdmin||quotation)
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

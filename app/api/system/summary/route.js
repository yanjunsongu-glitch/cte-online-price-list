import {NextResponse} from 'next/server';
import {sessionFromRequest} from '@/lib/auth';
import {quotationSessionFromRequest} from '@/lib/quotationAuth';
import {financeSessionFromRequest} from '@/lib/financeAuth';
import {getCatalog} from '@/lib/catalog';
import {listQuotations} from '@/lib/quotations';
import {listInvoices} from '@/lib/invoices';

function recent(items,n=3){return (items||[]).slice(0,n)}
function countBy(items,key,value){return (items||[]).filter(x=>x?.[key]===value).length}

export async function GET(req){
  const admin=sessionFromRequest(req);
  const quotation=quotationSessionFromRequest(req);
  const finance=financeSessionFromRequest(req);

  const catalog=await getCatalog();
  const rows=(catalog?.sections||[]).flatMap(s=>s.rows||[]);
  const activeProducts=rows.filter(r=>r.visible!==false).length;

  let quotations=null;
  if(admin||quotation){
    const items=await listQuotations(100);
    quotations={
      total:items.length,
      draft:countBy(items,'status','Draft'),
      sent:countBy(items,'status','Sent'),
      accepted:countBy(items,'status','Accepted'),
      expired:countBy(items,'status','Expired'),
      recent:recent(items,3)
    };
  }

  let invoices=null;
  if(admin||finance){
    const items=await listInvoices(100);
    const unpaid=items.filter(x=>x.paymentStatus==='Unpaid');
    const partial=items.filter(x=>x.paymentStatus==='Partial');
    const outstanding=[...unpaid,...partial].reduce((s,x)=>s+Number(x.grandTotal||0),0);
    invoices={
      total:items.length,
      unpaid:unpaid.length,
      partial:partial.length,
      paid:countBy(items,'paymentStatus','Paid'),
      outstanding,
      recent:recent(items,3)
    };
  }

  let role='Guest';
  let username='';
  if(quotation){role='Sales';username=quotation.username||''}
  if(finance){role='Finance';username=finance.username||''}
  if(admin){role='Super Admin';username=admin.username||''}

  return NextResponse.json({
    user:{role,username,authenticated:Boolean(admin||quotation||finance)},
    permissions:{
      admin:Boolean(admin),
      quotation:Boolean(admin||quotation),
      finance:Boolean(admin||finance),
      warehouse:false
    },
    priceList:{
      title:catalog?.title||'CTE Price List',
      validity:catalog?.validity||'',
      rate:catalog?.rate||'',
      rateLabel:catalog?.rateLabel1||'CNY / MMK',
      updatedAt:catalog?.updatedAt||null,
      updatedBy:catalog?.updatedBy||'',
      activeProducts
    },
    quotations,
    invoices,
    warehouse:{status:'development'}
  },{headers:{'Cache-Control':'no-store'}});
}

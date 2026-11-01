import {NextResponse} from 'next/server';
import {financeSessionFromRequest} from '@/lib/financeAuth';
import {hasPermission} from '@/lib/systemAuth';
import {getInvoice,listInvoices,saveInvoice} from '@/lib/invoices';

function unified(s){return ['super_admin','admin','staff'].includes(s?.role)}
export async function GET(req){
  const session=await financeSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(unified(session)&&!hasPermission(session,'finance.view'))return NextResponse.json({error:'Forbidden'},{status:403});
  const id=new URL(req.url).searchParams.get('id');
  if(id){
    const invoice=await getInvoice(id);
    if(!invoice)return NextResponse.json({error:'Not found'},{status:404});
    return NextResponse.json(invoice);
  }
  return NextResponse.json({items:await listInvoices(100),user:session.username});
}
export async function POST(req){
  const session=await financeSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(unified(session)&&!(hasPermission(session,'finance.create')||hasPermission(session,'finance.edit')))return NextResponse.json({error:'Forbidden'},{status:403});
  const body=await req.json().catch(()=>null);
  if(!body)return NextResponse.json({error:'Invalid invoice'},{status:400});
  return NextResponse.json(await saveInvoice(body,session.username));
}

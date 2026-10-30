import {NextResponse} from 'next/server';
import {financeSessionFromRequest} from '@/lib/financeAuth';
import {getInvoice,listInvoices,saveInvoice} from '@/lib/invoices';

export async function GET(req){
  const session=financeSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  const id=new URL(req.url).searchParams.get('id');
  if(id){
    const invoice=await getInvoice(id);
    if(!invoice)return NextResponse.json({error:'Not found'},{status:404});
    return NextResponse.json(invoice);
  }
  return NextResponse.json({items:await listInvoices(100),user:session.username});
}

export async function POST(req){
  const session=financeSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body)return NextResponse.json({error:'Invalid invoice'},{status:400});
  return NextResponse.json(await saveInvoice(body,session.username));
}

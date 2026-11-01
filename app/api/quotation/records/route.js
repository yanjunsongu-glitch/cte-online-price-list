import {NextResponse} from 'next/server';
import {quotationSessionFromRequest} from '@/lib/quotationAuth';
import {hasPermission} from '@/lib/systemAuth';
import {getQuotation,listQuotations,saveQuotation} from '@/lib/quotations';

function unified(s){return ['super_admin','admin','staff'].includes(s?.role)}
export async function GET(req){
  const session=await quotationSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(unified(session)&&!hasPermission(session,'quotation.view'))return NextResponse.json({error:'Forbidden'},{status:403});
  const id=new URL(req.url).searchParams.get('id');
  if(id){
    const q=await getQuotation(id);
    if(!q)return NextResponse.json({error:'Not found'},{status:404});
    return NextResponse.json(q);
  }
  return NextResponse.json({items:await listQuotations(100),user:session.username});
}
export async function POST(req){
  const session=await quotationSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(unified(session)&&!(hasPermission(session,'quotation.create')||hasPermission(session,'quotation.edit')))return NextResponse.json({error:'Forbidden'},{status:403});
  const body=await req.json().catch(()=>null);
  if(!body)return NextResponse.json({error:'Invalid quotation'},{status:400});
  return NextResponse.json(await saveQuotation(body,session.username));
}

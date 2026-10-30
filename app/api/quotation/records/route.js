import {NextResponse} from 'next/server';
import {quotationSessionFromRequest} from '@/lib/quotationAuth';
import {getQuotation,listQuotations,saveQuotation} from '@/lib/quotations';

export async function GET(req){
  const session=quotationSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  const id=new URL(req.url).searchParams.get('id');
  if(id){
    const q=await getQuotation(id);
    if(!q)return NextResponse.json({error:'Not found'},{status:404});
    return NextResponse.json(q);
  }
  return NextResponse.json({items:await listQuotations(100),user:session.username});
}

export async function POST(req){
  const session=quotationSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body)return NextResponse.json({error:'Invalid quotation'},{status:400});
  return NextResponse.json(await saveQuotation(body,session.username));
}

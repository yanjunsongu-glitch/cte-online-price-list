import {NextResponse} from 'next/server';
import {sessionFromRequest} from '@/lib/auth';
import {createShare,listShares,setShareActive} from '@/lib/shares';

export async function GET(req){
  const session=sessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  return NextResponse.json({items:await listShares(100),user:session.username});
}

export async function POST(req){
  const session=sessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body?.snapshot)return NextResponse.json({error:'Invalid share snapshot'},{status:400});
  const record=await createShare(body.snapshot,{
    expiryDays:body.expiryDays||'7',
    createdBy:session.username,
    customerName:body.customerName||''
  });
  return NextResponse.json({
    token:record.token,
    expiresAt:record.expiresAt,
    customerName:record.customerName
  });
}

export async function PATCH(req){
  const session=sessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body?.token||typeof body.active!=='boolean')return NextResponse.json({error:'Invalid request'},{status:400});
  const record=await setShareActive(body.token,body.active);
  if(!record)return NextResponse.json({error:'Not found'},{status:404});
  return NextResponse.json({ok:true,active:record.active});
}

import {NextResponse} from 'next/server';
import {hasPermission,validatedSystemSessionFromRequest} from '@/lib/systemAuth';
import {createShare,listShares,setShareActive} from '@/lib/shares';
import {writeActivity} from '@/lib/activity';

async function shareSession(req){
  const session=await validatedSystemSessionFromRequest(req);
  return session&&hasPermission(session,'price.share')?session:null;
}
export async function GET(req){
  const session=await shareSession(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  return NextResponse.json({items:await listShares(100),user:session.username});
}
export async function POST(req){
  const session=await shareSession(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body?.snapshot)return NextResponse.json({error:'Invalid share snapshot'},{status:400});
  const record=await createShare(body.snapshot,{
    expiryDays:body.expiryDays||'7',
    createdBy:session.username,
    customerName:body.customerName||''
  });
  await writeActivity({actor:session.username,module:'price-list',action:'share-create',objectType:'share',objectId:record.token,after:{customerName:record.customerName,expiresAt:record.expiresAt}});
  return NextResponse.json({token:record.token,expiresAt:record.expiresAt,customerName:record.customerName});
}
export async function PATCH(req){
  const session=await shareSession(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body?.token||typeof body.active!=='boolean')return NextResponse.json({error:'Invalid request'},{status:400});
  const record=await setShareActive(body.token,body.active);
  if(!record)return NextResponse.json({error:'Not found'},{status:404});
  await writeActivity({actor:session.username,module:'price-list',action:body.active?'share-enable':'share-disable',objectType:'share',objectId:body.token,after:{active:record.active}});
  return NextResponse.json({ok:true,active:record.active});
}

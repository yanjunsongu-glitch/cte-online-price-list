import {NextResponse} from 'next/server';
import {hasPermission,validatedSystemSessionFromRequest} from '@/lib/systemAuth';
import {listActivity} from '@/lib/activity';

export async function GET(req){
  const session=await validatedSystemSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!hasPermission(session,'activity.view'))return NextResponse.json({error:'Forbidden'},{status:403});
  const limit=Math.min(Math.max(Number(new URL(req.url).searchParams.get('limit')||50),1),100);
  return NextResponse.json({items:await listActivity(limit)},{headers:{'Cache-Control':'no-store'}});
}

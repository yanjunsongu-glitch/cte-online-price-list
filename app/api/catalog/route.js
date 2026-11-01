import {NextResponse} from 'next/server';
import {getCatalog} from '@/lib/catalog';
import {hasPermission,systemSessionFromRequest} from '@/lib/systemAuth';

export async function GET(req){
  const session=systemSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!hasPermission(session,'price.view'))return NextResponse.json({error:'Forbidden'},{status:403});
  return NextResponse.json(await getCatalog(),{headers:{'Cache-Control':'no-store'}});
}

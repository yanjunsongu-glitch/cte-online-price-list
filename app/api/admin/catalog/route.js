import {NextResponse} from 'next/server';
import {getCatalog,saveCatalog} from '@/lib/catalog';
import {hasPermission,systemSessionFromRequest} from '@/lib/systemAuth';

export async function GET(req){
  const session=systemSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!hasPermission(session,'price.edit'))return NextResponse.json({error:'Forbidden'},{status:403});
  return NextResponse.json(await getCatalog());
}
export async function PUT(req){
  const session=systemSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!hasPermission(session,'price.publish'))return NextResponse.json({error:'Forbidden'},{status:403});
  return NextResponse.json(await saveCatalog(await req.json(),session.username));
}

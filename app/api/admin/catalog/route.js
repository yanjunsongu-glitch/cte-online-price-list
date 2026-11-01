import {NextResponse} from 'next/server';
import {sessionFromRequest} from '@/lib/auth';
import {hasPermission,systemSessionFromRequest} from '@/lib/systemAuth';
import {getCatalog,saveCatalog} from '@/lib/catalog';

function editorSession(req){
  const unified=systemSessionFromRequest(req);
  if(unified&&hasPermission(unified,'price.edit'))return unified;
  return sessionFromRequest(req);
}
export async function GET(req){
  const session=editorSession(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  return NextResponse.json(await getCatalog());
}
export async function PUT(req){
  const session=editorSession(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(session.role!=='editor'&&!hasPermission(session,'price.publish'))return NextResponse.json({error:'Forbidden'},{status:403});
  return NextResponse.json(await saveCatalog(await req.json(),session.username));
}

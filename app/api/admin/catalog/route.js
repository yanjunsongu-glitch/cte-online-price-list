import {NextResponse} from 'next/server';
import {getCatalog,saveCatalog} from '@/lib/catalog';
import {hasPermission,validatedSystemSessionFromRequest} from '@/lib/systemAuth';
import {writeActivity} from '@/lib/activity';

export async function GET(req){
  const session=await validatedSystemSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!hasPermission(session,'price.edit'))return NextResponse.json({error:'Forbidden'},{status:403});
  return NextResponse.json(await getCatalog());
}
export async function PUT(req){
  const session=await validatedSystemSessionFromRequest(req);
  if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!hasPermission(session,'price.publish'))return NextResponse.json({error:'Forbidden'},{status:403});
  const before=await getCatalog();
  const input=await req.json();
  let saved;
  try{saved=await saveCatalog(input,session.username)}
  catch(e){return NextResponse.json({error:'Cloud Price List storage unavailable. Current built-in Price List remains readable.',storageUnavailable:true},{status:503})}
  await writeActivity({
    actor:session.username,module:'price-list',action:'publish',objectType:'catalog',objectId:'current',
    before:{title:before.title,validity:before.validity,rate:before.rate,updatedAt:before.updatedAt},
    after:{title:saved.title,validity:saved.validity,rate:saved.rate,updatedAt:saved.updatedAt},
    meta:{activeProducts:(saved.sections||[]).reduce((n,s)=>n+(s.rows||[]).filter(r=>r.visible!==false&&r.archived!==true).length,0)}
  });
  return NextResponse.json(saved);
}

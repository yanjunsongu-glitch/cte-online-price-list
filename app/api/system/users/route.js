import {NextResponse} from 'next/server';
import {hasPermission,validatedSystemSessionFromRequest} from '@/lib/systemAuth';
import {createSystemUser,deleteSystemUser,listSystemUsers,updateSystemUser} from '@/lib/systemUsers';
import {writeActivity} from '@/lib/activity';

function canView(session){return hasPermission(session,'users.view')||hasPermission(session,'users.manage')}
function canManage(session){return hasPermission(session,'users.manage')}

export async function GET(req){
  const session=await validatedSystemSessionFromRequest(req);
  if(!session||!canView(session))return NextResponse.json({error:'Forbidden'},{status:403});
  return NextResponse.json({items:await listSystemUsers(),user:session.username},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req){
  const session=await validatedSystemSessionFromRequest(req);
  if(!session||!canManage(session))return NextResponse.json({error:'Forbidden'},{status:403});
  const body=await req.json().catch(()=>null);
  if(!body)return NextResponse.json({error:'Invalid user'},{status:400});
  try{
    const created=await createSystemUser(body,session);
    await writeActivity({actor:session.username,module:'users',action:'create',objectType:'user',objectId:created.id,after:{username:created.username,role:created.role,department:created.department,status:created.status,permissions:created.permissions}});
    return NextResponse.json(created);
  }catch(e){
    return NextResponse.json({error:e?.message||'Could not create user'},{status:400});
  }
}
export async function PATCH(req){
  const session=await validatedSystemSessionFromRequest(req);
  if(!session||!canManage(session))return NextResponse.json({error:'Forbidden'},{status:403});
  const body=await req.json().catch(()=>null);
  if(!body?.id)return NextResponse.json({error:'User ID required'},{status:400});
  try{
    const before=(await listSystemUsers()).find(x=>x.id===body.id)||null;
    const updated=await updateSystemUser(body.id,body,session);
    await writeActivity({actor:session.username,module:'users',action:'update',objectType:'user',objectId:updated.id,before:before?{username:before.username,role:before.role,department:before.department,status:before.status,permissions:before.permissions}:null,after:{username:updated.username,role:updated.role,department:updated.department,status:updated.status,permissions:updated.permissions}});
    return NextResponse.json(updated);
  }catch(e){
    return NextResponse.json({error:e?.message||'Could not update user'},{status:400});
  }
}


export async function DELETE(req){
  const session=await validatedSystemSessionFromRequest(req);
  if(!session||!canManage(session))return NextResponse.json({error:'Forbidden'},{status:403});
  const body=await req.json().catch(()=>null);
  if(!body?.id)return NextResponse.json({error:'User ID required'},{status:400});
  try{
    const before=(await listSystemUsers()).find(x=>x.id===body.id)||null;
    const deleted=await deleteSystemUser(body.id,session);
    await writeActivity({
      actor:session.username,
      module:'users',
      action:'delete',
      objectType:'user',
      objectId:deleted.id,
      before:before?{username:before.username,role:before.role,department:before.department,status:before.status,permissions:before.permissions}:null
    });
    return NextResponse.json({ok:true});
  }catch(e){
    return NextResponse.json({error:e?.message||'Could not delete user'},{status:400});
  }
}

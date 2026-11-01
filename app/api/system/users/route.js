import {NextResponse} from 'next/server';
import {hasPermission,validatedSystemSessionFromRequest} from '@/lib/systemAuth';
import {createSystemUser,listSystemUsers,updateSystemUser} from '@/lib/systemUsers';

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
    return NextResponse.json(await createSystemUser(body,session));
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
    return NextResponse.json(await updateSystemUser(body.id,body,session));
  }catch(e){
    return NextResponse.json({error:e?.message||'Could not update user'},{status:400});
  }
}

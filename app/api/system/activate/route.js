import {NextResponse} from 'next/server';
import {completeSystemUserSetup} from '@/lib/systemUsers';
import {writeActivity} from '@/lib/activity';

export async function POST(req){
  const body=await req.json().catch(()=>null);
  if(!body?.token||!body?.password){
    return NextResponse.json({error:'Activation token and password are required.'},{status:400});
  }
  try{
    const user=await completeSystemUserSetup(body.token,body.password);
    await writeActivity({
      actor:user.username,
      module:'users',
      action:'activate',
      objectType:'user',
      objectId:user.id,
      after:{username:user.username,status:user.status}
    });
    return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  }catch(e){
    return NextResponse.json({ok:false,error:e?.message||'Could not activate account.'},{status:400});
  }
}
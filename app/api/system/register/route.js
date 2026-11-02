import {NextResponse} from 'next/server';
import {requestStaffAccount} from '@/lib/systemUsers';
import {writeActivity} from '@/lib/activity';

export async function POST(req){
  const body=await req.json().catch(()=>null);
  if(!body)return NextResponse.json({error:'Invalid request'},{status:400});
  try{
    const user=await requestStaffAccount(body);
    await writeActivity({
      actor:user.username,
      module:'users',
      action:'self-register',
      objectType:'user',
      objectId:user.id,
      after:{username:user.username,fullName:user.fullName,department:user.department,status:user.status,role:user.role}
    });
    return NextResponse.json({ok:true,status:'pending'});
  }catch(e){
    return NextResponse.json({ok:false,error:e?.message||'Could not submit account request.'},{status:400});
  }
}

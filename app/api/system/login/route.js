import {NextResponse} from 'next/server';
import {systemLogin,systemSessionCookie} from '@/lib/systemAuth';

export async function POST(req){
  const {username,password}=await req.json().catch(()=>({}));
  const result=await systemLogin(username,password);
  if(!result)return NextResponse.json({ok:false,error:'Invalid credentials'},{status:401});
  const r=NextResponse.json({ok:true,user:result.user});
  r.cookies.set(systemSessionCookie.name,result.token,systemSessionCookie.options);
  return r;
}

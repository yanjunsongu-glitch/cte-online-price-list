import {NextResponse} from 'next/server';
import {financeLogin,financeSessionCookie} from '@/lib/financeAuth';

export async function POST(req){
  const {username,password}=await req.json().catch(()=>({}));
  const token=financeLogin(username,password);
  if(!token)return NextResponse.json({ok:false,error:'Invalid finance credentials'},{status:401});
  const r=NextResponse.json({ok:true,username});
  r.cookies.set(financeSessionCookie.name,token,financeSessionCookie.options);
  return r;
}

import {NextResponse} from 'next/server';
import {quotationLogin,quotationSessionCookie} from '@/lib/quotationAuth';

export async function POST(req){
  const {username,password}=await req.json().catch(()=>({}));
  const token=quotationLogin(username,password);
  if(!token)return NextResponse.json({ok:false,error:'Invalid quotation credentials'},{status:401});
  const r=NextResponse.json({ok:true,username});
  r.cookies.set(quotationSessionCookie.name,token,quotationSessionCookie.options);
  return r;
}

import {NextResponse} from 'next/server';
import {quotationSessionCookie} from '@/lib/quotationAuth';

export async function POST(){
  const r=NextResponse.json({ok:true});
  r.cookies.set(quotationSessionCookie.name,'',{...quotationSessionCookie.options,maxAge:0});
  return r;
}

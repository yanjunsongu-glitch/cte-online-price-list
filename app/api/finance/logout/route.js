import {NextResponse} from 'next/server';
import {financeSessionCookie} from '@/lib/financeAuth';

export async function POST(){
  const r=NextResponse.json({ok:true});
  r.cookies.set(financeSessionCookie.name,'',{...financeSessionCookie.options,maxAge:0});
  return r;
}

import {NextResponse} from 'next/server';
import {systemSessionCookie} from '@/lib/systemAuth';

export async function POST(){
  const r=NextResponse.json({ok:true});
  r.cookies.set(systemSessionCookie.name,'',{...systemSessionCookie.options,maxAge:0});
  return r;
}

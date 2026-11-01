import {NextResponse} from 'next/server';
import {systemLogin,systemSessionCookie} from '@/lib/systemAuth';
import {checkLoginLimit,clearLoginFailures,recordLoginFailure} from '@/lib/loginRateLimit';

function clientIp(req){
  const forwarded=req.headers.get('x-forwarded-for')||'';
  return forwarded.split(',')[0].trim()||req.headers.get('x-real-ip')||'unknown';
}

export async function POST(req){
  const {username,password}=await req.json().catch(()=>({}));
  const limit=await checkLoginLimit(clientIp(req),username);
  if(!limit.allowed){
    return NextResponse.json(
      {ok:false,error:'Too many login attempts. Please try again later.'},
      {status:429,headers:{'Retry-After':String(limit.retryAfter||60),'Cache-Control':'no-store'}}
    );
  }

  const result=await systemLogin(username,password);
  if(!result){
    const record=await recordLoginFailure(limit);
    const retry=record.lockedUntil?Math.max(1,Math.ceil((record.lockedUntil-Date.now())/1000)):0;
    return NextResponse.json(
      {ok:false,error:retry?'Too many login attempts. Please try again later.':'Invalid credentials'},
      {status:retry?429:401,headers:retry?{'Retry-After':String(retry),'Cache-Control':'no-store'}:{'Cache-Control':'no-store'}}
    );
  }

  await clearLoginFailures(limit);
  const response=NextResponse.json({ok:true,user:result.user},{headers:{'Cache-Control':'no-store'}});
  response.cookies.set(systemSessionCookie.name,result.token,systemSessionCookie.options);
  return response;
}

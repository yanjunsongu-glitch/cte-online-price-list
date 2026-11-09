import crypto from 'crypto';
import {authenticateSystemUser,validateSystemUserSession} from '@/lib/systemUsers';

const COOKIE='cte_system_session';
function secrets(){
  return [...new Set([process.env.CTE_SYSTEM_AUTH_SECRET,process.env.CTE_AUTH_SECRET,'change-me-system-auth'].filter(Boolean))];
}
function sign(p){
  const b=Buffer.from(JSON.stringify(p)).toString('base64url');
  const s=crypto.createHmac('sha256',secrets()[0]).update(b).digest('base64url');
  return b+'.'+s;
}
function verify(t){
  if(!t||!t.includes('.'))return null;
  const [b,s]=t.split('.');
  for(const secret of secrets()){
    const e=crypto.createHmac('sha256',secret).update(b).digest('base64url');
    if(s.length===e.length&&crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e))){
      try{
        const p=JSON.parse(Buffer.from(b,'base64url').toString());
        return p.exp>Date.now()?p:null;
      }catch{return null}
    }
  }
  return null;
}
export function hasPermission(session,permission){
  if(!session)return false;
  return session.role==='super_admin'||session.permissions?.includes('*')||session.permissions?.includes(permission);
}
export async function systemLogin(username,password){
  const user=await authenticateSystemUser(username,password);
  if(!user)return null;
  return {
    token:sign({
      userId:user.id,username:user.username,fullName:user.fullName,
      role:user.role,department:user.department,permissions:user.permissions,
      sessionVersion:Number(user.sessionVersion||1),
      exp:Date.now()+43200000
    }),
    user
  };
}
export function systemSessionFromRequest(req){
  return verify(req.cookies.get(COOKIE)?.value);
}
export async function validatedSystemSessionFromRequest(req){
  const tokenSession=systemSessionFromRequest(req);
  if(!tokenSession)return null;
  try{
    const current=await validateSystemUserSession(tokenSession.userId,tokenSession.username,tokenSession.sessionVersion);
    if(current?.__storageUnavailable)return tokenSession;
    if(!current)return null;
    return {...tokenSession,...current,sessionVersion:Number(current.sessionVersion||1)};
  }catch(e){
    console.error('Session validation storage fallback:',e?.message||e);
    return tokenSession;
  }
}
export const systemSessionCookie={
  name:COOKIE,
  options:{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:43200}
};

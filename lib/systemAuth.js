import crypto from 'crypto';
import {authenticateSystemUser} from '@/lib/systemUsers';

const COOKIE='cte_system_session';
function secret(){return process.env.CTE_SYSTEM_AUTH_SECRET||process.env.CTE_AUTH_SECRET||'change-me-system-auth'}
function sign(p){
  const b=Buffer.from(JSON.stringify(p)).toString('base64url');
  const s=crypto.createHmac('sha256',secret()).update(b).digest('base64url');
  return b+'.'+s;
}
function verify(t){
  if(!t||!t.includes('.'))return null;
  const [b,s]=t.split('.');
  const e=crypto.createHmac('sha256',secret()).update(b).digest('base64url');
  if(s.length!==e.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e)))return null;
  try{
    const p=JSON.parse(Buffer.from(b,'base64url').toString());
    return p.exp>Date.now()?p:null;
  }catch{return null}
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
      exp:Date.now()+43200000
    }),
    user
  };
}
export function systemSessionFromRequest(req){
  return verify(req.cookies.get(COOKIE)?.value);
}
export const systemSessionCookie={
  name:COOKIE,
  options:{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:43200}
};

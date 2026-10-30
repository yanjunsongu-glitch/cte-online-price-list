import crypto from 'crypto';

const COOKIE='cte_quotation_session';

function secret(){
  return process.env.CTE_QUOTATION_AUTH_SECRET || process.env.CTE_AUTH_SECRET || 'change-me-quotation';
}
function parseAccounts(name){
  try{return JSON.parse(process.env[name]||'{}')}catch{return {}}
}
function accounts(){
  const dedicated=parseAccounts('CTE_QUOTATION_ACCOUNTS');
  if(Object.keys(dedicated).length) return dedicated;
  return parseAccounts('CTE_EDITOR_ACCOUNTS');
}
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
    return p.exp>Date.now()&&p.role==='quotation'?p:null;
  }catch{return null}
}
export function quotationLogin(u,p){
  const a=accounts();
  if(!u||!p||a[u]!==p)return null;
  return sign({username:u,role:'quotation',exp:Date.now()+43200000});
}
export function quotationSessionFromRequest(r){
  return verify(r.cookies.get(COOKIE)?.value);
}
export const quotationSessionCookie={
  name:COOKIE,
  options:{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:43200}
};

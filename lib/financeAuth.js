import crypto from 'crypto';

const COOKIE='cte_finance_session';

function secret(){
  return process.env.CTE_FINANCE_AUTH_SECRET || process.env.CTE_AUTH_SECRET || 'change-me-finance';
}

function parseAccounts(name){
  try{return JSON.parse(process.env[name]||'{}')}catch{return {}}
}

function accounts(){
  const finance=parseAccounts('CTE_FINANCE_ACCOUNTS');
  if(Object.keys(finance).length) return finance;
  // Trial fallback: existing editor credentials can access Finance until a dedicated finance account is configured.
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
    return p.exp>Date.now()&&p.role==='finance'?p:null;
  }catch{return null}
}

export function financeLogin(u,p){
  const a=accounts();
  if(!u||!p||a[u]!==p)return null;
  return sign({username:u,role:'finance',exp:Date.now()+43200000});
}

export function financeSessionFromRequest(r){
  return verify(r.cookies.get(COOKIE)?.value);
}

export const financeSessionCookie={
  name:COOKIE,
  options:{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:43200}
};

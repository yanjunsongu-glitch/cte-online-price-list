import crypto from 'crypto';
const COOKIE='cte_session'; function secret(){return process.env.CTE_AUTH_SECRET||'change-me'}
function accounts(){try{return JSON.parse(process.env.CTE_EDITOR_ACCOUNTS||'{}')}catch{return {}}}
function sign(p){const b=Buffer.from(JSON.stringify(p)).toString('base64url');const s=crypto.createHmac('sha256',secret()).update(b).digest('base64url');return b+'.'+s}
function verify(t){if(!t||!t.includes('.'))return null;const [b,s]=t.split('.');const e=crypto.createHmac('sha256',secret()).update(b).digest('base64url');if(s.length!==e.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e)))return null;try{const p=JSON.parse(Buffer.from(b,'base64url').toString());return p.exp>Date.now()?p:null}catch{return null}}
export function login(u,p){const a=accounts();if(!u||!p||a[u]!==p)return null;return sign({username:u,role:'editor',exp:Date.now()+43200000})}
export function sessionFromRequest(r){return verify(r.cookies.get(COOKIE)?.value)}
export const sessionCookie={name:COOKIE,options:{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:43200}};
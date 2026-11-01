import {NextResponse} from 'next/server';

const COOKIE='cte_system_session';
const PUBLIC_PREFIXES=[
  '/login','/share/','/api/share/','/api/system/login','/api/system/logout','/api/system/me',
  '/_next/','/icon.svg','/favicon.ico','/robots.txt'
];

function base64UrlToBytes(value){
  const pad='='.repeat((4-value.length%4)%4);
  const base64=(value+pad).replace(/-/g,'+').replace(/_/g,'/');
  const bin=atob(base64);
  return Uint8Array.from(bin,c=>c.charCodeAt(0));
}
function textBytes(value){return new TextEncoder().encode(value)}
async function verifyToken(token){
  if(!token||!token.includes('.'))return null;
  const [body,sig]=token.split('.');
  const secret=process.env.CTE_SYSTEM_AUTH_SECRET||process.env.CTE_AUTH_SECRET||'change-me-system-auth';
  try{
    const key=await crypto.subtle.importKey('raw',textBytes(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    const ok=await crypto.subtle.verify('HMAC',key,base64UrlToBytes(sig),textBytes(body));
    if(!ok)return null;
    const payload=JSON.parse(new TextDecoder().decode(base64UrlToBytes(body)));
    if(!payload?.exp||payload.exp<=Date.now())return null;
    return payload;
  }catch{return null}
}
function hasPermission(session,permission){
  return session?.role==='super_admin'||session?.permissions?.includes('*')||session?.permissions?.includes(permission);
}
function requiredPermission(pathname){
  if(pathname==='/'||pathname.startsWith('/api/catalog'))return 'price.view';
  if(pathname.startsWith('/quotation'))return 'quotation.view';
  if(pathname.startsWith('/finance'))return 'finance.view';
  if(pathname.startsWith('/warehouse'))return 'warehouse.view';
  if(pathname.startsWith('/admin/users'))return 'users.view';
  if(pathname==='/admin'||pathname.startsWith('/admin/'))return 'price.edit';
  return null;
}
function isPublic(pathname){
  return PUBLIC_PREFIXES.some(p=>pathname===p||pathname.startsWith(p));
}

export async function middleware(request){
  const {pathname,search}=request.nextUrl;
  if(isPublic(pathname))return NextResponse.next();

  const session=await verifyToken(request.cookies.get(COOKIE)?.value);
  if(!session){
    if(pathname.startsWith('/api/'))return NextResponse.json({error:'Unauthorized'},{status:401});
    const url=new URL('/login',request.url);
    url.searchParams.set('next',pathname+search);
    return NextResponse.redirect(url);
  }

  const permission=requiredPermission(pathname);
  if(permission&&!hasPermission(session,permission)){
    if(pathname.startsWith('/api/'))return NextResponse.json({error:'Forbidden'},{status:403});
    return NextResponse.redirect(new URL('/system',request.url));
  }

  return NextResponse.next();
}

export const config={
  matcher:['/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$).*)']
};

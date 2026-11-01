import crypto from 'crypto';
import {list,put} from '@vercel/blob';

const PATH='system/users.enc';

function secret(){
  return process.env.CTE_SYSTEM_DATA_SECRET || process.env.CTE_AUTH_SECRET || 'change-me-system-data';
}
function key(){return crypto.createHash('sha256').update(secret()).digest()}
function encrypt(obj){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const body=Buffer.concat([cipher.update(JSON.stringify(obj),'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return ['v1',iv.toString('base64url'),tag.toString('base64url'),body.toString('base64url')].join('.');
}
function decrypt(txt){
  const [v,ivB,tagB,bodyB]=String(txt||'').split('.');
  if(v!=='v1')throw new Error('Unsupported system user data');
  const decipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(ivB,'base64url'));
  decipher.setAuthTag(Buffer.from(tagB,'base64url'));
  const out=Buffer.concat([decipher.update(Buffer.from(bodyB,'base64url')),decipher.final()]);
  return JSON.parse(out.toString('utf8'));
}

function passwordHash(password,salt=crypto.randomBytes(16).toString('base64url')){
  const hash=crypto.scryptSync(String(password),salt,64).toString('base64url');
  return {salt,hash};
}
function passwordMatches(password,user){
  if(!user?.passwordHash||!user?.passwordSalt)return false;
  const actual=crypto.scryptSync(String(password),user.passwordSalt,64);
  const expected=Buffer.from(user.passwordHash,'base64url');
  return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);
}
function cleanUsername(v){
  const s=String(v||'').trim().toLowerCase();
  return /^[a-z0-9._-]{3,64}$/.test(s)?s:null;
}
function cleanRole(v){
  return ['super_admin','admin','staff'].includes(v)?v:'staff';
}
function cleanDepartment(v){
  const allowed=['Management','Sales','Pre-sales','After-sales','Finance','Warehouse','Other'];
  return allowed.includes(v)?v:'Other';
}
function cleanPermissions(v){
  const allowed=[
    'price.view','price.edit','price.publish','price.share',
    'quotation.view','quotation.create','quotation.edit',
    'finance.view','finance.create','finance.edit',
    'warehouse.view','warehouse.edit',
    'users.view','users.manage','system.settings','activity.view'
  ];
  return [...new Set((Array.isArray(v)?v:[]).filter(x=>allowed.includes(x)))];
}
export function defaultPermissionsFor(role,department='Other'){
  if(role==='super_admin')return ['*'];
  if(role==='admin'){
    const base=['price.view','quotation.view'];
    if(department==='Sales'||department==='Pre-sales')base.push('price.edit','price.publish','price.share','quotation.create','quotation.edit','warehouse.view','users.view','users.manage');
    if(department==='Finance')base.push('finance.view','finance.create','finance.edit','quotation.view','users.view','users.manage');
    if(department==='Warehouse')base.push('warehouse.view','warehouse.edit','users.view','users.manage');
    if(department==='Management')return ['*'];
    return [...new Set(base)];
  }
  const base=['price.view'];
  if(department==='Sales'||department==='Pre-sales')base.push('price.share','quotation.view','quotation.create','quotation.edit','warehouse.view');
  if(department==='Finance')base.push('finance.view','finance.create','finance.edit','quotation.view');
  if(department==='Warehouse')base.push('warehouse.view','warehouse.edit');
  if(department==='Management')base.push('quotation.view','finance.view','warehouse.view');
  return [...new Set(base)];
}
function publicUser(u){
  if(!u)return null;
  const {passwordHash,passwordSalt,...safe}=u;
  return safe;
}
async function readStore(){
  const r=await list({prefix:PATH,limit:10});
  const b=r.blobs?.find(x=>x.pathname===PATH);
  if(!b)return {users:[],updatedAt:null};
  const res=await fetch(b.url,{cache:'no-store'});
  if(!res.ok)throw new Error('User store read failed');
  return decrypt(await res.text());
}
async function writeStore(store){
  store.updatedAt=new Date().toISOString();
  await put(PATH,encrypt(store),{
    access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'text/plain'
  });
  return store;
}
export async function listSystemUsers(){
  const store=await readStore();
  return (store.users||[]).map(publicUser).sort((a,b)=>String(a.fullName||a.username).localeCompare(String(b.fullName||b.username)));
}
export async function getSystemUserByUsername(username){
  const u=cleanUsername(username);
  if(!u)return null;
  const store=await readStore();
  return (store.users||[]).find(x=>x.username===u)||null;
}
export async function validateSystemUserSession(userId,username,sessionVersion){
  const store=await readStore();
  const clean=cleanUsername(username);
  const user=(store.users||[]).find(x=>x.id===userId || (clean&&x.username===clean));
  if(!user||user.status!=='active')return null;
  const currentVersion=Number(user.sessionVersion||1);
  if(Number(sessionVersion||1)!==currentVersion)return null;
  return publicUser({...user,sessionVersion:currentVersion});
}
export async function authenticateSystemUser(username,password){
  const uname=cleanUsername(username);
  if(!uname||!password)return null;
  let store=await readStore();
  let user=(store.users||[]).find(x=>x.username===uname);

  if(!user){
    let legacy={};
    try{legacy=JSON.parse(process.env.CTE_EDITOR_ACCOUNTS||'{}')}catch{}
    if(legacy[uname]===password || legacy[username]===password){
      const ph=passwordHash(password);
      user={
        id:crypto.randomUUID(),username:uname,fullName:uname,
        role:'super_admin',department:'Management',permissions:['*'],
        status:'active',passwordHash:ph.hash,passwordSalt:ph.salt,
        createdAt:new Date().toISOString(),createdBy:'legacy-bootstrap',
        updatedAt:new Date().toISOString(),lastLoginAt:null,sessionVersion:1
      };
      store.users=[...(store.users||[]),user];
      await writeStore(store);
    }
  }

  if(!user||user.status!=='active'||!passwordMatches(password,user))return null;
  user.sessionVersion=Number(user.sessionVersion||1);
  user.lastLoginAt=new Date().toISOString();
  user.updatedAt=user.updatedAt||new Date().toISOString();
  await writeStore(store);
  return publicUser(user);
}
export async function createSystemUser(input,actor){
  const username=cleanUsername(input.username);
  if(!username)throw new Error('Username must be 3-64 characters: letters, numbers, dot, underscore or hyphen.');
  if(String(input.password||'').length<8)throw new Error('Password must be at least 8 characters.');
  const store=await readStore();
  if((store.users||[]).some(x=>x.username===username))throw new Error('Username already exists.');
  const role=cleanRole(input.role);
  if(actor?.role==='admin'&&role!=='staff')throw new Error('Admin can only create Staff accounts.');
  if(role==='super_admin'&&actor?.role!=='super_admin')throw new Error('Only Super Admin can create Super Admin.');
  const department=cleanDepartment(input.department);
  const ph=passwordHash(input.password);
  const user={
    id:crypto.randomUUID(),username,
    fullName:String(input.fullName||username).trim().slice(0,120),
    email:String(input.email||'').trim().slice(0,160),
    phone:String(input.phone||'').trim().slice(0,80),
    role,department,
    permissions:role==='super_admin'?['*']:(input.permissions?.length?cleanPermissions(input.permissions):defaultPermissionsFor(role,department)),
    status:input.status==='disabled'?'disabled':'active',
    passwordHash:ph.hash,passwordSalt:ph.salt,
    createdAt:new Date().toISOString(),createdBy:actor?.username||'system',
    updatedAt:new Date().toISOString(),lastLoginAt:null,sessionVersion:1
  };
  store.users=[...(store.users||[]),user];
  await writeStore(store);
  return publicUser(user);
}
export async function updateSystemUser(id,input,actor){
  const store=await readStore();
  const user=(store.users||[]).find(x=>x.id===id);
  if(!user)throw new Error('User not found.');
  if(user.role==='super_admin'&&actor?.role!=='super_admin')throw new Error('Only Super Admin can change Super Admin.');
  if(actor?.role==='admin'&&user.role!=='staff')throw new Error('Admin can only manage Staff accounts.');
  const role=input.role?cleanRole(input.role):user.role;
  if(actor?.role==='admin'&&role!=='staff')throw new Error('Admin cannot promote Staff to Admin.');
  if(role==='super_admin'&&actor?.role!=='super_admin')throw new Error('Only Super Admin can assign Super Admin.');
  user.fullName=input.fullName!==undefined?String(input.fullName||user.username).trim().slice(0,120):user.fullName;
  user.email=input.email!==undefined?String(input.email||'').trim().slice(0,160):user.email;
  user.phone=input.phone!==undefined?String(input.phone||'').trim().slice(0,80):user.phone;
  user.department=input.department?cleanDepartment(input.department):user.department;
  user.role=role;
  user.permissions=role==='super_admin'?['*']:(input.permissions!==undefined?cleanPermissions(input.permissions):user.permissions);
  if(input.status!==undefined)user.status=input.status==='disabled'?'disabled':'active';
  if(input.password){
    if(String(input.password).length<8)throw new Error('Password must be at least 8 characters.');
    const ph=passwordHash(input.password);user.passwordHash=ph.hash;user.passwordSalt=ph.salt;
  }
  user.sessionVersion=Number(user.sessionVersion||1)+1;
  user.updatedAt=new Date().toISOString();
  user.updatedBy=actor?.username||'system';
  await writeStore(store);
  return publicUser(user);
}

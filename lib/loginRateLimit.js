import crypto from 'crypto';
import {readSharedText,writeSharedText} from '@/lib/dataStore';

const PREFIX='security/login-rate/';
const emergencyRateMemory=new Map();

function hashKey(ip,username){
  return crypto.createHash('sha256').update(String(ip||'unknown')+'|'+String(username||'').toLowerCase()).digest('hex');
}
async function readRecord(path){
  try{
    const raw=await readSharedText(path,{migrate:false,contentType:'application/json'});
    if(!raw)return emergencyRateMemory.get(path)||null;
    const record=JSON.parse(raw);
    if(record)emergencyRateMemory.set(path,record);
    return record;
  }catch{
    return emergencyRateMemory.get(path)||null;
  }
}
async function writeRecord(path,record){
  emergencyRateMemory.set(path,record);
  try{
    await writeSharedText(path,JSON.stringify(record),{contentType:'application/json'});
  }catch{}
}
export async function checkLoginLimit(ip,username){
  const path=PREFIX+hashKey(ip,username)+'.json';
  const now=Date.now();
  const r=await readRecord(path);
  if(!r)return {allowed:true,path,record:{count:0,windowStart:now,lockedUntil:0}};
  if(r.lockedUntil&&r.lockedUntil>now){
    return {allowed:false,path,record:r,retryAfter:Math.ceil((r.lockedUntil-now)/1000)};
  }
  if(!r.windowStart||now-r.windowStart>10*60*1000){
    return {allowed:true,path,record:{count:0,windowStart:now,lockedUntil:0}};
  }
  return {allowed:true,path,record:r};
}
export async function recordLoginFailure(state){
  const now=Date.now();
  const r={...(state.record||{})};
  if(!r.windowStart||now-r.windowStart>10*60*1000){r.windowStart=now;r.count=0}
  r.count=Number(r.count||0)+1;
  let lockMs=0;
  if(r.count>=12)lockMs=30*60*1000;
  else if(r.count>=8)lockMs=5*60*1000;
  else if(r.count>=5)lockMs=60*1000;
  r.lockedUntil=lockMs?now+lockMs:0;
  r.updatedAt=new Date(now).toISOString();
  await writeRecord(state.path,r);
  return r;
}
export async function clearLoginFailures(state){
  await writeRecord(state.path,{count:0,windowStart:Date.now(),lockedUntil:0,updatedAt:new Date().toISOString()});
}

import {NextResponse} from 'next/server';
import {getShare,shareStatus} from '@/lib/shares';

export async function GET(req,{params}){
  const {token}=await params;
  const record=await getShare(token);
  const status=shareStatus(record);
  if(status!=='active')return NextResponse.json({status},{status:status==='missing'?404:410});
  return NextResponse.json({
    status:'active',
    customerName:record.customerName||'',
    createdAt:record.createdAt,
    expiresAt:record.expiresAt,
    snapshot:record.snapshot
  },{headers:{'Cache-Control':'no-store'}});
}

import {NextResponse} from 'next/server';
export async function GET(){
  return NextResponse.json({
    auth:Boolean(process.env.CTE_AUTH_SECRET),
    systemAuth:Boolean(process.env.CTE_SYSTEM_AUTH_SECRET),
    systemData:Boolean(process.env.CTE_SYSTEM_DATA_SECRET),
    quotationData:Boolean(process.env.CTE_QUOTATION_DATA_SECRET),
    financeData:Boolean(process.env.CTE_FINANCE_DATA_SECRET),
    shareData:Boolean(process.env.CTE_SHARE_DATA_SECRET)
  },{headers:{'Cache-Control':'no-store'}});
}

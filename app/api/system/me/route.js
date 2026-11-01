import {NextResponse} from 'next/server';
import {validatedSystemSessionFromRequest} from '@/lib/systemAuth';

export async function GET(req){
  const session=await validatedSystemSessionFromRequest(req);
  if(!session)return NextResponse.json({authenticated:false},{status:401});
  return NextResponse.json({authenticated:true,user:session},{headers:{'Cache-Control':'no-store'}});
}

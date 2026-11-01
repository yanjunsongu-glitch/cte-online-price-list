import {NextResponse} from 'next/server';
import {systemSessionFromRequest} from '@/lib/systemAuth';

export async function GET(req){
  const session=systemSessionFromRequest(req);
  if(!session)return NextResponse.json({authenticated:false},{status:401});
  return NextResponse.json({authenticated:true,user:session},{headers:{'Cache-Control':'no-store'}});
}

import {NextResponse} from 'next/server';
import {readNeonAsset} from '@/lib/neonStore';

export const runtime='nodejs';

export async function GET(req,{params}){
  const {id}=await params;
  if(!/^[a-f0-9-]{20,80}$/i.test(String(id||'')))return NextResponse.json({error:'Not found'},{status:404});
  const asset=await readNeonAsset(id);
  if(!asset)return NextResponse.json({error:'Not found'},{status:404});
  return new NextResponse(asset.body,{
    status:200,
    headers:{
      'Content-Type':asset.contentType||'application/octet-stream',
      'Content-Length':String(asset.body.length),
      'Content-Disposition':'inline; filename="'+String(asset.fileName||'file').replace(/"/g,'')+'"',
      'Cache-Control':'public, max-age=3600, s-maxage=3600'
    }
  });
}

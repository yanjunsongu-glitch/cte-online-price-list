import {NextResponse} from 'next/server';
import {handleUpload} from '@vercel/blob/client';
import {sessionFromRequest} from '@/lib/auth';

function safeName(v){
  return String(v||'file').replace(/[^a-zA-Z0-9._-]/g,'_');
}

export async function POST(request){
  const body=await request.json();

  try{
    const jsonResponse=await handleUpload({
      body,
      request,
      onBeforeGenerateToken:async(pathname,clientPayload)=>{
        if(!sessionFromRequest(request)) throw new Error('Unauthorized');

        let meta={};
        try{meta=clientPayload?JSON.parse(clientPayload):{}}catch{}

        const kind=String(meta.kind||'asset');
        const productId=safeName(meta.productId||'file');
        const fileName=safeName(meta.fileName||pathname.split('/').pop()||'file');

        const isDatasheet=kind==='datasheet';
        const isImageKind=kind==='image'||kind==='logo';

        return {
          pathname:'assets/'+productId+'/'+kind+'-'+Date.now()+'-'+fileName,
          allowedContentTypes:isDatasheet
            ? ['application/pdf','image/*']
            : isImageKind
              ? ['image/*']
              : ['application/pdf','image/*'],
          maximumSizeInBytes:15*1024*1024,
          tokenPayload:JSON.stringify({productId,kind,fileName})
        };
      },
      onUploadCompleted:async()=>{}
    });

    return NextResponse.json(jsonResponse);
  }catch(error){
    console.error('Blob client upload error',error);
    return NextResponse.json({error:error?.message||'Upload failed'},{status:400});
  }
}

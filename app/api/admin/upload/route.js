import crypto from 'crypto';
import {NextResponse} from 'next/server';
import {put} from '@vercel/blob';
import {hasPermission,validatedSystemSessionFromRequest} from '@/lib/systemAuth';
import {isNeonConfigured,writeNeonAsset} from '@/lib/neonStore';

export const runtime='nodejs';

function safeName(v){
  return String(v||'file').replace(/[^a-zA-Z0-9._-]/g,'_');
}

function extFor(fileName,mime){
  const m=String(fileName||'').match(/(\.[a-zA-Z0-9]{1,8})$/);
  if(m)return m[1].toLowerCase();
  if(mime==='image/webp')return '.webp';
  if(mime==='image/png')return '.png';
  if(mime==='image/jpeg')return '.jpg';
  if(mime==='application/pdf')return '.pdf';
  return '';
}

export async function POST(request){
  const session=await validatedSystemSessionFromRequest(request);
  if(!(session&&hasPermission(session,'price.edit'))){
    return NextResponse.json({error:'Unauthorized'},{status:401});
  }

  try{
    const form=await request.formData();
    const file=form.get('file');
    const kind=String(form.get('kind')||'asset');
    const productId=safeName(form.get('productId')||'file');
    const originalName=safeName(form.get('fileName')||file?.name||'file');

    if(!file||typeof file.arrayBuffer!=='function'){
      return NextResponse.json({error:'No file received.'},{status:400});
    }
    if(file.size>6*1024*1024){
      return NextResponse.json({error:'Shared upload is limited to 6MB per file. Images are compressed automatically before upload.'},{status:413});
    }

    const isPdf=file.type==='application/pdf'||/\.pdf$/i.test(originalName);
    const isImage=String(file.type||'').startsWith('image/');
    if(kind==='datasheet'&&!isPdf&&!isImage){
      return NextResponse.json({error:'Datasheet must be a PDF or image.'},{status:400});
    }
    if((kind==='image'||kind==='logo')&&!isImage){
      return NextResponse.json({error:'Photo/logo must be an image.'},{status:400});
    }

    const ext=extFor(originalName,file.type);
    const objectName=kind+'-'+Date.now()+'-'+crypto.randomBytes(4).toString('hex')+'-'+safeName(originalName.replace(/\.[^.]+$/,'')||'file')+ext;
    const path='assets/'+productId+'/'+objectName;
    const body=Buffer.from(await file.arrayBuffer());

    try{
      const blob=await put(path,body,{
        access:'public',
        addRandomSuffix:false,
        allowOverwrite:false,
        contentType:file.type||'application/octet-stream'
      });
      return NextResponse.json({
        url:blob.url,
        name:originalName,
        type:isPdf?'pdf':isImage?'image':'file',
        shared:true,
        backend:'vercel-blob'
      });
    }catch(blobError){
      console.warn('Vercel Blob unavailable; using Neon shared fallback.',blobError?.message||blobError);
    }

    if(!isNeonConfigured()){
      return NextResponse.json({error:'Shared cloud file storage is unavailable.',storageUnavailable:true},{status:503});
    }

    const id=crypto.randomUUID();
    await writeNeonAsset(id,{fileName:originalName,contentType:file.type||'application/octet-stream',body});
    return NextResponse.json({
      url:'/api/assets/'+encodeURIComponent(id),
      name:originalName,
      type:isPdf?'pdf':isImage?'image':'file',
      shared:true,
      backend:'neon-fallback'
    });
  }catch(error){
    console.error('Shared upload error',error);
    return NextResponse.json({error:error?.message||'Shared upload failed',storageUnavailable:true},{status:503});
  }
}

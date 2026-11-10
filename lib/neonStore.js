import {neon} from '@neondatabase/serverless';

let client=null;
let schemaPromise=null;

export function isNeonConfigured(){
  return Boolean(process.env.DATABASE_URL);
}

function db(){
  if(!isNeonConfigured())throw new Error('DATABASE_URL is not configured.');
  if(!client)client=neon(process.env.DATABASE_URL);
  return client;
}

async function ensureSchema(){
  if(!schemaPromise){
    schemaPromise=(async()=>{
      const sql=db();
      await sql`
        CREATE TABLE IF NOT EXISTS cte_kv_store (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          content_type TEXT NOT NULL DEFAULT 'text/plain',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS cte_shared_assets (
          id TEXT PRIMARY KEY,
          file_name TEXT NOT NULL,
          content_type TEXT NOT NULL,
          body_base64 TEXT NOT NULL,
          size_bytes BIGINT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch(e=>{
      schemaPromise=null;
      throw e;
    });
  }
  return schemaPromise;
}

export async function readNeonText(key){
  await ensureSchema();
  const sql=db();
  const rows=await sql`
    SELECT value
    FROM cte_kv_store
    WHERE key=${String(key)}
    LIMIT 1
  `;
  return rows?.[0]?.value??null;
}

export async function writeNeonText(key,value,{contentType='text/plain'}={}){
  await ensureSchema();
  const sql=db();
  await sql`
    INSERT INTO cte_kv_store (key,value,content_type,updated_at)
    VALUES (${String(key)},${String(value)},${String(contentType)},NOW())
    ON CONFLICT (key)
    DO UPDATE SET
      value=EXCLUDED.value,
      content_type=EXCLUDED.content_type,
      updated_at=NOW()
  `;
  return true;
}

export async function listNeonEntries(prefix='',limit=100){
  await ensureSchema();
  const sql=db();
  const pattern=String(prefix||'')+'%';
  const safeLimit=Math.min(Math.max(Number(limit)||100,1),500);
  return sql`
    SELECT key,value,content_type,updated_at
    FROM cte_kv_store
    WHERE key LIKE ${pattern}
    ORDER BY updated_at DESC
    LIMIT ${safeLimit}
  `;
}

export async function deleteNeonKey(key){
  await ensureSchema();
  const sql=db();
  await sql`DELETE FROM cte_kv_store WHERE key=${String(key)}`;
  return true;
}

export async function writeNeonAsset(id,{fileName='file',contentType='application/octet-stream',body}={}){
  await ensureSchema();
  const sql=db();
  const buffer=Buffer.isBuffer(body)?body:Buffer.from(body||[]);
  const b64=buffer.toString('base64');
  await sql`
    INSERT INTO cte_shared_assets (id,file_name,content_type,body_base64,size_bytes,updated_at)
    VALUES (${String(id)},${String(fileName)},${String(contentType)},${b64},${buffer.length},NOW())
    ON CONFLICT (id)
    DO UPDATE SET
      file_name=EXCLUDED.file_name,
      content_type=EXCLUDED.content_type,
      body_base64=EXCLUDED.body_base64,
      size_bytes=EXCLUDED.size_bytes,
      updated_at=NOW()
  `;
  return {id:String(id),fileName:String(fileName),contentType:String(contentType),size:buffer.length};
}

export async function readNeonAsset(id){
  await ensureSchema();
  const sql=db();
  const rows=await sql`
    SELECT id,file_name,content_type,body_base64,size_bytes,updated_at
    FROM cte_shared_assets
    WHERE id=${String(id)}
    LIMIT 1
  `;
  const row=rows?.[0];
  if(!row)return null;
  return {
    id:row.id,
    fileName:row.file_name,
    contentType:row.content_type,
    body:Buffer.from(row.body_base64,'base64'),
    size:Number(row.size_bytes||0),
    updatedAt:row.updated_at
  };
}

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

export async function deleteNeonKey(key){
  await ensureSchema();
  const sql=db();
  await sql`DELETE FROM cte_kv_store WHERE key=${String(key)}`;
  return true;
}

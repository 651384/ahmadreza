function now(){return new Date().toISOString();}

export async function ensureJarvisMailbox(env){
  if(!env.SIMOT_DB) throw new Error("RUNTIME_NOT_CONFIGURED");
  await env.SIMOT_DB.prepare("CREATE TABLE IF NOT EXISTS jarvis_mailbox (id INTEGER PRIMARY KEY AUTOINCREMENT, msg_id TEXT NOT NULL UNIQUE, corr_id TEXT, direction TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL)").run();
}

export function buildJarvisEnvelope(message,{msgId,corrId}){
  const text=String(message||"").trim();
  return {
    "FRAME-START":"<<<SIMOT-MSG v2 | START>>>",
    "FRAME-END":"<<<SIMOT-MSG v2 | END | MSG-ID="+msgId+">>>",
    "MSG-ID":msgId,"CORR-ID":corrId,"REPLY-TO":"NONE","THREAD-ID":corrId,
    "FROM":"SIMOT-AI-01","TO":"SIMOT-MASTER","TYPE":"REQUEST","PRIORITY":"ROUTINE",
    "AUTHORITY":"EXECUTE_WITHIN_ROLE","STATUS":"NEW","SCOPE":"JARVIS_REQUEST",
    "SOT-REFS":["JARVIS"],"TASK-REFS":[],"RECORD-REFS":[],
    "EXPECTED-ACTION":"Process the user's Jarvis request through SIMOT and return the verified result or exact blocker.",
    "DEADLINE":new Date(Date.now()+10*60*1000).toISOString(),"CONFIDENTIALITY":"INTERNAL",
    "PAYLOAD-FORMAT":"TEXT","PART":"1/1","RESULT-STATUS":"PENDING",
    "NEXT-ACTION":"EXECUTE_JARVIS_REQUEST","WRITE-BACK":"REQUIRED","ESCALATION":"SIMOT-MASTER",
    "CONFIDENCE":"HIGH","VERIFICATION":"INTERNAL","PAYLOAD":{source:"JARVIS",message:text}
  };
}

export async function submitJarvisMessage(env,message,{msgId,corrId}={}){
  const text=typeof message==="string"?message.trim():"";
  if(!text||text.length>12000) throw new Error("INVALID_JARVIS_MESSAGE");
  if(!env.SIMOT_QUEUE) throw new Error("RUNTIME_NOT_CONFIGURED");
  await ensureJarvisMailbox(env);
  const id=msgId||"JARVIS-"+crypto.randomUUID();
  const correlation=corrId||id;
  const envelope=buildJarvisEnvelope(text,{msgId:id,corrId:correlation});
  await env.SIMOT_DB.prepare("INSERT INTO jarvis_mailbox(msg_id,corr_id,direction,body,created_at) VALUES(?,?,?,?,?)").bind(id,correlation,"JARVIS_TO_SIMOT",text,now()).run();
  try{ await env.SIMOT_QUEUE.send(envelope); }
  catch(error){ await env.SIMOT_DB.prepare("DELETE FROM jarvis_mailbox WHERE msg_id=?").bind(id).run().catch(()=>{}); throw error; }
  return {ok:true,msg_id:id,corr_id:correlation,status:"QUEUED"};
}

export async function writeJarvisResult(env,body,result){
  await ensureJarvisMailbox(env);
  const msgId=String(body?.["MSG-ID"]||"");
  const corrId=String(body?.["CORR-ID"]||msgId);
  const payload={msg_id:msgId,corr_id:corrId,status:String(result?.result_status||"UNKNOWN"),result};
  const responseId="SIMOT-"+crypto.randomUUID();
  await env.SIMOT_DB.prepare("INSERT INTO jarvis_mailbox(msg_id,corr_id,direction,body,created_at) VALUES(?,?,?,?,?)").bind(responseId,corrId,"SIMOT_TO_JARVIS",JSON.stringify(payload),now()).run();
  return {ok:true,msg_id:responseId,corr_id:corrId};
}

export async function readJarvisMailbox(env,{since,limit=20,direction}={}){
  await ensureJarvisMailbox(env);
  const n=Math.min(50,Math.max(1,Number(limit||20)));
  const hasSince=typeof since==="string"&&since;
  const hasDirection=typeof direction==="string"&&direction;
  let sql="SELECT id,msg_id,corr_id,direction,body,created_at FROM jarvis_mailbox";
  const where=[],binds=[];
  if(hasSince){where.push("created_at>?");binds.push(since);}
  if(hasDirection){where.push("direction=?");binds.push(direction);}
  if(where.length)sql+=" WHERE "+where.join(" AND ");
  sql+=" ORDER BY id "+(hasSince?"ASC":"DESC")+" LIMIT ?";
  binds.push(n);
  const rows=await env.SIMOT_DB.prepare(sql).bind(...binds).all();
  return {messages:rows.results||[]};
}

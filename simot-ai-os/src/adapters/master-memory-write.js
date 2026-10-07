const MASTER_MEMORY_ORIGIN = "http://127.0.0.1:9100";
const ALLOWED_BUCKET = "working";
const OBJECT_ID_RE = /^E2E-[A-Z0-9][A-Z0-9._-]{0,119}$/;
const MAX_CONTENT_BYTES = 64 * 1024;
function blocked(error_code,next_action,extra={}){return {ok:false,status:"BLOCKED",error_code,next_action,...extra};}
function normalize(value){return String(value??"").trim().toUpperCase();}
function requireWriteAuthority(authority){return normalize(authority)==="SYSTEM_WRITE_ALLOWED"?null:blocked("MASTER_MEMORY_WRITE_AUTHORITY_REQUIRED","REQUIRE_SYSTEM_WRITE_ALLOWED");}
export async function writeMasterMemoryE2E(env,{authority,approval=false,bucket=ALLOWED_BUCKET,object_id,content}={}){
  const gate=requireWriteAuthority(authority); if(gate)return gate;
  if(approval!==true)return blocked("APPROVAL_GATE_REQUIRED","PROVIDE_EXPLICIT_APPROVAL");
  if(bucket!==ALLOWED_BUCKET)return blocked("MASTER_MEMORY_BUCKET_NOT_ALLOWED","USE_WORKING_BUCKET_ONLY",{allowed_bucket:ALLOWED_BUCKET});
  if(!OBJECT_ID_RE.test(String(object_id??"")))return blocked("MASTER_MEMORY_OBJECT_ID_NOT_ALLOWED","USE_E2E_OBJECT_ID_PREFIX",{required_prefix:"E2E-"});
  if(typeof content!=="string"||!content.length)return blocked("MASTER_MEMORY_CONTENT_MISSING","PROVIDE_STRING_CONTENT");
  if(new TextEncoder().encode(content).byteLength>MAX_CONTENT_BYTES)return blocked("MASTER_MEMORY_CONTENT_TOO_LARGE","REDUCE_CONTENT_SIZE",{max_bytes:MAX_CONTENT_BYTES});
  if(!env?.SIMOT_MASTER_MEMORY||!env?.SIMOT_MASTER_MEMORY_TOKEN)return blocked("MASTER_MEMORY_RUNTIME_NOT_CONFIGURED","CONFIGURE_MASTER_MEMORY_VPC_AND_TOKEN");
  let response; try{response=await env.SIMOT_MASTER_MEMORY.fetch(MASTER_MEMORY_ORIGIN+"/memory",{method:"POST",headers:{Authorization:"Bearer "+env.SIMOT_MASTER_MEMORY_TOKEN,"content-type":"application/json"},body:JSON.stringify({bucket,object_id,content})});}catch{return blocked("MASTER_MEMORY_WRITE_TRANSPORT_FAILED","RETRY_AFTER_RUNTIME_NETWORK_CHECK");}
  const payload=await response.json().catch(()=>null);
  if(!response.ok||payload?.ok!==true)return blocked("MASTER_MEMORY_WRITE_REJECTED","REVIEW_MASTER_MEMORY_RESPONSE",{http_status:response.status,response:payload});
  return {ok:true,status:"COMPLETED",verification:"MASTER_MEMORY_WRITE_ACCEPTED",operation:"WRITE_E2E_OBJECT",bucket,object_id,metadata:payload.metadata||payload.object?.metadata||null,content_returned:false,next_action:"VERIFY_MASTER_MEMORY_E2E_READBACK"};
}
export const MASTER_MEMORY_WRITE_ADAPTER_CONTRACT=Object.freeze({version:"1.0.0",system:"MASTER_MEMORY",operation:"WRITE_E2E_OBJECT",mode:"WRITE",authority:"SYSTEM_WRITE_ALLOWED",approval_required:true,allowed_bucket:ALLOWED_BUCKET,object_id_prefix:"E2E-",max_content_bytes:MAX_CONTENT_BYTES,content_returned:false,fail_closed:true,readback_required:true});

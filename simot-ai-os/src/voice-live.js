export async function createGeminiLiveToken(env) {
  if (env.SIMOT_VOICE_TEST_MODE !== "1") {
    return { ok: false, status: 403, error: "VOICE_TEST_MODE_DISABLED" };
  }
  if (!env.GEMINI_API_KEY) return { ok: false, status: 503, error: "GEMINI_API_KEY_NOT_CONFIGURED" };
  const now = Date.now();
  const expireTime = new Date(now + 30 * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(now + 60 * 1000).toISOString();
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
    method: "POST",
    headers: {
      "x-goog-api-key": env.GEMINI_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      uses: 1,
      expireTime,
      newSessionExpireTime,
      bidiGenerateContentSetup: {
        model: "models/gemini-3.8-live",
        generationConfig: { responseModalities: ["AUDIO"] },
        systemInstruction: {
          parts: [{
            text: "You are SIMOT Voice Interface. Speak Persian by default. Be concise, action-oriented, and never claim an action is complete unless SIMOT provides completion evidence."
          }]
        }
      }
    })
  });
  let payload = null;
  try { payload = await response.json(); } catch {}
  if (!response.ok || !payload?.name) {
    return { ok: false, status: 502, error: "GEMINI_EPHEMERAL_TOKEN_FAILED", upstream_status: response.status, details: payload?.error?.message || null };
  }
  return { ok: true, status: 200, token: payload.name, model: "gemini-3.8-live", expires_at: expireTime };
}

export function voicePage() {
  return new Response(`<!doctype html>
<html lang="fa" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SIMOT Voice</title>
<style>
body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:20px;background:#111;color:#eee}
button{font-size:20px;padding:14px 24px;border:0;border-radius:12px;cursor:pointer}#start{background:#fff;color:#111}
#stop{background:#555;color:#fff;margin-right:8px}.on{background:#39d98a!important}.status{margin:20px 0;padding:14px;border-radius:10px;background:#222;white-space:pre-wrap}
</style></head>
<body>
<h1>SIMOT Voice Interface</h1>
<p>Gemini 3.8 Live — real-time voice test</p>
<button id="start">🎙️ شروع مکالمه</button><button id="stop" disabled>⏹ توقف</button>
<div class="status" id="status">آماده</div>
<script>
let ws,ctx,processor,source,playTime=0,closed=false;
const statusEl=document.getElementById('status');
function status(x){statusEl.textContent=x}
function b64(buf){let bytes=new Uint8Array(buf),s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s)}
function unb64(s){let bin=atob(s),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return a.buffer}
function resample(input,from,to){if(from===to)return input;const ratio=from/to,outLen=Math.round(input.length/ratio),out=new Int16Array(outLen);for(let i=0;i<outLen;i++){const p=i*ratio,ip=Math.floor(p),f=p-ip,a=input[Math.min(ip,input.length-1)],b=input[Math.min(ip+1,input.length-1)];out[i]=Math.max(-1,Math.min(1,a+(b-a)*f))*0x7fff}return out}
function playPcm(buf){const a=new Int16Array(buf),samples=new Float32Array(a.length);for(let i=0;i<a.length;i++)samples[i]=a[i]/32768;const b=ctx.createBuffer(1,samples.length,24000);b.copyToChannel(samples,0);const n=ctx.createBufferSource();n.buffer=b;n.connect(ctx.destination);const t=Math.max(ctx.currentTime,playTime);n.start(t);playTime=t+b.duration}
async function start(){
 document.getElementById('start').disabled=true;status('در حال اتصال...');
 const r=await fetch('/voice/token',{method:'POST'});const j=await r.json();if(!j.ok){status('خطا: '+JSON.stringify(j));document.getElementById('start').disabled=false;return}
 ws=new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token='+encodeURIComponent(j.token));
 ws.onopen=async()=>{status('وب‌سوکت وصل شد؛ در حال راه‌اندازی...');document.getElementById('stop').disabled=false;ctx=new AudioContext();await ctx.resume();
  const setup={setup:{model:'models/gemini-3.8-live',config:{generationConfig:{responseModalities:['AUDIO']},systemInstruction:{parts:[{text:'You are SIMOT Voice Interface. Speak Persian by default. Be concise, action-oriented.'}]}}}};ws.send(JSON.stringify(setup));
  setTimeout(()=>{if(ws?.readyState===1&&!window.__simotSetupComplete){status('Gemini setup timeout — waiting for setupComplete');}},10000);
 };
 async function startMicrophone(){
  const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  source=ctx.createMediaStreamSource(stream);processor=ctx.createScriptProcessor(2048,1,1);source.connect(processor);processor.connect(ctx.destination);
  processor.onaudioprocess=e=>{if(ws?.readyState!==1)return;const pcm=resample(e.inputBuffer.getChannelData(0),ctx.sampleRate,16000);ws.send(JSON.stringify({realtimeInput:{audio:{data:b64(pcm.buffer),mimeType:'audio/pcm;rate=16000'}}}))}
  status('متصل — صحبت کنید');
 }
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{status('پاسخ نامعتبر از Gemini دریافت شد');return}if(m.setupComplete){window.__simotSetupComplete=true;status('راه‌اندازی Gemini کامل شد؛ فعال‌سازی میکروفون...');startMicrophone().catch(err=>{status('دسترسی به میکروفون ناموفق: '+err.message);ws?.close()});return}if(m.error){status('Gemini setup/session error: '+JSON.stringify(m.error));ws?.close(1000,'Gemini error');return}if(m.serverContent?.interrupted){playTime=ctx?.currentTime||0}
  const parts=m.serverContent?.modelTurn?.parts||[];for(const p of parts)if(p.inlineData?.data)playPcm(unb64(p.inlineData.data));
  if(m.serverContent?.inputTranscription?.text)status('شما: '+m.serverContent.inputTranscription.text);
  if(m.serverContent?.outputTranscription?.text)status('SIMOT: '+m.serverContent.outputTranscription.text);
 };
 ws.onerror=e=>status('WebSocket error');ws.onclose=e=>{status('اتصال بسته شد — code='+e.code+(e.reason?' reason='+e.reason:''));cleanup()};
}
function cleanup(){processor?.disconnect();source?.disconnect();processor=null;source=null;document.getElementById('start').disabled=false;document.getElementById('stop').disabled=true}
document.getElementById('start').onclick=start;
document.getElementById('stop').onclick=()=>{ws?.close();cleanup()};
</script></body></html>`, {headers:{"content-type":"text/html; charset=utf-8"}});
}
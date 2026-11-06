// Versão de teste: não publicar antes da integração com o aplicativo.
const APP_ID = "93373f2b-4612-4a68-9eaa-c0fdade3aee0";
const APP_URL = "https://brunageo10-ui.github.io/meu-planner-bruna/";
const PROJECT_ID = "meu-planner-bruna";
const CORS = {
  "Access-Control-Allow-Origin": "https://brunageo10-ui.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Vary": "Origin"
};
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{...CORS,"Content-Type":"application/json"}});
const b64 = input => Uint8Array.from(atob(input.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(input.length/4)*4,"=")),c=>c.charCodeAt(0));
let cachedJwks=null,cacheExpires=0;
async function verifyUser(request) {
  const match=/^Bearer\s+(.+)$/i.exec(request.headers.get("Authorization")||"");
  if(!match)throw new Error("AUTH_REQUIRED");
  const parts=match[1].split(".");
  if(parts.length!==3)throw new Error("INVALID_TOKEN");
  let head,claims;
  try{head=JSON.parse(new TextDecoder().decode(b64(parts[0])));claims=JSON.parse(new TextDecoder().decode(b64(parts[1])))}catch(e){throw new Error("INVALID_TOKEN")}
  const now=Math.floor(Date.now()/1000);
  if(head.alg!=="RS256"||typeof head.kid!=="string"||
     claims.aud!==PROJECT_ID||claims.iss!=="https://securetoken.google.com/"+PROJECT_ID||
     typeof claims.sub!=="string"||!claims.sub||claims.sub.length>128||
     typeof claims.exp!=="number"||claims.exp<=now||
     typeof claims.iat!=="number"||claims.iat>now||
     typeof claims.auth_time!=="number"||claims.auth_time>now)throw new Error("INVALID_TOKEN");
  async function refreshJwks(){
    const response=await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
    if(!response.ok)throw new Error("AUTH_UNAVAILABLE");
    const keys=await response.json();
    if(!Array.isArray(keys.keys))throw new Error("AUTH_UNAVAILABLE");
    cachedJwks=keys;
    const maxAge=Number(/max-age=(\d+)/.exec(response.headers.get("cache-control")||"")?.[1]||600);
    cacheExpires=Date.now()+Math.min(Math.max(maxAge,60),3600)*1000;
  }
  if(!cachedJwks||Date.now()>=cacheExpires)await refreshJwks();
  let jwk=cachedJwks.keys.find(k=>k.kid===head.kid&&k.kty==="RSA");
  // Chaves públicas do Firebase podem mudar antes do fim do cache.
  if(!jwk){await refreshJwks();jwk=cachedJwks.keys.find(k=>k.kid===head.kid&&k.kty==="RSA")}
  if(!jwk)throw new Error("INVALID_TOKEN");
  const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  const signed=new TextEncoder().encode(parts[0]+"."+parts[1]);
  if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,b64(parts[2]),signed))throw new Error("INVALID_TOKEN");
  return claims.sub;
}
async function oneSignalFetch(url,options,env){
  const base={...options,headers:{...(options.headers||{}),"Authorization":"Key "+env.ONESIGNAL_REST_API_KEY}};
  let response=await fetch(url,base);
  if(response.status===401||response.status===403){
    response=await fetch(url,{...options,headers:{...(options.headers||{}),"Authorization":"Basic "+env.ONESIGNAL_REST_API_KEY}});
  }
  return response;
}
const notificationUrl=id=>"https://api.onesignal.com/notifications/"+encodeURIComponent(id)+"?app_id="+encodeURIComponent(APP_ID);
async function schedule(data,uid,env){
  const sub=String(data.subscriptionId||"");
  const date=new Date(data.sendAfter);
  if(!/^[a-zA-Z0-9-]{16,150}$/.test(sub)||!data.sendAfter||!Number.isFinite(date.getTime()))return json({ok:false,error:"Dados de lembrete inválidos."},400);
  if(date.getTime()<=Date.now()-60000||date.getTime()>Date.now()+366*86400000)return json({ok:false,error:"Data fora do período permitido."},400);
  const title=String(data.title||"Meu Planner 💛").slice(0,120);
  const message=String(data.message||"Você tem um lembrete.").slice(0,300);
  const payload={app_id:APP_ID,target_channel:"push",include_subscription_ids:[sub],
    headings:{en:title},contents:{en:message},send_after:date.toISOString(),url:APP_URL};
  const response=await oneSignalFetch("https://api.onesignal.com/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)},env);
  const raw=await response.text();let result={};
  try{result=JSON.parse(raw)}catch(e){}
  if(!response.ok||!result.id)return json({ok:false,error:"Agendamento não confirmado.",details:result},response.ok?502:response.status);
  try{
    await env.DB.prepare("INSERT INTO notification_owners (notification_id,user_uid,subscription_id,send_after,status) VALUES (?,?,?,?,?)")
      .bind(String(result.id),uid,sub,date.toISOString(),"scheduled").run();
  }catch(e){
    await oneSignalFetch(notificationUrl(result.id),{method:"DELETE"},env).catch(()=>{});
    return json({ok:false,error:"Não foi possível registrar a propriedade do lembrete."},503);
  }
  return json(result,200);
}
async function cancel(data,uid,env){
  const id=String(data.notificationId||"");
  if(!/^[a-zA-Z0-9-]{8,150}$/.test(id))return json({ok:false,error:"Identificador inválido."},400);
  const row=await env.DB.prepare("SELECT user_uid,status FROM notification_owners WHERE notification_id=?").bind(id).first();
  if(!row||row.user_uid!==uid)return json({ok:false,error:"Lembrete não encontrado nesta conta."},404);
  if(row.status==="cancelled")return json({ok:true,success:true,alreadyCancelled:true});
  const response=await oneSignalFetch(notificationUrl(id),{method:"DELETE"},env);
  const raw=await response.text();let result={};
  try{result=JSON.parse(raw)}catch(e){}
  if(!response.ok&&response.status!==404)return json({ok:false,error:"Cancelamento não confirmado.",details:result},502);
  await env.DB.prepare("UPDATE notification_owners SET status='cancelled' WHERE notification_id=? AND user_uid=?").bind(id,uid).run();
  return json({ok:true,success:true});
}
export default {
  async fetch(request,env){
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
    if(request.method!=="POST")return json({ok:true,message:"Servidor de lembretes preparado para contas individuais."});
    if(!env.ONESIGNAL_REST_API_KEY||!env.DB)return json({ok:false,error:"Serviço não configurado."},503);
    let uid;
    try{uid=await verifyUser(request)}catch(e){return json({ok:false,error:"Autenticação necessária."},e.message==="AUTH_UNAVAILABLE"?503:401)}
    try{
      const data=await request.json();
      if(data?.action==="cancel")return await cancel(data,uid,env);
      return await schedule(data||{},uid,env);
    }catch(e){return json({ok:false,error:"Não foi possível processar o lembrete."},500)}
  }
};
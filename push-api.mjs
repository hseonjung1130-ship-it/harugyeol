import {json,keyForToken,vapidReady,configurePush,store,validSubscription,normalizeItems} from '../lib/push-common.mjs';
export default async function handler(req){
 if(req.method==='GET')return json({ready:vapidReady(),vapidPublicKey:vapidReady()?process.env.VAPID_PUBLIC_KEY:null});
 if(req.method!=='POST')return json({error:'허용되지 않은 요청'},405);
 if(!vapidReady())return json({error:'서버 VAPID 설정이 없어.'},503);
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'같은 사이트에서만 사용할 수 있어.'},403);
 const key=keyForToken(req.headers.get('x-harugyeol-token'));
 if(!key)return json({error:'기기 인증 정보가 없어.'},403);
 const len=Number(req.headers.get('content-length')||'0');if(len>45000)return json({error:'요청 크기가 너무 커.'},413);
 let body;try{body=await req.json()}catch{return json({error:'잘못된 요청'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'잘못된 요청'},400);
 if(JSON.stringify(body).length>45000)return json({error:'요청 크기가 너무 커.'},413);
 const blobs=store();
 try{
  if(body.action==='sync'){
   if(!validSubscription(body.subscription))return json({error:'유효하지 않은 알림 구독 정보야.'},400);
   const items=normalizeItems(body.items);
   const prev=await blobs.get(key,{type:'json'});
   await blobs.setJSON(key,{subscription:body.subscription,items,sentDay:prev?.sentDay||'',testSentAt:prev?.testSentAt||0,updatedAt:new Date().toISOString()});
   return json({ok:true,count:items.length});
  }
  if(body.action==='disable'){await blobs.delete(key);return json({ok:true})}
  if(body.action==='test'){
   const entry=await blobs.get(key,{type:'json'});
   if(!entry?.subscription)return json({error:'먼저 알림을 켜 줘.'},404);
   if(Date.now()-(entry.testSentAt||0)<60000)return json({error:'테스트 알림은 1분 뒤에 다시 시도해 줘.'},429);
   entry.testSentAt=Date.now();await blobs.setJSON(key,entry);
   try{await configurePush().sendNotification(entry.subscription,JSON.stringify({title:'하루결 · 알림 테스트',body:'알림 연결 성공! 마감 일정이 다가오면 알려줄게.',tag:'harugyeol-test'}),{TTL:300});return json({ok:true})}
   catch(e){if([404,410].includes(e.statusCode)){await blobs.delete(key);return json({error:'구독이 만료됐어. 알림을 다시 켜 줘.'},410)}return json({error:'테스트 전송 실패. 서버 설정을 확인해 줘.'},502)}
  }
  return json({error:'알 수 없는 요청'},400);
 }catch(e){console.error('push-api error',e);return json({error:'알림 서버 오류가 발생했어.'},500)}
}

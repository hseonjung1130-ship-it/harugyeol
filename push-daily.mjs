import {configurePush,store,vapidReady} from '../lib/push-common.mjs';
// 한국 시간 08:00 = UTC 이전 날 23:00. Netlify cron은 UTC 기준.
export const config={schedule:'0 23 * * *'};
const seoulDay=()=>new Date(Date.now()+9*3600000).toISOString().slice(0,10);
const addDay=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
function message(items,today,tomorrow){
 const selected=items.filter(x=>x.date===today||x.date===tomorrow);
 if(!selected.length)return null;
 const dueToday=selected.filter(x=>x.date===today),dueTomorrow=selected.filter(x=>x.date===tomorrow);
 const first=dueToday[0]||dueTomorrow[0];
 const heading=dueToday.length?`오늘 마감 ${dueToday.length}개`:`내일 마감 ${dueTomorrow.length}개`;
 const body=selected.length===1?`${first.kind} · ${first.title} · ${first.date===today?'오늘':'내일'}까지`:
 `${heading}${dueTomorrow.length&&dueToday.length?` · 내일 ${dueTomorrow.length}개`:''} · ${first.title} 외 ${selected.length-1}개`;
 return {title:'하루결 · 마감 일정 알림',body:body.slice(0,240),tag:'harugyeol-daily-'+today};
}
export default async function handler(){
 if(!vapidReady()){console.error('VAPID keys missing');return}
 const blobs=store();const today=seoulDay(),tomorrow=addDay(today,1);let attempted=0,sent=0,failed=0;
 for await (const batch of blobs.list({paginate:true})){
  for(const item of batch.blobs){
   let entry;try{entry=await blobs.get(item.key,{type:'json'})}catch{failed++;continue}
   if(!entry?.subscription||entry.sentDay===today)continue;
   const notification=message(entry.items||[],today,tomorrow);if(!notification)continue;
   attempted++;
   try{
    await configurePush().sendNotification(entry.subscription,JSON.stringify(notification),{TTL:43200});
    entry.sentDay=today;await blobs.setJSON(item.key,entry);sent++;
   }catch(e){failed++;if([404,410].includes(e.statusCode))await blobs.delete(item.key);else console.error('push daily error',e.statusCode||e.message)}
   // 간단한 개인용 앱: 서버 실행시간을 넘지 않도록 최대 50개 기기까지만 처리.
   if(attempted>=50){console.log('daily limit reached, remaining entries deferred');break}
  }
  if(attempted>=50)break;
 }
 console.log(JSON.stringify({day:today,attempted,sent,failed}));
}

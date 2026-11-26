import {createHash} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import webpush from 'web-push';
export const store=()=>getStore({name:'harugyeol-push-subs',consistency:'strong'});
export const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'none'}});
export function keyForToken(token){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return null;return createHash('sha256').update(token).digest('hex')}
export function vapidReady(){return !!(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.VAPID_SUBJECT)}
export function configurePush(){webpush.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);return webpush}
export function validSubscription(s){
 if(!s||typeof s!=='object'||typeof s.endpoint!=='string'||!s.keys||typeof s.keys.p256dh!=='string'||typeof s.keys.auth!=='string')return false;
 try{const url=new URL(s.endpoint);if(url.protocol!=='https:')return false;const host=url.hostname.toLowerCase();
 const allowed=['push.apple.com','push.services.mozilla.com','fcm.googleapis.com','fcm-xm.googleapis.com','notify.windows.com','wns.windows.com'];
 if(!allowed.some(d=>host===d||host.endsWith('.'+d)))return false;
 return s.endpoint.length<2100&&s.keys.p256dh.length<300&&s.keys.auth.length<300;
 }catch{return false}
}
export function normalizeItems(items){
 if(!Array.isArray(items)||items.length>200)throw new Error('일정이 너무 많아.');
 return items.map(x=>({id:String(x.id??'').slice(0,100),title:String(x.title??'').slice(0,110),date:String(x.date??''),kind:String(x.kind??'일정').slice(0,15)}))
  .filter(x=>x.id&&x.title&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&['시험','수행평가','과제','잊지 말기'].includes(x.kind));
}

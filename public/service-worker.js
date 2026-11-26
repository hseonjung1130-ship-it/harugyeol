/* 하루결 웹 푸시 알림 전용 서비스 워커 — 캐싱하지 않아 최신 앱 버전 유지 */
self.addEventListener('push',event=>{
 let msg={title:'하루결 알림',body:'오늘 확인할 일정이 있어.'};
 try{if(event.data)msg={...msg,...event.data.json()}}catch{}
 const title=String(msg.title||'하루결 알림').slice(0,80);
 const options={body:String(msg.body||'').slice(0,260),icon:'./icon-192.png',badge:'./icon-192.png',tag:String(msg.tag||'harugyeol'),data:{url:new URL('./index.html',self.registration.scope).href}};
 event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  const url=new URL('./index.html',self.registration.scope).href;
  const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
  const existing=windows.find(w=>w.url.startsWith(self.registration.scope));
  if(existing){await existing.focus();return}
  if(clients.openWindow)await clients.openWindow(url);
 })());
});

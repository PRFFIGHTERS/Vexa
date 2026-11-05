/* ============================================================
   PUSH ПОДПИСКА
   ============================================================ */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeToPush(){
  if (!('serviceWorker' in navigator)) { toast('Нет Service Worker', 'err'); return false; }
  if (!('PushManager' in window)) { toast('Нет PushManager (iOS < 16.4?)', 'err'); return false; }
  if (!('Notification' in window)) { toast('Нет Notification API', 'err'); return false; }
  if (!State.me) { toast('Не авторизован', 'err'); return false; }

  let perm;
  try { perm = await Notification.requestPermission(); }
  catch(e){ toast('requestPermission: ' + e.message, 'err'); return false; }
  if (perm !== 'granted'){ toast('Разрешение: ' + perm, 'err'); return false; }

  let reg;
  try {
    reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, rej) => setTimeout(() => rej(new Error('SW timeout 5s')), 5000))
    ]);
  } catch(e) { toast('SW: ' + e.message, 'err'); return false; }

  let keyData;
  try {
    const keyRes = await fetch(API + '/api/vapid-public-key');
    keyData = await keyRes.json();
  } catch(e) { toast('VAPID: ' + e.message, 'err'); return false; }
  if (!keyData.publicKey){ toast('VAPID пустой', 'err'); return false; }

  let sub;
  try {
    sub = await reg.pushManager.getSubscription();
    if (!sub){
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
      });
    }
  } catch(e) { toast('Subscribe: ' + e.message, 'err'); return false; }

  try {
    const r = await fetch(API + '/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: String(State.me.id),
        subscription: sub.toJSON()
      })
    });
    const d = await r.json();
    if (!d.ok) { toast('Сервер: ' + JSON.stringify(d), 'err'); return false; }
  } catch(e) { toast('Запрос: ' + e.message, 'err'); return false; }

  localStorage.setItem('vexa.push.enabled', '1');
  toast('Подписка активна!', 'ok');
  return true;
}

/* ============================================================
   SERVICE WORKER
   ============================================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('SW registration failed:', err);
    });
  });
}

window.addEventListener('load', () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                    || window.navigator.standalone === true;
  if (isStandalone) {
    document.documentElement.setAttribute('data-pwa', 'true');
  }
});

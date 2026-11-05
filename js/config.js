/* ============================================================
   VEXA — v2 with swipe, drag nav, privacy, pages
   ============================================================ */

const API = 'https://vexam.onrender.com';

/* ============================================================
   SUPABASE CONFIG — ЗАПОЛНЕНО
   ============================================================ */
const SUPABASE_URL       = 'https://jcalywspjwmeltmvzfzx.supabase.co';
const SUPABASE_ANON_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYWx5d3NwandtZWx0bXZ6Znp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjcwNDEsImV4cCI6MjEwNTc0MzA0MX0.ENylLxDollYOyG0Ky8e50KFxLabHjTVwxZKpnnS0sYA';
const SUPABASE_BUCKET    = 'avatars';
const SUPABASE_CONFIGURED = !SUPABASE_URL.includes('YOUR-PROJECT');

/* Supabase client для Auth (email-коды) */
const supabaseAuth = (SUPABASE_CONFIGURED && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/* Загрузка файла в Supabase Storage (аватары).
   Возвращает публичный URL или null, если Supabase не настроен. */
async function uploadAvatarToSupabase(userId, blob){
  if (!SUPABASE_CONFIGURED) return null;
  const path = `${String(userId)}/${Date.now()}.png`;
  const url = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'image/png',
      'cache-control': '3600',
      'x-upsert': 'true'
    },
    body: blob
  });
  if (!res.ok){
    const txt = await res.text().catch(()=>'');
    throw new Error(txt || ('HTTP ' + res.status));
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
}

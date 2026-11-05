/* ============================================================
   EMAIL VALIDATION — обязательно с @ и доменом
   ============================================================ */
function emailValid(v){
  const s = String(v||'').trim();
  if (!s) return false;
  if (!s.includes('@')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

let toastTimer;
function toast(msg, kind){
  const el = document.getElementById('toast');
  el.className = ''; el.textContent = msg;
  if (kind) el.classList.add(kind);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}
function showScreen(id){ document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }
function initials(u){ if (!u) return '?'; const a=(u.firstName||'')[0]||'', b=(u.lastName||'')[0]||''; return ((a+b)||(u.username||'')[0]||'?').toUpperCase(); }
function displayName(u){ if (!u) return '—'; return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.email || '—'; }
function el(h){ const tpl=document.createElement('template'); tpl.innerHTML=h.trim(); return tpl.content.firstElementChild; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtTime(ts){ const d=new Date(ts); return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0'); }
function fmtDay(ts){
  const d=new Date(ts), n=new Date();
  if (d.toDateString() === n.toDateString()) return LANG==='ru' ? 'Сегодня' : 'Today';
  const y=new Date(n); y.setDate(n.getDate()-1);
  if (d.toDateString() === y.toDateString()) return LANG==='ru' ? 'Вчера' : 'Yesterday';
  return d.toLocaleDateString(LANG === 'ru' ? 'ru-RU' : 'en-GB', {day:'2-digit', month:'short'});
}
function fmtDate(ts){
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString(LANG==='ru'?'ru-RU':'en-GB',{day:'2-digit',month:'long',year:'numeric'});
}

function canSee(viewerId, ownerId, field){
  if (String(viewerId) === String(ownerId)) return true;
  const owner = DB.findUserById(ownerId);
  if (!owner) return true;
  const val = (owner.privacy && owner.privacy[field]) || 'everyone';
  if (val === 'everyone') return true;
  if (val === 'nobody') return false;
  if (val === 'contacts') return DB.isContact(ownerId, viewerId);
  return true;
}

function lastSeenText(u){
  if (!u) return '';
  const now = Date.now();
  const isOnline = u.lastSeen && (now - u.lastSeen < 60_000);
  if (isOnline && canSee(State.me.id, u.id, 'online')) return t('status.online');
  if (!canSee(State.me.id, u.id, 'lastSeen')) return t('status.hidden');
  if (!u.lastSeen) return t('status.recently');
  const diff = now - u.lastSeen;
  if (diff < 60_000) return t('status.just_now');
  if (diff < 3_600_000) return `${Math.floor(diff/60_000)} ${t('status.min_ago')}`;
  const d = new Date(u.lastSeen);
  const today = new Date(); today.setHours(0,0,0,0);
  if (d >= today) return `${t('status.was_at')} ${fmtTime(u.lastSeen)}`;
  const yest = new Date(today); yest.setDate(yest.getDate()-1);
  if (d >= yest) return `${t('status.was_yesterday')} ${fmtTime(u.lastSeen)}`;
  return `${t('status.was_at')} ${d.toLocaleDateString(LANG==='ru'?'ru-RU':'en-GB',{day:'2-digit',month:'short'})} ${fmtTime(u.lastSeen)}`;
}

function applyTheme(mode){
  let th = mode;
  if (mode === 'system') th = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', th);
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const sid = DB.getSession(); if (!sid) return;
  if (DB.getSettings(sid).theme === 'system') applyTheme('system');
});

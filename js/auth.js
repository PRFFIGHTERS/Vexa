/* ============================================================
   AUTH FLOW (PHONE + SUPABASE SMS OTP)
   ============================================================ */

const COUNTRIES = [
  { code: '7', flag: '🇷🇺', name: 'Россия / Казахстан', mask: '(999) 999-99-99' },
  { code: '375', flag: '🇧🇾', name: 'Беларусь', mask: '(99) 999-99-99' },
  { code: '380', flag: '🇺🇦', name: 'Украина', mask: '(99) 999-99-99' },
  { code: '998', flag: '🇺🇿', name: 'Узбекистан', mask: '(99) 999-99-99' },
  { code: '996', flag: '🇰🇬', name: 'Кыргызстан', mask: '(999) 999-999' },
  { code: '992', flag: '🇹🇯', name: 'Таджикистан', mask: '(99) 999-9999' },
  { code: '374', flag: '🇦🇲', name: 'Армения', mask: '(99) 999-999' },
  { code: '994', flag: '🇦🇿', name: 'Азербайджан', mask: '(99) 999-99-99' },
  { code: '373', flag: '🇲🇩', name: 'Молдова', mask: '(99) 999-999' }
];

let currentCountry = COUNTRIES[0];

const emailInput = document.getElementById('emailInput');
const btnSendCode = document.getElementById('btnSendCode');
const phoneErr = document.getElementById('phoneErr');
const countryBtn = document.getElementById('countryBtn');
const countryDropdown = document.getElementById('countryDropdown');
const currentFlag = document.getElementById('currentFlag');
const currentCode = document.getElementById('currentCode');

function renderCountries() {
  if (!countryDropdown) return;
  countryDropdown.innerHTML = COUNTRIES.map(c => `
    <div class="country-item" data-code="${c.code}">
      <span class="flag">${c.flag}</span>
      <span class="name">${c.name}</span>
      <span class="code">+${c.code}</span>
    </div>
  `).join('');

  document.querySelectorAll('.country-item').forEach(item => {
    item.onclick = () => {
      const code = item.dataset.code;
      currentCountry = COUNTRIES.find(c => c.code === code);
      updateCountryUI();
      countryDropdown.classList.remove('open');
      emailInput.focus();
    };
  });
}

function updateCountryUI() {
  currentFlag.textContent = currentCountry.flag;
  currentCode.textContent = '+' + currentCountry.code;
  emailInput.placeholder = currentCountry.mask.replace(/9/g, '0');
}

countryBtn.onclick = (e) => {
  e.preventDefault();
  countryDropdown.classList.toggle('open');
};

document.addEventListener('click', (e) => {
  if (countryBtn && countryDropdown) {
    if (!countryBtn.contains(e.target) && !countryDropdown.contains(e.target)) {
      countryDropdown.classList.remove('open');
    }
  }
});

emailInput.addEventListener('input', (e) => {
  let raw = e.target.value.replace(/\D/g, '');
  
  if (!raw) {
    e.target.value = '';
    refreshSend();
    return;
  }

  // Автоопределение страны по первым цифрам (если юзер сам вставил +375...)
  if (raw.length >= 3 || (raw.length === 1 && raw === '7')) {
    const found = COUNTRIES.find(c => raw.startsWith(c.code) && raw.length > c.code.length);
    if (found && found.code !== currentCountry.code) {
      currentCountry = found;
      updateCountryUI();
      raw = raw.slice(currentCountry.code.length);
    }
  }

  // Маска
  let formatted = '';
  let maskIndex = 0;
  for (let i = 0; i < currentCountry.mask.length; i++) {
    if (maskIndex >= raw.length) break;
    if (currentCountry.mask[i] === '9') {
      formatted += raw[maskIndex];
      maskIndex++;
    } else {
      formatted += currentCountry.mask[i];
    }
  }

  e.target.value = formatted;
  refreshSend();
});

// Включает кнопку, как только введено достаточно цифр
function refreshSend(){
  const rawNumber = emailInput.value.replace(/\D/g, '');
  const ok = rawNumber.length >= 8; 
  btnSendCode.disabled = !ok;
  phoneErr.textContent = '';
}

btnSendCode.onclick = async () => {
  const rawNumber = emailInput.value.replace(/\D/g, '');
  const phone = '+' + currentCountry.code + rawNumber;

  if (!phoneValid(phone)) {
    phoneErr.textContent = 'Введите корректный номер';
    return;
  }
  if (!supabaseAuth){
    toast('Supabase не настроен', 'err');
    return;
  }

  btnSendCode.disabled = true;
  phoneErr.textContent = '';

  try {
    const { error } = await supabaseAuth.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: true }
    });
    if (error){
      toast(error.message || 'Ошибка сервера', 'err');
      btnSendCode.disabled = false;
      return;
    }

    State.tempEmail = phone;
    document.getElementById('otpSub').textContent =
      (LANG==='ru' ? 'Мы отправили SMS на ' : 'We sent an SMS to ') + phone;

    const cb = document.getElementById('codeBanner');
    cb.dataset.mode = 'info';
    cb.innerHTML = t('otp.check_mail');

    document.querySelectorAll('.otp-cell').forEach(c => c.value = '');
    btnVerify.disabled = true;
    showScreen('otp');
    startResend();
    setTimeout(() => document.querySelectorAll('.otp-cell')[0].focus(), 100);
    toast(t('toast.code_sent'), 'ok');
  } catch (e) {
    console.error(e);
    toast(e.message || 'Ошибка сервера', 'err');
    btnSendCode.disabled = false;
  }
};

document.getElementById('authBack').onclick = () => showScreen('welcome');
document.getElementById('authToLogin').onclick = () => emailInput.focus();
document.getElementById('otpBack').onclick = () => showScreen('auth');
document.getElementById('otpChange').onclick = () => { showScreen('auth'); emailInput.focus(); };

renderCountries();
updateCountryUI();

// ====== OTP ЛОГИКА ======
const otpCells = [...document.querySelectorAll('.otp-cell')];
const btnVerify = document.getElementById('btnVerify');
const otpResend = document.getElementById('otpResend');
const otpTimer = document.getElementById('otpTimer');
let resendInterval;
function otpValue(){ return otpCells.map(c => c.value).join(''); }
function refreshVerify(){ btnVerify.disabled = otpValue().length !== 6; }
otpCells.forEach((cell, i) => {
  cell.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g,'');
    if (v.length > 1){
      const arr = v.split('');
      for (let k=0;k<arr.length && i+k<6;k++) otpCells[i+k].value = arr[k];
      otpCells[Math.min(5, i+arr.length)].focus();
    } else { cell.value = v; if (v && i < 5) otpCells[i+1].focus(); }
    refreshVerify();
  });
  cell.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !cell.value && i > 0) otpCells[i-1].focus();
    if (e.key === 'ArrowLeft' && i > 0) otpCells[i-1].focus();
    if (e.key === 'ArrowRight' && i < 5) otpCells[i+1].focus();
  });
  cell.addEventListener('paste', e => {
    e.preventDefault();
    const txt = (e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);
    for (let k=0;k<6;k++) otpCells[k].value = txt[k] || '';
    otpCells[Math.min(5, txt.length)].focus();
    refreshVerify();
  });
});
function startResend(){
  let left = 60; otpResend.classList.add('disabled'); otpTimer.textContent = left;
  clearInterval(resendInterval);
  resendInterval = setInterval(() => {
    left--; otpTimer.textContent = left;
    if (left <= 0){ clearInterval(resendInterval); otpResend.classList.remove('disabled'); }
  }, 1000);
}
otpResend.onclick = async () => {
  if (otpResend.classList.contains('disabled')) return;
  if (!State.tempEmail || !supabaseAuth) return;
  try {
    const { error } = await supabaseAuth.auth.signInWithOtp({ phone: State.tempEmail });
    if (error){ toast(error.message, 'err'); return; }
    document.querySelectorAll('.otp-cell').forEach(c => c.value = '');
    btnVerify.disabled = true;
    startResend();
    toast(t('toast.code_sent'), 'ok');
  } catch(e){
    toast(t('toast.server_error'), 'err');
  }
};

btnVerify.onclick = async () => {
  const token = otpValue();
  if (token.length !== 6){ toast(t('err.otp'), 'err'); return; }
  const phone = State.tempEmail;
  if (!phone){ showScreen('auth'); return; }
  if (!supabaseAuth){ toast('Supabase не настроен', 'err'); return; }

  btnVerify.disabled = true;

  try {
    const { data, error } = await supabaseAuth.auth.verifyOtp({
      phone, token, type: 'sms'
    });
    if (error){
      toast(t('err.otp'), 'err');
      btnVerify.disabled = false;
      return;
    }

    const supabaseUser = data.user;
    const uid = String(supabaseUser.id);

    let localUser = DB.findUserById(uid);
    if (localUser){
      DB.setSession(uid);
      bootUser(uid);
      return;
    }

    try {
      const r = await fetch(API + '/api/find-by-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const d = await r.json();
      if (d && d.found && d.user){
        localUser = DB.createUser({
          id: uid,
          phone: d.user.phone || phone,
          firstName: d.user.first_name,
          lastName: d.user.last_name,
          username: d.user.username,
          bio: d.user.bio || '',
          avatar: d.user.avatar || null,
          lastSeen: d.user.last_seen ? new Date(d.user.last_seen).getTime() : Date.now()
        });
        DB.setSession(uid);
        bootUser(uid);
        return;
      }
    } catch(e){ console.error('find-by-phone', e); }

    State.tempSupabaseId = uid;
    showScreen('nameScreen');
    document.getElementById('inpName').focus();
  } catch(e){
    console.error(e);
    toast(t('toast.server_error'), 'err');
    btnVerify.disabled = false;
  }
};

const inpName = document.getElementById('inpName');
const inpSurname = document.getElementById('inpSurname');
const inpUsername = document.getElementById('inpUsername');
const btnCreate = document.getElementById('btnCreate');
const usernameHint = document.getElementById('usernameHint');
function refreshCreate(){ btnCreate.disabled = !inpName.value.trim(); }
inpName.addEventListener('input', refreshCreate);
let unameTimer;
inpUsername.addEventListener('input', () => {
  inpUsername.value = inpUsername.value.toLowerCase().replace(/[^a-z0-9_]/g,'');
  clearTimeout(unameTimer);
  const v = inpUsername.value;
  usernameHint.textContent = ''; usernameHint.style.color = '';
  if (!v) return;
  if (v.length < 3){ usernameHint.textContent = 'Минимум 3 символа'; usernameHint.style.color='var(--danger)'; return; }
  unameTimer = setTimeout(async () => {
    try {
      const r = await fetch(API + '/api/check-username/' + encodeURIComponent(v));
      const d = await r.json();
      if (d.taken){ usernameHint.textContent = t('toast.username_taken'); usernameHint.style.color='var(--danger)'; }
      else { usernameHint.textContent = t('toast.username_free'); usernameHint.style.color='var(--ok)'; }
    } catch {
      usernameHint.textContent = 'Ошибка проверки';
      usernameHint.style.color = 'var(--danger)';
    }
  }, 300);
});
btnCreate.onclick = async () => {
  const name = inpName.value.trim();
  if (!name){ toast(t('toast.fill_name'), 'err'); return; }
  const uname = inpUsername.value.trim() || null;

  btnCreate.disabled = true;
  try {
    const res = await fetch(API + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: State.tempSupabaseId,
        phone: State.tempEmail,
        firstName: name,
        lastName: inpSurname.value.trim() || null,
        username: uname
      })
    });
    const data = await res.json();

    if (data.error === 'username_taken'){
      toast(t('toast.username_taken'), 'err');
      btnCreate.disabled = false;
      return;
    }
    if (!data.ok){
      toast(t('toast.server_error'), 'err');
      btnCreate.disabled = false;
      return;
    }

    const srv = data.user;
    const uidStr = String(srv.id || State.tempSupabaseId);
    let localUser = DB.findUserById(uidStr);
    if (!localUser){
      localUser = DB.createUser({
        id: uidStr,
        phone: srv.phone || State.tempEmail,
        firstName: srv.first_name,
        lastName: srv.last_name,
        username: srv.username,
        bio: srv.bio || '',
        avatar: srv.avatar || null
      });
    }
    DB.setSession(localUser.id);
    inpName.value = inpSurname.value = inpUsername.value = '';
    refreshCreate();
    bootUser(localUser.id);
    toast(t('toast.welcome'), 'ok');
  } catch (e) {
    console.error(e);
    toast(t('toast.no_connection'), 'err');
    btnCreate.disabled = false;
  }
};

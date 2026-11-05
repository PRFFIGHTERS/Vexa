/* ============================================================
   PROFILE PAGE (с загрузкой аватарки в Supabase)
   ============================================================ */
function openProfilePage(){
  const u = State.me;
  openPage({
    title: t('profile.edit'),
    bodyHtml: `
      <div class="profile-hero">
        <div class="avatar av-96" id="pfAvatar" style="cursor:pointer">
          ${u.avatar ? `<img src="${esc(u.avatar)}" alt=""/>` : esc(initials(u))}
        </div>
        <div id="pfAvatarHint" style="color:var(--accent);font-size:13px;font-weight:600;cursor:pointer;margin-top:-6px;display:inline-flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          <span>${LANG==='ru'?'Сменить фото':'Change photo'}</span>
        </div>
      </div>
      <div class="set-list">
        <label class="lbl" style="padding:12px 18px 0">${esc(t('profile.first'))}</label>
        <div class="set-row" style="padding:0 18px 12px">
          <input class="field" id="pfFirst" value="${esc(u.firstName||'')}"/>
        </div>
        <label class="lbl" style="padding:0 18px 0">${esc(t('profile.last'))}</label>
        <div class="set-row" style="padding:0 18px 12px">
          <input class="field" id="pfLast" value="${esc(u.lastName||'')}"/>
        </div>
        <label class="lbl" style="padding:0 18px 0">${esc(t('profile.user'))}</label>
        <div class="set-row" style="padding:0 18px 12px">
          <input class="field" id="pfUser" value="${esc(u.username||'')}"/>
        </div>
        <label class="lbl" style="padding:0 18px 0">${esc(t('profile.bio'))}</label>
        <div class="set-row" style="padding:0 18px 12px">
          <input class="field" id="pfBio" value="${esc(u.bio||'')}"/>
        </div>
        <label class="lbl" style="padding:0 18px 0">${esc(t('profile.birthday'))}</label>
        <div class="set-row" style="padding:0 18px 12px">
          <input class="field" id="pfBday" type="date" value="${u.birthday ? new Date(u.birthday).toISOString().slice(0,10) : ''}"/>
        </div>
        <label class="lbl" style="padding:0 18px 0">${esc(t('profile.phone'))}</label>
        <div class="set-row" style="padding:0 18px 12px">
          <input class="field" value="${esc(u.email||'')}" disabled style="opacity:.6"/>
        </div>
      </div>
      <div style="padding:0 16px 30px">
        <button type="button" class="btn" id="pfSave">${esc(t('profile.save'))}</button>
      </div>`,
    onMount: p => {
      const pickAvatar = () => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*';
        inp.onchange = () => {
          const f = inp.files[0]; if (!f) return;
          if (!f.type.startsWith('image/')){ toast(LANG==='ru'?'Нужно изображение':'Image required', 'err'); return; }
          if (f.size > 8 * 1024 * 1024){
            toast(LANG==='ru'?'Файл слишком большой (макс 8 МБ)':'File too large (max 8 MB)', 'err');
            return;
          }
          openAvatarCropper(f, async (blob, dataURL) => {
            const av = p.querySelector('#pfAvatar');
            av.innerHTML = `<img src="${dataURL}" alt=""/>`;
            DB.updateUser(State.me.id, { avatar: dataURL });
            State.me = DB.findUserById(State.me.id);
            updateMePanel();
            renderChats();

            if (SUPABASE_CONFIGURED){
              try {
                const pub = await uploadAvatarToSupabase(State.me.id, blob);
                if (pub){
                  DB.updateUser(State.me.id, { avatar: pub });
                  State.me = DB.findUserById(State.me.id);
                  av.innerHTML = `<img src="${pub}" alt=""/>`;
                  updateMePanel();
                  renderChats();
                  toast(t('toast.profile_saved'), 'ok');
                }
              } catch(e){
                console.error('Supabase upload failed:', e);
                toast(LANG==='ru'?'Не удалось загрузить на сервер, сохранено локально':'Upload failed, saved locally', 'err');
              }
            } else {
              toast(t('toast.profile_saved'), 'ok');
            }
          });
        };
        inp.click();
      };
      p.querySelector('#pfAvatar').onclick = pickAvatar;
      p.querySelector('#pfAvatarHint').onclick = pickAvatar;

      const saveBtn = p.querySelector('#pfSave');
      let touched = false, tsX = 0, tsY = 0;

      const doSave = () => {
        if (saveBtn.disabled) return;
        const first = p.querySelector('#pfFirst').value.trim();
        const last = p.querySelector('#pfLast').value.trim() || null;
        const un = p.querySelector('#pfUser').value.trim().toLowerCase().replace(/[^a-z0-9_]/g,'') || null;
        const bio = p.querySelector('#pfBio').value.trim() || null;
        const bdayVal = p.querySelector('#pfBday').value;
        const birthday = bdayVal ? new Date(bdayVal).getTime() : null;
        if (!first){ toast(t('toast.fill_name'), 'err'); return; }
        if (un){
          const ex = DB.findUserByUsername(un);
          if (ex && String(ex.id) !== String(State.me.id)){ toast(t('toast.username_taken'), 'err'); return; }
        }
        saveBtn.disabled = true;
        DB.updateUser(State.me.id, {firstName:first, lastName:last, username:un, bio, birthday});
        State.me = DB.findUserById(State.me.id);
        updateMePanel();
        toast(t('toast.profile_saved'), 'ok');
        closeTopPage();
      };

      saveBtn.addEventListener('click', doSave);
      saveBtn.addEventListener('touchstart', e => {
        const t0 = e.touches[0];
        tsX = t0.clientX; tsY = t0.clientY;
        touched = true;
      }, { passive: true });
      saveBtn.addEventListener('touchend', e => {
        if (!touched) return;
        touched = false;
        const t0 = e.changedTouches[0];
        const dx = Math.abs(t0.clientX - tsX);
        const dy = Math.abs(t0.clientY - tsY);
        if (dx > 10 || dy > 10) return;
        doSave();
      });
    }
  });
}

function openSettingsPage(){
  const s = DB.getSettings(State.me.id);
  openPage({
    title: t('settings.title'),
    bodyHtml: `
      <div class="section-title">${esc(t('settings.theme'))}</div>
      <div class="set-list">
        <div class="set-row">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>
          <span>${esc(t('settings.theme'))}</span>
          <div class="seg" id="themeSeg" style="margin-left:auto;width:auto">
            <button data-th="light">${esc(t('settings.light'))}</button>
            <button data-th="dark">${esc(t('settings.dark'))}</button>
            <button data-th="system">${esc(t('settings.system'))}</button>
          </div>
        </div>
        <div class="set-row">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20"/></svg>
          <span>${esc(t('settings.lang'))}</span>
          <div class="seg" id="langSeg" style="margin-left:auto;width:auto">
            <button data-lg="ru">RU</button>
            <button data-lg="en">EN</button>
          </div>
        </div>
        <div class="set-row">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6l3-3M12 2v6l-3-3"/><circle cx="12" cy="14" r="8"/></svg>
          <span>${esc(t('settings.anim'))}</span>
          <div class="switch${s.animations ? ' on' : ''}" id="swAnim" style="margin-left:auto"></div>
        </div>
        <div class="set-row">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          <span>${esc(t('settings.compact'))}</span>
          <div class="switch${s.compact ? ' on' : ''}" id="swCompact" style="margin-left:auto"></div>
        </div>
      </div>`,
    onMount: p => {
      p.querySelectorAll('#themeSeg button').forEach(b => {
        b.classList.toggle('on', b.dataset.th === s.theme);
        b.onclick = () => {
          p.querySelectorAll('#themeSeg button').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          DB.setSettings(State.me.id, {theme: b.dataset.th});
          applyTheme(b.dataset.th);
          toast(t('toast.theme'), 'ok');
        };
      });
      p.querySelectorAll('#langSeg button').forEach(b => {
        b.classList.toggle('on', b.dataset.lg === LANG);
        b.onclick = () => {
          setLang(b.dataset.lg);
          closeAllPages();
          openSettingsPage();
          toast(t('toast.lang_switched'), 'ok');
        };
      });
      p.querySelector('#swAnim').onclick = e => {
        const on = !e.currentTarget.classList.contains('on');
        e.currentTarget.classList.toggle('on', on);
        DB.setSettings(State.me.id, {animations: on});
      };
      p.querySelector('#swCompact').onclick = e => {
        const on = !e.currentTarget.classList.contains('on');
        e.currentTarget.classList.toggle('on', on);
        document.documentElement.style.setProperty('--font',
          on ? '13.5px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'
             : '16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif');
        DB.setSettings(State.me.id, {compact: on});
      };
    }
  });
}

function openPrivacyPage(){
  const me = DB.findUserById(State.me.id);
  const pv = me.privacy;
  const FIELDS = [
    { key:'phone',    icon:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>' },
    { key:'find',     icon:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>' },
    { key:'lastSeen', icon:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>' },
    { key:'online',   icon:'<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="9"/>' },
    { key:'avatar',   icon:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>' },
    { key:'bio',      icon:'<path d="M4 6h16M4 12h16M4 18h10"/>' },
    { key:'groups',   icon:'<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>' },
    { key:'calls',    icon:'<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6"/>' },
    { key:'forwards', icon:'<path d="M4 4l16 8-16 8z"/>' }
  ];
  const rowsHtml = FIELDS.map(f => `
    <div class="set-row">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${f.icon}</svg>
      <span>${esc(t('privacy.'+f.key))}</span>
      <span class="val" data-key="${f.key}">${esc(t('privacy.'+pv[f.key]))}</span>
    </div>`).join('');

  openPage({
    title: t('privacy.title'),
    bodyHtml: `<div class="set-list">${rowsHtml}</div>`,
    onMount: p => {
      p.querySelectorAll('.set-row').forEach((row, i) => {
        const key = FIELDS[i].key;
        row.onclick = () => {
          openPrivacyChoice(key, () => {
            closeTopPage();
            openPrivacyPage();
          });
        };
      });
    }
  });
}
function openPrivacyChoice(key, onDone){
  const me = DB.findUserById(State.me.id);
  const cur = me.privacy[key] || 'everyone';
  openPage({
    title: t('privacy.'+key),
    bodyHtml: `
      <div class="set-list">
        ${['everyone','contacts','nobody'].map(v => `
          <div class="set-row" data-v="${v}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 6-7"/></svg>
            <span>${esc(t('privacy.'+v))}</span>
            ${cur === v ? '<svg style="margin-left:auto;color:var(--accent)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>' : ''}
          </div>`).join('')}
      </div>`,
    onMount: p => {
      p.querySelectorAll('.set-row').forEach(row => {
        row.onclick = () => {
          const v = row.dataset.v;
          me.privacy[key] = v;
          DB.persist();
          closeTopPage();
          if (onDone) onDone();
        };
      });
    }
  });
}

function openInvitePage(){
  const link = location.href.split('#')[0] + '?invite=' + State.me.id;
  openPage({
    title: t('menu.invite'),
    bodyHtml: `
      <div class="info-block">
        <div class="info-row" style="font-family:ui-monospace,Menlo,monospace;font-size:13px;word-break:break-all">${esc(link)}</div>
      </div>
      <div style="padding:0 16px 30px">
        <button class="btn" id="ivCopy">Копировать</button>
      </div>`,
    onMount: p => {
      p.querySelector('#ivCopy').onclick = () => {
        navigator.clipboard?.writeText(link);
        toast(t('toast.copied'), 'ok');
      };
    }
  });
}
function openHelpPage(){
  openPage({
    title: t('menu.help'),
    bodyHtml: `
      <div class="info-block">
        <div class="info-row" style="display:block;line-height:1.6;color:var(--text2)">
          ${LANG==='ru'
            ? 'VEXA — современный мессенджер. Свайп влево по сообщению — ответить. Свайп от левого края — назад. Long-press на сообщении — меню действий. В нижней панели можно двигать индикатор пальцем.'
            : 'VEXA is a modern messenger. Swipe left on a message to reply. Swipe from left edge to go back. Long-press a message for actions. Drag the bottom-nav indicator with your finger.'}
        </div>
      </div>`
  });
}
function openAboutPage(){
  openPage({
    title: t('menu.about'),
    bodyHtml: `
      <div class="profile-hero">
        <div style="width:88px;height:88px;border-radius:28px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:inline-grid;place-items:center;color:#fff;font-size:42px;font-weight:800;box-shadow:0 20px 50px rgba(139,92,246,.45)">V</div>
        <div style="font-size:26px;font-weight:800;letter-spacing:5px;margin-top:8px">VEXA</div>
        <div style="color:var(--text2);font-size:13px">${esc(t('welcome.slogan'))}</div>
      </div>
      <div class="info-block">
        <div class="info-row"><span>Версия</span><span class="val">2.0.0</span></div>
        <div class="info-row"><span>Сборка</span><span class="val">Pastel Glass · v2</span></div>
      </div>`
  });
}

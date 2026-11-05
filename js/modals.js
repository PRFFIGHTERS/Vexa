document.getElementById('btnPlus').onclick = openActionSheet;
function openActionSheet(){
  const bd = document.getElementById('sheetBd');
  const body = document.getElementById('sheetBody');
  body.innerHTML = `
    <div class="sheet-title">${esc(t('sheet.title'))}</div>
    <button class="sheet-item" data-a="group">
      <div class="sheet-ico i-group"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
      <span>${esc(t('sheet.group'))}</span>
    </button>
    <button class="sheet-item" data-a="channel">
      <div class="sheet-ico i-channel"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16"/><circle cx="5" cy="19" r="1.5"/></svg></div>
      <span>${esc(t('sheet.channel'))}</span>
    </button>
    <button class="sheet-item" data-a="find">
      <div class="sheet-ico i-find"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></div>
      <span>${esc(t('sheet.find'))}</span>
    </button>
    <button class="sheet-cancel" data-a="cancel">${esc(t('sheet.cancel'))}</button>`;
  bd.classList.add('open');
  body.querySelectorAll('button[data-a]').forEach(btn => {
    btn.onclick = () => {
      const a = btn.dataset.a;
      closeActionSheet();
      setTimeout(() => {
        if (a === 'group') openCreateGroupModal();
        else if (a === 'channel') openCreateChannelModal();
        else if (a === 'find') openFindByEmail();
      }, 120);
    };
  });
}
function closeActionSheet(){ document.getElementById('sheetBd').classList.remove('open'); }
document.getElementById('sheetBd').addEventListener('click', e => {
  if (e.target.id === 'sheetBd') closeActionSheet();
});

function openChatContext(e, chatId){
  const c = DB.getChat(chatId); if (!c) return;
  openContext(e.clientX, e.clientY, [
    { label: 'Открыть', fn: () => openChat(chatId) },
    { label: c.pinned ? 'Открепить' : 'Закрепить', fn: () => { DB.updateChat(chatId, {pinned: !c.pinned}); renderChats(); } },
    { label: c.unread ? 'Прочитано' : 'Непрочитано', fn: () => { DB.updateChat(chatId, {unread: c.unread ? 0 : 1}); renderChats(); } },
    { sep: true },
    { label: 'Удалить чат', danger: true, fn: () => confirmDialog(t('confirm.delete_chat'), () => { DB.deleteChat(chatId); renderChats(); }) }
  ]);
}
function openContext(x, y, items){
  const ctx = document.getElementById('ctxMenu');
  ctx.innerHTML = '';
  items.forEach(it => {
    if (it.sep){ ctx.appendChild(el('<div style="height:1px;background:var(--divider);margin:4px 8px"></div>')); return; }
    const b = el(`<button${it.danger ? ' class="danger"' : ''}>${it.emoji ? `<span style="font-size:16px">${it.emoji}</span>` : ''}<span>${esc(it.label)}</span></button>`);
    b.onclick = () => { closeContext(); it.fn(); };
    ctx.appendChild(b);
  });
  ctx.classList.add('open');
  const maxX = window.innerWidth - ctx.offsetWidth - 10;
  const maxY = window.innerHeight - ctx.offsetHeight - 10;
  ctx.style.left = Math.max(10, Math.min(x, maxX)) + 'px';
  ctx.style.top = Math.max(10, Math.min(y, maxY)) + 'px';
}
function closeContext(){ document.getElementById('ctxMenu').classList.remove('open'); }
document.addEventListener('click', e => { if (!e.target.closest('#ctxMenu')) closeContext(); });

function openModal(html, setup){
  const bd = document.getElementById('modalBd');
  const body = document.getElementById('modalBody');
  body.innerHTML = html;
  bd.classList.add('open');
  if (setup) setup(body);
}
function closeModal(){ document.getElementById('modalBd').classList.remove('open'); }
document.getElementById('modalBd').addEventListener('click', e => { if (e.target.id === 'modalBd') closeModal(); });

function confirmDialog(text, onYes){
  openModal(`
    <h2>${esc(t('confirm.title'))}</h2>
    <p style="color:var(--text2);margin-bottom:20px;font-size:14.5px">${esc(text)}</p>
    <div class="row" style="gap:10px">
      <button class="btn btn-2" id="cfNo">${esc(t('confirm.cancel'))}</button>
      <button class="btn btn-danger" id="cfYes">${esc(t('confirm.yes'))}</button>
    </div>`,
    b => {
      b.querySelector('#cfNo').onclick = closeModal;
      b.querySelector('#cfYes').onclick = () => { closeModal(); onYes(); };
    });
}

function openFindByEmail(){
  openModal(`
    <h2>${esc(t('find.title'))}</h2>
    <p style="color:var(--text2);font-size:13px;margin-bottom:14px">${esc(t('find.hint'))}</p>
    <input class="field" id="findEmail" type="email" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="name@example.com" autofocus/>
    <div class="err" id="findErr"></div>
    <div id="findResults"></div>
    <button class="btn" id="findBtn" disabled style="margin-top:14px">${esc(t('find.search'))}</button>`,
    b => {
      const inp = b.querySelector('#findEmail');
      const errEl = b.querySelector('#findErr');
      const res = b.querySelector('#findResults');
      const btn = b.querySelector('#findBtn');
      inp.addEventListener('input', () => {
        const v = inp.value.trim();
        const ok = emailValid(v);
        btn.disabled = !ok;
        errEl.textContent = v && !ok ? t('err.phone') : '';
      });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && emailValid(inp.value)) search();
      });

      const search = async () => {
        const em = inp.value.trim().toLowerCase();
        if (!emailValid(em)) return;
        res.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text2);font-size:14px">Поиск...</div>';

        if (State.me.email && em === State.me.email.toLowerCase()){
          res.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text2);font-size:14px">${esc(t('find.self'))}</div>`;
          return;
        }

        try {
          const r = await fetch(API + '/api/find-by-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: em })
          });
          const data = await r.json();

          if (!data.found){
            res.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text2);font-size:14px">${esc(t('find.notfound'))}</div>`;
            return;
          }

          const srv = data.user;
          const uidStr = String(srv.id);
          let user = DB.findUserById(uidStr);
          if (!user){
            user = DB.createUser({
              id: uidStr,
              email: srv.email || em,
              firstName: srv.first_name,
              lastName: srv.last_name,
              username: srv.username,
              bio: srv.bio || '',
              avatar: srv.avatar || null
            });
          }

          const item = el(`
            <div class="result-item">
              <div class="avatar av-54">${user.avatar ? `<img src="${esc(user.avatar)}" alt=""/>` : esc(initials(user))}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600">${esc(displayName(user))}</div>
                <div style="color:var(--text2);font-size:12.5px">${user.username ? '@'+esc(user.username) : ''}</div>
              </div>
            </div>`);
          res.innerHTML = '';
          item.onclick = () => {
            closeModal();
            openUserProfile(user.id);
          };
          res.appendChild(item);
        } catch (e) {
          console.error(e);
          res.innerHTML = `<div style="text-align:center;padding:16px;color:var(--danger);font-size:14px">Ошибка связи</div>`;
        }
      };
      btn.onclick = search;
    });
}

function openAddContactPage(){
  openPage({
    title: t('contacts.add'),
    bodyHtml: `
      <div style="padding:14px 16px 6px">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text2)"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input id="acSearch" placeholder="${esc(t('contacts.search'))}" autofocus/>
        </div>
      </div>
      <div id="acRes" style="padding:0 6px 30px"></div>`,
    onMount: p => {
      const inp = p.querySelector('#acSearch');
      const res = p.querySelector('#acRes');
      const render = () => {
        const q = inp.value.trim().toLowerCase();
        res.innerHTML = '';
        if (!q) return;
        const users = DB.data.users.filter(u =>
          String(u.id) !== String(State.me.id) &&
          ((u.username||'').toLowerCase().includes(q) || (u.firstName||'').toLowerCase().includes(q) || (u.lastName||'').toLowerCase().includes(q))
        );
        if (!users.length){ res.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text2);font-size:13px">Не найдено</div>`; return; }
        users.forEach(u => {
          const inContacts = DB.isContact(State.me.id, u.id);
          const r = el(`
            <div class="result-item">
              <div class="avatar av-40">${u.avatar ? `<img src="${esc(u.avatar)}" alt=""/>` : esc(initials(u))}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600">${esc(displayName(u))}</div>
                <div style="color:var(--text2);font-size:12.5px">${u.username ? '@'+esc(u.username) : ''}</div>
              </div>
              <button class="btn btn-sm${inContacts ? ' btn-2' : ''}">${inContacts ? 'Удалить' : 'Добавить'}</button>
            </div>`);
          r.querySelector('button').onclick = e => {
            e.stopPropagation();
            if (DB.isContact(State.me.id, u.id)){
              DB.removeContact(State.me.id, u.id);
              toast(t('toast.contact_removed'));
            } else {
              DB.addContact(State.me.id, u.id);
              toast(t('toast.contact_added'), 'ok');
            }
            render();
            renderContactsList();
          };
          r.onclick = () => openUserProfile(u.id);
          res.appendChild(r);
        });
      };
      inp.addEventListener('input', render);
      setTimeout(() => inp.focus(), 200);
    }
  });
}

function openCreateGroupModal(){
  const contacts = DB.contactsOf(State.me.id);
  const allUsers = DB.data.users.filter(u => String(u.id) !== String(State.me.id));
  const pool = contacts.length ? contacts : allUsers;
  openModal(`
    <h2>${esc(t('group.title'))}</h2>
    <label class="lbl">${esc(t('group.name'))}</label>
    <input class="field" id="grName" style="margin-bottom:10px"/>
    <label class="lbl">${esc(t('group.desc'))}</label>
    <input class="field" id="grDesc" style="margin-bottom:14px"/>
    <label class="lbl">${esc(t('group.members'))}</label>
    <div id="grMembers" style="max-height:280px;overflow-y:auto;margin-bottom:16px"></div>
    <div class="row" style="gap:10px">
      <button class="btn btn-2" id="grCancel">${esc(t('confirm.cancel'))}</button>
      <button class="btn" id="grCreate">${esc(t('group.create'))}</button>
    </div>`,
    b => {
      const list = b.querySelector('#grMembers');
      const selected = new Set();
      if (!pool.length){
        list.innerHTML = `<div style="color:var(--text2);font-size:13px;padding:14px;text-align:center">Нет пользователей</div>`;
      } else {
        pool.forEach(u => {
          const r = el(`
            <div class="result-item" data-uid="${u.id}">
              <div class="switch" style="pointer-events:none"></div>
              <div class="avatar av-40">${esc(initials(u))}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600">${esc(displayName(u))}</div>
                <div style="color:var(--text2);font-size:12.5px">${u.username ? '@'+esc(u.username) : ''}</div>
              </div>
            </div>`);
          r.onclick = () => {
            if (selected.has(String(u.id))) selected.delete(String(u.id)); else selected.add(String(u.id));
            r.querySelector('.switch').classList.toggle('on', selected.has(String(u.id)));
          };
          list.appendChild(r);
        });
      }
      b.querySelector('#grCancel').onclick = closeModal;
      b.querySelector('#grCreate').onclick = async () => {
        const name = b.querySelector('#grName').value.trim();
        const desc = b.querySelector('#grDesc').value.trim();
        if (!name){ toast(t('toast.fill_name'), 'err'); return; }
        if (!selected.size){ toast(t('toast.select_members'), 'err'); return; }
        try {
          const r = await fetch(API + '/api/chats', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
              type: 'group', ownerId: State.me.id,
              members: [String(State.me.id), ...selected],
              title: name, description: desc
            })
          });
          const d = await r.json();
          if (!d.ok){ toast(t('toast.server_error'), 'err'); return; }
          closeModal();
          toast(t('toast.group_created'), 'ok');
          await syncChatsFromServer();
          switchNav('chats');
          setTimeout(() => openChat(String(d.chat.id)), 250);
        } catch(e){ toast(t('toast.no_connection'), 'err'); }
      };
    });
}
function openCreateChannelModal(){
  openModal(`
    <h2>${esc(t('channel.title'))}</h2>
    <label class="lbl">${esc(t('channel.name'))}</label>
    <input class="field" id="chName" style="margin-bottom:10px"/>
    <label class="lbl">${esc(t('channel.desc'))}</label>
    <input class="field" id="chDesc" style="margin-bottom:10px"/>
    <div class="row" style="gap:10px">
      <button class="btn btn-2" id="chCancel">${esc(t('confirm.cancel'))}</button>
      <button class="btn" id="chCreate">${esc(t('channel.create'))}</button>
    </div>`,
    b => {
      b.querySelector('#chCancel').onclick = closeModal;
      b.querySelector('#chCreate').onclick = async () => {
        const name = b.querySelector('#chName').value.trim();
        const desc = b.querySelector('#chDesc').value.trim();
        if (!name){ toast(t('toast.fill_name'), 'err'); return; }
        try {
          const r = await fetch(API + '/api/chats', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
              type: 'channel', ownerId: State.me.id,
              members: [String(State.me.id)],
              title: name, description: desc
            })
          });
          const d = await r.json();
          if (!d.ok){ toast(t('toast.server_error'), 'err'); return; }
          closeModal();
          toast(t('toast.channel_created'), 'ok');
          await syncChatsFromServer();
          switchNav('chats');
          setTimeout(() => openChat(String(d.chat.id)), 250);
        } catch(e){ toast(t('toast.no_connection'), 'err'); }
      };
    });
}

function openSavedChat(){
  let chat = DB.chatsOf(State.me.id).find(c => c.type === 'saved');
  if (!chat){ toast(LANG==='ru'?'Избранное ещё не создано':'Saved not ready'); return; }
  State.activeTab = 'all';
  document.querySelectorAll('#tabs .tab').forEach(x => x.classList.toggle('on', x.dataset.tab === 'all'));
  switchNav('chats');
  renderChats();
  openChat(chat.id);
}

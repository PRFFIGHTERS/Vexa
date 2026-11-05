async function openChat(chatId){
  const chat = DB.getChat(chatId);
  if (!chat) return;
  State.activeChat = chat;
  State.replyTo = null;
  State.editing = null;
  chat.unread = 0;
  DB.persist();
  const ov = document.getElementById('chatOverlay');
  ov.classList.add('open');
  renderChatTop();
  renderMessages();
  renderChats();
  setTimeout(() => { const mi = document.getElementById('msgInput'); if (mi) mi.focus(); }, 80);
  await syncMessagesFromServer(chatId);
}
function closeChat(){
  const ov = document.getElementById('chatOverlay');
  ov.classList.remove('open');
  setTimeout(() => {
    State.activeChat = null;
    renderChats();
  }, 350);
}
function renderChatTop(){
  const c = State.activeChat; if (!c) return;
  const top = document.getElementById('chatTop');
  if (!top) return;
  const otherU = chatAvatarUser(c);
  const name = chatTitle(c);
  let statusText = '';
  let onlineClass = '';
  if (c.type === 'personal'){
    if (otherU){
      statusText = lastSeenText(otherU);
      const isOnline = otherU.lastSeen && (Date.now() - otherU.lastSeen < 60_000);
      if (isOnline && canSee(State.me.id, otherU.id, 'online')) onlineClass = 'online';
    }
  } else if (c.type === 'group'){
    statusText = (c.members||[]).length + ' ' + (LANG==='ru'?'участников':'members');
  } else if (c.type === 'channel'){
    statusText = (LANG==='ru'?'канал':'channel');
  } else {
    statusText = (LANG==='ru'?'ваши сохранённые сообщения':'your saved messages');
  }

  top.innerHTML = `
    <button class="icon-btn" id="chatBackBtn"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
    <div class="avatar av-40" id="chatTopAv" ${c.type === 'personal' ? 'style="cursor:pointer"' : ''}></div>
    <div class="chat-top-info" id="chatTopInfo">
      <div class="chat-top-name">${esc(name)}</div>
      <div class="chat-top-status ${onlineClass}">${esc(statusText)}</div>
    </div>
    <button class="icon-btn" id="chatCallBtn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.6a2 2 0 01-.5 2.1L8 9.7a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.8.3 1.7.6 2.6.7a2 2 0 011.7 2z"/></svg>
    </button>
    <button class="icon-btn" id="chatMoreBtn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
    </button>`;

  const av = document.getElementById('chatTopAv');
  if (c.type === 'saved'){ av.style.background = 'linear-gradient(135deg,#2ECC71,#27AE60)'; av.textContent = '★'; }
  else if (c.avatar) av.innerHTML = `<img src="${esc(c.avatar)}" alt=""/>`;
  else if (otherU && otherU.avatar) av.innerHTML = `<img src="${esc(otherU.avatar)}" alt=""/>`;
  else if (otherU) av.textContent = initials(otherU);
  else av.textContent = ((c.title||'?')[0] || '?').toUpperCase();

  document.getElementById('chatBackBtn').onclick = closeChat;
  document.getElementById('chatCallBtn').onclick = () => toast(t('calls.unavailable'));
  document.getElementById('chatTopInfo').onclick = () => {
    if (c.type === 'personal' && otherU) openUserProfile(otherU.id);
    else openChatInfoPage();
  };
  if (c.type === 'personal' && otherU){
    av.onclick = () => openUserProfile(otherU.id);
  }
  document.getElementById('chatMoreBtn').onclick = e => {
    const r = e.currentTarget.getBoundingClientRect();
    openContext(r.left - 180, r.bottom + 6, [
      { label: 'Информация', fn: openChatInfoPage },
      { sep: true },
      { label: 'Удалить чат', danger: true, fn: () => confirmDialog(t('confirm.delete_chat'), () => {
        DB.deleteChat(State.activeChat.id);
        closeChat();
      })}
    ]);
  };
}

function openChatInfoPage(){
  const c = State.activeChat; if (!c) return;
  const members = (c.members||[]).map(id => DB.findUserById(id)).filter(Boolean);
  openPage({
    title: chatTitle(c),
    bodyHtml: `
      <div class="profile-hero">
        <div class="avatar av-96" style="margin:0 auto;${c.type==='saved'?'background:linear-gradient(135deg,#2ECC71,#27AE60)':''}">
          ${c.type === 'saved' ? '★' : esc(((c.title||'?')[0]||'?').toUpperCase())}
        </div>
        <div class="name">${esc(chatTitle(c))}</div>
        ${c.description ? `<div class="status">${esc(c.description)}</div>` : ''}
      </div>
      <div class="set-list">
        ${members.map(u => `
          <div class="set-row" data-uid="${u.id}">
            <div class="avatar av-40">${esc(initials(u))}</div>
            <span>${esc(displayName(u))}${String(u.id)===String(State.me.id) ? ' ('+esc(t('msg.you'))+')' : ''}</span>
          </div>`).join('')}
      </div>
      ${c.type !== 'saved' ? `
        <div style="padding:16px">
          <button class="btn btn-danger" id="ciLeave">Покинуть чат</button>
        </div>` : ''}`,
    onMount: p => {
      p.querySelectorAll('.set-row').forEach(r => {
        r.onclick = () => { const id = r.dataset.uid; if (String(id) !== String(State.me.id)) openUserProfile(id); };
      });
      const lv = p.querySelector('#ciLeave');
      if (lv) lv.onclick = () => confirmDialog('Покинуть чат?', () => {
        c.members = (c.members||[]).filter(id => String(id) !== String(State.me.id));
        if (!c.members.length) DB.deleteChat(c.id);
        else DB.persist();
        closeAllPages();
        closeChat();
      });
    }
  });
}

function renderMessages(){
  const box = document.getElementById('msgs');
  if (!box) return;
  box.innerHTML = '';
  const c = State.activeChat; if (!c) return;
  const list = DB.getMessages(c.id).sort((a,b) => a.createdAt - b.createdAt);
  if (!list.length){
    box.innerHTML = `
      <div class="empty-chat">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        <h3>${esc(t('chat.no_msgs'))}</h3>
        <p>${esc(t('chat.no_msgs_sub'))}</p>
      </div>`;
    return;
  }
  let lastDay = '';
  list.forEach(m => {
    const day = fmtDay(m.createdAt);
    if (day !== lastDay){ box.appendChild(el(`<div class="day-sep">${esc(day)}</div>`)); lastDay = day; }
    box.appendChild(renderMessage(m));
  });
  box.scrollTop = box.scrollHeight;
}

function renderMessage(m){
  const me = String(m.senderId) === String(State.me.id);
  const wrap = el(`<div class="msg-wrap${me ? ' me' : ''}">
    <div class="reply-hint">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 14l-5-5 5-5M4 9h10a6 6 0 016 6v6"/></svg>
    </div>
    <div class="msg${me ? ' me' : ''}" data-id="${m.id}"></div>
  </div>`);
  const node = wrap.querySelector('.msg');

  const sender = DB.findUserById(m.senderId);
  const c = State.activeChat;
  const showSender = !me && c && (c.type === 'group' || c.type === 'channel');

  let inner = '';
  if (showSender && sender) inner += `<div style="font-weight:600;font-size:12.5px;margin-bottom:3px;color:var(--accent)">${esc(displayName(sender))}</div>`;
  if (m.replyTo){
    const orig = DB.getMessage(m.replyTo);
    if (orig) inner += `<div class="quote">${esc((orig.text||'').slice(0,80) || '📎')}</div>`;
  }
  if (m.deleted){
    inner += `<div style="opacity:.7;font-style:italic">${esc(t('msg.deleted'))}</div>`;
  } else {
    if (m.text) inner += `<div style="white-space:pre-wrap">${linkify(esc(m.text))}</div>`;
    if (m.attachments && m.attachments.length){
      m.attachments.forEach(a => {
        if ((a.type||'').startsWith('image/')){
          inner += `<img class="attach" src="${esc(a.data)}" alt=""/>`;
        } else if ((a.type||'').startsWith('video/')){
          inner += `<video class="attach" src="${esc(a.data)}" controls></video>`;
        } else {
          inner += `<div class="file-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M21.4 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg><span>${esc(a.name||'file')}</span></div>`;
        }
      });
    }
  }
  inner += `<div class="meta">${m.edited && !m.deleted ? `<span class="edited">${esc(t('msg.edited'))}</span>` : ''}<span>${fmtTime(m.createdAt)}</span>${me ? '<span>✓</span>' : ''}</div>`;
  node.innerHTML = inner;

  node.querySelectorAll('img.attach').forEach(img => {
    img.onclick = e => { e.stopPropagation(); openViewer(img.src); };
  });

  if (!m.deleted && m.reactions && Object.keys(m.reactions).length){
    const rbox = el(`<div class="reactions"></div>`);
    Object.entries(m.reactions).forEach(([emoji, users]) => {
      const r = el(`<span class="react${users.includes(State.me.id) ? ' mine' : ''}">${emoji} ${users.length}</span>`);
      r.onclick = e => { e.stopPropagation(); toggleReaction(m.id, emoji); };
      rbox.appendChild(r);
    });
    node.appendChild(rbox);
  }

  attachLongPress(wrap, m.id);
  attachSwipeReply(wrap, m.id);

  node.oncontextmenu = e => { e.preventDefault(); openMessageActions(m.id); };

  return wrap;
}
function linkify(s){ return s.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'); }

document.getElementById('btnAttach').onclick = () => {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*,video/*,application/*';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    if (f.size > 3 * 1024 * 1024){ toast(t('toast.file_big'), 'err'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      DB.createMessage({
        chatId: State.activeChat.id, senderId: State.me.id, text: '',
        attachments: [{ name: f.name, type: f.type, size: f.size, data: reader.result }]
      });
      renderMessages(); renderChats();
      toast(t('toast.file_sent'), 'ok');
    };
    reader.readAsDataURL(f);
  };
  inp.click();
};
document.getElementById('btnEmoji').onclick = () => {
  const r = document.getElementById('btnEmoji').getBoundingClientRect();
  const emojis = ['👍','❤️','😂','😮','😢','🔥','👎','🎉','🙏','😍','🤔','😎','🥰','😅','😭'];
  openContext(r.left - 120, r.top - 60, emojis.map(e => ({
    label: e, fn: () => {
      msgInput.value += e;
      msgInput.dispatchEvent(new Event('input'));
      msgInput.focus();
    }
  })));
};

document.getElementById('btnSearch').onclick = () => {
  openNewChatModal();
};
function openNewChatModal(){
  openPage({
    title: t('contacts.search') || 'Search',
    bodyHtml: `
      <div style="padding:14px 16px 6px">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text2)"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input id="ncSearch" placeholder="${esc(t('contacts.search'))}" autofocus/>
        </div>
      </div>
      <div id="ncRes" style="padding:0 6px 30px"></div>`,
    onMount: p => {
      const inp = p.querySelector('#ncSearch');
      const res = p.querySelector('#ncRes');
      const render = () => {
        const q = inp.value.trim().toLowerCase();
        res.innerHTML = '';
        const users = DB.data.users.filter(u =>
          String(u.id) !== String(State.me.id) &&
          (!q || (u.username||'').toLowerCase().includes(q) || (u.firstName||'').toLowerCase().includes(q) || (u.lastName||'').toLowerCase().includes(q))
        );
        if (!users.length){ res.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text2);font-size:13px">Никого не найдено</div>`; return; }
        users.forEach(u => {
          const r = el(`
            <div class="result-item">
              <div class="avatar av-40">${u.avatar ? `<img src="${esc(u.avatar)}" alt=""/>` : esc(initials(u))}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600">${esc(displayName(u))}</div>
                <div style="color:var(--text2);font-size:12.5px">${lastSeenText(u)}</div>
              </div>
            </div>`);
          r.onclick = () => {
            closeAllPages();
            setTimeout(() => openUserProfile(u.id), 120);
          };
          res.appendChild(r);
        });
      };
      inp.addEventListener('input', render);
      render();
      setTimeout(() => inp.focus(), 200);
    }
  });
}

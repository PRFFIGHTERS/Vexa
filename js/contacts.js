function renderContactsList(){
  if (!State.me) return;
  const box = document.getElementById('contactsList');
  if (!box) return;
  box.innerHTML = '';
  const cs = DB.contactsOf(State.me.id);
  if (!cs.length){
    box.innerHTML = `
      <div class="chat-empty">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <h3>${esc(t('contacts.empty'))}</h3>
        <p>${esc(t('contacts.empty_sub'))}</p>
        <button class="btn btn-sm" id="ctEmptyAdd">${esc(t('contacts.add'))}</button>
      </div>`;
    
    // ИСПРАВЛЕНО: обернуто в стрелочную функцию
    document.getElementById('ctEmptyAdd').onclick = () => openAddContactPage();
    return;
  }
  cs.forEach(u => {
    const r = el(`
      <div class="p-item">
        <div class="avatar av-54">${u.avatar ? `<img src="${esc(u.avatar)}" alt=""/>` : esc(initials(u))}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:15.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(displayName(u))}</div>
          <div style="color:var(--text2);font-size:13px;margin-top:2px">${lastSeenText(u)}</div>
        </div>
      </div>`);
    r.onclick = () => openUserProfile(u.id);
    box.appendChild(r);
  });
}

// ИСПРАВЛЕНО: обернуто в стрелочную функцию
document.getElementById('ctAddBtn').onclick = () => openAddContactPage();

function renderCallsList(){
  if (!State.me) return;
  const box = document.getElementById('callsList');
  if (!box) return;
  box.innerHTML = '';
  const calls = DB.callsOf(State.me.id);
  if (!calls.length){
    box.innerHTML = `
      <div class="chat-empty">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.6a2 2 0 01-.5 2.1L8 9.7a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.8.3 1.7.6 2.6.7a2 2 0 011.7 2z"/></svg>
        <h3>${esc(t('calls.empty'))}</h3>
        <p>${esc(t('calls.empty_sub'))}</p>
      </div>`;
    return;
  }
  calls.forEach(c => {
    const other = DB.findUserById(c.from === State.me.id ? c.to : c.from);
    if (!other) return;
    const callIcon = c.type === 'video'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-2px"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-2px"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.6a2 2 0 01-.5 2.1L8 9.7a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.8.3 1.7.6 2.6.7a2 2 0 011.7 2z"/></svg>';
    const r = el(`
      <div class="p-item">
        <div class="avatar av-54">${esc(initials(other))}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:15.5px">${esc(displayName(other))}</div>
          <div style="color:var(--text2);font-size:13px;margin-top:2px;display:flex;align-items:center;gap:4px">${callIcon}<span>${new Date(c.createdAt).toLocaleString()}</span></div>
        </div>
      </div>`);
    box.appendChild(r);
  });
}

function openUserProfile(userId){
  if (String(userId) === String(State.me.id)){ openProfilePage(); return; }
  const u = DB.findUserById(userId);
  if (!u) return;
  const emailAllowed = canSee(State.me.id, u.id, 'phone');
  const bdayAllowed = u.birthday && canSee(State.me.id, u.id, 'bio');
  const stories = u.stories || [];

  const storiesHtml = stories.length
    ? stories.map(s => `
        <div class="story-circle" data-sid="${s.id}">
          <div style="background:linear-gradient(135deg,#8B5CF6,#A78BFA)">
            ${s.thumb ? `<img src="${esc(s.thumb)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>` : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'}
          </div>
        </div>`).join('')
    : `<div style="color:var(--text2);font-size:13px;padding:0 22px">${esc(t('profile.no_stories'))}</div>`;

  const isContact = DB.isContact(State.me.id, u.id);

  openPage({
    title: displayName(u),
    bodyHtml: `
      <div class="profile-hero">
        <div class="avatar av-96">${u.avatar ? `<img src="${esc(u.avatar)}" alt=""/>` : esc(initials(u))}</div>
        <div class="name">${esc(displayName(u))}</div>
        <div class="status">${esc(lastSeenText(u))}</div>
        ${u.username ? `<div class="username">@${esc(u.username)}</div>` : ''}
      </div>

      <div class="section-title">${esc(t('profile.stories'))}</div>
      <div class="stories-strip">${storiesHtml}</div>

      <div class="info-block">
        ${u.bio && canSee(State.me.id, u.id, 'bio') ? `
          <div class="info-row" style="display:block">
            <div style="color:var(--text2);font-size:12.5px;margin-bottom:4px">${esc(t('profile.bio'))}</div>
            <div>${esc(u.bio)}</div>
          </div>` : ''}
        ${emailAllowed && u.email ? `
          <div class="info-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
            <span>${esc(u.email)}</span>
          </div>` : ''}
        ${u.username ? `
          <div class="info-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>@${esc(u.username)}</span>
          </div>` : ''}
        ${bdayAllowed ? `
          <div class="info-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span>${esc(fmtDate(u.birthday))}</span>
          </div>` : ''}
      </div>

      <div class="set-list">
        <div class="set-row" id="upSend">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>${esc(t('profile.send_msg'))}</span>
        </div>
        <div class="set-row" id="upContact">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6M19 8v6"/></svg>
          <span>${isContact ? esc(t('profile.remove_contact')) : esc(t('profile.add_contact'))}</span>
        </div>
        <div class="set-row" id="upShare">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v15"/></svg>
          <span>${esc(t('profile.share'))}</span>
        </div>
      </div>
      <div style="height:20px"></div>`,
    onMount: p => {
      p.querySelector('#upSend').onclick = async () => {
        closeAllPages();
        try {
          const r = await fetch(API + '/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'personal',
              ownerId: State.me.id,
              members: [String(State.me.id), String(u.id)]
            })
          });
          const data = await r.json();
          if (!data.ok){ toast(t('toast.server_error'), 'err'); return; }
          await syncChatsFromServer();
          setTimeout(() => openChat(String(data.chat.id)), 250);
        } catch (e) {
          console.error(e);
          toast(t('toast.no_connection'), 'err');
        }
      };
      p.querySelector('#upContact').onclick = () => {
        if (DB.isContact(State.me.id, u.id)){
          DB.removeContact(State.me.id, u.id);
          toast(t('toast.contact_removed'));
        } else {
          DB.addContact(State.me.id, u.id);
          toast(t('toast.contact_added'), 'ok');
        }
        renderContactsList();
        closeTopPage();
        openUserProfile(u.id);
      };
      p.querySelector('#upShare').onclick = () => {
        const link = location.href.split('#')[0] + '?u=' + u.id;
        navigator.clipboard?.writeText(link);
        toast(t('toast.copied'), 'ok');
      };
      p.querySelectorAll('.story-circle').forEach(c => {
        c.onclick = () => toast(LANG==='ru'?'Просмотр историй появится позже':'Story viewer coming soon');
      });
    }
  });
}

async function bootUser(userId){
  const u = DB.findUserById(userId);
  if (!u){ showScreen('welcome'); return; }
  State.me = u;
  const st = DB.getSettings(u.id);
  if (st.lang) LANG = st.lang;
  applyLang(); applyTheme(st.theme);
  document.documentElement.style.setProperty('--font',
    st.compact ? '13.5px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'
               : '16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif');
  updateMePanel();
  renderChats(); renderContactsList(); renderCallsList();
  State.activeChat = null;
  document.getElementById('chatOverlay').classList.remove('open');
  switchNav('chats');
  showScreen('app');
  setTimeout(() => positionIndicator(currentNavBtn(), false), 60);

  await syncChatsFromServer();

  if (!State.lastSeenMsgId){
    State.lastSeenMsgId = parseInt(localStorage.getItem('vexa.lastMsgId') || '0', 10) || 0;
  }

  clearInterval(window.__hb);
  window.__hb = setInterval(() => {
    const me = DB.findUserById(State.me.id);
    if (me){ me.lastSeen = Date.now(); DB.persist(); }
  }, 20_000);

  clearInterval(window.__pollUpdates);
  window.__pollUpdates = setInterval(checkNewMessages, 3000);

  clearInterval(window.__pollChats);
  window.__pollChats = setInterval(syncChatsFromServer, 8000);

  setTimeout(checkNewMessages, 800);
}

window.addEventListener('beforeunload', () => {
  if (State.me) DB.updateUser(State.me.id, { lastSeen: Date.now() });
});

function doLogout(){
  confirmDialog(t('confirm.logout'), async () => {
    DB.updateUser(State.me.id, { lastSeen: Date.now() });
    try { if (supabaseAuth) await supabaseAuth.auth.signOut(); } catch(e){}
    DB.clearSession();
    State.me = null; State.activeChat = null;
    clearInterval(window.__hb);
    clearInterval(window.__pollUpdates);
    clearInterval(window.__pollChats);
    document.getElementById('chatOverlay').classList.remove('open');
    closeAllPages();
    showScreen('welcome');
    toast(t('toast.logged_out'));
  });
}

function doDeleteAccount(){
  confirmDialog(t('confirm.delete_account'), async () => {
    try {
      await fetch(API + '/api/users/' + State.me.id, { method: 'DELETE' });
    } catch(e){}
    try { if (supabaseAuth) await supabaseAuth.auth.signOut(); } catch(e){}
    clearInterval(window.__hb);
    clearInterval(window.__pollUpdates);
    clearInterval(window.__pollChats);
    DB.wipeAll();
    State.me = null; State.activeChat = null; State.lastSeenMsgId = 0;
    document.getElementById('chatOverlay').classList.remove('open');
    closeAllPages();
    showScreen('welcome');
    toast(t('toast.account_deleted'), 'ok');
  });
}

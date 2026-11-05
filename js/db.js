/* ============================================================
   DB (localStorage кэш)
   ============================================================ */
const DB = (() => {
  const KEY = 'vexa.db.v2';
  let cache = null;
  const DEFAULT_PRIVACY = {
    phone: 'everyone', find: 'everyone', lastSeen: 'everyone',
    online: 'everyone', avatar: 'everyone', bio: 'everyone',
    groups: 'everyone', calls: 'everyone', forwards: 'everyone'
  };
  const load = () => {
    if (cache) return cache;
    try { cache = JSON.parse(localStorage.getItem(KEY)) || null; } catch { cache = null; }
    if (!cache) cache = { users:[], chats:[], messages:[], contacts:[], calls:[], settings:{}, session:null };
    cache.users = (cache.users||[]).map(u => ({
      ...u,
      privacy: { ...DEFAULT_PRIVACY, ...(u.privacy||{}) },
      lastSeen: u.lastSeen || Date.now(),
      birthday: u.birthday || null,
      stories: u.stories || []
    }));
    cache.chats = (cache.chats||[]).map(c => ({
      id: String(c.id || ('fix' + Math.random().toString(36).slice(2,10))),
      createdAt: c.createdAt || Date.now(),
      type: c.type || (c.title ? 'group' : 'personal'),
      title: c.title || null,
      description: c.description || null,
      ownerId: c.ownerId || null,
      members: Array.isArray(c.members) ? c.members.map(String) : [],
      avatar: c.avatar || null,
      unread: c.unread || 0,
      pinned: !!c.pinned,
      muted: !!c.muted,
      isPublic: !!c.isPublic
    }));
    cache.messages = (cache.messages||[]).map(m => ({
      ...m,
      id: String(m.id),
      chatId: String(m.chatId),
      senderId: String(m.senderId)
    }));
    cache.contacts = cache.contacts || [];
    cache.calls = cache.calls || [];
    cache.settings = cache.settings || {};
    return cache;
  };
  const save = () => localStorage.setItem(KEY, JSON.stringify(cache));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  return {
    get data(){ return load(); },
    persist: save, uid,
    createUser(d){ const u={id:String(d.id||uid()),createdAt:Date.now(),lastSeen:Date.now(),privacy:{...DEFAULT_PRIVACY},stories:[],birthday:null,...d}; load().users.push(u); save(); return u; },
    findUserByPhone(p){ return load().users.find(u => u.phone === p); },
    findUserByEmail(e){ if(!e) return null; e=e.toLowerCase(); return load().users.find(x => (x.email||'').toLowerCase()===e); },
    findUserByUsername(u){ if(!u) return null; u=u.toLowerCase(); return load().users.find(x => (x.username||'').toLowerCase()===u); },
    findUserById(id){ return load().users.find(u => String(u.id) === String(id)); },
    updateUser(id, patch){ const u=this.findUserById(id); if(!u) return; Object.assign(u, patch); save(); return u; },
    setSession(id){ load().session=id; save(); },
    getSession(){ return load().session; },
    clearSession(){ load().session=null; save(); },
    wipeAll(){ cache = null; localStorage.removeItem(KEY); },
    createChat(d){ const c={id:String(d.id||uid()),createdAt:Date.now(),type:'personal',members:[],unread:0,pinned:false,muted:false,...d}; load().chats.push(c); save(); return c; },
    getChat(id){ return load().chats.find(c => String(c.id)===String(id)); },
    updateChat(id, patch){ const c=this.getChat(id); if(!c) return; Object.assign(c,patch); save(); return c; },
    deleteChat(id){ const d=load(); d.chats=d.chats.filter(c=>String(c.id)!==String(id)); d.messages=d.messages.filter(m=>String(m.chatId)!==String(id)); save(); },
    chatsOf(u){ return load().chats.filter(c => Array.isArray(c.members) && c.members.map(String).includes(String(u))); },
    createMessage(d){ const m={id:String(d.id||uid()),createdAt:Date.now(),reactions:{},deleted:false,edited:false,...d}; load().messages.push(m); save(); return m; },
    getMessages(c){ return load().messages.filter(m => String(m.chatId)===String(c)); },
    getMessage(id){ return load().messages.find(m => String(m.id)===String(id)); },
    updateMessage(id, patch){ const m=this.getMessage(id); if(!m) return; Object.assign(m,patch); save(); return m; },
    deleteMessage(id, all){ if(all) this.updateMessage(id,{deleted:true,text:'',attachments:[]}); else { const d=load(); d.messages=d.messages.filter(x=>String(x.id)!==String(id)); save(); } },
    addContact(o,c){ const d=load(); if(d.contacts.find(x=>String(x.ownerId)===String(o)&&String(x.contactId)===String(c))) return; d.contacts.push({ownerId:String(o),contactId:String(c),createdAt:Date.now()}); save(); },
    removeContact(o,c){ const d=load(); d.contacts=d.contacts.filter(x=>!(String(x.ownerId)===String(o)&&String(x.contactId)===String(c))); save(); },
    contactsOf(u){ return load().contacts.filter(c=>String(c.ownerId)===String(u)).map(c=>this.findUserById(c.contactId)).filter(Boolean); },
    isContact(o,c){ return !!load().contacts.find(x=>String(x.ownerId)===String(o)&&String(x.contactId)===String(c)); },
    callsOf(u){ return load().calls.filter(c=>c.from===u||c.to===u).sort((a,b)=>b.createdAt-a.createdAt); },
    getSettings(u){ const d=load(); if(!d.settings[u]) d.settings[u]={theme:'system',lang:null,animations:true,compact:false}; return d.settings[u]; },
    setSettings(u, patch){ const s=this.getSettings(u); Object.assign(s,patch); save(); return s; }
  };
})();

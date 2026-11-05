async function syncChatsFromServer(){
  if (!State.me) return;
  try {
    const r = await fetch(API + '/api/chats/' + State.me.id);
    const data = await r.json();
    if (!data.ok) return;
    const d = DB.data;
    d.chats = d.chats.filter(c => !(c.members||[]).map(String).includes(String(State.me.id)));
    data.chats.forEach(c => {
      const localChat = {
        id: String(c.id),
        type: c.type,
        title: c.title,
        description: c.description,
        ownerId: c.owner_id ? String(c.owner_id) : null,
        members: (c.members||[]).map(m => String(m.id)),
        avatar: c.avatar || null,
        unread: 0,
        pinned: false,
        muted: false,
        isPublic: !!c.is_public,
        createdAt: new Date(c.created_at).getTime()
      };
      d.chats.push(localChat);
      (c.members||[]).forEach(m => {
        if (!DB.findUserById(m.id)){
          DB.createUser({
            id: String(m.id),
            email: m.email || null,
            firstName: m.first_name,
            lastName: m.last_name,
            username: m.username,
            avatar: m.avatar || null,
            bio: '',
            lastSeen: m.last_seen ? new Date(m.last_seen).getTime() : Date.now()
          });
        }
      });
    });
    DB.persist();
    renderChats();
  } catch (e) { console.error('syncChats', e); }
}

async function syncMessagesFromServer(chatId){
  try {
    const r = await fetch(API + '/api/messages/' + chatId);
    const data = await r.json();
    if (!data.ok) return;
    const d = DB.data;
    d.messages = d.messages.filter(m => String(m.chatId) !== String(chatId));
    data.messages.forEach(m => {
      d.messages.push({
        id: String(m.id),
        chatId: String(m.chat_id),
        senderId: String(m.sender_id),
        text: m.text || '',
        replyTo: m.reply_to ? String(m.reply_to) : null,
        edited: !!m.edited,
        deleted: !!m.deleted,
        attachments: [],
        reactions: {},
        createdAt: new Date(m.created_at).getTime()
      });
    });
    DB.persist();
    if (State.activeChat && String(State.activeChat.id) === String(chatId)){
      renderMessages();
    }
  } catch (e) { console.error('syncMsgs', e); }
}

async function checkNewMessages(){
  if (!State.me) return;
  const since = State.lastSeenMsgId || 0;
  try {
    const r = await fetch(API + '/api/updates/' + State.me.id + '?since=' + since);
    const data = await r.json();
    if (!data.ok || !data.messages.length) return;

    let maxId = since;
    let gotNew = false;

    for (const m of data.messages){
      if (m.id > maxId) maxId = m.id;

      const chatId = String(m.chat_id);
      const isMine = String(m.sender_id) === String(State.me.id);

      const exists = DB.data.messages.find(x => String(x.id) === String(m.id));
      if (!exists){
        DB.data.messages.push({
          id: String(m.id),
          chatId: chatId,
          senderId: String(m.sender_id),
          text: m.text || '',
          replyTo: null,
          edited: false,
          deleted: false,
          attachments: [],
          reactions: {},
          createdAt: new Date(m.created_at).getTime()
        });
      }

      if (!DB.findUserById(m.sender_id)){
        DB.createUser({
          id: String(m.sender_id),
          email: null,
          firstName: null,
          lastName: null,
          username: null,
          bio: '',
          avatar: null
        });
      }

      if (!isMine){
        gotNew = true;
        const isActive = State.activeChat && String(State.activeChat.id) === chatId
                       && document.getElementById('chatOverlay').classList.contains('open');
        const chat = DB.getChat(chatId);
        if (chat && !isActive){
          chat.unread = (chat.unread || 0) + 1;
        }
      }
    }

    State.lastSeenMsgId = maxId;
    localStorage.setItem('vexa.lastMsgId', String(maxId));
    DB.persist();

    if (State.activeChat){
      await syncMessagesFromServer(State.activeChat.id);
    }
    renderChats();

    if (gotNew){
      const last = data.messages[data.messages.length - 1];
      const chat = DB.getChat(last.chat_id);
      const sender = DB.findUserById(last.sender_id);
      if (sender && chat && (!State.activeChat || String(State.activeChat.id) !== String(last.chat_id))){
        toast(displayName(sender) + ': ' + (last.text || '').slice(0, 40), 'ok');
      }
    }
  } catch (e) { console.error('checkNew', e); }
}

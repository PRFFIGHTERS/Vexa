/* ============================================================
   i18n
   ============================================================ */
const STR = {
  ru:{
    'welcome.slogan':'Общение без границ','welcome.start':'Начать',
    'welcome.legal':'Продолжая, вы принимаете условия использования и политику конфиденциальности.',
    'auth.title':'Введите номер телефона','auth.sub':'Мы отправим SMS с кодом подтверждения','auth.phone':'Телефон',
    'auth.hint':'Формат: +7 900 000 00 00 (с кодом страны)','auth.continue':'Продолжить','auth.have':'Уже есть аккаунт?',
    'otp.title':'Введите код','otp.sub':'Мы отправили код на','otp.change':'Изменить номер',
    'otp.resend':'Отправить снова через','otp.confirm':'Подтвердить','otp.banner':'Ваш код:',
    'otp.check_mail':'Проверьте SMS. Код действует несколько минут.',
    'name.title':'Как вас зовут?','name.sub':'Это увидят другие пользователи VEXA',
    'name.first':'Имя *','name.last':'Фамилия','name.user':'Username','name.create':'Создать аккаунт',
    'tab.all':'Все','tab.personal':'Личные','tab.groups':'Группы','tab.channels':'Каналы','tab.unread':'Непрочитанные','tab.saved':'Избранное',
    'nav.chats':'Чаты','nav.contacts':'Контакты','nav.calls':'Звонки','nav.me':'Вы',
    'empty.chats':'У вас пока нет чатов','empty.chats_sub':'Начните общение.',
    'empty.cat':'В этой категории пусто','empty.cat_sub':'Здесь появятся ваши чаты.','empty.start':'Новый чат',
    'chat.no_msgs':'Сообщений пока нет','chat.no_msgs_sub':'Отправьте первое сообщение.',
    'chat.input_ph':'Сообщение...',
    'menu.saved':'Избранное','menu.settings':'Настройки','menu.privacy':'Приватность',
    'menu.invite':'Пригласить друзей','menu.help':'Помощь','menu.about':'О приложении','menu.logout':'Выйти',
    'menu.delete_account':'Удалить аккаунт','menu.notifications':'Уведомления',
    'contacts.empty':'Контактов пока нет','contacts.empty_sub':'Найдите пользователя.','contacts.add':'Добавить','contacts.remove':'Удалить','contacts.write':'Написать','contacts.search':'Поиск',
    'calls.empty':'Звонков пока нет','calls.empty_sub':'Здесь появится история звонков.','calls.unavailable':'Звонки требуют WebRTC-сервер.',
    'profile.edit':'Редактировать','profile.save':'Сохранить','profile.first':'Имя','profile.last':'Фамилия','profile.user':'Username','profile.bio':'О себе','profile.phone':'Телефон','profile.birthday':'Дата рождения','profile.close':'Закрыть','profile.delete':'Удалить чат',
    'settings.title':'Настройки','settings.theme':'Тема','settings.light':'Светлая','settings.dark':'Тёмная','settings.system':'Системная',
    'settings.lang':'Язык','settings.anim':'Анимации','settings.compact':'Компактный режим','settings.accent':'Акцентный цвет',
    'privacy.title':'Приватность','privacy.phone':'Кто видит мой номер','privacy.find':'Кто может найти по номеру','privacy.lastSeen':'Кто видит время посещения','privacy.online':'Кто видит, что я в сети','privacy.avatar':'Кто видит моё фото','privacy.bio':'Кто видит описание','privacy.groups':'Кто может добавлять в группы','privacy.calls':'Кто может звонить мне','privacy.forwards':'Ссылка на профиль при пересылке',
    'privacy.everyone':'Все','privacy.contacts':'Мои контакты','privacy.nobody':'Никто',
    'find.title':'Найти по email','find.hint':'Введите email','find.notfound':'Не найден','find.self':'Это ваш email','find.search':'Найти',
    'group.title':'Создать группу','group.name':'Название','group.desc':'Описание','group.members':'Участники','group.create':'Создать','group.no_contacts':'Нет пользователей',
    'channel.title':'Создать канал','channel.name':'Название','channel.desc':'Описание','channel.public':'Публичный','channel.create':'Создать',
    'sheet.title':'Создать','sheet.group':'Создать группу','sheet.channel':'Создать канал','sheet.find':'Найти по email','sheet.cancel':'Отмена',
    'confirm.title':'Подтверждение','confirm.delete_chat':'Удалить чат?','confirm.delete_msg':'Удалить сообщение?','confirm.logout':'Выйти?','confirm.delete_account':'Удалить аккаунт навсегда?','confirm.cancel':'Отмена','confirm.yes':'Удалить','confirm.delete_msg_all':'Удалить у всех?','confirm.delete_msg_me':'Удалить у себя?','confirm.delete_msg_all_text':'Сообщение будет удалено у всех участников.',
    'msg.edited':'изменено','msg.deleted':'Сообщение удалено','msg.you':'Вы',
    'toast.lang_switched':'Язык изменён','toast.theme':'Тема сохранена','toast.logged_out':'Вы вышли','toast.account_deleted':'Аккаунт удалён',
    'toast.welcome':'Добро пожаловать!','toast.profile_saved':'Профиль сохранён','toast.username_taken':'Username занят','toast.username_free':'Свободно',
    'toast.copied':'Скопировано','toast.contact_added':'Контакт добавлен','toast.contact_removed':'Контакт удалён','toast.chat_created':'Чат создан',
    'toast.group_created':'Группа создана','toast.channel_created':'Канал создан','toast.fill_name':'Введите имя','toast.select_members':'Выберите участников',
    'toast.file_sent':'Файл отправлен','toast.file_big':'Файл слишком большой (макс 3 МБ)','toast.msg_deleted_all':'Удалено у всех','toast.msg_deleted_me':'Удалено',
    'toast.server_error':'Ошибка сервера','toast.no_connection':'Нет связи с сервером. Подожди 30 сек',
    'toast.code_sent':'Код отправлен в SMS','toast.bad_email':'Введите корректный email (обязательно с @)',
    'err.phone':'Введите корректный номер (например +79991234567)','err.otp':'Неверный код',
    'status.online':'в сети','status.recently':'был недавно','status.just_now':'был только что','status.min_ago':'мин назад','status.hour_ago':'ч назад',
    'status.was_at':'Был в','status.was_yesterday':'Был вчера в','status.hidden':'был недавно',
    'profile.info':'Информация','profile.stories':'Истории','profile.no_stories':'Нет историй','profile.add_contact':'Добавить в контакты','profile.remove_contact':'Убрать из контактов','profile.send_msg':'Написать','profile.block':'Заблокировать','profile.report':'Пожаловаться','profile.share':'Поделиться'
  },
  en:{
    'welcome.slogan':'Communication without borders','welcome.start':'Get started',
    'welcome.legal':'By continuing you accept our terms of service and privacy policy.',
    'auth.title':'Enter your phone number','auth.sub':"We'll text you a verification code",'auth.phone':'Phone',
    'auth.hint':'Format: +1 555 000 0000 (with country code)','auth.continue':'Continue','auth.have':'Already have an account?',
    'otp.title':'Enter the code','otp.sub':'We sent a code to','otp.change':'Change phone',
    'otp.resend':'Resend in','otp.confirm':'Confirm','otp.banner':'Your code:',
    'otp.check_mail':'Check your SMS. The code expires in a few minutes.',
    'name.title':"What's your name?",'name.sub':'Other VEXA users will see this',
    'name.first':'First name *','name.last':'Last name','name.user':'Username','name.create':'Create account',
    'tab.all':'All','tab.personal':'Personal','tab.groups':'Groups','tab.channels':'Channels','tab.unread':'Unread','tab.saved':'Saved',
    'nav.chats':'Chats','nav.contacts':'Contacts','nav.calls':'Calls','nav.me':'You',
    'empty.chats':'No chats yet','empty.chats_sub':'Start a conversation.','empty.cat':'Nothing here','empty.cat_sub':'Chats will appear here.','empty.start':'New chat',
    'chat.no_msgs':'No messages yet','chat.no_msgs_sub':'Send the first message.','chat.input_ph':'Message...',
    'menu.saved':'Saved','menu.settings':'Settings','menu.privacy':'Privacy','menu.invite':'Invite friends',
    'menu.help':'Help','menu.about':'About','menu.logout':'Log out','menu.delete_account':'Delete account','menu.notifications':'Notifications',
    'contacts.empty':'No contacts yet','contacts.empty_sub':'Find a user.','contacts.add':'Add','contacts.remove':'Remove','contacts.write':'Message','contacts.search':'Search',
    'calls.empty':'No calls yet','calls.empty_sub':'Call history appears here.','calls.unavailable':'Calls require a WebRTC server.',
    'profile.edit':'Edit','profile.save':'Save','profile.first':'First name','profile.last':'Last name','profile.user':'Username','profile.bio':'About','profile.phone':'Phone','profile.birthday':'Birthday','profile.close':'Close','profile.delete':'Delete chat',
    'settings.title':'Settings','settings.theme':'Theme','settings.light':'Light','settings.dark':'Dark','settings.system':'System',
    'settings.lang':'Language','settings.anim':'Animations','settings.compact':'Compact','settings.accent':'Accent',
    'privacy.title':'Privacy','privacy.phone':'Who sees my phone','privacy.find':'Who can find me by phone','privacy.lastSeen':'Who sees my last seen','privacy.online':'Who sees my online status','privacy.avatar':'Who sees my photo','privacy.bio':'Who sees my bio','privacy.groups':'Who can add me to groups','privacy.calls':'Who can call me','privacy.forwards':'Profile link in forwards',
    'privacy.everyone':'Everyone','privacy.contacts':'My contacts','privacy.nobody':'Nobody',
    'find.title':'Find by email','find.hint':'Enter an email','find.notfound':'Not found','find.self':'This is your email','find.search':'Search',
    'group.title':'New group','group.name':'Name','group.desc':'Description','group.members':'Members','group.create':'Create','group.no_contacts':'No users',
    'channel.title':'New channel','channel.name':'Name','channel.desc':'Description','channel.public':'Public','channel.create':'Create',
    'sheet.title':'Create','sheet.group':'Create group','sheet.channel':'Create channel','sheet.find':'Find by email','sheet.cancel':'Cancel',
    'confirm.title':'Confirm','confirm.delete_chat':'Delete chat?','confirm.delete_msg':'Delete message?','confirm.logout':'Log out?','confirm.delete_account':'Delete account permanently?','confirm.cancel':'Cancel','confirm.yes':'Delete','confirm.delete_msg_all':'Delete for everyone?','confirm.delete_msg_me':'Delete for me?','confirm.delete_msg_all_text':'Message will be deleted for all members.',
    'msg.edited':'edited','msg.deleted':'Message deleted','msg.you':'You',
    'toast.lang_switched':'Language changed','toast.theme':'Theme saved','toast.logged_out':'Signed out','toast.account_deleted':'Account deleted','toast.welcome':'Welcome!','toast.profile_saved':'Profile saved','toast.username_taken':'Username taken','toast.username_free':'Available','toast.copied':'Copied','toast.contact_added':'Contact added','toast.contact_removed':'Contact removed','toast.chat_created':'Chat created','toast.group_created':'Group created','toast.channel_created':'Channel created','toast.fill_name':'Enter a name','toast.select_members':'Select members','toast.file_sent':'File sent','toast.file_big':'File too large (max 3 MB)','toast.msg_deleted_all':'Deleted for everyone','toast.msg_deleted_me':'Deleted',
    'toast.server_error':'Server error','toast.no_connection':'No connection. Try again in 30 sec',
    'toast.code_sent':'Code sent via SMS','toast.bad_email':'Enter a valid email (must contain @)',
    'err.phone':'Enter a valid phone (e.g. +15550000000)','err.otp':'Wrong code',
    'status.online':'online','status.recently':'last seen recently','status.just_now':'last seen just now','status.min_ago':'min ago','status.hour_ago':'h ago',
    'status.was_at':'Last seen at','status.was_yesterday':'Last seen yesterday at','status.hidden':'last seen recently',
    'profile.info':'Info','profile.stories':'Stories','profile.no_stories':'No stories','profile.add_contact':'Add to contacts','profile.remove_contact':'Remove from contacts','profile.send_msg':'Message','profile.block':'Block','profile.report':'Report','profile.share':'Share'
  }
};
let LANG = localStorage.getItem('vexa.ui.lang') || (navigator.language.startsWith('ru') ? 'ru' : 'en');
const t = k => (STR[LANG] && STR[LANG][k]) || (STR.ru[k]) || k;

function applyLang(){
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll('#langWelcome button').forEach(b => b.classList.toggle('on', b.dataset.lang === LANG));
  const cb = document.getElementById('codeBanner');
  if (cb && cb.dataset.mode === 'info') cb.textContent = t('otp.check_mail');
  const mi = document.getElementById('msgInput'); if (mi) mi.placeholder = t('chat.input_ph');
}
function setLang(l){
  LANG = l; localStorage.setItem('vexa.ui.lang', l); applyLang();
  const sid = DB.getSession(); if (sid) DB.setSettings(sid, {lang:l});
  if (State.me){ renderChats(); renderContactsList(); renderCallsList(); updateMePanel(); }
}

function digitsOf(s){ return (s||'').replace(/\D/g,''); }

function updateMePanel(){
  const u = State.me; if (!u) return;
  const av = document.getElementById('meAvatar');
  if (u.avatar) av.innerHTML = `<img src="${esc(u.avatar)}" alt=""/>`;
  else av.textContent = initials(u);
  document.getElementById('meName').textContent = displayName(u);
  document.getElementById('meUsername').textContent = u.username ? '@'+u.username : '@—';
}

document.getElementById('meHero').onclick = () => openProfilePage();
document.querySelectorAll('#meMenu button').forEach(b => {
  b.onclick = async () => {
    switch(b.dataset.action){
      case 'saved':    openSavedChat(); break;
      case 'settings': openSettingsPage(); break;
      case 'privacy':  openPrivacyPage(); break;
      case 'invite':   openInvitePage(); break;
      case 'help':     openHelpPage(); break;
      case 'about':    openAboutPage(); break;
      case 'notifications':
        await subscribeToPush();
        break;
      case 'logout':   doLogout(); break;
      case 'delete':   doDeleteAccount(); break;
    }
  };
});

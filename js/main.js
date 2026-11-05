/* ============================================================
   BOOT
   ============================================================ */
(function boot(){
  applyLang();
  const sid = DB.getSession();
  if (sid && DB.findUserById(sid)) bootUser(sid);
  else showScreen('welcome');
})();

window.closeModal = closeModal;

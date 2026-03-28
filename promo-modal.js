/* promo-modal.js
   Show modal by default (HTML sets the checkbox checked).
   Remember dismissal in localStorage so the modal shows only once per visitor.
   Non-invasive: does not modify existing JS; just reads/writes one localStorage key.
*/
(function(){
  var KEY = 'promoModalDismissed_v1';
  try {
    var dismissed = localStorage.getItem(KEY);
    var checkbox = document.getElementById('promo-modal-toggle');
    if (!checkbox) return;
    // If previously dismissed, hide modal immediately
    if (dismissed) {
      checkbox.checked = false;
      return;
    }
    // When the user unchecks (closes) the modal, set the flag
    checkbox.addEventListener('change', function(){
      if (!checkbox.checked) {
        try { localStorage.setItem(KEY, '1'); } catch(e) { /* ignore */ }
      }
    }, { passive: true });
    // Also set flag if user clicks close controls (labels) which toggle the checkbox
    // no extra handlers needed; change listener covers it.
  } catch (e) {
    // If localStorage is unavailable, do nothing and leave modal behavior default.
    return;
  }
})();

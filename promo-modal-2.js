/* promo-modal.js
   Show modal by default (HTML sets the checkbox checked).
   Remember dismissal in localStorage so the modal shows only once per visitor.
   Non-invasive: does not modify existing JS; just reads/writes one localStorage key.
*/
(function(){
  var KEY = 'promoModalDismissed_v1';
  try {
    var dismissed = sessionStorage.getItem(KEY);
    var checkbox = document.getElementById('promo-modal-toggle');
    if (!checkbox) return;
    if (dismissed) {
      checkbox.checked = false;
      return;
    }
    checkbox.addEventListener('change', function(){
      if (!checkbox.checked) {
        try { sessionStorage.setItem(KEY, '1'); } catch(e) { /* ignore */ }
      }
    }, { passive: true });
  } catch (e) {
    return;
  }
})();
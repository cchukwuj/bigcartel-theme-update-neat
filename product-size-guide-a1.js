/* product-size-guide.js
   Convert explicit CSV blocks marked with START/END markers into a SIZE GUIDE
   button that reveals a styled table. Markers must include the phrases
   START SIZE GUIDE and END SIZE GUIDE (they can be inside their own paragraphs).
*/
(function(){
  var container = document.querySelector('.product-description');
  if (!container) return;

  var START_MARK = 'START SIZE GUIDE';
  var END_MARK = 'END SIZE GUIDE';

  var childNodes = Array.prototype.slice.call(container.childNodes || []);
  if (!childNodes.length) return;

  var styleInjected = false;
  function injectStyle(){
    if (styleInjected) return;
    var style = document.createElement('style');
    style.type = 'text/css';
  style.textContent = '\n/* Table + button styles only - modal visuals rely on theme.css promo-modal rules */\n.tg{border-collapse:collapse;border-spacing:0}.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;overflow:hidden;padding:10px 5px;word-break:normal}.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;font-weight:700;overflow:hidden;padding:10px 5px;word-break:normal}.tg .tg-0lax{text-align:left;vertical-align:top}\n.size-guide-button{display:inline-block;margin:8px 0;padding:8px 12px;background:#111;color:#fff;border-radius:4px;text-decoration:none;cursor:pointer;font-size:13px;border:none}\n.promo-modal .tg{width:100%;max-width:520px;margin:12px auto;border-collapse:collapse}\n@media(max-width:520px){.promo-modal .tg{margin:8px auto}}\n';
    document.head.appendChild(style);
    styleInjected = true;
  }

  function textOf(node){ return (node.textContent || '').trim(); }

  function buildTable(rows){
    var table = document.createElement('table'); table.className = 'tg';
    var thead = document.createElement('thead'); var htr = document.createElement('tr');
    rows[0].forEach(function(h){ var th = document.createElement('th'); th.className='tg-0lax'; th.innerText = h; htr.appendChild(th); });
    thead.appendChild(htr); table.appendChild(thead);
    var tbody = document.createElement('tbody');
    for (var i=1;i<rows.length;i++){ var tr=document.createElement('tr'); rows[i].forEach(function(cell){ var td=document.createElement('td'); td.className='tg-0lax'; td.innerText=cell; tr.appendChild(td); }); tbody.appendChild(tr); }
    table.appendChild(tbody); return table;
  }

  for (var i = 0; i < childNodes.length; i++){
    var node = childNodes[i];
    var txt = textOf(node) || '';
    var txtUpper = txt.toUpperCase();
    if (txtUpper.indexOf(START_MARK) === -1) continue;

    // find matching end marker
    var startNode = node;
    var endNode = null;
    var startText = textOf(startNode) || '';
    var startTextUpper = startText.toUpperCase();
    if (startTextUpper.indexOf(END_MARK, startTextUpper.indexOf(START_MARK) + START_MARK.length) !== -1){
      endNode = startNode;
    } else {
      for (var j = i+1; j < childNodes.length; j++){
        if ((textOf(childNodes[j]) || '').toUpperCase().indexOf(END_MARK) !== -1){ endNode = childNodes[j]; break; }
      }
    }
    if (!endNode) continue; // no matching END found

    // collect CSV-like lines between markers
    var csvLines = [];
    if (startNode === endNode){
      var full = textOf(startNode);
      var fullUpper = full.toUpperCase();
      var startIdx = fullUpper.indexOf(START_MARK);
      var endIdx = fullUpper.indexOf(END_MARK, startIdx + START_MARK.length);
      if (startIdx === -1 || endIdx === -1) continue;
      var between = full.substring(startIdx + START_MARK.length, endIdx);
      between.split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
    } else {
      // after start marker in startNode
      var startTextRaw = textOf(startNode);
      var startTextUpper = startTextRaw.toUpperCase();
      var startIdxLocal = startTextUpper.indexOf(START_MARK);
      if (startIdxLocal !== -1) {
        var afterStart = startTextRaw.substring(startIdxLocal + START_MARK.length);
        afterStart.split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
      }
      // nodes in between
      for (var k = i+1; k < childNodes.length && childNodes[k] !== endNode; k++){
        textOf(childNodes[k]).split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
      }
      // before end marker in endNode
      var endTextRaw = textOf(endNode);
      var endTextUpper = endTextRaw.toUpperCase();
      var endIdxLocal = endTextUpper.indexOf(END_MARK);
      if (endIdxLocal !== -1) {
        var beforeEnd = endTextRaw.substring(0, endIdxLocal);
        beforeEnd.split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
      }
    }

    // strip surrounding quotes/marker lines and empty rows
    csvLines = csvLines.map(function(l){ return l.replace(/^"+|"+$/g,'').trim(); }).filter(function(l){ return l && l.toUpperCase().indexOf(START_MARK)===-1 && l.toUpperCase().indexOf(END_MARK)===-1; });
    if (csvLines.length < 2) continue;

    var rows = csvLines.map(function(line){ return line.split(',').map(function(c){ return c.trim(); }); });
    var colCount = rows[0].length; if (colCount < 2) continue;
    if (!rows.every(function(r){ return r.length === colCount; })) continue;

  injectStyle();
  var table = buildTable(rows);

  // build modal using the site's promo-modal classes so it visually matches
  var modal = document.createElement('div'); modal.className = 'promo-modal'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-hidden','true');
  // overlay and content (reuse promo-modal CSS in theme.css)
  var modalOverlayInner = document.createElement('div'); modalOverlayInner.className = 'promo-modal-overlay';
  var modalContent = document.createElement('div'); modalContent.className = 'promo-modal-content'; modalContent.setAttribute('tabindex','-1');
  // create a hidden checkbox toggle similar to the promo modal pattern so a <label> can close it
  var toggleId = 'promo-modal-toggle-size-' + Math.floor(Math.random()*1000000);
  var modalToggle = document.createElement('input'); modalToggle.type = 'checkbox'; modalToggle.id = toggleId; modalToggle.className = 'promo-modal-toggle'; modalToggle.setAttribute('aria-hidden', 'true');
  // the label will only toggle the checkbox if the input exists in the DOM - append it (hidden via CSS)
  if (document && document.body) document.body.appendChild(modalToggle);
  // create a label as the close control (preserve original label styling) but wire a click handler
  var closeLabel = document.createElement('label'); closeLabel.className = 'promo-modal-close'; closeLabel.setAttribute('for', toggleId); closeLabel.setAttribute('aria-label', 'Close size guide'); closeLabel.innerText = '×';
  modalContent.appendChild(closeLabel);
  modalContent.appendChild(table);
  modal.appendChild(modalOverlayInner);
  modal.appendChild(modalContent);

  var btn = document.createElement('button'); btn.type='button'; btn.className='size-guide-button'; btn.setAttribute('aria-expanded','false'); btn.innerText='SIZE GUIDE';
  var uid = 'size-guide-' + Math.floor(Math.random()*1000000);
  modalContent.id = uid; btn.setAttribute('aria-controls', uid);

  // open/close helpers (use inline styles so we don't depend on checkbox trick)
  var lastFocus = null;
  function openModal(){
    console.log('size-guide: openModal called', { modalToggleChecked: (typeof modalToggle !== 'undefined' && modalToggle) ? modalToggle.checked : undefined, activeElement: document.activeElement && (document.activeElement.tagName || document.activeElement.id || document.activeElement.className) });
    lastFocus = document.activeElement;
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    modal.style.pointerEvents = 'auto';
    modal.setAttribute('aria-hidden','false');
    btn.setAttribute('aria-expanded','true');
    try{ document.body.classList.add('no-scroll'); }catch(e){}
    setTimeout(function(){ try { modalContent.focus(); } catch (err) { console.warn('size-guide: modalContent.focus() failed', err); } }, 10);
    console.log('size-guide: modal opened', { ariaHidden: modal.getAttribute('aria-hidden'), ariaExpanded: btn.getAttribute('aria-expanded') });
  }
  function closeModal(){
    console.log('size-guide: closeModal called', { modalToggleChecked: (typeof modalToggle !== 'undefined' && modalToggle) ? modalToggle.checked : undefined });
    lastFocus = lastFocus || null;
    modal.style.opacity = '';
    modal.style.visibility = '';
    modal.style.pointerEvents = '';
    modal.setAttribute('aria-hidden','true');
    btn.setAttribute('aria-expanded','false');
    try{ document.body.classList.remove('no-scroll'); }catch(e){}
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); }
      catch (err) { console.warn('size-guide: restoring focus failed', err); }
    }
    console.log('size-guide: modal closed', { ariaHidden: modal.getAttribute('aria-hidden'), ariaExpanded: btn.getAttribute('aria-expanded') });
  }

  // wire the hidden checkbox so clicking the label toggles the modal and JS responds
  modalToggle.addEventListener('change', function(){ if (modalToggle.checked){ openModal(); } else { closeModal(); } }, { passive: true });

  // button opens by checking the toggle (label closes it)
  btn.addEventListener('click', function(){ modalToggle.checked = true; modalToggle.dispatchEvent(new Event('change')); }, { passive: true });
  // also add a direct click handler on the label to ensure close happens reliably
  closeLabel.addEventListener('click', function(e){
    // prevent the label's default toggle behavior (which runs after the click handler)
    // so we can reliably control the checkbox state and avoid it being re-checked.
    try { e.preventDefault(); e.stopPropagation(); } catch (err) { /* ignore if event not available */ }
    console.log('size-guide: closeLabel clicked', { modalToggleChecked: (typeof modalToggle !== 'undefined' && modalToggle) ? modalToggle.checked : undefined });
    // prefer using the checkbox change path if present, otherwise call closeModal directly
    try {
      if (modalToggle && modalToggle.checked) {
        console.log('size-guide: closeLabel click - using checkbox change path');
        // uncheck and dispatch change so the existing change handler runs
        modalToggle.checked = false;
        modalToggle.dispatchEvent(new Event('change'));
        return;
      }
    } catch (e) {console.warn('size-guide: closeLabel click - error using checkbox path, falling back to direct close', e); }
    // fallback
    closeModal();
  });
  // overlay click closes by unchecking
  modalOverlayInner.addEventListener('click', function(){ 
    console.log('size-guide: overlay clicked', { modalToggleChecked: (typeof modalToggle !== 'undefined' && modalToggle) ? modalToggle.checked : undefined });
    modalToggle.checked = false; 
    modalToggle.dispatchEvent(new Event('change')); 
  }, { passive: true });
  // Esc closes
  document.addEventListener('keydown', function(e){ if ((e.key === 'Escape' || e.key === 'Esc') && modalToggle.checked){ modalToggle.checked = false; modalToggle.dispatchEvent(new Event('change')); } });

  var containerDiv = document.createElement('div'); containerDiv.className='product-size-guide'; containerDiv.appendChild(btn);

  // append modal to body so it's outside content flow
  if (document && document.body) document.body.appendChild(modal);

    // Remove nodes from startNode to endNode inclusive, but preserve text outside markers in same node
    var nodesToRemove = [];
    var started = false;
    childNodes.forEach(function(n){ if (n === startNode) started = true; if (started) nodesToRemove.push(n); if (n === endNode) started = false; });

    if (nodesToRemove.length === 1){
      var single = nodesToRemove[0];
  var fullText = single.textContent || '';
  var fullTextUpper = fullText.toUpperCase();
  var startPos = fullTextUpper.indexOf(START_MARK);
  var endPos = fullTextUpper.indexOf(END_MARK, startPos + START_MARK.length);
  var before = startPos > -1 ? fullText.substring(0, startPos) : '';
  var after = (endPos > -1) ? fullText.substring(endPos + END_MARK.length) : '';
      var parent = single.parentNode;
      if (before.trim()) { var pBefore = document.createElement('p'); pBefore.textContent = before.trim(); parent.insertBefore(pBefore, single); }
      parent.insertBefore(containerDiv, single);
      if (after.trim()) { var pAfter = document.createElement('p'); pAfter.textContent = after.trim(); parent.insertBefore(pAfter, single); }
      parent.removeChild(single);
    } else {
      var first = nodesToRemove[0]; var parent = first.parentNode; parent.insertBefore(containerDiv, first);
      nodesToRemove.forEach(function(n){ if (n.parentNode) n.parentNode.removeChild(n); });
    }

    break; // handle only first marked block per product description
  }
})();

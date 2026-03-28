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
    style.textContent = '\n.tg{border-collapse:collapse;border-spacing:0}.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;overflow:hidden;padding:10px 5px;word-break:normal}.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;font-weight:700;overflow:hidden;padding:10px 5px;word-break:normal}.tg .tg-0lax{text-align:left;vertical-align:top}\n.size-guide-button{display:inline-block;margin:8px 0;padding:8px 12px;background:#111;color:#fff;border-radius:4px;text-decoration:none;cursor:pointer;font-size:13px;border:none}.size-guide-wrapper{margin-top:10px}.size-guide-wrapper .tg{width:100%;max-width:620px}.size-guide-wrapper.hidden{display:none}\n/* Modal styles for size guide popup */\n.size-guide-modal-overlay{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}\n.size-guide-modal{background:#fff;color:#111;border-radius:8px;max-width:900px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 10px 30px rgba(0,0,0,0.3)}\n.size-guide-modal-content{padding:40px 22px 22px 22px;position:relative}\n.size-guide-modal-close{position:absolute;right:14px;top:12px;border:none;background:transparent;font-size:22px;line-height:1;color:#333;cursor:pointer;padding:8px;border-radius:4px}\n.size-guide-modal .tg{width:auto;max-width:820px;border-collapse:collapse;margin:18px auto}\n@media(max-width:520px){.size-guide-modal{padding:0;width:100%;max-width:100%}.size-guide-modal-content{padding:18px 12px}}\n';
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

  // create modal overlay + dialog
  var modalOverlay = document.createElement('div'); modalOverlay.className = 'size-guide-modal-overlay'; modalOverlay.style.display = 'none'; modalOverlay.setAttribute('aria-hidden', 'true');
  var modalDialog = document.createElement('div'); modalDialog.className = 'size-guide-modal'; modalDialog.setAttribute('role', 'dialog'); modalDialog.setAttribute('aria-modal', 'true'); modalDialog.setAttribute('tabindex', '-1');
  var modalContent = document.createElement('div'); modalContent.className = 'size-guide-modal-content';
  var closeModalBtn = document.createElement('button'); closeModalBtn.type = 'button'; closeModalBtn.className = 'size-guide-modal-close'; closeModalBtn.setAttribute('aria-label', 'Close size guide'); closeModalBtn.innerText = '×';
  modalContent.appendChild(closeModalBtn);
  modalContent.appendChild(table);
  modalDialog.appendChild(modalContent);
  modalOverlay.appendChild(modalDialog);

  var btn = document.createElement('button'); btn.type='button'; btn.className='size-guide-button'; btn.setAttribute('aria-expanded','false'); btn.innerText='SIZE GUIDE';
  var uid = 'size-guide-' + Math.floor(Math.random()*1000000);
  modalDialog.id = uid; btn.setAttribute('aria-controls', uid);

  // open/close helpers
  var lastFocus = null;
  function openModal(){ lastFocus = document.activeElement; modalOverlay.style.display = 'flex'; modalOverlay.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true'); try{ document.body.style.overflow = 'hidden'; }catch(e){}; setTimeout(function(){ modalDialog.focus(); }, 10); }
  function closeModal(){ modalOverlay.style.display = 'none'; modalOverlay.setAttribute('aria-hidden','true'); btn.setAttribute('aria-expanded','false'); try{ document.body.style.overflow = ''; }catch(e){}; if (lastFocus && lastFocus.focus) { lastFocus.focus(); } }

  btn.addEventListener('click', function(){ openModal(); }, { passive: true });
  closeModalBtn.addEventListener('click', function(e){ e.stopPropagation(); closeModal(); }, { passive: true });
  modalOverlay.addEventListener('click', function(e){ if (e.target === modalOverlay) closeModal(); }, { passive: true });
  document.addEventListener('keydown', function(e){ if ((e.key === 'Escape' || e.key === 'Esc') && modalOverlay.style.display !== 'none'){ closeModal(); } });

  var containerDiv = document.createElement('div'); containerDiv.className='product-size-guide'; containerDiv.appendChild(btn);

  // append modalOverlay to body so it's outside content flow
  if (document && document.body) document.body.appendChild(modalOverlay);

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

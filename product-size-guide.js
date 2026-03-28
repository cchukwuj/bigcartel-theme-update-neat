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
    style.textContent = '\n.tg{border-collapse:collapse;border-spacing:0}.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;overflow:hidden;padding:10px 5px;word-break:normal}.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal}.tg .tg-0lax{text-align:left;vertical-align:top}\n.size-guide-button{display:inline-block;margin:8px 0;padding:8px 12px;background:#111;color:#fff;border-radius:4px;text-decoration:none;cursor:pointer;font-size:13px;border:none}.size-guide-wrapper{margin-top:10px}.size-guide-wrapper .tg{width:100%;max-width:620px}.size-guide-wrapper.hidden{display:none}\n';
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
    var txt = textOf(node);
    if (txt.indexOf(START_MARK) === -1) continue;

    // find matching end marker
    var startNode = node;
    var endNode = null;
    var startText = textOf(startNode);
    if (startText.indexOf(END_MARK, startText.indexOf(START_MARK) + START_MARK.length) !== -1){
      endNode = startNode;
    } else {
      for (var j = i+1; j < childNodes.length; j++){
        if (textOf(childNodes[j]).indexOf(END_MARK) !== -1){ endNode = childNodes[j]; break; }
      }
    }
    if (!endNode) continue; // no matching END found

    // collect CSV-like lines between markers
    var csvLines = [];
    if (startNode === endNode){
      var full = textOf(startNode);
      var between = full.substring(full.indexOf(START_MARK) + START_MARK.length, full.indexOf(END_MARK));
      between.split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
    } else {
      // after start marker in startNode
      var afterStart = textOf(startNode).substring(textOf(startNode).indexOf(START_MARK) + START_MARK.length);
      afterStart.split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
      // nodes in between
      for (var k = i+1; k < childNodes.length && childNodes[k] !== endNode; k++){
        textOf(childNodes[k]).split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
      }
      // before end marker in endNode
      var beforeEnd = textOf(endNode).substring(0, textOf(endNode).indexOf(END_MARK));
      beforeEnd.split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
    }

    // strip surrounding quotes/marker lines and empty rows
    csvLines = csvLines.map(function(l){ return l.replace(/^"+|"+$/g,'').trim(); }).filter(function(l){ return l && l.toUpperCase().indexOf(START_MARK)===-1 && l.toUpperCase().indexOf(END_MARK)===-1; });
    if (csvLines.length < 2) continue;

    var rows = csvLines.map(function(line){ return line.split(',').map(function(c){ return c.trim(); }); });
    var colCount = rows[0].length; if (colCount < 2) continue;
    if (!rows.every(function(r){ return r.length === colCount; })) continue;

    injectStyle();
    var table = buildTable(rows);

    var wrapper = document.createElement('div'); wrapper.className = 'size-guide-wrapper hidden'; wrapper.appendChild(table);
    var btn = document.createElement('button'); btn.type='button'; btn.className='size-guide-button'; btn.setAttribute('aria-expanded','false'); btn.innerText='SIZE GUIDE';
    var uid = 'size-guide-' + Math.floor(Math.random()*1000000); wrapper.id = uid; btn.setAttribute('aria-controls', uid);
    btn.addEventListener('click', function(){ var hidden = wrapper.classList.contains('hidden'); if (hidden){ wrapper.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); wrapper.scrollIntoView({behavior:'smooth', block:'center'}); } else { wrapper.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); } }, { passive: true });

    var containerDiv = document.createElement('div'); containerDiv.className='product-size-guide'; containerDiv.appendChild(btn); containerDiv.appendChild(wrapper);

    // Remove nodes from startNode to endNode inclusive, but preserve text outside markers in same node
    var nodesToRemove = [];
    var started = false;
    childNodes.forEach(function(n){ if (n === startNode) started = true; if (started) nodesToRemove.push(n); if (n === endNode) started = false; });

    if (nodesToRemove.length === 1){
      var single = nodesToRemove[0];
      var fullText = single.textContent || '';
      var before = fullText.substring(0, fullText.indexOf(START_MARK));
      var after = fullText.substring(fullText.indexOf(END_MARK) + END_MARK.length);
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

      for (var i = 0; i < childNodes.length; i++){
        var node = childNodes[i];
        var txt = textOf(node);
        if (txt.indexOf(START_MARK) === -1) continue;

        // find matching end marker
        var startNode = node;
        var endNode = null;
        var startText = textOf(startNode);
        if (startText.indexOf(END_MARK, startText.indexOf(START_MARK) + START_MARK.length) !== -1){
          endNode = startNode;
        } else {
          for (var j = i+1; j < childNodes.length; j++){
            if (textOf(childNodes[j]).indexOf(END_MARK) !== -1){ endNode = childNodes[j]; break; }
          }
        }
        if (!endNode) continue; // no matching END found

        // collect CSV-like lines between markers
        var csvLines = [];
        if (startNode === endNode){
          var full = textOf(startNode);
          var between = full.substring(full.indexOf(START_MARK) + START_MARK.length, full.indexOf(END_MARK));
          between.split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
        } else {
          // after start marker in startNode
          var afterStart = textOf(startNode).substring(textOf(startNode).indexOf(START_MARK) + START_MARK.length);
          afterStart.split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
          // nodes in between
          for (var k = i+1; k < childNodes.length && childNodes[k] !== endNode; k++){
            textOf(childNodes[k]).split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
          }
          // before end marker in endNode
          var beforeEnd = textOf(endNode).substring(0, textOf(endNode).indexOf(END_MARK));
          beforeEnd.split(/\r?\n/).forEach(function(l){ var s = l.trim(); if (s) csvLines.push(s); });
        }

        // strip surrounding quotes/marker lines and empty rows
        csvLines = csvLines.map(function(l){ return l.replace(/^"+|"+$/g,'').trim(); }).filter(function(l){ return l && l.toUpperCase().indexOf(START_MARK)===-1 && l.toUpperCase().indexOf(END_MARK)===-1; });
        if (csvLines.length < 2) continue;

        var rows = csvLines.map(function(line){ return line.split(',').map(function(c){ return c.trim(); }); });
        var colCount = rows[0].length; if (colCount < 2) continue;
        if (!rows.every(function(r){ return r.length === colCount; })) continue;

        injectStyle();
        var table = buildTable(rows);

        var wrapper = document.createElement('div'); wrapper.className = 'size-guide-wrapper hidden'; wrapper.appendChild(table);
        var btn = document.createElement('button'); btn.type='button'; btn.className='size-guide-button'; btn.setAttribute('aria-expanded','false'); btn.innerText='SIZE GUIDE';
        var uid = 'size-guide-' + Math.floor(Math.random()*1000000); wrapper.id = uid; btn.setAttribute('aria-controls', uid);
        btn.addEventListener('click', function(){ var hidden = wrapper.classList.contains('hidden'); if (hidden){ wrapper.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); wrapper.scrollIntoView({behavior:'smooth', block:'center'}); } else { wrapper.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); } }, { passive: true });

        var containerDiv = document.createElement('div'); containerDiv.className='product-size-guide'; containerDiv.appendChild(btn); containerDiv.appendChild(wrapper);

        // Remove nodes from startNode to endNode inclusive, but preserve text outside markers in same node
        var nodesToRemove = [];
        var started = false;
        childNodes.forEach(function(n){ if (n === startNode) started = true; if (started) nodesToRemove.push(n); if (n === endNode) started = false; });

        if (nodesToRemove.length === 1){
          var single = nodesToRemove[0];
          var fullText = single.textContent || '';
          var before = fullText.substring(0, fullText.indexOf(START_MARK));
          var after = fullText.substring(fullText.indexOf(END_MARK) + END_MARK.length);
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
        if (csvLines.length < 2) continue; // need header + row

        // parse CSV rows
        var rows = csvLines.map(function(line){ return line.split(',').map(function(c){ return c.trim(); }); });
        var colCount = rows[0].length; if (colCount < 2) continue;
        if (!rows.every(function(r){ return r.length === colCount; })) continue;

        injectStyle();
        var table = buildTable(rows);

        // Build wrapper + button
        var wrapper = document.createElement('div'); wrapper.className='size-guide-wrapper hidden';
        wrapper.appendChild(table);
        var btn = document.createElement('button'); btn.type='button'; btn.className='size-guide-button'; btn.setAttribute('aria-expanded','false'); btn.innerText='SIZE GUIDE';
        var uniqueId = 'size-guide-' + Math.floor(Math.random()*1000000);
        wrapper.id = uniqueId; btn.setAttribute('aria-controls', uniqueId);
        btn.addEventListener('click', function(){ var hidden = wrapper.classList.contains('hidden'); if (hidden){ wrapper.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); wrapper.scrollIntoView({behavior:'smooth', block:'center'}); } else { wrapper.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); } }, { passive: true });

        var containerDiv = document.createElement('div'); containerDiv.className='product-size-guide'; containerDiv.appendChild(btn); containerDiv.appendChild(wrapper);

        // Replace nodes from startNode to endNode (inclusive) with containerDiv
        var nodesToRemove = [];
        var started = false;
        childNodes.forEach(function(n){ if (n === startNode) started = true; if (started) nodesToRemove.push(n); if (n === endNode) started = false; });
        // If startNode and endNode are same and that node contains other content besides markers,
        // attempt to preserve surrounding text by splitting. We'll handle basic cases: if the node's full text has extra content before/after markers.
        if (nodesToRemove.length === 1){
          var single = nodesToRemove[0];
          var full = single.textContent || '';
          var before = full.substring(0, full.indexOf(START_MARK));
          var after = full.substring(full.indexOf(END_MARK) + END_MARK.length);
          var parent = single.parentNode;
          var insertBeforeNode = single;
          // insert before paragraph with before text if present
          if (before.trim()){
            var pBefore = document.createElement('p'); pBefore.textContent = before.trim(); parent.insertBefore(pBefore, insertBeforeNode);
          }
          parent.insertBefore(containerDiv, insertBeforeNode);
          if (after.trim()){
            var pAfter = document.createElement('p'); pAfter.textContent = after.trim(); parent.insertBefore(pAfter, insertBeforeNode);
          }
          parent.removeChild(single);
        } else {
          // general case: remove each node and insert containerDiv at position of first removed node
          var first = nodesToRemove[0];
          var parent = first.parentNode;
          parent.insertBefore(containerDiv, first);
          nodesToRemove.forEach(function(n){ if (n.parentNode) n.parentNode.removeChild(n); });
        }

        // we've mutated the DOM; stop further processing
        break;
      }

    })();

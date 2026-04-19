// ─── CLAIMS ──────────────────────────────────────────────────────
function renderClaims(){
  document.getElementById('clD').value=new Date().toISOString().slice(0,10);
  const all=DB.claims;
  const pending=all.filter(c=>{const recv=c.installments?c.installments.reduce((s,i)=>s+i.amount,0):0;return recv<c.amount;});
  const done=all.filter(c=>{const recv=c.installments?c.installments.reduce((s,i)=>s+i.amount,0):c.claimed?c.amount:0;return recv>=c.amount;});
  const totalPending=pending.reduce((s,c)=>{const recv=c.installments?c.installments.reduce((x,i)=>x+i.amount,0):0;return s+(c.amount-recv);},0);
  const totalReceived=all.reduce((s,c)=>s+(c.installments?c.installments.reduce((x,i)=>x+i.amount,0):c.claimed?c.amount:0),0);
  document.getElementById('claimStats').innerHTML=[
    {label:'Still to collect',value:RM(totalPending),sub:pending.length+' claims'},
    {label:'Total received',value:RM(totalReceived),sub:'All time'},
  ].map(s=>`<div class="stat"><div class="stat-lbl">${s.label}</div><div class="stat-val">${s.value}</div><div class="stat-sub">${s.sub}</div></div>`).join('');

  function claimRow(c){
    const recv=c.installments?c.installments.reduce((s,i)=>s+i.amount,0):(c.claimed?c.amount:0);
    const left=c.amount-recv;
    const pct=Math.min(100,Math.round(recv/c.amount*100));
    const editing=c._editing;
    if(editing){
      return`<div class="card card-sm" style="margin-bottom:10px;background:#f0f7f2;border-left:3px solid var(--accent);">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <input id="cl-name-${c.id}" value="${c.name}" placeholder="Description" style="flex:2;min-width:120px;padding:5px 8px;border:1px solid var(--accent);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/>
          <input id="cl-from-${c.id}" value="${c.from||''}" placeholder="From" style="flex:1;min-width:100px;padding:5px 8px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/>
          <input type="number" id="cl-amt-${c.id}" value="${c.amount}" placeholder="Total (RM)" style="width:110px;padding:5px 8px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/>
          <input id="cl-date-${c.id}" value="${c.date||''}" style="width:130px;padding:5px 8px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:12px;outline:none;"/>
          <button class="btn btn-sm edit-save-btn" onclick="saveClaim('${c.id}')">Save</button>
          <button class="btn btn-sm" onclick="cancelClaim('${c.id}')">Cancel</button>
        </div>
      </div>`;
    }
    return`<div class="card card-sm" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:500;">${c.name}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;">From: ${c.from||'—'} · ${c.date||'—'}</div>
          <div style="margin-top:8px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
              <span style="color:var(--muted);">Received ${RM(recv)} of ${RM(c.amount)}</span>
              <span style="font-weight:500;color:${left>0?'var(--warn)':'var(--accent)'};">${left>0?RM(left)+' left':'Fully claimed'}</span>
            </div>
            <div class="prog-wrap" style="margin:0;"><div class="prog ${pct>=100?'p-safe':pct>0?'p-warn':'p-danger'}" style="width:${pct}%"></div></div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-sm btn-p" onclick="addInstallment('${c.id}')">+ Received</button>
          <button class="btn btn-sm" onclick="startEditClaim('${c.id}')">Edit</button>
          <button class="btn btn-sm btn-d" onclick="delClaim('${c.id}')">Del</button>
        </div>
      </div>
      ${(c.installments||[]).length?`<div style="margin-top:10px;border-top:1px solid var(--border);padding-top:8px;"><div style="font-size:11px;color:var(--muted);font-weight:500;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Payments received</div><table style="font-size:12px;width:100%;"><thead><tr><th>Amount</th><th>Date</th><th>Note</th><th></th></tr></thead><tbody>${(c.installments||[]).map(inst=>`<tr><td class="td-m">${RM(inst.amount)}</td><td class="td-m" style="color:var(--muted);">${inst.date||'—'}</td><td style="color:var(--muted);">${inst.note||'—'}</td><td><button class="btn btn-xs btn-d" onclick="delInstallment('${c.id}','${inst.id}')">Del</button></td></tr>`).join('')}</tbody></table></div>`:''}
      ${c._addingInst?`<div class="inst-card"><div class="inst-card-title">Log payment received</div><div style="display:grid;grid-template-columns:140px 160px 1fr;gap:12px;margin-bottom:12px;"><div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Amount (RM)</div><input type="number" id="inst-amt-${c.id}" placeholder="0" style="width:100%;padding:8px 10px;border:1.5px solid var(--accent);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:14px;font-weight:500;outline:none;font-family:'DM Mono',monospace;box-shadow:0 0 0 3px rgba(45,90,61,0.08);"/></div><div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Date</div><input type="date" id="inst-date-${c.id}" value="${new Date().toISOString().slice(0,10)}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div><div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Note (optional)</div><input type="text" id="inst-note-${c.id}" placeholder="e.g. First payment" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div></div><div style="display:flex;gap:8px;justify-content:flex-end;"><button class="btn" onclick="cancelInstallment('${c.id}')">Cancel</button><button class="btn edit-save-btn" onclick="saveInstallment('${c.id}')">Save payment</button></div></div>`:''}
    </div>`;
  }

  document.getElementById('clPending').innerHTML=pending.length?pending.map(claimRow).join(''):'<div class="empty"><div style="font-size:15px;margin-bottom:6px;">No pending claims</div><div style="font-size:12px;">Add money others owe you here so it shows in your financial picture.</div></div>';
  document.getElementById('clDone').innerHTML=done.length?`<div class="card card-sm"><table><thead><tr><th>Description</th><th>From</th><th>Amount</th><th>Date</th></tr></thead><tbody>${done.map(c=>`<tr style="opacity:.6;"><td>${c.name}</td><td>${c.from||'—'}</td><td class="td-m">${RM(c.amount)}</td><td class="td-m">${c.date||'—'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty" style="padding:16px;">None yet</div>';
}
function startEditClaim(id){const c=DB.claims.find(x=>x.id==id);if(c){c._editing=true;renderClaims();}}
function cancelClaim(id){const c=DB.claims.find(x=>x.id==id);if(c){delete c._editing;renderClaims();}}
function saveClaim(id){
  const c=DB.claims.find(x=>x.id==id);if(!c)return;
  c.name=document.getElementById('cl-name-'+id).value.trim()||c.name;
  c.from=document.getElementById('cl-from-'+id).value.trim();
  c.amount=parseFloat(document.getElementById('cl-amt-'+id).value)||c.amount;
  c.date=document.getElementById('cl-date-'+id).value;
  delete c._editing;
  save();toast('Updated');renderClaims();
}
function addInstallment(id){
  const c=DB.claims.find(x=>x.id==id);if(!c)return;
  c._addingInst=true;renderClaims();
  setTimeout(()=>{const el=document.getElementById('inst-amt-'+id);if(el)el.focus();},50);
}
function cancelInstallment(id){
  const c=DB.claims.find(x=>x.id==id);if(!c)return;
  delete c._addingInst;renderClaims();
}
function saveInstallment(id){
  const c=DB.claims.find(x=>x.id==id);if(!c)return;
  const amt=parseFloat(document.getElementById('inst-amt-'+id).value);
  if(isNaN(amt)||amt<=0){toast('Enter a valid amount');return;}
  const note=document.getElementById('inst-note-'+id).value.trim();
  const date=document.getElementById('inst-date-'+id).value||new Date().toISOString().slice(0,10);
  if(!c.installments)c.installments=[];
  c.installments.push({id:uid(),amount:amt,date,note});
  delete c._addingInst;
  save();toast('Payment received logged');renderClaims();renderDashboard();
}
function delInstallment(claimId,instId){
  const c=DB.claims.find(x=>x.id==claimId);if(!c)return;
  c.installments=(c.installments||[]).filter(i=>i.id!=instId);
  save();toast('Removed');renderClaims();renderDashboard();
}
function addClaim(){
  const name=document.getElementById('clN').value.trim();
  const from=document.getElementById('clFrom').value.trim();
  const amt=parseFloat(document.getElementById('clA').value);
  const date=document.getElementById('clD').value;
  if(!name||!amt)return;
  DB.claims.push({id:uid(),name,from,amount:amt,date,claimed:false});
  save();toast('Claim added');renderClaims();
  document.getElementById('clN').value='';document.getElementById('clFrom').value='';document.getElementById('clA').value='';
}
function delClaim(id){const c=DB.claims.find(x=>x.id==id);if(!c)return;DB.claims=DB.claims.filter(x=>x.id!==id);trashIt('claim',c,()=>{});save();toast('Moved to bin');renderClaims();renderDashboard();}

// ─── NOT MY MONEY ────────────────────────────────────────────────
function renderNotmine(){
  document.getElementById('nmD').value=new Date().toISOString().slice(0,10);
  const list=DB.notmine||[];
  if(!list.length){document.getElementById('nmList').innerHTML='<div class="empty">No entries</div>';return;}
  const totalHeld=list.reduce((s,n)=>s+n.total,0);
  const totalUsed=list.reduce((s,n)=>s+n.used,0);
  const totalLeft=totalHeld-totalUsed;
  let html=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
    <div class="stat"><div class="stat-lbl">Total held</div><div class="stat-val" style="font-size:18px;">${RM(totalHeld)}</div></div>
    <div class="stat"><div class="stat-lbl">Total used</div><div class="stat-val" style="font-size:18px;">${RM(totalUsed)}</div></div>
    <div class="stat"><div class="stat-lbl">Remaining</div><div class="stat-val" style="font-size:18px;color:var(--accent);">${RM(totalLeft)}</div></div>
  </div><div class="card card-sm"><div class="tw"><table><thead><tr><th>Description</th><th>For</th><th>Total</th><th>Used</th><th>Left</th><th>Date</th><th>Note</th><th></th></tr></thead><tbody>`;
  list.forEach(n=>{
    const left=n.total-n.used;
    if(n._editing){
      html+=`<tr><td colspan="8" style="padding:0;">
        <div class="inst-card" style="margin:6px 0;">
          <div class="inst-card-title">Edit entry</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 120px 120px 130px;gap:12px;margin-bottom:12px;">
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Description</div>
            <input id="nm-name-${n.id}" value="${(n.name||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px 10px;border:1.5px solid var(--accent);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;box-shadow:0 0 0 3px rgba(45,90,61,0.08);"/></div>
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">For</div>
            <input id="nm-for-${n.id}" value="${(n['for']||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div>
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Total (RM)</div>
            <input type="number" id="nm-total-${n.id}" value="${n.total}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/></div>
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Used (RM)</div>
            <input type="number" id="nm-used-${n.id}" value="${n.used}" min="0" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/></div>
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Date</div>
            <input id="nm-date-${n.id}" value="${n.date||''}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:12px;outline:none;"/></div>
          </div>
          <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Note</div>
          <input id="nm-note-${n.id}" value="${(n.note||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:12px;outline:none;margin-bottom:12px;"/></div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn" onclick="cancelNM('${n.id}')">Cancel</button>
            <button class="btn edit-save-btn" onclick="saveNM('${n.id}')">Save changes</button>
          </div>
        </div>
      </td></tr>`;
    } else {
      html+=`<tr>
        <td style="font-weight:500;">${n.name}</td>
        <td style="color:var(--muted);">${n['for']||'—'}</td>
        <td class="td-m">${RM(n.total)}</td>
        <td class="td-m">${RM(n.used)}</td>
        <td class="td-m" style="color:${left>0?'var(--accent)':'var(--muted)'};">${RM(left)}</td>
        <td class="td-m" style="color:var(--muted);font-size:11px;">${n.date||'—'}</td>
        <td style="max-width:160px;font-size:12px;color:var(--muted);">${n.note||'—'}</td>
        <td><div style="display:flex;gap:4px;white-space:nowrap;">
          <button class="btn btn-xs" onclick="startEditNM('${n.id}')">Edit</button>
          <button class="btn btn-xs btn-d" onclick="delNM('${n.id}')">Del</button>
        </div></td>
      </tr>`;
    }
  });
  html+=`</tbody></table></div></div>`;
  document.getElementById('nmList').innerHTML=html;
}
function addNM(){
  const name=document.getElementById('nmN').value.trim();
  const forWho=document.getElementById('nmFor').value.trim();
  const total=parseFloat(document.getElementById('nmT').value)||0;
  const used=parseFloat(document.getElementById('nmU').value)||0;
  const date=document.getElementById('nmD').value;
  if(!name)return;
  if(!DB.notmine)DB.notmine=[];
  const nmEntry={id:uid(),name,total,used,date,note:''};nmEntry['for']=forWho;DB.notmine.push(nmEntry);
  save();toast('Added');renderNotmine();
  document.getElementById('nmN').value='';document.getElementById('nmFor').value='';
  document.getElementById('nmT').value='';document.getElementById('nmU').value='';
}
function startEditNM(id){const n=(DB.notmine||[]).find(x=>x.id==id);if(n){n._editing=true;renderNotmine();}}
function cancelNM(id){const n=(DB.notmine||[]).find(x=>x.id==id);if(n){delete n._editing;renderNotmine();}}
function saveNM(id){
  const n=(DB.notmine||[]).find(x=>x.id==id);if(!n)return;
  const nameEl=document.getElementById('nm-name-'+id);
  const forEl=document.getElementById('nm-for-'+id);
  const totalEl=document.getElementById('nm-total-'+id);
  const usedEl=document.getElementById('nm-used-'+id);
  const dateEl=document.getElementById('nm-date-'+id);
  const noteEl=document.getElementById('nm-note-'+id);
  if(nameEl)n.name=nameEl.value.trim()||n.name;
  if(forEl)n['for']=forEl.value.trim();
  if(totalEl)n.total=parseFloat(totalEl.value)||n.total;
  if(usedEl)n.used=usedEl.value===''?0:parseFloat(usedEl.value)||0;
  if(dateEl)n.date=dateEl.value;
  if(noteEl)n.note=noteEl.value.trim();
  delete n._editing;
  save();toast('Updated');renderNotmine();
}
function delNM(id){const n=(DB.notmine||[]).find(x=>x.id==id);if(!n)return;DB.notmine=DB.notmine.filter(x=>x.id!==id);trashIt('notmine',n,()=>{});save();toast('Moved to bin');renderNotmine();}

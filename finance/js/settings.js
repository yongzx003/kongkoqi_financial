// ─── SETTINGS ────────────────────────────────────────────────────
function renderSettings(){
  populateFundSelects();

  // Fixed monthly deductions
  const fixedVaults=(DB.vaults||[]).filter(v=>v.fillMode==='fixed'&&!v.archived);
  document.getElementById('fixedCostList').innerHTML=fixedVaults.map(v=>`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
      ${badge(v.name,v.color)}
      <span style="font-size:11px;background:var(--bg);border:1px solid var(--border);color:var(--muted);padding:2px 8px;border-radius:20px;">Monthly fixed</span>
      <input type="number" id="fc-a-${v.id}" value="${v.fixedAmount}" style="width:100px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--bg);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/>
      <button class="btn btn-sm" onclick="updateFixedVault('${v.id}')">Update</button>
    </div>`).join('')||'<div style="font-size:13px;color:var(--muted);">No fixed vaults configured.</div>';

  // Vault allocation manager (percentage vaults)
  const pctVaults=(DB.vaults||[]).filter(v=>v.fillMode==='percentage'&&!v.archived);
  const totalPct=pctVaults.reduce((s,v)=>s+v.pct,0);
  document.getElementById('fundManager').innerHTML=pctVaults.map(v=>`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      ${badge(v.name,v.color)}
      <input type="text" id="fn-name-${v.id}" value="${v.name}" style="flex:1;min-width:100px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--bg);color:var(--text);font-size:13px;outline:none;"/>
      <input type="number" id="fn-pct-${v.id}" value="${v.pct}" min="0" max="100" style="width:60px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--bg);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/>
      <span style="font-size:12px;color:var(--muted);">%</span>
      <select id="fn-color-${v.id}" style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--bg);color:var(--text);font-size:13px;outline:none;">
        ${['purple','teal','amber','info','pink','accent','danger'].map(c=>`<option value="${c}"${v.color===c?' selected':''}>${c}</option>`).join('')}
      </select>
      <button class="btn btn-sm edit-save-btn" onclick="updatePctVault('${v.id}')">Save</button>
    </div>`).join('')||'<div style="font-size:13px;color:var(--muted);">No percentage vaults.</div>';

  const warn=totalPct!==100;
  document.getElementById('allocWarning').innerHTML=warn?`<div class="warn-box">Total allocation is ${totalPct}% — must equal 100%</div>`:`<div class="info-box" style="background:var(--accent-l);border-color:var(--accent);color:var(--accent);">Total: ${totalPct}% ✓</div>`;

  // Rule editor for percentage vaults
  document.getElementById('ruleEditor').innerHTML=pctVaults.map(v=>`
    <div style="margin-bottom:12px;">
      <div style="font-size:12px;font-weight:500;color:var(--muted);margin-bottom:4px;">${v.name} — decision rule</div>
      <div style="display:flex;gap:8px;">
        <textarea id="rule-${v.id}" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--bg);color:var(--text);font-size:13px;outline:none;font-family:'DM Sans',sans-serif;resize:vertical;min-height:60px;">${v.rule||''}</textarea>
        <button class="btn btn-sm edit-save-btn" style="align-self:flex-start;" onclick="saveVaultRule('${v.id}')">Save</button>
      </div>
    </div>`).join('');

  // Transfer history
  const transfers=DB.transfers||[];
  document.getElementById('transferHistory').innerHTML=transfers.length?
    `<table style="margin-top:8px;"><thead><tr><th>From</th><th>To</th><th>Amount</th><th>Reason</th><th>Date</th></tr></thead><tbody>${transfers.slice().reverse().map(t=>`<tr><td>${vaultById(t.from)?.name||t.from}</td><td>${vaultById(t.to)?.name||t.to}</td><td class="td-m">${RM(t.amount)}</td><td>${t.reason||'—'}</td><td class="td-m">${t.date}</td></tr>`).join('')}</tbody></table>`
    :'';
}

function updateFixedVault(id){
  const v=vaultById(id);if(!v)return;
  v.fixedAmount=parseFloat(document.getElementById('fc-a-'+id).value)||v.fixedAmount;
  save();toast('Updated');renderSettings();
}

function addFixedVault(){
  const label=document.getElementById('fcN').value.trim();
  const amount=parseFloat(document.getElementById('fcA').value)||0;
  if(!label)return;
  DB.vaults.push({id:uid(),name:label,fillMode:'fixed',pct:0,fixedAmount:amount,type:'spending',target:0,goalLabel:'',rule:'',color:'info',archived:false,current:0,deposits:[]});
  save();toast('Fixed vault added');renderSettings();
  document.getElementById('fcN').value='';document.getElementById('fcA').value='';
}

function updatePctVault(id){
  const v=vaultById(id);if(!v)return;
  v.name=document.getElementById('fn-name-'+id).value.trim()||v.name;
  v.pct=parseInt(document.getElementById('fn-pct-'+id).value)||0;
  v.color=document.getElementById('fn-color-'+id).value;
  save();toast('Vault saved');renderSettings();populateFundSelects();
}

function addPctVault(){
  const name=document.getElementById('fnN').value.trim();
  const pct=parseInt(document.getElementById('fnP').value)||0;
  const color=document.getElementById('fnC').value;
  if(!name)return;
  DB.vaults.push({id:uid(),name,fillMode:'percentage',pct,fixedAmount:0,type:'spending',target:0,goalLabel:'',rule:'',color,archived:false,current:0,deposits:[]});
  save();toast('Vault added');renderSettings();
  document.getElementById('fnN').value='';document.getElementById('fnP').value='';
}

function saveVaultRule(id){const v=vaultById(id);if(v){v.rule=document.getElementById('rule-'+id).value.trim();save();toast('Rule saved');}}

function doTransfer(){
  const from=document.getElementById('tfFrom').value;
  const to=document.getElementById('tfTo').value;
  const amt=parseFloat(document.getElementById('tfAmt').value)||0;
  const reason=document.getElementById('tfReason').value.trim();
  if(!amt||from===to)return;
  const vFrom=vaultById(from);const vTo=vaultById(to);
  const today=new Date().toISOString().slice(0,10);
  if(vFrom){
    vFrom.deposits.push({id:uid(),type:'withdrawal',reason:'Transfer to '+(vTo?.name||to)+(reason?' · '+reason:''),amount:amt,date:today,destination:to});
    vFrom.current=vFrom.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
  }
  if(vTo){
    vTo.deposits.push({id:uid(),type:'deposit',reason:'Transfer from '+(vFrom?.name||from)+(reason?' · '+reason:''),amount:amt,date:today,source:from});
    vTo.current=vTo.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
  }
  if(!DB.transfers)DB.transfers=[];
  DB.transfers.push({id:uid(),from,to,amount:amt,reason,date:today});
  save();toast('Transfer done');renderSettings();
  document.getElementById('tfAmt').value='';document.getElementById('tfReason').value='';
}

function resetAll(){showConfirm('Reset all data?','This cannot be undone. All your data will be permanently deleted.',()=>{localStorage.removeItem('finOS_v2');DB=JSON.parse(JSON.stringify(DEFAULT));save();toast('Reset');go('dashboard');},true);}

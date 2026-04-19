// ─── SETTINGS ────────────────────────────────────────────────────
function renderSettings(){
  populateFundSelects();

  // Fixed costs (budget role only — vault auto-deposits live on vault cards)
  document.getElementById('fixedCostList').innerHTML=DB.fixedCosts.map(fc=>`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
      <span style="font-size:13px;min-width:120px;">${fc.label}</span>
      <span style="font-size:11px;background:var(--bg);border:1px solid var(--border);color:var(--muted);padding:2px 8px;border-radius:20px;">Monthly budget</span>
      <input type="number" id="fc-a-${fc.id}" value="${fc.amount}" style="width:100px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--bg);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/>
      <button class="btn btn-sm" onclick="updateFC('${fc.id}')">Update</button>
      <button class="btn btn-sm btn-d" onclick="delFC('${fc.id}')">Del</button>
    </div>`).join('');

  // Vault auto-deposits
  const vaultsWithAuto=DB.vaults.filter(v=>v.autoDeposit);
  document.getElementById('vaultAutoDepositList').innerHTML=vaultsWithAuto.length
    ?vaultsWithAuto.map(v=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
      <span style="font-size:13px;min-width:120px;">${v.name}</span>
      <span style="font-size:11px;background:var(--accent-l);color:var(--accent);padding:2px 8px;border-radius:20px;">↻ ${RM(v.autoDeposit.amount)}/mo</span>
      <span style="font-size:12px;color:var(--muted);">${v.autoDeposit.reason||''}</span>
      <button class="btn btn-sm btn-d" onclick="removeVaultAutoDeposit('${v.id}')">Remove</button>
      <span style="font-size:11px;color:var(--muted);">· Edit on vault card</span>
    </div>`).join('')
    :`<div style="font-size:13px;color:var(--muted);">No vault auto-deposits configured. Set one via the vault's Edit button.</div>`;

  // Fund manager
  const totalPct=DB.funds.reduce((s,f)=>s+f.pct,0);
  document.getElementById('fundManager').innerHTML=DB.funds.map(f=>`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      ${badge(f.name,f.color)}
      <input type="text" id="fn-name-${f.id}" value="${f.name}" style="flex:1;min-width:100px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--bg);color:var(--text);font-size:13px;outline:none;"/>
      <input type="number" id="fn-pct-${f.id}" value="${f.pct}" min="0" max="100" style="width:60px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--bg);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/>
      <span style="font-size:12px;color:var(--muted);">%</span>
      <select id="fn-color-${f.id}" style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--bg);color:var(--text);font-size:13px;outline:none;">
        ${['purple','teal','amber','info','pink','accent','danger'].map(c=>`<option value="${c}"${f.color===c?' selected':''}>${c}</option>`).join('')}
      </select>
      <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
        <input type="checkbox" id="fn-roll-${f.id}" ${f.rollover?'checked':''} style="width:14px;height:14px;"/> Rollover
      </label>
      <input type="number" id="fn-bal-${f.id}" value="${f.balance||0}" style="width:90px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--bg);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;" title="Current balance"/>
      <button class="btn btn-sm edit-save-btn" onclick="updateFund('${f.id}')">Save</button>
      <button class="btn btn-sm btn-d" onclick="delFund('${f.id}')">Del</button>
    </div>`).join('');

  const warn=totalPct!==100;
  document.getElementById('allocWarning').innerHTML=warn?`<div class="warn-box">Total allocation is ${totalPct}% — must equal 100%</div>`:`<div class="info-box" style="background:var(--accent-l);border-color:var(--accent);color:var(--accent);">Total: ${totalPct}% ✓</div>`;

  // Rule editor
  document.getElementById('ruleEditor').innerHTML=DB.funds.map(f=>`
    <div style="margin-bottom:12px;">
      <div style="font-size:12px;font-weight:500;color:var(--muted);margin-bottom:4px;">${f.name} — decision rule</div>
      <div style="display:flex;gap:8px;">
        <textarea id="rule-${f.id}" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--bg);color:var(--text);font-size:13px;outline:none;font-family:'DM Sans',sans-serif;resize:vertical;min-height:60px;">${f.rule||''}</textarea>
        <button class="btn btn-sm edit-save-btn" style="align-self:flex-start;" onclick="saveRule('${f.id}')">Save</button>
      </div>
    </div>`).join('');

  // Transfer history
  const transfers=DB.transfers||[];
  document.getElementById('transferHistory').innerHTML=transfers.length?
    `<table style="margin-top:8px;"><thead><tr><th>From</th><th>To</th><th>Amount</th><th>Reason</th><th>Date</th></tr></thead><tbody>${transfers.slice().reverse().map(t=>`<tr><td>${fundById(t.from)?fundById(t.from).name:t.from}</td><td>${fundById(t.to)?fundById(t.to).name:t.to}</td><td class="td-m">${RM(t.amount)}</td><td>${t.reason||'—'}</td><td class="td-m">${t.date}</td></tr>`).join('')}</tbody></table>`
    :'';
}

function removeVaultAutoDeposit(vid){
  const v=DB.vaults.find(x=>x.id===vid);
  if(!v)return;
  showConfirm('Remove auto-deposit?','This vault will no longer receive deposits when income is logged.',()=>{
    delete v.autoDeposit;save();toast('Auto-deposit removed');renderSettings();
  });
}

function addFC(){
  const label=document.getElementById('fcN').value.trim();
  const amount=parseFloat(document.getElementById('fcA').value)||0;
  if(!label)return;
  DB.fixedCosts.push({id:'fc'+uid(),label,amount});
  save();toast('Fixed cost added');renderSettings();
  document.getElementById('fcN').value='';document.getElementById('fcA').value='';
}
function updateFC(id){
  const fc=DB.fixedCosts.find(f=>f.id===id);if(!fc)return;
  fc.amount=parseFloat(document.getElementById('fc-a-'+id).value)||fc.amount;
  save();toast('Updated');renderSettings();
}
function delFC(id){showConfirm('Delete fixed cost?','This will remove it from monthly deductions.',()=>{DB.fixedCosts=DB.fixedCosts.filter(f=>f.id!==id);save();renderSettings();});}

function addFund(){
  const name=document.getElementById('fnN').value.trim();
  const pct=parseInt(document.getElementById('fnP').value)||0;
  const color=document.getElementById('fnC').value;
  const rollover=document.getElementById('fnR').checked;
  if(!name)return;
  const id='f'+uid();
  DB.funds.push({id,name,pct,color,rollover,rule:'',balance:0});
  save();toast('Fund added');renderSettings();
  document.getElementById('fnN').value='';document.getElementById('fnP').value='';
}
function updateFund(id){
  const f=fundById(id);if(!f)return;
  f.name=document.getElementById('fn-name-'+id).value.trim()||f.name;
  f.pct=parseInt(document.getElementById('fn-pct-'+id).value)||0;
  f.color=document.getElementById('fn-color-'+id).value;
  f.rollover=document.getElementById('fn-roll-'+id).checked;
  f.balance=parseFloat(document.getElementById('fn-bal-'+id).value)||0;
  save();toast('Fund saved');renderSettings();populateFundSelects();
}
function delFund(id){showConfirm('Delete fund?','Expenses logged to this fund will remain but show as unknown.',()=>{DB.funds=DB.funds.filter(f=>f.id!==id);save();renderSettings();populateFundSelects();});}
function saveRule(id){const f=fundById(id);if(f){f.rule=document.getElementById('rule-'+id).value.trim();save();toast('Rule saved');}}

function doTransfer(){
  const from=document.getElementById('tfFrom').value;
  const to=document.getElementById('tfTo').value;
  const amt=parseFloat(document.getElementById('tfAmt').value)||0;
  const reason=document.getElementById('tfReason').value.trim();
  if(!amt||from===to)return;
  const fFrom=fundById(from);const fTo=fundById(to);
  if(fFrom)fFrom.balance=(fFrom.balance||0)-amt;
  if(fTo)fTo.balance=(fTo.balance||0)+amt;
  if(!DB.transfers)DB.transfers=[];
  DB.transfers.push({id:uid(),from,to,amount:amt,reason,date:new Date().toISOString().slice(0,10)});
  save();toast('Transfer done');renderSettings();
  document.getElementById('tfAmt').value='';document.getElementById('tfReason').value='';
}

// closeMonth removed — rollover is automatic

function resetAll(){showConfirm('Reset all data?','This cannot be undone. All your data will be permanently deleted.',()=>{localStorage.removeItem('finOS_v2');DB=JSON.parse(JSON.stringify(DEFAULT));save();toast('Reset');go('dashboard');},true);}

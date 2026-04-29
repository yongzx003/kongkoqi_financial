// ─── VAULTS ──────────────────────────────────────────────────────
function _recomputeV(v){v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);}

function vaultTabSwitch(vid,tab){
  const df=document.getElementById('vdf-'+vid);
  const wf=document.getElementById('vwf-'+vid);
  const dt=document.getElementById('vtab-dep-'+vid);
  const wt=document.getElementById('vtab-wd-'+vid);
  if(!df||!wf)return;
  if(tab==='deposit'){
    df.style.display='';wf.style.display='none';
    dt.className='btn btn-sm edit-save-btn';wt.className='btn btn-sm';
  }else{
    df.style.display='none';wf.style.display='';
    dt.className='btn btn-sm';wt.className='btn btn-sm btn-d';
  }
}

function _fillModeBadge(v){
  if(v.fillMode==='fixed')return`<span style="font-size:11px;background:var(--accent-l);color:var(--accent);padding:2px 8px;border-radius:20px;margin-left:6px;">↻ ${RM(v.fixedAmount)}/mo · Fixed</span>`;
  if(v.fillMode==='percentage')return`<span style="font-size:11px;background:var(--info-l);color:var(--info);padding:2px 8px;border-radius:20px;margin-left:6px;">${v.pct}% · Percentage</span>`;
  return`<span style="font-size:11px;background:var(--bg);border:1px solid var(--border);color:var(--muted);padding:2px 8px;border-radius:20px;margin-left:6px;">Manual only</span>`;
}

function toggleVaultMenu(vid){
  document.querySelectorAll('.vault-menu').forEach(m=>{if(m.dataset.vault!==String(vid))m.style.display='none';});
  const m=document.getElementById('vmenu-'+vid);
  if(!m)return;
  const wasOpen=m.style.display==='block';
  m.style.display=wasOpen?'none':'block';
  if(!wasOpen)setTimeout(()=>document.addEventListener('click',closeVaultMenus,{once:true}),0);
}
function closeVaultMenus(){document.querySelectorAll('.vault-menu').forEach(m=>{m.style.display='none';});}
function toggleVaultForm(type,vid){
  const dep=document.getElementById('vdf-'+vid);
  const wd=document.getElementById('vwf-'+vid);
  if(type==='dep'&&dep)dep.style.display=dep.style.display==='none'?'':'none';
  else if(type==='wd'&&wd)wd.style.display=wd.style.display==='none'?'':'none';
}

function renderVaults(){
  const vaults=(DB.vaults||[]).filter(v=>!v.archived);
  const archived=(DB.vaults||[]).filter(v=>v.archived);
  const ss=`width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;`;
  const m=cm();
  const menuStyle=`position:absolute;top:34px;right:0;z-index:100;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);min-width:130px;box-shadow:0 4px 16px rgba(0,0,0,.12);padding:4px 0;`;
  const menuItemStyle=`display:block;width:100%;text-align:left;padding:7px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);`;

  const editFormFor=(v)=>`
    <div class="inst-card" style="margin:0;box-shadow:none;border:none;padding:0;">
      <div class="inst-card-title">Edit vault</div>
      <div style="display:grid;grid-template-columns:1fr 140px;gap:12px;margin-bottom:12px;">
        <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Name</div>
        <input id="ve-name-${v.id}" value="${v.name}" style="width:100%;padding:8px 10px;border:1.5px solid var(--accent);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div>
        <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Target (RM)</div>
        <input type="number" id="ve-tgt-${v.id}" value="${v.target}" placeholder="0" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Fill mode</div>
        <select id="ve-fillMode-${v.id}" style="${ss}">
          <option value="percentage"${v.fillMode==='percentage'?' selected':''}>Percentage of remainder</option>
          <option value="fixed"${v.fillMode==='fixed'?' selected':''}>Fixed amount / month</option>
          <option value="manual"${v.fillMode==='manual'?' selected':''}>Manual only</option>
        </select></div>
        <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Type</div>
        <select id="ve-type-${v.id}" style="${ss}">
          <option value="spending"${v.type==='spending'?' selected':''}>Spending</option>
          <option value="savings"${v.type==='savings'?' selected':''}>Savings</option>
        </select></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">% allocation</div>
        <input type="number" id="ve-pct-${v.id}" value="${v.pct||0}" min="0" max="100" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/></div>
        <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Fixed RM/mo</div>
        <input type="number" id="ve-fixed-${v.id}" value="${v.fixedAmount||0}" min="0" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">
        <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Color</div>
        <select id="ve-color-${v.id}" style="${ss}">
          ${['purple','teal','amber','info','pink','accent','danger'].map(c=>`<option value="${c}"${v.color===c?' selected':''}>${c}</option>`).join('')}
        </select></div>
        <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Label</div>
        <input id="ve-glabel-${v.id}" value="${v.goalLabel||''}" placeholder="e.g. Session" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div>
        <div style="display:flex;flex-direction:column;justify-content:flex-end;gap:6px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;"><input type="checkbox" id="ve-arch-${v.id}" ${v.archived?'checked':''} style="width:14px;height:14px;"/> Archived</label>
        </div>
      </div>
      <div style="margin-bottom:12px;"><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Decision rule (optional)</div>
      <textarea id="ve-rule-${v.id}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Sans',sans-serif;resize:vertical;min-height:54px;">${v.rule||''}</textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn" onclick="cancelVaultEdit('${v.id}')">Cancel</button>
        <button class="btn edit-save-btn" onclick="saveVaultEdit('${v.id}')">Save changes</button>
      </div>
    </div>`;

  const cards=vaults.map(v=>{
    const{totalDeposited,totalUsed,current,pct}=vaultStats(v);
    _recomputeV(v);
    const isSpending=v.type==='spending';
    const isDeployOnly=v.type==='savings'&&v.fillMode==='percentage';
    const used=spentThisMonth(v.id,m);
    const budget=monthlyBudget(v.id);
    const overBudget=budget>0&&used>budget;
    const savPct=v.target>0?Math.min(100,Math.round(v.current/v.target*100)):null;
    const budPct=budget>0?Math.min(100,Math.round(used/budget*100)):0;
    const budCls=budPct>90?'p-danger':budPct>70?'p-warn':'p-safe';

    if(v._editing){
      return`<div class="card" style="border-top:3px solid var(--accent);">${editFormFor(v)}</div>`;
    }

    // Source/dest dropdowns for forms
    const otherVaults=(DB.vaults||[]).filter(x=>!x.archived&&x.id!==v.id);
    const srcOpts='<option value="external">External / new money</option>'+otherVaults.map(x=>`<option value="${x.id}">${x.name} (${RM(x.current)})</option>`).join('');
    const dstOpts='<option value="external">External (remove from books)</option>'+otherVaults.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');

    // Deposit form (all vault types)
    const depForm=`<div id="vdf-${v.id}" style="display:none;margin-top:10px;padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border);">
      <div style="display:grid;grid-template-columns:120px 1fr 1fr;gap:8px;margin-bottom:8px;">
        <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Amount (RM)</div>
        <input type="number" id="vd-amt-${v.id}" placeholder="0" style="width:100%;padding:7px 8px;border:1.5px solid var(--accent);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/></div>
        <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Reason (optional)</div>
        <input type="text" id="vd-rsn-${v.id}" placeholder="e.g. Top-up" style="width:100%;padding:7px 8px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div>
        <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">From</div>
        <select id="vd-src-${v.id}" style="${ss}">${srcOpts}</select></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:6px;">
        <button class="btn btn-sm" onclick="toggleVaultForm('dep','${v.id}')">Cancel</button>
        <button class="btn btn-sm edit-save-btn" onclick="vaultDeposit('${v.id}')">Deposit</button>
      </div>
    </div>`;

    // Withdraw form (savings non-deploy only)
    const wdForm=!isDeployOnly&&!isSpending?`<div id="vwf-${v.id}" style="display:none;margin-top:10px;padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--danger);">
      <div style="display:grid;grid-template-columns:120px 1fr 1fr;gap:8px;margin-bottom:8px;">
        <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Amount (RM)</div>
        <input type="number" id="vw-amt-${v.id}" placeholder="0" style="width:100%;padding:7px 8px;border:1.5px solid var(--danger);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/></div>
        <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Reason *</div>
        <input type="text" id="vw-rsn-${v.id}" placeholder="Required" style="width:100%;padding:7px 8px;border:1.5px solid var(--danger);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div>
        <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">To</div>
        <select id="vw-dst-${v.id}" style="${ss}">${dstOpts}</select></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:6px;">
        <button class="btn btn-sm" onclick="toggleVaultForm('wd','${v.id}')">Cancel</button>
        <button class="btn btn-sm btn-d" onclick="vaultWithdraw('${v.id}')">Withdraw</button>
      </div>
    </div>`:'';

    const histTable=(v.deposits||[]).length?`<div style="margin-top:12px;max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r-sm);">
      <table style="font-size:12px;"><thead><tr><th>#</th><th>Type</th><th>Reason</th><th>Amount</th><th>Date</th><th></th></tr></thead><tbody>
      ${(v.deposits||[]).slice().sort((a,b)=>(b.id>a.id?1:-1)).map((e,i,arr)=>`<tr>
        <td class="td-m" style="color:var(--muted);">${arr.length-i}</td>
        <td><span style="font-size:11px;padding:2px 7px;border-radius:20px;background:${e.type==='deposit'?'var(--accent-l)':'var(--warn-l)'};color:${e.type==='deposit'?'var(--accent)':'var(--warn)'};">${e.type==='withdrawal'?'Used':'Deposit'}</span></td>
        <td>${e.reason||'—'}</td>
        <td class="td-m" style="color:${e.type==='withdrawal'?'var(--danger)':''};">${RM(Math.abs(e.amount))}</td>
        <td class="td-m" style="color:var(--muted);">${e.date||''}</td>
        <td><button class="btn btn-xs btn-d" onclick="delVaultDeposit('${v.id}','${e.id}')">Del</button></td>
      </tr>`).join('')}
      </tbody></table></div>`:'<div style="font-size:12px;color:var(--muted);margin-top:8px;">No transactions yet.</div>';

    // Compact body: balance summary always visible
    let bodyHtml='';
    if(isSpending){
      bodyHtml=`<div style="font-size:14px;font-weight:600;font-family:'DM Mono',monospace;margin-bottom:4px;">${RM(v.current)}</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:${budget>0?6:0}px;">available${v.target>0?` · ${RM(v.target)} target`:''}</div>
        ${budget>0?`<div style="font-size:12px;margin-bottom:4px;color:${overBudget?'var(--danger)':'var(--muted)'};">${RM(used)} used this month · ${RM(budget)} budget${overBudget?` · over by ${RM(used-budget)}`:''}</div>`:''}
        ${v.target>0?`<div class="prog-wrap" style="margin-bottom:2px;"><div class="prog p-safe" style="width:${savPct}%"></div></div>`:''}`;
    }else{
      bodyHtml=`<div style="font-size:14px;font-weight:600;font-family:'DM Mono',monospace;margin-bottom:4px;">${RM(v.current)}${v.target>0?' / '+RM(v.target):''}</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:${v.target>0?6:0}px;">saved${totalUsed>0?` · <span style="color:var(--danger);">${RM(totalUsed)} used</span>`:''}</div>
        ${savPct!==null?`<div class="prog-wrap"><div class="prog p-safe" style="width:${savPct}%"></div></div>`:''}`;
    }

    // Action buttons inside expanded section
    let actionBtns='';
    if(isDeployOnly){
      actionBtns=`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-sm edit-save-btn" onclick="toggleVaultForm('dep','${v.id}')">+ Deposit</button>
        <span style="font-size:12px;color:var(--muted);">To withdraw, deploy via <a href="#" onclick="go('assets');return false;" style="color:var(--accent);">Assets</a></span>
      </div>`;
    }else if(isSpending){
      actionBtns=`<div style="margin-top:10px;"><button class="btn btn-sm edit-save-btn" onclick="toggleVaultForm('dep','${v.id}')">+ Add deposit</button></div>`;
    }else{
      actionBtns=`<div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn btn-sm edit-save-btn" onclick="toggleVaultForm('dep','${v.id}')">+ Deposit</button>
        <button class="btn btn-sm" style="color:var(--danger);border-color:var(--danger);" onclick="toggleVaultForm('wd','${v.id}')">− Withdraw</button>
      </div>`;
    }

    const menuHtml=`<div id="vmenu-${v.id}" class="vault-menu" data-vault="${v.id}" style="display:none;${menuStyle}">
      <button style="${menuItemStyle}" onclick="startVaultEdit('${v.id}');closeVaultMenus()">Edit</button>
      <button style="${menuItemStyle}" onclick="archiveVault('${v.id}');closeVaultMenus()">Archive</button>
      <button style="${menuItemStyle}color:var(--danger);" onclick="delVault('${v.id}');closeVaultMenus()">Delete</button>
    </div>`;

    return`<div class="card" style="position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:500;flex:1;min-width:0;">${badge(v.name,v.color)}${_fillModeBadge(v)}</div>
        <div style="position:relative;flex-shrink:0;margin-left:8px;">
          <button class="btn btn-sm" onclick="event.stopPropagation();toggleVaultMenu('${v.id}')" style="padding:4px 9px;font-size:15px;line-height:1;">⋯</button>
          ${menuHtml}
        </div>
      </div>
      ${bodyHtml}
      <details style="margin-top:10px;">
        <summary style="list-style:none;cursor:pointer;font-size:12px;color:var(--accent);user-select:none;outline:none;">▸ Details</summary>
        ${v.rule?`<div style="font-size:12px;color:var(--muted);margin-top:10px;padding:8px 10px;background:var(--bg);border-radius:var(--r-sm);border-left:2px solid var(--border);">${v.rule}</div>`:''}
        ${actionBtns}
        ${depForm}
        ${wdForm}
        ${histTable}
      </details>
    </div>`;
  }).join('');

  // Archived section
  const archivedHtml=archived.length?`
    <details style="margin-top:20px;">
      <summary style="font-size:13px;font-weight:500;color:var(--muted);cursor:pointer;padding:8px 0;list-style:none;">Archived vaults (${archived.length})</summary>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-top:12px;">
        ${archived.map(v=>`<div class="card card-sm" style="opacity:.7;position:relative;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>${badge(v.name,v.color)} <span style="font-size:12px;color:var(--muted);margin-left:6px;">${RM(v.current)}</span></div>
            <button class="btn btn-sm" onclick="unarchiveVault('${v.id}')">Unarchive</button>
          </div>
        </div>`).join('')}
      </div>
    </details>`:'';

  document.getElementById('vaultList').innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;">${cards}</div>${archivedHtml}`;
}

function archiveVault(vid){
  const v=(DB.vaults||[]).find(x=>x.id===vid);if(!v)return;
  v.archived=true;
  // Warn if this upsets the 100% allocation
  if(v.fillMode==='percentage'){
    const pctSum=(DB.vaults||[]).filter(x=>x.fillMode==='percentage'&&!x.archived).reduce((s,x)=>s+x.pct,0);
    if(pctSum!==100)toast('⚠ Percentage allocations now sum to '+pctSum+'% — rebalance on Settings page');
  }
  save();toast(v.name+' archived');renderVaults();
}
function unarchiveVault(vid){
  const v=(DB.vaults||[]).find(x=>x.id===vid);if(!v)return;
  v.archived=false;
  save();toast(v.name+' unarchived');renderVaults();
}

function addVault(){
  const name=document.getElementById('vN').value.trim();
  const tgt=parseFloat(document.getElementById('vT').value)||0;
  const type=document.getElementById('vType').value;
  const goalLabel=document.getElementById('vGoalLabel').value.trim()||'Item';
  const fillMode=document.getElementById('vFillMode')?.value||'manual';
  const pct=parseInt(document.getElementById('vPct')?.value)||0;
  const fixedAmount=parseFloat(document.getElementById('vFixedAmt')?.value)||0;
  const color=document.getElementById('vColor')?.value||'info';
  if(!name)return;
  DB.vaults.push({
    id:uid(),name,fillMode,pct,fixedAmount,type,target:tgt,goalLabel,
    rule:'',color,archived:false,current:0,deposits:[]
  });
  save();toast('Vault added');renderVaults();
  document.getElementById('vN').value='';document.getElementById('vT').value='';
  if(document.getElementById('vPct'))document.getElementById('vPct').value='';
  if(document.getElementById('vFixedAmt'))document.getElementById('vFixedAmt').value='';
}

function vaultDeposit(vid){
  const v=(DB.vaults||[]).find(x=>x.id===vid);if(!v)return;
  const amt=parseFloat(document.getElementById('vd-amt-'+vid).value);
  const rsn=document.getElementById('vd-rsn-'+vid).value.trim();
  const src=document.getElementById('vd-src-'+vid)?.value||'external';
  if(!amt||amt<=0)return toast('Enter a positive amount');
  let autoRsn='Deposit';
  if(src!=='external'){
    const srcV=(DB.vaults||[]).find(x=>x.id===src);
    if(!srcV)return toast('Source vault not found');
    if((srcV.current||0)<amt)return toast('Insufficient balance in '+srcV.name+' ('+RM(srcV.current||0)+')');
    srcV.deposits.push({id:uid(),type:'withdrawal',reason:'Transfer to '+v.name,amount:Math.abs(amt),date:new Date().toISOString().slice(0,10),destination:vid});
    _recomputeV(srcV);
    autoRsn='From '+srcV.name;
  }
  if(!v.deposits)v.deposits=[];
  v.deposits.push({id:uid(),type:'deposit',reason:rsn||autoRsn,amount:Math.abs(amt),date:new Date().toISOString().slice(0,10),source:src});
  _recomputeV(v);
  document.getElementById('vd-amt-'+vid).value='';
  document.getElementById('vd-rsn-'+vid).value='';
  save();toast('Deposited '+RM(amt)+(src!=='external'?' from '+(vaultById(src)?.name||src):''));renderVaults();renderDashboard();
}

function vaultWithdraw(vid){
  const v=(DB.vaults||[]).find(x=>x.id===vid);if(!v)return;
  const amt=parseFloat(document.getElementById('vw-amt-'+vid).value);
  const rsn=document.getElementById('vw-rsn-'+vid).value.trim();
  const dst=document.getElementById('vw-dst-'+vid)?.value||'external';
  if(!amt||amt<=0)return toast('Enter a positive amount');
  if(!rsn)return toast('A reason is required for withdrawals');
  const destName=dst==='external'?'external':(vaultById(dst)?.name||dst);
  showConfirm(
    'Withdraw from vault?',
    `Withdraw ${RM(amt)} from "${v.name}" → ${destName}? Reason: ${rsn}`,
    ()=>{
      v.deposits.push({id:uid(),type:'withdrawal',reason:rsn,amount:Math.abs(amt),date:new Date().toISOString().slice(0,10),destination:dst});
      _recomputeV(v);
      if(dst!=='external'){
        const dstV=(DB.vaults||[]).find(x=>x.id===dst);
        if(dstV){dstV.deposits.push({id:uid(),type:'deposit',reason:'Transfer from '+v.name,amount:Math.abs(amt),date:new Date().toISOString().slice(0,10),source:vid});_recomputeV(dstV);}
      }
      document.getElementById('vw-amt-'+vid).value='';
      document.getElementById('vw-rsn-'+vid).value='';
      save();toast('Withdrawn '+RM(amt)+(dst!=='external'?' → '+destName:''));renderVaults();renderDashboard();
    }
  );
}

function delVaultDeposit(vid,did){
  const v=(DB.vaults||[]).find(x=>x.id===vid);if(!v)return;
  const entry=v.deposits.find(d=>d.id==did);
  const label=entry?.type==='withdrawal'?'withdrawal':'deposit';
  showConfirm('Delete '+label+'?','The vault balance will be adjusted accordingly.',()=>{
    v.deposits=(v.deposits||[]).filter(d=>d.id!=did);
    _recomputeV(v);
    save();toast('Removed');renderVaults();renderDashboard();
  });
}

function startVaultEdit(vid){const v=(DB.vaults||[]).find(x=>x.id===vid);if(v){v._editing=true;renderVaults();}}
function cancelVaultEdit(vid){const v=(DB.vaults||[]).find(x=>x.id===vid);if(v){delete v._editing;renderVaults();}}
function saveVaultEdit(vid){
  const v=(DB.vaults||[]).find(x=>x.id===vid);if(!v)return;
  const name=document.getElementById('ve-name-'+vid).value.trim();
  const tgt=parseFloat(document.getElementById('ve-tgt-'+vid).value)||0;
  const type=document.getElementById('ve-type-'+vid)?.value||v.type;
  const fillMode=document.getElementById('ve-fillMode-'+vid)?.value||v.fillMode;
  const pct=parseInt(document.getElementById('ve-pct-'+vid)?.value)||0;
  const fixedAmount=parseFloat(document.getElementById('ve-fixed-'+vid)?.value)||0;
  const goalLabel=(document.getElementById('ve-glabel-'+vid)?.value||'').trim()||v.goalLabel||'Item';
  const color=document.getElementById('ve-color-'+vid)?.value||v.color;
  const archived=document.getElementById('ve-arch-'+vid)?.checked||false;
  const rule=document.getElementById('ve-rule-'+vid)?.value||'';
  if(name)v.name=name;
  v.target=tgt;v.type=type;v.fillMode=fillMode;v.pct=pct;v.fixedAmount=fixedAmount;
  v.goalLabel=goalLabel;v.color=color;v.archived=archived;v.rule=rule;
  delete v._editing;
  save();toast('Vault updated');renderVaults();renderDashboard();
}

function delVault(vid){showConfirm('Delete vault?','Item will move to recycle bin.',()=>{
  const v=(DB.vaults||[]).find(x=>x.id===vid);if(!v)return;
  DB.vaults=DB.vaults.filter(x=>x.id!==vid);
  trashIt('vault',v,()=>{});
  save();toast('Moved to bin');renderVaults();renderDashboard();
});}

// ─── VAULTS ──────────────────────────────────────────────────────
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

function renderVaults(){
  const abTotal=DB.funds.reduce((s,f)=>s+(f.balance||0),0);
  const abCard=`<div class="card" style="border-left:3px solid var(--muted);opacity:.9;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <div>
        <div style="font-size:15px;font-weight:500;">Asset bucket <span style="font-size:10px;background:var(--bg);border:1px solid var(--border);color:var(--muted);padding:2px 8px;border-radius:20px;margin-left:6px;">computed · read-only</span></div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px;">Sum of all fund balances — not a real vault</div>
      </div>
      <div style="font-size:22px;font-weight:500;font-family:'DM Mono',monospace;">${RM(abTotal)}</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">${DB.funds.map(f=>`<div style="background:var(--bg);border-radius:var(--r-sm);padding:6px 10px;font-size:12px;">${badge(f.name,f.color)} <span style="font-family:'DM Mono',monospace;font-size:13px;margin-left:4px;">${RM(f.balance||0)}</span></div>`).join('')}</div>
  </div>`;
  document.getElementById('vaultList').innerHTML=abCard+DB.vaults.map(v=>{
    const deps=(v.deposits||[]);
    const allEntries=deps.slice().sort((a,b)=>b.id-a.id);
    const{totalDeposited,totalUsed,current,pct}=vaultStats(v);
    v.current=current;
    const isSpending=v.type==='spending';
    const cls=pct===null?'p-safe':pct>=100?'p-safe':isSpending?'p-safe':'p-warn';

    if(v._editing){
      return`<div class="card" style="border-left:3px solid var(--accent);">
        <div class="inst-card" style="margin:0;box-shadow:none;border:none;padding:0;">
          <div class="inst-card-title">Edit vault</div>
          <div style="display:grid;grid-template-columns:1fr 140px;gap:12px;margin-bottom:12px;">
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Vault name</div>
            <input id="ve-name-${v.id}" value="${v.name}" style="width:100%;padding:8px 10px;border:1.5px solid var(--accent);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;box-shadow:0 0 0 3px rgba(45,90,61,0.08);"/></div>
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Target (RM)</div>
            <input type="number" id="ve-tgt-${v.id}" value="${v.target}" placeholder="0 = no target" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Type</div>
            <select id="ve-type-${v.id}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;">
              <option value="savings"${v.type==='savings'?' selected':''}>Savings — save up toward target</option>
              <option value="spending"${v.type==='spending'?' selected':''}>Spending — draw down a budget</option>
            </select></div>
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Label (for spending vaults)</div>
            <input id="ve-glabel-${v.id}" value="${v.goalLabel||''}" placeholder="e.g. Session" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Monthly auto-deposit (RM)</div>
            <input type="number" id="ve-auto-${v.id}" value="${v.autoDeposit?v.autoDeposit.amount:''}" placeholder="0 = none" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/></div>
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Auto-deposit label</div>
            <input id="ve-autoRsn-${v.id}" value="${v.autoDeposit?v.autoDeposit.reason:''}" placeholder="e.g. Monthly savings" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn" onclick="cancelVaultEdit('${v.id}')">Cancel</button>
            <button class="btn edit-save-btn" onclick="saveVaultEdit('${v.id}')">Save changes</button>
          </div>
        </div>
      </div>`;
    }

    // Auto-deposit badge
    const autoDepBadge=v.autoDeposit
      ?`<span style="font-size:11px;background:var(--accent-l);color:var(--accent);padding:2px 8px;border-radius:20px;margin-left:6px;">↻ ${RM(v.autoDeposit.amount)}/mo</span>`:'';

    // Deposit/Withdraw forms — split by vault type
    const fundSrcOpts=`<option value="external">External / new money</option>`+DB.funds.map(f=>`<option value="${f.id}">${f.name} (${RM(f.balance||0)})</option>`).join('');
    const fundDstOpts=`<option value="external">External (remove from books)</option>`+DB.funds.map(f=>`<option value="${f.id}">${f.name}</option>`).join('');
    const selectStyle=`width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;`;
    let actionForms;
    if(isSpending){
      // Spending vault: small deposit form; withdraw is done via Expenses page
      actionForms=`<div class="inst-card" style="margin-top:12px;">
        <div class="inst-card-title" style="margin-bottom:8px;">Add deposit <span style="font-size:11px;color:var(--muted);font-weight:400;">· Withdraw via Expenses page</span></div>
        <div style="display:grid;grid-template-columns:140px 1fr 1fr;gap:10px;margin-bottom:10px;">
          <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Amount (RM)</div>
          <input type="number" id="vd-amt-${v.id}" placeholder="0" style="width:100%;padding:8px 10px;border:1.5px solid var(--accent);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:14px;font-weight:500;outline:none;font-family:'DM Mono',monospace;box-shadow:0 0 0 3px rgba(45,90,61,0.08);"/></div>
          <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Reason (optional)</div>
          <input type="text" id="vd-rsn-${v.id}" placeholder="e.g. Monthly top-up" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div>
          <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Deposit from <span style="color:var(--danger);">*</span></div>
          <select id="vd-src-${v.id}" style="${selectStyle}">${fundSrcOpts}</select></div>
        </div>
        <div style="display:flex;justify-content:flex-end;"><button class="btn edit-save-btn" onclick="vaultDeposit('${v.id}')">Deposit</button></div>
      </div>`;
    }else{
      // Savings vault: tabbed Deposit / Withdraw
      actionForms=`<div class="inst-card" style="margin-top:12px;">
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button id="vtab-dep-${v.id}" class="btn btn-sm edit-save-btn" onclick="vaultTabSwitch('${v.id}','deposit')">+ Deposit</button>
          <button id="vtab-wd-${v.id}" class="btn btn-sm" style="border-color:var(--danger);color:var(--danger);" onclick="vaultTabSwitch('${v.id}','withdraw')">− Withdraw</button>
        </div>
        <div id="vdf-${v.id}">
          <div style="display:grid;grid-template-columns:140px 1fr 1fr;gap:12px;margin-bottom:12px;">
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Amount (RM)</div>
            <input type="number" id="vd-amt-${v.id}" placeholder="0" style="width:100%;padding:8px 10px;border:1.5px solid var(--accent);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:14px;font-weight:500;outline:none;font-family:'DM Mono',monospace;box-shadow:0 0 0 3px rgba(45,90,61,0.08);"/></div>
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Reason (optional)</div>
            <input type="text" id="vd-rsn-${v.id}" placeholder="e.g. Monthly savings" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div>
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Deposit from <span style="color:var(--danger);">*</span></div>
            <select id="vd-src-${v.id}" style="${selectStyle}">${fundSrcOpts}</select></div>
          </div>
          <div style="display:flex;justify-content:flex-end;"><button class="btn edit-save-btn" onclick="vaultDeposit('${v.id}')">Deposit</button></div>
        </div>
        <div id="vwf-${v.id}" style="display:none;">
          <div style="display:grid;grid-template-columns:140px 1fr 1fr;gap:12px;margin-bottom:12px;">
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Amount (RM)</div>
            <input type="number" id="vw-amt-${v.id}" placeholder="0" style="width:100%;padding:8px 10px;border:1.5px solid var(--danger);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:14px;font-weight:500;outline:none;font-family:'DM Mono',monospace;"/></div>
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Reason <span style="color:var(--danger);">*</span></div>
            <input type="text" id="vw-rsn-${v.id}" placeholder="Required — why are you withdrawing?" style="width:100%;padding:8px 10px;border:1.5px solid var(--danger);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></div>
            <div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Withdraw to <span style="color:var(--danger);">*</span></div>
            <select id="vw-dst-${v.id}" style="${selectStyle}">${fundDstOpts}</select></div>
          </div>
          <div style="display:flex;justify-content:flex-end;"><button class="btn btn-d" onclick="vaultWithdraw('${v.id}')">Withdraw from savings</button></div>
        </div>
      </div>`;
    }

    // History table
    const histTable=allEntries.length?`<div style="margin-top:14px;max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r-sm);">
      <table style="font-size:12px;"><thead><tr><th>#</th><th>Type</th><th>Reason</th><th>Amount</th><th>Date</th><th></th></tr></thead><tbody>
      ${allEntries.map((e,i)=>`<tr>
        <td class="td-m" style="color:var(--muted);">${allEntries.length-i}</td>
        <td><span style="font-size:11px;padding:2px 7px;border-radius:20px;background:${e.type==='deposit'?'var(--accent-l)':'var(--warn-l)'};color:${e.type==='deposit'?'var(--accent)':'var(--warn)'};">${e.type==='withdrawal'?'Used':'Deposit'}</span></td>
        <td>${e.reason||'—'}</td>
        <td class="td-m" style="color:${e.type==='withdrawal'?'var(--danger)':''}"> ${RM(Math.abs(e.amount))}</td>
        <td class="td-m" style="color:var(--muted);">${e.date||''}</td>
        <td><button class="btn btn-xs btn-d" onclick="delVaultDeposit('${v.id}','${e.id}')">Del</button></td>
      </tr>`).join('')}
      </tbody></table></div>`:'';

    const typeTag=isSpending
      ?`<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:var(--info-l);color:var(--info);margin-left:6px;">${v.goalLabel||'spending'} tracking</span>`
      :`<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:var(--accent-l);color:var(--accent);margin-left:6px;">savings</span>`;

    return`<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div>
          <div style="font-size:15px;font-weight:500;">${v.name}${typeTag}${autoDepBadge}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;">
            ${isSpending
              ?`<span style="color:var(--accent);font-weight:500;">${RM(totalUsed)}</span> used${v.target>0?' of '+RM(v.target):''} · <span style="color:var(--text);">${RM(current)}</span> remaining`
              :`<span style="color:var(--text);font-weight:500;">${RM(current)}</span> saved${v.target>0?' of '+RM(v.target):''}`
            }
            ${totalUsed>0&&!isSpending?`· <span style="color:var(--danger);">${RM(totalUsed)} used</span>`:''}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${pct!==null?`<span style="font-size:20px;font-weight:500;font-family:'DM Mono',monospace;">${pct}%</span>`:''}
          <button class="btn btn-sm" onclick="startVaultEdit('${v.id}')">Edit</button>
          <button class="btn btn-sm btn-d" onclick="delVault('${v.id}')">Delete</button>
        </div>
      </div>
      ${pct!==null?`<div class="prog-wrap"><div class="prog ${cls}" style="width:${pct}%"></div></div>`:''}
      ${actionForms}
      ${histTable}
    </div>`;
  }).join('');
}

function addVault(){
  const name=document.getElementById('vN').value.trim();
  const tgt=parseFloat(document.getElementById('vT').value)||0;
  const type=document.getElementById('vType').value;
  const goalLabel=document.getElementById('vGoalLabel').value.trim()||'Item';
  const autoAmt=parseFloat(document.getElementById('vAutoDeposit').value)||0;
  if(!name)return;
  const newVault={id:'v'+uid(),name,current:0,target:tgt,type,goalLabel,deposits:[]};
  if(autoAmt>0)newVault.autoDeposit={type:'fixed',amount:autoAmt,reason:name+' monthly auto-deposit'};
  DB.vaults.push(newVault);
  save();toast('Vault added');renderVaults();
  document.getElementById('vN').value='';document.getElementById('vT').value='';
  document.getElementById('vType').value='savings';document.getElementById('vGoalLabel').value='';
  document.getElementById('vAutoDeposit').value='';
}

function vaultDeposit(vid){
  const v=DB.vaults.find(x=>x.id===vid);if(!v)return;
  const amt=parseFloat(document.getElementById('vd-amt-'+vid).value);
  const rsn=document.getElementById('vd-rsn-'+vid).value.trim();
  const src=document.getElementById('vd-src-'+vid)?.value||'external';
  if(!amt||amt<=0)return toast('Enter a positive amount');
  let autoRsn='Deposit';
  if(src!=='external'){
    const f=DB.funds.find(x=>x.id===src);
    if(!f)return toast('Source fund not found');
    if((f.balance||0)<amt)return toast('Insufficient balance in '+f.name+' ('+RM(f.balance||0)+')');
    f.balance=Math.round(((f.balance||0)-amt)*100)/100;
    autoRsn='From '+f.name;
  }
  if(!v.deposits)v.deposits=[];
  v.deposits.push({id:uid(),type:'deposit',reason:rsn||autoRsn,amount:Math.abs(amt),date:new Date().toISOString().slice(0,10),source:src});
  v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
  document.getElementById('vd-amt-'+vid).value='';
  document.getElementById('vd-rsn-'+vid).value='';
  save();toast('Deposited '+RM(amt)+(src!=='external'?' from '+(DB.funds.find(x=>x.id===src)?.name||src):''));renderVaults();renderDashboard();
}

function vaultWithdraw(vid){
  const v=DB.vaults.find(x=>x.id===vid);if(!v)return;
  const amt=parseFloat(document.getElementById('vw-amt-'+vid).value);
  const rsn=document.getElementById('vw-rsn-'+vid).value.trim();
  const dst=document.getElementById('vw-dst-'+vid)?.value||'external';
  if(!amt||amt<=0)return toast('Enter a positive amount');
  if(!rsn)return toast('A reason is required for withdrawals');
  const destName=dst==='external'?'external':(DB.funds.find(x=>x.id===dst)?.name||dst);
  const doWithdraw=()=>{
    if(!v.deposits)v.deposits=[];
    v.deposits.push({id:uid(),type:'withdrawal',reason:rsn,amount:Math.abs(amt),date:new Date().toISOString().slice(0,10),destination:dst});
    v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
    if(dst!=='external'){
      const f=DB.funds.find(x=>x.id===dst);
      if(f)f.balance=Math.round(((f.balance||0)+amt)*100)/100;
    }
    document.getElementById('vw-amt-'+vid).value='';
    document.getElementById('vw-rsn-'+vid).value='';
    save();toast('Withdrawn '+RM(amt)+(dst!=='external'?' → '+destName:''));renderVaults();renderDashboard();
  };
  showConfirm(
    'Withdraw from savings vault?',
    `Withdraw ${RM(amt)} from "${v.name}" → ${destName}? Reason: ${rsn}`,
    doWithdraw
  );
}

function delVaultDeposit(vid,did){
  const v=DB.vaults.find(x=>x.id===vid);if(!v)return;
  const entry=v.deposits.find(d=>d.id==did);
  const label=entry?.type==='withdrawal'?'withdrawal':'deposit';
  showConfirm('Delete '+label+'?','The vault balance will be adjusted accordingly.',()=>{
    v.deposits=(v.deposits||[]).filter(d=>d.id!=did);
    v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
    save();toast('Removed');renderVaults();renderDashboard();
  });
}
function startVaultEdit(vid){const v=DB.vaults.find(x=>x.id===vid);if(v){v._editing=true;renderVaults();}}
function cancelVaultEdit(vid){const v=DB.vaults.find(x=>x.id===vid);if(v){delete v._editing;renderVaults();}}
function saveVaultEdit(vid){
  const v=DB.vaults.find(x=>x.id===vid);if(!v)return;
  const name=document.getElementById('ve-name-'+vid).value.trim();
  const tgt=parseFloat(document.getElementById('ve-tgt-'+vid).value)||0;
  const type=document.getElementById('ve-type-'+vid)?document.getElementById('ve-type-'+vid).value:v.type||'savings';
  const goalLabel=document.getElementById('ve-glabel-'+vid)?document.getElementById('ve-glabel-'+vid).value.trim()||'Item':v.goalLabel||'Item';
  const autoAmt=parseFloat(document.getElementById('ve-auto-'+vid)?.value)||0;
  const autoRsn=(document.getElementById('ve-autoRsn-'+vid)?.value||'').trim();
  if(name)v.name=name;
  v.target=tgt;v.type=type;v.goalLabel=goalLabel;
  if(autoAmt>0){v.autoDeposit={type:'fixed',amount:autoAmt,reason:autoRsn||v.name+' monthly auto-deposit'};}
  else{delete v.autoDeposit;}
  delete v._editing;
  save();toast('Vault updated');renderVaults();renderDashboard();
}
function delVault(vid){showConfirm('Delete vault?','Item will move to recycle bin.',()=>{const v=DB.vaults.find(x=>x.id===vid);if(!v)return;DB.vaults=DB.vaults.filter(x=>x.id!==vid);trashIt('vault',v,()=>{});save();toast('Moved to bin');renderVaults();renderDashboard();});}

// ─── DASHBOARD ───────────────────────────────────────────────────
function dismissIncomeWarning(id){
  if(!DB.incomeWarnings)return;
  DB.incomeWarnings=DB.incomeWarnings.filter(w=>w.id!==id);
  save();renderDashboard();
}

function renderDashboard(){
  const m=cm();
  if(!DB.incomeWarnings)DB.incomeWarnings=[];
  document.getElementById('dashWarnings').innerHTML=DB.incomeWarnings.map(w=>`
    <div class="warn-box" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;padding:10px 14px;">
      <span>⚠ ${mlabel(w.month)} income was ${RM(w.income)} — ${RM(w.shortfall)} short of fixed costs (${RM(w.totalFixed)}). Review your vaults.</span>
      <button class="btn btn-sm" onclick="dismissIncomeWarning('${w.id}')" style="flex-shrink:0;">Dismiss</button>
    </div>`).join('');
  document.getElementById('dashSub').textContent=mlabel(m);
  document.getElementById('sideMonth').textContent=m;
  const totalAssets=totalNetWorth();
  const mIncome=DB.income.filter(i=>i.month===m).reduce((s,i)=>s+i.amount,0);
  const mSpend=DB.expenses.filter(e=>e.month===m).reduce((s,e)=>s+e.amount,0);
  const pendingClaims=DB.claims.reduce((s,c)=>{const recv=(c.installments||[]).reduce((x,i)=>x+i.amount,0)+(c.claimed?c.amount:0);return s+Math.max(0,c.amount-recv);},0);
  const surplus=mIncome-mSpend;
  const totalBudget=DB.funds.reduce((s,f)=>s+monthlyBudget(f.id),0);
  const totalSpentFunds=DB.funds.reduce((s,f)=>s+spentThisMonth(f.id,m),0);
  document.getElementById('dashStats').innerHTML=[
    {label:'Net worth',value:RM(totalAssets),sub:'Vaults + fund balances'},
    {label:'Income this month',value:RM(mIncome),sub:mlabel(m)},
    {label:'Fund spending',value:RM(totalSpentFunds)+' / '+RM(totalBudget),sub:'This month'},
    {label:'Surplus',value:(surplus>=0?'+':'')+RM(surplus),sub:'Income minus expenses',color:surplus>=0?'var(--accent)':'var(--danger)'},
  ].map(s=>`<div class="stat"><div class="stat-lbl">${s.label}</div><div class="stat-val" style="font-size:18px;color:${s.color||'var(--text)'};">${s.value}</div><div class="stat-sub">${s.sub}</div></div>`).join('');

  document.getElementById('dashFunds').innerHTML=DB.funds.map(f=>{
    const bal=fundBalance(f.id);
    const spent=spentThisMonth(f.id,m);
    const budget=monthlyBudget(f.id);
    const monthPct=budget>0?Math.min(100,Math.round(spent/budget*100)):0;
    const balPct=bal>0?Math.min(100,Math.round(spent/bal*100)):0;
    const overBudget=spent>budget&&budget>0;
    const mCls=monthPct>90?'p-danger':monthPct>70?'p-warn':'p-safe';
    return`<div class="card" style="${overBudget?'border-color:var(--danger);border-width:1.5px;':''}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        ${badge(f.name,f.color)}
        ${overBudget?`<span style="font-size:11px;background:var(--danger-l);color:var(--danger);padding:2px 8px;border-radius:20px;">Over budget</span>`:''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
        <div style="background:var(--bg);border-radius:var(--r-sm);padding:10px;">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Balance</div>
          <div style="font-size:16px;font-weight:500;font-family:'DM Mono',monospace;">${RM(bal)}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">+${RM(budget)}/mo</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r-sm);padding:10px;">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">This month</div>
          <div style="font-size:16px;font-weight:500;font-family:'DM Mono',monospace;color:${overBudget?'var(--danger)':'var(--text)'};">${RM(spent)}</div>
          <div style="font-size:11px;color:${overBudget?'var(--danger)':monthPct>70?'var(--warn)':'var(--muted)'};margin-top:2px;">${overBudget?'Over '+RM(spent-budget):RM(budget-spent)+' left'}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--r-sm);padding:10px;">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Total spent</div>
          <div style="font-size:16px;font-weight:500;font-family:'DM Mono',monospace;">${RM(DB.expenses.filter(e=>e.fund===f.id).reduce((s,e)=>s+e.amount,0))}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">all time</div>
        </div>
      </div>
      <div style="margin-bottom:4px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:4px;">
          <span>This month</span><span>${monthPct}%</span>
        </div>
        <div class="prog-wrap" style="margin:0;"><div class="prog ${mCls}" style="width:${monthPct}%"></div></div>
      </div>
      ${f.rollover?`<div style="font-size:11px;color:var(--muted);margin-top:6px;">Rollover on · unused balance carries forward</div>`:''}
    </div>`;
  }).join('');

  // Show fixed cost budget buckets — exclude vault-linked FCs (their spending shows in dashVaults)
  const fixedCards = DB.fixedCosts.filter(fc=>!fc.vaultId).map(fc=>{
    const spent = DB.expenses.filter(e=>e.fund===fc.id&&e.month===m).reduce((s,e)=>s+e.amount,0);
    const budget = fc.amount;
    const pct = budget>0?Math.min(100,Math.round(spent/budget*100)):0;
    const cls = pct>90?'p-danger':pct>70?'p-warn':'p-safe';
    const over = spent>budget;
    return`<div class="card card-sm" style="${over?'border-color:var(--danger);':''}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span class="badge" style="background:var(--accent-l);color:var(--accent);">${fc.label}</span>
        <span style="font-size:12px;font-weight:500;color:${over?'var(--danger)':'var(--text)'};font-family:'DM Mono',monospace;">${RM(spent)}<span style="color:var(--muted);font-weight:400;"> / ${RM(budget)}</span></span>
      </div>
      <div class="prog-wrap"><div class="prog ${cls}" style="width:${pct}%"></div></div>
      <div style="display:flex;justify-content:space-between;margin-top:5px;">
        <span style="font-size:11px;color:var(--muted);">Monthly fixed</span>
        <span style="font-size:11px;color:${over?'var(--danger)':pct>70?'var(--warn)':'var(--muted)'};">${over?'Over by '+RM(spent-budget):RM(budget-spent)+' left'}</span>
      </div>
    </div>`;
  }).join('');
  document.getElementById('dashFixed').innerHTML=fixedCards;

  const assetBucketTotal=DB.funds.reduce((s,f)=>s+(f.balance||0),0);
  const assetBucketCard=`<div class="card card-sm" style="border-left:3px solid var(--muted);">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
      <div style="font-size:13px;font-weight:500;">Asset bucket <span style="font-size:10px;color:var(--muted);background:var(--bg);border:1px solid var(--border);padding:1px 6px;border-radius:20px;margin-left:4px;">computed</span></div>
    </div>
    <div style="font-size:12px;margin-bottom:2px;"><span style="font-weight:500;">${RM(assetBucketTotal)}</span><span style="color:var(--muted);"> sum of fund balances</span></div>
    <div style="font-size:11px;color:var(--muted);">Not a real vault — reflects unspent fund rollover</div>
  </div>`;
  document.getElementById('dashVaults').innerHTML=assetBucketCard+DB.vaults.map(v=>{
    const{totalUsed:vUsed,current:vCur,pct:vPct}=vaultStats(v);
    const vCls=vPct===null?'p-safe':vPct>=100?'p-safe':v.type==='spending'?'p-safe':'p-warn';
    return`<div class="card card-sm">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <div style="font-size:13px;font-weight:500;">${v.name}</div>
        ${vPct!==null?`<span style="font-size:13px;font-weight:500;font-family:'DM Mono',monospace;color:var(--accent);">${vPct}%</span>`:''}
      </div>
      ${v.type==='spending'
        ?`<div style="font-size:12px;margin-bottom:2px;"><span style="font-weight:500;color:var(--accent);">${RM(vUsed)}</span><span style="color:var(--muted);"> used / ${v.target>0?RM(v.target):'no target'}</span></div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:6px;">${RM(vCur)} remaining in vault</div>`
        :`<div style="font-size:12px;margin-bottom:2px;"><span style="font-weight:500;">${RM(vCur)}</span><span style="color:var(--muted);"> saved${v.target>0?' / '+RM(v.target):''}</span></div>
          ${vUsed>0?`<div style="font-size:11px;color:var(--danger);margin-bottom:6px;">${RM(vUsed)} used</div>`:'<div style="margin-bottom:6px;"></div>'}`
      }
      ${vPct!==null?`<div class="prog-wrap"><div class="prog ${vCls}" style="width:${vPct}%"></div></div>`:''}
    </div>`;
  }).join('');

  const recent=DB.expenses.slice().sort((a,b)=>(b.date||'')<(a.date||'')?-1:(b.date||'')==(a.date||'')?b.id-a.id:1).slice(0,6);
  document.getElementById('dashRecent').innerHTML=recent.length?
    `<table><thead><tr><th>Date</th><th>Item</th><th>Fund</th><th>Amount</th></tr></thead><tbody>${recent.map(e=>`<tr><td class="td-m">${e.date||''}</td><td>${e.name}</td><td>${fundBadge(e.fund)}</td><td class="td-m">${RM(e.amount)}</td></tr>`).join('')}</tbody></table>`
    :'<div class="empty">No transactions yet</div>';
}

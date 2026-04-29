// ─── DASHBOARD ───────────────────────────────────────────────────
function dismissNotice(id){
  if(!DB.notices)return;
  DB.notices=DB.notices.filter(n=>n.id!==id);
  save();renderDashboard();
}

function dismissIncomeWarning(id){
  if(!DB.incomeWarnings)return;
  DB.incomeWarnings=DB.incomeWarnings.filter(w=>w.id!==id);
  save();renderDashboard();
}

function renderDashboard(){
  const m=cm();
  if(!DB.incomeWarnings)DB.incomeWarnings=[];
  if(!DB.notices)DB.notices=[];

  // Notices (migration banners, one-time info) + income warnings
  const noticesHtml=(DB.notices||[]).map(n=>`
    <div class="info-box" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;padding:10px 14px;">
      <span>${n.message}</span>
      <button class="btn btn-sm" onclick="dismissNotice('${n.id}')" style="flex-shrink:0;">Dismiss</button>
    </div>`).join('');
  const warningsHtml='';
  document.getElementById('dashWarnings').innerHTML=noticesHtml+warningsHtml;

  document.getElementById('dashSub').textContent=mlabel(m);
  document.getElementById('sideMonth').textContent=m;

  const totalAssets=totalNetWorth();
  const mIncome=(DB.income||[]).filter(i=>i.month===m).reduce((s,i)=>s+i.amount,0);
  const mSpend=(DB.expenses||[]).filter(e=>e.month===m).reduce((s,e)=>s+e.amount,0);
  const surplus=mIncome-mSpend;

  // Vault spending vs budget (non-manual, non-archived vaults)
  const trackableVaults=(DB.vaults||[]).filter(v=>v.fillMode!=='manual'&&!v.archived);
  const totalBudget=trackableVaults.reduce((s,v)=>s+monthlyBudget(v.id),0);
  const totalSpent=trackableVaults.reduce((s,v)=>s+spentThisMonth(v.id,m),0);

  document.getElementById('dashStats').innerHTML=[
    {label:'Net worth',value:RM(totalAssets),sub:'All vault balances'},
    {label:'Income this month',value:RM(mIncome),sub:mlabel(m)},
    {label:'Vault spending',value:RM(totalSpent)+' / '+RM(totalBudget),sub:'This month'},
    {label:'Surplus',value:(surplus>=0?'+':'')+RM(surplus),sub:'Income minus expenses',color:surplus>=0?'var(--accent)':'var(--danger)'},
  ].map(s=>`<div class="stat"><div class="stat-lbl">${s.label}</div><div class="stat-val" style="font-size:18px;color:${s.color||'var(--text)'};">${s.value}</div><div class="stat-sub">${s.sub}</div></div>`).join('');

  // Unified vault cards — fixed first, then percentage, then manual
  const vaults=(DB.vaults||[]).filter(v=>!v.archived);
  const sorted=[
    ...vaults.filter(v=>v.fillMode==='fixed'),
    ...vaults.filter(v=>v.fillMode==='percentage'),
    ...vaults.filter(v=>v.fillMode==='manual'),
  ];

  document.getElementById('dashFunds').innerHTML=sorted.map(v=>{
    const spent=spentThisMonth(v.id,m);
    const budget=monthlyBudget(v.id);
    const overBudget=budget>0&&spent>budget;
    const monthPct=budget>0?Math.min(100,Math.round(spent/budget*100)):0;
    const mCls=monthPct>90?'p-danger':monthPct>70?'p-warn':'p-safe';
    const{totalDeposited,totalUsed,current,pct:vPct}=vaultStats(v);
    const isSpending=v.type==='spending';

    let fillBadge='';
    if(v.fillMode==='fixed')fillBadge=`<span style="font-size:10px;background:var(--accent-l);color:var(--accent);padding:1px 6px;border-radius:20px;margin-left:4px;">↻ ${RM(v.fixedAmount)}/mo</span>`;
    else if(v.fillMode==='percentage')fillBadge=`<span style="font-size:10px;background:var(--info-l);color:var(--info);padding:1px 6px;border-radius:20px;margin-left:4px;">${v.pct}%</span>`;
    else fillBadge=`<span style="font-size:10px;background:var(--bg);border:1px solid var(--border);color:var(--muted);padding:1px 6px;border-radius:20px;margin-left:4px;">manual</span>`;

    return`<div class="card card-sm" style="${overBudget?'border-color:var(--danger);border-width:1.5px;':''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <div style="font-size:13px;font-weight:500;">${badge(v.name,v.color)}${fillBadge}</div>
        ${overBudget?`<span style="font-size:11px;background:var(--danger-l);color:var(--danger);padding:2px 8px;border-radius:20px;">Over budget</span>`:''}
        ${vPct!==null?`<span style="font-size:13px;font-weight:500;font-family:'DM Mono',monospace;color:var(--accent);">${vPct}%</span>`:''}
      </div>
      ${isSpending
        ?`<div style="font-size:12px;margin-bottom:2px;"><span style="font-weight:500;color:var(--accent);">${RM(spent)}</span><span style="color:var(--muted);"> spent${budget>0?' / '+RM(budget):''}</span></div>
          <div style="font-size:11px;color:${overBudget?'var(--danger)':'var(--muted)'};margin-bottom:${budget>0?6:0}px;">${budget>0?(overBudget?'Over by '+RM(spent-budget):RM(budget-spent)+' left'):'no budget'}</div>
          <div style="font-size:12px;margin-bottom:4px;"><span style="font-weight:500;">${RM(v.current)}</span><span style="color:var(--muted);"> balance</span></div>`
        :`<div style="font-size:12px;margin-bottom:2px;"><span style="font-weight:500;">${RM(v.current)}</span><span style="color:var(--muted);"> saved${v.target>0?' / '+RM(v.target):''}</span></div>
          ${totalUsed>0?`<div style="font-size:11px;color:var(--danger);margin-bottom:6px;">${RM(totalUsed)} used</div>`:''}`
      }
      ${budget>0?`<div class="prog-wrap"><div class="prog ${mCls}" style="width:${monthPct}%"></div></div>`:''}
    </div>`;
  }).join('');

  // Deployed assets section (active = not archived)
  const activeAssets=(DB.assets||[]).filter(a=>!a.archived);
  const assetsSh=document.getElementById('dashAssetsSh');
  const assetsDiv=document.getElementById('dashVaults');
  if(activeAssets.length){
    if(assetsSh)assetsSh.style.display='';
    if(!assetsDiv)return;
    assetsDiv.innerHTML=activeAssets.map(a=>{
      const net=assetNet(a);
      return`<div class="card card-sm">
        <div style="font-size:13px;font-weight:500;margin-bottom:4px;">${a.name}</div>
        <div style="font-size:12px;color:var(--muted);">Invested ${RM(assetTotalInvested(a))} · Returned ${RM(assetTotalReturned(a))} · Net <span style="color:${net>0?'var(--accent)':net<0?'var(--danger)':'var(--muted)'};">${net>=0?'+':''}${RM(net)}</span></div>
      </div>`;
    }).join('');
  }else{
    if(assetsSh)assetsSh.style.display='none';
    assetsDiv.innerHTML='';
  }

  const recent=(DB.expenses||[]).slice().sort((a,b)=>(b.date||'')<(a.date||'')?-1:(b.date||'')==(a.date||'')?b.id-a.id:1).slice(0,6);
  document.getElementById('dashRecent').innerHTML=recent.length?
    `<table><thead><tr><th>Date</th><th>Item</th><th>Vault</th><th>Amount</th></tr></thead><tbody>${recent.map(e=>`<tr><td class="td-m">${e.date||''}</td><td>${e.name}</td><td>${fundBadge(e.fund)}</td><td class="td-m">${RM(e.amount)}</td></tr>`).join('')}</tbody></table>`
    :'<div class="empty">No transactions yet</div>';
}

// ─── NET WORTH ───────────────────────────────────────────────────
function renderNetworth(){
  const totalAssets=totalNetWorth();
  const totalLiabilities=0;
  const netWorth=totalAssets-totalLiabilities;
  if(!DB.networth)DB.networth=[];
  const data=DB.networth.slice().sort((a,b)=>a.month.localeCompare(b.month));
  const prev=data.length>=2?data[data.length-2]:null;
  const change=prev?totalAssets-prev.amount:0;
  const monthlyIncome=DB.income.filter(i=>i.month===cm()).reduce((s,i)=>s+i.amount,0);
  const monthlySpend=DB.expenses.filter(e=>e.month===cm()).reduce((s,e)=>s+e.amount,0);
  document.getElementById('nwStats').innerHTML=[
    {label:'Net worth',value:RM(netWorth),sub:'Vaults + fund balances'},
    {label:'Month change',value:(change>=0?'+':'')+RM(change),sub:'vs last month',color:change>=0?'var(--accent)':'var(--danger)'},
    {label:'This month',value:RM(monthlyIncome-monthlySpend),sub:'Income minus expenses',color:(monthlyIncome-monthlySpend)>=0?'var(--accent)':'var(--danger)'},
  ].map(s=>`<div class="stat"><div class="stat-lbl">${s.label}</div><div class="stat-val" style="color:${s.color||'var(--text)'}">${s.value}</div><div class="stat-sub">${s.sub}</div></div>`).join('');

  // Vault breakdown
  const nwAssetBucket=DB.funds.reduce((s,f)=>s+(f.balance||0),0);
  const assetRow=`<tr>
    <td style="font-weight:500;">Asset bucket <span style="font-size:10px;background:var(--bg);border:1px solid var(--border);color:var(--muted);padding:1px 6px;border-radius:20px;margin-left:4px;">computed</span></td>
    <td class="td-m">${RM(nwAssetBucket)}</td>
    <td class="td-m" style="color:var(--muted);">—</td>
    <td style="font-size:11px;color:var(--muted);">Sum of fund balances</td>
  </tr>`;
  document.getElementById('nwVaultBreakdown').innerHTML=`<table><thead><tr><th>Vault</th><th>Balance</th><th>Target</th><th>Progress</th></tr></thead><tbody>${assetRow+DB.vaults.map(v=>{
    const{totalUsed:nwUsed,current:nwCur,pct:nwPct}=vaultStats(v);
    return`<tr>
      <td style="font-weight:500;">${v.name}${v.type==='spending'?'<span style="font-size:10px;background:var(--warn-l);color:var(--amber);padding:1px 6px;border-radius:20px;margin-left:6px;">spending</span>':''}</td>
      <td class="td-m">${v.type==='spending'?`<span style="color:var(--accent);">${RM(nwUsed)}</span> used`:RM(nwCur)}</td>
      <td class="td-m" style="color:var(--muted);">${v.target>0?RM(v.target):'—'}</td>
      <td>${nwPct!==null?`<div style="display:flex;align-items:center;gap:8px;"><div class="prog-wrap" style="flex:1;margin:0;"><div class="prog p-safe" style="width:${nwPct}%"></div></div><span style="font-size:11px;color:var(--muted);min-width:28px;">${nwPct}%</span></div>`:'—'}</td>
    </tr>`;
  }).join('')}</tbody></table>`;

  // Chart
  if(data.length<2){document.getElementById('nwChart').innerHTML='<div class="empty" style="padding:20px;">More data will appear after the first month</div>';return;}
  const max=Math.max(...data.map(d=>d.amount));const min=Math.min(...data.map(d=>d.amount));
  const h=120;const range=max-min||1;
  document.getElementById('nwChart').innerHTML=`<div style="display:flex;align-items:flex-end;gap:6px;height:${h+44}px;padding:8px 0 0;">${data.map(d=>{
    const bh=Math.max(8,Math.round((d.amount-min)/range*h)+16);
    return`<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:36px;">
      <span style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;white-space:nowrap;">${RM(d.amount)}</span>
      <div style="width:100%;max-width:44px;height:${bh}px;background:var(--accent);border-radius:4px 4px 0 0;opacity:.85;"></div>
      <span style="font-size:10px;color:var(--muted);">${d.month.slice(5)}</span>
    </div>`;
  }).join('')}</div>`;

  // History table
  document.getElementById('nwHistory').innerHTML=`<table style="font-size:13px;"><thead><tr><th>Month</th><th>Net worth</th><th>Change</th></tr></thead><tbody>${data.slice().reverse().map((d,i,arr)=>{
    const chg=arr[i+1]?d.amount-arr[i+1].amount:null;
    return`<tr><td>${mlabel(d.month)}</td><td class="td-m">${RM(d.amount)}</td><td class="td-m" style="color:${chg===null?'var(--muted)':chg>=0?'var(--accent)':'var(--danger)'};">${chg===null?'—':(chg>=0?'+':'')+RM(chg)}</td></tr>`;
  }).join('')}</tbody></table>`;
}
function addNW(){
  const thisMonth=cm();
  if(!DB.networth)DB.networth=[];
  const total=totalNetWorth();
  const existing=DB.networth.find(n=>n.month===thisMonth);
  if(!existing){DB.networth.push({month:thisMonth,amount:total});}
  else{existing.amount=total;}
  save();toast('Snapshot saved for '+mlabel(thisMonth));renderNetworth();
}
function deleteNW(month){
  if(!month)return;
  DB.networth=DB.networth.filter(n=>n.month!==month);
  save();toast('Snapshot deleted');renderNetworth();
}

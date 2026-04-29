// ─── ANALYTICS ───────────────────────────────────────────────────
let _analyticsMonth=null;
let _analyticsFrom=null,_analyticsTo=null;

function _monthsInRange(from,to){
  const result=[];
  let y=parseInt(from.slice(0,4)),m=parseInt(from.slice(5,7));
  const ty=parseInt(to.slice(0,4)),tm=parseInt(to.slice(5,7));
  while(y<ty||(y===ty&&m<=tm)){
    result.push(y+'-'+String(m).padStart(2,'0'));
    m++;if(m>12){m=1;y++;}
  }
  return result;
}

function _resetAnalyticsRange(){
  const d=new Date();
  _analyticsTo=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  const d5=new Date(d.getFullYear(),d.getMonth()-5,1);
  _analyticsFrom=d5.getFullYear()+'-'+String(d5.getMonth()+1).padStart(2,'0');
}

function _setAnalyticsMonth(v){
  _analyticsMonth=v;
  _renderAnalyticsTop();
}

function _setAnalyticsFrom(v){
  _analyticsFrom=v;
  if(_analyticsFrom>_analyticsTo){const t=_analyticsFrom;_analyticsFrom=_analyticsTo;_analyticsTo=t;}
  _renderAnalyticsBottom();
}

function _setAnalyticsTo(v){
  _analyticsTo=v;
  if(_analyticsFrom>_analyticsTo){const t=_analyticsFrom;_analyticsFrom=_analyticsTo;_analyticsTo=t;}
  _renderAnalyticsBottom();
}

const _anColorMap={purple:'var(--purple,#9b59b6)',teal:'var(--teal,#1abc9c)',amber:'var(--amber,#f39c12)',info:'var(--info,#3498db)',pink:'var(--pink,#e91e8c)',accent:'var(--accent)',danger:'var(--danger)'};
function _anVColor(c){return _anColorMap[c]||'var(--accent)';}

function _renderAnalyticsTop(){
  const el=document.getElementById('an-top-card');
  if(!el)return;

  const curM=cm();
  const allMonths=[...new Set((DB.expenses||[]).map(e=>e.month).filter(Boolean))].sort().reverse();
  const monthList=[...new Set([curM,...allMonths])].sort().reverse();
  if(!_analyticsMonth)_analyticsMonth=curM;

  const selM=_analyticsMonth;
  const vaults=(DB.vaults||[]).filter(v=>!v.archived);
  const selStyle=`padding:7px 12px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;`;

  const perVault=vaults.map(v=>{
    const spent=(DB.expenses||[]).filter(e=>e.month===selM&&e.fund===v.id).reduce((s,e)=>s+e.amount,0);
    const budget=monthlyBudget(v.id);
    return{v,spent,budget};
  }).filter(x=>x.spent>0||x.budget>0);

  const maxSpent=perVault.reduce((mx,x)=>Math.max(mx,x.spent,x.budget),1);

  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
      <div style="font-size:14px;font-weight:500;">Month</div>
      <select onchange="_setAnalyticsMonth(this.value)" style="${selStyle}">
        ${monthList.map(m=>`<option value="${m}"${m===selM?' selected':''}>${mlabel(m)}</option>`).join('')}
      </select>
    </div>
    ${perVault.length===0?`<div class="empty">No spending data for ${mlabel(selM)}</div>`:`
    <div style="font-size:13px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Spending per vault — ${mlabel(selM)}</div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      ${perVault.map(({v,spent,budget})=>{
        const barW=Math.min(100,Math.round(spent/maxSpent*100));
        const over=budget>0&&spent>budget;
        return`<div>
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
            <span style="font-size:12px;">${badge(v.name,v.color)}</span>
            <span style="font-size:12px;font-family:'DM Mono',monospace;color:${over?'var(--danger)':'var(--text)'};">${RM(spent)}${budget>0?' / '+RM(budget):''}</span>
          </div>
          <div style="background:var(--border);border-radius:4px;height:6px;overflow:hidden;">
            <div style="height:6px;width:${barW}%;background:${over?'var(--danger)':_anVColor(v.color)};border-radius:4px;transition:width .3s;"></div>
          </div>
          ${over?`<div style="font-size:11px;color:var(--danger);margin-top:2px;">Over by ${RM(spent-budget)}</div>`:''}
        </div>`;
      }).join('')}
    </div>`}
  `;
}

function _renderAnalyticsBottom(){
  const el=document.getElementById('an-bottom-wrap');
  if(!el)return;

  if(!_analyticsFrom||!_analyticsTo)_resetAnalyticsRange();

  const rangeMonths=_monthsInRange(_analyticsFrom,_analyticsTo);
  const rangeLabel=_analyticsFrom===_analyticsTo?mlabel(_analyticsFrom):`${mlabel(_analyticsFrom)} to ${mlabel(_analyticsTo)}`;
  const vaults=(DB.vaults||[]).filter(v=>!v.archived);
  const selStyle=`padding:7px 12px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;`;

  // Per-vault mini charts
  const perVaultTrend=vaults.map(v=>{
    const monthSpends=rangeMonths.map(m=>(DB.expenses||[]).filter(e=>e.month===m&&e.fund===v.id).reduce((s,e)=>s+e.amount,0));
    const maxV=Math.max(...monthSpends,1);
    const hasAny=monthSpends.some(s=>s>0);
    const bars=rangeMonths.map((m,i)=>{
      const spent=monthSpends[i];
      const h=spent>0?Math.max(4,Math.round(spent/maxV*60)):0;
      const label=mlabel(m).split(' ')[0];
      return`<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;min-width:0;">
        <div style="font-size:10px;font-family:'DM Mono',monospace;color:var(--muted);height:14px;display:flex;align-items:flex-end;">${spent>0?RM(spent):''}</div>
        <div style="width:100%;display:flex;align-items:flex-end;height:60px;">
          <div style="width:100%;height:${h}px;background:${_anVColor(v.color)};border-radius:3px 3px 0 0;" title="${mlabel(m)}: ${RM(spent)}"></div>
        </div>
        <div style="font-size:10px;color:var(--muted);">${label}</div>
      </div>`;
    }).join('');
    return{v,hasAny,bars};
  });

  // Totals per month
  const totals=rangeMonths.map(m=>(DB.expenses||[]).filter(e=>e.month===m).reduce((s,e)=>s+e.amount,0));

  // Per-vault breakdown table
  const tableRows=vaults.map(v=>{
    const spent=rangeMonths.reduce((s,m)=>s+(DB.expenses||[]).filter(e=>e.month===m&&e.fund===v.id).reduce((ss,e)=>ss+e.amount,0),0);
    const budget=rangeMonths.length*monthlyBudget(v.id);
    const pctUsed=budget>0?Math.round(spent/budget*100):null;
    const avgMonthly=rangeMonths.length>0?spent/rangeMonths.length:0;
    if(spent===0&&budget===0)return null;
    const over=budget>0&&spent>budget;
    return`<tr style="${over?'background:var(--danger-l);':''}">
      <td>${badge(v.name,v.color)}</td>
      <td class="td-m" style="color:${over?'var(--danger)':'var(--text)'};">${RM(spent)}</td>
      <td class="td-m">${budget>0?RM(budget):'—'}</td>
      <td class="td-m" style="color:${over?'var(--danger)':pctUsed!==null&&pctUsed>70?'var(--warn,#f39c12)':'var(--text)'};">${pctUsed!==null?pctUsed+'%':'—'}</td>
      <td class="td-m" style="color:var(--muted);">${avgMonthly>0?RM(Math.round(avgMonthly)):'—'}</td>
    </tr>`;
  }).filter(Boolean);

  // Selectable months for range pickers (data months + current endpoints)
  const allMonths=[...new Set((DB.expenses||[]).map(e=>e.month).filter(Boolean))].sort().reverse();
  const selectableMonths=[...new Set([...allMonths,_analyticsFrom,_analyticsTo])].filter(Boolean).sort().reverse();

  el.innerHTML=`
  <div class="card" style="margin-bottom:16px;">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
      <div style="font-size:14px;font-weight:500;">From</div>
      <select onchange="_setAnalyticsFrom(this.value)" style="${selStyle}">
        ${selectableMonths.map(m=>`<option value="${m}"${m===_analyticsFrom?' selected':''}>${mlabel(m)}</option>`).join('')}
      </select>
      <div style="font-size:14px;font-weight:500;">To</div>
      <select onchange="_setAnalyticsTo(this.value)" style="${selStyle}">
        ${selectableMonths.map(m=>`<option value="${m}"${m===_analyticsTo?' selected':''}>${mlabel(m)}</option>`).join('')}
      </select>
      <button class="btn btn-sm" onclick="_resetAnalyticsRange();_renderAnalyticsBottom()">Reset to last 6 months</button>
    </div>
    <div style="font-size:13px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px;">Spending trend by vault — ${rangeLabel}</div>
    ${perVaultTrend.map(({v,hasAny,bars})=>`
    <div style="margin-bottom:20px;">
      <div style="font-size:12px;font-weight:500;margin-bottom:8px;">${badge(v.name,v.color)}</div>
      ${hasAny
        ?`<div style="display:flex;gap:6px;align-items:flex-end;">${bars}</div>`
        :`<div style="font-size:12px;color:var(--muted);padding:8px 0;">No spending in selected range</div>`
      }
    </div>`).join('')}
    <div style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);margin-top:4px;border-top:1px solid var(--border);padding-top:10px;">
      Total: ${rangeMonths.map((m,i)=>`<span title="${mlabel(m)}">${mlabel(m).split(' ')[0]} ${RM(totals[i])}</span>`).join('<span style="margin:0 4px;">·</span>')}
    </div>
  </div>

  <div class="card" style="margin-bottom:16px;">
    <div style="font-size:13px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Per-vault breakdown — ${rangeLabel}</div>
    ${tableRows.length===0?`<div class="empty">No data for ${rangeLabel}</div>`:`
    <div style="overflow-x:auto;">
      <table>
        <thead><tr><th>Vault</th><th>Total spent</th><th>Total budget</th><th>% Used</th><th>Avg monthly</th></tr></thead>
        <tbody>${tableRows.join('')}</tbody>
      </table>
    </div>`}
  </div>
  `;
}

function renderAnalytics(){
  const pg=document.getElementById('page-analytics');
  if(!pg)return;

  const allMonths=[...new Set((DB.expenses||[]).map(e=>e.month).filter(Boolean))].sort().reverse();
  if(allMonths.length===0){
    pg.innerHTML=`<div class="sh">Analytics</div><div class="card"><div class="empty">No expense data yet</div></div>`;
    return;
  }

  if(!_analyticsMonth)_analyticsMonth=cm();
  if(!_analyticsFrom||!_analyticsTo)_resetAnalyticsRange();

  pg.innerHTML=`
  <div class="sh">Analytics</div>
  <div id="an-top-card" class="card" style="margin-bottom:16px;"></div>
  <div id="an-bottom-wrap"></div>
  `;

  _renderAnalyticsTop();
  _renderAnalyticsBottom();
}

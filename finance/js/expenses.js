// ─── EXPENSES ────────────────────────────────────────────────────
function _recompute(v){v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);}

function renderExpenses(){
  document.getElementById('expD').value=new Date().toISOString().slice(0,10);

  const ff=document.getElementById('fFund').value||'all';
  const fm=document.getElementById('fMonth').value||'all';
  const ft=document.getElementById('fTag')?.value||'all';
  const fq=(document.getElementById('fSearch')?.value||'').trim().toLowerCase();

  populateFundSelects();

  // Quick-add buttons for all fixed vaults
  document.getElementById('quickFixed').innerHTML=(DB.vaults||[])
    .filter(v=>v.fillMode==='fixed'&&!v.archived)
    .map(v=>`<button class="btn btn-sm" onclick="quickLog('${v.name.replace(/'/g,"\\'")}','${v.id}',${v.fixedAmount})">${v.name} — ${RM(v.fixedAmount)}</button>`)
    .join('');

  const months=[...new Set((DB.expenses||[]).map(e=>e.month||cm()))].sort().reverse();
  const sel=document.getElementById('fMonth');
  sel.innerHTML='<option value="all">All months</option>'+months.map(m=>`<option value="${m}"${m===fm?' selected':''}>${mlabel(m)}</option>`).join('');
  document.getElementById('fFund').value=ff;

  let txns=(DB.expenses||[]).slice().sort((a,b)=>(b.date||'')<(a.date||'')?-1:(b.date||'')==(a.date||'')?b.id-a.id:1);
  if(ff!=='all')txns=txns.filter(e=>e.fund===ff);
  if(fm!=='all')txns=txns.filter(e=>(e.month||cm())===fm);
  if(ft!=='all')txns=txns.filter(e=>e.tag===ft);
  if(fq)txns=txns.filter(e=>(e.name||'').toLowerCase().includes(fq)||String(e.amount||'').includes(fq)||(e.tag||'').toLowerCase().includes(fq));

  if(!txns.length){document.getElementById('expList').innerHTML='<div class="empty">No transactions match — try changing the filters above</div>';}
  else{
    const byMonth={};
    txns.forEach(e=>{const m=e.month||cm();if(!byMonth[m])byMonth[m]=[];byMonth[m].push(e);});
    let html='<table><thead><tr><th>Date</th><th>Item</th><th>Vault</th><th>Tag</th><th>Amount</th><th></th></tr></thead><tbody>';
    Object.keys(byMonth).sort().reverse().forEach(m=>{
      html+=`<tr><td colspan="6" style="padding:6px 12px;font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;background:var(--bg);">${mlabel(m)}</td></tr>`;
      byMonth[m].forEach(e=>{
        const vlt=vaultById(e.fund);
        if(e._editing){
          const fundOpts=(DB.vaults||[]).filter(v=>!v.archived).map(v=>{
            const dis=v.type==='savings'?'disabled':'';
            return`<option value="${v.id}" ${dis}${v.id===e.fund?' selected':''}>${v.name}${v.type==='savings'?' (savings)':''}</option>`;
          }).join('');
          html+=`<tr style="background:var(--bg);">
            <td><input id="exp-date-${e.id}" type="date" value="${e.date||''}" style="width:130px;padding:4px 6px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:12px;outline:none;"/></td>
            <td><input id="exp-name-${e.id}" value="${e.name}" style="width:100%;padding:4px 8px;border:1px solid var(--accent);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;"/></td>
            <td><select id="exp-fund-${e.id}" style="padding:4px 6px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:12px;outline:none;">${fundOpts}</select></td>
            <td><input id="exp-amt-${e.id}" type="number" value="${e.amount}" style="width:90px;padding:4px 6px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;font-family:'DM Mono',monospace;"/></td>
            <td style="display:flex;gap:4px;">
              <button class="btn btn-xs edit-save-btn" onclick="saveEditExp('${e.id}')">Save</button>
              <button class="btn btn-xs" onclick="cancelEditExp('${e.id}')">Cancel</button>
            </td>
          </tr>`;
        } else {
          html+=`<tr>
            <td class="td-m">${e.date||'—'}</td><td>${e.name}</td>
            <td>${vlt?badge(vlt.name,vlt.color):badge(e.fund,'info')}</td>
            <td>${e.tag?`<span style="font-size:11px;padding:2px 7px;border-radius:20px;background:var(--bg);border:1px solid var(--border);color:var(--muted);">${e.tag}</span>`:''}</td>
            <td class="td-m">${RM(e.amount)}</td>
            <td style="display:flex;gap:6px;">
              <button class="btn btn-sm" onclick="editExp('${e.id}')">Edit</button>
              <button class="btn btn-sm btn-d" onclick="delExp('${e.id}')">Del</button>
            </td>
          </tr>`;
        }
      });
    });
    document.getElementById('expList').innerHTML=html+'</tbody></table>';
  }

  // Monthly summary table
  const sumMonth=fm!=='all'?fm:cm();
  const summary={};
  (DB.expenses||[]).filter(e=>(e.month||cm())===sumMonth).forEach(e=>{summary[e.fund]=(summary[e.fund]||0)+e.amount;});
  let sHtml='<table><thead><tr><th>Vault</th><th>Spent</th><th>Balance</th><th>Remaining</th><th>Progress</th></tr></thead><tbody>';
  (DB.vaults||[]).filter(v=>!v.archived).forEach(v=>{
    const spent=summary[v.id]||0;
    const bal=v.current;
    const budget=monthlyBudget(v.id);
    const rem=budget>0?(budget-spent):0;
    const pct=budget>0?Math.min(100,Math.round(spent/budget*100)):0;
    const cls=pct>90?'p-danger':pct>70?'p-warn':'p-safe';
    sHtml+=`<tr><td>${badge(v.name,v.color)}</td><td class="td-m">${RM(spent)}</td><td class="td-m">${RM(bal)}</td><td class="td-m" style="color:${rem<0?'var(--danger)':'var(--accent)'};">${budget>0?RM(rem):'—'}</td><td style="width:100px;">${budget>0?`<div class="prog-wrap" style="margin:0;"><div class="prog ${cls}" style="width:${pct}%"></div></div>`:''}</td></tr>`;
  });
  const tagSummary={};
  (DB.expenses||[]).filter(e=>(e.month||cm())===sumMonth&&e.tag).forEach(e=>{tagSummary[e.tag]=(tagSummary[e.tag]||0)+e.amount;});
  const tagHtml=Object.keys(tagSummary).length?
    '<div class="sh" style="margin-top:20px;">Spending by tag</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">'+
    Object.entries(tagSummary).sort((a,b)=>b[1]-a[1]).map(([tag,amt])=>
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:10px 14px;min-width:100px;"><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">${tag}</div><div style="font-size:16px;font-weight:500;font-family:'DM Mono',monospace;">${RM(amt)}</div></div>`
    ).join('')+'</div>':'';
  document.getElementById('expSummary').innerHTML=sHtml+'</tbody></table>'+tagHtml;
}

function quickLog(name,fund,amount){
  const date=new Date().toISOString().slice(0,10);
  const v=(DB.vaults||[]).find(x=>x.id===fund);
  if(!v){toast('Vault not found');return;}
  if(amount>v.current){toast('Not enough in '+v.name+' ('+RM(v.current)+' available)');return;}
  v.deposits.push({id:uid(),type:'withdrawal',reason:name,amount,date,source:'expense'});
  _recompute(v);
  DB.expenses.push({id:uid(),name,fund,amount,date,month:date.slice(0,7)});
  save();toast(name+' logged');renderExpenses();renderDashboard();
  if(typeof renderVaults==='function')renderVaults();
}

function addExpense(){
  const name=document.getElementById('expN').value.trim();
  const fund=document.getElementById('expF').value;
  const amt=parseFloat(document.getElementById('expA').value);
  const date=document.getElementById('expD').value;
  const tag=document.getElementById('expTag').value;
  if(!name||!amt)return;
  const month=date?date.slice(0,7):cm();
  const v=(DB.vaults||[]).find(x=>x.id===fund);
  if(v){
    if(v.type==='savings'){toast('Savings vault — use the vault page to make withdrawals');return;}
    v.deposits.push({id:uid(),type:'withdrawal',reason:name,amount:amt,date:date||new Date().toISOString().slice(0,10),source:'expense'});
    _recompute(v);
  }
  DB.expenses.push({id:uid(),name,fund,amount:amt,date,month,tag});
  save();toast('Logged'+(v?' from '+v.name:''));renderExpenses();renderDashboard();
  if(typeof renderVaults==='function')renderVaults();
  document.getElementById('expN').value='';document.getElementById('expA').value='';
  document.getElementById('expTag').value='';
}

function editExp(id){
  const e=(DB.expenses||[]).find(x=>x.id==id);if(!e)return;
  e._editing=true;renderExpenses();
}
function cancelEditExp(id){
  const e=(DB.expenses||[]).find(x=>x.id==id);if(!e)return;
  delete e._editing;renderExpenses();
}
function saveEditExp(id){
  const e=(DB.expenses||[]).find(x=>x.id==id);if(!e)return;
  const newName=document.getElementById('exp-name-'+id).value.trim();
  const newAmt=parseFloat(document.getElementById('exp-amt-'+id).value);
  const newFund=document.getElementById('exp-fund-'+id).value;
  const newDate=document.getElementById('exp-date-'+id).value;
  if(!newName||isNaN(newAmt))return;

  // Reverse old withdrawal from old vault
  const oldV=(DB.vaults||[]).find(x=>x.id===e.fund);
  if(oldV&&oldV.deposits){
    // Remove matching withdrawal (match by reason+amount; best effort)
    const idx=oldV.deposits.findIndex(d=>d.type==='withdrawal'&&d.reason===e.name&&Math.abs(d.amount)===e.amount);
    if(idx>=0)oldV.deposits.splice(idx,1);
    _recompute(oldV);
  }

  // Apply new withdrawal to new vault
  const newV=(DB.vaults||[]).find(x=>x.id===newFund);
  if(newV){
    newV.deposits.push({id:uid(),type:'withdrawal',reason:newName,amount:newAmt,date:newDate||new Date().toISOString().slice(0,10),source:'expense'});
    _recompute(newV);
  }

  e.name=newName;e.amount=newAmt;e.fund=newFund;
  e.date=newDate;e.month=newDate?newDate.slice(0,7):e.month;
  delete e._editing;
  save();toast('Updated');renderExpenses();renderDashboard();
  if(typeof renderVaults==='function')renderVaults();
}

function delExp(id){showConfirm('Delete transaction?','Item will move to recycle bin.',()=>{
  const e=(DB.expenses||[]).find(x=>x.id==id);if(!e)return;
  const v=(DB.vaults||[]).find(x=>x.id===e.fund);
  if(v&&v.deposits){
    const idx=v.deposits.findIndex(d=>d.type==='withdrawal'&&d.reason===e.name&&Math.abs(d.amount)===e.amount);
    if(idx>=0)v.deposits.splice(idx,1);
    _recompute(v);
  }
  DB.expenses=DB.expenses.filter(x=>x.id!==id);
  trashIt('expense',e,()=>{});save();toast('Moved to bin');renderExpenses();renderDashboard();
});}

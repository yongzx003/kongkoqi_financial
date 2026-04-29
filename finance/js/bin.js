// ─── RECYCLE BIN ──────────────────────────────────────────────────
function trashIt(type, item, restoreFn){
  if(!DB.trash)DB.trash=[];
  DB.trash.push({id:uid(),type,item,deletedAt:new Date().toISOString(),restoreFn:restoreFn.toString()});
  updateBinCount();
}

function updateBinCount(){
  const n=(DB.trash||[]).length;
  const el=document.getElementById('binCount');
  if(!el)return;
  if(n>0){el.textContent=n;el.style.display='inline';}
  else{el.style.display='none';}
}

function renderBin(){
  const thirtyDaysAgo=Date.now()-(30*24*60*60*1000);
  const expired=(DB.trash||[]).filter(t=>new Date(t.deletedAt).getTime()<thirtyDaysAgo);
  if(expired.length){DB.trash=DB.trash.filter(t=>new Date(t.deletedAt).getTime()>=thirtyDaysAgo);save();}
  updateBinCount();
  const filter=document.getElementById('binFilter')?.value||'all';
  const items=(DB.trash||[]).slice().sort((a,b)=>b.id-a.id);
  const filtered=filter==='all'?items:items.filter(i=>i.type===filter);

  if(!filtered.length){
    document.getElementById('binList').innerHTML='<div class="empty">Bin is empty</div>';
    return;
  }

  const typeLabel={expense:'Expense',income:'Income',vault:'Vault',claim:'Claim',notmine:'Not my money',asset:'Asset'};
  const html=filtered.map(entry=>{
    const item=entry.item;
    let preview='';
    if(entry.type==='expense') preview=`${item.name} — ${RM(item.amount)} (${item.date||''})`;
    else if(entry.type==='income') preview=`${item.source||'Income'} — ${RM(item.amount)} (${mlabel(item.month)})`;
    else if(entry.type==='vault') preview=`${item.name} — ${RM(item.current)}`;
    else if(entry.type==='claim') preview=`${item.name} — ${RM(item.amount)} from ${item.from}`;
    else if(entry.type==='notmine') preview=`${item.name} — ${RM(item.total)} for ${item['for']}`;
    else if(entry.type==='asset') preview=`${item.name} — ${(item.ledger||[]).length} ledger entries`;
    const deletedDate=new Date(entry.deletedAt).toLocaleDateString('default',{day:'numeric',month:'short',year:'numeric'});
    return`<div class="card card-sm" style="margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
          <span class="badge" style="background:var(--danger-l);color:var(--danger);">${typeLabel[entry.type]||entry.type}</span>
          <span style="font-size:13px;font-weight:500;">${preview}</span>
        </div>
        <div style="font-size:11px;color:var(--muted);">Deleted ${deletedDate}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-sm btn-p" onclick="restoreItem('${entry.id}')">Restore</button>
        <button class="btn btn-sm btn-d" onclick="permDelete('${entry.id}')">Delete forever</button>
      </div>
    </div>`;
  }).join('');
  document.getElementById('binList').innerHTML=html;
}

function restoreItem(trashId){
  const entry=(DB.trash||[]).find(t=>t.id==trashId);
  if(!entry)return;
  const item=entry.item;

  if(entry.type==='expense'){
    DB.expenses.push(item);
    // Restore withdrawal to vault (if vault still exists)
    const v=(DB.vaults||[]).find(x=>x.id===item.fund);
    if(v){
      v.deposits.push({id:uid(),type:'withdrawal',reason:item.name,amount:item.amount,date:item.date||new Date().toISOString().slice(0,10)});
      v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
    }
    save();toast('Expense restored');renderExpenses();renderDashboard();
  } else if(entry.type==='income'){
    DB.income.push(item);
    save();toast('Income restored');renderIncome();renderDashboard();
  } else if(entry.type==='vault'){
    DB.vaults.push(item);
    save();toast('Vault restored');renderVaults();renderDashboard();
  } else if(entry.type==='claim'){
    DB.claims.push(item);
    save();toast('Claim restored');renderClaims();renderDashboard();
  } else if(entry.type==='notmine'){
    if(!DB.notmine)DB.notmine=[];
    DB.notmine.push(item);
    save();toast('Entry restored');renderNotmine();
  } else if(entry.type==='asset'){
    if(!DB.assets)DB.assets=[];
    DB.assets.push(item);
    // Replay every ledger entry in chronological order to restore vault balances
    (item.ledger||[]).slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(e=>{
      const vault=vaultById(e.vaultId);
      if(!vault)return;
      if(e.type==='investment'){
        vault.deposits.push({id:uid(),type:'withdrawal',reason:'Asset investment: '+item.name,amount:e.amount,date:e.date,source:'asset-restore'});
      }else{
        vault.deposits.push({id:uid(),type:'deposit',reason:'Asset return: '+item.name,amount:e.amount,date:e.date,source:'asset-restore'});
      }
      _recomputeV(vault);
    });
    save();toast('Asset restored');if(typeof renderAssets==='function')renderAssets();renderDashboard();
  } else {
    toast('Cannot restore this item type');return;
  }
  DB.trash=DB.trash.filter(t=>t.id!=trashId);
  save();renderBin();
}

function permDelete(trashId){
  showConfirm('Delete forever?','This cannot be undone.',()=>{
    DB.trash=DB.trash.filter(t=>t.id!=trashId);
    save();toast('Permanently deleted');renderBin();
  });
}

function emptyBin(){
  if(!(DB.trash||[]).length)return;
  showConfirm('Empty recycle bin?','All '+DB.trash.length+' items will be permanently deleted.',()=>{
    DB.trash=[];save();toast('Bin emptied');renderBin();
  });
}

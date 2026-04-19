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
  // Auto-expire items older than 30 days
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

  const typeLabel={expense:'Expense',income:'Income',vault:'Vault',claim:'Claim',notmine:'Not my money'};
  const html=filtered.map(entry=>{
    const item=entry.item;
    let preview='';
    if(entry.type==='expense') preview=`${item.name} — ${RM(item.amount)} (${item.date||''})`;
    else if(entry.type==='income') preview=`${item.source||'Income'} — ${RM(item.amount)} (${mlabel(item.month)})`;
    else if(entry.type==='vault') preview=`${item.name} — ${RM(item.current)}`;
    else if(entry.type==='claim') preview=`${item.name} — ${RM(item.amount)} from ${item.from}`;
    else if(entry.type==='notmine') preview=`${item.name} — ${RM(item.total)} for ${item['for']}`;
    else if(entry.type==='networth') preview=`Net worth snapshot — ${RM(item.amount)} (${mlabel(item.month)})`;
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
  // Restore based on type
  if(entry.type==='expense'){
    DB.expenses.push(item);
    if(item.fund&&item.fund.startsWith('vault:')){
      const v=DB.vaults.find(x=>x.id===item.fund.replace('vault:',''));
      if(v&&item.amount<=0||v){
        v.deposits.push({id:uid(),type:'withdrawal',reason:item.name,amount:item.amount,date:item.date||new Date().toISOString().slice(0,10)});
        v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
      }
    } else {
      const f=fundById(item.fund);
      if(f)f.balance=(f.balance||0)-item.amount;
    }
    save();toast('Expense restored');
    renderExpenses();renderDashboard();
  } else if(entry.type==='income'){
    DB.income.push(item);
    save();toast('Income restored');renderIncome();renderDashboard();
  } else if(entry.type==='vault'){
    DB.vaults.push(item);
    save();toast('Vault restored');renderVaults();renderDashboard();
  } else if(entry.type==='claim'){
    DB.claims.push(item);
    save();toast('Claim restored');renderClaims();renderDashboard();
  } else if(entry.type==='networth'){
    DB.networth=DB.networth.filter(x=>x.month!==item.month);
    DB.networth.push(item);
    save();toast('Snapshot restored');renderNetworth();
  } else if(entry.type==='notmine'){
    if(!DB.notmine)DB.notmine=[];
    DB.notmine.push(item);
    save();toast('Entry restored');renderNotmine();
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

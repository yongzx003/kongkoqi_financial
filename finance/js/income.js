// ─── INCOME ──────────────────────────────────────────────────────
function renderIncome(){
  document.getElementById('incM').value=cm();
  const m=cm();
  const mInc=DB.income.filter(i=>i.month===m).reduce((s,i)=>s+i.amount,0);
  const total=mInc||2250;
  const totalFixed=DB.fixedCosts.reduce((s,fc)=>s+fc.amount,0);
  const totalAutoDeposit=DB.vaults.filter(v=>v.autoDeposit).reduce((s,v)=>s+v.autoDeposit.amount,0);
  const compulsory=Math.max(0,total-totalFixed-totalAutoDeposit);

  let html=`<div class="card card-sm" style="margin-bottom:12px;">
    <div style="font-size:13px;color:var(--muted);margin-bottom:10px;">Based on ${RM(total)} income this month:</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">`;
  DB.fixedCosts.forEach(fc=>{
    html+=`<div class="stat" style="padding:12px;"><div class="stat-lbl">${fc.label}</div><div class="stat-val" style="font-size:18px;">${RM(fc.amount)}</div><div class="stat-sub">Fixed deduction</div></div>`;
  });
  DB.vaults.filter(v=>v.autoDeposit).forEach(v=>{
    html+=`<div class="stat" style="padding:12px;"><div class="stat-lbl">${v.name}</div><div class="stat-val" style="font-size:18px;">${RM(v.autoDeposit.amount)}</div><div class="stat-sub">Vault auto-deposit</div></div>`;
  });
  DB.funds.forEach(f=>{
    const amt=Math.round(compulsory*f.pct/100);
    html+=`<div class="stat" style="padding:12px;"><div class="stat-lbl">${f.name}</div><div class="stat-val" style="font-size:18px;">${RM(amt)}</div><div class="stat-sub">${f.pct}% of ${RM(compulsory)}</div></div>`;
  });
  html+=`</div></div>`;
  document.getElementById('allocPreview').innerHTML=html;

  const history=DB.income.slice().sort((a,b)=>b.month.localeCompare(a.month));
  document.getElementById('incHistory').innerHTML=history.length?
    `<table><thead><tr><th>Month</th><th>Source</th><th>Amount</th><th></th></tr></thead><tbody>${history.map(i=>`<tr><td>${mlabel(i.month)}</td><td>${i.source||'—'}</td><td class="td-m">${RM(i.amount)}</td><td><button class="btn btn-sm btn-d" onclick="delIncome('${i.id}')">Delete</button></td></tr>`).join('')}</tbody></table>`
    :'<div class="empty"><div style="font-size:15px;margin-bottom:6px;">No income logged yet</div><div style="font-size:12px;">Log your income to auto-split it across your funds.</div></div>';
}

// ─── ALLOCATION MODAL STATE ───────────────────────────────────────
let _allocModalCb=null,_allocModalData=null,_allocModalIncome=0;

function _allocModalSum(){
  const alloc=_allocModalData;if(!alloc)return;
  let total=0;
  (alloc.fixedCosts||[]).forEach(fc=>{const el=document.getElementById('alloc-fc-'+fc.id);if(el)total+=parseFloat(el.value)||0;});
  (alloc.vaults||[]).forEach(v=>{const el=document.getElementById('alloc-v-'+v.id);if(el)total+=parseFloat(el.value)||0;});
  (alloc.funds||[]).forEach(f=>{const el=document.getElementById('alloc-f-'+f.id);if(el)total+=parseFloat(el.value)||0;});
  total=Math.round(total*100)/100;
  const income=_allocModalIncome;
  const ok=Math.abs(total-income)<0.01;
  const sumEl=document.getElementById('allocModalSum');
  const errEl=document.getElementById('allocModalErr');
  const logBtn=document.getElementById('allocModalLogBtn');
  if(sumEl){sumEl.textContent=RM(total)+' / '+RM(income);sumEl.style.color=ok?'var(--accent)':'var(--danger)';}
  if(errEl){
    if(!ok){const diff=Math.round((total-income)*100)/100;errEl.textContent='Sum is '+RM(Math.abs(diff))+(diff>0?' over':' short')+' — adjust to equal '+RM(income)+'.';errEl.style.display='';}
    else{errEl.style.display='none';}
  }
  if(logBtn)logBtn.disabled=!ok;
}

function showAllocModal(incData,defaultAlloc,onCommit){
  _allocModalCb=onCommit;
  _allocModalData=defaultAlloc;
  _allocModalIncome=incData.amt;

  const sub=document.getElementById('allocModalSub');
  if(sub)sub.textContent='Allocating '+RM(incData.amt)+' · '+(incData.src||'Income')+' · '+mlabel(incData.month);

  const iStyle='width:110px;padding:6px 8px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;font-family:\'DM Mono\',monospace;text-align:right;outline:none;transition:border-color .15s;';
  const rowStyle='display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);';
  const secStyle='font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;padding:12px 0 6px;';
  const subStyle='font-size:11px;color:var(--muted);margin-top:1px;';
  let rows='';

  if((defaultAlloc.fixedCosts||[]).length){
    rows+=`<div style="${secStyle}">Fixed costs</div>`;
    defaultAlloc.fixedCosts.forEach(fc=>{
      rows+=`<div style="${rowStyle}">
        <div style="flex:1;font-size:13px;">${fc.label}<div style="${subStyle}">Fixed deduction</div></div>
        <input type="number" id="alloc-fc-${fc.id}" value="${fc.amount}" min="0" step="0.01" oninput="_allocModalSum()" style="${iStyle}" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
      </div>`;
    });
  }

  if((defaultAlloc.vaults||[]).length){
    rows+=`<div style="${secStyle}">Vault auto-deposits</div>`;
    defaultAlloc.vaults.forEach(v=>{
      rows+=`<div style="${rowStyle}">
        <div style="flex:1;font-size:13px;">${v.name}<div style="${subStyle}">Auto-deposit</div></div>
        <input type="number" id="alloc-v-${v.id}" value="${v.amount}" min="0" step="0.01" oninput="_allocModalSum()" style="${iStyle}" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
      </div>`;
    });
  }

  if((defaultAlloc.funds||[]).length){
    rows+=`<div style="${secStyle}">Fund allocation</div>`;
    defaultAlloc.funds.forEach(f=>{
      rows+=`<div style="${rowStyle}">
        <div style="flex:1;font-size:13px;">${f.name}<div style="${subStyle}">${f.pct}% of compulsory</div></div>
        <input type="number" id="alloc-f-${f.id}" value="${f.amount}" min="0" step="0.01" oninput="_allocModalSum()" style="${iStyle}" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
      </div>`;
    });
  }

  document.getElementById('allocModalRows').innerHTML=rows;
  _allocModalSum();
  document.getElementById('allocModal').classList.add('show');
}

function allocModalCancel(){
  document.getElementById('allocModal').classList.remove('show');
  _allocModalCb=null;_allocModalData=null;_allocModalIncome=0;
}

function allocModalCommit(){
  const alloc=_allocModalData;if(!alloc)return;
  const committed={
    fixedCosts:(alloc.fixedCosts||[]).map(fc=>({...fc,amount:parseFloat(document.getElementById('alloc-fc-'+fc.id)?.value)||0})),
    vaults:(alloc.vaults||[]).map(v=>({...v,amount:parseFloat(document.getElementById('alloc-v-'+v.id)?.value)||0})),
    funds:(alloc.funds||[]).map(f=>({...f,amount:parseFloat(document.getElementById('alloc-f-'+f.id)?.value)||0}))
  };
  const total=Math.round([...committed.fixedCosts,...committed.vaults,...committed.funds].reduce((s,x)=>s+x.amount,0)*100)/100;
  if(Math.abs(total-_allocModalIncome)>0.01){
    const err=document.getElementById('allocModalErr');
    if(err){err.textContent='Sum ('+RM(total)+') must equal income ('+RM(_allocModalIncome)+'). Adjust to balance.';err.style.display='';}
    return;
  }
  document.getElementById('allocModal').classList.remove('show');
  const cb=_allocModalCb;
  _allocModalCb=null;_allocModalData=null;_allocModalIncome=0;
  if(cb)cb(committed);
}

// ─── PROCESS / REVERSE ───────────────────────────────────────────
function _processIncome(id,month,amt,alloc){
  const today=new Date().toISOString().slice(0,10);
  (alloc.funds||[]).forEach(({id:fid,amount})=>{
    const f=DB.funds.find(x=>x.id===fid);
    if(f)f.balance=(f.balance||0)+amount;
  });
  (alloc.vaults||[]).forEach(({id:vid,amount,reason})=>{
    const v=DB.vaults.find(x=>x.id===vid);if(!v)return;
    if(!v.deposits)v.deposits=[];
    v.deposits.push({id:uid(),type:'deposit',reason:reason||'Monthly auto-deposit',amount,date:today,incomeId:id});
    v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
  });
  const rec=DB.income.find(i=>i.id===id);
  if(rec)rec._alloc={funds:alloc.funds,vaults:alloc.vaults};
}

function addIncome(){
  const month=document.getElementById('incM').value;
  const src=document.getElementById('incSrc').value.trim();
  const amt=parseFloat(document.getElementById('incAmt').value);
  if(!month||!amt)return;

  const totalFixed=DB.fixedCosts.reduce((s,fc)=>s+fc.amount,0);
  const totalAutoDeposit=DB.vaults.filter(v=>v.autoDeposit).reduce((s,v)=>s+v.autoDeposit.amount,0);
  const compulsory=Math.max(0,amt-totalFixed-totalAutoDeposit);

  // Compute fund amounts that sum exactly to compulsory (handle rounding)
  const rawAmts=DB.funds.map(f=>Math.round(compulsory*f.pct/100));
  const fundSum=rawAmts.reduce((s,a)=>s+a,0);
  const fundRemainder=Math.round((compulsory-fundSum)*100)/100;
  if(rawAmts.length>0)rawAmts[rawAmts.length-1]=Math.round((rawAmts[rawAmts.length-1]+fundRemainder)*100)/100;

  const defaultAlloc={
    fixedCosts:DB.fixedCosts.map(fc=>({id:fc.id,label:fc.label,amount:fc.amount})),
    vaults:DB.vaults.filter(v=>v.autoDeposit).map(v=>({id:v.id,name:v.name,amount:v.autoDeposit.amount,reason:v.autoDeposit.reason})),
    funds:DB.funds.map((f,i)=>({id:f.id,name:f.name,pct:f.pct,amount:rawAmts[i]}))
  };

  showAllocModal({month,src,amt},defaultAlloc,(committed)=>{
    const id=uid();
    DB.income.push({id,month,source:src||'Income',amount:amt});
    _processIncome(id,month,amt,committed);
    save();toast('Income logged & funds updated');renderIncome();
    if(typeof renderDashboard==='function')renderDashboard();
    document.getElementById('incAmt').value='';document.getElementById('incSrc').value='';
  });
}

function delIncome(id){
  const i=DB.income.find(x=>x.id==id);if(!i)return;
  if(i._alloc){
    (i._alloc.funds||[]).forEach(({id:fid,amount})=>{const f=DB.funds.find(x=>x.id===fid);if(f)f.balance=(f.balance||0)-amount;});
  }else{
    // Legacy reversal for records logged before this modal was added
    const totalFixed=DB.fixedCosts.reduce((s,fc)=>s+fc.amount,0);
    const totalAutoDeposit=DB.vaults.filter(v=>v.autoDeposit).reduce((s,v)=>s+v.autoDeposit.amount,0);
    const compulsory=Math.max(0,i.amount-totalFixed-totalAutoDeposit);
    DB.funds.forEach(f=>{f.balance=(f.balance||0)-Math.round(compulsory*f.pct/100);});
  }
  DB.vaults.forEach(v=>{
    if(!v.deposits)return;
    v.deposits=v.deposits.filter(d=>d.incomeId!==id);
    v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
  });
  DB.income=DB.income.filter(x=>x.id!==id);
  trashIt('income',i,()=>{});
  save();toast('Moved to bin');renderIncome();renderDashboard();
}

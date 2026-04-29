// ─── INCOME ──────────────────────────────────────────────────────
function _activeFixedVaults(){
  return(DB.vaults||[]).filter(v=>v.fillMode==='fixed'&&!v.archived&&!(v.target>0&&v.current>=v.target));
}
function _activePctVaults(){
  return(DB.vaults||[]).filter(v=>v.fillMode==='percentage'&&!v.archived);
}

function renderIncome(){
  document.getElementById('incM').value=cm();
  const m=cm();
  const mInc=(DB.income||[]).filter(i=>i.month===m).reduce((s,i)=>s+i.amount,0);
  const total=mInc||2250;
  const fixedVaults=_activeFixedVaults();
  const pctVaults=_activePctVaults();
  const totalFixed=fixedVaults.reduce((s,v)=>s+v.fixedAmount,0);
  const remainder=Math.max(0,total-totalFixed);

  let html=`<div class="card card-sm" style="margin-bottom:12px;">
    <div style="font-size:13px;color:var(--muted);margin-bottom:10px;">Based on ${RM(total)} income this month:</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">`;
  fixedVaults.forEach(v=>{
    html+=`<div class="stat" style="padding:12px;"><div class="stat-lbl">${v.name}</div><div class="stat-val" style="font-size:18px;">${RM(v.fixedAmount)}</div><div class="stat-sub">Fixed deduction</div></div>`;
  });
  pctVaults.forEach(v=>{
    const amt=Math.round(remainder*v.pct/100);
    html+=`<div class="stat" style="padding:12px;"><div class="stat-lbl">${v.name}</div><div class="stat-val" style="font-size:18px;">${RM(amt)}</div><div class="stat-sub">${v.pct}% of ${RM(remainder)}</div></div>`;
  });
  html+=`</div></div>`;
  document.getElementById('allocPreview').innerHTML=html;

  const history=(DB.income||[]).slice().sort((a,b)=>b.month.localeCompare(a.month));
  document.getElementById('incHistory').innerHTML=history.length?
    `<table><thead><tr><th>Month</th><th>Source</th><th>Amount</th><th></th></tr></thead><tbody>${history.map(i=>`<tr><td>${mlabel(i.month)}</td><td>${i.source||'—'}</td><td class="td-m">${RM(i.amount)}</td><td><button class="btn btn-sm btn-d" onclick="delIncome('${i.id}')">Delete</button></td></tr>`).join('')}</tbody></table>`
    :'<div class="empty"><div style="font-size:15px;margin-bottom:6px;">No income logged yet</div><div style="font-size:12px;">Log your income to auto-split it across your vaults.</div></div>';
}

// ─── ALLOCATION MODAL STATE ───────────────────────────────────────
let _allocModalCb=null,_allocModalData=null,_allocModalIncome=0;

function _allocModalSum(){
  const alloc=_allocModalData;if(!alloc)return;
  let total=0;
  (alloc.fixed||[]).forEach(fc=>{const el=document.getElementById('alloc-f-'+fc.id);if(el)total+=parseFloat(el.value)||0;});
  (alloc.pct||[]).forEach(f=>{const el=document.getElementById('alloc-p-'+f.id);if(el)total+=parseFloat(el.value)||0;});
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

  if((defaultAlloc.fixed||[]).length){
    rows+=`<div style="${secStyle}">Fixed deductions</div>`;
    defaultAlloc.fixed.forEach(fc=>{
      rows+=`<div style="${rowStyle}">
        <div style="flex:1;font-size:13px;">${fc.name}<div style="${subStyle}">Fixed deduction</div></div>
        <input type="number" id="alloc-f-${fc.id}" value="${fc.amount}" min="0" step="0.01" oninput="_allocModalSum()" style="${iStyle}" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
      </div>`;
    });
  }

  if((defaultAlloc.pct||[]).length){
    rows+=`<div style="${secStyle}">Percentage allocation</div>`;
    defaultAlloc.pct.forEach(f=>{
      rows+=`<div style="${rowStyle}">
        <div style="flex:1;font-size:13px;">${f.name}<div style="${subStyle}">${f.pct}% of remainder</div></div>
        <input type="number" id="alloc-p-${f.id}" value="${f.amount}" min="0" step="0.01" oninput="_allocModalSum()" style="${iStyle}" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
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
    fixed:(alloc.fixed||[]).map(fc=>({...fc,amount:parseFloat(document.getElementById('alloc-f-'+fc.id)?.value)||0})),
    pct:(alloc.pct||[]).map(f=>({...f,amount:parseFloat(document.getElementById('alloc-p-'+f.id)?.value)||0}))
  };
  const total=Math.round([...committed.fixed,...committed.pct].reduce((s,x)=>s+x.amount,0)*100)/100;
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
function _processIncome(id,month,src,alloc){
  const today=new Date().toISOString().slice(0,10);
  const reason=(src||'Income')+' — '+mlabel(month);
  [...(alloc.fixed||[]),...(alloc.pct||[])].forEach(({id:vid,amount})=>{
    if(!amount)return;
    const v=(DB.vaults||[]).find(x=>x.id===vid);if(!v)return;
    if(!v.deposits)v.deposits=[];
    v.deposits.push({id:uid(),type:'deposit',reason,amount,date:today,incomeId:id,source:'income'});
    v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
  });
  const rec=(DB.income||[]).find(i=>i.id===id);
  if(rec)rec._alloc={fixed:alloc.fixed,pct:alloc.pct};
}

function addIncome(){
  const month=document.getElementById('incM').value;
  const src=document.getElementById('incSrc').value.trim();
  const amt=parseFloat(document.getElementById('incAmt').value);
  if(!month||!amt)return;

  const fixedVaults=_activeFixedVaults();
  const pctVaults=_activePctVaults();
  const totalFixed=fixedVaults.reduce((s,v)=>s+v.fixedAmount,0);

  if(amt<totalFixed){
    _showShortfallModal(month,src,amt,fixedVaults,pctVaults,totalFixed);
    return;
  }

  const remainder=Math.max(0,amt-totalFixed);

  // Compute percentage amounts with explicit rounding correction on last item
  const rawAmts=pctVaults.map(v=>Math.round(remainder*v.pct/100));
  const pctSum=rawAmts.reduce((s,a)=>s+a,0);
  const diff=Math.round((remainder-pctSum)*100)/100;
  if(rawAmts.length>0)rawAmts[rawAmts.length-1]=Math.round((rawAmts[rawAmts.length-1]+diff)*100)/100;

  const defaultAlloc={
    fixed:fixedVaults.map(v=>({id:v.id,name:v.name,amount:v.fixedAmount})),
    pct:pctVaults.map((v,i)=>({id:v.id,name:v.name,pct:v.pct,amount:rawAmts[i]||0}))
  };

  showAllocModal({month,src,amt},defaultAlloc,(committed)=>{
    const id=uid();
    DB.income.push({id,month,source:src||'Income',amount:amt});
    _processIncome(id,month,src,committed);
    save();toast('Income logged & vaults updated');renderIncome();
    if(typeof renderDashboard==='function')renderDashboard();
    document.getElementById('incAmt').value='';document.getElementById('incSrc').value='';
  });
}

function delIncome(id){
  const i=(DB.income||[]).find(x=>x.id==id);if(!i)return;
  // Remove all deposits created by this income event from every vault
  (DB.vaults||[]).forEach(v=>{
    if(!v.deposits)return;
    v.deposits=v.deposits.filter(d=>d.incomeId!==id);
    v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
  });
  DB.income=DB.income.filter(x=>x.id!==id);
  trashIt('income',i,()=>{});
  save();toast('Moved to bin');renderIncome();renderDashboard();
}

// ─── SHORTFALL MODAL ──────────────────────────────────────────────
let _splitRows=[];
let _sfModalData=null;

function _showShortfallModal(month,src,amt,fixedVaults,pctVaults,totalFixed){
  _splitRows=[{vaultId:'',amount:0}];
  _sfModalData={month,src,amt,fixedVaults,pctVaults};

  const overlay=document.createElement('div');
  overlay.id='shortfallOverlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;';

  overlay.innerHTML=`<div class="card" style="max-width:500px;width:100%;padding:22px;max-height:90vh;overflow-y:auto;">
    <div style="font-size:14px;font-weight:600;margin-bottom:6px;">${RM(amt)} is below this month's fixed deductions (${RM(totalFixed)}).</div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:18px;">Auto-allocation would leave most vaults underfunded. What do you want to do?</div>

    <label style="display:flex;align-items:flex-start;gap:10px;margin-bottom:14px;cursor:pointer;">
      <input type="radio" name="sfOpt" value="split" checked style="margin-top:3px;flex-shrink:0;" onchange="_sfOptChange()"/>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;margin-bottom:8px;">Deposit to vaults</div>
        <div id="splitForm" style="background:var(--bg);border:1px solid var(--border);border-radius:var(--r-sm);padding:10px;">
          <div id="splitRows"></div>
          <button class="btn btn-sm" style="margin-top:6px;" onclick="_splitModalAddRow()">+ Add another vault</button>
          <div style="margin-top:10px;font-size:12px;font-family:'DM Mono',monospace;">
            Allocated: <span id="sfAllocated" style="color:var(--danger);">${RM(0)}</span> of ${RM(amt)}
            &nbsp;·&nbsp; Remaining: <span id="sfRemaining">${RM(amt)}</span>
          </div>
          <div id="sfErr" style="font-size:11px;color:var(--danger);margin-top:4px;display:none;"></div>
        </div>
      </div>
    </label>

    <label style="display:flex;align-items:center;gap:10px;margin-bottom:22px;cursor:pointer;">
      <input type="radio" name="sfOpt" value="anyway" style="flex-shrink:0;" onchange="_sfOptChange()"/>
      <div style="font-size:13px;">Log as income anyway <span style="color:var(--muted);font-size:12px;">(run normal allocation)</span></div>
    </label>

    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-sm" onclick="_sfCancel()">Cancel</button>
      <button id="sfConfirmBtn" class="btn btn-sm edit-save-btn" disabled onclick="_sfConfirm()">Confirm</button>
    </div>
  </div>`;

  document.body.appendChild(overlay);
  _splitModalRerender();
  _splitModalUpdate();
}

function _sfOptChange(){
  const opt=document.querySelector('input[name="sfOpt"]:checked')?.value;
  const form=document.getElementById('splitForm');
  if(form)form.style.display=opt==='split'?'':'none';
  const btn=document.getElementById('sfConfirmBtn');
  if(opt==='anyway'){if(btn)btn.disabled=false;}
  else _splitModalUpdate();
}

function _sfCancel(){
  document.getElementById('shortfallOverlay')?.remove();
  _splitRows=[];_sfModalData=null;
}

function _splitModalRerender(){
  const pickedIds=_splitRows.map(r=>r.vaultId).filter(Boolean);
  const vaults=(DB.vaults||[]).filter(v=>!v.archived);
  const ss='padding:6px 8px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;flex:1;min-width:0;';
  const is='width:90px;padding:6px 8px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;font-family:\'DM Mono\',monospace;outline:none;flex-shrink:0;';
  const rowsHtml=_splitRows.map((row,i)=>{
    const opts=vaults.map(v=>{
      const dis=pickedIds.includes(v.id)&&v.id!==row.vaultId;
      return`<option value="${v.id}"${v.id===row.vaultId?' selected':''}${dis?' disabled':''}>${v.name} (${RM(v.current)})</option>`;
    }).join('');
    return`<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
      <select style="${ss}" onchange="_splitModalVaultChange(${i},this.value)"><option value="">— pick vault —</option>${opts}</select>
      <input type="number" value="${row.amount||''}" placeholder="0" min="0" step="0.01" style="${is}" oninput="_splitModalAmtChange(${i},this.value)"/>
      ${_splitRows.length>1?`<button class="btn btn-sm btn-d" onclick="_splitModalRemoveRow(${i})" style="padding:4px 8px;flex-shrink:0;">×</button>`:'<div style="width:32px;"></div>'}
    </div>`;
  }).join('');
  const el=document.getElementById('splitRows');
  if(el)el.innerHTML=rowsHtml;
}

function _splitModalUpdate(){
  const data=_sfModalData;if(!data)return;
  const total=Math.round(_splitRows.reduce((s,r)=>s+(parseFloat(r.amount)||0),0)*100)/100;
  const remaining=Math.round((data.amt-total)*100)/100;
  const ok=Math.abs(total-data.amt)<0.01&&_splitRows.some(r=>parseFloat(r.amount)>0&&r.vaultId);
  const aEl=document.getElementById('sfAllocated');
  const rEl=document.getElementById('sfRemaining');
  const eEl=document.getElementById('sfErr');
  const btn=document.getElementById('sfConfirmBtn');
  if(aEl){aEl.textContent=RM(total);aEl.style.color=ok?'var(--accent)':total>0?'var(--danger)':'var(--muted)';}
  if(rEl){rEl.textContent=RM(Math.abs(remaining));rEl.style.color=remaining===0?'var(--accent)':remaining<0?'var(--danger)':'var(--text)';}
  if(eEl){
    if(!ok&&total>0){
      const diff=Math.round((total-data.amt)*100)/100;
      eEl.textContent='Amounts must sum to '+RM(data.amt)+(diff>0?' ('+RM(diff)+' over)':' ('+RM(-diff)+' short)');
      eEl.style.display='';
    }else{eEl.style.display='none';}
  }
  if(btn)btn.disabled=!ok;
}

function _splitModalAddRow(){_splitRows.push({vaultId:'',amount:0});_splitModalRerender();_splitModalUpdate();}
function _splitModalRemoveRow(i){_splitRows.splice(i,1);_splitModalRerender();_splitModalUpdate();}
function _splitModalVaultChange(i,vid){_splitRows[i].vaultId=vid;_splitModalRerender();_splitModalUpdate();}
function _splitModalAmtChange(i,val){_splitRows[i].amount=parseFloat(val)||0;_splitModalUpdate();}

function _sfConfirm(){
  const data=_sfModalData;if(!data)return;
  const opt=document.querySelector('input[name="sfOpt"]:checked')?.value;

  if(opt==='split'){
    const today=new Date().toISOString().slice(0,10);
    const rows=_splitRows.filter(r=>r.vaultId&&parseFloat(r.amount)>0);
    if(!rows.length)return;
    rows.forEach(r=>{
      const v=(DB.vaults||[]).find(x=>x.id===r.vaultId);if(!v)return;
      v.deposits.push({id:uid(),type:'deposit',reason:(data.src||'Income')+' (split deposit)',amount:parseFloat(r.amount),date:today,source:'income-redirect'});
      v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
    });
    save();
    const label=rows.length===1
      ?`Deposited ${RM(data.amt)} to ${(DB.vaults||[]).find(x=>x.id===rows[0].vaultId)?.name||'vault'}`
      :`Distributed ${RM(data.amt)} across ${rows.length} vaults`;
    toast(label);
    _sfCancel();
    renderIncome();renderDashboard();
    document.getElementById('incAmt').value='';document.getElementById('incSrc').value='';
  } else {
    // Log anyway — normal allocation path
    const {month,src,amt,fixedVaults,pctVaults}=data;
    const totalFixed=fixedVaults.reduce((s,v)=>s+v.fixedAmount,0);
    const remainder=Math.max(0,amt-totalFixed);
    const rawAmts=pctVaults.map(v=>Math.round(remainder*v.pct/100));
    const pctSum=rawAmts.reduce((s,a)=>s+a,0);
    const diff=Math.round((remainder-pctSum)*100)/100;
    if(rawAmts.length>0)rawAmts[rawAmts.length-1]=Math.round((rawAmts[rawAmts.length-1]+diff)*100)/100;
    const defaultAlloc={
      fixed:fixedVaults.map(v=>({id:v.id,name:v.name,amount:v.fixedAmount})),
      pct:pctVaults.map((v,i)=>({id:v.id,name:v.name,pct:v.pct,amount:rawAmts[i]||0}))
    };
    _sfCancel();
    showAllocModal({month,src,amt},defaultAlloc,(committed)=>{
      const id=uid();
      DB.income.push({id,month,source:src||'Income',amount:amt});
      _processIncome(id,month,src,committed);
      save();toast('Income logged & vaults updated');renderIncome();
      if(typeof renderDashboard==='function')renderDashboard();
      document.getElementById('incAmt').value='';document.getElementById('incSrc').value='';
    });
  }
}

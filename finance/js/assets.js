// ─── ASSETS ──────────────────────────────────────────────────────
function renderAssets(){
  const pg=document.getElementById('page-assets');
  if(!pg)return;

  const assets=DB.assets||[];
  const active=assets.filter(a=>!a.archived);
  const archived=assets.filter(a=>a.archived);

  const totalInvested=active.reduce((s,a)=>s+assetTotalInvested(a),0);
  const totalReturned=active.reduce((s,a)=>s+assetTotalReturned(a),0);
  const totalNet=totalReturned-totalInvested;
  const netPct=totalInvested>0?Math.round(totalNet/totalInvested*1000)/10:0;
  const netColor=totalNet>0?'var(--accent)':totalNet<0?'var(--danger)':'var(--muted)';

  const inputStyle=`width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;`;
  const monoInput=inputStyle+`font-family:'DM Mono',monospace;`;
  const ss=`width:100%;padding:7px 8px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text);font-size:13px;outline:none;`;
  const ssm=ss+`font-family:'DM Mono',monospace;`;

  function vaultOptsFor(selectedId){
    return(DB.vaults||[]).filter(v=>!v.archived).map(v=>`<option value="${v.id}"${v.id===(selectedId||'invest')?' selected':''}>${v.name} (${RM(v.current)})</option>`).join('');
  }

  const menuStyle=`position:absolute;top:34px;right:0;z-index:100;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);min-width:140px;box-shadow:0 4px 16px rgba(0,0,0,.12);padding:4px 0;`;
  const menuItemStyle=`display:block;width:100%;text-align:left;padding:7px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);`;

  const today=new Date().toISOString().slice(0,10);

  const activeCards=active.length?active.map(a=>{
    const invested=assetTotalInvested(a);
    const returned=assetTotalReturned(a);
    const net=assetNet(a);
    const netPctA=invested>0?Math.round(net/invested*1000)/10:0;
    const netColorA=net>0?'var(--accent)':net<0?'var(--danger)':'var(--muted)';

    const ledger=(a.ledger||[]).slice().sort((x,y)=>y.date.localeCompare(x.date));
    const ledgerRows=ledger.map(e=>{
      const v=vaultById(e.vaultId);
      return`<tr>
        <td class="td-m" style="color:var(--muted);">${e.date||''}</td>
        <td><span style="font-size:11px;padding:2px 7px;border-radius:20px;background:${e.type==='investment'?'var(--warn-l)':'var(--accent-l)'};color:${e.type==='investment'?'var(--warn)':'var(--accent)'};">${e.type==='investment'?'Investment':'Return'}</span></td>
        <td class="td-m" style="font-family:'DM Mono',monospace;">${RM(e.amount)}</td>
        <td class="td-m">${v?v.name:'—'}</td>
        <td style="color:var(--muted);font-size:12px;">${e.note||'—'}</td>
        <td><button class="btn btn-xs btn-d" onclick="delAssetLedgerEntry('${a.id}','${e.id}')">Del</button></td>
      </tr>`;
    }).join('');

    const ledgerHtml=ledger.length?`<div style="overflow-x:auto;margin-top:8px;border:1px solid var(--border);border-radius:var(--r-sm);">
      <table style="font-size:12px;"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Vault</th><th>Note</th><th></th></tr></thead>
      <tbody>${ledgerRows}</tbody></table></div>`:
      `<div style="font-size:12px;color:var(--muted);margin-top:6px;">No entries yet.</div>`;

    return`<div class="card" style="margin-bottom:12px;position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <div style="font-size:15px;font-weight:600;">${a.name}</div>
        <div style="position:relative;flex-shrink:0;margin-left:8px;">
          <button class="btn btn-sm" onclick="event.stopPropagation();toggleAssetMenu('${a.id}')" style="padding:4px 9px;font-size:15px;line-height:1;">⋯</button>
          <div id="amenu-${a.id}" class="asset-menu" style="display:none;${menuStyle}">
            <button style="${menuItemStyle}" onclick="editAssetMeta('${a.id}');closeAssetMenus()">Edit name/notes</button>
            <button style="${menuItemStyle}" onclick="archiveAsset('${a.id}');closeAssetMenus()">Archive</button>
            <button style="${menuItemStyle}color:var(--danger);" onclick="delAsset('${a.id}');closeAssetMenus()">Delete</button>
          </div>
        </div>
      </div>
      ${a.notes?`<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${a.notes}</div>`:''}
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:10px;">
        <div><div style="font-size:11px;color:var(--muted);">Invested</div><div style="font-size:14px;font-weight:600;font-family:'DM Mono',monospace;">${RM(invested)}</div></div>
        <div><div style="font-size:11px;color:var(--muted);">Returned</div><div style="font-size:14px;font-weight:600;font-family:'DM Mono',monospace;">${RM(returned)}</div></div>
        <div><div style="font-size:11px;color:var(--muted);">Net</div><div style="font-size:14px;font-weight:600;font-family:'DM Mono',monospace;color:${netColorA};">${net>=0?'+':''}${RM(net)} (${invested>0?(netPctA>=0?'+':'')+netPctA+'%':'—'})</div></div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <button class="btn btn-sm edit-save-btn" onclick="toggleAssetForm('${a.id}','investment')">+ Add investment</button>
        <button class="btn btn-sm" style="color:var(--accent);border-color:var(--accent);" onclick="toggleAssetForm('${a.id}','return')">+ Add return</button>
      </div>

      <div id="aform-inv-${a.id}" style="display:none;margin-bottom:8px;padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border);">
        <div style="font-size:12px;font-weight:500;margin-bottom:8px;">Add investment</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Amount (RM)</div>
          <input type="number" id="ainv-amt-${a.id}" placeholder="0" style="${ssm}border:1.5px solid var(--border);"/></div>
          <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Date</div>
          <input type="date" id="ainv-date-${a.id}" value="${today}" style="${ss}"/></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Note</div>
          <input type="text" id="ainv-note-${a.id}" placeholder="Optional" style="${ss}"/></div>
          <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Source vault</div>
          <select id="ainv-vault-${a.id}" style="${ss}">${vaultOptsFor('invest')}</select></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:6px;">
          <button class="btn btn-sm" onclick="toggleAssetForm('${a.id}','investment')">Cancel</button>
          <button class="btn btn-sm edit-save-btn" onclick="saveAssetEntry('${a.id}','investment')">Save</button>
        </div>
      </div>

      <div id="aform-ret-${a.id}" style="display:none;margin-bottom:8px;padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--accent);">
        <div style="font-size:12px;font-weight:500;margin-bottom:8px;">Add return</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Amount (RM)</div>
          <input type="number" id="aret-amt-${a.id}" placeholder="0" style="${ssm}border:1.5px solid var(--accent);"/></div>
          <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Date</div>
          <input type="date" id="aret-date-${a.id}" value="${today}" style="${ss}"/></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Note</div>
          <input type="text" id="aret-note-${a.id}" placeholder="Optional" style="${ss}"/></div>
          <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Destination vault</div>
          <select id="aret-vault-${a.id}" style="${ss}">${vaultOptsFor('invest')}</select></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:6px;">
          <button class="btn btn-sm" onclick="toggleAssetForm('${a.id}','return')">Cancel</button>
          <button class="btn btn-sm edit-save-btn" onclick="saveAssetEntry('${a.id}','return')">Save</button>
        </div>
      </div>

      <details style="margin-top:4px;">
        <summary style="list-style:none;cursor:pointer;font-size:12px;color:var(--accent);user-select:none;outline:none;">▸ Ledger (${(a.ledger||[]).length} ${(a.ledger||[]).length===1?'entry':'entries'})</summary>
        ${ledgerHtml}
      </details>
    </div>`;
  }).join(''):
  `<div class="empty">No active assets. Add one below.</div>`;

  const archivedHtml=archived.length?`
  <details style="margin-top:16px;">
    <summary style="cursor:pointer;font-size:13px;font-weight:500;color:var(--muted);padding:8px 0;list-style:none;outline:none;">Archived assets (${archived.length})</summary>
    <div style="margin-top:8px;">
      ${archived.map(a=>{
        const invested=assetTotalInvested(a);
        const returned=assetTotalReturned(a);
        const net=assetNet(a);
        return`<div class="card card-sm" style="margin-bottom:8px;opacity:.75;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-size:13px;font-weight:500;">${a.name}</div>
            <div style="font-size:12px;color:var(--muted);">Invested ${RM(invested)} · Returned ${RM(returned)} · Net ${net>=0?'+':''}${RM(net)}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm" onclick="unarchiveAsset('${a.id}')">Unarchive</button>
            <button class="btn btn-sm btn-d" onclick="delAsset('${a.id}')">Delete</button>
          </div>
        </div>`;
      }).join('')}
    </div>
  </details>`:'';

  pg.innerHTML=`
  <div class="sh">Assets</div>

  <div class="card" style="margin-bottom:16px;">
    <div class="inst-card-title">Overview</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <div class="stat" style="flex:1;min-width:120px;"><div class="stat-lbl">Active assets</div><div class="stat-val">${active.length}</div></div>
      <div class="stat" style="flex:1;min-width:120px;"><div class="stat-lbl">Total invested</div><div class="stat-val">${RM(totalInvested)}</div></div>
      <div class="stat" style="flex:1;min-width:120px;"><div class="stat-lbl">Total returned</div><div class="stat-val">${RM(totalReturned)}</div></div>
      <div class="stat" style="flex:1;min-width:120px;"><div class="stat-lbl">Net</div><div class="stat-val" style="color:${netColor};">${totalNet>=0?'+':''}${RM(totalNet)} (${totalInvested>0?(netPct>=0?'+':'')+netPct+'%':'—'})</div></div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px;">
    ${activeCards}
    ${archivedHtml}
  </div>

  <div class="card">
    <div class="inst-card-title">Add new asset</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
      <div>
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Asset name</div>
        <input id="asName" placeholder="e.g. Durian Puff Business" style="${inputStyle}"/>
      </div>
      <div>
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Initial amount (RM)</div>
        <input type="number" id="asAmt" placeholder="0.00" style="${monoInput}"/>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
      <div>
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Date</div>
        <input type="date" id="asDate" value="${today}" style="${inputStyle}"/>
      </div>
      <div>
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Source vault</div>
        <select id="asSrc" style="${inputStyle}">${vaultOptsFor('invest')}</select>
      </div>
    </div>
    <div style="margin-bottom:14px;">
      <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Notes (optional)</div>
      <textarea id="asNotes" rows="2" placeholder="Any details..." style="${inputStyle}resize:vertical;"></textarea>
    </div>
    <button class="btn btn-p" onclick="addAsset()">Add asset</button>
  </div>`;
}

function toggleAssetMenu(aid){
  document.querySelectorAll('.asset-menu').forEach(m=>{if(m.id!=='amenu-'+aid)m.style.display='none';});
  const m=document.getElementById('amenu-'+aid);
  if(!m)return;
  const wasOpen=m.style.display==='block';
  m.style.display=wasOpen?'none':'block';
  if(!wasOpen)setTimeout(()=>document.addEventListener('click',closeAssetMenus,{once:true}),0);
}
function closeAssetMenus(){document.querySelectorAll('.asset-menu').forEach(m=>{m.style.display='none';});}

function toggleAssetForm(aid,type){
  const inv=document.getElementById('aform-inv-'+aid);
  const ret=document.getElementById('aform-ret-'+aid);
  if(type==='investment'&&inv){
    const show=inv.style.display==='none'||inv.style.display==='';
    inv.style.display=show?'block':'none';
    if(ret)ret.style.display='none';
  }else if(type==='return'&&ret){
    const show=ret.style.display==='none'||ret.style.display==='';
    ret.style.display=show?'block':'none';
    if(inv)inv.style.display='none';
  }
}

function saveAssetEntry(aid,type){
  const a=(DB.assets||[]).find(x=>x.id===aid);
  if(!a)return;
  const isInv=type==='investment';
  const pfx=isInv?'ainv':'aret';
  const amount=parseFloat(document.getElementById(pfx+'-amt-'+aid)?.value)||0;
  const date=document.getElementById(pfx+'-date-'+aid)?.value||new Date().toISOString().slice(0,10);
  const note=(document.getElementById(pfx+'-note-'+aid)?.value||'').trim();
  const vaultId=document.getElementById(pfx+'-vault-'+aid)?.value||'invest';

  if(amount<=0){toast('Amount must be greater than 0');return;}
  const vault=vaultById(vaultId);
  if(!vault){toast('Vault not found');return;}

  if(isInv){
    if(amount>vault.current){toast('Insufficient balance in '+vault.name+' ('+RM(vault.current)+')');return;}
    vault.deposits.push({id:uid(),type:'withdrawal',reason:'Asset investment: '+a.name,amount,date,source:'asset-investment'});
  }else{
    vault.deposits.push({id:uid(),type:'deposit',reason:'Asset return: '+a.name,amount,date,source:'asset-return'});
  }
  _recomputeV(vault);

  if(!a.ledger)a.ledger=[];
  a.ledger.push({id:uid(),type:isInv?'investment':'return',amount,date,note,vaultId});
  save();toast(isInv?'Investment recorded':'Return recorded');renderAssets();renderDashboard();
}

function editAssetMeta(aid){
  const a=(DB.assets||[]).find(x=>x.id===aid);
  if(!a)return;
  const name=prompt('Asset name:',a.name);
  if(name===null)return;
  if(!name.trim()){toast('Name cannot be empty');return;}
  a.name=name.trim();
  const notes=prompt('Notes (optional):',a.notes||'');
  if(notes!==null)a.notes=notes.trim();
  save();toast('Updated');renderAssets();
}

function archiveAsset(aid){
  const a=(DB.assets||[]).find(x=>x.id===aid);
  if(!a)return;
  a.archived=true;
  save();toast(a.name+' archived');renderAssets();renderDashboard();
}

function unarchiveAsset(aid){
  const a=(DB.assets||[]).find(x=>x.id===aid);
  if(!a)return;
  a.archived=false;
  save();toast(a.name+' unarchived');renderAssets();renderDashboard();
}

function delAssetLedgerEntry(aid,eid){
  const a=(DB.assets||[]).find(x=>x.id===aid);
  if(!a)return;
  const entry=(a.ledger||[]).find(e=>e.id===eid);
  if(!entry)return;
  const isInv=entry.type==='investment';
  const vault=vaultById(entry.vaultId);

  // Reversing a return removes money from vault — verify sufficient balance
  if(!isInv&&vault&&vault.current<entry.amount){
    toast('Cannot reverse: '+vault.name+' only has '+RM(vault.current));return;
  }

  showConfirm(
    'Reverse this entry?',
    `Reverse this ${RM(entry.amount)} ${entry.type} and remove the entry?`,
    ()=>{
      if(vault){
        if(isInv){
          vault.deposits.push({id:uid(),type:'deposit',reason:'Reverse: '+a.name+' investment',amount:entry.amount,date:new Date().toISOString().slice(0,10),source:'asset-reverse'});
        }else{
          vault.deposits.push({id:uid(),type:'withdrawal',reason:'Reverse: '+a.name+' return',amount:entry.amount,date:new Date().toISOString().slice(0,10),source:'asset-reverse'});
        }
        _recomputeV(vault);
      }
      a.ledger=a.ledger.filter(e=>e.id!==eid);
      save();toast('Entry reversed');renderAssets();renderDashboard();
    }
  );
}

function addAsset(){
  const name=(document.getElementById('asName')?.value||'').trim();
  const amt=parseFloat(document.getElementById('asAmt')?.value)||0;
  const date=document.getElementById('asDate')?.value||new Date().toISOString().slice(0,10);
  const srcId=document.getElementById('asSrc')?.value;
  const notes=(document.getElementById('asNotes')?.value||'').trim();

  if(!name){toast('Asset name required');return;}
  if(amt<=0){toast('Amount must be greater than 0');return;}
  const srcV=vaultById(srcId);
  if(!srcV){toast('Source vault not found');return;}
  if(amt>srcV.current){toast('Not enough in '+srcV.name+' ('+RM(srcV.current)+')');return;}

  const asset={id:uid(),name,notes,archived:false,createdDate:date,ledger:[]};
  asset.ledger.push({id:uid(),type:'investment',amount:amt,date,note:'Initial investment',vaultId:srcId});

  srcV.deposits.push({id:uid(),type:'withdrawal',reason:'Asset investment: '+name,amount:amt,date,source:'asset-investment'});
  _recomputeV(srcV);

  if(!DB.assets)DB.assets=[];
  DB.assets.push(asset);
  save();toast('Asset added');renderAssets();renderDashboard();
}

// Deleting an asset reverses every ledger entry so vault balances stay consistent.
function delAsset(id){
  const a=(DB.assets||[]).find(x=>x.id===id);
  if(!a)return;
  showConfirm('Delete asset?','All vault transactions will be reversed. Asset moves to recycle bin.',()=>{
    (a.ledger||[]).forEach(e=>{
      const vault=vaultById(e.vaultId);
      if(!vault)return;
      if(e.type==='investment'){
        vault.deposits.push({id:uid(),type:'deposit',reason:'Reverse: '+a.name+' investment',amount:e.amount,date:new Date().toISOString().slice(0,10),source:'asset-reverse'});
      }else{
        vault.deposits.push({id:uid(),type:'withdrawal',reason:'Reverse: '+a.name+' return',amount:e.amount,date:new Date().toISOString().slice(0,10),source:'asset-reverse'});
      }
      _recomputeV(vault);
    });
    trashIt('asset',a,()=>{});
    DB.assets=DB.assets.filter(x=>x.id!==id);
    save();toast('Asset deleted');renderAssets();renderDashboard();
  });
}

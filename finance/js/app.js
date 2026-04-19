// ─── NAVIGATION ──────────────────────────────────────────────────
function go(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>{if(n.getAttribute('onclick')&&n.getAttribute('onclick').includes("'"+id+"'"))n.classList.add('active');});
  renders[id]&&renders[id]();
  try{localStorage.setItem('finOS_page',id);}catch(e){}
}

// ─── POPULATE SELECTS ─────────────────────────────────────────────
function populateFundSelects(){
  ['expF','tfFrom','tfTo','fFund'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    const prev=el.value;
    const isFilter=id==='fFund';
    const isExpense=id==='expF';
    // For expense entry: only FCs without vaultId, only spending vaults
    // For filter: show all FCs and all vaults (to filter historical records)
    const expenseFCs=DB.fixedCosts.filter(fc=>!fc.vaultId);
    const expenseVaults=DB.vaults.filter(v=>v.type==='spending');
    el.innerHTML=(isFilter?'<option value="all">All funds</option>':'')+
      DB.funds.map(f=>`<option value="${f.id}">${f.name}</option>`).join('')+
      (isFilter?DB.fixedCosts.map(fc=>`<option value="${fc.id}">${fc.label}</option>`).join(''):'')+
      (isExpense?`<optgroup label="── Fixed costs ──">${expenseFCs.map(fc=>`<option value="${fc.id}">${fc.label}</option>`).join('')}</optgroup>`:'')+
      (isFilter?DB.vaults.map(v=>`<option value="vault:${v.id}">Vault: ${v.name}</option>`).join(''):'')+
      (isExpense?`<optgroup label="── Vaults ──">${expenseVaults.map(v=>`<option value="vault:${v.id}">Vault: ${v.name}</option>`).join('')}</optgroup>`:'');
    if(prev)el.value=prev;
  });
}

// ─── EXPORT / IMPORT ─────────────────────────────────────────────
function exportData(){
  const blob=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='finance-os-'+cm()+'.json';a.click();toast('Exported!');
}
function importData(event){
  const file=event.target.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=e=>{try{DB=JSON.parse(e.target.result);save();toast('Imported!');go('dashboard');}catch{toast('Import failed');}};
  r.readAsText(file);event.target.value='';
}

// ─── RENDER MAP ───────────────────────────────────────────────────
const renders={dashboard:renderDashboard,networth:renderNetworth,income:renderIncome,expenses:renderExpenses,vaults:renderVaults,claims:renderClaims,notmine:renderNotmine,settings:renderSettings,bin:renderBin};

// ─── MODAL ────────────────────────────────────────────────────────
let _modalCb=null;
function showConfirm(title,body,cb,danger=false,confirmText=null){
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalBody').textContent=body;
  document.getElementById('confirmModal').classList.add('show');
  const btn=document.getElementById('modalConfirmBtn');
  if(confirmText){btn.textContent=confirmText;btn.className='btn';}
  else{btn.textContent=danger?'Delete everything':'Delete';btn.className=danger?'btn btn-d':'btn btn-d';}
  _modalCb=cb;
}
function modalConfirm(){
  document.getElementById('confirmModal').classList.remove('show');
  if(_modalCb){_modalCb();_modalCb=null;}
}
function modalCancel(){
  document.getElementById('confirmModal').classList.remove('show');
  _modalCb=null;
}
// Close on overlay click
document.getElementById('confirmModal').addEventListener('click',function(e){if(e.target===this)modalCancel();});
document.getElementById('allocModal').addEventListener('click',function(e){if(e.target===this)allocModalCancel();});

// ─── INIT ─────────────────────────────────────────────────────────
document.getElementById('sideMonth').textContent=cm();
populateFundSelects();
gdInit();
updateBinCount();
gdHandleRedirect();
const _lastPage=localStorage.getItem('finOS_page')||'dashboard';
go(_lastPage);

// ─── NAVIGATION ──────────────────────────────────────────────────
function go(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pg=document.getElementById('page-'+id);
  if(!pg){console.warn('No page found: page-'+id);return;}
  pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>{if(n.getAttribute('onclick')&&n.getAttribute('onclick').includes("'"+id+"'"))n.classList.add('active');});
  renders[id]&&renders[id]();
  try{localStorage.setItem('finOS_page',id);}catch(e){}
}

// ─── POPULATE SELECTS ─────────────────────────────────────────────
function populateFundSelects(){
  ['expF','tfFrom','tfTo','fFund'].forEach(sid=>{
    const el=document.getElementById(sid);if(!el)return;
    const prev=el.value;
    const isFilter=sid==='fFund';
    const isExpense=sid==='expF';
    const vaults=(DB.vaults||[]).filter(v=>!v.archived);
    el.innerHTML=(isFilter?'<option value="all">All vaults</option>':'')+
      vaults.map(v=>{
        const dis=isExpense&&v.type==='savings'?'disabled title="Savings vault — use vault page to deposit/withdraw"':'';
        const hint=isExpense?(v.type==='savings'?' (savings)':' ('+RM(v.current)+')'):'';
        return`<option value="${v.id}" ${dis}>${v.name}${hint}</option>`;
      }).join('');
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
  r.onload=e=>{
    try{
      localStorage.setItem('finOS_v2',e.target.result);
      load(); // runs all migrations on the imported data
      save(); // persist post-migration state
      toast('Imported!');go('dashboard');
    }catch{toast('Import failed');}
  };
  r.readAsText(file);event.target.value='';
}

// ─── RENDER MAP ───────────────────────────────────────────────────
const renders={
  dashboard:renderDashboard,
  analytics:renderAnalytics,
  income:renderIncome,
  expenses:renderExpenses,
  vaults:renderVaults,
  assets:renderAssets,
  claims:renderClaims,
  notmine:renderNotmine,
  settings:renderSettings,
  bin:renderBin
};

// ─── MODAL ────────────────────────────────────────────────────────
let _modalCb=null;
function showConfirm(title,body,cb,danger=false,confirmText=null){
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalBody').textContent=body;
  document.getElementById('confirmModal').classList.add('show');
  const btn=document.getElementById('modalConfirmBtn');
  if(confirmText){btn.textContent=confirmText;btn.className='btn';}
  else{btn.textContent=danger?'Delete everything':'Delete';btn.className='btn btn-d';}
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

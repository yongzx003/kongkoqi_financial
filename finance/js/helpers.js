// ─── HELPERS ─────────────────────────────────────────────────────
function RM(n){return'RM '+Number(n).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});}
function cm(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
function mlabel(m){if(!m)return'';const[y,mo]=m.split('-');return new Date(y,mo-1,1).toLocaleString('default',{month:'long',year:'numeric'});}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}
function uid(){return crypto.randomUUID();}

// Primary vault lookup — searches unified DB.vaults array
function vaultById(id){return(DB.vaults||[]).find(v=>v.id===id);}
// Backward-compat alias used throughout the codebase
function fundById(id){return vaultById(id);}

function badgeStyle(color){
  const map={purple:'background:#EEEAF8;color:#4A3580',teal:'background:#E4F2EE;color:#1A6B5A',amber:'background:#FBF0DC;color:#7A4F10',info:'background:#E8EFF8;color:#1A4A7A',pink:'background:#F5E8EF;color:#8B3A5A',accent:'background:#E8F0EA;color:#2D5A3D',danger:'background:#FBEAE8;color:#C0392B',need:'background:#E8F0EA;color:#2D5A3D',skin:'background:#FDF3E3;color:#B7700D',want:'background:#F5E8EF;color:#8B3A5A'};
  return map[color]||map.info;
}
function badge(text,color){return`<span class="badge" style="${badgeStyle(color)}">${text}</span>`;}

function fundBadge(fid){const v=vaultById(fid);return v?badge(v.name,v.color):badge(fid,'info');}
// Backward-compat alias
function fcBadge(fid){return fundBadge(fid);}

function fundBalance(fid){return vaultById(fid)?.current||0;}
function vaultBalance(id){return fundById(id)?.current||0;}

function spentThisMonth(fid,month){
  month=month||cm();
  return(DB.expenses||[]).filter(e=>e.fund===fid&&e.month===month).reduce((s,e)=>s+e.amount,0);
}

// Monthly budget for a vault.
// Fixed: returns fixedAmount. Manual: returns 0.
// Percentage: uses this month's income; falls back to last month when none logged yet.
function monthlyBudget(vaultId){
  const v=fundById(vaultId);if(!v)return 0;
  if(v.fillMode==='fixed')return v.fixedAmount||0;
  if(v.fillMode==='manual')return 0;
  const thisIncome=(DB.income||[]).filter(i=>i.month===cm()).reduce((s,i)=>s+i.amount,0);
  const lastM=(()=>{const d=new Date();d.setMonth(d.getMonth()-1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');})();
  const lastIncome=(DB.income||[]).filter(i=>i.month===lastM).reduce((s,i)=>s+i.amount,0);
  const incomeBase=thisIncome||lastIncome||0;
  const totalFixed=(DB.vaults||[]).filter(x=>x.fillMode==='fixed'&&!x.archived&&!(x.target>0&&x.current>=x.target)).reduce((s,x)=>s+x.fixedAmount,0);
  const remainder=Math.max(0,incomeBase-totalFixed);
  return Math.round(remainder*v.pct/100);
}

function assetTotalInvested(a){return(a.ledger||[]).filter(e=>e.type==='investment').reduce((s,e)=>s+e.amount,0);}
function assetTotalReturned(a){return(a.ledger||[]).filter(e=>e.type==='return').reduce((s,e)=>s+e.amount,0);}
function assetNet(a){return assetTotalReturned(a)-assetTotalInvested(a);}

// Net worth = sum of all non-archived vault balances only.
// Once money is deployed into an asset it leaves the vault; returns flow back when recorded.
function totalNetWorth(){
  return(DB.vaults||[]).filter(v=>!v.archived).reduce((s,v)=>s+v.current,0);
}

function vaultStats(v){
  const deps=v.deposits||[];
  const totalDeposited=deps.filter(d=>d.type!=='withdrawal').reduce((s,d)=>s+Math.abs(d.amount),0);
  const totalUsed=deps.filter(d=>d.type==='withdrawal').reduce((s,d)=>s+Math.abs(d.amount),0);
  const current=deps.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
  const pct=v.target>0?Math.min(100,Math.round((v.type==='spending'?totalUsed:current)/v.target*100)):null;
  return{totalDeposited,totalUsed,current,pct};
}

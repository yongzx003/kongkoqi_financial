// ─── HELPERS ─────────────────────────────────────────────────────
function RM(n){return'RM '+Math.round(n).toLocaleString();}
function cm(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
function mlabel(m){if(!m)return'';const[y,mo]=m.split('-');return new Date(y,mo-1,1).toLocaleString('default',{month:'long',year:'numeric'});}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}
function uid(){return crypto.randomUUID();}
function fundById(id){return DB.funds.find(f=>f.id===id);}
function badgeStyle(color){
  const map={purple:'background:#EEEAF8;color:#4A3580',teal:'background:#E4F2EE;color:#1A6B5A',amber:'background:#FBF0DC;color:#7A4F10',info:'background:#E8EFF8;color:#1A4A7A',pink:'background:#F5E8EF;color:#8B3A5A',accent:'background:#E8F0EA;color:#2D5A3D',danger:'background:#FBEAE8;color:#C0392B',need:'background:#E8F0EA;color:#2D5A3D',skin:'background:#FDF3E3;color:#B7700D',want:'background:#F5E8EF;color:#8B3A5A'};
  return map[color]||map.info;
}
function badge(text,color){return`<span class="badge" style="${badgeStyle(color)}">${text}</span>`;}
function fundBadge(fid){const f=fundById(fid);return f?badge(f.name,f.color):badge(fid,'info');}
function fcBadge(fid){const fc=DB.fixedCosts.find(f=>f.id===fid);return fc?badge(fc.label,'need'):badge(fid,'need');}

// Fund balance = saved balance + rollover from prior months unspent
function fundBalance(fid){
  const f=fundById(fid);
  if(!f)return 0;
  return f.balance||0;
}
function spentThisMonth(fid,month){
  month=month||cm();
  return DB.expenses.filter(e=>e.fund===fid&&e.month===month).reduce((s,e)=>s+e.amount,0);
}
function monthlyBudget(fid){
  const f=fundById(fid);if(!f)return 0;
  const totalFixed=DB.fixedCosts.reduce((s,fc)=>s+fc.amount,0);
  const lastIncome=DB.income.filter(i=>i.month===cm()).reduce((s,i)=>s+i.amount,0)||0;
  const compulsory=Math.max(0,lastIncome-totalFixed);
  return Math.round(compulsory*f.pct/100);
}

function totalNetWorth(){
  return DB.vaults.reduce((s,v)=>s+v.current,0)+DB.funds.reduce((s,f)=>s+(f.balance||0),0);
}

function vaultStats(v){
  const deps=v.deposits||[];
  const totalDeposited=deps.filter(d=>d.type!=='withdrawal').reduce((s,d)=>s+Math.abs(d.amount),0);
  const totalUsed=deps.filter(d=>d.type==='withdrawal').reduce((s,d)=>s+Math.abs(d.amount),0);
  const current=deps.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
  const pct=v.target>0?Math.min(100,Math.round((v.type==='spending'?totalUsed:current)/v.target*100)):null;
  return{totalDeposited,totalUsed,current,pct};
}

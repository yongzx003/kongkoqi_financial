// ─── DEFAULT DATA ────────────────────────────────────────────────
const DEFAULT = {
  funds:[
    {id:'self',name:'Self-Investment',pct:30,color:'purple',rollover:true,rule:'Does this make me look better, feel more confident, or improve my physical wellbeing? If yes, spend it.',balance:464},
    {id:'know',name:'Knowledge & Skill',pct:30,color:'teal',rollover:true,rule:"Before buying, ask: 'Will I actually finish/use this within 30 days?' If yes, buy. If no, wait. Priority: 1) Directly applicable to current 试错 2) Improves freelance skill 3) General curiosity.",balance:608},
    {id:'try',name:'试错',pct:30,color:'amber',rollover:true,rule:"One experiment per month max. Before spending, write: 'I am testing whether ___.' Rollover: unused balance accumulates for bigger experiments.",balance:515},
    {id:'opp',name:'Opportunity',pct:10,color:'info',rollover:true,rule:'Never touch unless: (1) Cannot be funded elsewhere, (2) Missing it has real cost, (3) Slept on decision 3+ days.',balance:214},
  ],
  fixedCosts:[
    {id:'fc1',label:'Skin savings',amount:1000,vaultId:'v2'},
    {id:'fc2',label:'Needs',amount:625},
    {id:'fc3',label:'Wants',amount:125},
  ],
  income:[
    {id:1,month:'2026-01',source:'Freelance',amount:2250},
    {id:2,month:'2026-02',source:'Freelance',amount:2250},
    {id:3,month:'2026-02',source:'Angpow',amount:1070},
    {id:4,month:'2026-02',source:'Baba (weekly x4)',amount:1200},
    {id:5,month:'2026-03',source:'Freelance',amount:2250},
  ],
  expenses:[
    {id:1,name:'Atomic Habits',fund:'know',amount:15,date:'2026-02-18',month:'2026-02'},
    {id:2,name:'OpenRouter Token (OpenClaw)',fund:'try',amount:43,date:'2026-03-02',month:'2026-03'},
    {id:3,name:'OpenRouter Token (OpenClaw)',fund:'try',amount:84,date:'2026-03-02',month:'2026-03'},
    {id:4,name:'Never Eat Alone',fund:'know',amount:19,date:'2026-03-08',month:'2026-03'},
    {id:5,name:'Gym gloves',fund:'self',amount:24,date:'2026-03-13',month:'2026-03'},
    {id:6,name:'Skin Care & Eye Care products',fund:'self',amount:154,date:'2026-03-21',month:'2026-03'},
    {id:7,name:'Gym subscription',fund:'need',amount:98,date:'2026-03-03',month:'2026-03'},
    {id:8,name:'Nutrition',fund:'need',amount:57.5,date:'2026-03-11',month:'2026-03'},
    {id:9,name:'Nutrition (Chicken Breast)',fund:'need',amount:53,date:'2026-03-11',month:'2026-03'},
    {id:10,name:'Grab (Kakak Telipok)',fund:'need',amount:50,date:'2026-03-07',month:'2026-03'},
    {id:11,name:'Borenos (Belanja Harrey)',fund:'want',amount:25,date:'2026-03-15',month:'2026-03'},
    {id:12,name:'Eat 猪杂 & The Mom Test',fund:'want',amount:75,date:'2026-03-18',month:'2026-03'},
    {id:13,name:'Cut hair El Saloon',fund:'need',amount:40,date:'2026-03-20',month:'2026-03'},
    {id:14,name:'Grocer + nutrition',fund:'need',amount:120.8,date:'2026-03-21',month:'2026-03'},
    {id:15,name:'Car fuel',fund:'need',amount:50,date:'2026-03-21',month:'2026-03'},
    {id:16,name:'City mall parking',fund:'need',amount:2,date:'2026-03-21',month:'2026-03'},
    {id:17,name:'Lepak (water, parking, comb)',fund:'want',amount:25,date:'2026-03-22',month:'2026-03'},
    {id:18,name:'Kin Fah lunch',fund:'need',amount:17,date:'2026-03-08',month:'2026-03'},
  ],
  vaults:[
    {id:'v1',name:'Emergency fund',current:3600,target:3600,type:'savings',deposits:[{id:1,reason:'Goal reached',amount:3600,date:'2026-02-01'}]},
    {id:'v2',name:'Skin fund',current:4000,target:7000,type:'spending',goalLabel:'Session',deposits:[
      {id:1,reason:'First deposit',amount:1000,date:'2026-01-02'},
      {id:2,reason:'Second deposit',amount:1000,date:'2026-02-01'},
      {id:3,reason:'Third deposit',amount:1000,date:'2026-02-23'},
      {id:4,reason:'Fourth deposit',amount:1000,date:'2026-03-05'},
    ]},
  ],
  claims:[
    {id:1,name:'Car rental (TNG transfer)',from:'Zurich',amount:185,date:'2026-02-10',claimed:false},
    {id:2,name:'Pinjam for sis exam ticket change',from:'Harrey',amount:1000,date:'2026-03-03',claimed:false},
    {id:3,name:"Uncle's Trading License Renewal",from:'Uncle Vincent',amount:36,date:'2026-03-09',claimed:false},
  ],
  notmine:[
    {id:1,name:'DuriXVerse project (hardware)',for:'Uncle Vincent',total:1000,used:536.41,date:'2026-03-18',note:'Claim done, 1000 on hand. Waiting for Uncle decision.'},
    {id:2,name:'Cuckoo Salary',for:'Mami',total:9343,used:5000,date:'2026-01-01',note:'RM5000 sent to Mami. RM4343 left. Done.'},
  ],
  networth:[
    {month:'2026-01',amount:8350},
    {month:'2026-02',amount:9200},
    {month:'2026-03',amount:9740},
  ],
  transfers:[],
  closedMonths:[],
  trash:[],
};

// ─── STATE ───────────────────────────────────────────────────────
let DB;
function load(){
  try{
    const d=localStorage.getItem('finOS_v2');
    DB=d?JSON.parse(d):JSON.parse(JSON.stringify(DEFAULT));
  }catch(e){DB=JSON.parse(JSON.stringify(DEFAULT));}

  // Ensure required arrays/objects exist
  if(!DB.vaults)DB.vaults=[];
  if(!DB.expenses)DB.expenses=[];
  if(!DB.fixedCosts)DB.fixedCosts=[];
  if(!DB.funds)DB.funds=[];
  if(!DB._migrations)DB._migrations={};

  // ── Vault basics: deposits array + old withdrawals merge ────────
  DB.vaults.forEach(v=>{
    if(!v.deposits)v.deposits=[];
    if(v.withdrawals&&v.withdrawals.length){
      v.withdrawals.forEach(w=>{
        if(!v.deposits.find(d=>d.id===w.id))v.deposits.push({...w,type:'withdrawal'});
      });
      delete v.withdrawals;
    }
  });

  // ── Vault type migration: goalTracking bool → type string ───────
  DB.vaults.forEach(v=>{
    if(v.type===undefined){v.type=v.goalTracking?'spending':'savings';}
    delete v.goalTracking;
    v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
  });

  // ── Orphan expense remap: 'need'→fc2, 'want'→fc3 ───────────────
  if(!DB._migrations.orphanRemap){
    let remapped=0;
    const fc2=DB.fixedCosts.find(fc=>fc.id==='fc2');
    const fc3=DB.fixedCosts.find(fc=>fc.id==='fc3');
    DB.expenses.forEach(e=>{
      if(e.fund==='need'&&fc2){e.fund='fc2';remapped++;}
      else if(e.fund==='want'&&fc3){e.fund='fc3';remapped++;}
    });
    if(remapped)console.log('[Migration] Remapped '+remapped+' orphan expenses (need→fc2, want→fc3)');
    // Report any remaining orphans
    const validIds=new Set([
      ...DB.funds.map(f=>f.id),
      ...DB.fixedCosts.map(fc=>fc.id),
      ...DB.vaults.map(v=>'vault:'+v.id),
    ]);
    const orphans=DB.expenses.filter(e=>!validIds.has(e.fund)&&!String(e.fund||'').startsWith('vault:'));
    if(orphans.length)console.warn('[Migration] Remaining orphan expenses (not auto-fixed):',orphans.map(e=>({id:e.id,name:e.name,fund:e.fund})));
    DB._migrations.orphanRemap=true;
  }

  // ── skinVaultUnify: link vault-backed FCs, migrate expenses ─────
  if(!DB._migrations.skinVaultUnify){
    // Link fc1 → v2 if not already linked
    const fc1=DB.fixedCosts.find(fc=>fc.id==='fc1');
    const v2=DB.vaults.find(v=>v.id==='v2');
    if(fc1&&v2&&!fc1.vaultId){fc1.vaultId='v2';console.log('[Migration] Linked fc1 (Skin savings) → v2 (Skin fund)');}

    const fcWithVault=DB.fixedCosts.filter(fc=>fc.vaultId);
    fcWithVault.forEach(fc=>{
      const vault=DB.vaults.find(v=>v.id===fc.vaultId);
      if(!vault)return;
      const toConvert=DB.expenses.filter(e=>e.fund===fc.id);
      const total=toConvert.reduce((s,e)=>s+e.amount,0);
      console.log('[Migration] Converting '+toConvert.length+' expenses ('+RM(total)+') from '+fc.label+' → vault:'+vault.name);
      toConvert.forEach(e=>{
        e.fund='vault:'+fc.vaultId;
        e.vaultId=fc.vaultId;
        vault.deposits.push({id:uid(),type:'withdrawal',reason:e.name,amount:e.amount,date:e.date||new Date().toISOString().slice(0,10)});
      });
      vault.current=vault.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
      console.log('[Migration] '+vault.name+' new current: '+RM(vault.current));
      delete fc.balance;
    });

    // Sanity check: deposits - withdrawals = current for each spending vault
    DB.vaults.filter(v=>v.type==='spending').forEach(v=>{
      const deps=v.deposits||[];
      const totalDep=deps.filter(d=>d.type!=='withdrawal').reduce((s,d)=>s+Math.abs(d.amount),0);
      const totalWd=deps.filter(d=>d.type==='withdrawal').reduce((s,d)=>s+Math.abs(d.amount),0);
      const computed=totalDep-totalWd;
      const ok=Math.abs(computed-v.current)<0.01;
      console.log('[Sanity] '+v.name+': '+RM(totalDep)+' deposits - '+RM(totalWd)+' withdrawals = '+RM(computed)+' (stored: '+RM(v.current)+') '+(ok?'✓':'⚠ MISMATCH'));
    });

    DB._migrations.skinVaultUnify=true;
  }

  // ── claimedToInstallments: migrate boolean claimed flag → installment ──
  if(!DB._migrations.claimedToInstallments){
    (DB.claims||[]).forEach(c=>{
      if(c.claimed===true&&(!c.installments||!c.installments.length)){
        if(!c.installments)c.installments=[];
        c.installments.push({id:uid(),amount:c.amount,date:c.date||new Date().toISOString().slice(0,10),note:'Migrated from claimed flag'});
        c.claimed=false;
        console.log('[Migration] Converted claim "'+c.name+'" claimed flag → installment');
      }
    });
    DB._migrations.claimedToInstallments=true;
  }

  // ── assetBucketRemove: Asset bucket is now a computed view ──────
  if(!DB._migrations.assetBucketRemove){
    const before=DB.vaults.length;
    DB.vaults=DB.vaults.filter(v=>v.name!=='Asset bucket'&&v.id!=='v3');
    const removed=before-DB.vaults.length;
    if(removed)console.log('[Migration] Removed '+removed+' Asset bucket vault(s) — now computed from fund balances');
    DB._migrations.assetBucketRemove=true;
  }

  // ── vaultAutoDepositConsolidate: FC vaultId → vault.autoDeposit ─
  if(!DB._migrations.vaultAutoDepositConsolidate){
    const fcWithVault=DB.fixedCosts.filter(fc=>fc.vaultId);
    fcWithVault.forEach(fc=>{
      const vault=DB.vaults.find(v=>v.id===fc.vaultId);
      if(vault){
        vault.autoDeposit={type:'fixed',amount:fc.amount,reason:fc.label};
        console.log('[Migration] Moved '+fc.label+' ('+RM(fc.amount)+'/mo) → vault.autoDeposit on "'+vault.name+'"');
      }
    });
    DB.fixedCosts=DB.fixedCosts.filter(fc=>!fc.vaultId);
    DB._migrations.vaultAutoDepositConsolidate=true;
  }

  // Ensure runtime arrays
  if(!DB.incomeWarnings)DB.incomeWarnings=[];
}
function saveLocal(){try{localStorage.setItem('finOS_v2',JSON.stringify(DB));}catch(e){}}
function save(){saveLocal();if(gdGetToken())gdSave();}
load();

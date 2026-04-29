// ─── DEFAULT DATA ────────────────────────────────────────────────
const DEFAULT = {
  vaults:[
    {id:'needs',name:'Needs',fillMode:'fixed',pct:0,fixedAmount:625,type:'spending',target:0,goalLabel:'',rollover:false,rule:'',color:'danger',archived:false,current:0,deposits:[]},
    {id:'wants',name:'Wants',fillMode:'fixed',pct:0,fixedAmount:125,type:'spending',target:0,goalLabel:'',rollover:false,rule:'',color:'pink',archived:false,current:0,deposits:[]},
    {id:'unexpected',name:'Unexpected',fillMode:'percentage',pct:10,fixedAmount:0,type:'spending',target:0,goalLabel:'',rollover:true,rule:'Never touch unless: (1) Cannot be funded elsewhere, (2) Missing it has real cost, (3) Slept on decision 3+ days.',color:'info',archived:false,current:0,deposits:[]},
    {id:'self',name:'Self-Investment',fillMode:'percentage',pct:30,fixedAmount:0,type:'spending',target:0,goalLabel:'',rollover:true,rule:'Does this make me look better, feel more confident, or improve my physical wellbeing? If yes, spend it.',color:'purple',archived:false,current:0,deposits:[]},
    {id:'know',name:'Knowledge & Skill',fillMode:'percentage',pct:30,fixedAmount:0,type:'spending',target:0,goalLabel:'',rollover:true,rule:"Before buying, ask: 'Will I actually finish/use this within 30 days?' If yes, buy. If no, wait. Priority: 1) Directly applicable to current experiment 2) Improves freelance skill 3) General curiosity.",color:'teal',archived:false,current:0,deposits:[]},
    {id:'oppexp',name:'Opportunity Experimental',fillMode:'percentage',pct:30,fixedAmount:0,type:'spending',target:0,goalLabel:'',rollover:true,rule:'One experiment per month max. Before spending, write: "I am testing whether ___." Rollover: unused balance accumulates for bigger experiments.',color:'amber',archived:false,current:0,deposits:[]},
    {id:'invest',name:'Investment',fillMode:'percentage',pct:0,fixedAmount:0,type:'savings',target:0,goalLabel:'',rollover:true,rule:'Capital reserved for deploying into income-generating or appreciating assets. Deploy via the Assets page — do not spend directly.',color:'teal',archived:false,current:0,deposits:[]},
    {id:'emergency',name:'Emergency fund',fillMode:'manual',pct:0,fixedAmount:0,type:'savings',target:3600,goalLabel:'',rollover:true,rule:'',color:'accent',archived:false,current:0,deposits:[]},
    {id:'skin',name:'Skin fund',fillMode:'fixed',pct:0,fixedAmount:1000,type:'spending',target:7000,goalLabel:'Session',rollover:true,rule:'',color:'info',archived:false,current:0,deposits:[]},
  ],
  assets:[],
  income:[
    {id:1,month:'2026-01',source:'Freelance',amount:2250},
    {id:2,month:'2026-02',source:'Freelance',amount:2250},
    {id:3,month:'2026-02',source:'Angpow',amount:1070},
    {id:4,month:'2026-02',source:'Baba (weekly x4)',amount:1200},
    {id:5,month:'2026-03',source:'Freelance',amount:2250},
  ],
  expenses:[
    {id:1,name:'Atomic Habits',fund:'know',amount:15,date:'2026-02-18',month:'2026-02'},
    {id:2,name:'OpenRouter Token (OpenClaw)',fund:'oppexp',amount:43,date:'2026-03-02',month:'2026-03'},
    {id:3,name:'OpenRouter Token (OpenClaw)',fund:'oppexp',amount:84,date:'2026-03-02',month:'2026-03'},
    {id:4,name:'Never Eat Alone',fund:'know',amount:19,date:'2026-03-08',month:'2026-03'},
    {id:5,name:'Gym gloves',fund:'self',amount:24,date:'2026-03-13',month:'2026-03'},
    {id:6,name:'Skin Care & Eye Care products',fund:'self',amount:154,date:'2026-03-21',month:'2026-03'},
    {id:7,name:'Gym subscription',fund:'needs',amount:98,date:'2026-03-03',month:'2026-03'},
    {id:8,name:'Nutrition',fund:'needs',amount:57.5,date:'2026-03-11',month:'2026-03'},
    {id:9,name:'Nutrition (Chicken Breast)',fund:'needs',amount:53,date:'2026-03-11',month:'2026-03'},
    {id:10,name:'Grab (Kakak Telipok)',fund:'needs',amount:50,date:'2026-03-07',month:'2026-03'},
    {id:11,name:'Borenos (Belanja Harrey)',fund:'wants',amount:25,date:'2026-03-15',month:'2026-03'},
    {id:12,name:'Eat 猪杂 & The Mom Test',fund:'wants',amount:75,date:'2026-03-18',month:'2026-03'},
    {id:13,name:'Cut hair El Saloon',fund:'needs',amount:40,date:'2026-03-20',month:'2026-03'},
    {id:14,name:'Grocer + nutrition',fund:'needs',amount:120.8,date:'2026-03-21',month:'2026-03'},
    {id:15,name:'Car fuel',fund:'needs',amount:50,date:'2026-03-21',month:'2026-03'},
    {id:16,name:'City mall parking',fund:'needs',amount:2,date:'2026-03-21',month:'2026-03'},
    {id:17,name:'Lepak (water, parking, comb)',fund:'wants',amount:25,date:'2026-03-22',month:'2026-03'},
    {id:18,name:'Kin Fah lunch',fund:'needs',amount:17,date:'2026-03-08',month:'2026-03'},
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
  transfers:[],
  closedMonths:[],
  trash:[],
  notices:[],
};

// ─── STATE ───────────────────────────────────────────────────────
let DB;
function load(){
  try{
    const d=localStorage.getItem('finOS_v2');
    DB=d?JSON.parse(d):JSON.parse(JSON.stringify(DEFAULT));
  }catch(e){DB=JSON.parse(JSON.stringify(DEFAULT));}

  // Ensure required arrays/objects exist (pre-migration guards)
  if(!DB.vaults)DB.vaults=[];
  if(!DB.expenses)DB.expenses=[];
  if(!DB._migrations)DB._migrations={};
  // Legacy arrays — may or may not exist depending on migration state
  if(!DB.funds)DB.funds=[];
  if(!DB.fixedCosts)DB.fixedCosts=[];

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
    DB._migrations.orphanRemap=true;
  }

  // ── skinVaultUnify: link vault-backed FCs, migrate expenses ─────
  if(!DB._migrations.skinVaultUnify){
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

  // ── claimedToInstallments ───────────────────────────────────────
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

  // ── assetBucketRemove ───────────────────────────────────────────
  if(!DB._migrations.assetBucketRemove){
    const before=DB.vaults.length;
    DB.vaults=DB.vaults.filter(v=>v.name!=='Asset bucket'&&v.id!=='v3');
    const removed=before-DB.vaults.length;
    if(removed)console.log('[Migration] Removed '+removed+' Asset bucket vault(s)');
    DB._migrations.assetBucketRemove=true;
  }

  // ── vaultAutoDepositConsolidate ─────────────────────────────────
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

  // ── unifiedVaultModel: merge funds+fixedCosts+vaults → vaults ──
  if(!DB._migrations.unifiedVaultModel){
    const today=new Date().toISOString().slice(0,10);
    const newVaults=[];

    // Convert funds → percentage vaults
    const fundIdRemap={try:'oppexp',opp:'unexpected'};
    const fundNameRemap={try:'Opportunity Experimental',opp:'Unexpected'};
    (DB.funds||[]).forEach(f=>{
      const newId=fundIdRemap[f.id]||f.id;
      const newName=fundNameRemap[f.id]||f.name;
      const bal=f.balance||0;
      newVaults.push({
        id:newId,name:newName,fillMode:'percentage',pct:f.pct||0,fixedAmount:0,
        type:'spending',target:0,goalLabel:'',rollover:f.rollover!==false,
        rule:f.rule||'',color:f.color||'info',archived:false,
        current:bal,
        deposits:bal>0?[{id:uid(),type:'deposit',reason:'Migration: opening balance',amount:bal,date:today,source:'manual'}]:[]
      });
      console.log('[Migration] Fund '+f.id+' → vault '+newId+' ('+RM(bal)+')');
    });

    // Convert fixedCosts → fixed vaults (only fc2/fc3 remain at this point)
    const fcIdRemap={fc2:'needs',fc3:'wants'};
    const fcNameRemap={fc2:'Needs',fc3:'Wants'};
    const fcColorRemap={fc2:'danger',fc3:'pink'};
    (DB.fixedCosts||[]).forEach(fc=>{
      const newId=fcIdRemap[fc.id]||fc.id;
      const bal=fc.balance||0;
      newVaults.push({
        id:newId,name:fcNameRemap[fc.id]||fc.label,fillMode:'fixed',pct:0,
        fixedAmount:fc.amount||0,type:'spending',target:0,goalLabel:'',rollover:false,
        rule:'',color:fcColorRemap[fc.id]||'info',archived:false,
        current:bal,
        deposits:bal>0?[{id:uid(),type:'deposit',reason:'Migration: opening balance',amount:bal,date:today,source:'manual'}]:[]
      });
      console.log('[Migration] FixedCost '+fc.id+' → vault '+newId);
    });

    // Convert existing vaults (v1→emergency, v2→skin)
    const vaultIdRemap={v1:'emergency',v2:'skin'};
    (DB.vaults||[]).forEach(v=>{
      const newId=vaultIdRemap[v.id]||v.id;
      let fillMode,fixedAmount,pct,rollover,color,vType;
      if(newId==='emergency'){
        fillMode='manual';fixedAmount=0;pct=0;rollover=true;color='accent';vType='savings';
      }else if(newId==='skin'){
        fillMode='fixed';fixedAmount=v.autoDeposit?v.autoDeposit.amount:1000;
        pct=0;rollover=true;color='info';vType='spending';
      }else{
        fillMode='manual';fixedAmount=0;pct=0;
        rollover=v.rollover!==false;color=v.color||'info';vType=v.type||'savings';
      }
      const converted={
        id:newId,name:v.name,fillMode,pct,fixedAmount,type:vType,
        target:v.target||0,goalLabel:v.goalLabel||'',rollover,rule:v.rule||'',
        color,archived:false,current:v.current||0,deposits:v.deposits||[]
      };
      newVaults.push(converted);
      console.log('[Migration] Vault '+v.id+' → '+newId+' ('+RM(v.current||0)+')');
    });

    // Add Investment vault
    newVaults.push({
      id:'invest',name:'Investment',fillMode:'percentage',pct:0,fixedAmount:0,
      type:'savings',target:0,goalLabel:'',rollover:true,
      rule:'Capital reserved for deploying into income-generating or appreciating assets. Deploy via the Assets page — do not spend directly.',
      color:'teal',archived:false,current:0,deposits:[]
    });
    console.log('[Migration] Added Investment vault (pct:0 — rebalance on Settings page)');

    // Remap expense.fund values
    const expRemap={
      'try':'oppexp','opp':'unexpected',
      'fc2':'needs','fc3':'wants',
      'vault:v1':'emergency','vault:v2':'skin'
    };
    let expRemapped=0;
    (DB.expenses||[]).forEach(e=>{
      if(expRemap[e.fund]){e.fund=expRemap[e.fund];expRemapped++;}
      delete e.vaultId;
    });
    console.log('[Migration] Remapped '+expRemapped+' expense fund references');

    // Replace DB state
    DB.vaults=newVaults;
    delete DB.funds;
    delete DB.fixedCosts;
    delete DB.networth;
    if(!DB.assets)DB.assets=[];

    // Sanity log
    const total=newVaults.reduce((s,v)=>s+(v.current||0),0);
    console.log('[Migration] unifiedVaultModel complete. '+newVaults.length+' vaults. Total balance: '+RM(total));
    newVaults.forEach(v=>console.log('  '+v.id+' | '+v.fillMode+' | '+RM(v.current)+' | '+v.deposits.length+' deposits'));

    // Post-migration notice
    if(!DB.notices)DB.notices=[];
    DB.notices.push({id:uid(),message:'Investment vault was added at 0%. Rebalance your percentage allocations on the Settings page.'});

    DB._migrations.unifiedVaultModel=true;
  }

  // ── assetLedgerModel: replace projection fields with transaction ledger ──
  if(!DB._migrations.assetLedgerModel){
    const today=new Date().toISOString().slice(0,10);
    let migrated=0;
    (DB.assets||[]).forEach((a,i)=>{
      if(a.ledger)return; // already migrated or new format
      const ledger=[];
      ledger.push({
        id:uid(),type:'investment',
        amount:a.amountInvested||0,
        date:a.deployedDate||a.createdDate||today,
        note:a.notes||'Migration: initial deployment',
        vaultId:a.sourceVaultId||'invest'
      });
      if(a.exitValue&&a.exitValue>0){
        ledger.push({
          id:uid(),type:'return',
          amount:a.exitValue,
          date:a.exitDate||today,
          note:'Migration: exit value',
          vaultId:'invest'
        });
      }
      DB.assets[i]={
        id:a.id,name:a.name,
        notes:a.notes||'',
        archived:a.status==='exited',
        createdDate:a.deployedDate||a.createdDate||today,
        ledger
      };
      migrated++;
    });
    console.log('[migration] assetLedgerModel: migrated '+migrated+' assets');
    DB._migrations.assetLedgerModel=true;
  }

  // Ensure runtime arrays (post-migration)
  if(!DB.assets)DB.assets=[];
  if(!DB.notices)DB.notices=[];
  if(!DB.incomeWarnings)DB.incomeWarnings=[];

  // Recompute all vault currents from deposits (invariant maintenance)
  DB.vaults.forEach(v=>{
    if(!v.deposits)v.deposits=[];
    v.current=v.deposits.reduce((s,d)=>s+(d.type==='withdrawal'?-Math.abs(d.amount):Math.abs(d.amount)),0);
  });
}
function saveLocal(){try{localStorage.setItem('finOS_v2',JSON.stringify(DB));}catch(e){}}
function save(){saveLocal();if(typeof gdGetToken==='function'&&gdGetToken())gdSave();}
load();

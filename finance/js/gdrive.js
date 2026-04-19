// ─── GOOGLE DRIVE SYNC ────────────────────────────────────────────
const GD={
  CLIENT_ID:'',
  API_KEY:'',
  SCOPE:'https://www.googleapis.com/auth/drive.file',
  FILE_NAME:'finance-os.json',
  fileId:null,
  token:null,
  configured:false,
};

function gdConfigured(){return GD.CLIENT_ID&&GD.API_KEY;}
function gdStatus(){return localStorage.getItem('gd_token');}

function gdInit(){
  const cid=localStorage.getItem('gd_client_id')||'';
  const key=localStorage.getItem('gd_api_key')||'';
  GD.CLIENT_ID=cid;GD.API_KEY=key;GD.configured=!!(cid&&key);
  updateGDUI();
}

function updateGDUI(){
  const bar=document.getElementById('gdBar');
  const btn=document.getElementById('gdBtn');
  const lbl=document.getElementById('gdLbl');
  if(!bar)return;
  if(!GD.configured){
    lbl.textContent='Google Drive: not configured';
    btn.textContent='Configure';btn.onclick=gdConfigure;
    bar.style.background='var(--warn-l)';bar.style.borderColor='var(--warn)';lbl.style.color='var(--warn)';
  } else if(!gdStatus()){
    lbl.textContent='Google Drive: configured, not connected';
    btn.textContent='Connect';btn.onclick=gdConnect;
    bar.style.background='var(--info-l)';bar.style.borderColor='var(--info)';lbl.style.color='var(--info)';
  } else {
    lbl.textContent='Google Drive: connected — auto-syncing';
    btn.textContent='Sync now';btn.onclick=gdSave;
    bar.style.background='var(--accent-l)';bar.style.borderColor='var(--accent)';lbl.style.color='var(--accent)';
  }
}

function gdConfigure(){
  const cid=prompt('Enter your Google Client ID:\n\n(Get it from console.cloud.google.com → APIs & Credentials → OAuth 2.0 Client IDs)','');
  if(!cid)return;
  const key=prompt('Enter your Google API Key:\n\n(Same page → API Keys)','');
  if(!key)return;
  localStorage.setItem('gd_client_id',cid);localStorage.setItem('gd_api_key',key);
  GD.CLIENT_ID=cid;GD.API_KEY=key;GD.configured=true;
  toast('Configured! Now click Connect.');updateGDUI();
}

function gdConnect(){
  if(!GD.configured){gdConfigure();return;}
  const authUrl=`https://accounts.google.com/o/oauth2/v2/auth?client_id=${GD.CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.href)}&response_type=token&scope=${encodeURIComponent(GD.SCOPE)}&prompt=consent`;
  window.location.href=authUrl;
}

function gdHandleRedirect(){
  const hash=window.location.hash;
  if(!hash.includes('access_token'))return;
  const params=new URLSearchParams(hash.replace('#',''));
  const token=params.get('access_token');
  const expires=params.get('expires_in');
  if(token){
    localStorage.setItem('gd_token',token);
    localStorage.setItem('gd_token_exp',Date.now()+parseInt(expires)*1000);
    GD.token=token;
    window.history.replaceState(null,'',window.location.pathname);
    toast('Google Drive connected!');updateGDUI();
    gdLoad();
  }
}

function gdGetToken(){
  const token=localStorage.getItem('gd_token');
  const exp=parseInt(localStorage.getItem('gd_token_exp')||0);
  if(token&&Date.now()<exp){GD.token=token;return token;}
  localStorage.removeItem('gd_token');GD.token=null;updateGDUI();return null;
}

async function gdFindFile(){
  const token=gdGetToken();if(!token)return null;
  const res=await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${GD.FILE_NAME}'+and+trashed=false&fields=files(id,name)`,{headers:{Authorization:'Bearer '+token}});
  const data=await res.json();
  if(data.files&&data.files.length>0){GD.fileId=data.files[0].id;return GD.fileId;}
  return null;
}

async function gdSave(){
  const token=gdGetToken();if(!token){toast('Not connected to Drive');return;}
  try{
    const content=JSON.stringify(DB,null,2);
    const fileId=GD.fileId||await gdFindFile();
    let res;
    if(fileId){
      res=await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:content});
    } else {
      const meta=await fetch('https://www.googleapis.com/drive/v3/files',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({name:GD.FILE_NAME,mimeType:'application/json'})});
      const mdata=await meta.json();GD.fileId=mdata.id;
      res=await fetch(`https://www.googleapis.com/upload/drive/v3/files/${GD.fileId}?uploadType=media`,{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:content});
    }
    if(res.ok){toast('Saved to Google Drive');}else{toast('Drive save failed');}
  }catch(e){toast('Drive error: '+e.message);}
}

async function gdLoad(){
  const token=gdGetToken();if(!token)return;
  try{
    const fileId=await gdFindFile();if(!fileId){await gdSave();return;}
    const res=await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,{headers:{Authorization:'Bearer '+token}});
    if(res.ok){
      const data=await res.json();
      localStorage.setItem('finOS_v2',JSON.stringify(data));
      load();
      saveLocal();
      toast('Loaded from Google Drive');
      go('dashboard');
    }
  }catch(e){toast('Could not load from Drive');}
}

/* DASHBOARD — strict online check + robust loader fallback + Wi-Fi sticky action */

(() => {
  // ===== Robust loader helpers =====
  function hideLoader() {
    const el = document.getElementById('loading-overlay');
    if (!el) return;
    el.classList.add('hidden');           // CSS fade
    el.style.display = 'none';            // hard hide fallback
  }
  // Hide on load event, and hard fallback after 3s, and on any window error
  window.addEventListener('load', () => setTimeout(hideLoader, 300));
  setTimeout(hideLoader, 3000);
  window.addEventListener('error', () => hideLoader());

  // ===== Firebase handles (tolerant jika belum ada) =====
  const db   = window.database;
  const auth = window.auth;
  const hasFirebase = !!db && !!auth;

  // ===== Global state =====
  let currentUser = null;
  let sensorsRef = null, statusRef = null, lastSeenRef = null;

  // Logs
  let logsQueryRef = null;
  const logs = [];
  let rangeMinutes = 15;

  // Online watchdog (strict)
  let deviceOnline = null;
  let hbTimer = null;
  let SERVER_OFFSET_MS = 0;
  let LAST_SEEN_MS = 0;
  let hasHeartbeat = false;
  const FRESH_MS = 9000, STARTUP_GRACE_MS = 15000;
  let appStartedAt = Date.now(), offlineLatchAt = 0;

  // Chart
  let chart = null; const MAX_POINTS = 2000;

  // ===== Utilities =====
  const serverNow = () => Date.now() + (SERVER_OFFSET_MS || 0);
  const $  = (s)=>document.querySelector(s);
  const $$ = (s)=>document.querySelectorAll(s);
  const getCss=(n)=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const hexToRGBA=(hex,a)=>{const m=hex.replace('#','');const v=parseInt(m.length===3?m.split('').map(c=>c+c).join(''):m,16);const r=(v>>16)&255,g=(v>>8)&255,b=v&255;return `rgba(${r},${g},${b},${a})`;};
  const setText=(id,txt)=>{const el=document.getElementById(id); if(el) el.textContent=txt;};
  const setProgress=(id,value,max)=>{const el=document.getElementById(id); if(!el||typeof value!=='number'||!isFinite(value)||max<=0) return; el.style.width=Math.max(0,Math.min(100,(value/max)*100))+'%';};

  function showToast(title, message, type='info', duration=3000){
    const prev = document.querySelector('.toast'); if (prev) prev.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    const icon = type==='success'?'✅':type==='warning'?'⚠️':type==='error'?'❌':'ℹ️';
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close" aria-label="Tutup">&times;</button>
    `;
    document.body.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click',()=>toast.remove());
    if (duration>0) setTimeout(()=>toast.remove(), duration);
  }

  // ===== Online UI lock =====
  function setUIEnabled(isOnline){
    document.querySelectorAll('.section').forEach(sec=>{
      sec.classList.toggle('disabled', !isOnline);
      sec.setAttribute('aria-disabled', String(!isOnline));
    });
    document.querySelectorAll('button').forEach(b=>{
      const keep = b.closest('#device-offline-modal, #logout-modal');
      b.disabled = !isOnline && !keep;
    });
    $$('.range-btn').forEach(b=> b.disabled = !isOnline);
  }
  function showOfflineModal(show){ const m=$('#device-offline-modal'); if(m) m.style.display=show?'block':'none'; }
  function updateOnlineState(isOnline){
    if (deviceOnline === isOnline) return;
    deviceOnline = isOnline;
    setUIEnabled(isOnline);
    setText('net-status', isOnline? 'ONLINE':'OFFLINE');
    if (isOnline){ showOfflineModal(false); showToast('Perangkat Online','Koneksi mesin tersambung kembali','success',1200); }
    else { showOfflineModal(true); showToast('Perangkat Offline','Hubungkan koneksi internet pada Mesin','warning',2000); }
  }
  function evaluateOnlineNow(){
    const now=Date.now();
    const beatFresh = hasHeartbeat && (LAST_SEEN_MS>0) && ((serverNow()-LAST_SEEN_MS)<=FRESH_MS);
    const clientOk = navigator.onLine===true;
    const shouldBeOnline = beatFresh && clientOk;
    if (!shouldBeOnline && (now-appStartedAt)<STARTUP_GRACE_MS) return;
    if (!shouldBeOnline){ if(!offlineLatchAt) offlineLatchAt=now; if((now-offlineLatchAt)>=4000) updateOnlineState(false); }
    else { offlineLatchAt=0; updateOnlineState(true); }
  }
  function startHeartbeatWatch(){ if(!hbTimer) hbTimer=setInterval(evaluateOnlineNow,1500); }
  function stopHeartbeatWatch(){ if(hbTimer){ clearInterval(hbTimer); hbTimer=null; } }

  // ===== Chart =====
  function initChart(){
    const ctx = document.getElementById('sensorChart'); if (!ctx) return;
    const colorTemp=getCss('--start-2')||'#FF8A00', colorHum=getCss('--ref-2')||'#167BD9';
    chart = new Chart(ctx,{type:'line',data:{labels:[],datasets:[
      {label:'Suhu (°C)',data:[],yAxisID:'yTemp',borderColor:colorTemp,backgroundColor:hexToRGBA(colorTemp,.15),borderWidth:2,pointRadius:0,tension:.35},
      {label:'Kelembapan (%)',data:[],yAxisID:'yHum',borderColor:colorHum,backgroundColor:hexToRGBA(colorHum,.15),borderWidth:2,pointRadius:0,tension:.35}
    ]},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top'},decimation:{enabled:true,algorithm:'lttb',samples:1000}},scales:{x:{ticks:{maxRotation:0,autoSkip:true,maxTicksLimit:8},grid:{display:false}},yTemp:{position:'left',title:{display:true,text:'°C'}},yHum:{position:'right',title:{display:true,text:'%'},suggestedMin:0,suggestedMax:100,grid:{drawOnChartArea:false}}}}); }
  const msToLabel=(ms)=>{const d=new Date(ms),today=new Date();return (d.toDateString()===today.toDateString())?d.toLocaleTimeString():d.toLocaleString();};
  function renderChartFromLogs(){
    if(!chart) initChart(); if(!chart) return;
    const step=Math.max(1,Math.ceil(logs.length/2000)); const labels=[],t=[],h=[];
    for(let i=0;i<logs.length;i+=step){ labels.push(msToLabel(logs[i].ts)); t.push(logs[i].t); h.push(logs[i].h); }
    chart.data.labels=labels; chart.data.datasets[0].data=t; chart.data.datasets[1].data=h; chart.update('none');
  }

  // ===== Logs =====
  function detachLogsListener(){ if (logsQueryRef){ logsQueryRef.off(); logsQueryRef=null; } }
  function attachLogsListener(){
    if (!hasFirebase) return;
    detachLogsListener(); logs.length=0;
    const base=db.ref('logs').orderByChild('ts');
    const qRef=(rangeMinutes==='all')? base.limitToLast(30000) : base.startAt(Date.now()-(Number(rangeMinutes)*60*1000)).limitToLast(10000);
    logsQueryRef=qRef;
    qRef.on('value',snap=>{
      const arr=[]; snap.forEach(ch=>{const v=ch.val()||{}; if(typeof v.ts==='number'&&typeof v.t==='number'&&typeof v.h==='number'){arr.push({ts:v.ts,t:v.t,h:v.h});}});
      arr.sort((a,b)=>a.ts-b.ts); logs.length=0; Array.prototype.push.apply(logs,arr); renderChartFromLogs();
    },err=>{ console.error('logs error',err); showToast('Gagal memuat grafik', err?.message||'Error RTDB','error');});
  }

  // ===== Export / Controls =====
  function exportData(){
    if(!currentUser){ showToast('Akses Ditolak','Silakan login dulu','warning'); return; }
    if(!deviceOnline){ showToast('Perangkat Offline','Tidak dapat mengekspor saat offline','warning'); return; }
    if(!logs.length){ showToast('Tidak ada data','Belum ada log pada rentang ini','warning'); return; }
    let csv="data:text/csv;charset=utf-8,"; csv+="Timestamp (Local),Suhu (°C),Kelembapan (%)\n";
    for(const r of logs){ csv += `${new Date(r.ts).toLocaleString()},${r.t},${r.h}\n`; }
    const a=document.createElement('a'); a.href=encodeURI(csv);
    a.download=`greenheat_logs_${(rangeMinutes==='all')?'all':`${rangeMinutes}min`}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Export Berhasil','Data log telah diunduh','success');
  }
  function sendCommand(action){
    if(!currentUser){ showToast('Akses Ditolak','Silakan login dulu','warning'); return; }
    if(!deviceOnline){ showToast('Perangkat Offline','Tidak dapat mengirim perintah','warning'); return; }
    setUIEnabled(false);
    db.ref('controls/action').set(action).then(()=>{
      const msg = action==='start'?'Sistem akan dihidupkan': action==='stop'?'Sistem akan dihentikan': action==='reboot'?'Diminta restart…': action==='wifi_reconfig'?'Masuk mode ganti Wi-Fi (portal)…':'Perintah terkirim';
      showToast('Perintah Dikirim', msg, 'info', 1600);
      setTimeout(()=> db.ref('controls/action').set('').finally(()=> setUIEnabled(true)), 900);
    }).catch(err=>{ setUIEnabled(true); showToast('Error','Gagal mengirim perintah: '+err.message,'error'); });
  }
  function refreshData(){ sendCommand('reboot'); }
  function wifiReconfig(){
    if(!currentUser){ showToast('Akses Ditolak','Silakan login dulu','warning'); return; }
    if(!deviceOnline){ showToast('Perangkat Offline','Tidak bisa masuk portal Wi-Fi saat offline','warning'); return; }
    if(!confirm('Masuk mode konfigurasi Wi-Fi? Perangkat akan reboot lalu membuka portal "GreenHeat".')) return;
    sendCommand('wifi_reconfig');
  }
  function testConnection(){
    const fresh = hasHeartbeat && (serverNow()-LAST_SEEN_MS)<=FRESH_MS;
    const clientOk = navigator.onLine===true;
    const msg = [
      `Client: ${clientOk?'ONLINE ✅':'OFFLINE ❌'}`,
      `Heartbeat: ${fresh?'FRESH ✅':'STALE ❌'}`,
      LAST_SEEN_MS? `LastSeen: ${Math.round((serverNow()-LAST_SEEN_MS)/1000)}s ago` : 'LastSeen: —'
    ].join(' · ');
    showToast('Diagnostik Koneksi', msg, fresh&&clientOk?'success':'warning', 3500);
  }
  function confirmFactoryReset(){
    if(!currentUser){ showToast('Akses Ditolak','Silakan login dulu','warning'); return; }
    if(!confirm('Reset konfigurasi ke default? Tindakan ini tidak bisa dibatalkan.')) return;
    showToast('Reset','(Demo) Implementasikan write ke /config sesuai kebutuhan.','info',2500);
  }

  // ===== Realtime listeners =====
  function setupRealtimeListeners(){
    if (!hasFirebase) return;

    db.ref('.info/serverTimeOffset').on('value', s=>{ SERVER_OFFSET_MS = Number(s.val()||0); });

    sensorsRef = db.ref('sensors');
    sensorsRef.on('value', snap=>{
      const d=snap.val()||{}; const t=(typeof d.temperature==='number')?d.temperature:null; const h=(typeof d.moisture==='number')?d.moisture:null;
      setText('temp-value', t!==null?t.toFixed(1):'--'); setText('humidity-value', h!==null?h:'--');
      if(t!==null) setProgress('temp-progress', t, 100); if(h!==null) setProgress('humidity-progress', h, 100);
    });

    statusRef = db.ref('status');
    statusRef.on('value', snap=>{
      const d=snap.val()||{};
      setText('status-value', d.running ? 'RUNNING' : 'STOPPED');
      setText('source-value', d.lastCommandSource ? String(d.lastCommandSource).toUpperCase() : '--');
      if (d.net){ setText('net-ssid', d.net.ssid||'—'); setText('net-ip', d.net.ip||'—'); setText('net-rssi', (typeof d.net.rssi==='number')?`${d.net.rssi} dBm`:'—'); }
    });

    lastSeenRef = db.ref('status/lastSeen');
    lastSeenRef.on('value', snap=>{
      const v=snap.val(); LAST_SEEN_MS = (typeof v==='number')?v:Number(v||0);
      hasHeartbeat = LAST_SEEN_MS > 0;
      evaluateOnlineNow();
    });

    startHeartbeatWatch();
    window.addEventListener('online', evaluateOnlineNow);
    window.addEventListener('offline', evaluateOnlineNow);
  }

  // ===== Range tabs =====
  function bindRangeButtons(){
    $$('.range-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(!deviceOnline){ showOfflineModal(true); return; }
        $$('.range-btn').forEach(b=> b.classList.remove('active'));
        btn.classList.add('active');
        const v = btn.getAttribute('data-min');
        rangeMinutes = (v==='all') ? 'all' : Number(v);
        attachLogsListener();
      });
    });
  }

  // ===== Mobile nav (single page) =====
  function setupMobileNav(){
    const items = document.querySelectorAll('.mobile-nav .nav-item');
    const setActive=()=>{ const hash=location.hash||'#top'; items.forEach(a=> a.classList.toggle('active', a.getAttribute('href')===hash)); };
    items.forEach(a=>{
      a.addEventListener('click',(e)=>{
        const targetSel=a.getAttribute('data-target')||a.getAttribute('href');
        if(targetSel && targetSel.startsWith('#')){
          e.preventDefault();
          const el=document.querySelector(targetSel); if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
          history.replaceState(null,'',targetSel); setActive();
        }
      });
    });
    window.addEventListener('hashchange', setActive); setActive();
  }

  // ===== Auth & Boot =====
  function toggleAuth(){ const m=$('#logout-modal'); if(m) m.style.display='block'; }
  function closeModal(){  const m=$('#logout-modal'); if(m) m.style.display='none'; }
  function logout(){
    if (!hasFirebase) return;
    auth.signOut().then(()=>{ showToast('Logout Berhasil','Anda telah keluar','success'); setTimeout(()=> location.href='login.html', 900); })
                  .catch(err=> showToast('Error Logout', err.message, 'error'));
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // Kunci UI dulu; loader akan di-hide oleh fallback di atas
    setUIEnabled(false);

    initChart(); bindRangeButtons(); setupMobileNav();

    if (!hasFirebase) {
      showToast('Firebase tidak terdeteksi','Periksa file firebase-config.js & kredensialnya.', 'warning', 4500);
      // Tetap tampilkan modal offline agar user paham kenapa kontrol terkunci
      setTimeout(()=> showOfflineModal(true), 500);
      return;
    }

    auth.onAuthStateChanged(user=>{
      if(!user){ window.location.href='login.html'; return; }
      currentUser=user; setText('user-status','👤 '+(user.email||'User'));
      $('#auth-btn')?.classList.remove('hidden');

      setupRealtimeListeners(); attachLogsListener();
      // loader sudah dipaksa hide lewat fallback; biar aman panggil lagi
      hideLoader();
    });

    document.addEventListener('visibilitychange', ()=>{ if(document.hidden) stopHeartbeatWatch(); else startHeartbeatWatch(); });
  });

  window.addEventListener('beforeunload', ()=>{
    sensorsRef?.off(); statusRef?.off(); lastSeenRef?.off();
    detachLogsListener(); stopHeartbeatWatch();
    window.removeEventListener('online', evaluateOnlineNow);
    window.removeEventListener('offline', evaluateOnlineNow);
  });

  // Expose
  window.sendCommand=sendCommand; window.refreshData=refreshData; window.exportData=exportData;
  window.wifiReconfig=wifiReconfig; window.testConnection=testConnection;
  window.toggleAuth=toggleAuth; window.closeModal=closeModal; window.logout=logout; window.showOfflineModal=showOfflineModal;

  // Debug helper
  window.__debugOnline = () => ({
    now: Date.now(),
    serverNow: serverNow(),
    LAST_SEEN_MS, hasHeartbeat,
    ageHeartbeatMs: serverNow()-LAST_SEEN_MS,
    deviceOnline, clientOnline: navigator.onLine,
    hasFirebase
  });
})();

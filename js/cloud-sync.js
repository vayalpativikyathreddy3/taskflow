/*=========================================================================
   CLOUD SYNC (Google Drive — bring your own OAuth Client ID)
   Storage: Google Drive "appDataFolder" — a private, hidden space that
   only this app can read/write. Nothing else in the user's Drive is
   touched, and no server other than Google's ever sees the data.
=========================================================================*/
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GOOGLE_BACKUP_FILENAME = "taskflow_backup.json";

let googleTokenClient = null;
let googleAccessToken = null;
let googleBackupFileId = null;

function loadCloudConfig(){
    try{ return JSON.parse(localStorage.getItem("cloudSyncConfig")) || {}; }catch(e){ return {}; }
}
function saveCloudConfig(cfg){
    try{ localStorage.setItem("cloudSyncConfig", JSON.stringify(cfg)); }catch(e){}
}

function setCloudStatus(text){
    if($("cloudSyncStatus")) $("cloudSyncStatus").textContent = text;
}

function ensureGoogleTokenClient(clientId){
    if(!window.google || !window.google.accounts || !window.google.accounts.oauth2){
        throw new Error("Google Identity Services hasn't loaded yet — check your connection and reload");
    }
    if(!googleTokenClient || googleTokenClient._clientId !== clientId){
        googleTokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: GOOGLE_DRIVE_SCOPE,
            callback: () => {} // overridden per-call below
        });
        googleTokenClient._clientId = clientId;
    }
    return googleTokenClient;
}

function googleRequestToken(clientId){
    return new Promise((resolve, reject) => {
        try{
            const client = ensureGoogleTokenClient(clientId);
            client.callback = (resp) => {
                if(resp && resp.access_token){
                    googleAccessToken = resp.access_token;
                    resolve(resp.access_token);
                }else{
                    reject(new Error("No access token returned"));
                }
            };
            client.error_callback = (err) => reject(new Error(err && err.type ? err.type : "Sign-in failed"));
            client.requestAccessToken({ prompt: googleAccessToken ? "" : "consent" });
        }catch(e){ reject(e); }
    });
}

async function googleFindBackupFile(){
    const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=" +
        encodeURIComponent(`name='${GOOGLE_BACKUP_FILENAME}'`) + "&fields=files(id,name)",
        { headers: { "Authorization": "Bearer " + googleAccessToken } }
    );
    if(!res.ok) throw new Error("Drive lookup failed (" + res.status + ")");
    const data = await res.json();
    return (data.files && data.files[0]) ? data.files[0].id : null;
}

async function googleUploadBackup(payload){
    const boundary = "taskflow-" + Date.now();
    const metadata = { name: GOOGLE_BACKUP_FILENAME, mimeType: "application/json" };
    if(!googleBackupFileId) metadata.parents = ["appDataFolder"];

    const body =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(payload)}\r\n` +
        `--${boundary}--`;

    const url = googleBackupFileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${googleBackupFileId}?uploadType=multipart`
        : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    const res = await fetch(url, {
        method: googleBackupFileId ? "PATCH" : "POST",
        headers: {
            "Authorization": "Bearer " + googleAccessToken,
            "Content-Type": `multipart/related; boundary=${boundary}`
        },
        body
    });
    if(!res.ok) throw new Error("Drive upload failed (" + res.status + ")");
    const data = await res.json();
    googleBackupFileId = data.id;
}

async function googleDownloadBackup(){
    if(!googleBackupFileId) googleBackupFileId = await googleFindBackupFile();
    if(!googleBackupFileId) return null;
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${googleBackupFileId}?alt=media`,
        { headers: { "Authorization": "Bearer " + googleAccessToken } }
    );
    if(!res.ok) throw new Error("Drive download failed (" + res.status + ")");
    return res.json();
}

function initCloudSync(){
    const cfg = loadCloudConfig();
    if($("googleClientId")) $("googleClientId").value = cfg.clientId || "";
    setCloudStatus(cfg.clientId ? "Client ID saved — sign in to sync" : "Add a Google OAuth Client ID to enable sync");

    const saveBtn = $("googleSaveConfig");
    if(saveBtn) saveBtn.addEventListener("click", () => {
        const clientId = $("googleClientId").value.trim();
        if(!clientId){ showToast("⚠ Enter your Google OAuth Client ID", "#f39c12"); return; }
        saveCloudConfig({ clientId });
        setCloudStatus("✅ Client ID saved — sign in to sync");
        showToast("☁ Google Client ID saved", "#27ae60");
    });

    const signInBtn = $("googleSignInBtn");
    if(signInBtn) signInBtn.addEventListener("click", async () => {
        const cfg = loadCloudConfig();
        if(!cfg.clientId){ showToast("⚠ Save your Google Client ID first", "#f39c12"); return; }
        try{
            setCloudStatus("⏳ Signing in...");
            await googleRequestToken(cfg.clientId);
            setCloudStatus("✅ Signed in to Google");
            showToast("👤 Signed in with Google", "#27ae60");
        }catch(e){
            setCloudStatus("❌ " + (e.message || "Sign-in failed"));
            showToast("❌ Google sign-in failed", "#e74c3c");
        }
    });

    const signOutBtn = $("googleSignOutBtn");
    if(signOutBtn) signOutBtn.addEventListener("click", () => {
        if(googleAccessToken && window.google && window.google.accounts && window.google.accounts.oauth2){
            window.google.accounts.oauth2.revoke(googleAccessToken, () => {});
        }
        googleAccessToken = null;
        googleBackupFileId = null;
        setCloudStatus("Signed out");
        showToast("👋 Signed out of Google", "#f39c12");
    });

    const pushBtn = $("cloudPushBtn");
    if(pushBtn) pushBtn.addEventListener("click", async () => {
        const cfg = loadCloudConfig();
        if(!cfg.clientId){ showToast("⚠ Save your Google Client ID first", "#f39c12"); return; }
        try{
            if(!googleAccessToken) await googleRequestToken(cfg.clientId);
            setCloudStatus("⏳ Pushing...");
            await googleUploadBackup({ tasks, projects, activities });
            setCloudStatus("✅ Pushed at " + new Date().toLocaleTimeString());
            showToast("⬆ Synced to Google Drive", "#27ae60");
        }catch(e){
            setCloudStatus("❌ " + (e.message || "Push failed"));
            showToast("❌ Cloud push failed — check console/config", "#e74c3c");
        }
    });

    const pullBtn = $("cloudPullBtn");
    if(pullBtn) pullBtn.addEventListener("click", async () => {
        const cfg = loadCloudConfig();
        if(!cfg.clientId){ showToast("⚠ Save your Google Client ID first", "#f39c12"); return; }
        try{
            if(!googleAccessToken) await googleRequestToken(cfg.clientId);
            setCloudStatus("⏳ Pulling...");
            const data = await googleDownloadBackup();
            if(data){
                tasks = data.tasks || [];
                projects = data.projects || projects;
                activities = data.activities || [];
                saveTasks(); saveProjects();
                displayTasks(); displayActivities(); updateDashboard(); renderCalendar();
                renderProjects(); refreshCategorySelects(); refreshTagFilter(); renderKanban();
                refreshPomodoroTaskSelect(); renderAnalyticsCharts();
                setCloudStatus("✅ Pulled at " + new Date().toLocaleTimeString());
                showToast("⬇ Synced from Google Drive", "#27ae60");
            }else{
                setCloudStatus("⚠ No backup found in Drive yet — push first");
                showToast("⚠ No cloud backup found yet", "#f39c12");
            }
        }catch(e){
            setCloudStatus("❌ " + (e.message || "Pull failed"));
            showToast("❌ Cloud pull failed — check console/config", "#e74c3c");
        }
    });
}

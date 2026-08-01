/*=========================================================================
   SMART REMINDER SYSTEM (Browser Notifications)
=========================================================================*/
function notifyUser(title, body){
    if(typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try{ new Notification(title, { body, icon: "" }); }catch(e){}
}

function updateNotifStatusLabel(){
    const el = $("notifStatus");
    if(!el || typeof Notification === "undefined") return;
    const map = { granted:"✅ Enabled", denied:"🚫 Blocked in browser settings", default:"Not enabled yet" };
    el.textContent = map[Notification.permission] || "";
}

function initSmartReminders(){
    updateNotifStatusLabel();
    const btn = $("enableNotifsBtn");
    if(btn) btn.addEventListener("click", async () => {
        if(typeof Notification === "undefined"){
            showToast("⚠ This browser doesn't support notifications.", "#f39c12");
            return;
        }
        const perm = await Notification.requestPermission();
        updateNotifStatusLabel();
        if(perm === "granted") showToast("🔔 Smart reminders enabled", "#27ae60");
        else showToast("⚠ Notifications not enabled", "#f39c12");
    });

    // Check every 60s for tasks due within 24h that haven't been notified yet
    setInterval(() => {
        let changed = false;
        tasks.forEach(task => {
            if(task.completed || !task.deadlineDate || task.notifiedDueSoon) return;
            const deadline = new Date(task.deadlineDate + " " + (task.deadlineTime || "23:59"));
            const diff = deadline - new Date();
            if(diff > 0 && diff <= 86400000){
                notifyUser("⏰ Task due soon", `"${task.name}" is due within 24 hours.`);
                task.notifiedDueSoon = true;
                changed = true;
            }
        });
        if(changed) saveTasks();
    }, 60000);
}


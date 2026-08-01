/*==================== ACTIVITY LOG ====================*/
const activityIcons = {
    "➕":{icon:"➕", bg:"#7c3aed"},
    "✅":{icon:"✓", bg:"#22c55e"},
    "↩":{icon:"↩", bg:"#3b82f6"},
    "🗑":{icon:"🗑", bg:"#ef4444"},
    "✏":{icon:"✏", bg:"#f59e0b"}
};
function addActivity(action){
    activities.unshift({ action, time: new Date().toLocaleString() });
    if(activities.length > 50) activities.pop();
    saveTasks();
}
function displayActivities(){
    const list = $("activityList");
    if(activities.length === 0){
        list.innerHTML = `<p class="muted">No recent activity.</p>`;
        return;
    }
    list.innerHTML = activities.slice(0, 12).map(a => {
        const key = Object.keys(activityIcons).find(k => a.action.startsWith(k)) || "➕";
        const meta = activityIcons[key];
        const text = a.action.replace(key, "").trim();
        return `<div class="activity-row">
            <div class="activity-dot" style="background:${meta.bg}">${meta.icon}</div>
            <div class="activity-text"><strong>${escapeHtml(text)}</strong><span>${escapeHtml(a.time)}</span></div>
        </div>`;
    }).join("");
}


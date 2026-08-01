/*==================== HELPERS ====================*/
function escapeHtml(str){
    return String(str ?? "").replace(/[&<>"']/g, c => ({
        "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
}

/*==================== STORAGE ====================*/
function saveTasks(){
    try{
        localStorage.setItem("tasks", JSON.stringify(tasks));
        localStorage.setItem("activities", JSON.stringify(activities));
    }catch(e){ showToast("⚠ Storage is full.", "#e74c3c"); }
}
function loadTasks(){
    const saved = localStorage.getItem("tasks");
    if(saved) tasks = JSON.parse(saved);
    const act = localStorage.getItem("activities");
    if(act) activities = JSON.parse(act);
}


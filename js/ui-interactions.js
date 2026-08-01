/*==================== FILTER SHORTCUTS ====================*/
function filterHighPriority(){
    statusFilter.value = "Pending"; searchInput.value = ""; categoryFilter.value = "";
    displayTasks();
    taskList.querySelectorAll("li").forEach(li => { if(!li.innerHTML.includes("🚩 High")) li.style.display = "none"; });
    showToast("🔥 Showing High Priority Tasks", "#dc2626");
}
function filterOverdue(){
    statusFilter.value = "Overdue"; searchInput.value = ""; categoryFilter.value = "";
    displayTasks();
    showToast("⚠ Showing Overdue Tasks", "#ea580c");
}
function filterToday(){
    statusFilter.value = "All"; searchInput.value = ""; categoryFilter.value = "";
    displayTasks();
    showToast("📅 Showing Tasks Due Today", "#7c3aed");
}

/*==================== SIDEBAR NAV ====================*/
document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(b => { b.classList.remove("active"); b.removeAttribute("aria-current"); });
        btn.classList.add("active");
        btn.setAttribute("aria-current", "page");
        const target = document.getElementById(btn.dataset.target);
        if(target){
            target.scrollIntoView({ behavior:"smooth", block:"start" });
            target.classList.remove("panel-flash");
            void target.offsetWidth; // restart animation
            target.classList.add("panel-flash");
        }
    });
});

/*==================== TOPBAR DROPDOWN / NOTIFICATIONS ====================*/
actionsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    actionsMenu.classList.toggle("show");
});
document.addEventListener("click", () => actionsMenu.classList.remove("show"));
actionsMenu.addEventListener("click", (e) => e.stopPropagation());

notificationBtn.addEventListener("click", () => {
    const overdue = tasks.filter(t => !t.completed && t.deadlineDate &&
        new Date(t.deadlineDate + " " + (t.deadlineTime || "23:59")) < new Date());
    if(overdue.length === 0){ showToast("🔔 You're all caught up!", "#22c55e"); return; }
    showToast(`⚠ You have ${overdue.length} overdue task${overdue.length===1?"":"s"}`, "#ef4444");
    filterOverdue();
});

/*==================== KEYBOARD SHORTCUT ("/" to search) ====================*/
/* Additional shortcuts (N, Esc, ?, 1-9) live in js/keyboard-shortcuts.js */
document.addEventListener("keydown", (e) => {
    const tag = document.activeElement ? document.activeElement.tagName : "";
    const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    if(e.key === "/" && !typing){ e.preventDefault(); searchInput.focus(); }
});

/*==================== EVENTS ====================*/
addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", e => { if(e.key === "Enter") addTask(); });
searchInput.addEventListener("input", displayTasks);
categoryFilter.addEventListener("change", displayTasks);
if(tagFilter) tagFilter.addEventListener("change", displayTasks);
statusFilter.addEventListener("change", displayTasks);
sortTasks.addEventListener("change", displayTasks);
themeToggle.addEventListener("click", toggleTheme);
clearCompletedBtn.addEventListener("click", clearCompleted);
exportPdf.addEventListener("click", exportTasksPDF);
exportJson.addEventListener("click", exportTasksJSON);
importJsonBtn.addEventListener("click", () => importJson.click());
calPrev.addEventListener("click", () => { calViewDate.setMonth(calViewDate.getMonth()-1); renderCalendar(); });
calNext.addEventListener("click", () => { calViewDate.setMonth(calViewDate.getMonth()+1); renderCalendar(); });
addProjectBtn.addEventListener("click", addProject);
projectNameInput.addEventListener("keypress", e => { if(e.key === "Enter") addProject(); });
$("clearDateFilter").addEventListener("click",()=>{

    selectedDate="";

    displayTasks();

    showToast("📋 Showing all tasks","#10b981");

});


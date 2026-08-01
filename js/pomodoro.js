/*=========================================================================
   POMODORO TIMER
=========================================================================*/
let pomodoroState = {
    workMins: 25, breakMins: 5,
    mode: "focus", remaining: 25*60, running: false, intervalId: null,
    taskId: ""
};

function getFocusStats(){
    try{
        return JSON.parse(localStorage.getItem("focusStats")) || { totalSessions:0, totalMinutes:0, byDay:{} };
    }catch(e){ return { totalSessions:0, totalMinutes:0, byDay:{} }; }
}
function saveFocusStats(stats){
    try{ localStorage.setItem("focusStats", JSON.stringify(stats)); }catch(e){}
}
function recordFocusSession(minutes){
    const stats = getFocusStats();
    const key = new Date().toISOString().split("T")[0];
    stats.totalSessions += 1;
    stats.totalMinutes += minutes;
    stats.byDay[key] = (stats.byDay[key] || 0) + 1;
    saveFocusStats(stats);
}

function refreshPomodoroTaskSelect(){
    const sel = $("pomodoroTaskSelect");
    if(!sel) return;
    const current = sel.value;
    const pending = tasks.filter(t => !t.completed);
    sel.innerHTML = `<option value="">No task selected</option>` +
        pending.map(t => `<option value="${t.id}" ${String(t.id)===current?"selected":""}>${escapeHtml(t.name)}</option>`).join("");
}

function formatPomodoroTime(seconds){
    const m = Math.floor(seconds/60), s = seconds % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function updatePomodoroDisplay(){
    const timeEl = $("pomodoroTime"), modeEl = $("pomodoroMode");
    if(timeEl) timeEl.textContent = formatPomodoroTime(pomodoroState.remaining);
    if(modeEl) modeEl.textContent = pomodoroState.mode === "focus" ? "Focus" : "Break";
    const btn = $("pomodoroStartPause");
    if(btn) btn.textContent = pomodoroState.running ? "⏸ Pause" : "▶ Start";
}

function pomodoroTick(){
    pomodoroState.remaining--;
    if(pomodoroState.remaining <= 0){
        if(pomodoroState.mode === "focus"){
            recordFocusSession(pomodoroState.workMins);
            const task = tasks.find(t => String(t.id) === pomodoroState.taskId);
            addActivity("⏱ Focus session complete" + (task ? ": " + task.name : ""));
            notifyUser("⏱ Focus session complete!", task ? `Great work on "${task.name}". Time for a break.` : "Time for a break.");
            showToast("⏱ Focus session complete! Time for a break.", "#7c3aed");
            pomodoroState.mode = "break";
            pomodoroState.remaining = pomodoroState.breakMins * 60;
        } else {
            addActivity("☕ Break finished");
            notifyUser("☕ Break's over", "Ready for another focus session?");
            showToast("☕ Break's over. Ready to focus again?", "#3b82f6");
            pomodoroState.mode = "focus";
            pomodoroState.remaining = pomodoroState.workMins * 60;
        }
        renderAnalyticsCharts();
    }
    updatePomodoroDisplay();
}

function pomodoroStartPause(){
    if(pomodoroState.running){
        clearInterval(pomodoroState.intervalId);
        pomodoroState.running = false;
    } else {
        pomodoroState.taskId = $("pomodoroTaskSelect") ? $("pomodoroTaskSelect").value : "";
        pomodoroState.intervalId = setInterval(pomodoroTick, 1000);
        pomodoroState.running = true;
    }
    updatePomodoroDisplay();
}
function pomodoroReset(){
    clearInterval(pomodoroState.intervalId);
    pomodoroState.running = false;
    pomodoroState.mode = "focus";
    pomodoroState.remaining = pomodoroState.workMins * 60;
    updatePomodoroDisplay();
}
function pomodoroSkip(){
    pomodoroState.remaining = 0;
    pomodoroTick();
}

function initPomodoro(){
    try{
        const saved = JSON.parse(localStorage.getItem("pomodoroSettings"));
        if(saved){ pomodoroState.workMins = saved.workMins || 25; pomodoroState.breakMins = saved.breakMins || 5; }
    }catch(e){}
    pomodoroState.remaining = pomodoroState.workMins * 60;
    if($("pomodoroWorkMins")) $("pomodoroWorkMins").value = pomodoroState.workMins;
    if($("pomodoroBreakMins")) $("pomodoroBreakMins").value = pomodoroState.breakMins;

    const toggle = $("pomodoroToggle"), widget = $("pomodoroWidget");
    if(toggle && widget) toggle.addEventListener("click", () => widget.classList.toggle("collapsed"));

    const startPauseBtn = $("pomodoroStartPause");
    if(startPauseBtn) startPauseBtn.addEventListener("click", pomodoroStartPause);
    const resetBtn = $("pomodoroReset");
    if(resetBtn) resetBtn.addEventListener("click", pomodoroReset);
    const skipBtn = $("pomodoroSkip");
    if(skipBtn) skipBtn.addEventListener("click", pomodoroSkip);

    const saveSettingsBtn = $("pomodoroSaveSettings");
    if(saveSettingsBtn) saveSettingsBtn.addEventListener("click", () => {
        const work = Math.max(1, Number($("pomodoroWorkMins").value) || 25);
        const brk = Math.max(1, Number($("pomodoroBreakMins").value) || 5);
        pomodoroState.workMins = work; pomodoroState.breakMins = brk;
        if(!pomodoroState.running){
            pomodoroState.mode = "focus";
            pomodoroState.remaining = work * 60;
        }
        try{ localStorage.setItem("pomodoroSettings", JSON.stringify({ workMins:work, breakMins:brk })); }catch(e){}
        updatePomodoroDisplay();
        showToast("⏱ Pomodoro settings saved", "#27ae60");
    });

    refreshPomodoroTaskSelect();
    updatePomodoroDisplay();
}


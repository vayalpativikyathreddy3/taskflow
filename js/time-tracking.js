/*==================== TIME TRACKING ====================*/
function startTimer(taskId){
    const task = tasks.find(t => t.id === taskId);
    if(!task || task.timerRunning) return;

    // only one task can run at a time — pause any other running timer first
    tasks.forEach(t => { if(t.timerRunning && t.id !== taskId) pauseTimer(t.id); });

    task.timerRunning = true;
    task.timerStartedAt = Date.now();
    addActivity("▶ Started timer: " + task.name);
    saveTasks();
    displayTasks();
}

function pauseTimer(taskId){
    const task = tasks.find(t => t.id === taskId);
    if(!task || !task.timerRunning) return;

    task.timeSpent += Date.now() - task.timerStartedAt;
    task.timerRunning = false;
    task.timerStartedAt = null;
    addActivity("⏸ Paused timer: " + task.name + " (" + formatWorkedTime(task.timeSpent) + " total)");
    saveTasks();
    displayTasks();
}

function adjustTime(taskId, deltaMinutes){
    const task = tasks.find(t => t.id === taskId);
    if(!task) return;
    task.timeSpent = Math.max(0, task.timeSpent + deltaMinutes * 60000);
    addActivity(`${deltaMinutes > 0 ? "➕" : "➖"} Adjusted time on "${task.name}" (${deltaMinutes > 0 ? "+" : ""}${deltaMinutes}m, now ${formatWorkedTime(task.timeSpent)})`);
    saveTasks();
    displayTasks();
    updateDashboard();
}

function formatWorkedTime(ms){
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if(hours === 0 && minutes === 0) return "0m";
    if(hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}

function tickRunningTimers(){
    const runningTasks = tasks.filter(t => t.timerRunning);
    if(!runningTasks.length) return;

    runningTasks.forEach(task => {
        const el = document.querySelector(`.timer-display[data-timer-for="${task.id}"]`);
        if(!el) return;
        const elapsed = task.timeSpent + (Date.now() - task.timerStartedAt);
        el.textContent = "⏱ " + formatWorkedTime(elapsed);
    });
}

function initTimeTracking(){
    setInterval(tickRunningTimers, 1000);
}

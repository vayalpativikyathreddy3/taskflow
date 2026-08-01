/*==================== SUBTASKS ====================*/
function addSubtask(taskId, inputEl){
    const task = tasks.find(t => t.id === taskId);
    if(!task) return;

    const text = inputEl.value.trim();
    if(!text) return;

    if(!Array.isArray(task.subtasks)) task.subtasks = [];
    task.subtasks.push({ id: Date.now(), text, done: false });

    addActivity(`☑ Added subtask "${text}" to: ${task.name}`);
    saveTasks();
    displayTasks();
    updateDashboard();
}

function toggleSubtask(taskId, subtaskId){
    const task = tasks.find(t => t.id === taskId);
    if(!task) return;
    const sub = (task.subtasks || []).find(s => s.id === subtaskId);
    if(!sub) return;

    sub.done = !sub.done;
    saveTasks();
    displayTasks();
    updateDashboard();
}

function deleteSubtask(taskId, subtaskId){
    const task = tasks.find(t => t.id === taskId);
    if(!task) return;
    task.subtasks = (task.subtasks || []).filter(s => s.id !== subtaskId);
    saveTasks();
    displayTasks();
    updateDashboard();
}

function subtaskProgress(task){
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    if(!subtasks.length) return null;
    const done = subtasks.filter(s => s.done).length;
    return { done, total: subtasks.length, percent: Math.round((done / subtasks.length) * 100) };
}

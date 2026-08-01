/*==================== ADD / CLEAR ====================*/
async function readFileAsDataURL(file){
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function addTask(){
    const name = taskInput.value.trim();
    if(name === ""){ showToast("⚠ Please enter a task", "#f39c12"); return; }

    const tags = (taskTags && taskTags.value.trim())
        ? taskTags.value.split(",").map(t => t.trim()).filter(Boolean)
        : [];

    let attachments = [];
    const files = taskAttachments && taskAttachments.files ? Array.from(taskAttachments.files) : [];
    if(files.length){
        const MAX_TOTAL = 4 * 1024 * 1024; // ~4MB, keeps well under localStorage limits
        let totalSize = files.reduce((s,f) => s + f.size, 0);
        if(totalSize > MAX_TOTAL){
            showToast("⚠ Attachments too large (max ~4MB total). Task added without them.", "#f39c12");
        } else {
            try{
                attachments = await Promise.all(files.map(async f => ({
                    name: f.name, size: f.size, type: f.type,
                    dataUrl: await readFileAsDataURL(f)
                })));
            }catch(e){
                showToast("⚠ Couldn't read attachments.", "#e74c3c");
            }
        }
    }

    tasks.push({
        id: Date.now(), name,
        startDate: startDate.value, startTime: startTime.value,
        deadlineDate: deadlineDate.value, deadlineTime: deadlineTime.value,
        priority: priority.value, category: category.value.trim(),
        repeat: repeatTask.value,
        completed: false, completedDate: "",
        pinned: false,
        tags, notes: taskNotes ? taskNotes.value.trim() : "",
        attachments,
        kanbanStatus: "todo",
        notifiedDueSoon: false,
        subtasks: [],
        timeSpent: 0,
        timerRunning: false,
        timerStartedAt: null
    });

    addActivity("➕ Added: " + name);
    saveTasks(); clearInputs();
    displayTasks(); displayActivities(); updateDashboard(); renderCalendar(); renderProjects();
    refreshTagFilter(); renderKanban(); refreshPomodoroTaskSelect();
    showToast("✅ Task Added Successfully", "#27ae60");
}
function clearInputs(){
    taskInput.value=""; startDate.value=""; startTime.value=""; deadlineDate.value=""; deadlineTime.value="";
    priority.value = "Medium";
    if(activeProjects().length) category.value = activeProjects()[0].name;
    repeatTask.value = "none";
    if(taskTags) taskTags.value = "";
    if(taskNotes) taskNotes.value = "";
    if(taskAttachments) taskAttachments.value = "";
}

/*==================== DISPLAY TASKS ====================*/
function displayTasks(){
    taskList.innerHTML = "";

    const search = searchInput.value.toLowerCase().trim();
    const categorySearch = categoryFilter.value.toLowerCase().trim();
    const status = statusFilter.value;
    const sort = sortTasks.value;

    const tagSearch = tagFilter ? tagFilter.value.trim() : "";

    let filtered = [...tasks].filter(t => t.name.toLowerCase().includes(search));
    if(categorySearch !== "") filtered = filtered.filter(t => t.category.toLowerCase() === categorySearch);
    if(tagSearch !== "") filtered = filtered.filter(t => Array.isArray(t.tags) && t.tags.includes(tagSearch));
    if(status === "Completed") filtered = filtered.filter(t => t.completed);
    else if(status === "Pending") filtered = filtered.filter(t => !t.completed);
    else if(status === "Overdue") filtered = filtered.filter(t => !t.completed && t.deadlineDate &&
        new Date(t.deadlineDate + " " + (t.deadlineTime || "23:59")) < new Date());

    if(sort === "name") filtered.sort((a,b) => a.name.localeCompare(b.name));
    else if(sort === "priority"){ const order={High:1,Medium:2,Low:3}; filtered.sort((a,b)=>order[a.priority]-order[b.priority]); }
    else if(sort === "date") filtered.sort((a,b)=> !a.deadlineDate?1 : !b.deadlineDate?-1 : new Date(a.deadlineDate)-new Date(b.deadlineDate));

    if(selectedDate){
        filtered = filtered.filter(
            task=>task.deadlineDate===selectedDate
        );
    }

    filtered.sort((a,b)=>{
        if(a.pinned===b.pinned) return 0;
        return a.pinned ? -1 : 1;
    });

    if(filtered.length === 0){
        taskList.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No tasks found. Add one above to get started!</p></div>`;
        return;
    }

    filtered.forEach((task, index) => {
        const li = document.createElement("li");
        li.draggable = true;

li.dataset.id = task.id;

li.addEventListener("dragstart", dragStart);

li.addEventListener("dragover", dragOver);

li.addEventListener("drop", dropTask);

li.addEventListener("dragend", dragEnd);
        const borderColor = task.priority === "High" ? "#ef4444" : task.priority === "Medium" ? "#f59e0b" : "#22c55e";
        li.style.borderLeftColor = borderColor;
        li.style.animationDelay = (index * 0.04) + "s";
        li.dataset.taskId = task.id;

        const isOverdue = !task.completed && task.deadlineDate &&
            new Date(task.deadlineDate + " " + (task.deadlineTime || "23:59")) < new Date();
        const statusClass = task.completed ? "completed" : isOverdue ? "overdue" : "active";
        const statusLabel = task.completed ? "✓ Completed" : isOverdue ? "⚠ Overdue" : "⏳ Pending";
        if(isOverdue) li.classList.add("overdue-row");
        const dueSoon = !task.completed &&
    task.deadlineDate &&
    (() => {
        const diff = new Date(
            task.deadlineDate + " " + (task.deadlineTime || "23:59")
        ) - new Date();

        return diff > 0 && diff <= 86400000;
    })();

if(dueSoon){

    li.classList.add("due-soon");

}
        if(task.completed) li.classList.add("completed-task");
        if(task.pinned){

    li.classList.add("pinned-task");

}

        const dateLabel = task.deadlineDate
            ? `📅 ${task.deadlineDate}${task.deadlineTime ? " · 🕒 " + task.deadlineTime : ""}`
            : "📅 No deadline";

        const tagChips = Array.isArray(task.tags) && task.tags.length
            ? `<div class="task-sub">${task.tags.map(t => `<span class="tag-chip">#${escapeHtml(t)}</span>`).join("")}</div>`
            : "";
        const notesPreview = task.notes
            ? `<div class="task-notes-preview">📝 ${renderNotesMarkdown(task.notes)}</div>`
            : "";
        const historyEntries = (typeof activities !== "undefined" ? activities : [])
            .filter(a => a.action.includes(task.name)).slice(0, 6);
        const historyToggle = `<button type="button" class="task-history-toggle" onclick="toggleTaskHistory(${task.id})">🕓 History</button>
            <div class="task-history-panel" id="taskHistory-${task.id}" hidden>
                ${historyEntries.length
                    ? historyEntries.map(h => `<span>${escapeHtml(h.action)} — ${escapeHtml(h.time)}</span>`).join("")
                    : "<span>No recorded history yet.</span>"}
            </div>`;
        const attachmentChips = Array.isArray(task.attachments) && task.attachments.length
            ? `<div class="task-attachments">${task.attachments.map(a =>
                `<a class="attachment-chip" href="${a.dataUrl}" download="${escapeHtml(a.name)}">📎 ${escapeHtml(a.name)}</a>`
              ).join("")}</div>`
            : "";

        const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
        const subtaskDone = subtasks.filter(s => s.done).length;
        const subtaskBadge = subtasks.length
            ? `<span class="subtask-count">☑ ${subtaskDone}/${subtasks.length}</span>`
            : "";
        const subtaskPanel = `
            <div class="subtask-panel">
                <ul class="subtask-list">
                    ${subtasks.map(s => `
                        <li class="subtask-item ${s.done ? "done" : ""}">
                            <button class="subtask-check" onclick="toggleSubtask(${task.id}, ${s.id})">${s.done ? "☑" : "☐"}</button>
                            <span class="subtask-text">${escapeHtml(s.text)}</span>
                            <button class="subtask-remove" onclick="deleteSubtask(${task.id}, ${s.id})">✕</button>
                        </li>`).join("")}
                </ul>
                <div class="subtask-add-row">
                    <input type="text" class="subtask-add-input" placeholder="Add a subtask" onkeypress="if(event.key==='Enter') addSubtask(${task.id}, this)">
                    <button class="subtask-add-btn" onclick="addSubtask(${task.id}, this.previousElementSibling)">+</button>
                </div>
            </div>`;

        const workedLabel = formatWorkedTime(task.timeSpent + (task.timerRunning ? Date.now() - task.timerStartedAt : 0));
        const timerControls = `
            <div class="task-timer">
                <span class="timer-display" data-timer-for="${task.id}">⏱ ${workedLabel}</span>
                ${task.timerRunning
                    ? `<button class="timer-btn" title="Pause" onclick="pauseTimer(${task.id})">⏸</button>`
                    : `<button class="timer-btn" title="Start" onclick="startTimer(${task.id})">▶</button>`}
                <button class="timer-btn" title="Add 15 minutes manually" onclick="adjustTime(${task.id}, 15)">+15m</button>
                <button class="timer-btn" title="Remove 15 minutes" onclick="adjustTime(${task.id}, -15)">-15m</button>
            </div>`;

        li.innerHTML = `
            <button class="task-checkbox ${task.completed ? "checked" : ""}" onclick="toggleTask(event, ${task.id})">${task.completed ? "✓" : ""}</button>
            <div class="task-main">
                <div class="task-title">${escapeHtml(task.name)}</div>
                <div class="task-sub">
                    ${task.category ? `<span class="tag-pill" style="background:${colorFor(task.category)}">${escapeHtml(task.category)}</span>` : ""}
                    <span>${dateLabel}</span>
                    <span>⏳ ${getRemainingTime(task)}</span>
                    ${subtaskBadge}
                </div>
                ${tagChips}
                ${notesPreview}
                ${attachmentChips}
                ${subtaskPanel}
                ${timerControls}
                ${historyToggle}
            </div>
            <span class="priority-badge ${task.priority.toLowerCase()}">🚩 ${task.priority}</span>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
<div class="task-actions">

    <button
        class="icon-action act-pin"
        title="Pin"
        onclick="togglePin(${task.id})">

        ${task.pinned ? "📍" : "📌"}

    </button>

    <button
        class="icon-action act-done"
        title="${task.completed ? "Undo" : "Mark done"}"
        onclick="toggleTask(event, ${task.id})">

        ${task.completed ? "↩" : "✓"}

    </button>

    <button
        class="icon-action act-edit"
        onclick="startEditFlip(${task.id})">

        ✏

    </button>

    <button
        class="icon-action act-delete"
        onclick="deleteTask(${task.id})">

        🗑

    </button>

</div>
        `;

        taskList.appendChild(li);
    });
}

/*==================== TASK HISTORY (Phase 2) ====================*/
function toggleTaskHistory(id){
    const panel = document.getElementById(`taskHistory-${id}`);
    if(panel) panel.hidden = !panel.hidden;
}

/*==================== TOGGLE / DELETE ====================*/
function toggleTask(e, id){
    const task = tasks.find(t => t.id === id);
    if(!task) return;
    task.completed = !task.completed;
    if(task.completed){
        task.completedDate = new Date().toISOString().split("T")[0];
        task.kanbanStatus = "done";
        createRecurringTask(task);
    }else{
        task.completedDate = "";
        if(task.kanbanStatus === "done") task.kanbanStatus = "todo";
    }
    addActivity(task.completed ? "✅ Completed: " + task.name : "↩ Reopened: " + task.name);
    saveTasks();
    displayTasks(); displayActivities(); updateDashboard(); renderProjects();
    renderKanban(); renderAnalyticsCharts();

    if(task.completed && e){
        const x = e.clientX || window.innerWidth/2, y = e.clientY || window.innerHeight/2;
        burstConfetti(x, y, 40);
    }
}

function togglePin(id){
    const task = tasks.find(t => t.id === id);
    if(!task) return;
    task.pinned = !task.pinned;
    addActivity(
        task.pinned
            ? "📌 Pinned: " + task.name
            : "📍 Unpinned: " + task.name
    );
    saveTasks();
    displayTasks();
    displayActivities();
}

function deleteTask(id){
    const idx = tasks.findIndex(t => t.id === id);
    if(idx === -1) return;
    const [removed] = tasks.splice(idx, 1);
    addActivity("🗑 Deleted: " + removed.name);
    saveTasks();
    displayTasks(); displayActivities(); updateDashboard(); renderCalendar(); renderProjects();
    refreshTagFilter(); renderKanban();

    showUndoToast(`🗑 Deleted "${removed.name}"`, () => {
        tasks.splice(idx, 0, removed);
        addActivity("↩ Restored: " + removed.name);
        saveTasks();
        displayTasks(); displayActivities(); updateDashboard(); renderCalendar(); renderProjects();
        refreshTagFilter(); renderKanban();
        showToast("↩ Task Restored", "#3498db");
    });
}

function clearCompleted(){
    const completed = tasks.filter(t => t.completed);
    if(completed.length === 0){ showToast("⚠ No completed tasks found.", "#f39c12"); return; }
    const snapshot = [...tasks];
    tasks = tasks.filter(t => !t.completed);
    addActivity(`🗑 Cleared ${completed.length} completed task(s)`);
    saveTasks();
    displayTasks(); displayActivities(); updateDashboard(); renderProjects();

    showUndoToast(`🗑 Cleared ${completed.length} completed task(s)`, () => {
        tasks = snapshot;
        addActivity("↩ Restored cleared tasks");
        saveTasks();
        displayTasks(); displayActivities(); updateDashboard(); renderProjects();
        showToast("↩ Tasks Restored", "#3498db");
    });
}

function createRecurringTask(task){

    if(task.repeat === "none") return;

    const nextTask = structuredClone(task);

    nextTask.id = Date.now();

    nextTask.completed = false;

    nextTask.completedDate = "";

    nextTask.kanbanStatus = "todo";

    nextTask.notifiedDueSoon = false;

    let nextDate = new Date(task.deadlineDate);

    switch(task.repeat){

        case "daily":
            nextDate.setDate(nextDate.getDate()+1);
            break;

        case "weekly":
            nextDate.setDate(nextDate.getDate()+7);
            break;

        case "monthly":
            nextDate.setMonth(nextDate.getMonth()+1);
            break;

        case "yearly":
            nextDate.setFullYear(nextDate.getFullYear()+1);
            break;
    }

    nextTask.deadlineDate =
        nextDate.toISOString().split("T")[0];

    tasks.push(nextTask);

    addActivity("🔁 Recurring task created: " + nextTask.name);

}
/*==================== INLINE EDIT (flip-style swap) ====================*/
function startEditFlip(id){
    const li = taskList.querySelector(`li[data-task-id="${id}"]`);
    const task = tasks.find(t => t.id === id);
    if(!li || !task) return;

    li.style.transition = "transform .18s ease";
    li.style.transform = "scaleY(0.05)";
    setTimeout(() => {
        li.innerHTML = `
        <div class="task-main" style="width:100%">
            <div class="task-form-row" style="margin-bottom:0;">
                <div class="field grow"><span>📝</span><input type="text" class="edit-name" value="${escapeHtml(task.name)}"></div>
                <div class="field"><span>🎯</span><input type="date" class="edit-deadlineDate" value="${task.deadlineDate||""}"></div>
                <div class="field"><span>⏰</span><input type="time" class="edit-deadlineTime" value="${task.deadlineTime||""}"></div>
                <div class="field"><span>🏷</span><select class="edit-category">${categoryOptionsHTML(task.category)}</select></div>
                <div class="field grow"><span>#</span><input type="text" class="edit-tags" value="${escapeHtml((task.tags||[]).join(", "))}" placeholder="tags, comma separated"></div>
                <div class="field"><span>🚩</span>
                    <select class="edit-priority">
                        <option value="High" ${task.priority==="High"?"selected":""}>High</option>
                        <option value="Medium" ${task.priority==="Medium"?"selected":""}>Medium</option>
                        <option value="Low" ${task.priority==="Low"?"selected":""}>Low</option>
                    </select>
                </div>
                <button class="icon-action act-delete" onclick="cancelEditFlip(${task.id})">✕</button>
                <button class="icon-action act-done" onclick="saveEditFlip(${task.id})">✓</button>
            </div>
        </div>`;
        li.style.transform = "scaleY(1)";
        const nameInput = li.querySelector(".edit-name");
        if(nameInput) nameInput.focus();
    }, 180);
}

function cancelEditFlip(id){ displayTasks(); }

function saveEditFlip(id){
    const li = taskList.querySelector(`li[data-task-id="${id}"]`);
    const task = tasks.find(t => t.id === id);
    if(!li || !task) return;

    const newName = li.querySelector(".edit-name").value.trim();
    task.name = newName || task.name;
    task.deadlineDate = li.querySelector(".edit-deadlineDate").value;
    task.deadlineTime = li.querySelector(".edit-deadlineTime").value;
    task.category = li.querySelector(".edit-category").value;
    task.priority = li.querySelector(".edit-priority").value;
    const tagsInput = li.querySelector(".edit-tags");
    if(tagsInput) task.tags = tagsInput.value.split(",").map(t => t.trim()).filter(Boolean);

    addActivity("✏ Edited: " + task.name);
    saveTasks();
    displayTasks(); displayActivities(); updateDashboard(); renderCalendar(); renderProjects();
    refreshTagFilter(); renderKanban();
    showToast("✏ Task Updated Successfully", "#3498db");
}


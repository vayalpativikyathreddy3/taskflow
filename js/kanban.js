/*==================== DRAG & DROP ====================*/

function dragStart(e){

    draggedTask = Number(this.dataset.id);

    this.classList.add("dragging");

}

function dragOver(e){

    e.preventDefault();

}

function dropTask(e){

    e.preventDefault();

    const target = Number(this.dataset.id);

    if(target===draggedTask) return;

    const from = tasks.findIndex(t=>t.id===draggedTask);

    const to = tasks.findIndex(t=>t.id===target);

    if(from<0 || to<0) return;

    const moved = tasks.splice(from,1)[0];

    tasks.splice(to,0,moved);

    saveTasks();

    displayTasks();

}

function dragEnd(){

    document.querySelectorAll(".dragging")

    .forEach(el=>el.classList.remove("dragging"));

}


/*=========================================================================
   KANBAN BOARD
=========================================================================*/
let draggedKanbanId = null;

function initKanban(){
    document.querySelectorAll(".kanban-col").forEach(col => {
        col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("drag-over"); });
        col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
        col.addEventListener("drop", e => {
            e.preventDefault();
            col.classList.remove("drag-over");
            if(draggedKanbanId == null) return;
            moveKanbanCard(draggedKanbanId, col.dataset.status);
            draggedKanbanId = null;
        });
    });
    renderKanban();
}

const KANBAN_STATUS_LABELS = { todo:"📝 To Do", inprogress:"🚧 In Progress", done:"✅ Done" };

function moveKanbanCard(taskId, newStatus){
    const task = tasks.find(t => t.id === taskId);
    if(!task) return;
    task.kanbanStatus = newStatus;
    task.completed = newStatus === "done";
    task.completedDate = task.completed ? new Date().toISOString().split("T")[0] : "";
    addActivity(`🔁 Moved "${task.name}" to ${KANBAN_STATUS_LABELS[newStatus].replace(/^\S+\s/,"")}`);
    saveTasks();
    renderKanban(); displayTasks(); displayActivities(); updateDashboard(); renderProjects(); renderAnalyticsCharts();
}

function kanbanCard(task){
    const div = document.createElement("div");
    div.className = "kanban-card";
    div.draggable = true;
    div.dataset.id = task.id;
    div.setAttribute("tabindex", "0");
    div.setAttribute("aria-label", `${task.name}, currently in ${KANBAN_STATUS_LABELS[task.kanbanStatus] || "To Do"}`);
    const dateLabel = task.deadlineDate ? `📅 ${task.deadlineDate}` : "";
    const moveOptions = Object.entries(KANBAN_STATUS_LABELS)
        .map(([key,label]) => `<option value="${key}" ${task.kanbanStatus===key?"selected":""}>${label}</option>`).join("");
    div.innerHTML = `
        <div class="kanban-card-title">${escapeHtml(task.name)}</div>
        <div class="kanban-card-meta">
            ${task.category ? `<span class="tag-pill" style="background:${colorFor(task.category)}">${escapeHtml(task.category)}</span>` : ""}
            <span>🚩 ${task.priority}</span>
            ${dateLabel ? `<span>${dateLabel}</span>` : ""}
        </div>
        <select class="kanban-card-move" aria-label="Move '${escapeHtml(task.name)}' to a different column" onclick="event.stopPropagation()" onchange="moveKanbanCard(${task.id}, this.value)">
            ${moveOptions}
        </select>
    `;
    div.addEventListener("dragstart", () => { draggedKanbanId = task.id; div.classList.add("dragging"); });
    div.addEventListener("dragend", () => div.classList.remove("dragging"));
    return div;
}

function renderKanban(){
    const cols = { todo: $("kanbanTodo"), inprogress: $("kanbanInprogress"), done: $("kanbanDone") };
    if(!cols.todo || !cols.inprogress || !cols.done) return;
    Object.values(cols).forEach(c => c.innerHTML = "");
    const counts = { todo:0, inprogress:0, done:0 };
    tasks.forEach(task => {
        const status = cols[task.kanbanStatus] ? task.kanbanStatus : "todo";
        cols[status].appendChild(kanbanCard(task));
        counts[status]++;
    });
    ["Todo","Inprogress","Done"].forEach(key => {
        const el = $("kanbanCount" + key);
        if(el) el.textContent = counts[key.toLowerCase()];
    });
    const colEmptyCopy = {
        todo: { icon:"🗂", text:"Nothing queued yet" },
        inprogress: { icon:"🚧", text:"Nothing in progress" },
        done: { icon:"🎉", text:"Nothing finished yet" }
    };
    Object.entries(cols).forEach(([key, el]) => {
        if(counts[key] === 0){
            const c = colEmptyCopy[key];
            el.innerHTML = `<div class="empty-state"><div class="empty-icon">${c.icon}</div><p>${c.text}</p></div>`;
        }
    });
}


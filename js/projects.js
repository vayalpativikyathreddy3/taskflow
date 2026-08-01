/*==================== PROJECTS (Module 1: complete) ====================*/
const defaultProjects = [
    { id:"personal", name:"Personal", icon:"📂", color:"#7c3aed", desc:"", archived:false },
    { id:"college",  name:"College",  icon:"🎓", color:"#3b82f6", desc:"", archived:false },
    { id:"office",   name:"Office",   icon:"💼", color:"#22c55e", desc:"", archived:false },
    { id:"youtube",  name:"YouTube",  icon:"🎬", color:"#ec4899", desc:"", archived:false },
    { id:"shopping", name:"Shopping", icon:"🛒", color:"#f59e0b", desc:"", archived:false }
];
const iconPickerChoices = ["📁","📂","🎯","💼","🎓","🏠","🛒","🎬","💻","📚","🏋","🎨","✈","💰","🩺","🍳","🎵","⚽","🌱","🐾","📸","🛠","📈","🧾"];
let projects = [];
let draggedProjectId = null;
let projectSearchTerm = "";
let showArchivedProjects = false;

function loadProjects(){
    const saved = localStorage.getItem("projects");
    if(saved){
        try{ projects = JSON.parse(saved); }
        catch(e){ projects = structuredClone(defaultProjects); }
    } else {
        projects = structuredClone(defaultProjects);
    }
    // Backfill fields for projects saved before this module existed.
    projects.forEach(p => {
        if(typeof p.desc !== "string") p.desc = "";
        if(typeof p.archived !== "boolean") p.archived = false;
    });
}
function saveProjects(){
    try{
        localStorage.setItem("projects", JSON.stringify(projects));
    }catch(e){ showToast("⚠ Storage is full.", "#e74c3c"); }
}

function projectFor(name){
    return projects.find(p => p.name === name);
}

// Fixed fallback palette, used only for legacy/unlisted category strings
// (e.g. imported data, or a project that was later deleted).
const fallbackPalette = ["#7c3aed","#3b82f6","#22c55e","#f59e0b","#ec4899","#06b6d4"];
function colorFor(cat){
    if(!cat) return "#64748b";
    const proj = projectFor(cat);
    if(proj) return proj.color;
    let hash = 0;
    for(let i=0;i<cat.length;i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    return fallbackPalette[Math.abs(hash) % fallbackPalette.length];
}

// Active (non-archived) projects — used everywhere a select/dropdown of
// "current" projects is needed, so archived projects don't clutter new-task forms.
function activeProjects(){
    return projects.filter(p => !p.archived);
}

function categoryOptionsHTML(selected){
    let list = activeProjects();
    if(selected && !list.some(p => p.name === selected)){
        const archivedMatch = projects.find(p => p.name === selected);
        if(archivedMatch) list = [...list, archivedMatch];
    }
    return list.map(p =>
        `<option value="${escapeHtml(p.name)}" ${p.name===selected ? "selected" : ""}>${p.icon} ${escapeHtml(p.name)}${p.archived?" (archived)":""}</option>`
    ).join("");
}

// Repopulates the Add Task category select and the task-list Filter select
// from the current projects list, preserving each one's current value where possible.
function refreshCategorySelects(){
    const active = activeProjects();
    const currentAdd = category.value;
    category.innerHTML = active.length
        ? categoryOptionsHTML(currentAdd)
        : `<option value="">No projects yet</option>`;
    if(active.length && !active.some(p => p.name === currentAdd)){
        category.value = active[0].name;
    }

    // Category filter includes archived projects too, so tasks in an archived
    // project can still be found and filtered.
    const currentFilter = categoryFilter.value;
    categoryFilter.innerHTML = `<option value="">All Projects</option>` +
        projects.map(p => `<option value="${escapeHtml(p.name)}" ${p.name===currentFilter?"selected":""}>${p.icon} ${escapeHtml(p.name)}${p.archived?" (archived)":""}</option>`).join("");
    categoryFilter.value = projects.some(p => p.name === currentFilter) ? currentFilter : "";
}

function refreshTagFilter(){
    if(!tagFilter) return;
    const current = tagFilter.value;
    const allTags = new Set();
    tasks.forEach(t => (t.tags || []).forEach(tag => allTags.add(tag)));
    const sorted = [...allTags].sort((a,b) => a.localeCompare(b));
    tagFilter.innerHTML = `<option value="">All Tags</option>` +
        sorted.map(tag => `<option value="${escapeHtml(tag)}" ${tag===current?"selected":""}>#${escapeHtml(tag)}</option>`).join("");
    if(!sorted.includes(current)) tagFilter.value = "";
}

function projectTaskStats(name){
    const projTasks = tasks.filter(t => t.category === name);
    const total = projTasks.length;
    const completed = projTasks.filter(t => t.completed).length;
    const overdue = projTasks.filter(t => !t.completed && t.deadlineDate &&
        new Date(t.deadlineDate + " " + (t.deadlineTime || "23:59")) < new Date()).length;
    const percent = total > 0 ? Math.round((completed/total)*100) : 0;
    return { total, completed, overdue, percent };
}

function renderProjectStatsBar(){
    const bar = $("projectStatsBar");
    if(!bar) return;
    const totalProjects = projects.length;
    const archivedCount = projects.filter(p => p.archived).length;
    const totalTasks = tasks.length;
    const avgCompletion = totalProjects
        ? Math.round(projects.reduce((sum,p) => sum + projectTaskStats(p.name).percent, 0) / totalProjects)
        : 0;
    const busiest = [...projects].sort((a,b) => projectTaskStats(b.name).total - projectTaskStats(a.name).total)[0];

    bar.innerHTML = `
        <div class="pstat"><strong>${totalProjects}</strong><span>Projects${archivedCount ? ` (${archivedCount} archived)` : ""}</span></div>
        <div class="pstat"><strong>${totalTasks}</strong><span>Total Tasks</span></div>
        <div class="pstat"><strong>${avgCompletion}%</strong><span>Avg. Completion</span></div>
        <div class="pstat"><strong>${busiest ? escapeHtml(busiest.name) : "—"}</strong><span>Busiest Project</span></div>
    `;
}

function renderProjects(){
    const list = $("projectsList");
    if(!list) return;
    renderProjectStatsBar();

    let visible = [...projects];
    if(!showArchivedProjects) visible = visible.filter(p => !p.archived);
    if(projectSearchTerm) visible = visible.filter(p => p.name.toLowerCase().includes(projectSearchTerm));

    if(projects.length === 0){
        list.innerHTML = `<p class="muted">No projects yet. Add one below.</p>`;
        return;
    }
    if(visible.length === 0){
        list.innerHTML = `<p class="muted">No projects match your search/filter.</p>`;
        return;
    }

    list.innerHTML = "";
    visible.forEach(p => {
        const stats = projectTaskStats(p.name);
        const row = document.createElement("div");
        row.className = "project-row" + (p.archived ? " archived-row" : "");
        row.dataset.id = p.id;
        row.draggable = true;
        row.innerHTML = `
            <span class="project-drag-handle" title="Drag to reorder">⠿</span>
            <span class="project-swatch" style="background:${p.color}"></span>
            <span class="project-icon">${p.icon}</span>
            <div class="project-body">
                <div class="project-name-row">
                    <span class="project-name">${escapeHtml(p.name)}</span>
                    ${p.archived ? `<span class="project-badge">Archived</span>` : ""}
                    ${stats.overdue > 0 ? `<span class="project-badge overdue-badge">${stats.overdue} overdue</span>` : ""}
                    <span class="project-count">${stats.completed}/${stats.total} done · ${stats.percent}%</span>
                </div>
                ${p.desc ? `<div class="project-desc">${escapeHtml(p.desc)}</div>` : ""}
                <div class="project-progress-track"><div class="project-progress-fill" style="width:${stats.percent}%;background:${p.color}"></div></div>
            </div>
            <div class="project-actions">
                <button class="icon-action" title="View tasks" onclick="viewProjectTasks('${escapeHtml(p.name)}')">👁</button>
                <button class="icon-action" title="${p.archived ? "Unarchive" : "Archive"}" onclick="toggleArchiveProject('${p.id}')">${p.archived ? "📤" : "📥"}</button>
                <button class="icon-action act-edit" title="Rename" onclick="startEditProject('${p.id}')">✏</button>
                <button class="icon-action act-delete" title="Delete" onclick="deleteProject('${p.id}')">🗑</button>
            </div>
        `;
        row.addEventListener("dragstart", () => { draggedProjectId = p.id; row.classList.add("dragging"); });
        row.addEventListener("dragend", () => row.classList.remove("dragging"));
        row.addEventListener("dragover", e => e.preventDefault());
        row.addEventListener("drop", e => {
            e.preventDefault();
            if(draggedProjectId == null || draggedProjectId === p.id) return;
            const from = projects.findIndex(pr => pr.id === draggedProjectId);
            const to = projects.findIndex(pr => pr.id === p.id);
            if(from < 0 || to < 0) return;
            const [moved] = projects.splice(from, 1);
            projects.splice(to, 0, moved);
            saveProjects();
            renderProjects();
            draggedProjectId = null;
        });
        list.appendChild(row);
    });
}

function viewProjectTasks(name){
    categoryFilter.value = name;
    displayTasks();
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    const tasksNav = document.querySelector('.nav-item[data-target="tasksPanel"]');
    if(tasksNav) tasksNav.classList.add("active");
    $("tasksPanel").scrollIntoView({ behavior:"smooth", block:"start" });
    showToast(`📂 Showing tasks in "${name}"`, "#3b82f6");
}

function toggleArchiveProject(id){
    const proj = projects.find(p => p.id === id);
    if(!proj) return;
    proj.archived = !proj.archived;
    saveProjects();
    renderProjects(); refreshCategorySelects(); displayTasks();
    showToast(proj.archived ? `📥 Archived "${proj.name}"` : `📤 Unarchived "${proj.name}"`, "#3b82f6");
}

function addProject(){
    const name = projectNameInput.value.trim();
    if(!name){ showToast("⚠ Enter a project name", "#f39c12"); return; }
    if(projects.some(p => p.name.toLowerCase() === name.toLowerCase())){
        showToast("⚠ That project already exists", "#f39c12"); return;
    }
    const icon = (projectIconInput.value || "").trim() || "📁";
    const color = projectColorInput.value || "#7c3aed";
    const desc = $("projectDescInput") ? $("projectDescInput").value.trim() : "";

    projects.push({ id: "p" + Date.now(), name, icon, color, desc, archived:false });
    saveProjects();

    projectNameInput.value = "";
    projectIconInput.value = "";
    projectColorInput.value = "#7c3aed";
    if($("projectDescInput")) $("projectDescInput").value = "";

    renderProjects();
    refreshCategorySelects();
    displayTasks();
    showToast("✅ Project Added", "#27ae60");
}

function deleteProject(id){
    const idx = projects.findIndex(p => p.id === id);
    if(idx === -1) return;
    const [removed] = projects.splice(idx, 1);
    saveProjects();
    renderProjects(); refreshCategorySelects(); displayTasks();

    const affected = tasks.filter(t => t.category === removed.name).length;
    showUndoToast(`🗑 Deleted "${removed.name}"${affected ? ` (${affected} task(s) kept their project tag)` : ""}`, () => {
        projects.splice(idx, 0, removed);
        saveProjects();
        renderProjects(); refreshCategorySelects(); displayTasks();
        showToast("↩ Project Restored", "#3498db");
    });
}

function startEditProject(id){
    const row = document.querySelector(`.project-row[data-id="${id}"]`);
    const proj = projects.find(p => p.id === id);
    if(!row || !proj) return;
    row.innerHTML = `
        <input type="text" class="edit-project-name" value="${escapeHtml(proj.name)}" placeholder="Name">
        <input type="text" class="edit-project-icon" value="${escapeHtml(proj.icon)}" maxlength="2" placeholder="📁">
        <input type="color" class="edit-project-color" value="${proj.color}">
        <input type="text" class="edit-project-desc" value="${escapeHtml(proj.desc||"")}" placeholder="Description">
        <div class="project-actions">
            <button class="icon-action act-delete" title="Cancel" onclick="renderProjects()">✕</button>
            <button class="icon-action act-done" title="Save" onclick="saveEditProject('${id}')">✓</button>
        </div>
    `;
}

function saveEditProject(id){
    const row = document.querySelector(`.project-row[data-id="${id}"]`);
    const proj = projects.find(p => p.id === id);
    if(!row || !proj) return;

    const newName = row.querySelector(".edit-project-name").value.trim();
    const newIcon = row.querySelector(".edit-project-icon").value.trim() || "📁";
    const newColor = row.querySelector(".edit-project-color").value;
    const newDesc = row.querySelector(".edit-project-desc") ? row.querySelector(".edit-project-desc").value.trim() : proj.desc;

    if(newName && newName.toLowerCase() !== proj.name.toLowerCase() &&
       projects.some(p => p.id !== id && p.name.toLowerCase() === newName.toLowerCase())){
        showToast("⚠ Another project already has that name", "#f39c12");
        return;
    }

    if(newName && newName !== proj.name){
        // Categories are stored on tasks by name, so keep them pointed at the renamed project.
        tasks.forEach(t => { if(t.category === proj.name) t.category = newName; });
        saveTasks();
    }
    proj.name = newName || proj.name;
    proj.icon = newIcon;
    proj.color = newColor;
    proj.desc = newDesc;
    saveProjects();

    renderProjects(); refreshCategorySelects(); displayTasks();
    showToast("✏ Project Updated", "#3498db");
}

function initProjectToolbar(){
    const searchInput = $("projectSearchInput");
    if(searchInput) searchInput.addEventListener("input", () => {
        projectSearchTerm = searchInput.value.trim().toLowerCase();
        renderProjects();
    });
    const archiveToggle = $("showArchivedToggle");
    if(archiveToggle) archiveToggle.addEventListener("change", () => {
        showArchivedProjects = archiveToggle.checked;
        renderProjects();
    });

    const iconInput = $("projectIconInput");
    const iconMenu = $("iconPickerMenu");
    if(iconInput && iconMenu){
        iconMenu.innerHTML = iconPickerChoices.map(ic => `<button type="button">${ic}</button>`).join("");
        iconInput.addEventListener("click", e => { e.stopPropagation(); iconMenu.classList.toggle("show"); });
        iconMenu.addEventListener("click", e => {
            if(e.target.tagName === "BUTTON"){
                iconInput.value = e.target.textContent;
                iconMenu.classList.remove("show");
            }
        });
        document.addEventListener("click", () => iconMenu.classList.remove("show"));
    }
}


/*=========================================================================
   MOBILE NAV DRAWER + KEYBOARD SHORTCUTS (Phase 1 polish)
=========================================================================*/
function openSidebar(){
    const sidebar = $("sidebar"), overlay = $("sidebarOverlay"), btn = $("hamburgerBtn");
    if(!sidebar) return;
    sidebar.classList.add("open");
    if(overlay) overlay.classList.add("show");
    if(btn) btn.setAttribute("aria-expanded", "true");
}
function closeSidebar(){
    const sidebar = $("sidebar"), overlay = $("sidebarOverlay"), btn = $("hamburgerBtn");
    if(!sidebar) return;
    sidebar.classList.remove("open");
    if(overlay) overlay.classList.remove("show");
    if(btn) btn.setAttribute("aria-expanded", "false");
}

function openShortcutsModal(){
    const overlay = $("shortcutsOverlay");
    if(overlay) overlay.classList.add("show");
}
function closeShortcutsModal(){
    const overlay = $("shortcutsOverlay");
    if(overlay) overlay.classList.remove("show");
}

function initMobileNavAndShortcuts(){
    const hamburgerBtn = $("hamburgerBtn");
    const overlay = $("sidebarOverlay");
    const shortcutsBtn = $("shortcutsBtn");
    const shortcutsClose = $("shortcutsCloseBtn");
    const shortcutsOverlay = $("shortcutsOverlay");

    if(hamburgerBtn) hamburgerBtn.addEventListener("click", () => {
        const sidebar = $("sidebar");
        if(sidebar && sidebar.classList.contains("open")) closeSidebar(); else openSidebar();
    });
    if(overlay) overlay.addEventListener("click", closeSidebar);

    // Close the drawer automatically once a nav item is chosen (mobile)
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => { if(window.innerWidth <= 900) closeSidebar(); });
    });

    if(shortcutsBtn) shortcutsBtn.addEventListener("click", openShortcutsModal);
    if(shortcutsClose) shortcutsClose.addEventListener("click", closeShortcutsModal);
    if(shortcutsOverlay) shortcutsOverlay.addEventListener("click", (e) => {
        if(e.target === shortcutsOverlay) closeShortcutsModal();
    });

    const navTargets = ["dashboardTop","tasksPanel","calendarPanel","projectsPanel","kanbanPanel","analyticsPanel","activityPanel","aiPanel","settingsPanel"];

    document.addEventListener("keydown", (e) => {
        const tag = document.activeElement ? document.activeElement.tagName : "";
        const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (document.activeElement && document.activeElement.isContentEditable);

        if(e.key === "Escape"){
            closeShortcutsModal();
            closeSidebar();
            if($("actionsMenu")) $("actionsMenu").classList.remove("show");
            if(typing && document.activeElement) document.activeElement.blur();
            return;
        }

        if(typing) return;

        if(e.key === "n" || e.key === "N"){
            e.preventDefault();
            const target = $("tasksPanel") || $("createTaskPanel");
            if(target) target.scrollIntoView({ behavior:"smooth", block:"start" });
            if($("taskInput")) $("taskInput").focus();
            return;
        }

        if(e.key === "?"){
            e.preventDefault();
            openShortcutsModal();
            return;
        }

        if(/^[1-9]$/.test(e.key)){
            const idx = Number(e.key) - 1;
            const id = navTargets[idx];
            if(id){
                const target = $(id);
                if(target) target.scrollIntoView({ behavior:"smooth", block:"start" });
                const navBtn = document.querySelector(`.nav-item[data-target="${id}"]`);
                if(navBtn){
                    document.querySelectorAll(".nav-item").forEach(b => { b.classList.remove("active"); b.removeAttribute("aria-current"); });
                    navBtn.classList.add("active");
                    navBtn.setAttribute("aria-current", "page");
                }
            }
        }
    });
}

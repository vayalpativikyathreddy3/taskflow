/*==================== TOAST ====================*/
function showToast(message, color="#27ae60"){
    toast.textContent = message;
    toast.style.background = color;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}
function showUndoToast(message, undoCallback, duration=5000){
    toast.innerHTML = `<span>${escapeHtml(message)}</span> <button style="margin-left:12px;border:none;background:rgba(255,255,255,.25);color:#fff;padding:6px 12px;border-radius:8px;font-weight:700;cursor:pointer;" class="undo-btn">Undo</button>`;
    toast.style.background = "#334155";
    toast.classList.add("show");
    let resolved = false;
    const btn = toast.querySelector(".undo-btn");
    const timer = setTimeout(() => toast.classList.remove("show"), duration);
    btn.onclick = () => {
        if(resolved) return;
        resolved = true;
        clearTimeout(timer);
        toast.classList.remove("show");
        undoCallback();
    };
}

/*==================== COUNTDOWN ====================*/
function getRemainingTime(task){
    if(!task.deadlineDate) return "No deadline";
    const deadline = new Date(task.deadlineDate + " " + (task.deadlineTime || "23:59"));
    const diff = deadline - new Date();
    if(diff <= 0) return "Deadline passed";
    const days = Math.floor(diff/86400000), hours = Math.floor((diff%86400000)/3600000), minutes = Math.floor((diff%3600000)/60000);
    return days > 0 ? `${days}d ${hours}h left` : `${hours}h ${minutes}m left`;
}


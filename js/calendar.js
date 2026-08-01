/*==================== CALENDAR ====================*/
function renderCalendar(){
    const year = calViewDate.getFullYear();
    const month = calViewDate.getMonth();
    calLabel.textContent = calViewDate.toLocaleDateString("en-US", { month:"long", year:"numeric" });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear()===year && today.getMonth()===month;

    const taskDates = new Set(tasks.filter(t=>t.deadlineDate).map(t=>t.deadlineDate));

    let html = ["S","M","T","W","T","F","S"].map(d=>`<div class="cal-dow">${d}</div>`).join("");

    for(let i=firstDay-1;i>=0;i--){
        html += `<div class="cal-day muted">${daysInPrevMonth-i}</div>`;
    }
for(let d=1; d<=daysInMonth; d++){

    const isToday = isCurrentMonth && d===today.getDate();

    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

    const hasTask = taskDates.has(dateStr);
    const isSelected = selectedDate === dateStr;

    html += `
        <div
            class="cal-day ${isToday?"today":""} ${isSelected?"selected":""}"
            data-date="${dateStr}"
            title="Click to filter tasks for ${dateStr}. Shift+click to quick-add a task due this day.">
            ${d}
            ${hasTask?'<span class="cal-dot"></span>':""}
        </div>
    `;

}
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for(let d=1; d<=remaining; d++){
        html += `<div class="cal-day muted">${d}</div>`;
    }

    calendarGrid.innerHTML = html;
    calendarGrid.querySelectorAll(".cal-day[data-date]")

.forEach(day=>{

    day.addEventListener("click",(e)=>{

        if(e.shiftKey){
            // Shift+click: jump to the task form with this date pre-filled (quick add)
            deadlineDate.value = day.dataset.date;
            const target = $("createTaskPanel");
            if(target) target.scrollIntoView({ behavior:"smooth", block:"start" });
            if(taskInput) taskInput.focus();
            showToast("📝 Quick-add: due date set to " + day.dataset.date, "#7c3aed");
            return;
        }

        selectedDate = selectedDate === day.dataset.date ? "" : day.dataset.date;

        displayTasks();
        renderCalendar();

        showToast(
            selectedDate ? "📅 Showing tasks for " + selectedDate : "📋 Showing all tasks",
            "#3b82f6"
        );

    });

});
}


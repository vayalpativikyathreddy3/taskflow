/*==================== EXPORT / IMPORT ====================*/
function exportTasksPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 22;

    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255,255,255);
    doc.setFontSize(22);
    doc.text("TaskFlow Report", 20, y);
    doc.setFontSize(10);
    doc.text("Generated: " + new Date().toLocaleString(), 20, y+8);

    y = 46;
    doc.setTextColor(30,30,30);
    doc.setFontSize(11);
    const completed = tasks.filter(t=>t.completed).length, pending = tasks.length - completed;
    doc.text("Total Tasks : " + tasks.length, 20, y); y += 8;
    doc.text("Completed : " + completed, 20, y); y += 8;
    doc.text("Pending : " + pending, 20, y); y += 14;

    const priorityColors = { High:[239,68,68], Medium:[245,158,11], Low:[34,197,94] };
    tasks.forEach((task, i) => {
        if(y > 265){ doc.addPage(); y = 20; }
        const [r,g,b] = priorityColors[task.priority] || [100,100,100];
        doc.setFillColor(r,g,b);
        doc.rect(20, y-4, 4, 12, "F");
        doc.setTextColor(30,30,30);
        doc.setFontSize(14);
        doc.text((i+1)+". "+task.name, 28, y+4); y += 10;
        doc.setFontSize(10);
        doc.setTextColor(90,90,90);
        doc.text("Category: "+(task.category||"General")+"   Priority: "+task.priority, 28, y); y += 6;
        doc.text("Status: "+(task.completed?"Completed":"Pending")+"   Deadline: "+(task.deadlineDate||"--")+" "+(task.deadlineTime||""), 28, y); y += 12;
    });

    doc.save("TaskFlow_Report.pdf");
    showToast("📄 PDF Exported Successfully!", "#27ae60");
    actionsMenu.classList.remove("show");
}

function exportTasksJSON(){
    const blob = new Blob([JSON.stringify({tasks, activities, projects}, null, 4)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "TaskFlow_Backup.json"; a.click();
    URL.revokeObjectURL(url);
    showToast("💾 JSON Exported Successfully", "#27ae60");
    actionsMenu.classList.remove("show");
}

importJson.addEventListener("change", function(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){
        try{
            const data = JSON.parse(ev.target.result);
            if(!Array.isArray(data.tasks)) throw new Error("Invalid backup");
            tasks = data.tasks;
            activities = Array.isArray(data.activities) ? data.activities : [];
            if(Array.isArray(data.projects) && data.projects.length){
                projects = data.projects;
                saveProjects();
            }
            tasks.forEach(t => {
                if(!Array.isArray(t.tags)) t.tags = [];
                if(typeof t.notes !== "string") t.notes = "";
                if(!Array.isArray(t.attachments)) t.attachments = [];
                if(!t.kanbanStatus) t.kanbanStatus = t.completed ? "done" : "todo";
            });
            saveTasks();
            displayTasks(); displayActivities(); updateDashboard(); renderCalendar();
            renderProjects(); refreshCategorySelects();
            refreshTagFilter(); renderKanban(); refreshPomodoroTaskSelect(); renderAnalyticsCharts();
            showToast("📂 Backup Imported Successfully", "#27ae60");
        }catch(err){
            showToast("❌ Invalid JSON File", "#e74c3c");
        }
        importJson.value = "";
    };
    reader.readAsText(file);
});


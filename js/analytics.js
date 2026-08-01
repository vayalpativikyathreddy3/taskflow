/*=========================================================================
   ADVANCED ANALYTICS (Chart.js)
=========================================================================*/
let chartInstances = {};

function chartTheme(){
    const dark = document.body.classList.contains("dark");
    return { text: dark ? "#94a3b8" : "#64748b", grid: dark ? "rgba(255,255,255,.06)" : "rgba(15,23,42,.06)" };
}

function upsertChart(id, config){
    const canvas = $(id);
    if(!canvas || typeof Chart === "undefined") return;
    if(chartInstances[id]) chartInstances[id].destroy();
    chartInstances[id] = new Chart(canvas.getContext("2d"), config);
}

function initAnalytics(){ renderAnalyticsCharts(); }

function renderAnalyticsCharts(){
    if(typeof Chart === "undefined") return;
    const theme = chartTheme();
    const baseOptions = {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ labels:{ color:theme.text } } },
        scales:{
            x:{ ticks:{ color:theme.text }, grid:{ color:theme.grid } },
            y:{ ticks:{ color:theme.text }, grid:{ color:theme.grid } }
        }
    };

    // Priority breakdown
    const priorityCounts = { High:0, Medium:0, Low:0 };
    tasks.forEach(t => { if(priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++; });
    upsertChart("chartPriority", {
        type:"doughnut",
        data:{ labels:Object.keys(priorityCounts), datasets:[{ data:Object.values(priorityCounts), backgroundColor:["#ef4444","#f59e0b","#22c55e"] }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:theme.text } } } }
    });

    // Status overview
    const completed = tasks.filter(t=>t.completed).length;
    const overdue = tasks.filter(t=>!t.completed && t.deadlineDate && new Date(t.deadlineDate+" "+(t.deadlineTime||"23:59")) < new Date()).length;
    const pending = tasks.length - completed - overdue;
    upsertChart("chartStatus", {
        type:"doughnut",
        data:{ labels:["Completed","Pending","Overdue"], datasets:[{ data:[completed, Math.max(pending,0), overdue], backgroundColor:["#22c55e","#3b82f6","#ef4444"] }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:theme.text } } } }
    });

    // Tasks by project
    const byProject = {};
    projects.forEach(p => byProject[p.name] = 0);
    tasks.forEach(t => { if(t.category){ byProject[t.category] = (byProject[t.category]||0)+1; } });
    upsertChart("chartProjects", {
        type:"bar",
        data:{ labels:Object.keys(byProject), datasets:[{ label:"Tasks", data:Object.values(byProject),
            backgroundColor: Object.keys(byProject).map(colorFor) }] },
        options:{ ...baseOptions, plugins:{ legend:{ display:false } } }
    });

    // Completions last 7 days
    const days = [];
    const dayLabels = [];
    for(let i=6;i>=0;i--){
        const d = new Date(); d.setDate(d.getDate()-i);
        const key = d.toISOString().split("T")[0];
        days.push(key);
        dayLabels.push(d.toLocaleDateString("en-US",{ weekday:"short" }));
    }
    const trendData = days.map(day => tasks.filter(t => t.completed && t.completedDate === day).length);
    upsertChart("chartTrend", {
        type:"line",
        data:{ labels:dayLabels, datasets:[{ label:"Completed", data:trendData, borderColor:"#7c3aed",
            backgroundColor:"rgba(124,58,237,.15)", tension:.35, fill:true }] },
        options:{ ...baseOptions, plugins:{ legend:{ display:false } } }
    });

    // Focus session stats
    const focus = getFocusStats();
    const todayKey = new Date().toISOString().split("T")[0];
    if($("focusSessionsToday")) $("focusSessionsToday").textContent = (focus.byDay[todayKey] || 0);
    if($("focusSessionsTotal")) $("focusSessionsTotal").textContent = focus.totalSessions;
    if($("focusMinutesTotal")) $("focusMinutesTotal").textContent = focus.totalMinutes;
}


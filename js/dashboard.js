/*==================== GREETING / CLOCK ====================*/
let lastGreetingWord = "";
function updateGreeting(){
    const now = new Date();
    const hour = now.getHours();
    const greetWord = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

    if(greetWord !== lastGreetingWord){
        $("greeting").textContent = `${greetWord}! 👋`;
        lastGreetingWord = greetWord;
    }
    $("todayDate").textContent = now.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });
    $("currentTime").textContent = now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
}

/*==================== DASHBOARD ====================*/
function updateDashboard(){
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    const today = new Date(); today.setHours(0,0,0,0);
    const highPriority = tasks.filter(t => t.priority === "High" && !t.completed).length;
    const overdue = tasks.filter(t => {
        if(t.completed || !t.deadlineDate) return false;
        const d = new Date(t.deadlineDate); d.setHours(0,0,0,0);
        return d < today;
    }).length;
    const dueToday = tasks.filter(t => {
        if(t.completed || !t.deadlineDate) return false;
        const d = new Date(t.deadlineDate); d.setHours(0,0,0,0);
        return d.getTime() === today.getTime();
    }).length;

    const dueSoon = tasks.filter(t => {

    if (t.completed || !t.deadlineDate) return false;

    const deadline = new Date(
        t.deadlineDate + " " + (t.deadlineTime || "23:59")
    );

    const diff = deadline - new Date();

    return diff > 0 && diff <= 86400000;

}).length;

    animateCounter(totalTasks, total);
    animateCounter(completedTasks, completed);
    animateCounter(pendingTasks, pending);
    animateCounter($("highTasks"), highPriority);
    animateCounter($("overdueTasks"), overdue);
    animateCounter($("todayTasks"), dueToday);

    $("heroSub").textContent = pending > 0
        ? `You have ${pending} task${pending===1?"":"s"} pending. Let's make today productive!`
        : total > 0 ? "All caught up! Great work. 🎉" : "Add your first task to get started!";

    notifBadge.textContent = overdue + dueSoon;
    if(dueSoon > 0){

    showToast(
        `⏰ ${dueSoon} task${dueSoon>1?"s are":" is"} due within 24 hours`,
        "#f59e0b"
    );

}
    notifBadge.style.display = overdue > 0 ? "flex" : "none";

    const percent = total > 0 ? Math.round((completed/total)*100) : 0;
    progressRing.style.background = `conic-gradient(var(--primary) ${percent}%, var(--card-2) ${percent}%)`;
    ringPercent.textContent = percent + "%";
    progressHint.textContent = total === 0 ? "Add a task to get started!" : percent === 100 ? "All done! 🎉" : "Keep going, you're doing great.";

    if(total > 0 && completed === total){
        if(!allCompleteCelebrated){ allCompleteCelebrated = true; launchConfetti(); }
    } else {
        allCompleteCelebrated = false;
    }
    updateWeeklyAnalytics();
    updateStreak();
    if(typeof renderAnalyticsCharts === "function") renderAnalyticsCharts();
    if(typeof refreshPomodoroTaskSelect === "function") refreshPomodoroTaskSelect();
}
/*==================== WEEKLY ANALYTICS ====================*/

function updateWeeklyAnalytics(){

    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(sevenDaysAgo.getDate()-7);

    const completedLastWeek = tasks.filter(task=>{

        if(!task.completed || !task.completedDate)

            return false;

        return new Date(task.completedDate)>=sevenDaysAgo;

    }).length;

    const productivity = tasks.length===0

        ?0

        :Math.round(

            (completedLastWeek/tasks.length)*100

        );

    $("progressHint").textContent =

        `📈 Weekly Productivity : ${productivity}%`;

}

/*==================== ANIMATED COUNTERS ====================*/

function animateCounter(element, target){

    if(!element) return;

    const start = Number(element.textContent) || 0;

    const duration = 500;

    const startTime = performance.now();

    function update(now){

        const progress = Math.min((now - startTime) / duration, 1);

        element.textContent = Math.round(
            start + (target - start) * progress
        );

        if(progress < 1){

            requestAnimationFrame(update);

        }

    }

    requestAnimationFrame(update);

}

/*==================== PRODUCTIVITY STREAK ====================*/

function updateStreak(){

    const completedDates = tasks
        .filter(task => task.completed && task.completedDate)
        .map(task => task.completedDate)
        .sort()
        .reverse();

    let streak = 0;
    let today = new Date();

    for(let i = 0; i < completedDates.length; i++){

        const date = new Date(completedDates[i]);

        const diff = Math.floor(
            (today - date) / 86400000
        );

        if(diff === streak){

            streak++;

        }else{

            break;

        }

    }

    currentStreak = streak;

    const streakText = $("streakText");

    if(streakText){

        streakText.textContent =
            `🔥 ${streak} Day Streak`;

    }

}


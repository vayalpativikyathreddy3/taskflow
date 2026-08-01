/*=========================================================================
   AI PRODUCTIVITY ASSISTANT — free, local, rule-based
   Runs entirely in the browser over the user's own task data.
   No API key, no account, no external requests of any kind.
=========================================================================*/
function appendAiMessage(role, text){
    const log = $("aiChatLog");
    if(!log) return;
    const div = document.createElement("div");
    div.className = "ai-msg " + role;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

function localTaskAnalysis(){
    const now = new Date();
    const pending = tasks.filter(t => !t.completed);
    const withDeadline = t => t.deadlineDate ? new Date(t.deadlineDate + " " + (t.deadlineTime || "23:59")) : null;
    const overdue = pending.filter(t => { const d = withDeadline(t); return d && d < now; });
    const dueSoon = pending.filter(t => { const d = withDeadline(t); return d && d >= now && (d - now) <= 86400000; });
    const order = { High:1, Medium:2, Low:3 };
    const ranked = [...pending].sort((a,b) => {
        const aOver = overdue.includes(a) ? 0 : 1, bOver = overdue.includes(b) ? 0 : 1;
        if(aOver !== bOver) return aOver - bOver;
        const aSoon = dueSoon.includes(a) ? 0 : 1, bSoon = dueSoon.includes(b) ? 0 : 1;
        if(aSoon !== bSoon) return aSoon - bSoon;
        if(order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
        const ad = withDeadline(a), bd = withDeadline(b);
        if(ad && bd) return ad - bd;
        if(ad) return -1; if(bd) return 1;
        return 0;
    });
    return { pending, overdue, dueSoon, ranked };
}

function localAiRespond(userText){
    const text = userText.toLowerCase();
    const { pending, overdue, dueSoon, ranked } = localTaskAnalysis();

    if(pending.length === 0){
        return "You have no pending tasks — everything's clear! 🎉";
    }

    if(text.includes("prioritiz") || text.includes("what to do") || text.includes("today") || text.includes("plan my day")){
        const top = ranked.slice(0, 5);
        let out = "Here's a suggested order, based on overdue status, due date, and priority:\n\n";
        top.forEach((t, i) => {
            const d = t.deadlineDate ? ` (due ${t.deadlineDate}${t.deadlineTime ? " " + t.deadlineTime : ""})` : "";
            const flag = overdue.includes(t) ? " ⚠ overdue" : dueSoon.includes(t) ? " ⏰ due soon" : "";
            out += `${i+1}. ${t.name} — 🚩${t.priority}${d}${flag}\n`;
        });
        if(pending.length > 5) out += `\n...and ${pending.length - 5} more pending task(s).`;
        return out;
    }

    if(text.includes("summar") || text.includes("workload")){
        const byProject = {};
        pending.forEach(t => { byProject[t.category || "Uncategorized"] = (byProject[t.category || "Uncategorized"] || 0) + 1; });
        const projLines = Object.entries(byProject).map(([p,c]) => `${p}: ${c}`).join(", ");
        return `You have ${pending.length} pending task(s) across your projects (${projLines || "none"}).\n` +
               `${overdue.length} are overdue, ${dueSoon.length} are due within 24 hours.\n` +
               `${pending.filter(t=>t.priority==="High").length} are marked High priority.`;
    }

    if(text.includes("risk") || text.includes("overdue") || text.includes("at risk")){
        if(overdue.length === 0 && dueSoon.length === 0) return "Nothing's overdue or due within 24 hours — you're in good shape. ✅";
        let out = "";
        if(overdue.length) out += `⚠ Overdue (${overdue.length}):\n` + overdue.map(t => `- ${t.name} (was due ${t.deadlineDate})`).join("\n") + "\n\n";
        if(dueSoon.length) out += `⏰ Due within 24h (${dueSoon.length}):\n` + dueSoon.map(t => `- ${t.name} (due ${t.deadlineDate} ${t.deadlineTime||""})`).join("\n");
        return out.trim();
    }

    if(text.includes("schedule") || text.includes("plan my day") || text.includes("time-block") || text.includes("time block")){
        const top = ranked.slice(0, 6);
        if(!top.length) return "Nothing pending to schedule — enjoy the clear day! 🎉";
        const blockLength = { High: 60, Medium: 40, Low: 25 };
        let cursor = new Date(); cursor.setHours(9, 0, 0, 0);
        const rows = top.map(t => {
            const startLabel = cursor.toLocaleTimeString([], { hour:"numeric", minute:"2-digit" });
            const mins = blockLength[t.priority] || 30;
            cursor = new Date(cursor.getTime() + mins * 60000);
            const endLabel = cursor.toLocaleTimeString([], { hour:"numeric", minute:"2-digit" });
            cursor = new Date(cursor.getTime() + 10 * 60000);
            return `${startLabel}–${endLabel}: ${t.name} (🚩${t.priority})`;
        });
        return "Here's a suggested time-blocked schedule for today (adjust to fit your real calendar):\n\n" +
            rows.map((r,i) => `${i+1}. ${r}`).join("\n") +
            "\n\nBuilt with short breaks between blocks — pair it with the Pomodoro timer if you want structured focus sessions.";
    }

    if(text.includes("weekly") || text.includes("week summary") || text.includes("this week")){
        const now2 = new Date();
        const weekAgo = new Date(now2.getTime() - 7 * 86400000);
        const completedThisWeek = tasks.filter(t => t.completed && t.completedDate && new Date(t.completedDate) >= weekAgo);
        const addedThisWeek = tasks.filter(t => t.id >= weekAgo.getTime());
        const byProjectDone = {};
        completedThisWeek.forEach(t => { byProjectDone[t.category || "Uncategorized"] = (byProjectDone[t.category || "Uncategorized"] || 0) + 1; });
        const projLines = Object.entries(byProjectDone).map(([p,c]) => `${p}: ${c}`).join(", ") || "none";
        return `📈 Weekly summary (last 7 days):\n` +
               `- Completed: ${completedThisWeek.length} task(s) — ${projLines}\n` +
               `- Added: ${addedThisWeek.length} new task(s)\n` +
               `- Still pending: ${pending.length} (${overdue.length} overdue)\n` +
               (completedThisWeek.length > addedThisWeek.length
                   ? "You're clearing your backlog faster than you're adding to it — nice momentum! 🚀"
                   : "You're adding tasks faster than finishing them this week — might be worth a triage pass.");
    }

    if(text.includes("break") || text.includes("subtask") || text.includes("split")){
        const target = ranked.find(t => t.priority === "High") || ranked[0];
        if(!target) return "No pending tasks to break down.";
        return `Here's a generic breakdown for "${target.name}":\n` +
               `1. Clarify the exact outcome/definition of done\n` +
               `2. List what you need (info, tools, people) before starting\n` +
               `3. Do the core work in one focused block (try the Pomodoro timer)\n` +
               `4. Review/check your own work\n` +
               `5. Deliver, submit, or mark it complete\n\n` +
               `Tip: add these as separate tasks with the "${target.name}" tag so they stay linked.`;
    }

    // fallback: general status
    const top = ranked.slice(0, 3).map(t => t.name).join(", ");
    return `Here's what I can tell from your data:\n` +
           `${pending.length} pending, ${overdue.length} overdue, ${dueSoon.length} due soon.\n` +
           `Top priority right now: ${top || "nothing pending"}.\n\n` +
           `Try the quick-action buttons above (Prioritize / Summarize / Risks / Break down / Plan my day / Weekly summary).`;
}

function sendAiMessage(userText){
    appendAiMessage("user", userText);
    const reply = localAiRespond(userText);
    appendAiMessage("assistant", reply);
}

function initAiAssistant(){
    document.querySelectorAll(".ai-quick-btn").forEach(btn => {
        btn.addEventListener("click", () => sendAiMessage(btn.dataset.prompt));
    });

    const sendBtn = $("aiSendBtn"), input = $("aiChatInput");
    if(sendBtn) sendBtn.addEventListener("click", () => {
        const text = input.value.trim();
        if(!text) return;
        input.value = "";
        sendAiMessage(text);
    });
    if(input) input.addEventListener("keypress", e => {
        if(e.key === "Enter"){
            const text = input.value.trim();
            if(!text) return;
            input.value = "";
            sendAiMessage(text);
        }
    });
}

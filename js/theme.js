/*==================== THEME ====================*/
if(localStorage.getItem("theme") === "light"){
    document.body.classList.remove("dark");
    themeToggle.innerHTML = '☀ Light <span class="chev">▾</span>';
}
function toggleTheme(){
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.innerHTML = isDark ? '🌙 Dark <span class="chev">▾</span>' : '☀ Light <span class="chev">▾</span>';
    if(typeof renderAnalyticsCharts === "function") renderAnalyticsCharts();
}


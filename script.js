/*==================== TASKFLOW — LANDING PAGE ====================*/

// fade sections in as they scroll into view
const revealTargets = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting){
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

revealTargets.forEach(el => revealObserver.observe(el));

// mobile nav toggle
const navBurger = document.getElementById("navBurger");
const navLinks = document.getElementById("navLinks");

if(navBurger && navLinks){
    navBurger.addEventListener("click", () => {
        const open = navLinks.classList.toggle("open");
        navBurger.classList.toggle("active", open);
    });

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => navLinks.classList.remove("open"));
    });
}

/*=========================================================================
   PREMIUM EFFECTS: loading screen, mouse glow, particles, confetti
=========================================================================*/
window.addEventListener("load", () => {
    setTimeout(() => { $("loadingScreen").classList.add("hide"); }, 700);
});

function launchConfetti(){
    burstConfetti(window.innerWidth/2, window.innerHeight*0.3, 140);
    showToast("🎉 All Tasks Completed! Great job!", "#7c3aed");
}

function burstConfetti(x, y, count=60){
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = $("confettiCanvas");
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;

    const colors = ["#7c3aed","#3b82f6","#22c55e","#f59e0b","#ef4444","#ec4899"];
    let particles = Array.from({length:count}, () => ({
        x, y,
        vx:(Math.random()-0.5)*9,
        vy:Math.random()*-8-3,
        gravity:0.28,
        size:Math.random()*6+4,
        color:colors[Math.floor(Math.random()*colors.length)],
        rotation:Math.random()*360,
        rotationSpeed:(Math.random()-0.5)*12,
        life:1
    }));

    function frame(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        particles.forEach(p => {
            p.vy += p.gravity; p.x += p.vx; p.y += p.vy; p.rotation += p.rotationSpeed; p.life -= 0.012;
            ctx.save();
            ctx.translate(p.x,p.y);
            ctx.rotate(p.rotation*Math.PI/180);
            ctx.globalAlpha = Math.max(p.life,0);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
            ctx.restore();
        });
        particles = particles.filter(p => p.life > 0 && p.y < canvas.height+50);
        if(particles.length > 0) requestAnimationFrame(frame);
        else ctx.clearRect(0,0,canvas.width,canvas.height);
    }
    frame();
}

(function initMouseGlow(){
    const glow = $("mouseGlow");
    if(!glow || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let rafId=null, targetX=window.innerWidth/2, targetY=window.innerHeight/2;
    document.addEventListener("mousemove", e => {
        targetX=e.clientX; targetY=e.clientY; glow.classList.add("active");
        if(!rafId) rafId = requestAnimationFrame(render);
    });
    document.addEventListener("mouseleave", () => glow.classList.remove("active"));
    function render(){ glow.style.left=targetX+"px"; glow.style.top=targetY+"px"; rafId=null; }
})();

(function initParticles(){
    const canvas = $("particleCanvas");
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width, height, particles;
    const COUNT = 50;

    function resize(){ width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
    function createParticles(){
        particles = Array.from({length:COUNT}, () => ({
            x:Math.random()*width, y:Math.random()*height, r:Math.random()*2+0.6,
            vx:(Math.random()-0.5)*0.2, vy:(Math.random()-0.5)*0.2, alpha:Math.random()*0.4+0.15
        }));
    }
    function draw(){
        ctx.clearRect(0,0,width,height);
        particles.forEach(p => {
            p.x+=p.vx; p.y+=p.vy;
            if(p.x<0) p.x=width; if(p.x>width) p.x=0; if(p.y<0) p.y=height; if(p.y>height) p.y=0;
            ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
            ctx.fillStyle = `rgba(139,146,255,${p.alpha})`; ctx.fill();
        });
        if(!reduced) requestAnimationFrame(draw);
    }
    resize(); createParticles(); draw();
    window.addEventListener("resize", () => { resize(); createParticles(); if(reduced) draw(); });
})();


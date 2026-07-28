/* ==========================================================================
   ROMANTIC APOLOGY & BIRTHDAY SURPRISE WEBSITE - SCRIPT
   ========================================================================== */

// --- CONFIGURATION BLOCK ---
// Feel free to edit these values to customize the website!
const CONFIG = {
    // The date when your love story/relationship started (for the Love Counter)
    loveStartDate: "2024-05-14T00:00:00", 
    
    // Optional custom MP3 URL (e.g. "assets/song.mp3" or any online URL). 
    // If left empty, the site will automatically generate beautiful romantic ambient music using Web Audio API!
    customMp3Url: "", 
    
    // Typewriter text animation speeds (in milliseconds per character)
    typewriterSpeedApology: 70,
    typewriterSpeedSurprise: 50,
};

// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Global State
let audioContext = null;
let loveSynth = null;
let bgMusic = null;
let isMusicPlaying = false;
let canvasManager = null;
let apologyTypewriterStarted = false;
let surpriseTypewriterStarted = false;
let bdayConfettiTriggered = false;

/* ==========================================================================
   1. Preloader & Page Init
   ========================================================================== */
window.addEventListener("DOMContentLoaded", () => {
    // Initialize Love Counter
    initLoveCounter();
    
    // Initialize Canvas Particle System
    canvasManager = new CanvasParticleManager();
    canvasManager.start();
    
    // Loader Fade-Out
    const loader = document.getElementById("loader");
    setTimeout(() => {
        loader.style.opacity = 0;
        setTimeout(() => {
            loader.classList.add("hidden");
        }, 500);
    }, 1500);
    
    // Setup Lock Screen Unlock Button
    const unlockBtn = document.getElementById("unlock-btn");
    unlockBtn.addEventListener("click", () => {
        unlockHeart();
    });

    // Setup Music Toggle Button
    const musicBtn = document.getElementById("music-btn");
    musicBtn.addEventListener("click", toggleMusic);

    // Setup Interactive Cake Candles
    initBirthdayCake();

    // Setup Interactive Click Heart
    initInteractiveHeart();
    
    // Setup Memory Gallery & Lightbox
    initMemoryGallery();

    // Setup Scroll Animations
    setupScrollTriggerAnimations();

    // Setup Final Surprise Button
    initFinalSurprise();
});

/* ==========================================================================
   2. Lock Screen Unlock & Audio Controller
   ========================================================================== */
function unlockHeart() {
    const lockScreen = document.getElementById("lock-screen");
    const mainContent = document.getElementById("main-content");
    const musicBtn = document.getElementById("music-btn");
    
    // 1. Play unlock sound/transition on lock screen
    gsap.to(".lock-card", {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
            lockScreen.classList.add("hidden");
            mainContent.classList.remove("hidden");
            musicBtn.classList.remove("hidden");
            
            // Trigger layout reflow
            window.dispatchEvent(new Event('resize'));
            
            // 2. Initialize Audio & Play Music
            initAudio();
            playMusic();
            
            // 3. Fade in main content & trigger Section 1 Typewriter
            gsap.fromTo(mainContent, 
                { opacity: 0 }, 
                { opacity: 1, duration: 1.5, ease: "power2.out", onComplete: () => {
                    startApologyTypewriter();
                }}
            );
        }
    });
}

function initAudio() {
    // Initialize Web Audio API context for synth
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    
    if (CONFIG.customMp3Url) {
        // Load external MP3 source
        bgMusic = new Audio(CONFIG.customMp3Url);
        bgMusic.loop = true;
    } else {
        // Create custom synthesized ambient loop
        loveSynth = new AmbientLoveSynth(audioContext);
    }
}

function playMusic() {
    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }
    
    if (bgMusic) {
        bgMusic.play().catch(e => console.log("Audio autoplay restriction: ", e));
    } else if (loveSynth) {
        loveSynth.start();
    }
    
    isMusicPlaying = true;
    updateMusicButtonUI();
}

function pauseMusic() {
    if (bgMusic) {
        bgMusic.pause();
    } else if (loveSynth) {
        loveSynth.stop();
    }
    isMusicPlaying = false;
    updateMusicButtonUI();
}

function toggleMusic() {
    if (isMusicPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

function updateMusicButtonUI() {
    const playIcon = document.querySelector(".play-icon");
    const pauseIcon = document.querySelector(".pause-icon");
    const tooltip = document.querySelector(".music-tooltip");
    
    if (isMusicPlaying) {
        playIcon.classList.add("hidden");
        pauseIcon.classList.remove("hidden");
        tooltip.textContent = "Pause Music 🎵";
    } else {
        playIcon.classList.remove("hidden");
        pauseIcon.classList.add("hidden");
        tooltip.textContent = "Play Music 🎵";
    }
}

/* ==========================================================================
   3. Web Audio API Romantic Ambient Synth
   ========================================================================== */
class AmbientLoveSynth {
    constructor(ctx) {
        this.ctx = ctx;
        this.mainGain = null;
        this.delayNode = null;
        this.activeOscillators = [];
        this.chordInterval = null;
        this.chimeTimeout = null;
        this.isPlaying = false;
        
        // Romantic Chord Progression: Fmaj7 -> G6 -> Em7 -> Am7
        this.chords = [
            { roots: [87.31, 174.61], notes: [174.61, 220.00, 261.63, 329.63] }, // Fmaj7 (F3, A3, C4, E4)
            { roots: [98.00, 196.00], notes: [196.00, 246.94, 293.66, 392.00] }, // G6 (G3, B3, D4, G4)
            { roots: [82.41, 164.81], notes: [164.81, 196.00, 246.94, 293.66] }, // Em7 (E3, G3, B3, D4)
            { roots: [110.00, 220.00], notes: [220.00, 261.63, 329.63, 392.00] } // Am7 (A3, C4, E4, G4)
        ];
        
        // Pentatonic Scale for chimes: C major pentatonic (C4, D4, E4, G4, A4, C5, D5, E5, G5, A5)
        this.pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
        
        this.currentChordIndex = 0;
    }
    
    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        
        // Create nodes
        this.mainGain = this.ctx.createGain();
        this.mainGain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Low volume background pad
        
        // Feedback Delay Effect for spacey vibe
        this.delayNode = this.ctx.createDelay();
        this.delayNode.delayTime.value = 0.6;
        const delayFeedback = this.ctx.createGain();
        delayFeedback.gain.value = 0.4;
        
        this.delayNode.connect(delayFeedback);
        delayFeedback.connect(this.delayNode);
        
        // Connect nodes to destination
        this.mainGain.connect(this.ctx.destination);
        this.mainGain.connect(this.delayNode);
        this.delayNode.connect(this.ctx.destination);
        
        // Start playing chord loops & random chimes
        this.playNextChord();
        this.chordInterval = setInterval(() => this.playNextChord(), 6000);
        
        this.scheduleChime();
    }
    
    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        
        clearInterval(this.chordInterval);
        clearTimeout(this.chimeTimeout);
        
        // Fade out all active sound quickly
        if (this.mainGain) {
            this.mainGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
        }
        
        setTimeout(() => {
            this.activeOscillators.forEach(osc => {
                try { osc.stop(); } catch(e) {}
            });
            this.activeOscillators = [];
        }, 1100);
    }

    setSoftMode() {
        // Decrease volume and make progression even slower for the final climax
        if (this.mainGain) {
            this.mainGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 3);
        }
    }
    
    playNextChord() {
        if (!this.isPlaying) return;
        
        const now = this.ctx.currentTime;
        const chord = this.chords[this.currentChordIndex];
        
        // Clean up completed oscillators
        this.activeOscillators = this.activeOscillators.filter(oscObj => {
            if (now > oscObj.stopTime) {
                try { oscObj.osc.stop(); } catch(e) {}
                return false;
            }
            return true;
        });
        
        // Play pad notes
        chord.notes.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            // Mellow triangle wave
            osc.type = "triangle";
            osc.frequency.value = freq;
            
            // Slow attack, long decay romantic pad curve
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 2); // Individual note volume
            gain.gain.setValueAtTime(0.3, now + 4);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 6);
            
            osc.connect(gain);
            gain.connect(this.mainGain);
            
            osc.start(now);
            this.activeOscillators.push({ osc, stopTime: now + 6 });
        });
        
        // Play soft base notes
        chord.roots.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = "sine"; // Smooth fundamental bass
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 2.5);
            gain.gain.setValueAtTime(0.2, now + 4.5);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 6);
            
            osc.connect(gain);
            gain.connect(this.mainGain);
            
            osc.start(now);
            this.activeOscillators.push({ osc, stopTime: now + 6 });
        });
        
        // Cycle to next chord
        this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
    }
    
    scheduleChime() {
        if (!this.isPlaying) return;
        
        // Play chime note after a random delay (1.5 - 3.5 seconds)
        const delay = 1500 + Math.random() * 2000;
        this.chimeTimeout = setTimeout(() => {
            this.playChimeNote();
            this.scheduleChime();
        }, delay);
    }
    
    playChimeNote() {
        if (!this.isPlaying) return;
        
        const now = this.ctx.currentTime;
        // Select random pentatonic note
        const freq = this.pentatonic[Math.floor(Math.random() * this.pentatonic.length)];
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const biquadFilter = this.ctx.createBiquadFilter();
        
        // Low pass filter to make it sound warm and music-box like
        biquadFilter.type = "lowpass";
        biquadFilter.frequency.value = 1200;
        
        osc.type = "sine";
        osc.frequency.value = freq;
        
        // Sharp pluck attack, long release
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3);
        
        osc.connect(biquadFilter);
        biquadFilter.connect(gain);
        gain.connect(this.mainGain);
        
        osc.start(now);
        this.activeOscillators.push({ osc, stopTime: now + 3.1 });
    }
    
    playClickSparkChime() {
        // High pitch spark chime sound on user interactions
        if (!this.isPlaying) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
        
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = "sine";
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);
            
            osc.connect(gain);
            gain.connect(this.mainGain);
            
            osc.start(time);
            this.activeOscillators.push({ osc, stopTime: time + 0.85 });
        });
    }
}

/* ==========================================================================
   4. Background Canvas Particle System
   ========================================================================== */
class CanvasParticleManager {
    constructor() {
        this.canvas = document.getElementById("bg-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.particles = [];
        this.width = 0;
        this.height = 0;
        this.animationFrameId = null;
        
        this.mode = "dreamy"; // "dreamy", "balloons", "stars"
        this.mouse = { x: -1000, y: -1000, active: false };
        
        this.resize();
        window.addEventListener("resize", () => this.resize());
        window.addEventListener("mousemove", (e) => this.updateMouse(e));
        window.addEventListener("mouseout", () => this.mouse.active = false);
    }
    
    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }
    
    updateMouse(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.mouse.active = true;
    }
    
    start() {
        this.loop();
    }
    
    stop() {
        cancelAnimationFrame(this.animationFrameId);
    }
    
    setMode(mode) {
        this.mode = mode;
        this.particles = []; // Clear particles during mode change
        if (mode === "stars") {
            // Generate stable background stars
            for (let i = 0; i < 150; i++) {
                this.particles.push(new TwinklingStar(this.width, this.height));
            }
        }
    }
    
    addExplosion(x, y, count = 35) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new SparkleHeart(x, y));
        }
    }
    
    addBalloons(count = 15) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new FloatingBalloon(this.width, this.height));
        }
    }

    triggerClimaxHearts() {
        // Fountain of hearts from the bottom
        setInterval(() => {
            if (this.mode === "stars") {
                this.particles.push(new ClimaxHeart(this.width, this.height));
            }
        }, 100);
    }
    
    loop() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Spawn default ambient particles depending on mode
        if (this.mode === "dreamy" && this.particles.filter(p => p.type === "ambient").length < 40) {
            this.particles.push(new AmbientParticle(this.width, this.height));
        }
        
        // Draw and update particles
        this.particles.forEach((p, idx) => {
            p.update(this.width, this.height, this.mouse);
            p.draw(this.ctx);
            
            // Remove dead particles
            if (p.isDead) {
                this.particles.splice(idx, 1);
            }
        });
        
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
}

// Particle Classes
class AmbientParticle {
    constructor(w, h) {
        this.type = "ambient";
        this.isDead = false;
        this.isHeart = Math.random() > 0.4;
        this.x = Math.random() * w;
        this.y = h + 20;
        this.size = 6 + Math.random() * 15;
        this.speedY = 0.5 + Math.random() * 1.2;
        this.speedX = -0.5 + Math.random() * 1;
        this.alpha = 0.15 + Math.random() * 0.45;
        this.rotation = Math.random() * Math.PI;
        this.rotSpeed = -0.01 + Math.random() * 0.02;
        this.color = Math.random() > 0.5 ? "255, 117, 140" : "186, 85, 211"; // Pink or Lavender
    }
    
    update(w, h, mouse) {
        this.y -= this.speedY;
        this.x += this.speedX + Math.sin(this.y / 30) * 0.2;
        this.rotation += this.rotSpeed;
        
        // Mouse avoidance/interaction
        if (mouse.active) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 100) {
                const force = (100 - dist) / 100;
                this.x += (dx / dist) * force * 5;
                this.y += (dy / dist) * force * 5;
            }
        }
        
        if (this.y < -30 || this.x < -30 || this.x > w + 30) {
            this.isDead = true;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = `rgb(${this.color})`;
        
        if (this.isHeart) {
            // Draw vector heart
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-this.size / 2, -this.size / 2, -this.size, -this.size / 4, -this.size, 0);
            ctx.bezierCurveTo(-this.size, this.size / 2, -this.size / 2, this.size, 0, this.size * 1.3);
            ctx.bezierCurveTo(this.size / 2, this.size, this.size, this.size / 2, this.size, 0);
            ctx.bezierCurveTo(this.size, -this.size / 4, this.size / 2, -this.size / 2, 0, 0);
            ctx.fill();
        } else {
            // Draw sparkling glowing circle
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
            grad.addColorStop(0, "rgba(255, 224, 130, 0.8)"); // Gold center
            grad.addColorStop(1, "rgba(255, 224, 130, 0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class SparkleHeart {
    constructor(x, y) {
        this.type = "explosion";
        this.isDead = false;
        this.x = x;
        this.y = y;
        this.size = 5 + Math.random() * 12;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed;
        this.gravity = 0.08;
        this.alpha = 1;
        this.fadeSpeed = 0.015 + Math.random() * 0.02;
        this.color = Math.random() > 0.5 ? "255, 60, 100" : "255, 179, 0"; // Pink or Gold
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = -0.05 + Math.random() * 0.1;
    }
    
    update() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotSpeed;
        this.alpha -= this.fadeSpeed;
        
        if (this.alpha <= 0) {
            this.isDead = true;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = `rgb(${this.color})`;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size / 2, -this.size / 2, -this.size, -this.size / 4, -this.size, 0);
        ctx.bezierCurveTo(-this.size, this.size / 2, -this.size / 2, this.size, 0, this.size * 1.3);
        ctx.bezierCurveTo(this.size / 2, this.size, this.size, this.size / 2, this.size, 0);
        ctx.bezierCurveTo(this.size, -this.size / 4, this.size / 2, -this.size / 2, 0, 0);
        ctx.fill();
        
        ctx.restore();
    }
}

class FloatingBalloon {
    constructor(w, h) {
        this.type = "balloon";
        this.isDead = false;
        this.size = 20 + Math.random() * 20;
        this.x = 50 + Math.random() * (w - 100);
        this.y = h + 50;
        this.speedY = 1.2 + Math.random() * 2;
        this.wobbleSpeed = 0.02 + Math.random() * 0.03;
        this.wobbleRange = 2 + Math.random() * 4;
        this.wobbleAngle = Math.random() * 100;
        
        // Beautiful bright colors
        const colors = [
            "255, 117, 140", // Pink
            "186, 85, 211",  // Violet
            "100, 181, 246", // Blue
            "255, 213, 79",  // Gold
            "129, 199, 132"  // Green
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = 0.8;
    }
    
    update(w, h) {
        this.y -= this.speedY;
        this.wobbleAngle += this.wobbleSpeed;
        this.x += Math.sin(this.wobbleAngle) * (this.wobbleRange / 10);
        
        if (this.y < -100) {
            this.isDead = true;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.strokeStyle = `rgba(${this.color}, 0.5)`;
        ctx.lineWidth = 1.5;
        
        // Draw balloon oval
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size * 0.8, this.size, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw balloon tie triangle at bottom
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.size);
        ctx.lineTo(this.x - 5, this.y + this.size + 8);
        ctx.lineTo(this.x + 5, this.y + this.size + 8);
        ctx.closePath();
        ctx.fill();
        
        // Draw wavy string
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.size + 8);
        ctx.quadraticCurveTo(this.x - 8, this.y + this.size + 25, this.x, this.y + this.size + 45);
        ctx.quadraticCurveTo(this.x + 8, this.y + this.size + 65, this.x - 2, this.y + this.size + 85);
        ctx.stroke();
        
        ctx.restore();
    }
}

class TwinklingStar {
    constructor(w, h) {
        this.type = "star";
        this.isDead = false;
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = 0.5 + Math.random() * 2;
        this.alpha = Math.random();
        this.twinkleSpeed = 0.01 + Math.random() * 0.03;
    }
    
    update() {
        this.alpha += this.twinkleSpeed;
        if (this.alpha > 1 || this.alpha < 0.2) {
            this.twinkleSpeed = -this.twinkleSpeed;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = "white";
        ctx.shadowColor = "white";
        ctx.shadowBlur = this.size * 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ClimaxHeart {
    constructor(w, h) {
        this.type = "climax";
        this.isDead = false;
        this.size = 8 + Math.random() * 18;
        this.x = Math.random() * w;
        this.y = h + 30;
        this.speedY = 1.5 + Math.random() * 3.5;
        this.speedX = -1 + Math.random() * 2;
        this.alpha = 0.8 + Math.random() * 0.2;
        this.rotation = Math.random() * Math.PI;
        this.rotSpeed = -0.02 + Math.random() * 0.04;
        
        const colors = ["255, 64, 129", "255, 110, 196", "225, 190, 231", "255, 238, 88"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(w, h) {
        this.y -= this.speedY;
        this.x += this.speedX + Math.sin(this.y / 40) * 0.5;
        this.rotation += this.rotSpeed;
        
        if (this.y < -50) {
            this.isDead = true;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = `rgb(${this.color})`;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size / 2, -this.size / 2, -this.size, -this.size / 4, -this.size, 0);
        ctx.bezierCurveTo(-this.size, this.size / 2, -this.size / 2, this.size, 0, this.size * 1.3);
        ctx.bezierCurveTo(this.size / 2, this.size, this.size, this.size / 2, this.size, 0);
        ctx.bezierCurveTo(this.size, -this.size / 4, this.size / 2, -this.size / 2, 0, 0);
        ctx.fill();
        
        ctx.restore();
    }
}

/* ==========================================================================
   5. Section 1 Apology - Typewriter & Heart Healing
   ========================================================================== */
function startApologyTypewriter() {
    if (apologyTypewriterStarted) return;
    apologyTypewriterStarted = true;
    
    const textBengali = 
`সবার আগে তোমার কাছে একটা বড় সরি।
আমি জানি, আমি তোমাকে রাত ১২টায় উইশ করতে পারিনি।
এটা আমার ভুল।
আমি সত্যিই খুব অনুতপ্ত।
বিশ্বাস করো,
আমি কখনোই তোমাকে অবহেলা করতে চাইনি।`;
    
    const typewriterEl = document.getElementById("typewriter-apology");
    let index = 0;
    
    function type() {
        if (index < textBengali.length) {
            typewriterEl.textContent += textBengali.charAt(index);
            index++;
            setTimeout(type, CONFIG.typewriterSpeedApology);
        } else {
            // Typewriter complete! Trigger heart healing
            healBrokenHeart();
        }
    }
    
    // Slight delay before typewriter starts typing
    setTimeout(type, 800);
}

function healBrokenHeart() {
    const leftHalf = document.getElementById("heart-left");
    const rightHalf = document.getElementById("heart-right");
    const apologyHeart = document.getElementById("apology-heart");
    
    // Remove sad classes and add healed classes to trigger morph transition
    leftHalf.classList.remove("sad");
    leftHalf.classList.add("healed");
    
    rightHalf.classList.remove("sad");
    rightHalf.classList.add("healed");
    
    // Trigger audio chime spark
    if (loveSynth) {
        loveSynth.playClickSparkChime();
    }
    
    // Sparkle explosion from the heart
    const bounds = apologyHeart.getBoundingClientRect();
    canvasManager.addExplosion(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 40);
    
    // Pulsing animation on the fully healed heart
    gsap.to(apologyHeart, {
        scale: 1.15,
        duration: 0.8,
        yoyo: true,
        repeat: -1,
        ease: "power1.inOut"
    });
}

/* ==========================================================================
   6. Section 3 Happy Birthday - Interactive Cake Candles
   ========================================================================== */
function initBirthdayCake() {
    const candles = document.querySelectorAll(".candle");
    
    candles.forEach(candle => {
        candle.addEventListener("click", () => {
            const isBlown = candle.getAttribute("data-blown") === "true";
            
            if (!isBlown) {
                // Play sound
                if (loveSynth) {
                    loveSynth.playClickSparkChime();
                }
                
                // Animate flame out
                const flames = candle.querySelectorAll(".flame, .flame-inner");
                gsap.to(flames, {
                    scale: 0,
                    opacity: 0,
                    duration: 0.4,
                    ease: "power2.in"
                });
                
                // Add tiny smoke particles / sparks
                const rect = candle.getBoundingClientRect();
                canvasManager.addExplosion(rect.left + rect.width / 2, rect.top, 15);
                
                // Set candle state
                candle.setAttribute("data-blown", "true");
                
                // Check if all candles are blown
                checkAllCandlesBlown();
            }
        });
    });
}

function checkAllCandlesBlown() {
    const candles = document.querySelectorAll(".candle");
    const allBlown = Array.from(candles).every(c => c.getAttribute("data-blown") === "true");
    
    if (allBlown && !bdayConfettiTriggered) {
        bdayConfettiTriggered = true;
        
        // Massive celebratory actions!
        // 1. Sparkle confetti explosions
        const cake = document.getElementById("birthday-cake");
        const rect = cake.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        canvasManager.addExplosion(centerX, centerY - 50, 75);
        
        // Trigger multiple explosions across the screen
        setTimeout(() => canvasManager.addExplosion(centerX - 150, centerY - 100, 30), 300);
        setTimeout(() => canvasManager.addExplosion(centerX + 150, centerY - 100, 30), 600);
        
        // 2. Launch balloons
        canvasManager.addBalloons(25);
        
        // 3. Play happy melody sound
        if (loveSynth) {
            loveSynth.playClickSparkChime();
        }
        
        // 4. Reveal Birthday Wishes text beautifully
        gsap.fromTo(".birthday-wishes", 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
        );
    }
}

/* ==========================================================================
   7. Section 4: Interactive Exploding Heart
   ========================================================================== */
function initInteractiveHeart() {
    const heartBtn = document.getElementById("interactive-heart-btn");
    const loveText = document.getElementById("interactive-love-text");
    
    const words = ["I Love You ❤️", "আজ...", "আগামীকাল...", "চিরকাল... ♾️"];
    let wordIdx = 0;
    let isTransitioning = false;
    
    heartBtn.addEventListener("click", () => {
        if (isTransitioning) return;
        isTransitioning = true;
        
        // 1. Play click sound
        if (loveSynth) {
            loveSynth.playClickSparkChime();
        }
        
        // 2. Sparkle explosion at heart position
        const rect = heartBtn.getBoundingClientRect();
        canvasManager.addExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, 45);
        
        // 3. Heart button animation click morph
        gsap.timeline()
            .to(heartBtn, { scale: 0.85, duration: 0.1 })
            .to(heartBtn, { scale: 1.1, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out" })
            .to(heartBtn, { scale: 1, duration: 0.2 });
            
        // 4. Sequentially reveal the text block
        gsap.to(loveText, {
            opacity: 0,
            scale: 0.8,
            duration: 0.3,
            onComplete: () => {
                loveText.textContent = words[wordIdx];
                
                gsap.fromTo(loveText, 
                    { opacity: 0, scale: 0.8 },
                    { opacity: 1, scale: 1.05, duration: 0.6, ease: "back.out(1.7)", onComplete: () => {
                        // Reset transitioning state
                        isTransitioning = false;
                        // Cycle index
                        wordIdx = (wordIdx + 1) % words.length;
                    }}
                );
            }
        });
    });
}

/* ==========================================================================
   8. Section 5: Memory Timeline Scroll Animations
   ========================================================================== */
function setupScrollTriggerAnimations() {
    // 1. Stagger reason cards fade up
    gsap.from(".reason-card", {
        scrollTrigger: {
            trigger: ".cards-grid",
            start: "top 80%",
            toggleActions: "play none none none"
        },
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out"
    });

    // 4. Elements fade up on scroll (reusable class)
    const fadeUpElements = document.querySelectorAll(".scroll-fade-up:not(.gallery-card)");
    fadeUpElements.forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none none"
            },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    // 5. Stagger gallery cards fade up & scale in
    gsap.from(".gallery-card", {
        scrollTrigger: {
            trigger: ".gallery-grid",
            start: "top 85%",
            toggleActions: "play none none none"
        },
        y: 60,
        scale: 0.95,
        opacity: 0,
        duration: 1.1,
        stagger: 0.15,
        ease: "power2.out"
    });
}

/* ==========================================================================
   9. Section 6: Love Counter Live Ticking
   ========================================================================== */
function initLoveCounter() {
    const daysEl = document.getElementById("counter-days");
    if (!daysEl) return;
    
    const startDate = new Date(CONFIG.loveStartDate);
    
    function updateCounter() {
        const now = new Date();
        const diffMs = now - startDate;
        
        if (diffMs < 0) {
            // Love date is in the future
            return;
        }
        
        // Calculate units
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        // Format with leading zero
        document.getElementById("counter-days").textContent = String(diffDays).padStart(2, '0');
        document.getElementById("counter-hours").textContent = String(diffHours).padStart(2, '0');
        document.getElementById("counter-minutes").textContent = String(diffMinutes).padStart(2, '0');
        document.getElementById("counter-seconds").textContent = String(diffSeconds).padStart(2, '0');
    }
    
    // Ticking
    updateCounter();
    setInterval(updateCounter, 1000);
}

/* ==========================================================================
   10. Section 7: Final Surprise & Climax Climax
   ========================================================================== */
function initFinalSurprise() {
    const nightOverlay = document.getElementById("night-overlay");
    const moon = document.getElementById("glowing-moon");
    const forgiveBtn = document.getElementById("forgive-btn");
    const thankYouModal = document.getElementById("thank-you-modal");
    const modalCloseBtn = document.getElementById("modal-close-btn");
    
    // Scroll trigger for transition to night starry sky
    ScrollTrigger.create({
        trigger: ".surprise-section",
        start: "top 60%",
        onEnter: () => {
            // Fade in night mode backdrop
            nightOverlay.style.opacity = 1;
            
            // Fade in glowing moon
            moon.classList.remove("hidden");
            setTimeout(() => moon.classList.add("visible"), 100);
            
            // Switch canvas to twinkle stars mode
            canvasManager.setMode("stars");
            
            // Trigger Stage 1 Typewriter Surprises
            startSurpriseTypewriter();
        }
    });

    // Forgive Me Button click climax
    forgiveBtn.addEventListener("click", () => {
        // 1. Play soft spark
        if (loveSynth) {
            loveSynth.playClickSparkChime();
            // Switch synthesizer to softer volume climax pad
            loveSynth.setSoftMode();
        }
        
        // 2. Explode thousands of hearts across screen
        canvasManager.triggerClimaxHearts();
        
        // 3. Show thank you modal
        thankYouModal.classList.remove("hidden");
        setTimeout(() => thankYouModal.classList.add("visible"), 200);
    });

    // Close Modal button
    modalCloseBtn.addEventListener("click", () => {
        thankYouModal.classList.remove("visible");
        setTimeout(() => thankYouModal.classList.add("hidden"), 500);
    });
}

function startSurpriseTypewriter() {
    if (surpriseTypewriterStarted) return;
    surpriseTypewriterStarted = true;
    
    const textEng = "You are the best thing that ever happened to me.";
    const textBng = "তুমি আমার জীবনের সবচেয়ে সুন্দর গল্প।";
    
    const engEl = document.getElementById("surprise-typewriter-1");
    const bngEl = document.getElementById("surprise-typewriter-2");
    
    let engIdx = 0;
    let bngIdx = 0;
    
    function typeEng() {
        if (engIdx < textEng.length) {
            engEl.textContent += textEng.charAt(engIdx);
            engIdx++;
            setTimeout(typeEng, CONFIG.typewriterSpeedSurprise);
        } else {
            // Eng complete, start Bng typewriter after small pause
            setTimeout(typeBng, 800);
        }
    }
    
    function typeBng() {
        if (bngIdx < textBng.length) {
            bngEl.textContent += textBng.charAt(bngIdx);
            bngIdx++;
            setTimeout(typeBng, CONFIG.typewriterSpeedSurprise);
        } else {
            // Stage 1 typewriter is complete! Transition to final Stage 2 surprises
            revealSurpriseStage2();
        }
    }
    
    // Small delay for dark transition to fully settle
    setTimeout(typeEng, 1500);
}

function revealSurpriseStage2() {
    const stage1Block = document.getElementById("surprise-text-stage-1");
    const stage2Block = document.getElementById("surprise-text-stage-2");
    
    // Fade out stage 1 text block
    gsap.to(stage1Block, {
        opacity: 0,
        y: -30,
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => {
            stage1Block.classList.add("hidden");
            stage2Block.classList.remove("hidden");
            
            // Fade in final stage 2 heart and glowing buttons
            setTimeout(() => {
                stage2Block.classList.add("visible");
            }, 100);
        }
    });
}

/* ==========================================================================
   11. Section 5.5: Memory Gallery & Fullscreen Lightbox
   ========================================================================== */
let galleryTypewriterStarted = false;

function initMemoryGallery() {
    const cards = document.querySelectorAll(".gallery-card");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxVideo = document.getElementById("lightbox-video");
    const lightboxTitle = document.getElementById("lightbox-title");
    const lightboxCaption = document.getElementById("lightbox-caption");
    const lightboxClose = document.getElementById("lightbox-close");
    
    // Lightbox Open Trigger
    cards.forEach(card => {
        card.addEventListener("click", () => {
            const isVideo = card.getAttribute("data-type") === "video";
            const imgTitle = card.getAttribute("data-title");
            const imgCaption = card.getAttribute("data-caption");
            
            lightboxTitle.textContent = imgTitle;
            lightboxCaption.textContent = imgCaption;
            
            if (isVideo) {
                const videoSrc = card.getAttribute("data-video");
                lightboxVideo.src = videoSrc;
                lightboxVideo.classList.remove("hidden");
                lightboxImg.classList.add("hidden");
                lightboxVideo.play().catch(err => console.log("Video auto-play failed: ", err));
            } else {
                const imgSrc = card.getAttribute("data-image");
                lightboxImg.src = imgSrc;
                lightboxImg.alt = imgTitle;
                lightboxImg.classList.remove("hidden");
                if (lightboxVideo) {
                    lightboxVideo.classList.add("hidden");
                    lightboxVideo.pause();
                    lightboxVideo.src = "";
                }
            }
            
            // Show lightbox modal
            lightbox.classList.remove("hidden");
            setTimeout(() => {
                lightbox.classList.add("visible");
            }, 50);
            
            lightbox.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden"; // Disable scroll
            
            // Sound feedback
            if (loveSynth) {
                loveSynth.playClickSparkChime();
            }
            
            // Heart particle burst at clicked card center
            const rect = card.getBoundingClientRect();
            canvasManager.addExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, 25);
        });
    });
    
    // Lightbox Close Trigger
    function closeLightbox() {
        lightbox.classList.remove("visible");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = ""; // Re-enable scroll
        
        if (lightboxVideo) {
            lightboxVideo.pause();
        }
        
        setTimeout(() => {
            lightbox.classList.add("hidden");
            lightboxImg.src = ""; // Clear src
            if (lightboxVideo) {
                lightboxVideo.src = ""; // Clear video source
            }
        }, 500);
    }
    
    lightboxClose.addEventListener("click", closeLightbox);
    
    // Close by clicking backdrop
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Close by pressing Escape key (Platform standard access)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !lightbox.classList.contains("hidden")) {
            closeLightbox();
        }
    });
    
    // Scroll Trigger for the bottom typewriter quote
    ScrollTrigger.create({
        trigger: ".gallery-footer-quote",
        start: "top 80%",
        onEnter: () => {
            if (galleryTypewriterStarted) return;
            galleryTypewriterStarted = true;
            startGalleryTypewriter();
        }
    });
}

function startGalleryTypewriter() {
    const quoteText = "তোমার সঙ্গে কাটানো প্রতিটি মুহূর্ত আমার জীবনের সবচেয়ে সুন্দর উপহার।";
    const loveSubtext = 
`আমি তোমাকে আজ,
আগামীকাল,
এবং সারাজীবন ভালোবাসব।`;
    
    const quoteEl = document.getElementById("gallery-quote-text");
    const subtextEl = document.getElementById("gallery-love-subtext");
    const heartIcon = document.getElementById("final-gallery-heart");
    
    let quoteIdx = 0;
    let subtextIdx = 0;
    
    function typeQuote() {
        if (quoteIdx < quoteText.length) {
            quoteEl.textContent += quoteText.charAt(quoteIdx);
            quoteIdx++;
            setTimeout(typeQuote, CONFIG.typewriterSpeedApology);
        } else {
            // Quote finished typing, pause then show heart and type subtext
            setTimeout(revealFinalHeart, 600);
        }
    }
    
    function revealFinalHeart() {
        heartIcon.classList.remove("hidden");
        
        // Scale up heartbeat heart smoothly
        gsap.fromTo(heartIcon, 
            { scale: 0 }, 
            { scale: 1, duration: 0.8, ease: "back.out(2)", onComplete: () => {
                if (loveSynth) {
                    loveSynth.playClickSparkChime();
                }
                // Add a small burst of sparkles behind the heart
                const rect = heartIcon.getBoundingClientRect();
                canvasManager.addExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, 15);
                
                // Start typing the final love confession subtext
                setTimeout(typeSubtext, 400);
            }}
        );
    }
    
    function typeSubtext() {
        if (subtextIdx < loveSubtext.length) {
            subtextEl.textContent += loveSubtext.charAt(subtextIdx);
            subtextIdx++;
            setTimeout(typeSubtext, CONFIG.typewriterSpeedApology);
        }
    }
    
    // Start typing
    typeQuote();
}

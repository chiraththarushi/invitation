/* ══════════════════════════════════════════════════════════════
   CHIRATH & THARUSHI — WEDDING INVITATION
   script.js — Final Version
══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════
   1. MUSIC
   — Tries music.mp3 first (your uploaded file)
   — Falls back to Web Audio piano if file not found
   — Fixed mobile autoplay: starts on first user tap (envelope open)
══════════════════════════════════ */
let audioCtx = null, musicPlaying = false, musicInterval = null;
let useAudioFile = true; // try music.mp3 first
let audioElement = null;
const musicBtn = document.getElementById('music-btn');

/* ── HTML Audio (music.mp3) ── */
function initHTMLAudio() {
  if (audioElement) return;
  audioElement = new Audio('music.mp3');
  audioElement.loop = true;
  audioElement.volume = 0.55;
  audioElement.onerror = () => {
    // music.mp3 not found — fall back to Web Audio synth
    useAudioFile = false;
    audioElement = null;
    if (musicPlaying) startSynth();
  };
}

function startHTMLAudio() {
  initHTMLAudio();
  if (!audioElement) return;
  const p = audioElement.play();
  if (p !== undefined) {
    p.catch(() => {
      // Autoplay blocked — will retry on next user interaction
      useAudioFile = false;
      startSynth();
    });
  }
}

function stopHTMLAudio() {
  if (audioElement) { audioElement.pause(); audioElement.currentTime = 0; }
}

/* ── Web Audio Synth (fallback) ── */
const notes  = [261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25,587.33,659.25,698.46,783.99];
const melody = [4,6,9,6,4,2,4,6,7,9,7,6,4,6,4,2,0,2,4,6,9,11,9,7,6,7,9,6,4,2,4,6];
let melIdx = 0;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playNote(freq, dur, delay, vel = 0.05) {
  if (!audioCtx || !musicPlaying) return;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const t = audioCtx.currentTime + delay;
  osc.connect(gainNode); gainNode.connect(audioCtx.destination);
  osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t);
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(vel, t + 0.08);
  gainNode.gain.setValueAtTime(vel * 0.6, t + dur * 0.3);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t); osc.stop(t + dur + 0.05);
  const osc2 = audioCtx.createOscillator();
  const g2 = audioCtx.createGain();
  osc2.connect(g2); g2.connect(audioCtx.destination);
  osc2.type = 'sine'; osc2.frequency.setValueAtTime(freq * 2, t);
  g2.gain.setValueAtTime(0, t);
  g2.gain.linearRampToValueAtTime(vel * 0.25, t + 0.08);
  g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7);
  osc2.start(t); osc2.stop(t + dur);
}

function playChunk() {
  if (!audioCtx || !musicPlaying) return;
  const chunk = melody.slice(melIdx, melIdx + 6);
  let delay = 0;
  chunk.forEach((ni, i) => {
    playNote(notes[ni], 1.6, delay, 0.055);
    if (i % 3 === 0) playNote(notes[Math.max(0, ni - 7)] * 0.5, 2.0, delay, 0.04);
    delay += 0.42;
  });
  melIdx = (melIdx + 6) % melody.length;
}

function startSynth() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  playChunk();
  musicInterval = setInterval(playChunk, 2600);
}

function stopSynth() {
  clearInterval(musicInterval);
}

/* ── Toggle button ── */
function toggleMusic() {
  musicPlaying = !musicPlaying;
  const iconOn  = musicBtn.querySelector('svg');
  if (musicPlaying) {
    musicBtn.title = 'Mute music';
    iconOn.setAttribute('stroke', '#C8A96B');
    if (useAudioFile) { startHTMLAudio(); }
    else { startSynth(); }
  } else {
    musicBtn.title = 'Play music';
    iconOn.setAttribute('stroke', '#bbb');
    if (useAudioFile) { stopHTMLAudio(); }
    else { stopSynth(); }
  }
}

/* ── Start music automatically after envelope tap ── */
function startMusic() {
  musicPlaying = true;
  const icon = musicBtn.querySelector('svg');
  icon.setAttribute('stroke', '#C8A96B');
  musicBtn.title = 'Mute music';
  // Try HTML audio (music.mp3) — mobile requires user gesture first,
  // envelope tap IS the user gesture so this works on mobile too
  if (useAudioFile) {
    startHTMLAudio();
  } else {
    startSynth();
  }
}

/* ══════════════════════════════════
   2. ENVELOPE OPEN SEQUENCE
══════════════════════════════════ */
let opened = false;

function openEnvelope() {
  if (opened) return;
  opened = true;

  const envelope = document.getElementById('envelope');
  const card     = document.getElementById('card-preview');
  const hint     = document.getElementById('tap-hint');
  const seal     = document.getElementById('wax-seal');

  envelope.classList.add('glowing');
  if (seal) seal.style.pointerEvents = 'none';
  if (hint) { hint.style.transition = 'opacity 0.4s'; hint.style.opacity = '0'; }

  setTimeout(() => { card.classList.add('sliding'); }, 450);
  setTimeout(() => { envelope.classList.add('opening'); }, 900);

  setTimeout(() => {
    document.getElementById('opening-screen').classList.add('hide');
    const main = document.getElementById('main-content');
    main.classList.add('visible');
    document.getElementById('particles-canvas').classList.add('visible');
    musicBtn.classList.add('visible');

    // Start music — envelope tap is the user gesture mobile needs
    startMusic();

    initReveal();
    startHearts();
  }, 2800);
}

/* ══════════════════════════════════
3. RSVP — Google Sheets
══════════════════════════════════ */

const GOOGLE_SCRIPT_URL =
'https://script.google.com/macros/s/AKfycbwUBABuDCPxI0zJeMKVlKjKIcLjzuCHGk9rbLKpRm9YkwP0cpehfzkce7RB-5ttky6_mw/exec';

let attendanceVal = '';

function selectAttendance(val) {

attendanceVal = val;

document.getElementById('att-yes')
.classList.toggle('selected', val === 'yes');

document.getElementById('att-no')
.classList.toggle('selected', val === 'no');
}

function submitRSVP() {

const name =
document.getElementById('rsvp-name')
.value.trim();

const email =
document.getElementById('rsvp-email')
.value.trim();

const guests =
document.getElementById('rsvp-guests')
.value.trim() || '1';

const message =
document.getElementById('rsvp-message')
.value.trim();

if (!name) {
  shakeField('rsvp-name');
  return;
}

if (!email) {
  shakeField('rsvp-email');
  return;
}

if (!attendanceVal) {

  const group =
    document.querySelector('.attendance-group');

  group.style.outline =
    '1.5px solid rgba(200,169,107,0.7)';

  group.style.borderRadius = '5px';

  setTimeout(() => {
    group.style.outline = 'none';
  }, 1600);

  return;
}

const attendanceText =
attendanceVal === 'yes'
? 'Joyfully Accept'
: 'Regretfully Decline';

fetch(GOOGLE_SCRIPT_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8'
  },
  body: JSON.stringify({
    name,
    email,
    guests,
    attendance: attendanceText,
    message
  })
})

.then(response => response.text())

.then(result => {

  if (result === 'already_exists') {

    alert(
      'An RSVP has already been submitted using this email address.'
    );

    return;
  }

  document.getElementById('rsvp-form')
    .style.display = 'none';

  document.getElementById('rsvp-success')
    .classList.add('show');

})

.catch(error => {

  console.error(error);

  alert(
    'Unable to submit RSVP. Please try again.'
  );

});
}


/* ══════════════════════════════════
   4. COUNTDOWN — 23 July 2026 10:00 AM
══════════════════════════════════ */
function updateCountdown() {
  const wedding = new Date('2026-07-23T10:00:00');
  const now     = new Date();
  const diff    = wedding - now;
  if (diff <= 0) {
    ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => { document.getElementById(id).textContent = '00'; });
    return;
  }
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  const secs  = Math.floor((diff % 60000) / 1000);
  document.getElementById('cd-days').textContent  = String(days).padStart(3,'0');
  document.getElementById('cd-hours').textContent = String(hours).padStart(2,'0');
  document.getElementById('cd-mins').textContent  = String(mins).padStart(2,'0');
  document.getElementById('cd-secs').textContent  = String(secs).padStart(2,'0');
}
setInterval(updateCountdown, 1000);
updateCountdown();

/* ══════════════════════════════════
   5. GOLD PARTICLES
══════════════════════════════════ */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const particles = Array.from({length:40}, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.8 + 0.6,
    vx: (Math.random()-0.5) * 0.25,
    vy: -(Math.random() * 0.4 + 0.15),
    alpha: Math.random() * 0.5 + 0.1,
    da: (Math.random()-0.5) * 0.004,
  }));
  (function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.alpha += p.da;
      if (p.alpha < 0.05 || p.alpha > 0.65) p.da *= -1;
      if (p.y < -5) { p.y = canvas.height+5; p.x = Math.random()*canvas.width; }
      if (p.x < -5)             p.x = canvas.width+5;
      if (p.x > canvas.width+5) p.x = -5;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#C8A96B';
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.PI/4);
      ctx.fillRect(-p.r, -p.r, p.r*2, p.r*2);
      ctx.restore();
    });
    requestAnimationFrame(frame);
  })();
})();

/* ══════════════════════════════════
   6. SCROLL REVEAL
══════════════════════════════════ */
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ==================================
   CURSOR GOLD DUST
================================== */

document.addEventListener('mousemove', e => {

  if(Math.random() > 0.9){

    const sparkle =
    document.createElement('div');

    sparkle.className =
    'cursor-sparkle';

    sparkle.innerHTML = '✦';

    sparkle.style.left =
    e.clientX + 'px';

    sparkle.style.top =
    e.clientY + 'px';

    document.body.appendChild(
      sparkle
    );

    setTimeout(() => {

      sparkle.remove();

    }, 2000);
  }

});

/* ==========================
   TOUCH GOLD DUST
========================== */

function createGoldDust(x, y){

  for(let i = 0; i < 5; i++){

    const dust = document.createElement('span');

    dust.className = 'gold-dust';

    dust.style.left =
      (x + (Math.random()*40 - 20)) + 'px';

    dust.style.top =
      (y + (Math.random()*40 - 20)) + 'px';

    document.body.appendChild(dust);

    setTimeout(() => {
      dust.remove();
    }, 1200);

  }
}

document.addEventListener('touchstart', e => {

  const touch = e.touches[0];

  createGoldDust(
    touch.clientX,
    touch.clientY
  );

});

document.addEventListener('touchmove', e => {

  const touch = e.touches[0];

  if(Math.random() > 0.75){

    createGoldDust(
      touch.clientX,
      touch.clientY
    );

  }

/* ====================================
   FLOATING LUXURY HEARTS
==================================== */

function createFloatingHeart(){

    const heart = document.createElement("div");

    heart.classList.add("floating-heart");

    heart.innerHTML =
        Math.random() > 0.5 ? "♥" : "♡";

    heart.style.left =
        Math.random() * window.innerWidth + "px";

    heart.style.fontSize =
        (12 + Math.random()*14) + "px";

    heart.style.color =
        Math.random() > 0.5
        ? "#D4AF37"
        : "#E6C8A0";

    heart.style.textShadow =
        "0 0 10px rgba(212,175,55,.25)";

    heart.style.setProperty(
        "--drift",
        (Math.random()*180 - 90) + "px"
    );

    heart.style.animationDuration =
        (12 + Math.random()*8) + "s";

    document.body.appendChild(heart);

    setTimeout(()=>{
        heart.remove();
    },20000);
}

/* Create hearts */

setInterval(() => {

    if(document.visibilityState === "visible"){
        createFloatingHeart();
    }

},2500);
   
});


/* ══════════════════════════════════════════════════════
   CHIRATH & THARUSHI — WEDDING INVITATION
   script.js
   
   Sections:
   1. Music (Web Audio API — gentle piano melody)
   2. Envelope Open Sequence
   3. RSVP — Google Forms integration
   4. Countdown Timer
   5. Gold Particles
   6. Scroll Reveal
══════════════════════════════════════════════════════ */

/* ══════════════════════════════════
   1. MUSIC — Gentle Piano (Web Audio)
══════════════════════════════════ */
let audioCtx = null, musicPlaying = false, musicInterval = null;
const musicBtn = document.getElementById('music-btn');

const notes = [261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25,587.33,659.25,698.46,783.99];
const melody = [4,6,9,6,4,2,4,6,7,9,7,6,4,6,4,2,0,2,4,6,9,11,9,7,6,7,9,6,4,2,4,6];
let melIdx = 0;

function initAudio() {
  if(audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playNote(freq, dur, delay, vel=0.05) {
  if(!audioCtx || !musicPlaying) return;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const t = audioCtx.currentTime + delay;
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(vel, t + 0.08);
  gainNode.gain.setValueAtTime(vel * 0.6, t + dur * 0.3);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t); osc.stop(t + dur + 0.05);

  // Soft overtone for warmth
  const osc2 = audioCtx.createOscillator();
  const g2 = audioCtx.createGain();
  osc2.connect(g2); g2.connect(audioCtx.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, t);
  g2.gain.setValueAtTime(0, t);
  g2.gain.linearRampToValueAtTime(vel * 0.25, t + 0.08);
  g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7);
  osc2.start(t); osc2.stop(t + dur);
}

function playChunk() {
  if(!audioCtx || !musicPlaying) return;
  const chunk = melody.slice(melIdx, melIdx + 6);
  let delay = 0;
  chunk.forEach((ni, i) => {
    playNote(notes[ni], 1.6, delay, 0.055);
    if(i % 3 === 0) playNote(notes[Math.max(0,ni-7)] * 0.5, 2.0, delay, 0.04);
    delay += 0.42;
  });
  melIdx = (melIdx + 6) % melody.length;
}

function toggleMusic() {
  initAudio();
  if(audioCtx.state === 'suspended') audioCtx.resume();
  musicPlaying = !musicPlaying;
  const icon = musicBtn.querySelector('svg');
  if(musicPlaying) {
    musicBtn.title = 'Mute music';
    icon.setAttribute('stroke','#C8A96B');
    playChunk();
    musicInterval = setInterval(playChunk, 2600);
  } else {
    musicBtn.title = 'Play music';
    icon.setAttribute('stroke','#bbb');
    clearInterval(musicInterval);
  }
}

/* ══════════════════════════════════
   2. ENVELOPE OPEN SEQUENCE
══════════════════════════════════ */
let opened = false;

function openEnvelope() {
  if(opened) return;
  opened = true;

  const envelope = document.getElementById('envelope');
  const card     = document.getElementById('card-preview');
  const hint     = document.getElementById('tap-hint');

  // Step 1 — Seal glow
  envelope.classList.add('glowing');
  hint.style.transition = 'opacity 0.4s';
  hint.style.opacity = '0';

  // Step 2 — Card peeks out
  setTimeout(() => { card.classList.add('sliding'); }, 450);

  // Step 3 — Envelope flies up and disappears
  setTimeout(() => { envelope.classList.add('opening'); }, 900);

  // Step 4 — Main invitation fades in
  setTimeout(() => {
    document.getElementById('opening-screen').classList.add('hide');
    const main = document.getElementById('main-content');
    main.classList.add('visible');
    document.getElementById('particles-canvas').classList.add('visible');
    musicBtn.classList.add('visible');

    // Auto-start music after user tap (browser allows this)
    initAudio();
    musicPlaying = true;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    playChunk();
    musicInterval = setInterval(playChunk, 2600);

    // Start scroll reveal
    initReveal();
  }, 2800);
}

/* ══════════════════════════════════
   3. RSVP — Google Forms Integration
   
   How it works:
   • Guest fills in the custom form fields
   • On submit, values are mapped to Google Form field entry IDs
   • A hidden iframe posts to Google Forms silently
   • Guest sees the in-page success message
   
   ⚠ SETUP REQUIRED — see comments below
══════════════════════════════════ */

/*
  HOW TO FIND YOUR GOOGLE FORM ENTRY IDs:
  ─────────────────────────────────────────
  1. Open your Google Form in a browser
  2. Right-click → View Page Source (Ctrl+U)
  3. Press Ctrl+F and search for "entry."
  4. You will see entries like:
       entry.123456789   ← this is the field ID
  5. Match each field to its label (Name, Guests, etc.)
  6. Replace the ENTRY_IDs below with your actual values
  
  YOUR FORM:
  https://docs.google.com/forms/d/e/1FAIpQLSfS9hkPt5_3uz0sv78GldZ-WAVv-LtjAsh2kI3VCZ_REWQ84g/viewform

  FORM ACTION URL (for hidden iframe post):
  https://docs.google.com/forms/d/e/1FAIpQLSfS9hkPt5_3uz0sv78GldZ-WAVv-LtjAsh2kI3VCZ_REWQ84g/formResponse
*/

const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSfS9hkPt5_3uz0sv78GldZ-WAVv-LtjAsh2kI3VCZ_REWQ84g/formResponse';

// ⬇ REPLACE these with your actual entry IDs from the form source
const FORM_FIELDS = {
  name:       'entry.XXXXXXXXX',   // ← Your Name field entry ID
  guests:     'entry.XXXXXXXXX',   // ← Number of Guests entry ID
  attendance: 'entry.XXXXXXXXX',   // ← Attendance entry ID (Yes/No)
  message:    'entry.XXXXXXXXX',   // ← Message entry ID
};

let attendanceVal = '';

function selectAttendance(val) {
  attendanceVal = val;
  document.getElementById('att-yes').classList.toggle('selected', val === 'yes');
  document.getElementById('att-no').classList.toggle('selected', val === 'no');
}

function submitRSVP() {
  const name    = document.getElementById('rsvp-name').value.trim();
  const guests  = document.getElementById('rsvp-guests').value.trim();
  const message = document.getElementById('rsvp-message').value.trim();

  // Validation
  if(!name) {
    alert('Please enter your name.');
    return;
  }
  if(!attendanceVal) {
    alert('Please confirm your attendance.');
    return;
  }

  // Build form data
  const attendanceText = attendanceVal === 'yes' ? 'Joyfully Accept' : 'Regretfully Decline';

  // Check if entry IDs are configured
  const fieldsConfigured = !FORM_FIELDS.name.includes('XXXXXXXXX');

  if(fieldsConfigured) {
    // ── Silent iframe submission to Google Forms ──
    const params = new URLSearchParams();
    params.append(FORM_FIELDS.name,       name);
    params.append(FORM_FIELDS.guests,     guests || '1');
    params.append(FORM_FIELDS.attendance, attendanceText);
    params.append(FORM_FIELDS.message,    message);

    // Create a hidden iframe to post form data silently
    const iframe = document.createElement('iframe');
    iframe.setAttribute('name', 'hidden-form-target');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = GOOGLE_FORM_ACTION;
    form.target = 'hidden-form-target';
    form.style.display = 'none';

    Object.entries({
      [FORM_FIELDS.name]:       name,
      [FORM_FIELDS.guests]:     guests || '1',
      [FORM_FIELDS.attendance]: attendanceText,
      [FORM_FIELDS.message]:    message,
    }).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type  = 'hidden';
      input.name  = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

    // Clean up after submission
    setTimeout(() => {
      document.body.removeChild(form);
      document.body.removeChild(iframe);
    }, 5000);

  } else {
    // ── Fallback: open Google Form in new tab if entry IDs not yet set ──
    // This always works and stores responses correctly
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfS9hkPt5_3uz0sv78GldZ-WAVv-LtjAsh2kI3VCZ_REWQ84g/viewform';
    window.open(formUrl, '_blank');
  }

  // Show in-page success message
  document.getElementById('rsvp-form').style.display = 'none';
  document.getElementById('rsvp-success').classList.add('show');
}

/* ══════════════════════════════════
   4. COUNTDOWN TIMER
   Target: 23 July 2026 at 10:00 AM
   Updates every second automatically
   for every guest on any device.
══════════════════════════════════ */
function updateCountdown() {
  const wedding = new Date('2026-07-23T10:00:00');
  const now     = new Date();
  const diff    = wedding - now;

  if(diff <= 0) {
    ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => {
      document.getElementById(id).textContent = '00';
    });
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
(function initParticles(){
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');

  function resize(){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = Array.from({length:40}, () => ({
    x:     Math.random() * window.innerWidth,
    y:     Math.random() * window.innerHeight,
    r:     Math.random() * 1.8 + 0.6,
    vx:    (Math.random()-0.5) * 0.25,
    vy:    -(Math.random() * 0.4 + 0.15),
    alpha: Math.random() * 0.5 + 0.1,
    da:    (Math.random()-0.5) * 0.004,
  }));

  (function frame(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x     += p.vx;
      p.y     += p.vy;
      p.alpha += p.da;
      if(p.alpha < 0.05 || p.alpha > 0.65) p.da *= -1;
      if(p.y < -5){ p.y = canvas.height+5; p.x = Math.random()*canvas.width; }
      if(p.x < -5)              p.x = canvas.width+5;
      if(p.x > canvas.width+5)  p.x = -5;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = '#C8A96B';
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
function initReveal(){
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting) e.target.classList.add('revealed');
    });
  }, { threshold:0.08, rootMargin:'0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ══════════════════════════════════════════════════════════════
   CHIRATH & THARUSHI — WEDDING INVITATION
   script.js  (Updated)

   Sections:
   1. Music (Web Audio API — gentle piano melody)
   2. Envelope Open Sequence
   3. RSVP — WhatsApp + localStorage (NO Google Form redirect)
   4. Countdown Timer
   5. Gold Particles
   6. Scroll Reveal
══════════════════════════════════════════════════════════════ */

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
  const seal     = document.getElementById('wax-seal');

  // Step 1 — seal glows, disable further taps
  envelope.classList.add('glowing');
  if(seal) seal.style.pointerEvents = 'none';
  hint.style.transition = 'opacity 0.4s';
  hint.style.opacity = '0';

  setTimeout(() => { card.classList.add('sliding'); }, 450);
  setTimeout(() => { envelope.classList.add('opening'); }, 900);

  setTimeout(() => {
    document.getElementById('opening-screen').classList.add('hide');
    const main = document.getElementById('main-content');
    main.classList.add('visible');
    document.getElementById('particles-canvas').classList.add('visible');
    musicBtn.classList.add('visible');

    initAudio();
    musicPlaying = true;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    playChunk();
    musicInterval = setInterval(playChunk, 2600);

    initReveal();
  }, 2800);
}

/* ══════════════════════════════════════════════════════════════
   3. RSVP SYSTEM — WhatsApp + localStorage

   HOW THIS WORKS:
   ───────────────────────────────────────────────────────────────
   • When a guest submits the RSVP form, their response is:
     1. Saved to their browser's localStorage (permanent record)
     2. Sent directly to the couple via WhatsApp with one tap
        (WhatsApp opens with a pre-filled message — the couple
        receives it instantly on their phone)

   • The guest sees a beautiful thank-you message immediately
     after submitting — NO redirects, NO confusion.

   • The couple receives a clear WhatsApp message like:
       ✦ RSVP — Chirath & Tharushi Wedding ✦
       Name: Perera Family
       Guests: 4
       Attendance: Joyfully Accept
       Message: We are so happy for you both! ♡

   TO CONFIGURE:
   ─────────────
   Replace the phone number below with the couple's WhatsApp
   number in international format (no + sign, no spaces):
     Sri Lanka example: 94752838185
     (94 = country code, then the number without leading 0)
══════════════════════════════════════════════════════════════ */

// ⬇ CHANGE THIS to the WhatsApp number that should receive RSVPs
// Format: country code + number (no spaces, no + sign)
// Sri Lanka: 94 + number without leading zero
const WHATSAPP_NUMBER = '94752838185'; // Chirath's number

let attendanceVal = '';

function selectAttendance(val) {
  attendanceVal = val;
  document.getElementById('att-yes').classList.toggle('selected', val === 'yes');
  document.getElementById('att-no').classList.toggle('selected',  val === 'no');
}

function saveResponseToStorage(data) {
  try {
    const existing = JSON.parse(localStorage.getItem('ct_rsvp_responses') || '[]');
    existing.push({ ...data, submittedAt: new Date().toISOString() });
    localStorage.setItem('ct_rsvp_responses', JSON.stringify(existing));
  } catch(e) {
    // Storage not available — silent fail, WhatsApp still works
  }
}

function submitRSVP() {
  const name    = document.getElementById('rsvp-name').value.trim();
  const guests  = document.getElementById('rsvp-guests').value.trim() || '1';
  const message = document.getElementById('rsvp-message').value.trim();

  // ── Validation ──
  if(!name) {
    shakeField('rsvp-name');
    return;
  }
  if(!attendanceVal) {
    // Flash the attendance buttons
    const group = document.querySelector('.attendance-group');
    group.style.outline = '1.5px solid rgba(200,169,107,0.7)';
    group.style.borderRadius = '5px';
    setTimeout(() => { group.style.outline = 'none'; }, 1600);
    return;
  }

  const attendanceText = attendanceVal === 'yes' ? 'Joyfully Accept ✓' : 'Regretfully Decline';

  // ── 1. Save to localStorage ──
  saveResponseToStorage({ name, guests, attendance: attendanceText, message });

  // ── 2. Send via WhatsApp ──
  const waMessage =
    `✦ RSVP — Chirath & Tharushi Wedding ✦\n\n` +
    `Name: ${name}\n` +
    `Number of Guests: ${guests}\n` +
    `Attendance: ${attendanceText}\n` +
    (message ? `Message: ${message}\n` : '') +
    `\nSent from the wedding invitation website.`;

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  // Show success message first, then open WhatsApp
  document.getElementById('rsvp-form').style.display = 'none';
  document.getElementById('rsvp-success').classList.add('show');

  // Small delay so the guest sees the thank you before WhatsApp opens
  setTimeout(() => {
    window.open(waUrl, '_blank');
  }, 800);
}

// Gentle field shake on validation fail
function shakeField(id) {
  const el = document.getElementById(id);
  el.style.transition = 'transform 0.1s ease, border-color 0.3s';
  el.style.borderColor = 'rgba(200,169,107,0.9)';
  el.style.transform = 'translateX(-4px)';
  setTimeout(() => { el.style.transform = 'translateX(4px)'; }, 100);
  setTimeout(() => { el.style.transform = 'translateX(-3px)'; }, 200);
  setTimeout(() => { el.style.transform = 'translateX(3px)'; }, 300);
  setTimeout(() => { el.style.transform = 'translateX(0)'; el.focus(); }, 400);
  setTimeout(() => { el.style.borderColor = ''; }, 1500);
}

/*
  ────────────────────────────────────────────────────────────
  TO VIEW ALL SAVED RESPONSES (couple only):
  ────────────────────────────────────────────────────────────
  Open the website in a browser, press F12 (Developer Tools),
  go to the Console tab, and type:

      showRSVPResponses()

  This will display a table of everyone who RSVP'd from
  that device/browser. For a full list, check your WhatsApp.
  ────────────────────────────────────────────────────────────
*/
window.showRSVPResponses = function() {
  try {
    const data = JSON.parse(localStorage.getItem('ct_rsvp_responses') || '[]');
    if(data.length === 0) {
      console.log('No RSVP responses saved in this browser yet.');
      return;
    }
    console.log(`%c✦ Chirath & Tharushi — RSVP Responses (${data.length} total) ✦`, 'color:#C8A96B;font-size:14px;font-weight:bold;');
    console.table(data);
  } catch(e) {
    console.log('Could not read responses.');
  }
};

/* ══════════════════════════════════
   4. COUNTDOWN TIMER
   Target: 23 July 2026 at 10:00 AM
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

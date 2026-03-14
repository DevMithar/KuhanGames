// renderer.js - Main renderer process script

const gameContainer = document.getElementById('game-container');

// ── Background Music Engine ──────────────────────────────────────────────────
let bgMusicCtx = null;
let bgMusicGain = null;
let bgMusicPlaying = false;
let bgMusicTimeoutIds = [];
let selectedBgMusic = 'twinkle';

// Song library [freq, beatOffset, durationBeats]
const NURSERY_RHYMES = {
  none: null,
  twinkle: {
    bpm: 108, loopBeats: 48,
    melody: [
      [523,0,1],[523,1,1],[784,2,1],[784,3,1],[880,4,1],[880,5,1],[784,6,2],
      [698,8,1],[698,9,1],[659,10,1],[659,11,1],[587,12,1],[587,13,1],[523,14,2],
      [784,16,1],[784,17,1],[698,18,1],[698,19,1],[659,20,1],[659,21,1],[587,22,2],
      [784,24,1],[784,25,1],[698,26,1],[698,27,1],[659,28,1],[659,29,1],[587,30,2],
      [523,32,1],[523,33,1],[784,34,1],[784,35,1],[880,36,1],[880,37,1],[784,38,2],
      [698,40,1],[698,41,1],[659,42,1],[659,43,1],[587,44,1],[587,45,1],[523,46,2]
    ],
    bass: [[262,0,2],[262,8,2],[392,16,2],[392,24,2],[262,32,2],[262,40,2]]
  },
  bingo: {
    bpm: 116, loopBeats: 42,
    melody: [
      // "There was a farmer had a dog"
      [784,0,1],[784,1,1],[523,2,1],[523,3,1],[587,4,1],[659,5,1],[698,6,1],[784,7,2],
      // "And Bingo was his name-o"
      [880,9,1],[784,10,2],[698,12,1],[659,13,1],[587,14,2],[523,15,2],
      // "B-I-N-G-O" x3
      [659,17,1],[698,18,1],[784,19,1],[659,20,1],[523,21,2],
      [659,23,1],[698,24,1],[784,25,1],[659,26,1],[523,27,2],
      [659,29,1],[698,30,1],[784,31,1],[659,32,1],[523,33,2],
      // "And Bingo was his name-o"
      [698,35,2],[659,37,1],[587,38,1],[523,39,3]
    ],
    bass: [[262,0,4],[262,9,4],[262,17,2],[262,23,2],[262,29,2],[262,35,4]]
  },
  oldmacdonald: {
    bpm: 104, loopBeats: 60,
    melody: [
      [523,0,1],[523,1,1],[523,2,1],[784,3,1],[880,4,1],[880,5,1],[784,6,2],  // Old Mac-Don-ald had a farm
      [659,8,1],[659,9,1],[587,10,1],[587,11,1],[523,12,2],                   // E-I-E-I-O
      [523,14,1],[523,15,1],[523,16,1],[784,17,1],[880,18,1],[880,19,1],[784,20,2], // And on his farm
      [659,22,1],[659,23,1],[587,24,1],[587,25,1],[523,26,2],                  // E-I-E-I-O
      [784,28,1],[784,29,1],[523,30,1],[523,31,1],[523,32,1],                  // With a moo moo here
      [784,33,1],[784,34,1],[523,35,1],[523,36,1],[523,37,1],                  // And a moo moo there
      [523,38,1],[784,39,1],[523,40,1],[784,41,1],[523,42,1],[784,43,1],[523,44,1],[784,45,1], // everywhere
      [523,46,1],[523,47,1],[523,48,1],[784,49,1],[880,50,1],[880,51,1],[784,52,2], // Old MacDonald
      [659,54,1],[659,55,1],[587,56,1],[587,57,1],[523,58,2]                  // E-I-E-I-O
    ],
    bass: [[262,0,4],[262,8,4],[262,14,4],[262,22,4],[262,28,4],[262,38,4],[262,46,4],[262,54,4]]
  },
  rowyourboat: {
    bpm: 112, loopBeats: 32,
    melody: [
      [523,0,1],[523,1,1],[523,2,1],[587,3,1],[659,4,2],           // Row row row your boat
      [587,6,1],[659,7,1],[587,8,1],[659,9,1],[784,10,2],           // Gently down the stream
      [1047,12,1],[1047,13,1],[1047,14,1],[784,15,1],[784,16,1],[784,17,1], // Merrily merrily
      [659,18,1],[659,19,1],[659,20,1],[523,21,1],[523,22,1],[523,23,1],    // merrily merrily
      [784,24,1],[698,25,1],[659,26,1],[587,27,1],[523,28,4]        // Life is but a dream
    ],
    bass: [[262,0,4],[262,6,4],[262,12,4],[262,18,4],[262,24,4]]
  },
  wheelsonbus: {
    bpm: 110, loopBeats: 34,
    melody: [
      [587,0,1],[659,1,1],[698,2,1],[587,3,1],[698,4,1],[659,5,1],[698,6,1],[784,7,1],[880,8,2], // The wheels on the bus go round and round
      [880,10,1],[698,11,1],[880,12,1],[880,13,1],[698,14,1],[880,15,1],                          // Round and round, round and round
      [587,16,1],[659,17,1],[698,18,1],[587,19,1],[698,20,1],[659,21,1],[698,22,1],[784,23,1],[880,24,2], // The wheels on the bus
      [880,26,1],[784,27,1],[698,28,1],[659,29,1],[587,30,4]                                       // All through the town
    ],
    bass: [[294,0,4],[294,8,4],[294,16,4],[294,26,4]]
  }
};

function selectBgMusic(val) {
  selectedBgMusic = val;
  // Sync both dropdowns
  ['music-picker', 'music-select'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
  stopBgMusic(150);
  // Always (re)start after the old context is fully torn down, unless None
  if (val !== 'none') {
    setTimeout(startBgMusic, 350);
  }
}

function startBgMusic() {
  if (bgMusicPlaying || selectedBgMusic === 'none') return;
  try {
    bgMusicCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Mobile browsers (iOS/Android) start AudioContext suspended; must resume explicitly
    bgMusicCtx.resume().then(() => {
      bgMusicGain = bgMusicCtx.createGain();
      bgMusicGain.gain.value = 0.13;
      bgMusicGain.connect(bgMusicCtx.destination);
      bgMusicPlaying = true;
      scheduleBgLoop();
    }).catch(() => {
      // resume rejected (e.g. no user gesture yet) — will retry on next touch via unlock handler
    });
  } catch(e) {}
}

function stopBgMusic(fadeMs) {
  // Cancel all pending note scheduling immediately
  bgMusicTimeoutIds.forEach(id => clearTimeout(id));
  bgMusicTimeoutIds = [];
  bgMusicPlaying = false;

  // Grab refs locally so the new session can't collide with cleanup
  const oldCtx = bgMusicCtx;
  const oldGain = bgMusicGain;
  bgMusicCtx = null;
  bgMusicGain = null;

  if (oldGain && oldCtx) {
    try {
      const duration = (fadeMs || 600) / 1000;
      oldGain.gain.cancelScheduledValues(oldCtx.currentTime);
      oldGain.gain.linearRampToValueAtTime(0, oldCtx.currentTime + duration);
    } catch(e) {}
  }
  if (oldCtx) {
    setTimeout(() => { try { oldCtx.close(); } catch(e) {} }, (fadeMs || 600) + 50);
  }
}

function scheduleBgLoop() {
  if (!bgMusicPlaying || !bgMusicCtx) return;
  const song = NURSERY_RHYMES[selectedBgMusic];
  if (!song) return;
  const B = 60 / song.bpm;

  song.melody.forEach(([freq, beat, dur]) => {
    if (!bgMusicPlaying || !bgMusicCtx) return;
    const osc = bgMusicCtx.createOscillator();
    const noteGain = bgMusicCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(noteGain);
    noteGain.connect(bgMusicGain);
    const t = bgMusicCtx.currentTime + beat * B;
    const d = dur * B * 0.82;
    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(0.7, t + 0.03);
    noteGain.gain.linearRampToValueAtTime(0, t + d);
    osc.start(t);
    osc.stop(t + d + 0.02);
  });

  song.bass.forEach(([freq, beat, dur]) => {
    if (!bgMusicPlaying || !bgMusicCtx) return;
    const osc = bgMusicCtx.createOscillator();
    const noteGain = bgMusicCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(noteGain);
    noteGain.connect(bgMusicGain);
    const t = bgMusicCtx.currentTime + beat * B;
    const d = dur * B * 0.7;
    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(0.35, t + 0.05);
    noteGain.gain.linearRampToValueAtTime(0, t + d);
    osc.start(t);
    osc.stop(t + d + 0.02);
  });

  const loopMs = song.loopBeats * B * 1000;
  const id = setTimeout(() => { if (bgMusicPlaying) scheduleBgLoop(); }, loopMs - 80);
  bgMusicTimeoutIds.push(id);
}
// ────────────────────────────────────────────────────────────────────────────

// ── Voice Selection ───────────────────────────────────────────────────────────
// Ranked preference list: first match wins
const FEMALE_VOICE_PRIORITY = [
  'Samantha',       // macOS / iOS – warm, natural
  'Karen',          // macOS Australian
  'Moira',          // macOS Irish
  'Tessa',          // macOS South African
  'Veena',          // macOS Indian
  'Fiona',          // macOS Scottish
  'Victoria',       // macOS
  'Zira',           // Windows – Microsoft Zira
  'Microsoft Zira',
  'Google US English',
  'Google UK English Female',
  'en-US-Neural2-C',// Chrome neural female
  'en-US-Neural2-E',
  'en-US-Wavenet-C',
  'en-US-Wavenet-E',
  'en-US-Wavenet-F',
];

let _preferredVoice = null;

function getPreferredVoice() {
  if (_preferredVoice) return _preferredVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Try ranked list first
  for (const name of FEMALE_VOICE_PRIORITY) {
    const v = voices.find(v => v.name.includes(name));
    if (v) { _preferredVoice = v; return v; }
  }
  // Fallback: any English female voice
  const femaleEnglish = voices.find(v =>
    v.lang.startsWith('en') && /female|woman|girl/i.test(v.name)
  );
  if (femaleEnglish) { _preferredVoice = femaleEnglish; return femaleEnglish; }
  // Fallback: any English voice
  const anyEnglish = voices.find(v => v.lang.startsWith('en'));
  if (anyEnglish) { _preferredVoice = anyEnglish; return anyEnglish; }
  return null;
}

// Re-resolve voice after voices list loads (async on some browsers)
window.speechSynthesis.onvoiceschanged = () => { _preferredVoice = null; };

function speakText(text, rate, volume, onEnd) {
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate   = rate   ?? accessibilitySettings.speechRate;
  utt.volume = volume ?? accessibilitySettings.volume;
  utt.pitch  = 1.1;   // slightly higher pitch for warmth
  const voice = getPreferredVoice();
  if (voice) utt.voice = voice;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
  return utt;
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Custom Voice Recordings ──────────────────────────────────────────────────
// Stored as { 'A': 'data:audio/webm;base64,...', ... } in localStorage
let customVoiceRecordings = {};
try {
  const saved = localStorage.getItem('kuhanVoiceRecordings');
  if (saved) customVoiceRecordings = JSON.parse(saved);
} catch(e) {}

function saveVoiceRecordingToStorage() {
  try { localStorage.setItem('kuhanVoiceRecordings', JSON.stringify(customVoiceRecordings)); } catch(e) {}
}

// Play a custom recording; returns true if one existed, false if not
function playCustomRecording(key, onEnded) {
  const dataUrl = customVoiceRecordings[key.toUpperCase()];
  if (!dataUrl) return false;
  const audio = new Audio(dataUrl);
  audio.volume = accessibilitySettings.volume;
  if (onEnded) audio.addEventListener('ended', onEnded);
  audio.play().catch(() => {});
  return true;
}
// ─────────────────────────────────────────────────────────────────────────────

// Global game settings
let isUppercase = true;
let currentBalloons = [];
let currentScore = 0;
let scoreDisplay;
let isPaused = false;
let shapesScore = 0;
let shapesRound = 0;
let isShapeSpeakPending = false;

const shapeBank = [
  { name: 'Circle', symbol: '⬤', color: '#FF6B6B', scale: 1.18 },
  { name: 'Square', symbol: '■', color: '#4ECDC4', scale: 1.16 },
  { name: 'Triangle', symbol: '▲', color: '#FFD93D', scale: 1.2 },
  { name: 'Diamond', symbol: '◆', color: '#45B7D1', scale: 1.18 },
  { name: 'Star', symbol: '★', color: '#F7A4FF', scale: 1.05 },
  { name: 'Heart', symbol: '♥', color: '#FF8FA3', scale: 1.18 }
];

// Object mapping (e.g. A -> Apple) defaults
const defaultLetterObjects = {
  A: 'Apple', B: 'Ball', C: 'Cat', D: 'Dog', E: 'Elephant', F: 'Fish', G: 'Giraffe',
  H: 'Hat', I: 'Ice cream', J: 'Juice', K: 'Kite', L: 'Lion', M: 'Moon', N: 'Nose',
  O: 'Orange', P: 'Panda', Q: 'Queen', R: 'Rainbow', S: 'Sun', T: 'Tiger', U: 'Umbrella',
  V: 'Violin', W: 'Whale', X: 'Xylophone', Y: 'Yacht', Z: 'Zebra'
};

// Extended word pool per letter for random mode
const letterWordPool = {
  A: ['Apple', 'Ant', 'Acorn', 'Avocado', 'Axe', 'Anchor'],
  B: ['Ball', 'Banana', 'Bear', 'Bee', 'Book', 'Bus', 'Balloon'],
  C: ['Cat', 'Cake', 'Car', 'Cow', 'Cloud', 'Carrot', 'Cookie'],
  D: ['Dog', 'Drum', 'Duck', 'Doll', 'Deer', 'Donut'],
  E: ['Elephant', 'Egg', 'Eagle', 'Ear', 'Eel'],
  F: ['Fish', 'Frog', 'Fox', 'Flag', 'Fan', 'Flower', 'Fork'],
  G: ['Giraffe', 'Grape', 'Goat', 'Gift', 'Guitar', 'Ghost'],
  H: ['Hat', 'Hop', 'Honey', 'Horse', 'House', 'Heart', 'Hand'],
  I: ['Ice cream', 'Igloo', 'Insect', 'Iron'],
  J: ['Juice', 'Jar', 'Jacket', 'Jellyfish', 'Jump'],
  K: ['Kite', 'Key', 'Koala', 'King', 'Kangaroo'],
  L: ['Lion', 'Leaf', 'Lamp', 'Lemon', 'Log', 'Lobster'],
  M: ['Moon', 'Mouse', 'Milk', 'Monkey', 'Map', 'Melon'],
  N: ['Nose', 'Net', 'Nest', 'Noodle', 'Nut'],
  O: ['Orange', 'Owl', 'Otter', 'Ocean', 'Onion'],
  P: ['Panda', 'Penguin', 'Pizza', 'Pig', 'Peach', 'Pumpkin'],
  Q: ['Queen', 'Quilt', 'Quail'],
  R: ['Rainbow', 'Rabbit', 'Rain', 'Rocket', 'Ring', 'Robot'],
  S: ['Sun', 'Snake', 'Star', 'Snail', 'Shoe', 'Spoon', 'Sock'],
  T: ['Tiger', 'Tree', 'Train', 'Turtle', 'Towel', 'Tomato'],
  U: ['Umbrella', 'Unicorn', 'Ukulele'],
  V: ['Violin', 'Vegetable', 'Van', 'Vase', 'Vest'],
  W: ['Whale', 'Wolf', 'Watch', 'Wagon', 'Watermelon', 'Worm'],
  X: ['Xylophone', 'X-ray'],
  Y: ['Yacht', 'Yak', 'Yarn', 'Yogurt'],
  Z: ['Zebra', 'Zoo', 'Zipper', 'Zucchini']
};

let letterObjects = { ...defaultLetterObjects };
let useObjectWords = true;
let randomizeObjects = false;

// Keyboard handler
function handleKeyPress(event) {
  if (isPaused) return;
  const key = isUppercase ? event.key.toUpperCase() : event.key.toLowerCase();
  const balloonIndex = currentBalloons.findIndex(b => b.dataset.letter === key);
  if (balloonIndex !== -1) {
    const balloon = currentBalloons[balloonIndex];
    popBalloon(balloon, key);
    event.preventDefault(); // Prevent default key behavior
  }
}

// Load the home screen tiles
function loadHome() {
  stopBgMusic(600);
  // Ensure keyboard listener is removed
  document.removeEventListener('keydown', handleKeyPress);

  gameContainer.innerHTML = `
    <style>
      .tile-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      .game-tile {
        background: rgba(255,255,255,0.85);
        border: 3px solid rgba(255,255,255,0.8);
        border-radius: 18px;
        padding: 18px 14px;
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .game-tile:hover {
        transform: translateY(-3px);
        box-shadow: 0 14px 28px rgba(0,0,0,0.25);
      }
      .tile-icon {
        font-size: 3.2rem;
        margin-bottom: 10px;
      }
      .tile-title {
        font-size: 1.4rem;
        font-weight: bold;
        margin-bottom: 6px;
      }
      .tile-sub {
        font-size: 1rem;
        color: rgba(0,0,0,0.7);
      }
    </style>
    <h2>Choose a game</h2>
    <div class="tile-grid">
      <div class="game-tile" onclick="loadGame('balloon')">
        <div class="tile-icon">🎈</div>
        <div class="tile-title">Balloon Pop</div>
        <div class="tile-sub">Pop letters & hear them</div>
      </div>
      <div class="game-tile" onclick="loadGame('color')">
        <div class="tile-icon">🎨</div>
        <div class="tile-title">Color Match</div>
        <div class="tile-sub">Match bright colors</div>
      </div>
      <div class="game-tile" onclick="loadGame('word')">
        <div class="tile-icon">🔤</div>
        <div class="tile-title">Word Builder</div>
        <div class="tile-sub">Build words from letters</div>
      </div>
      <div class="game-tile" onclick="loadGame('shapes')">
        <div class="tile-icon">🧩</div>
        <div class="tile-title">SHAPES</div>
        <div class="tile-sub">Find and match fun shapes</div>
      </div>
      <div class="game-tile" onclick="loadGame('voicerecorder')">
        <div class="tile-icon">🎙️</div>
        <div class="tile-title">Record My Voice</div>
        <div class="tile-sub">Replace robot voice with yours</div>
      </div>
    </div>
  `;
}

// Game loading function
function loadGame(gameName) {
  startBgMusic();
  gameContainer.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px;">
      <button class="back-btn" onclick="loadHome()">← Back</button>
      <label style="font-size:0.9rem;font-weight:bold;color:#555;">🎵 Music:
        <select id="music-picker" onchange="selectBgMusic(this.value)"
          style="margin-left:6px;padding:4px 8px;border-radius:8px;border:2px solid #FFD700;font-size:0.9rem;cursor:pointer;background:#fffbe6;">
          <option value="none">🔇 None</option>
          <option value="twinkle" selected>⭐ Twinkle Twinkle</option>
          <option value="bingo">🐶 BINGO</option>
          <option value="oldmacdonald">🐄 Old MacDonald</option>
          <option value="rowyourboat">🚣 Row Your Boat</option>
          <option value="wheelsonbus">🚌 Wheels on the Bus</option>
        </select>
      </label>
    </div>
    <div id="game-screen"></div>
  `;
  document.getElementById('music-picker').value = selectedBgMusic;

  switch(gameName) {
    case 'balloon':
      loadBalloonGame();
      break;
    case 'color':
      loadColorGame();
      break;
    case 'word':
      loadWordGame();
      break;
    case 'shapes':
      loadShapesGame();
      break;
    case 'voicerecorder':
      stopBgMusic(300);
      loadVoiceRecorder();
      break;
    default:
      document.getElementById('game-screen').innerHTML = '<p>Game not found.</p>';
  }
}

// Initialize to home screen
window.addEventListener('DOMContentLoaded', loadHome);

// ── Mobile audio unlock ───────────────────────────────────────────────────────
// iOS/Android suspend AudioContext until a user gesture. On the first touch
// anywhere we resume any existing context and, if bg music should be playing
// but got stuck, restart it.
function _unlockAudio() {
  if (bgMusicCtx && bgMusicCtx.state === 'suspended') {
    bgMusicCtx.resume().catch(() => {});
  } else if (!bgMusicPlaying && selectedBgMusic !== 'none') {
    // Context was never created (page loaded but no prior gesture)
    startBgMusic();
  }
  // Remove after first successful unlock
  ['touchstart', 'touchend', 'pointerdown', 'click'].forEach(ev =>
    document.removeEventListener(ev, _unlockAudio)
  );
}
['touchstart', 'touchend', 'pointerdown', 'click'].forEach(ev =>
  document.addEventListener(ev, _unlockAudio, { passive: true })
);
// ─────────────────────────────────────────────────────────────────────────────

// Toggle case function
function toggleCase() {
  isUppercase = !isUppercase;
  // Update the checkbox
  const checkbox = document.getElementById('case-toggle');
  if (checkbox) checkbox.checked = isUppercase;
}

// Placeholder game loaders - will be implemented
function loadBalloonGame() {
  const screen = document.getElementById('game-screen');
  screen.innerHTML = `
    <style>
      .balloon {
        transition: transform 0.3s ease, opacity 0.3s ease;
        width: 80px;
        height: 120px;
      }
      #balloon-area {
        height: clamp(220px, 42vh, 420px);
      }
      #pause-overlay {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.85);
        justify-content: center;
        align-items: center;
        font-size: 1.6rem;
        color: #222;
        border-radius: 10px;
        z-index: 999;
        pointer-events: all;
      }
      .instruction {
        color: #222;
        font-size: 1.15rem;
        margin: 10px auto 20px;
        max-width: 520px;
      }
      .start-btn {
        font-size: 22px;
        padding: 16px 34px;
        border-radius: 14px;
        background: linear-gradient(45deg, #FF6B6B, #FFD93D);
        border: 2px solid #ffffff;
        color: #222;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 12px 18px rgba(0,0,0,0.25);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .start-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 22px rgba(0,0,0,0.35);
      }
      .start-btn:active {
        transform: translateY(0);
        box-shadow: 0 10px 14px rgba(0,0,0,0.35);
      }
      .scale-blast {
        animation: scaleBlast 0.6s ease-out forwards;
      }
      .rotate-blast {
        animation: rotateBlast 0.6s ease-out forwards;
      }
      .burst-blast {
        animation: burstBlast 0.6s ease-out forwards;
      }
      .confetti-piece {
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 3px;
        pointer-events: none;
        opacity: 1;
        z-index: 20;
      }
      @keyframes scaleBlast {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.8; }
        100% { transform: scale(0); opacity: 0; }
      }
      @keyframes rotateBlast {
        0% { transform: scale(1) rotate(0deg); opacity: 1; }
        50% { transform: scale(1.3) rotate(180deg); opacity: 0.7; }
        100% { transform: scale(0) rotate(360deg); opacity: 0; }
      }
      @keyframes burstBlast {
        0% { transform: scale(1); opacity: 1; }
        25% { transform: scale(1.2) rotate(90deg); opacity: 0.9; }
        50% { transform: scale(0.8) rotate(180deg); opacity: 0.5; }
        75% { transform: scale(1.4) rotate(270deg); opacity: 0.3; }
        100% { transform: scale(0) rotate(360deg); opacity: 0; }
      }
      @keyframes playAgainPulse {
        0%   { transform: scale(1);    box-shadow: 0 12px 18px rgba(0,0,0,0.25); }
        50%  { transform: scale(1.18); box-shadow: 0 20px 32px rgba(0,0,0,0.35); }
        100% { transform: scale(1);    box-shadow: 0 12px 18px rgba(0,0,0,0.25); }
      }
      .play-again-pulse {
        animation: playAgainPulse 0.8s ease-in-out infinite;
      }
      /* Responsive */
      @media (max-width: 768px) {
        .balloon {
          width: 65px !important;
          height: 97px !important;
        }
        .start-btn {
          font-size: 20px;
          padding: 14px 28px;
        }
      }
      @media (max-width: 480px) {
        .balloon {
          width: 55px !important;
          height: 82px !important;
        }
        .start-btn {
          font-size: 18px;
          padding: 12px 24px;
        }
      }
      /* Landscape on small-screen devices — shrink area height and balloons */
      @media (orientation: landscape) and (max-height: 520px) {
        #balloon-area {
          height: clamp(160px, 54vh, 280px) !important;
        }
        .balloon {
          width: 52px !important;
          height: 78px !important;
        }
      }
      /* Fullscreen play area */
      #balloon-area.balloon-fullscreen {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        z-index: 9999 !important;
        border-radius: 0 !important;
        margin: 0 !important;
      }
      #fs-btn {
        font-size: 22px;
        padding: 16px 28px;
        border-radius: 14px;
        background: linear-gradient(45deg, #4ECDC4, #45B7D1);
        border: 2px solid #ffffff;
        color: #222;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 12px 18px rgba(0,0,0,0.25);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      #fs-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 22px rgba(0,0,0,0.35);
      }
      #fs-btn:active {
        transform: translateY(0);
        box-shadow: 0 10px 14px rgba(0,0,0,0.35);
      }
      #fs-score-overlay {
        display: none;
        position: absolute;
        top: 10px;
        left: 12px;
        z-index: 10001;
        background: rgba(0,0,0,0.4);
        color: #fff;
        border-radius: 10px;
        padding: 5px 16px;
        font-size: 1.2rem;
        font-weight: 700;
        font-family: 'Nunito', Arial, sans-serif;
        backdrop-filter: blur(4px);
        pointer-events: none;
      }
      #balloon-area.balloon-fullscreen #fs-score-overlay {
        display: block;
      }
    </style>
    <h2>Balloon Pop Game</h2>
    <p class="instruction">Tap or type letters to pop balloons.</p>
    <div style="margin-bottom: 10px;">
      <label style="margin-right: 16px;"><input type="checkbox" id="case-toggle" ${isUppercase ? 'checked' : ''} onchange="toggleCase()"> Uppercase Letters</label>
      <label style="margin-right: 16px;"><input type="checkbox" id="object-toggle" ${useObjectWords ? 'checked' : ''} onchange="toggleObjectWords()"> Say object (e.g., Z for Zebra)</label>
      <label><input type="checkbox" id="randomize-toggle" ${randomizeObjects ? 'checked' : ''} onchange="toggleRandomizeObjects()"> Random objects</label>
      <button class="start-btn" style="margin-left: 12px;" onclick="openObjectEditor()">Edit Objects</button>
    </div>
    <button class="start-btn" onclick="startBalloonGame()">▶ Start Game</button>
    <button id="fs-btn" onclick="toggleBalloonFullscreen()">⛶ Full Screen</button>
    <div id="balloon-area" style="position: relative; background: linear-gradient(to bottom, #00BFFF 0%, #FFD700 50%, #32CD32 100%); border-radius: 10px; overflow: hidden; margin-top: 10px;">
      <div id="fs-score-overlay">Score: 0</div>
      <!-- Balloons will be added here -->
    </div>
    <div id="score">Score: 0</div>
  `;
}

function startBalloonGame() {
  // Remove previous listeners
  document.removeEventListener('keydown', handleKeyPress);
  window.removeEventListener('resize', repositionBalloons);
  playStartMusic();

  const balloonArea = document.getElementById('balloon-area');
  // Remove only balloons/confetti, preserve score overlay inside area
  [...balloonArea.children].forEach(child => {
    if (child.id !== 'fs-score-overlay' && child.id !== 'fs-exit-btn') child.remove();
  });
  currentScore = 0;
  scoreDisplay = document.getElementById('score');
  scoreDisplay.textContent = 'Score: 0';
  const fsScoreEl = document.getElementById('fs-score-overlay');
  if (fsScoreEl) fsScoreEl.textContent = 'Score: 0';

  // Build a pool where each letter appears at most twice, then shuffle
  const alphabet = (isUppercase ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : 'abcdefghijklmnopqrstuvwxyz').split('');
  const pool = [...alphabet, ...alphabet]; // each letter max twice
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  currentBalloons = [];

  // Pick first 10 from the shuffled pool (guaranteed no letter appears > 2×)
  for (let i = 0; i < 10; i++) {
    const balloon = createBalloon(pool[i], balloonArea);
    balloonArea.appendChild(balloon);
    currentBalloons.push(balloon);
  }

  // Add keyboard listener and resize handler for orientation changes
  document.addEventListener('keydown', handleKeyPress);
  window.addEventListener('resize', repositionBalloons);
}

function pauseGameFor(seconds, message) {
  isPaused = true;
  const overlay = document.getElementById('pause-overlay');
  if (overlay) {
    overlay.innerText = message;
    overlay.style.display = 'flex';
  }
  setTimeout(() => {
    isPaused = false;
    if (overlay) {
      overlay.style.display = 'none';
    }
  }, seconds * 1000);
}

function speakLetter(letter) {
  const upper = letter.toUpperCase();
  const objectWord = getObjectWord(letter);
  const spokenRate = Math.max(0.5, accessibilitySettings.speechRate * 0.85);

  const afterLetter = () => {
    if (!useObjectWords) return;
    const phraseKey = upper + '_phrase';
    const phrase = `${upper} for ${objectWord}`;
    if (!playCustomRecording(phraseKey, null)) {
      speakText(phrase, spokenRate, accessibilitySettings.volume);
    }
  };

  // Use custom recording if available, otherwise fall back to TTS
  if (!playCustomRecording(upper, afterLetter)) {
    speakText(
      letter.toLowerCase(),
      spokenRate,
      accessibilitySettings.volume,
      useObjectWords ? afterLetter : null
    );
  }
}

function playStartMusic() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume().then(() => {
      // Cheerful ascending arpeggio: C5 E5 G5 C6
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.28, start + 0.04);
        gain.gain.linearRampToValueAtTime(0, start + 0.22);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    }).catch(() => {});
  } catch(e) {}
}

function playVictoryMusic() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume().then(() => {
      // Victory fanfare melody
      const melody = [
        [523, 0.00, 0.12],
        [523, 0.13, 0.12],
        [523, 0.26, 0.12],
        [659, 0.38, 0.25],
        [784, 0.64, 0.50],
        [698, 0.90, 0.12],
        [784, 1.03, 0.70]
      ];
      melody.forEach(([freq, when, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const start = ctx.currentTime + when;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.32, start + 0.04);
        gain.gain.linearRampToValueAtTime(0, start + dur);
        osc.start(start);
        osc.stop(start + dur + 0.05);
      });
    }).catch(() => {});
  } catch(e) {}
}

function throwBigConfetti() {
  const area = document.getElementById('balloon-area');
  if (!area) return;
  const palette = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#F7A4FF','#FF8FA3','#FFC75F','#00C9A7','#845EC2','#FF8066','#fff'];
  const w = area.offsetWidth;
  const h = area.offsetHeight;
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement('div');
    const size = 10 + Math.random() * 14;
    const startX = Math.random() * w;
    piece.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${startX}px;top:-20px;background:${palette[Math.floor(Math.random()*palette.length)]};border-radius:${Math.random()>0.4?'50%':'3px'};z-index:30;pointer-events:none;opacity:1;`;
    area.appendChild(piece);
    const fallDuration = 900 + Math.random() * 1300;
    const delay = Math.random() * 500;
    const driftX = (Math.random() - 0.5) * 160;
    setTimeout(() => {
      piece.style.transition = `transform ${fallDuration}ms ease-in, opacity ${fallDuration * 0.6}ms ${fallDuration * 0.4}ms ease-in`;
      piece.style.transform = `translate(${driftX}px, ${h + 30}px) rotate(${Math.random() * 720}deg)`;
      piece.style.opacity = '0';
    }, delay);
    setTimeout(() => piece.remove(), delay + fallDuration + 100);
  }
}

function getLetterConfettiPalette(letter) {
  const palettes = [
    ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
    ['#FF8FAB', '#FFC75F', '#845EC2', '#00C9A7'],
    ['#F9F871', '#F9844A', '#43AA8B', '#577590'],
    ['#A0E7E5', '#B4F8C8', '#FBE7C6', '#FFAEBC'],
    ['#FF9671', '#FFC75F', '#F9F871', '#D65DB1'],
    ['#00C2A8', '#2C73D2', '#845EC2', '#FF8066']
  ];
  const index = letter.toUpperCase().charCodeAt(0) % palettes.length;
  return palettes[index];
}

function createConfettiBurst(balloon, letter) {
  const balloonArea = document.getElementById('balloon-area');
  if (!balloonArea) return;

  const areaRect = balloonArea.getBoundingClientRect();
  const balloonRect = balloon.getBoundingClientRect();
  const centerX = balloonRect.left - areaRect.left + balloonRect.width / 2;
  // target the balloon body center, not the string at the very bottom
  const centerY = balloonRect.top - areaRect.top + balloonRect.height * 0.40;
  const palette = getLetterConfettiPalette(letter);

  for (let i = 0; i < 18; i++) {
    const piece = document.createElement('div');
    const size = 8 + Math.random() * 8;
    const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.5;
    const distance = 45 + Math.random() * 70;
    const driftX = Math.cos(angle) * distance;
    const driftY = Math.sin(angle) * distance - (20 + Math.random() * 50);

    piece.className = 'confetti-piece';
    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.left = `${centerX - size / 2}px`;
    piece.style.top = `${centerY - size / 2}px`;
    piece.style.background = palette[i % palette.length];
    piece.style.borderRadius = i % 3 === 0 ? '50%' : '3px';
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    piece.style.boxShadow = '0 2px 6px rgba(0,0,0,0.18)';
    balloonArea.appendChild(piece);

    requestAnimationFrame(() => {
      piece.style.transition = `transform ${700 + Math.random() * 300}ms ease-out, opacity ${700 + Math.random() * 300}ms ease-out`;
      piece.style.transform = `translate(${driftX}px, ${driftY}px) rotate(${180 + Math.random() * 360}deg)`;
      piece.style.opacity = '0';
    });

    setTimeout(() => piece.remove(), 1100);
  }
}

function getObjectWord(letter) {
  const upper = letter.toUpperCase();
  if (randomizeObjects) {
    const pool = letterWordPool[upper];
    if (pool && pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  return letterObjects[upper] || upper;
}

function toggleObjectWords() {
  useObjectWords = !useObjectWords;
}

function toggleRandomizeObjects() {
  randomizeObjects = !randomizeObjects;
}

function openObjectEditor() {
  const letter = prompt('Enter letter to edit (A-Z):');
  if (!letter || letter.length !== 1) return;
  const upper = letter.toUpperCase();
  const current = letterObjects[upper] || '';
  const replacement = prompt(`Enter object for ${upper} (e.g. Zebra):`, current);
  if (replacement !== null) {
    letterObjects[upper] = replacement.trim() || current;
  }
}

function toggleBalloonFullscreen() {
  const area = document.getElementById('balloon-area');
  const btn = document.getElementById('fs-btn');
  if (!area) return;
  const isFullscreen = area.classList.toggle('balloon-fullscreen');
  if (btn) btn.textContent = isFullscreen ? '⛶ Exit Full Screen' : '⛶ Full Screen';
  // Show/hide an in-area exit button when fullscreen
  let exitBtn = document.getElementById('fs-exit-btn');
  if (isFullscreen) {
    if (!exitBtn) {
      exitBtn = document.createElement('button');
      exitBtn.id = 'fs-exit-btn';
      exitBtn.textContent = '✕ Exit';
      exitBtn.style.cssText = 'position:absolute;top:10px;right:12px;z-index:10002;background:rgba(0,0,0,0.5);color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:1rem;font-family:Nunito,Arial,sans-serif;font-weight:700;cursor:pointer;backdrop-filter:blur(4px);';
      exitBtn.onclick = toggleBalloonFullscreen;
      area.appendChild(exitBtn);
    }
  } else {
    if (exitBtn) exitBtn.remove();
  }
  // Sync score overlay with current score
  const score = document.getElementById('score');
  const fsScore = document.getElementById('fs-score-overlay');
  if (fsScore && score) fsScore.textContent = score.textContent;
  // Reflow balloons after browser repaints the new size
  setTimeout(repositionBalloons, 80);
}


  // Function to create a balloon
  function createBalloon(letter, balloonArea) {
    const color1 = getRandomColor();
    const color2 = getRandomColor();
    const gradId = 'bg' + Math.random().toString(36).slice(2, 8);

    const container = document.createElement('div');
    container.className = 'balloon';
    container.dataset.letter = letter;
    container.style.position = 'absolute';
    container.style.cursor = 'pointer';
    // Use percentage positioning so balloons reflow when the area resizes (orientation change)
    const areaW = balloonArea.offsetWidth || 300;
    const areaH = balloonArea.offsetHeight || 280;
    // Estimate current CSS balloon size via breakpoint
    const bW = window.innerWidth <= 480 ? 55 : window.innerWidth <= 768 ? 65 : 80;
    const bH = bW * 1.5;
    const xPct = Math.random() * Math.max(0, (areaW - bW) / areaW * 100);
    const yPct = Math.random() * Math.max(0, (areaH - bH) / areaH * 100);
    container.dataset.xPct = xPct;
    container.dataset.yPct = yPct;
    container.style.left = xPct + '%';
    container.style.top = yPct + '%';

    container.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="${gradId}" cx="32%" cy="28%" r="65%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.75)"/>
            <stop offset="35%" stop-color="${color1}"/>
            <stop offset="100%" stop-color="${color2}"/>
          </radialGradient>
        </defs>
        <path d="M 40 5 C 78 5, 78 82, 40 88 C 2 82, 2 5, 40 5 Z" fill="url(#${gradId})"/>
        <ellipse cx="26" cy="24" rx="10" ry="7" fill="rgba(255,255,255,0.40)" transform="rotate(-20,26,24)"/>
        <ellipse cx="55" cy="17" rx="4" ry="3" fill="rgba(255,255,255,0.25)"/>
        <path d="M 37 88 Q 40 95 43 88 Q 41 99 40 99 Q 39 99 37 88 Z" fill="${color2}"/>
        <path d="M 40 99 Q 36 109 40 118" stroke="rgba(80,80,80,0.6)" stroke-width="1.5" fill="none"/>
        <text x="40" y="49" text-anchor="middle" dominant-baseline="middle" font-size="28" font-weight="900" font-family="Nunito, Trebuchet MS, Arial, sans-serif" fill="#111">${letter}</text>
      </svg>
    `;

    container.addEventListener('click', () => {
      popBalloon(container, letter);
    });

    return container;
  }

  // Reposition all active balloons within current area bounds (called on resize/orientation change)
  function repositionBalloons() {
    const area = document.getElementById('balloon-area');
    if (!area || currentBalloons.length === 0) return;
    const areaW = area.offsetWidth;
    const areaH = area.offsetHeight;
    currentBalloons.forEach(b => {
      const bW = b.offsetWidth || 70;
      const bH = b.offsetHeight || 105;
      let xPct = parseFloat(b.dataset.xPct) || 0;
      let yPct = parseFloat(b.dataset.yPct) || 0;
      const maxXPct = Math.max(0, (areaW - bW) / areaW * 100);
      const maxYPct = Math.max(0, (areaH - bH) / areaH * 100);
      xPct = Math.min(xPct, maxXPct);
      yPct = Math.min(yPct, maxYPct);
      b.dataset.xPct = xPct;
      b.dataset.yPct = yPct;
      b.style.left = xPct + '%';
      b.style.top = yPct + '%';
    });
  }

  // Function to pop balloon
  function popBalloon(balloon, letter) {
    if (isPaused) return;

    // Play sound
    speakLetter(letter);
    createConfettiBurst(balloon, letter);

    // Update score
    currentScore++;
    if (scoreDisplay) scoreDisplay.textContent = 'Score: ' + currentScore;
    const fsScoreEl = document.getElementById('fs-score-overlay');
    if (fsScoreEl) fsScoreEl.textContent = 'Score: ' + currentScore;

    // Random blast effect
    const blastTypes = ['scale-blast', 'rotate-blast', 'burst-blast'];
    const blastType = blastTypes[Math.floor(Math.random() * blastTypes.length)];
    balloon.classList.add(blastType);

    // Remove after animation
    setTimeout(() => {
      balloon.remove();
      currentBalloons = currentBalloons.filter(b => b !== balloon);
      if (currentBalloons.length === 0) {
        document.removeEventListener('keydown', handleKeyPress);
        window.removeEventListener('resize', repositionBalloons);
        const area = document.getElementById('balloon-area');
        area.innerHTML = '';
        throwBigConfetti();
        const msg = document.createElement('div');
        msg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:50;pointer-events:none;';
        msg.innerHTML = '<h3 style="font-size:2rem;color:#fff;text-shadow:2px 2px 10px #333,0 0 30px rgba(0,0,0,0.5);margin-bottom:16px;">🎉 All balloons popped! 🎉</h3>';
        area.appendChild(msg);
        const playAgainBtn = document.createElement('button');
        playAgainBtn.className = 'start-btn play-again-pulse';
        playAgainBtn.textContent = '🎈 Play Again 🎈';
        playAgainBtn.style.pointerEvents = 'all';
        playAgainBtn.style.fontSize = '1.5rem';
        playAgainBtn.style.marginTop = '8px';
        playAgainBtn.onclick = startBalloonGame;
        msg.appendChild(playAgainBtn);
        stopBgMusic(800);
        playVictoryMusic();
        setTimeout(() => {
          speakText('Good job! Well done, Kuhan!', 0.75, accessibilitySettings.volume);
        }, 600);
      }
    }, 600); // Longer for animation
  }

  // Helper function for random colors
  function getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

function loadColorGame() {
  document.getElementById('game-screen').innerHTML = `
    <h2>Color Matching Game</h2>
    <p>Match colors with sensory feedback! (Coming soon)</p>
    <div id="color-area" style="height: 300px; background: white; border-radius: 10px; display: flex; justify-content: center; align-items: center;">
      <p>Color matching interface will be here</p>
    </div>
  `;
}

function loadWordGame() {
  document.getElementById('game-screen').innerHTML = `
    <h2>Word Builder Game</h2>
    <p>Build words by dragging letters! (Coming soon)</p>
    <div id="word-area" style="height: 300px; background: white; border-radius: 10px; display: flex; justify-content: center; align-items: center;">
      <p>Word building interface will be here</p>
    </div>
  `;
}

function loadShapesGame() {
  const screen = document.getElementById('game-screen');
  screen.innerHTML = `
    <style>
      .shapes-wrap {
        max-width: 740px;
        margin: 0 auto;
      }
      .shapes-target {
        font-size: 1.3rem;
        margin: 12px 0;
        color: #222;
      }
      .shapes-meta {
        display: flex;
        justify-content: center;
        gap: 14px;
        font-weight: bold;
        color: #333;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .shapes-playfield {
        position: relative;
        width: 100%;
        height: 420px;
        border-radius: 16px;
        border: 3px solid rgba(255,255,255,0.85);
        background: linear-gradient(180deg, #dff6ff 0%, #f5fff0 100%);
        overflow: hidden;
      }
      .shape-btn {
        position: absolute;
        width: 180px;
        height: 180px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        background: #ffffff;
        box-shadow: 0 8px 16px rgba(0,0,0,0.16);
        transition: left 0.35s ease, top 0.35s ease, transform 0.35s ease, box-shadow 0.35s ease;
        font-size: 3.8rem;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .shape-symbol {
        display: inline-block;
        line-height: 1;
      }
      .shape-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 22px rgba(0,0,0,0.24);
      }
      .shape-btn:active {
        transform: translateY(0);
      }
      .shape-btn.is-selected {
        transform: scale(1.28);
        box-shadow: 0 18px 30px rgba(0,0,0,0.24);
        z-index: 2;
      }
      .shape-status {
        min-height: 26px;
        font-weight: bold;
        margin: 10px 0;
        color: #222;
      }
      .shape-start-btn {
        font-size: 20px;
        padding: 12px 28px;
        border-radius: 12px;
        background: linear-gradient(45deg, #6BD66B, #F7DC6F);
        border: 2px solid #fff;
        color: #222;
        font-weight: bold;
        cursor: pointer;
        margin: 8px 0 12px;
      }
      .shape-replay-btn {
        display: none;
        font-size: 20px;
        padding: 12px 28px;
        border-radius: 12px;
        background: linear-gradient(45deg, #45B7D1, #98D8C8);
        border: 2px solid #fff;
        color: #222;
        font-weight: bold;
        cursor: pointer;
        margin: 8px 0 12px;
      }
      @media (max-width: 480px) {
        .shapes-playfield {
          height: 340px;
        }
        .shape-btn {
          width: 140px;
          height: 140px;
          font-size: 3rem;
        }
      }
    </style>
    <div class="shapes-wrap">
      <h2>SHAPES Game</h2>
      <p>Tap any shape. After 2 seconds, the game says its name.</p>
      <button class="shape-start-btn" onclick="startShapesGame()">Start SHAPES</button>
      <button id="shapes-replay-btn" class="shape-replay-btn" onclick="startShapesGame()">Play Again</button>
      <div class="shapes-meta">
        <span id="shapes-score">Score: 0</span>
        <span id="shapes-round">Clicks: 0</span>
      </div>
      <div id="shapes-target" class="shapes-target">Press start to show shapes.</div>
      <div id="shapes-status" class="shape-status"></div>
      <div id="shapes-grid" class="shapes-playfield"></div>
    </div>
  `;
}

function startShapesGame() {
  shapesScore = 0;
  shapesRound = 0;
  isShapeSpeakPending = false;
  updateShapesHud();
  setShapesStatus('Tap a shape to hear it spoken.');
  toggleShapesReplay(false);
  renderShapeOptions(shapeBank);

  const targetEl = document.getElementById('shapes-target');
  if (targetEl) {
    targetEl.textContent = 'Choose any shape below.';
  }
}

function renderShapeOptions(options) {
  const playfield = document.getElementById('shapes-grid');
  if (!playfield) return;

  playfield.innerHTML = '';
  const isSmallScreen = window.innerWidth <= 480;
  const buttonSize = isSmallScreen ? 140 : 180;
  const placedPositions = [];

  const maxLeft = Math.max(0, playfield.clientWidth - buttonSize);
  const maxTop = Math.max(0, playfield.clientHeight - buttonSize);

  options.forEach((shape) => {
    const button = document.createElement('button');
    button.className = 'shape-btn';
    button.setAttribute('aria-label', shape.name);
    button.onclick = (event) => handleShapeChoice(shape, event.currentTarget);

    const symbol = document.createElement('span');
    symbol.className = 'shape-symbol';
    symbol.textContent = shape.symbol;
    symbol.style.color = shape.color;
    symbol.style.transform = `scale(${shape.scale || 1})`;
    button.appendChild(symbol);

    const position = getRandomNonOverlappingPosition(maxLeft, maxTop, buttonSize, placedPositions);
    button.style.left = `${position.left}px`;
    button.style.top = `${position.top}px`;

    placedPositions.push(position);
    playfield.appendChild(button);
  });
}

function getRandomNonOverlappingPosition(maxLeft, maxTop, buttonSize, placedPositions) {
  const attempts = 30;
  const minGap = buttonSize * 0.7;

  for (let i = 0; i < attempts; i += 1) {
    const candidate = {
      left: Math.floor(Math.random() * (maxLeft + 1)),
      top: Math.floor(Math.random() * (maxTop + 1))
    };

    const overlaps = placedPositions.some((pos) => {
      const dx = pos.left - candidate.left;
      const dy = pos.top - candidate.top;
      return Math.hypot(dx, dy) < minGap;
    });

    if (!overlaps) {
      return candidate;
    }
  }

  return {
    left: Math.floor(Math.random() * (maxLeft + 1)),
    top: Math.floor(Math.random() * (maxTop + 1))
  };
}

function handleShapeChoice(shape, shapeButton) {
  if (isShapeSpeakPending) return;

  isShapeSpeakPending = true;
  shapesScore += 1;
  shapesRound += 1;
  updateShapesHud();

  if (shapeButton && shapeButton.classList) {
    moveShapeToCenter(shapeButton);
    shapeButton.classList.add('is-selected');
    shapeButton.disabled = true;
  }

  setShapesStatus('Nice tap! Listen...');
  speakThisIsAThenShape(shape.name, () => {
    if (shapeButton && typeof shapeButton.remove === 'function') {
      shapeButton.remove();
    }
    if (isShapesGameOver()) {
      finishShapesGame();
    } else {
      setShapesStatus('Tap another shape.');
    }
    isShapeSpeakPending = false;
  });
}

function isShapesGameOver() {
  const playfield = document.getElementById('shapes-grid');
  if (!playfield) return false;
  return playfield.querySelectorAll('.shape-btn').length === 0;
}

function finishShapesGame() {
  const targetEl = document.getElementById('shapes-target');
  if (targetEl) {
    targetEl.textContent = 'All done. Great job!';
  }
  setShapesStatus('Press Play Again for new shapes.');
  toggleShapesReplay(true);
}

function toggleShapesReplay(isVisible) {
  const replayButton = document.getElementById('shapes-replay-btn');
  if (replayButton) {
    replayButton.style.display = isVisible ? 'inline-block' : 'none';
  }
}

function moveShapeToCenter(shapeButton) {
  const playfield = document.getElementById('shapes-grid');
  if (!playfield || !shapeButton) return;

  const targetLeft = Math.max(0, (playfield.clientWidth - shapeButton.offsetWidth) / 2);
  const targetTop = Math.max(0, (playfield.clientHeight - shapeButton.offsetHeight) / 2);

  shapeButton.style.left = `${targetLeft}px`;
  shapeButton.style.top = `${targetTop}px`;
}

function updateShapesHud() {
  const scoreEl = document.getElementById('shapes-score');
  const roundEl = document.getElementById('shapes-round');

  if (scoreEl) {
    scoreEl.textContent = `Score: ${shapesScore}`;
  }
  if (roundEl) {
    roundEl.textContent = `Clicks: ${shapesRound}`;
  }
}

function setShapesStatus(message) {
  const status = document.getElementById('shapes-status');
  if (status) {
    status.textContent = message;
  }
}

function speakShapeName(name) {
  speakText(name, accessibilitySettings.speechRate, accessibilitySettings.volume);
}

function speakThisIsAThenShape(name, onDone) {
  const slowerRate = Math.max(0.5, accessibilitySettings.speechRate * 0.7);
  let isDoneCalled = false;

  const finish = () => {
    if (isDoneCalled) return;
    isDoneCalled = true;
    if (typeof onDone === 'function') {
      onDone();
    }
  };

  const intro = new SpeechSynthesisUtterance('This is a ...');
  const voice = getPreferredVoice();
  if (voice) intro.voice = voice;
  intro.pitch = 1.1;
  intro.volume = accessibilitySettings.volume;
  intro.rate = slowerRate;

  const shapeName = new SpeechSynthesisUtterance(name);
  if (voice) shapeName.voice = voice;
  shapeName.pitch = 1.1;
  shapeName.volume = accessibilitySettings.volume;
  shapeName.rate = slowerRate;
  shapeName.onend = finish;

  window.speechSynthesis.speak(intro);
  setTimeout(() => {
    window.speechSynthesis.speak(shapeName);
  }, 2000);

  // Fallback in case speech events are blocked or unavailable.
  setTimeout(finish, 7000);
}

// Accessibility settings (placeholder)
const accessibilitySettings = {
  volume: 0.5,
  visualIntensity: 1.0,
  speechRate: 0.8
};

// Function to update settings (will be expanded)
function updateSettings(setting, value) {
  accessibilitySettings[setting] = value;
  console.log('Settings updated:', accessibilitySettings);
}

// Settings panel functions
function showSettings() {
  const panel = document.getElementById('settings-panel');
  panel.style.display = 'block';
  document.getElementById('volume-slider').value = accessibilitySettings.volume;
  document.getElementById('speech-slider').value = accessibilitySettings.speechRate;
  document.getElementById('visual-slider').value = accessibilitySettings.visualIntensity;
  const ms = document.getElementById('music-select');
  if (ms) ms.value = selectedBgMusic;
}

function hideSettings() {
  document.getElementById('settings-panel').style.display = 'none';
}

function saveSettings() {
  accessibilitySettings.volume = parseFloat(document.getElementById('volume-slider').value);
  accessibilitySettings.speechRate = parseFloat(document.getElementById('speech-slider').value);
  accessibilitySettings.visualIntensity = parseFloat(document.getElementById('visual-slider').value);
  const ms = document.getElementById('music-select');
  if (ms) selectBgMusic(ms.value);
  hideSettings();
  alert('Settings saved!');
}
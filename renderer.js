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
// Ranked preference list: first match wins.
const PREFERRED_VOICE_PRIORITY = [
  'Alex',           // macOS – natural male voice
  'Daniel',         // macOS
  'Fred',           // macOS
  'John',           // common Windows/Chrome male voice
  'David',          // common Windows voice
  'Microsoft David',
  'Google US English',
  'Google UK English Male',
  'en-US-Neural2-C',// Chrome neural
  'en-US-Wavenet-C',
  'Samantha',       // macOS / iOS – warm female fallback
  'Karen',          // macOS Australian
  'Moira',          // macOS Irish
  'Tessa',          // macOS South African
  'Veena',          // macOS Indian
  'Fiona',          // macOS Scottish
  'Victoria',       // macOS
  'Zira',           // Windows – Microsoft Zira
  'Microsoft Zira',
];

let _preferredVoice = null;
let _activeAudio = null; // currently playing custom audio (if any)

function isVoiceSelected(voice) {
  const current = accessibilitySettings.voiceName || '';
  return current && (voice.name === current || voice.name.includes(current));
}

function populateVoiceList() {
  const voiceList = document.getElementById('voice-list');
  if (!voiceList) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    voiceList.innerHTML = '<div style="color:#333;">Loading voices… please reopen settings if the list is empty.</div>';
    return;
  }

  const availableVoices = voices.filter(v => v.lang.startsWith('en'));
  const voicesToShow = availableVoices.length ? availableVoices : voices;
  const current = accessibilitySettings.voiceName || '';

  voiceList.innerHTML = '';
  for (const voice of voicesToShow) {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.padding = '10px';
    item.style.borderBottom = '1px solid #ddd';
    if (isVoiceSelected(voice)) item.style.background = '#e6f7ff';

    const label = document.createElement('div');
    label.innerHTML = `<strong>${voice.name}</strong> <span style="font-size:0.9rem;color:#555;">${voice.lang}</span>`;

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';

    const sampleButton = document.createElement('button');
    sampleButton.textContent = 'Sample';
    sampleButton.style.padding = '8px 12px';
    sampleButton.style.border = 'none';
    sampleButton.style.borderRadius = '10px';
    sampleButton.style.background = '#4CAF50';
    sampleButton.style.color = '#fff';
    sampleButton.style.cursor = 'pointer';
    sampleButton.onclick = () => sampleVoice(voice.name);

    const chooseButton = document.createElement('button');
    chooseButton.textContent = isVoiceSelected(voice) ? 'Selected' : 'Choose';
    chooseButton.style.padding = '8px 12px';
    chooseButton.style.border = 'none';
    chooseButton.style.borderRadius = '10px';
    chooseButton.style.background = isVoiceSelected(voice) ? '#999' : '#1E90FF';
    chooseButton.style.color = '#fff';
    chooseButton.style.cursor = isVoiceSelected(voice) ? 'default' : 'pointer';
    chooseButton.disabled = isVoiceSelected(voice);
    chooseButton.onclick = () => {
      accessibilitySettings.voiceName = voice.name;
      _preferredVoice = null;
      populateVoiceList();
    };

    controls.appendChild(sampleButton);
    controls.appendChild(chooseButton);
    item.appendChild(label);
    item.appendChild(controls);
    voiceList.appendChild(item);
  }
}

function sampleVoice(voiceName) {
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.name === voiceName || v.name.includes(voiceName));
  if (!voice) return;

  // Stop any currently playing custom audio and cancel queued speech
  try { if (_activeAudio) { _activeAudio.pause(); _activeAudio.currentTime = 0; _activeAudio = null; } } catch(e) {}
  try { window.speechSynthesis.cancel(); } catch(e) {}

  const utterance = new SpeechSynthesisUtterance(`This is a sample of the ${voice.name} voice.`);
  utterance.voice = voice;
  utterance.rate = accessibilitySettings.speechRate;
  utterance.volume = accessibilitySettings.volume;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

function getPreferredVoice() {
  if (_preferredVoice) return _preferredVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  if (accessibilitySettings.voiceName) {
    const selected = voices.find(v =>
      v.name === accessibilitySettings.voiceName || v.name.includes(accessibilitySettings.voiceName)
    );
    if (selected) { _preferredVoice = selected; return selected; }
  }

  for (const name of PREFERRED_VOICE_PRIORITY) {
    const v = voices.find(v => v.name.includes(name));
    if (v) { _preferredVoice = v; return v; }
  }

  const anyEnglish = voices.find(v => v.lang.startsWith('en'));
  if (anyEnglish) { _preferredVoice = anyEnglish; return anyEnglish; }
  _preferredVoice = voices[0];
  return voices[0];
}

// Re-resolve voice after voices list loads (async on some browsers)
window.speechSynthesis.onvoiceschanged = () => {
  _preferredVoice = null;
  populateVoiceList();
};

function speakText(text, rate, volume, onEnd) {
  // Ensure only the most recent sound plays: stop any custom audio and cancel prior speech
  try { if (_activeAudio) { _activeAudio.pause(); _activeAudio.currentTime = 0; _activeAudio = null; } } catch(e) {}
  try { window.speechSynthesis.cancel(); } catch(e) {}

  const utt = new SpeechSynthesisUtterance(text);
  utt.rate   = rate   ?? accessibilitySettings.speechRate;
  utt.volume = volume ?? accessibilitySettings.volume;
  utt.pitch  = 1.0;   // neutral pitch for better voice quality
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
  // Stop any TTS currently speaking and any previously playing custom audio
  try { window.speechSynthesis.cancel(); } catch(e) {}
  try { if (_activeAudio) { _activeAudio.pause(); _activeAudio.currentTime = 0; _activeAudio = null; } } catch(e) {}

  const audio = new Audio(dataUrl);
  _activeAudio = audio;
  audio.volume = accessibilitySettings.volume;
  if (onEnded) audio.addEventListener('ended', onEnded);
  audio.addEventListener('ended', () => { if (_activeAudio === audio) _activeAudio = null; });
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
let autoRespawnEnabled = false;
let autoRespawnTimeoutId = null;

const PHONICS_SOUNDS = {
  A: 'ah', B: 'buh', C: 'kuh', D: 'duh', E: 'eh', F: 'fuh', G: 'guh', H: 'huh',
  I: 'ih', J: 'juh', K: 'kuh', L: 'luh', M: 'muh', N: 'nuh', O: 'oh', P: 'puh',
  Q: 'kwuh', R: 'ruh', S: 'sss', T: 'tuh', U: 'uh', V: 'vuh', W: 'wuh', X: 'ks', Y: 'yuh', Z: 'zuh'
};

const WORD_BUILDER_WORDS = [
  { word: 'egg', label: 'Egg', icon: '🥚', hint: 'A round breakfast food' },
  { word: 'cat', label: 'Cat', icon: '🐱', hint: 'A soft furry pet' },
  { word: 'sun', label: 'Sun', icon: '☀️', hint: 'A bright yellow star' },
  { word: 'dog', label: 'Dog', icon: '🐶', hint: 'A friendly pet' },
  { word: 'hat', label: 'Hat', icon: '🎩', hint: 'Something you wear on your head' },
  { word: 'pig', label: 'Pig', icon: '🐷', hint: 'A pink farm animal' },
  { word: 'bus', label: 'Bus', icon: '🚌', hint: 'A vehicle that carries people' },
  { word: 'fox', label: 'Fox', icon: '🦊', hint: 'A clever wild animal' }
];

let wordBuilderOrder = [];
let wordBuilderIndex = 0;
let wordBuilderScore = 0;
let wordBuilderFormed = [];
let wordBuilderNextLetter = 0;
let wordBuilderPlaying = false;
let wordBuilderAutoAdvance = false;
let wordBuilderPendingNext = false;

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
  clearAutoRespawnTimeout();
  stopBgMusic(600);
  // Ensure keyboard listeners are removed
  document.removeEventListener('keydown', handleKeyPress);
  document.removeEventListener('keydown', handleWordBuilderKeyDown);
  document.removeEventListener('keydown', handleShapesKeyDown);

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
      <div class="game-tile" onclick="loadGame('trace')">
        <div class="tile-icon">✍️</div>
        <div class="tile-title">Trace Letters</div>
        <div class="tile-sub">Trace A and a with touch or mouse</div>
      </div>
      <div class="game-tile" onclick="showSettings(); setSettingsTab('voices')">
        <div class="tile-icon">🎙️</div>
        <div class="tile-title">Change Voice</div>
        <div class="tile-sub">Pick from available voice options</div>
      </div>
    </div>
  `;
}

// Game loading function
function loadGame(gameName) {
  clearAutoRespawnTimeout();
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
    case 'trace':
      loadTraceGame();
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
      <label style="margin-right: 16px;"><input type="checkbox" id="auto-respawn-toggle" ${autoRespawnEnabled ? 'checked' : ''} onchange="toggleAutoRespawn(this.checked)"> Auto respawn when done</label>
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
  clearAutoRespawnTimeout();
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

function toggleAutoRespawn(enabled) {
  autoRespawnEnabled = Boolean(enabled);
}

function clearAutoRespawnTimeout() {
  if (autoRespawnTimeoutId) {
    clearTimeout(autoRespawnTimeoutId);
    autoRespawnTimeoutId = null;
  }
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
        if (autoRespawnEnabled) {
          autoRespawnTimeoutId = setTimeout(startBalloonGame, 1400);
        }
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
  const screen = document.getElementById('game-screen');
  screen.innerHTML = `
    <style>
      .word-builder-wrap {
        max-width: 760px;
        margin: 0 auto;
        padding: 18px;
        background: radial-gradient(circle at top left, #ffb3d9 0%, #ffefc7 35%, #c8f1ff 75%, #e8f9ff 100%);
        border-radius: 30px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.12);
      }
      .word-builder-panel {
        display: grid;
        gap: 16px;
        text-align: center;
      }
      .word-builder-card {
        display: grid;
        gap: 12px;
        background: linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.75) 100%);
        border: 2px solid rgba(255,255,255,0.9);
        border-radius: 24px;
        padding: 18px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.12);
      }
      .word-builder-preview {
        display: flex;
        justify-content: center;
        gap: 14px;
        align-items: center;
        flex-wrap: wrap;
      }
      .word-builder-icon {
        font-size: 4.2rem;
      }
      .word-builder-hint {
        display: none;
      }
      .word-builder-controls {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
      }
      .word-builder-tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 16px;
        margin-top: 0;
        justify-items: center;
      }
      .word-tile {
        position: relative;
        width: 110px;
        height: 130px;
        background: radial-gradient(circle at 35% 28%, #ffffff 12%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,0.55) 36%, #ffeb92 52%, #ffb94e 72%, #ff8c6b 100%);
        border: 4px solid rgba(255,255,255,0.95);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 2.6rem;
        font-weight: 900;
        color: #222;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
        box-shadow: inset 0 10px 22px rgba(255,255,255,0.8), 0 18px 30px rgba(0,0,0,0.17);
      }
      .word-tile::before {
        content: '';
        position: absolute;
        width: 56px;
        height: 42px;
        top: 18px;
        left: 20px;
        background: rgba(255,255,255,0.75);
        border-radius: 40px 40px 30px 30px;
        transform: rotate(-20deg);
        filter: blur(0.5px);
      }
      .word-tile::after {
        content: '';
        position: absolute;
        width: 18px;
        height: 24px;
        background: rgba(255,255,255,0.95);
        border-radius: 10px 10px 6px 6px;
        bottom: -18px;
        left: 50%;
        transform: translateX(-50%);
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
      }
      .word-tile::before,
      .word-tile::after {
        pointer-events: none;
      }
      .word-tile:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 12px 22px rgba(0,0,0,0.18);
      }
      .word-tile:disabled {
        opacity: 0.35;
        cursor: default;
        transform: none;
      }
      .word-target {
        min-height: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        background: transparent;
        border: none;
        border-radius: 18px;
        padding: 0;
        font-size: 1.4rem;
        font-weight: 800;
        color: #1750a3;
      }
      .word-status {
        color: #2e2e2e;
        font-size: 1.05rem;
        min-height: 24px;
        font-weight: 700;
      }
      .word-builder-score {
        font-size: 1.2rem;
        font-weight: 700;
        color: #333;
      }
      .word-builder-action {
        font-size: 18px;
        padding: 12px 22px;
        border-radius: 14px;
        border: none;
        cursor: pointer;
        font-weight: 800;
        color: #222;
        background: linear-gradient(45deg, #4ec7f3, #6b70ff);
        box-shadow: 0 10px 18px rgba(0,0,0,0.18);
      }
      .word-builder-action:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .word-builder-auto-next {
        margin-top: 12px;
        font-size: 0.95rem;
        color: #2e2e2e;
      }
      .word-builder-auto-next label {
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      @media (max-width: 520px) {
        .word-builder-icon {
          font-size: 3.2rem;
        }
        .word-tile {
          min-height: 66px;
          font-size: 1.9rem;
        }
      }
    </style>
    <div class="word-builder-wrap">
      <h2>Word Builder</h2>
      <p class="instruction">Tap or type the letters in the colorful balloons.</p>
      <div class="word-builder-panel">
        <div class="word-builder-card">
          <div class="word-builder-preview">
            <div id="word-builder-icon" class="word-builder-icon">🥚</div>
            <div>
              <div id="word-builder-label" style="font-size:1.6rem;font-weight:800;color:#222;">Egg</div>
              <div id="word-builder-hint" class="word-builder-hint"></div>
            </div>
          </div>
          <div id="word-builder-tiles" class="word-builder-tiles"></div>
          <div id="word-builder-answer" class="word-target"></div>
          <div class="word-builder-controls">
            <button id="word-builder-action" class="word-builder-action" onclick="handleWordBuilderAction()">Start Word Builder</button>
          </div>
          <div class="word-builder-auto-next">
            <label><input id="word-builder-auto-next" type="checkbox" onchange="setWordBuilderAutoAdvance(this.checked)"> Auto next word on completion</label>
          </div>
          <div id="word-builder-status" class="word-status"></div>
        </div>
        <div class="word-builder-card" style="background: linear-gradient(180deg, #e2f4ff 0%, #f2fbff 100%);">
          <div class="word-builder-score" id="word-builder-score">Score: 0</div>
        </div>
      </div>
    </div>
  `;
}

function handleWordBuilderAction() {
  const button = document.getElementById('word-builder-action');
  if (!button) return;
  const label = button.textContent.trim();

  if (label === 'Start Word Builder' || label === 'Play Again') {
    wordBuilderOrder = WORD_BUILDER_WORDS.map((_, index) => index);
    wordBuilderIndex = 0;
    wordBuilderScore = 0;
    wordBuilderPlaying = true;
    wordBuilderFormed = [];
    wordBuilderNextLetter = 0;
    wordBuilderPendingNext = false;
    updateWordBuilderScore();
    loadWordBuilderWord();
    document.removeEventListener('keydown', handleWordBuilderKeyDown);
    document.addEventListener('keydown', handleWordBuilderKeyDown);
    return;
  }

  if (label === 'Next Word') {
    if (wordBuilderIndex + 1 < WORD_BUILDER_WORDS.length) {
      wordBuilderIndex += 1;
      wordBuilderPlaying = true;
      wordBuilderFormed = [];
      wordBuilderNextLetter = 0;
      wordBuilderPendingNext = false;
      updateWordBuilderActionButton('Next Word', false);
      loadWordBuilderWord();
      document.removeEventListener('keydown', handleWordBuilderKeyDown);
      document.addEventListener('keydown', handleWordBuilderKeyDown);
    } else {
      wordBuilderOrder = WORD_BUILDER_WORDS.map((_, index) => index);
      wordBuilderIndex = 0;
      wordBuilderScore = 0;
      wordBuilderPlaying = true;
      wordBuilderFormed = [];
      wordBuilderNextLetter = 0;
      wordBuilderPendingNext = false;
      updateWordBuilderScore();
      loadWordBuilderWord();
      document.removeEventListener('keydown', handleWordBuilderKeyDown);
      document.addEventListener('keydown', handleWordBuilderKeyDown);
    }
    return;
  }
}

function startWordBuilderGame() {
  handleWordBuilderAction();
}

function loadWordBuilderWord() {
  clearWordBuilder();
  const entry = WORD_BUILDER_WORDS[wordBuilderOrder[wordBuilderIndex]];
  const icon = document.getElementById('word-builder-icon');
  const label = document.getElementById('word-builder-label');
  const hint = document.getElementById('word-builder-hint');
  const status = document.getElementById('word-builder-status');
  if (icon) icon.textContent = entry.icon;
  if (label) label.textContent = entry.label;
  if (hint) hint.textContent = '';
  if (status) status.textContent = '';
  renderWordBuilderTiles(entry.word);
}

function renderWordBuilderTiles(word) {
  const tileArea = document.getElementById('word-builder-tiles');
  const answer = document.getElementById('word-builder-answer');
  if (!tileArea || !answer) return;
  tileArea.innerHTML = '';
  answer.textContent = '';
  wordBuilderFormed = [];
  wordBuilderNextLetter = 0;

  const letters = word.toUpperCase().split('');
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

  letters.forEach((letter, index) => {
    const button = document.createElement('button');
    button.className = 'word-tile';
    button.textContent = letter;
    button.id = `word-builder-tile-${index}`;
    button.disabled = index !== 0;
    button.style.background = `radial-gradient(circle at 30% 25%, #ffffff 15%, ${colors[index % colors.length]} 55%, ${colors[(index + 1) % colors.length]} 100%)`;
    if (index !== 0) {
      button.style.opacity = '0.45';
    }
    button.onclick = () => handleWordTileTap(letter, index);
    tileArea.appendChild(button);
  });
}

function handleWordTileTap(letter, index) {
  if (!wordBuilderPlaying) return;
  const expectedIndex = wordBuilderNextLetter;
  if (index !== expectedIndex) return;
  const tile = document.getElementById(`word-builder-tile-${index}`);
  if (!tile || tile.disabled) return;
  tile.disabled = true;
  tile.style.opacity = '0.45';
  wordBuilderFormed.push(letter);
  updateWordBuilderAnswerDisplay();
  speakLetterSound(letter);
  wordBuilderNextLetter += 1;

  const entry = WORD_BUILDER_WORDS[wordBuilderOrder[wordBuilderIndex]];
  if (wordBuilderNextLetter < entry.word.length) {
    const nextTile = document.getElementById(`word-builder-tile-${wordBuilderNextLetter}`);
    if (nextTile) {
      nextTile.disabled = false;
      nextTile.style.opacity = '1';
    }
  }
  if (wordBuilderFormed.length >= entry.word.length) {
    setTimeout(() => {
      speakSpelledWord(entry.word, entry.label);
      checkWordBuilderAnswer();
    }, 600);
  }
}

function handleWordBuilderKeyDown(event) {
  if (!wordBuilderPlaying) return;
  const key = event.key.toUpperCase();
  const entry = WORD_BUILDER_WORDS[wordBuilderOrder[wordBuilderIndex]];
  const expectedLetter = entry.word.toUpperCase().charAt(wordBuilderNextLetter);
  if (key === expectedLetter) {
    event.preventDefault();
    handleWordTileTap(expectedLetter, wordBuilderNextLetter);
  }
}

function updateWordBuilderAnswerDisplay() {
  const answer = document.getElementById('word-builder-answer');
  if (!answer) return;
  answer.textContent = '';
}

function updateWordBuilderActionButton(text, enabled, visible = true) {
  const button = document.getElementById('word-builder-action');
  if (!button) return;
  button.textContent = text;
  button.disabled = !enabled && wordBuilderPlaying;
  button.style.display = visible ? '' : 'none';
}

function setWordBuilderAutoAdvance(enabled) {
  wordBuilderAutoAdvance = !!enabled;
  const button = document.getElementById('word-builder-action');
  if (!button) return;
  if (wordBuilderAutoAdvance && button.textContent.trim() === 'Next Word') {
    button.style.display = 'none';
  } else {
    button.style.display = '';
  }
}

function checkWordBuilderAnswer() {
  const entry = WORD_BUILDER_WORDS[wordBuilderOrder[wordBuilderIndex]];
  const answer = wordBuilderFormed.join('');
  const status = document.getElementById('word-builder-status');
  if (answer === entry.word.toUpperCase()) {
    wordBuilderScore += 1;
    updateWordBuilderScore();
    if (status) status.textContent = '';
    playVictoryMusic();
    speakText(`Yes! ${entry.label} is spelled ${entry.word.toUpperCase()}.`, accessibilitySettings.speechRate, accessibilitySettings.volume);
    if (wordBuilderIndex + 1 < WORD_BUILDER_WORDS.length) {
      updateWordBuilderActionButton('Next Word', true, !wordBuilderAutoAdvance);
      if (wordBuilderAutoAdvance) {
        setTimeout(() => {
          if (wordBuilderAutoAdvance && !wordBuilderPlaying) {
            advanceWordBuilder();
          }
        }, 900);
      }
    } else {
      updateWordBuilderActionButton('Play Again', true, true);
    }
    wordBuilderPlaying = false;
    wordBuilderPendingNext = true;
  } else {
    if (status) status.textContent = '';
    resetWordTiles();
  }
}

function advanceWordBuilder() {
  wordBuilderIndex += 1;
  if (wordBuilderIndex >= WORD_BUILDER_WORDS.length) {
    wordBuilderPlaying = false;
    const status = document.getElementById('word-builder-status');
    if (status) status.textContent = '';
    document.getElementById('word-builder-answer').textContent = 'Great work!';
    updateWordBuilderActionButton('Play Again', true);
    document.removeEventListener('keydown', handleWordBuilderKeyDown);
    return;
  }
  wordBuilderPlaying = true;
  wordBuilderFormed = [];
  wordBuilderNextLetter = 0;
  loadWordBuilderWord();
  document.removeEventListener('keydown', handleWordBuilderKeyDown);
  document.addEventListener('keydown', handleWordBuilderKeyDown);
}

function clearWordBuilder() {
  wordBuilderFormed = [];
  wordBuilderNextLetter = 0;
  updateWordBuilderAnswerDisplay();
  const tileArea = document.getElementById('word-builder-tiles');
  if (!tileArea) return;
  Array.from(tileArea.children).forEach((child, index) => {
    if (child.tagName === 'BUTTON') {
      child.disabled = index !== 0;
      child.style.opacity = index === 0 ? '1' : '0.45';
    }
  });
  const status = document.getElementById('word-builder-status');
  if (status && wordBuilderPlaying) status.textContent = '';
}

function resetWordTiles() {
  wordBuilderFormed = [];
  updateWordBuilderAnswerDisplay();
  const entry = WORD_BUILDER_WORDS[wordBuilderOrder[wordBuilderIndex]];
  renderWordBuilderTiles(entry.word);
}

function updateWordBuilderScore() {
  const score = document.getElementById('word-builder-score');
  if (score) score.textContent = `Score: ${wordBuilderScore}`;
}

function speakLetterSound(letter) {
  const sound = PHONICS_SOUNDS[letter] || letter.toLowerCase();
  speakText(`${letter} says ${sound}`, accessibilitySettings.speechRate, accessibilitySettings.volume);
}

function speakWord(word, label) {
  const parts = word.toUpperCase().split('').map((ch) => {
    const sound = PHONICS_SOUNDS[ch] || ch.toLowerCase();
    return `${ch} says ${sound}`;
  });
  speakText(`Let us spell ${label}. ${parts.join(', ')}. The word is ${word}.`, accessibilitySettings.speechRate, accessibilitySettings.volume);
}

function speakSpelledWord(word, label) {
  const spaced = word.toUpperCase().split('').join(' ');
  // Slow down the completed word reading for clearer letter-by-letter spelling.
  speakText(`${spaced}. ${label}.`, accessibilitySettings.speechRate * 0.7, accessibilitySettings.volume);
}

function sayCurrentWord() {
  if (!wordBuilderPlaying) {
    const entry = WORD_BUILDER_WORDS[wordBuilderOrder[wordBuilderIndex] || 0];
    speakWord(entry.word, entry.label);
    return;
  }
  const entry = WORD_BUILDER_WORDS[wordBuilderOrder[wordBuilderIndex]];
  speakWord(entry.word, entry.label);
}

function showPhonicsHelp() {
  const entry = WORD_BUILDER_WORDS[wordBuilderOrder[wordBuilderIndex]];
  if (!entry) return;
  const phonics = entry.word.toUpperCase().split('').map((ch) => {
    return `${ch} is ${PHONICS_SOUNDS[ch] || ch.toLowerCase()}`;
  }).join(', ');
  speakText(`Here is the phonics help for ${entry.label}: ${phonics}.`, accessibilitySettings.speechRate, accessibilitySettings.volume);
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
        border-radius: 0;
        cursor: pointer;
        background: transparent;
        box-shadow: none;
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
      .shape-btn.spin-pop {
        animation: shapeSpinPop 900ms cubic-bezier(.22,.9,.28,1) forwards;
        transform-origin: center center;
        pointer-events: none;
      }

      @keyframes shapeSpinPop {
        0% { transform: rotate(0deg) scale(1); opacity: 1; }
        80% { transform: rotate(360deg) scale(1.02); opacity: 1; }
        100% { transform: rotate(360deg) scale(0); opacity: 0; }
      }

      .confetti-piece {
        position: absolute;
        width: 10px;
        height: 12px;
        border-radius: 2px;
        pointer-events: none;
        will-change: transform, opacity, top, left;
        mix-blend-mode: screen;
      }

      @keyframes confettiFloat {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(-120px) rotate(720deg); opacity: 0; }
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
      <p>Tap any shape and listen. It says the shape name, then disappears.</p>
      <button class="shape-start-btn" onclick="startShapesGame()">Start SHAPES</button>
      <button id="shapes-replay-btn" class="shape-replay-btn" onclick="startShapesGame()">Play Again</button>
      <div style="margin-bottom: 12px; font-size:0.95rem; color:#333;">
        <label><input type="checkbox" id="auto-respawn-toggle" ${autoRespawnEnabled ? 'checked' : ''} onchange="toggleAutoRespawn(this.checked)"> Auto respawn when all shapes are tapped</label>
      </div>
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
  clearAutoRespawnTimeout();
  shapesScore = 0;
  shapesRound = 0;
  isShapeSpeakPending = false;
  updateShapesHud();
  setShapesStatus('Tap a shape to hear it spoken.');
  toggleShapesReplay(false);
  renderShapeOptions(shapeBank);
  document.removeEventListener('keydown', handleShapesKeyDown);
  document.addEventListener('keydown', handleShapesKeyDown);

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
  // center to avoid (don't place shapes too close to the visual center)
  const centerAvoid = {
    x: Math.round(playfield.clientWidth / 2),
    y: Math.round(playfield.clientHeight / 2),
    radius: Math.round(buttonSize * 0.95) // roughly one button diameter
  };

  options.forEach((shape) => {
    const button = document.createElement('button');
    button.className = 'shape-btn';
    button.setAttribute('aria-label', shape.name);
    button.dataset.shapeName = shape.name;
    button.onclick = (event) => handleShapeChoice(shape, event.currentTarget);

    const symbol = document.createElement('span');
    symbol.className = 'shape-symbol';
    symbol.textContent = shape.symbol;
    symbol.style.color = shape.color;
    symbol.style.transform = `scale(${shape.scale || 1})`;
    button.appendChild(symbol);

    const position = getRandomNonOverlappingPosition(maxLeft, maxTop, buttonSize, placedPositions, centerAvoid);
    button.style.left = `${position.left}px`;
    button.style.top = `${position.top}px`;

    placedPositions.push(position);
    playfield.appendChild(button);
  });
}

function getRandomNonOverlappingPosition(maxLeft, maxTop, buttonSize, placedPositions, centerAvoid) {
  const attempts = 30;
  const minGap = buttonSize * 0.7;

  for (let i = 0; i < attempts; i += 1) {
    const candidate = {
      left: Math.floor(Math.random() * (maxLeft + 1)),
      top: Math.floor(Math.random() * (maxTop + 1))
    };

    // avoid center region if requested
    let overlaps = false;
    if (centerAvoid && typeof centerAvoid.x === 'number') {
      const candidateCenterX = candidate.left + buttonSize / 2;
      const candidateCenterY = candidate.top + buttonSize / 2;
      const dxC = candidateCenterX - centerAvoid.x;
      const dyC = candidateCenterY - centerAvoid.y;
      if (Math.hypot(dxC, dyC) < (centerAvoid.radius || 0)) {
        overlaps = true;
      }
    }

    // check against already placed positions
    if (!overlaps) {
      overlaps = placedPositions.some((pos) => {
        const dx = pos.left - candidate.left;
        const dy = pos.top - candidate.top;
        return Math.hypot(dx, dy) < minGap;
      });
    }

    if (!overlaps) {
      return candidate;
    }
  }

  return {
    left: Math.floor(Math.random() * (maxLeft + 1)),
    top: Math.floor(Math.random() * (maxTop + 1))
  };
}

function handleShapesKeyDown(event) {
  if (event.code === 'Space' || event.key === ' ') {
    event.preventDefault();
    triggerSpacePop();
  }
}

function triggerSpacePop() {
  const playfield = document.getElementById('shapes-grid');
  if (!playfield) return;
  const buttons = Array.from(playfield.querySelectorAll('.shape-btn'));
  if (!buttons.length) return;

  // choose a random visible button
  const btn = buttons[Math.floor(Math.random() * buttons.length)];
  if (!btn || btn.disabled) return;

  const shapeName = btn.dataset.shapeName || btn.getAttribute('aria-label') || 'shape';
  isShapeSpeakPending = true;
  shapesScore += 1;
  shapesRound += 1;
  updateShapesHud();
  btn.disabled = true;
  btn.classList.add('is-selected');
  moveShapeToCenter(btn);
  setShapesStatus('Listen...');

  speakThisIsAThenShape(shapeName, () => {
    animateAndRemoveShapeButton(btn, playfield);
  });
}

function handleShapeChoice(shape, shapeButton) {
  if (isShapeSpeakPending) return;

  isShapeSpeakPending = true;
  shapesScore += 1;
  shapesRound += 1;
  updateShapesHud();

  if (shapeButton && shapeButton.classList) {
    shapeButton.disabled = true;
    moveShapeToCenter(shapeButton);
  }

  setShapesStatus('Listen...');
  speakThisIsAThenShape(shape.name, () => {
    const playfield = document.getElementById('shapes-grid');
    animateAndRemoveShapeButton(shapeButton, playfield);
  });
}

function isShapesGameOver() {
  const playfield = document.getElementById('shapes-grid');
  if (!playfield) return false;
  return playfield.querySelectorAll('.shape-btn').length === 0;
}

function finishShapesGame() {
  clearAutoRespawnTimeout();
  const targetEl = document.getElementById('shapes-target');
  if (targetEl) {
    targetEl.textContent = 'All done. Great job!';
  }
  if (autoRespawnEnabled) {
    setShapesStatus('Auto respawn enabled — new shapes will appear soon.');
    autoRespawnTimeoutId = setTimeout(startShapesGame, 1400);
  } else {
    setShapesStatus('Press Play Again for new shapes.');
  }
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

function animateAndRemoveShapeButton(shapeButton, playfield) {
  if (!shapeButton || !shapeButton.classList) {
    isShapeSpeakPending = false;
    return;
  }

  const rect = shapeButton.getBoundingClientRect();
  const playfieldRect = playfield ? playfield.getBoundingClientRect() : { left: 0, top: 0 };
  const centerX = rect.left - playfieldRect.left + rect.width / 2;
  const centerY = rect.top - playfieldRect.top + rect.height / 2;

  shapeButton.classList.add('is-selected');
  shapeButton.classList.add('spin-pop');
  try { spawnConfetti(playfield, centerX, centerY, 20); } catch (e) {}

  shapeButton.addEventListener('animationend', () => {
    try { shapeButton.remove(); } catch (e) {}
    if (isShapesGameOver()) {
      finishShapesGame();
    } else {
      setShapesStatus('Tap another shape.');
    }
    isShapeSpeakPending = false;
  }, { once: true });
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

function spawnConfetti(playfield, centerX, centerY, count = 20) {
  if (!playfield) return;
  const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#0AC9A7', '#0A84FF', '#5856D6', '#FF2D55'];

  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    piece.style.background = color;
    // random size
    const w = 6 + Math.floor(Math.random() * 12);
    const h = 8 + Math.floor(Math.random() * 16);
    piece.style.width = `${w}px`;
    piece.style.height = `${h}px`;

    // starting position (centered)
    const startLeft = Math.max(0, Math.round(centerX - w / 2));
    const startTop = Math.max(0, Math.round(centerY - h / 2));
    piece.style.left = `${startLeft}px`;
    piece.style.top = `${startTop}px`;
    playfield.appendChild(piece);

    // animate using Web Animations API for per-piece dynamics
    const dx = Math.floor((Math.random() - 0.5) * 240); // horizontal burst
    const dy = 100 + Math.floor(Math.random() * 160); // vertical rise
    const rot = 360 + Math.floor(Math.random() * 720);
    const dur = 800 + Math.floor(Math.random() * 800);

    const keyframes = [
      { transform: `translate(0px,0px) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${dx}px, ${-dy}px) rotate(${rot}deg)`, opacity: 0 }
    ];
    const anim = piece.animate(keyframes, { duration: dur, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    anim.onfinish = () => { try { piece.remove(); } catch(e) {} };
  }
}

// ── Trace Letters Game ──────────────────────────────────────────────────────
function loadTraceGame() {
  const screen = document.getElementById('game-screen');
  screen.innerHTML = `
    <style>
      .trace-wrap { max-width: 900px; margin: 0 auto; }
      .trace-row { display:flex; gap:14px; flex-wrap:wrap; justify-content:center; }
      .trace-col { width: 44%; min-width:260px; text-align:center; }
      .trace-canvas { width:100%; height:380px; border-radius:12px; background:linear-gradient(180deg,#fff,#f6f9ff); box-shadow:0 8px 18px rgba(0,0,0,0.12); touch-action:none; }
      .trace-controls { margin-top:8px; display:flex; gap:8px; justify-content:center; }
      .trace-status { min-height:20px; font-weight:bold; margin-top:8px; color:#333; }
      @media (max-width:720px) { .trace-col { width:100%; } .trace-canvas { height:300px; } }
    </style>
    <div class="trace-wrap">
      <h2>Trace Letters</h2>
      <p>Trace the large letters using your finger or mouse. Dashed lines show the letter shape.</p>
      <div id="trace-letters-container"></div>
    </div>
  `;

  _traceCurrentLetter = 0;
  _traceCompletedLetters = new Set();
  loadNextTraceLetter();
}

const _traceState = {};
let _traceCurrentLetter = 0;
let _traceCompletedLetters = new Set();

function loadNextTraceLetter() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  if (_traceCurrentLetter >= alphabet.length) {
    const container = document.getElementById('trace-letters-container');
    if (container) {
      container.innerHTML = '<div style="padding:20px;text-align:center;font-size:18px;color:#444;"><strong>🎉 Fantastic! You traced all 26 letters!</strong></div>';
  speakText('Fantastic work! You traced all 26 letters of the alphabet!', 0.9, 1.0);
    }
    return;
  }

  const letter = alphabet[_traceCurrentLetter];
  const upperLetter = letter.toUpperCase();
  const lowerLetter = letter.toLowerCase();

  const container = document.getElementById('trace-letters-container');
  if (!container) return;

  container.innerHTML = `
    <div class="trace-row">
      <div class="trace-col">
        <div style="font-size:14px;color:#444;margin-bottom:6px;">Uppercase ${upperLetter}</div>
        <canvas id="trace-canvas-${upperLetter}" class="trace-canvas"></canvas>
        <div class="trace-controls"><button id="clear-btn-${upperLetter}" onclick="clearTrace('${upperLetter}')">Clear</button><button id="submit-btn-${upperLetter}" onclick="submitTrace('${upperLetter}')">Submit</button></div>
        <div id="trace-status-${upperLetter}" class="trace-status"></div>
      </div>
      <div class="trace-col">
        <div style="font-size:14px;color:#444;margin-bottom:6px;">Lowercase ${lowerLetter}</div>
        <canvas id="trace-canvas-${lowerLetter}" class="trace-canvas"></canvas>
        <div class="trace-controls"><button id="clear-btn-${lowerLetter}" onclick="clearTrace('${lowerLetter}')">Clear</button><button id="submit-btn-${lowerLetter}" onclick="submitTrace('${lowerLetter}')">Submit</button></div>
        <div id="trace-status-${lowerLetter}" class="trace-status"></div>
      </div>
    </div>
  `;

  // Initialize both canvases for this letter
  initTraceCanvas(`trace-canvas-${upperLetter}`, upperLetter);
  initTraceCanvas(`trace-canvas-${lowerLetter}`, lowerLetter);
  
  speakText('Trace the letter ' + lowerLetter + '.', 0.9, 1.0);
}

function initTraceCanvas(canvasId, letter) {
  const el = document.getElementById(canvasId);
  if (!el) return;

  // setup high-DPI canvas
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = el.getBoundingClientRect();
  el.width = Math.round(rect.width * dpr);
  el.height = Math.round(rect.height * dpr);
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;

  const ctx = el.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // offscreen mask canvas with letter stroke
  const mask = document.createElement('canvas');
  mask.width = el.width;
  mask.height = el.height;
  const mctx = mask.getContext('2d');
  mctx.scale(dpr, dpr);
  mctx.clearRect(0,0,el.width/dpr,el.height/dpr);

  // draw the target letter path as a hidden mask with adequate line width for full coverage
  const fontSize = Math.min(rect.width, rect.height) * 0.6;
  mctx.font = `700 ${fontSize}px Nunito, Arial, sans-serif`;
  mctx.textBaseline = 'middle';
  mctx.textAlign = 'center';
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  mctx.lineWidth = Math.max(10, fontSize * 0.09);
  mctx.strokeStyle = 'black';
  const isLowercase = letter === letter.toLowerCase() && letter !== letter.toUpperCase();
  mctx.strokeText(letter, cx, cy + (isLowercase ? fontSize * 0.06 : 0));

  // draw a single dashed line guide on the visible canvas
  ctx.clearRect(0,0,rect.width,rect.height);
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = Math.max(6, fontSize * 0.06);
  ctx.font = `700 ${fontSize}px Nunito, Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#999';
  ctx.setLineDash([10, 10]);
  ctx.strokeText(letter, cx, cy + (isLowercase ? fontSize * 0.06 : 0));
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // create a fill layer that will track tracing progress
  const fillCanvas = document.createElement('canvas');
  fillCanvas.width = mask.width;
  fillCanvas.height = mask.height;
  const fillCtx = fillCanvas.getContext('2d');
  fillCtx.clearRect(0, 0, fillCanvas.width, fillCanvas.height);

  // drawing layer sits on top; only mark path points on pointer over the fixed path
  el.addEventListener('pointerdown', (ev) => startTracePointer(ev, el));
  window.addEventListener('pointermove', (ev) => continueTracePointer(ev, el));
  window.addEventListener('pointerup', (ev) => endTracePointer(ev, el));

  const pathPixelCount = countMaskPixels(mctx, mask.width, mask.height);
  const st = {
    canvas: el,
    ctx,
    mask,
    maskCtx: mctx,
    fillCanvas,
    fillCtx,
    dpr,
    drawing: false,
    lastValid: null,
    disabled: false,
    pathPixelCount,
    filledPixelCount: 0
  };
  _traceState[canvasId] = st;
}

function getTraceStateForLetter(letterKey) {
  const id = `trace-canvas-${letterKey}`;
  return _traceState[id];
}

function startTracePointer(ev, canvas) {
  if (!canvas) return;
  const st = _traceState[canvas.id];
  if (!st) return;
  if (st.disabled) return;
  const r = canvas.getBoundingClientRect();
  const x = (ev.clientX - r.left);
  const y = (ev.clientY - r.top);
  if (!isPointInMask(st, x, y)) {
    return;
  }
  st.drawing = true;
  fillPathPoint(st, x, y);
  st.lastValid = { x, y };
  ev.preventDefault();
}

function continueTracePointer(ev, canvas) {
  if (!canvas) return;
  const st = _traceState[canvas.id];
  if (!st || !st.drawing || st.disabled) return;
  const r = canvas.getBoundingClientRect();
  const x = (ev.clientX - r.left);
  const y = (ev.clientY - r.top);
  if (isPointInMask(st, x, y)) {
    fillPathPoint(st, x, y);
    st.lastValid = { x, y };
    try {
      // Extract letter from canvas ID (e.g., 'trace-canvas-A' -> 'A')
      const letterKey = canvas.id.replace('trace-canvas-', '');
      if (computeTraceRatio(st) >= 0.60) {
        submitTrace(letterKey);
      }
    } catch(e) {}
  }
  ev.preventDefault();
}

function endTracePointer(ev, canvas) {
  if (!canvas) return;
  const st = _traceState[canvas.id];
  if (!st) return;
  if (st.drawing) {
    try { st.ctx.closePath(); } catch(e) {}
  }
  st.drawing = false;
  st.lastValid = null;
}

function clearTrace(letterKey) {
  const id = `trace-canvas-${letterKey}`;
  const st = _traceState[id];
  if (!st) return;
  const canvas = st.canvas;
  const rect = canvas.getBoundingClientRect();
  st.fillCtx.clearRect(0,0,st.fillCanvas.width,st.fillCanvas.height);
  st.filledPixelCount = 0;
  st.ctx.clearRect(0,0,rect.width,rect.height);
  st.lastValid = null;
  st.ctx.globalAlpha = 0.28;
  const fontSize = Math.min(rect.width, rect.height) * 0.6;
  st.ctx.lineWidth = Math.max(6, fontSize * 0.06);
  st.ctx.font = `700 ${fontSize}px Nunito, Arial, sans-serif`;
  st.ctx.textBaseline = 'middle';
  st.ctx.textAlign = 'center';
  st.ctx.strokeStyle = '#999';
  st.ctx.setLineDash([10, 10]);
  const isLowercase = letterKey === letterKey.toLowerCase() && letterKey !== letterKey.toUpperCase();
  st.ctx.strokeText(letterKey, rect.width/2, rect.height/2 + (isLowercase ? fontSize*0.06 : 0));
  st.ctx.setLineDash([]);
  st.ctx.globalAlpha = 1;
  const status = document.getElementById(`trace-status-${letterKey}`);
  if (status) status.textContent = '';
  const submitBtn = document.getElementById(`submit-btn-${letterKey}`);
  if (submitBtn) submitBtn.style.display = 'inline-block';
  st.disabled = false;
}

function submitTrace(letterKey) {
  const canvasId = `trace-canvas-${letterKey}`;
  const st = _traceState[canvasId];
  if (!st || st.disabled) return;
  const ratio = computeTraceRatio(st);
  const status = document.getElementById(`trace-status-${letterKey}`);
  const isUppercase = letterKey === letterKey.toUpperCase();
  const spoken = isUppercase ? `Uppercase ${letterKey}` : `Lowercase ${letterKey}`;
  
  if (ratio >= 0.60) {
    if (status) status.textContent = 'Perfect tracing!';
    speakText(spoken + ' — excellent!', accessibilitySettings.speechRate, accessibilitySettings.volume);
    const submitBtn = document.getElementById(`submit-btn-${letterKey}`);
    if (submitBtn) submitBtn.style.display = 'none';
    st.disabled = true;
    _traceCompletedLetters.add(letterKey);
    try {
      const canvasRect = st.canvas.getBoundingClientRect();
      spawnConfetti(document.getElementById('game-screen'), canvasRect.left + canvasRect.width / 2, canvasRect.top + canvasRect.height / 2, 28);
    } catch(e) {}
    
    if (isUppercase) {
      // After uppercase is done, highlight lowercase
      const lowerKey = letterKey.toLowerCase();
      const nextId = `trace-canvas-${lowerKey}`;
      const nextSt = _traceState[nextId];
      if (nextSt && !nextSt.disabled) {
        const nextStatus = document.getElementById(`trace-status-${lowerKey}`);
        if (nextStatus) nextStatus.textContent = `Now try lowercase ${lowerKey}`;
        try {
          nextSt.canvas.style.outline = '4px solid #FFD700';
          setTimeout(() => { nextSt.canvas.style.outline = ''; }, 900);
          nextSt.canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch(e) {}
      }
    } else {
      // After lowercase is done, move to next letter
      _traceCurrentLetter += 1;
      setTimeout(() => {
        loadNextTraceLetter();
      }, 800);
    }
  } else if (ratio >= 0.55) {
    if (status) status.textContent = 'Almost there — just a little more!';
    speakText(spoken + ' — almost there, just a little more.', accessibilitySettings.speechRate, accessibilitySettings.volume);
  } else if (ratio >= 0.15) {
    if (status) status.textContent = 'Good start — try to follow the shape more closely.';
    speakText(spoken + ' — good try, keep going along the shape.', accessibilitySettings.speechRate, accessibilitySettings.volume);
  } else {
    if (status) status.textContent = 'Try again — follow the letter stroke.';
    speakText(spoken + ' — try again.', accessibilitySettings.speechRate, accessibilitySettings.volume);
  }
}

function computeTraceRatio(st) {
  if (!st || !st.mask || !st.fillCanvas) return 0;
  const mask = st.mask;
  const md = st.maskCtx.getImageData(0,0,mask.width,mask.height).data;
  const dd = st.fillCtx.getImageData(0,0,st.fillCanvas.width,st.fillCanvas.height).data;

  let maskCount = 0;
  let hitCount = 0;
  for (let i = 0; i < md.length; i += 4) {
    if (md[i+3] > 40) {
      maskCount += 1;
      if (dd[i+3] > 30) hitCount += 1;
    }
  }
  return maskCount > 0 ? (hitCount / maskCount) : 0;
}

function isPointInMask(st, x, y) {
  if (!st || !st.mask) return false;
  const dpr = st.dpr || Math.max(1, window.devicePixelRatio || 1);
  const mx = Math.floor(x * dpr);
  const my = Math.floor(y * dpr);
  if (mx < 0 || my < 0 || mx >= st.mask.width || my >= st.mask.height) return false;
  try {
    const data = st.maskCtx.getImageData(mx, my, 1, 1).data;
    return data[3] > 40;
  } catch(e) {
    return false;
  }
}

function fillPathPoint(st, x, y) {
  if (!st || !st.fillCtx) return;
  const dpr = st.dpr || Math.max(1, window.devicePixelRatio || 1);
  const mx = Math.floor(x * dpr);
  const my = Math.floor(y * dpr);
  const fontSize = Math.min(st.canvas.getBoundingClientRect().width, st.canvas.getBoundingClientRect().height) * 0.6;
  const pathLineWidth = Math.max(10, fontSize * 0.09);

  st.ctx.strokeStyle = '#e23';
  st.ctx.lineWidth = pathLineWidth;
  st.ctx.lineCap = 'round';
  st.ctx.lineJoin = 'round';
  st.ctx.beginPath();
  if (st.lastValid) {
    st.ctx.moveTo(st.lastValid.x, st.lastValid.y);
    st.ctx.lineTo(x, y);
  } else {
    st.ctx.moveTo(x, y);
    st.ctx.lineTo(x, y);
  }
  st.ctx.stroke();
  st.ctx.closePath();

  st.fillCtx.strokeStyle = 'rgba(255, 30, 30, 1)';
  st.fillCtx.lineWidth = pathLineWidth * dpr;
  st.fillCtx.lineCap = 'round';
  st.fillCtx.lineJoin = 'round';
  st.fillCtx.beginPath();
  if (st.lastValid) {
    st.fillCtx.moveTo(st.lastValid.x * dpr, st.lastValid.y * dpr);
    st.fillCtx.lineTo(mx, my);
  } else {
    st.fillCtx.moveTo(mx, my);
    st.fillCtx.lineTo(mx, my);
  }
  st.fillCtx.stroke();
  st.fillCtx.closePath();

  // mask fill to only show pixels on the path
  const fillData = st.fillCtx.getImageData(0, 0, st.fillCanvas.width, st.fillCanvas.height);
  const maskData = st.maskCtx.getImageData(0, 0, st.mask.width, st.mask.height);
  for (let i = 0; i < fillData.data.length; i += 4) {
    if (maskData.data[i + 3] <= 40) {
      fillData.data[i + 3] = 0;
    }
  }
  st.fillCtx.putImageData(fillData, 0, 0);
}

function countMaskPixels(mctx, width, height) {
  let count = 0;
  try {
    const data = mctx.getImageData(0, 0, width, height).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 40) count += 1;
    }
  } catch(e) {
    return 0;
  }
  return count;
}

function rectWidthMid(canvas) {
  try { const r = canvas.getBoundingClientRect(); return Math.round(r.left + r.width / 2); } catch(e) { return 0; }
}

function rectHeightMid(canvas) {
  try { const r = canvas.getBoundingClientRect(); return Math.round(r.top + r.height / 2); } catch(e) { return 0; }
}

// ──────────────────────────────────────────────────────────────────────────

// Accessibility settings (placeholder)
const accessibilitySettings = {
  volume: 0.5,
  visualIntensity: 1.0,
  speechRate: 0.8,
  voiceName: ''
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
  setSettingsTab('general');
  populateVoiceList();
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

function setSettingsTab(tab) {
  const general = document.getElementById('settings-general');
  const voices = document.getElementById('settings-voices');
  const generalBtn = document.getElementById('settings-tab-general');
  const voicesBtn = document.getElementById('settings-tab-voices');
  if (!general || !voices || !generalBtn || !voicesBtn) return;

  if (tab === 'voices') {
    general.style.display = 'none';
    voices.style.display = 'block';
    generalBtn.style.background = '#fff';
    generalBtn.style.color = '#333';
    voicesBtn.style.background = '#333';
    voicesBtn.style.color = '#fff';
  } else {
    general.style.display = 'block';
    voices.style.display = 'none';
    generalBtn.style.background = '#333';
    generalBtn.style.color = '#fff';
    voicesBtn.style.background = '#fff';
    voicesBtn.style.color = '#333';
  }
}
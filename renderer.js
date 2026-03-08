// renderer.js - Main renderer process script

const gameContainer = document.getElementById('game-container');

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
let letterObjects = { ...defaultLetterObjects };
let useObjectWords = true;
let randomizeObjects = false;

// Keyboard handler
function handleKeyPress(event) {
  if (isPaused) return;
  const key = isUppercase ? event.key.toUpperCase() : event.key.toLowerCase();
  const balloonIndex = currentBalloons.findIndex(b => b.textContent === key);
  if (balloonIndex !== -1) {
    const balloon = currentBalloons[balloonIndex];
    popBalloon(balloon, key);
    event.preventDefault(); // Prevent default key behavior
  }
}

// Load the home screen tiles
function loadHome() {
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
    </div>
  `;
}

// Game loading function
function loadGame(gameName) {
  gameContainer.innerHTML = `
    <button class="back-btn" onclick="loadHome()">← Back</button>
    <div id="game-screen"></div>
  `;

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
    default:
      document.getElementById('game-screen').innerHTML = '<p>Game not found.</p>';
  }
}

// Initialize to home screen
window.addEventListener('DOMContentLoaded', loadHome);

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
        transition: all 0.3s ease;
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
      /* Responsive */
      @media (max-width: 768px) {
        #balloon-area {
          height: 300px !important;
        }
        .balloon {
          width: 58px !important;
          height: 58px !important;
          font-size: 24px !important;
        }
        .start-btn {
          font-size: 20px;
          padding: 14px 28px;
        }
      }
      @media (max-width: 480px) {
        #balloon-area {
          height: 250px !important;
        }
        .balloon {
          width: 50px !important;
          height: 50px !important;
          font-size: 20px !important;
        }
        .start-btn {
          font-size: 18px;
          padding: 12px 24px;
        }
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
    <button class="start-btn" onclick="startBalloonGame()">Start Game</button>
    <div id="pause-overlay" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.9); justify-content:center; align-items:center; font-size:1.6rem; color:#222; border-radius:10px;">Waiting...</div>
    <div id="balloon-area" style="position: relative; height: 400px; background: linear-gradient(to bottom, #00BFFF 0%, #FFD700 50%, #32CD32 100%); border-radius: 10px; overflow: hidden;">
      <!-- Balloons will be added here -->
    </div>
    <div id="score">Score: 0</div>
  `;
}

function startBalloonGame() {
  // Remove previous listener
  document.removeEventListener('keydown', handleKeyPress);
  
  const balloonArea = document.getElementById('balloon-area');
  balloonArea.innerHTML = ''; // Clear any existing balloons
  currentScore = 0;
  scoreDisplay = document.getElementById('score');
  scoreDisplay.textContent = 'Score: 0';

  // Letters to use (A-Z or a-z)
  const letters = (isUppercase ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : 'abcdefghijklmnopqrstuvwxyz').split('');
  currentBalloons = [];

  // Create balloons
  for (let i = 0; i < 10; i++) {
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const balloon = createBalloon(letter, balloonArea);
    balloonArea.appendChild(balloon);
    currentBalloons.push(balloon);
  }

  // Add keyboard listener
  document.addEventListener('keydown', handleKeyPress);
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
  const objectWord = getObjectWord(letter);

  // Speak letter first
  const letterUtterance = new SpeechSynthesisUtterance(letter);
  letterUtterance.volume = accessibilitySettings.volume;
  letterUtterance.rate = accessibilitySettings.speechRate;

  if (useObjectWords) {
    // After the letter is spoken, say the phrase and pause.
    letterUtterance.onend = () => {
      const phrase = `${letter} for ${objectWord}`;
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.volume = accessibilitySettings.volume;
      utterance.rate = accessibilitySettings.speechRate;
      utterance.onstart = () => pauseGameFor(3, phrase);
      window.speechSynthesis.speak(utterance);
    };
  }

  window.speechSynthesis.speak(letterUtterance);
}

function getObjectWord(letter) {
  const upper = letter.toUpperCase();
  if (randomizeObjects) {
    const vals = Object.values(letterObjects);
    return vals[Math.floor(Math.random() * vals.length)];
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


  // Function to create a balloon
  function createBalloon(letter, balloonArea) {
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    balloon.textContent = letter;
    balloon.style.position = 'absolute';
    balloon.style.width = '72px';
    balloon.style.height = '72px';
    balloon.style.background = `radial-gradient(circle at 30% 30%, ${getRandomColor()}, ${getRandomColor()})`;
    balloon.style.borderRadius = '50%';
    balloon.style.border = '3px solid rgba(255,255,255,0.75)';
    balloon.style.display = 'flex';
    balloon.style.alignItems = 'center';
    balloon.style.justifyContent = 'center';
    balloon.style.fontSize = '30px';
    balloon.style.fontWeight = 'bold';
    balloon.style.color = '#111';
    balloon.style.textShadow = '0 1px 0 rgba(255,255,255,0.6)';
    balloon.style.cursor = 'pointer';
    balloon.style.left = Math.random() * (balloonArea.offsetWidth - 72) + 'px';
    balloon.style.top = Math.random() * (balloonArea.offsetHeight - 72) + 'px';
    balloon.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';

    balloon.addEventListener('click', () => {
      popBalloon(balloon, letter);
    });

    return balloon;
  }

  // Function to pop balloon
  function popBalloon(balloon, letter) {
    if (isPaused) return;

    // Play sound
    speakLetter(letter);

    // Update score
    currentScore++;
    if (scoreDisplay) scoreDisplay.textContent = 'Score: ' + currentScore;

    // Random blast effect
    const blastTypes = ['scale-blast', 'rotate-blast', 'burst-blast'];
    const blastType = blastTypes[Math.floor(Math.random() * blastTypes.length)];
    balloon.classList.add(blastType);

    // Remove after animation
    setTimeout(() => {
      balloon.remove();
      currentBalloons = currentBalloons.filter(b => b !== balloon);
      if (currentBalloons.length === 0) {
        // Game over, show message
        document.removeEventListener('keydown', handleKeyPress);
        document.getElementById('balloon-area').innerHTML = '<h3>Great job! All balloons popped!</h3><button onclick="startBalloonGame()">Play Again</button>';
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
  const utterance = new SpeechSynthesisUtterance(name);
  utterance.volume = accessibilitySettings.volume;
  utterance.rate = accessibilitySettings.speechRate;
  window.speechSynthesis.speak(utterance);
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
  intro.volume = accessibilitySettings.volume;
  intro.rate = slowerRate;

  const shapeName = new SpeechSynthesisUtterance(name);
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
  // Load current values
  document.getElementById('volume-slider').value = accessibilitySettings.volume;
  document.getElementById('speech-slider').value = accessibilitySettings.speechRate;
  document.getElementById('visual-slider').value = accessibilitySettings.visualIntensity;
}

function hideSettings() {
  document.getElementById('settings-panel').style.display = 'none';
}

function saveSettings() {
  accessibilitySettings.volume = parseFloat(document.getElementById('volume-slider').value);
  accessibilitySettings.speechRate = parseFloat(document.getElementById('speech-slider').value);
  accessibilitySettings.visualIntensity = parseFloat(document.getElementById('visual-slider').value);
  hideSettings();
  alert('Settings saved!');
}
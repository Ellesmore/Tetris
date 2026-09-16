/* ============================================
   App — Main entry point & screen routing
   ============================================ */

import { initPlayerSelect } from './player-select.js';
import { initDifficultySelect } from './difficulty.js';
import { TetrisGame } from './tetris.js';
import { initControls } from './controls.js';

// ---- Screen management ----
const screens = {
  player: document.getElementById('screen-player'),
  difficulty: document.getElementById('screen-difficulty'),
  game: document.getElementById('screen-game'),
  gameover: document.getElementById('screen-gameover'),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove('active'));
  screens[name].classList.add('active');
  // Re-trigger entrance animation
  const content = screens[name].querySelector('.screen-content, .game-layout');
  if (content) {
    content.style.animation = 'none';
    // Force reflow
    void content.offsetHeight;
    content.style.animation = '';
  }
}

// ---- Particles background ----
function initParticles() {
  const canvas = document.getElementById('particles-bg');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const COUNT = 60;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.3 + 0.05,
      color: ['#00f0ff', '#b84dff', '#ff2d78', '#39ff14'][Math.floor(Math.random() * 4)],
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;

      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ---- App State ----
let selectedPlayer = null;
let selectedDifficulty = null;
let game = null;
let cleanupControls = null;

// ---- Pause overlay ----
const pauseOverlay = document.getElementById('pause-overlay');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');
const btnPause = document.getElementById('btn-pause');
const btnMenuGame = document.getElementById('btn-menu-game');

function showPause() {
  pauseOverlay.classList.remove('hidden');
  document.getElementById('pause-icon').style.display = 'none';
  document.getElementById('play-icon').style.display = '';
}

function hidePause() {
  pauseOverlay.classList.add('hidden');
  document.getElementById('pause-icon').style.display = '';
  document.getElementById('play-icon').style.display = 'none';
}

function togglePause() {
  if (!game || game.gameOver) return;
  const isPaused = game.togglePause();
  if (isPaused) showPause();
  else hidePause();
}

btnPause.addEventListener('click', togglePause);

btnResume.addEventListener('click', () => {
  if (game && game.paused) {
    game.togglePause();
    hidePause();
  }
});

btnQuit.addEventListener('click', () => {
  if (game) {
    game.stop();
    game = null;
  }
  if (cleanupControls) {
    cleanupControls();
    cleanupControls = null;
  }
  hidePause();
  showScreen('player');
});

btnMenuGame.addEventListener('click', () => {
  if (game && !game.paused && !game.gameOver) {
    togglePause();
  }
});

// ---- Back button (difficulty → player) ----
document.getElementById('btn-back-player').addEventListener('click', () => {
  showScreen('player');
});

// ---- Game Over buttons ----
document.getElementById('btn-retry').addEventListener('click', () => {
  startGame();
});

document.getElementById('btn-main-menu').addEventListener('click', () => {
  showScreen('player');
});

// ---- Start game ----
function startGame() {
  const gameCanvas = document.getElementById('game-canvas');
  const nextCanvas = document.getElementById('next-canvas');

  showScreen('game');

  // Small delay so DOM layout settles
  requestAnimationFrame(() => {
    if (game) {
      game.stop();
    }
    if (cleanupControls) {
      cleanupControls();
    }

    game = new TetrisGame({
      canvas: gameCanvas,
      nextCanvas: nextCanvas,
      dropInterval: selectedDifficulty.dropInterval,
      onScoreUpdate: ({ score, lines, level }) => {
        document.getElementById('score-display').textContent = score;
        document.getElementById('lines-display').textContent = lines;
        document.getElementById('level-display').textContent = level;
      },
      onGameOver: ({ score, lines }) => {
        document.getElementById('final-score').textContent = score;
        document.getElementById('final-lines').textContent = lines;
        // Small delay for impact
        setTimeout(() => {
          showScreen('gameover');
        }, 600);
      },
    });

    cleanupControls = initControls({
      left: () => game.moveLeft(),
      right: () => game.moveRight(),
      down: () => game.moveDown(),
      rotate: () => game.rotate(),
      hardDrop: () => game.hardDrop(),
      pause: () => togglePause(),
    });

    game.start();
    hidePause();
  });
}

// ---- Init ----
function init() {
  initParticles();

  // Player select
  initPlayerSelect((player) => {
    selectedPlayer = player;
    initDifficultySelect(player, (difficulty) => {
      selectedDifficulty = difficulty;
      startGame();
    });
    showScreen('difficulty');
  });

  showScreen('player');
}

init();

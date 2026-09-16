/* ============================================
   Tetris Game Engine
   ============================================ */

// ---------- Constants ----------
const COLS = 10;
const ROWS = 20;
const EMPTY = 0;

// Tetromino shapes (each rotation state)
const SHAPES = {
  I: { color: '#00f0ff', shadow: 'rgba(0,240,255,0.5)', states: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ]},
  O: { color: '#ffe033', shadow: 'rgba(255,224,51,0.5)', states: [
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
  ]},
  T: { color: '#b84dff', shadow: 'rgba(184,77,255,0.5)', states: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ]},
  S: { color: '#39ff14', shadow: 'rgba(57,255,20,0.5)', states: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ]},
  Z: { color: '#ff1744', shadow: 'rgba(255,23,68,0.5)', states: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ]},
  J: { color: '#2979ff', shadow: 'rgba(41,121,255,0.5)', states: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ]},
  L: { color: '#ff8c00', shadow: 'rgba(255,140,0,0.5)', states: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ]},
};

const SHAPE_KEYS = Object.keys(SHAPES);

// Scoring
const LINE_SCORES = [0, 100, 300, 500, 800];

export class TetrisGame {
  /**
   * @param {Object} options
   * @param {HTMLCanvasElement} options.canvas - main game canvas
   * @param {HTMLCanvasElement} options.nextCanvas - next piece preview canvas
   * @param {number} options.dropInterval - initial ms per drop
   * @param {Function} options.onScoreUpdate - callback({ score, lines, level })
   * @param {Function} options.onGameOver - callback({ score, lines })
   */
  constructor({ canvas, nextCanvas, dropInterval, onScoreUpdate, onGameOver }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nextCanvas = nextCanvas;
    this.nextCtx = nextCanvas.getContext('2d');

    this.baseDropInterval = dropInterval;
    this.dropInterval = dropInterval;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.board = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = 0;
    this.gameOver = false;
    this.paused = false;
    this.running = false;

    this.currentPiece = null;
    this.nextPiece = null;

    this.lastDrop = 0;
    this.animFrameId = null;

    // Line clear animation state
    this.clearingRows = [];
    this.clearAnimStart = 0;
    this.CLEAR_ANIM_DURATION = 350;

    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
  }

  _resizeCanvas() {
    // Calculate cell size based on available space
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;

    const screenEl = document.getElementById('screen-game');
    const mobileControls = document.getElementById('mobile-controls');
    const isMobile = window.innerWidth <= 768 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    let availH = window.innerHeight;
    let availW = wrapper.parentElement ? wrapper.parentElement.clientWidth : window.innerWidth;

    if (isMobile) {
      const controlsH = mobileControls ? mobileControls.offsetHeight : 130;
      const topPadding = 60; // panels
      availH = window.innerHeight - controlsH - topPadding;
      availW = window.innerWidth - 160; // side panels
    } else {
      availH = window.innerHeight - 40;
      availW = Math.min(availW - 240, 400); // side panels on desktop
    }

    const cellFromH = Math.floor(availH / ROWS);
    const cellFromW = Math.floor(availW / COLS);
    this.cellSize = Math.max(16, Math.min(cellFromH, cellFromW, 32));

    this.canvas.width = this.cellSize * COLS;
    this.canvas.height = this.cellSize * ROWS;

    // Next canvas
    this.nextCanvas.width = 120;
    this.nextCanvas.height = 120;

    // Redraw if game running
    if (this.running) {
      this._draw();
      this._drawNext();
    }
  }

  start() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = 0;
    this.gameOver = false;
    this.paused = false;
    this.running = true;
    this.dropInterval = this.baseDropInterval;
    this.clearingRows = [];

    this.currentPiece = this._spawnPiece();
    this.nextPiece = this._spawnPiece();

    this._resizeCanvas();
    this.onScoreUpdate({ score: this.score, lines: this.lines, level: this.level });

    this.lastDrop = performance.now();
    this._loop(performance.now());
  }

  stop() {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (!this.paused) {
      this.lastDrop = performance.now();
    }
    return this.paused;
  }

  // ---- Actions ----
  moveLeft() {
    if (this.paused || this.gameOver || this.clearingRows.length) return;
    if (this._canMove(this.currentPiece, -1, 0)) {
      this.currentPiece.x -= 1;
    }
  }

  moveRight() {
    if (this.paused || this.gameOver || this.clearingRows.length) return;
    if (this._canMove(this.currentPiece, 1, 0)) {
      this.currentPiece.x += 1;
    }
  }

  moveDown() {
    if (this.paused || this.gameOver || this.clearingRows.length) return;
    if (this._canMove(this.currentPiece, 0, 1)) {
      this.currentPiece.y += 1;
      this.score += 1;
      this.onScoreUpdate({ score: this.score, lines: this.lines, level: this.level });
    } else {
      this._lockPiece();
    }
  }

  rotate() {
    if (this.paused || this.gameOver || this.clearingRows.length) return;
    const piece = this.currentPiece;
    const nextRot = (piece.rotation + 1) % 4;
    const shape = SHAPES[piece.type].states[nextRot];

    // Simple wall kick: try offsets 0, -1, +1, -2, +2
    const kicks = [0, -1, 1, -2, 2];
    for (const kickX of kicks) {
      if (this._canPlace(shape, piece.x + kickX, piece.y)) {
        piece.rotation = nextRot;
        piece.shape = shape;
        piece.x += kickX;
        return;
      }
    }
  }

  hardDrop() {
    if (this.paused || this.gameOver || this.clearingRows.length) return;
    let dropDist = 0;
    while (this._canMove(this.currentPiece, 0, 1)) {
      this.currentPiece.y += 1;
      dropDist++;
    }
    this.score += dropDist * 2;
    this.onScoreUpdate({ score: this.score, lines: this.lines, level: this.level });
    this._lockPiece();
  }

  // ---- Internal ----
  _spawnPiece() {
    const type = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
    const shape = SHAPES[type].states[0];
    return {
      type,
      shape,
      rotation: 0,
      x: Math.floor((COLS - shape[0].length) / 2),
      y: 0,
    };
  }

  _canPlace(shape, x, y) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const boardX = x + c;
        const boardY = y + r;
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return false;
        if (boardY >= 0 && this.board[boardY][boardX] !== EMPTY) return false;
      }
    }
    return true;
  }

  _canMove(piece, dx, dy) {
    return this._canPlace(piece.shape, piece.x + dx, piece.y + dy);
  }

  _lockPiece() {
    const piece = this.currentPiece;
    const shapeData = SHAPES[piece.type];

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const boardY = piece.y + r;
        const boardX = piece.x + c;
        if (boardY < 0) {
          // Game over
          this.gameOver = true;
          this.running = false;
          this.onGameOver({ score: this.score, lines: this.lines });
          return;
        }
        this.board[boardY][boardX] = piece.type;
      }
    }

    // Check for completed lines
    const fullRows = [];
    for (let r = 0; r < ROWS; r++) {
      if (this.board[r].every((cell) => cell !== EMPTY)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length > 0) {
      this.clearingRows = fullRows;
      this.clearAnimStart = performance.now();

      // Score
      const cleared = fullRows.length;
      this.lines += cleared;
      this.combo++;
      const comboBonus = this.combo > 1 ? 50 * (this.combo - 1) : 0;
      this.score += LINE_SCORES[cleared] * this.level + comboBonus;

      // Level up every 10 lines
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(80, this.baseDropInterval - (this.level - 1) * 50);

      this.onScoreUpdate({ score: this.score, lines: this.lines, level: this.level });
    } else {
      this.combo = 0;
      this._advancePiece();
    }
  }

  _advancePiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this._spawnPiece();
    this._drawNext();

    // Check if new piece can be placed
    if (!this._canPlace(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y)) {
      this.gameOver = true;
      this.running = false;
      this.onGameOver({ score: this.score, lines: this.lines });
    }
  }

  _getGhostY() {
    let ghostY = this.currentPiece.y;
    while (this._canPlace(this.currentPiece.shape, this.currentPiece.x, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  // ---- Main Loop ----
  _loop(timestamp) {
    if (!this.running) return;

    if (!this.paused) {
      // Handle line clear animation
      if (this.clearingRows.length > 0) {
        const elapsed = timestamp - this.clearAnimStart;
        if (elapsed >= this.CLEAR_ANIM_DURATION) {
          // Remove cleared rows
          for (const row of this.clearingRows.sort((a, b) => b - a)) {
            this.board.splice(row, 1);
            this.board.unshift(Array(COLS).fill(EMPTY));
          }
          this.clearingRows = [];
          this._advancePiece();
        }
      } else {
        // Normal drop
        if (timestamp - this.lastDrop >= this.dropInterval) {
          this.lastDrop = timestamp;
          if (this._canMove(this.currentPiece, 0, 1)) {
            this.currentPiece.y += 1;
          } else {
            this._lockPiece();
          }
        }
      }
    }

    this._draw();
    this.animFrameId = requestAnimationFrame((t) => this._loop(t));
  }

  // ---- Drawing ----
  _draw() {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    ctx.fillStyle = 'rgba(7, 7, 15, 0.95)';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cs, 0);
      ctx.lineTo(c * cs, h);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cs);
      ctx.lineTo(w, r * cs);
      ctx.stroke();
    }

    // Board cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.board[r][c] !== EMPTY) {
          const clearing = this.clearingRows.includes(r);
          if (clearing) {
            const elapsed = performance.now() - this.clearAnimStart;
            const progress = Math.min(elapsed / this.CLEAR_ANIM_DURATION, 1);
            ctx.globalAlpha = 1 - progress;
            const scale = 1 + progress * 0.3;
            ctx.save();
            ctx.translate(c * cs + cs / 2, r * cs + cs / 2);
            ctx.scale(scale, scale);
            this._drawCell(ctx, -cs / 2, -cs / 2, cs, this.board[r][c]);
            ctx.restore();
            ctx.globalAlpha = 1;
          } else {
            this._drawCell(ctx, c * cs, r * cs, cs, this.board[r][c]);
          }
        }
      }
    }

    if (this.currentPiece && !this.gameOver) {
      // Ghost piece
      const ghostY = this._getGhostY();
      const piece = this.currentPiece;
      const ghostAlpha = 0.15;
      ctx.globalAlpha = ghostAlpha;
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (!piece.shape[r][c]) continue;
          this._drawCell(ctx, (piece.x + c) * cs, (ghostY + r) * cs, cs, piece.type);
        }
      }
      ctx.globalAlpha = 1;

      // Current piece
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (!piece.shape[r][c]) continue;
          const y = piece.y + r;
          if (y < 0) continue;
          this._drawCell(ctx, (piece.x + c) * cs, y * cs, cs, piece.type);
        }
      }
    }
  }

  _drawCell(ctx, x, y, size, type) {
    const sd = SHAPES[type];
    const pad = 1;

    // Main fill
    ctx.fillStyle = sd.color;
    ctx.shadowColor = sd.shadow;
    ctx.shadowBlur = 8;
    ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
    ctx.shadowBlur = 0;

    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x + pad, y + pad, size - pad * 2, 2);
    ctx.fillRect(x + pad, y + pad, 2, size - pad * 2);

    // Inner shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + pad, y + size - pad - 2, size - pad * 2, 2);
    ctx.fillRect(x + size - pad - 2, y + pad, 2, size - pad * 2);
  }

  _drawNext() {
    const ctx = this.nextCtx;
    const cw = this.nextCanvas.width;
    const ch = this.nextCanvas.height;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = 'rgba(7, 7, 15, 0.6)';
    ctx.fillRect(0, 0, cw, ch);

    if (!this.nextPiece) return;

    const piece = this.nextPiece;
    const shape = SHAPES[piece.type].states[0];
    const cellSize = 24;
    const totalW = shape[0].length * cellSize;
    const totalH = shape.length * cellSize;
    const offsetX = (cw - totalW) / 2;
    const offsetY = (ch - totalH) / 2;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        this._drawCell(ctx, offsetX + c * cellSize, offsetY + r * cellSize, cellSize, piece.type);
      }
    }
  }
}

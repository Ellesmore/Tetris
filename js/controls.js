/* ============================================
   Controls — Keyboard + Touch + On-screen buttons
   ============================================ */

/**
 * @param {Object} actions - { left, right, down, rotate, hardDrop, pause }
 * @returns {Function} cleanup function
 */
export function initControls(actions) {
  const cleanups = [];

  // ---- Keyboard ----
  function onKeyDown(e) {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        actions.left();
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        actions.right();
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        actions.down();
        break;
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        actions.rotate();
        break;
      case 'Space':
        e.preventDefault();
        actions.hardDrop();
        break;
      case 'KeyP':
      case 'Escape':
        e.preventDefault();
        actions.pause();
        break;
    }
  }
  document.addEventListener('keydown', onKeyDown);
  cleanups.push(() => document.removeEventListener('keydown', onKeyDown));

  // ---- On-screen buttons ----
  const buttonMap = {
    'ctrl-left': actions.left,
    'ctrl-right': actions.right,
    'ctrl-down': actions.down,
    'ctrl-rotate': actions.rotate,
    'ctrl-drop': actions.hardDrop,
  };

  // Repeat interval for directional buttons
  const REPEAT_DELAY = 150;
  const REPEAT_INTERVAL = 70;

  Object.entries(buttonMap).forEach(([id, action]) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    let repeatTimer = null;
    let delayTimer = null;
    const isDirectional = ['ctrl-left', 'ctrl-right', 'ctrl-down'].includes(id);

    function startPress(e) {
      e.preventDefault();
      action();
      if (isDirectional) {
        clearTimeout(delayTimer);
        clearInterval(repeatTimer);
        delayTimer = setTimeout(() => {
          repeatTimer = setInterval(action, REPEAT_INTERVAL);
        }, REPEAT_DELAY);
      }
    }

    function endPress(e) {
      e.preventDefault();
      clearTimeout(delayTimer);
      clearInterval(repeatTimer);
    }

    btn.addEventListener('touchstart', startPress, { passive: false });
    btn.addEventListener('touchend', endPress, { passive: false });
    btn.addEventListener('touchcancel', endPress, { passive: false });
    btn.addEventListener('mousedown', startPress);
    btn.addEventListener('mouseup', endPress);
    btn.addEventListener('mouseleave', endPress);

    cleanups.push(() => {
      btn.removeEventListener('touchstart', startPress);
      btn.removeEventListener('touchend', endPress);
      btn.removeEventListener('touchcancel', endPress);
      btn.removeEventListener('mousedown', startPress);
      btn.removeEventListener('mouseup', endPress);
      btn.removeEventListener('mouseleave', endPress);
    });
  });

  // ---- Swipe gestures on canvas ----
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const SWIPE_THRESHOLD = 30;
    const TAP_THRESHOLD = 15;
    const TAP_TIME = 250;

    function onTouchStart(e) {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    }

    function onTouchEnd(e) {
      e.preventDefault();
      if (!e.changedTouches.length) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      const elapsed = Date.now() - touchStartTime;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Tap → rotate
      if (absDx < TAP_THRESHOLD && absDy < TAP_THRESHOLD && elapsed < TAP_TIME) {
        actions.rotate();
        return;
      }

      // Swipe
      if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
        if (dx > 0) actions.right();
        else actions.left();
      } else if (absDy > SWIPE_THRESHOLD) {
        if (dy > 0) actions.down();
        else actions.hardDrop();
      }
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    cleanups.push(() => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    });
  }

  return function cleanup() {
    cleanups.forEach((fn) => fn());
  };
}

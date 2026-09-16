/* ============================================
   Player Selection Screen
   ============================================ */

const PLAYERS = [
  { id: 'golo', name: 'Голо', avatar: 'assets/hero_golo.jpg', unlocked: true },
  { id: 'mystery1', name: '???', avatar: null, unlocked: false },
  { id: 'mystery2', name: '???', avatar: null, unlocked: false },
  { id: 'mystery3', name: '???', avatar: null, unlocked: false },
  { id: 'mystery4', name: '???', avatar: null, unlocked: false },
  { id: 'mystery5', name: '???', avatar: null, unlocked: false },
];

const LOCK_SVG = `<svg class="lock-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>`;

/**
 * Renders player selection cards into the grid.
 * @param {Function} onSelect - callback(playerId) when player is chosen
 */
export function initPlayerSelect(onSelect) {
  const grid = document.getElementById('player-grid');
  grid.innerHTML = '';

  PLAYERS.forEach((player) => {
    const card = document.createElement('div');
    card.className = `player-card${player.unlocked ? '' : ' locked'}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', player.unlocked ? '0' : '-1');

    if (player.unlocked) {
      card.innerHTML = `
        <img class="player-avatar" src="${player.avatar}" alt="${player.name}" loading="eager" />
        <span class="player-name">${player.name}</span>
      `;
      card.addEventListener('click', () => onSelect(player));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(player);
        }
      });
    } else {
      // Mystery / locked card
      card.innerHTML = `
        <div class="player-avatar" style="background: rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <span class="player-name">${player.name}</span>
        ${LOCK_SVG}
      `;
    }

    grid.appendChild(card);
  });
}

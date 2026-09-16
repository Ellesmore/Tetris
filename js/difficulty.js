/* ============================================
   Difficulty Selection Screen
   ============================================ */

const DIFFICULTIES = [
  {
    id: 'easy',
    name: 'Лох',
    desc: 'Расслабленный темп, для новичков',
    emoji: '😌',
    dropInterval: 1000,   // ms per drop
    key: 'easy',
  },
  {
    id: 'normal',
    name: 'Нормис',
    desc: 'Стандартная скорость, для всех',
    emoji: '😎',
    dropInterval: 600,
    key: 'normal',
  },
  {
    id: 'hard',
    name: 'Потужний',
    desc: 'Только для настоящих героев',
    emoji: '🔥',
    dropInterval: 300,
    key: 'hard',
  },
];

/**
 * Renders difficulty selection cards.
 * @param {Object} player - selected player object
 * @param {Function} onSelect - callback(difficulty) when difficulty is chosen
 */
export function initDifficultySelect(player, onSelect) {
  const grid = document.getElementById('difficulty-grid');
  const label = document.getElementById('selected-player-label');
  
  label.textContent = `Герой: ${player.name}`;
  grid.innerHTML = '';

  DIFFICULTIES.forEach((diff) => {
    const card = document.createElement('div');
    card.className = 'diff-card';
    card.setAttribute('data-diff', diff.key);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <span class="diff-emoji">${diff.emoji}</span>
      <div class="diff-info">
        <span class="diff-name">${diff.name}</span>
        <span class="diff-desc">${diff.desc}</span>
      </div>
    `;

    card.addEventListener('click', () => onSelect(diff));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(diff);
      }
    });

    grid.appendChild(card);
  });
}

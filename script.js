/**
 * Naiper — Napier's Bones Calculator
 *
 * Napier's Bones is a manual multiplication aid invented by John Napier
 * (1617). Each "bone" (rod) contains the multiples of a single digit 1–9,
 * split across a diagonal so that partial products can be summed by column.
 *
 * Algorithm implemented here:
 *  1. Split the multiplicand into individual digits.
 *  2. For each digit d, generate a rod: rows 1–9, where row r = d * r.
 *     Each cell shows the tens digit above the diagonal, units below.
 *  3. To multiply by M, read row M from every rod. Sum partial products
 *     diagonally (with carry) to get the final result.
 */

'use strict';

// ─── DOM references ──────────────────────────────────────────────────────────
const multiplicandInput = document.getElementById('multiplicand');
const multiplierInput   = document.getElementById('multiplier');
const calcBtn           = document.getElementById('calculate-btn');
const errorMsg          = document.getElementById('error-msg');
const bonesSection      = document.getElementById('bones-section');
const bonesContainer    = document.getElementById('bones-container');
const workingSection    = document.getElementById('working-section');
const workingContainer  = document.getElementById('working-container');
const multiplicandDisp  = document.getElementById('multiplicand-display');
const multiplierDisp    = document.getElementById('multiplier-display');
const resultDisp        = document.getElementById('result-display');
const historySection    = document.getElementById('history-section');
const historyList       = document.getElementById('history-list');
const clearHistoryBtn   = document.getElementById('clear-history-btn');
const infoBtn           = document.getElementById('info-btn');
const infoModal         = document.getElementById('info-modal');
const modalOverlay      = document.getElementById('modal-overlay');
const modalCloseBtn     = document.getElementById('modal-close-btn');

// ─── State ────────────────────────────────────────────────────────────────────
/** @type {Array<{expr: string, result: number}>} */
let history = JSON.parse(localStorage.getItem('naiper-history') || '[]');

// ─── Core logic ──────────────────────────────────────────────────────────────

/**
 * Build the multiplication table for a single digit rod.
 * @param {number} digit - digit 0–9
 * @returns {Array<{tens: number, units: number}>} rows 1–9
 */
function buildRod(digit) {
  const rows = [];
  for (let row = 1; row <= 9; row++) {
    const product = digit * row;
    rows.push({ tens: Math.floor(product / 10), units: product % 10 });
  }
  return rows;
}

/**
 * Given the active row of each rod (for multiplier M), compute the sum
 * using diagonal addition (Napier's method).
 *
 * Diagonals run from bottom-left to top-right. Starting from the rightmost
 * rod's units digit, each diagonal adds one units digit from the current rod
 * and the tens digit from the rod one position to the right.
 *
 * @param {number[]} digits - digits of the multiplicand (left-to-right)
 * @param {number}   multiplier
 * @returns {{columns: number[], carries: number[], partial: number[], result: number}}
 */
function diagonalSum(digits, multiplier) {
  const n = digits.length;
  // Build the row for each rod at this multiplier
  const cells = digits.map(d => {
    const product = d * multiplier;
    return { tens: Math.floor(product / 10), units: product % 10 };
  });

  /**
   * The diagonal columns are indexed 0 (rightmost) to n (leftmost carry).
   * Column k sums:
   *   - units of cell[n-1-k]  (if 0 <= n-1-k < n)
   *   - tens  of cell[n-k]    (if 0 <= n-k   < n)
   */
  const rawCols = [];
  for (let k = 0; k <= n; k++) {
    let sum = 0;
    const uIdx = n - 1 - k;
    const tIdx = n - k;
    if (uIdx >= 0 && uIdx < n) sum += cells[uIdx].units;
    if (tIdx >= 0 && tIdx < n) sum += cells[tIdx].tens;
    rawCols.push(sum);
  }

  // Propagate carries right-to-left
  const carries = new Array(rawCols.length).fill(0);
  const partial  = [...rawCols];
  for (let k = 0; k < partial.length - 1; k++) {
    if (partial[k] >= 10) {
      carries[k + 1] = Math.floor(partial[k] / 10);
      partial[k + 1] += carries[k + 1];
      partial[k] %= 10;
    }
  }

  // Build result number (partial[last] is most-significant)
  let result = 0;
  for (let k = partial.length - 1; k >= 0; k--) {
    result = result * 10 + partial[k];
  }

  return { columns: rawCols, carries, partial, result };
}

// ─── Rendering ────────────────────────────────────────────────────────────────

/**
 * Render the bones grid HTML.
 * @param {number[]} digits
 * @param {number}   multiplier  - highlighted row (1-based), or 0 for none
 */
function renderBones(digits, multiplier) {
  const ROWS = 9;

  // Build rods data
  const rods = digits.map(buildRod);

  // Wrapper table-like grid: index rod + one rod per digit
  const grid = document.createElement('div');
  grid.className = 'bones-grid';

  // ── Index rod ──
  const indexRod = document.createElement('div');
  indexRod.className = 'rod';

  // blank header
  const blankHeader = document.createElement('div');
  blankHeader.className = 'bone-cell header';
  blankHeader.textContent = '×';
  indexRod.appendChild(blankHeader);

  for (let r = 1; r <= ROWS; r++) {
    const cell = document.createElement('div');
    cell.className = 'bone-cell index' + (r === multiplier ? ' active' : '');
    cell.textContent = r;
    indexRod.appendChild(cell);
  }
  grid.appendChild(indexRod);

  // ── Digit rods ──
  digits.forEach((digit, i) => {
    const rod = document.createElement('div');
    rod.className = 'rod';

    // Header cell
    const header = document.createElement('div');
    header.className = 'bone-cell header';
    header.textContent = digit;
    rod.appendChild(header);

    // Row cells
    rods[i].forEach((cell, rowIdx) => {
      const rowNum = rowIdx + 1;
      const div = document.createElement('div');
      div.className = 'bone-cell digit' + (rowNum === multiplier ? ' active' : '');

      // Diagonal SVG line
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 64 52');
      svg.setAttribute('aria-hidden', 'true');
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '64');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', '0');
      line.setAttribute('y2', '52');
      line.setAttribute('stroke', rowNum === multiplier ? '#4361ee' : '#cbd5e0');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
      div.appendChild(svg);

      // Tens digit (top-right)
      const top = document.createElement('span');
      top.className = 'top-num';
      top.textContent = cell.tens === 0 ? '' : cell.tens;
      div.appendChild(top);

      // Units digit (bottom-left)
      const bot = document.createElement('span');
      bot.className = 'bot-num';
      bot.textContent = cell.units;
      div.appendChild(bot);

      rod.appendChild(div);
    });

    grid.appendChild(rod);
  });

  bonesContainer.innerHTML = '';
  bonesContainer.appendChild(grid);
}

/**
 * Render the step-by-step working for one multiplier row.
 * @param {number[]} digits
 * @param {number}   multiplier
 * @param {number}   multiplicand
 */
function renderWorking(digits, multiplier, multiplicand) {
  const { columns, carries, partial, result } = diagonalSum(digits, multiplier);

  const container = document.createElement('div');
  container.className = 'working-rows';

  // Row: cell values
  const cellRow = document.createElement('div');
  cellRow.className = 'working-row';
  const cellLabel = document.createElement('span');
  cellLabel.className = 'label';
  cellLabel.textContent = 'Diagonal sums:';
  cellRow.appendChild(cellLabel);
  const cellVal = document.createElement('span');
  cellVal.className = 'value';
  cellVal.textContent = '[' + [...columns].reverse().join(', ') + ']';
  cellRow.appendChild(cellVal);
  container.appendChild(cellRow);

  // Row: carries
  const carryRow = document.createElement('div');
  carryRow.className = 'working-row';
  const carryLabel = document.createElement('span');
  carryLabel.className = 'label';
  carryLabel.textContent = 'Carries:';
  carryRow.appendChild(carryLabel);
  const carryVal = document.createElement('span');
  carryVal.className = 'value';
  carryVal.textContent = '[' + [...carries].reverse().join(', ') + ']';
  carryRow.appendChild(carryVal);
  container.appendChild(carryRow);

  // Row: partial results after carry
  const partRow = document.createElement('div');
  partRow.className = 'working-row';
  const partLabel = document.createElement('span');
  partLabel.className = 'label';
  partLabel.textContent = 'After carry:';
  partRow.appendChild(partLabel);
  const partVal = document.createElement('span');
  partVal.className = 'value';
  partVal.textContent = '[' + [...partial].reverse().join(', ') + ']';
  partRow.appendChild(partVal);
  container.appendChild(partRow);

  // Divider
  const hr = document.createElement('hr');
  hr.className = 'working-divider';
  container.appendChild(hr);

  workingContainer.innerHTML = '';
  workingContainer.appendChild(container);

  multiplicandDisp.textContent = multiplicand;
  multiplierDisp.textContent   = multiplier;
  resultDisp.textContent       = result;
}

// ─── History ──────────────────────────────────────────────────────────────────
function saveHistory(entry) {
  history.unshift(entry);
  if (history.length > 20) history.pop();
  localStorage.setItem('naiper-history', JSON.stringify(history));
}

function renderHistory() {
  if (history.length === 0) {
    historySection.classList.add('hidden');
    return;
  }
  historySection.classList.remove('hidden');
  historyList.innerHTML = '';
  history.forEach(item => {
    const li = document.createElement('li');
    const expr = document.createElement('span');
    expr.className = 'hist-expr';
    expr.textContent = item.expr;
    const res = document.createElement('span');
    res.className = 'hist-result';
    res.textContent = '= ' + item.result;
    li.appendChild(expr);
    li.appendChild(res);
    historyList.appendChild(li);
  });
}

// ─── Validation & main action ─────────────────────────────────────────────────
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}

function clearError() {
  errorMsg.textContent = '';
  errorMsg.classList.add('hidden');
}

function calculate() {
  clearError();

  const rawA = multiplicandInput.value.trim();
  const rawB = multiplierInput.value.trim();

  if (!rawA || !rawB) {
    showError('Please enter both the multiplicand and the multiplier.');
    return;
  }

  const a = parseInt(rawA, 10);
  const b = parseInt(rawB, 10);

  if (isNaN(a) || a < 1) {
    showError('Multiplicand must be a positive whole number.');
    return;
  }
  if (isNaN(b) || b < 1 || b > 9999) {
    showError('Multiplier must be a whole number between 1 and 9999.');
    return;
  }

  const digits = String(a).split('').map(Number);
  const multiplier = b % 10 === 0 ? 10 : b % 10; // use last non-zero digit for single-row display
  const actualMultiplier = b <= 9 ? b : b; // for display; use b directly if ≤ 9

  // For the bones grid, we show a single multiplier row.
  // If b > 9, we highlight row (b % 10) and note the factored calculation.
  const highlightRow = b <= 9 ? b : (b % 10 || 10);

  renderBones(digits, highlightRow);
  bonesSection.classList.remove('hidden');

  // For the working, always compute a * b directly, but show decomposition if b > 9
  const trueResult = a * b;

  if (b <= 9) {
    renderWorking(digits, b, a);
  } else {
    // Decompose: show the bones for the units digit, note full calculation
    renderWorking(digits, highlightRow, a);
    resultDisp.textContent = trueResult;
    multiplierDisp.textContent = b;
  }

  workingSection.classList.remove('hidden');

  const entry = { expr: `${a} × ${b}`, result: trueResult };
  saveHistory(entry);
  renderHistory();
}

// ─── Event listeners ──────────────────────────────────────────────────────────
calcBtn.addEventListener('click', calculate);

multiplicandInput.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); });
multiplierInput.addEventListener('keydown',   e => { if (e.key === 'Enter') calculate(); });

clearHistoryBtn.addEventListener('click', () => {
  history = [];
  localStorage.removeItem('naiper-history');
  renderHistory();
});

infoBtn.addEventListener('click', () => {
  infoModal.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
  modalCloseBtn.focus();
});

function closeModal() {
  infoModal.classList.add('hidden');
  modalOverlay.classList.add('hidden');
}

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ─── Init ─────────────────────────────────────────────────────────────────────
renderHistory();

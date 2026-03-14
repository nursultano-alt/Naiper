/**
 * AX — Expense Tracker
 * Fast, convenient daily expense logging with auto-categorization.
 */
'use strict';

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'food', icon: '🍔', name: 'Еда', color: '#f59e0b',
    keywords: ['кофе','coffee','чай','tea','еда','food','ресторан','restaurant','кафе','cafe','обед','lunch','ужин','dinner','завтрак','breakfast','продукты','groceries','burger','pizza','пицца','суши','sushi','доставка','delivery','перекус','шаурма','shawarma','столовая','canteen','вода','water','snack','снэк','мороженое','ice cream','сок','juice']
  },
  {
    key: 'transport', icon: '🚗', name: 'Транспорт', color: '#3b82f6',
    keywords: ['такси','taxi','uber','яндекс.такси','яндекс такси','автобус','bus','метро','metro','subway','поезд','train','бензин','petrol','fuel','парковка','parking','транспорт','transport','каршеринг','carsharing','маршрутка','bolt','gett','indriver','индрайвер']
  },
  {
    key: 'shopping', icon: '🛒', name: 'Покупки', color: '#8b5cf6',
    keywords: ['магазин','shop','store','одежда','clothes','обувь','shoes','покупки','shopping','рынок','market','kaspi','каспи','aliexpress','wildberries','озон','ozon','lamoda','зара','zara','h&m','hm','nike','adidas','электроника','electronics','техника','phone','телефон','ноутбук','laptop']
  },
  {
    key: 'health', icon: '��', name: 'Здоровье', color: '#22c55e',
    keywords: ['аптека','pharmacy','врач','doctor','больница','hospital','лекарства','medicine','лечение','treatment','зубной','dental','стоматолог','dentist','анализ','test','поликлиника','clinic','витамины','vitamins','спортзал','gym','фитнес','fitness']
  },
  {
    key: 'entertainment', icon: '🎮', name: 'Развлечения', color: '#ec4899',
    keywords: ['кино','cinema','movie','игра','game','концерт','concert','спорт','sport','бассейн','pool','боулинг','bowling','кальян','hookah','бар','bar','клуб','club','festival','фестиваль','театр','theater','выставка','exhibition','парк','park','зоопарк','zoo']
  },
  {
    key: 'housing', icon: '🏠', name: 'Жильё', color: '#f97316',
    keywords: ['аренда','rent','квартира','apartment','ремонт','repair','мебель','furniture','ikea','строительство','cleaning','уборка','жильё','housing','дом','house','хостел','hostel','отель','hotel','гостиница']
  },
  {
    key: 'utilities', icon: '💡', name: 'Коммунальные', color: '#14b8a6',
    keywords: ['электричество','electricity','газ','gas','вода','water','коммуналка','utilities','интернет','internet','телефон','phone','связь','телеком','telecom','свет','light','тепло','heat','квитанция','bill']
  },
  {
    key: 'subscriptions', icon: '📱', name: 'Подписки', color: '#6366f1',
    keywords: ['netflix','spotify','youtube','apple','google','подписка','subscription','icloud','telegram','premium','amediateka','кинопоиск','kinopoisk','okko','premiere','more.tv','twitch','patreon','onlyfans','discord']
  },
  {
    key: 'education', icon: '📚', name: 'Образование', color: '#a78bfa',
    keywords: ['курс','course','книга','book','учеба','study','обучение','education','университет','university','школа','school','урок','lesson','репетитор','tutor','онлайн курс','online course','udemy','coursera','stepik']
  },
  {
    key: 'other', icon: '🎁', name: 'Другое', color: '#94a3b8',
    keywords: []
  },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

// ─── State ────────────────────────────────────────────────────────────────────
let expenses  = [];  // [{id, amount, description, category, date, time}]
let settings  = { currency: '₸', budget: 0 };
let editingId = null;

const LS_EXPENSES = 'ax-expenses-v1';
const LS_SETTINGS = 'ax-settings-v1';

// ─── Persistence ──────────────────────────────────────────────────────────────
function loadData() {
  try { expenses = JSON.parse(localStorage.getItem(LS_EXPENSES) || '[]'); } catch { expenses = []; }
  try { settings = { ...settings, ...JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}') }; } catch { /* ignore */ }
}
function saveExpenses()  { localStorage.setItem(LS_EXPENSES, JSON.stringify(expenses)); }
function saveSettings()  { localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); }

// ─── Auto-categorization ──────────────────────────────────────────────────────
// Word-boundary check for Cyrillic + Latin: keyword must not be surrounded by letters.
// Short keywords (≤ SHORT_KW_LEN chars, e.g. "чай", "gas", "bar") are substring-matched
// in many unrelated words, so we require word boundaries for them. Longer keywords are
// specific enough that a substring match is sufficient.
const SHORT_KW_LEN = 5;
function kwMatches(text, kw) {
  const idx = text.indexOf(kw);
  if (idx === -1) return false;
  const before = idx > 0 ? text[idx - 1] : ' ';
  const after  = idx + kw.length < text.length ? text[idx + kw.length] : ' ';
  const isLetter = c => /[а-яёa-z]/i.test(c);
  if (kw.length <= SHORT_KW_LEN) return !isLetter(before) && !isLetter(after);
  return true;
}

function autoCategory(description) {
  if (!description) return CAT_MAP.other;
  const lower = description.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.key === 'other') continue;
    if (cat.keywords.some(kw => kwMatches(lower, kw))) return cat;
  }
  return CAT_MAP.other;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtAmount(val) {
  const n = Number(val);
  return (n % 1 === 0 ? n.toLocaleString('ru-RU') : n.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2})) + ' ' + settings.currency;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function nowTimeStr() {
  const d = new Date();
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}

function parseLocalDate(dateStr) {
  // Parse YYYY-MM-DD as local date (not UTC)
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // Shift so Monday = 0: Sunday (0) → offset 6, Mon (1) → 0, Tue (2) → 1, …
  const day = d.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return d;
}
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isInPeriod(expense, period) {
  const expDate = parseLocalDate(expense.date);
  if (period === 'today') {
    return expense.date === todayStr();
  }
  if (period === 'week') {
    return expDate >= startOfWeek();
  }
  if (period === 'month') {
    const sm = startOfMonth();
    return expDate >= sm;
  }
  return true; // 'all'
}

function pluralRU(n, one, few, many) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
  if (mod10 === 1) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

const RU_MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const RU_DAYS   = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
function fmtDateLabel(dateStr) {
  const today     = todayStr();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr      = yesterday.toISOString().slice(0, 10);
  if (dateStr === today)  return 'Сегодня';
  if (dateStr === yStr)   return 'Вчера';
  const d = parseLocalDate(dateStr);
  return `${RU_DAYS[d.getDay()]}, ${d.getDate()} ${RU_MONTHS[d.getMonth()]}`;
}

function generateId() {
  // crypto.randomUUID() is available in all modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback: timestamp + random suffix
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const addForm         = $('add-form');
const amountInput     = $('amount-input');
const descInput       = $('desc-input');
const dateInput       = $('date-input');
const timeInput       = $('time-input');
const catChip         = $('cat-chip');
const catChipIcon     = $('cat-chip-icon');
const catChipName     = $('cat-chip-name');
const currencySymbol  = $('currency-symbol');
const headerMonthTotal= $('header-month-total');
const headerDate      = $('header-date');
const budgetSection   = $('budget-section');
const budgetInfo      = $('budget-info');
const budgetFill      = $('budget-fill');
const cardTodayAmt    = $('card-today-amount');
const cardTodayCnt    = $('card-today-count');
const cardWeekAmt     = $('card-week-amount');
const cardWeekCnt     = $('card-week-count');
const cardMonthAmt    = $('card-month-amount');
const cardMonthCnt    = $('card-month-count');
const recentList      = $('recent-list');
const recentEmpty     = $('recent-empty');
const txListFull      = $('tx-list-full');
const txEmpty         = $('tx-empty');
const filterPeriod    = $('filter-period');
const filterCategory  = $('filter-category');
const catBars         = $('cat-bars');
const catEmpty        = $('cat-empty');
const lineChart       = $('line-chart');
const toast           = $('toast');
const settingsBtn     = $('settings-btn');
const settingsModal   = $('settings-modal');
const settingsClose   = $('settings-close');
const currencySelect  = $('currency-select');
const budgetInput     = $('budget-input');
const saveSettingsBtn = $('save-settings-btn');
const clearDataBtn    = $('clear-data-btn');
const exportBtn       = $('export-btn');
const editModal       = $('edit-modal');
const editClose       = $('edit-close');
const editAmount      = $('edit-amount');
const editDesc        = $('edit-desc');
const editCategory    = $('edit-category');
const editDate        = $('edit-date');
const saveEditBtn     = $('save-edit-btn');
const deleteBtn       = $('delete-btn');
const modalOverlay    = $('modal-overlay');

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 200);
  }, 2000);
}

// ─── Modal helpers ────────────────────────────────────────────────────────────
function openModal(el) {
  el.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
  requestAnimationFrame(() => el.classList.add('show'));
}
function closeModal(el) {
  el.classList.remove('show');
  setTimeout(() => {
    el.classList.add('hidden');
    modalOverlay.classList.add('hidden');
  }, 200);
}

modalOverlay.addEventListener('click', () => {
  closeModal(settingsModal);
  closeModal(editModal);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal(settingsModal);
    closeModal(editModal);
  }
});

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function switchTab(key) {
  tabBtns.forEach(b => {
    const active = b.dataset.tab === key;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active);
  });
  tabPanels.forEach(p => p.classList.toggle('hidden', p.id !== `tab-${key}`));
  if (key === 'stats')        renderStats();
  if (key === 'transactions') renderTxList();
}

tabBtns.forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

// ─── Header date ──────────────────────────────────────────────────────────────
function updateHeaderDate() {
  const d = new Date();
  headerDate.textContent = `${d.getDate()} ${RU_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Summary cards + budget ───────────────────────────────────────────────────
function updateSummary() {
  const todays  = expenses.filter(e => isInPeriod(e, 'today'));
  const weeks   = expenses.filter(e => isInPeriod(e, 'week'));
  const months  = expenses.filter(e => isInPeriod(e, 'month'));

  const sumToday = todays.reduce((s, e) => s + e.amount, 0);
  const sumWeek  = weeks.reduce((s,  e) => s + e.amount, 0);
  const sumMonth = months.reduce((s, e) => s + e.amount, 0);

  cardTodayAmt.textContent = fmtAmount(sumToday);
  cardTodayCnt.textContent = pluralRU(todays.length, 'трата', 'траты', 'трат');
  cardWeekAmt.textContent  = fmtAmount(sumWeek);
  cardWeekCnt.textContent  = pluralRU(weeks.length, 'трата', 'траты', 'трат');
  cardMonthAmt.textContent = fmtAmount(sumMonth);
  cardMonthCnt.textContent = pluralRU(months.length, 'трата', 'траты', 'трат');

  headerMonthTotal.textContent = fmtAmount(sumMonth);

  // Budget
  const bgt = settings.budget;
  if (bgt > 0) {
    budgetSection.classList.remove('hidden');
    const pct = Math.min(sumMonth / bgt * 100, 100);
    budgetInfo.textContent = `${fmtAmount(sumMonth)} / ${fmtAmount(bgt)}`;
    budgetFill.style.width = pct + '%';
    budgetFill.style.background =
      pct >= 90 ? 'var(--clr-red)' :
      pct >= 70 ? 'var(--clr-yellow)' :
      'var(--clr-green)';
  } else {
    budgetSection.classList.add('hidden');
  }
}

// ─── Grouped transaction render ───────────────────────────────────────────────
function buildTxItem(expense) {
  const cat = CAT_MAP[expense.category] || CAT_MAP.other;
  const item = document.createElement('div');
  item.className = 'tx-item';
  item.dataset.id = expense.id;

  const iconEl = document.createElement('div');
  iconEl.className = 'tx-icon';
  iconEl.style.background = cat.color + '22';
  iconEl.textContent = cat.icon;

  const info = document.createElement('div');
  info.className = 'tx-info';

  const desc = document.createElement('div');
  desc.className = 'tx-desc';
  desc.textContent = expense.description || cat.name;

  const sub = document.createElement('div');
  sub.className = 'tx-cat-time';
  sub.textContent = `${cat.name}  ·  ${expense.time}`;

  info.appendChild(desc);
  info.appendChild(sub);

  const amt = document.createElement('div');
  amt.className = 'tx-amount';
  amt.textContent = '−' + fmtAmount(expense.amount);

  item.appendChild(iconEl);
  item.appendChild(info);
  item.appendChild(amt);

  item.addEventListener('click', () => openEditModal(expense.id));
  return item;
}

function groupByDate(list) {
  const groups = {};
  list.forEach(e => {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  });
  // sort dates descending
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function renderGroupedList(container, list, emptyEl) {
  container.innerHTML = '';
  if (list.length === 0) {
    emptyEl && emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl && emptyEl.classList.add('hidden');

  const groups = groupByDate(list);
  groups.forEach(([date, items]) => {
    // sort items within day descending by time
    items.sort((a, b) => b.time.localeCompare(a.time));

    const daySum = items.reduce((s, e) => s + e.amount, 0);

    const group = document.createElement('div');
    group.className = 'tx-day-group';

    const header = document.createElement('div');
    header.className = 'tx-day-header';
    const label = document.createElement('span');
    label.className = 'tx-day-label';
    label.textContent = fmtDateLabel(date);
    const total = document.createElement('span');
    total.className = 'tx-day-total';
    total.textContent = '−' + fmtAmount(daySum);
    header.appendChild(label);
    header.appendChild(total);
    group.appendChild(header);

    items.forEach(e => group.appendChild(buildTxItem(e)));
    container.appendChild(group);
  });
}

// ─── Dashboard (recent) ───────────────────────────────────────────────────────
function renderRecent() {
  const sorted = [...expenses].sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    return cmp !== 0 ? cmp : b.time.localeCompare(a.time);
  }).slice(0, 15);

  renderGroupedList(recentList, sorted, recentEmpty);
}

// ─── Transaction history tab ──────────────────────────────────────────────────
function renderTxList() {
  const period   = filterPeriod.value;
  const catKey   = filterCategory.value;
  let list = expenses.filter(e => isInPeriod(e, period));
  if (catKey !== 'all') list = list.filter(e => e.category === catKey);
  list.sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    return cmp !== 0 ? cmp : b.time.localeCompare(a.time);
  });
  renderGroupedList(txListFull, list, txEmpty);
}

function populateCategoryFilter() {
  filterCategory.innerHTML = '<option value="all">Все категории</option>';
  CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.key;
    opt.textContent = `${cat.icon} ${cat.name}`;
    filterCategory.appendChild(opt);
  });
}

filterPeriod.addEventListener('change', renderTxList);
filterCategory.addEventListener('change', renderTxList);

// ─── Stats tab ────────────────────────────────────────────────────────────────
function renderStats() {
  renderLineChart();
  renderCatBars();
}

// 7-day line chart (SVG)
function renderLineChart() {
  lineChart.innerHTML = '';
  const W = 380, H = 130;
  const PAD = { top: 14, right: 14, bottom: 28, left: 10 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Build 7 days data (oldest → newest)
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const sum = expenses.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
    const label = i === 0 ? 'Сег' : `${d.getDate()}/${d.getMonth()+1}`;
    days.push({ dateStr, sum, label });
  }

  const maxVal = Math.max(...days.map(d => d.sum), 1);

  const ns = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  // Grid lines
  [0, 0.25, 0.5, 0.75, 1].forEach(frac => {
    const y = PAD.top + chartH * (1 - frac);
    lineChart.appendChild(mk('line', {
      x1: PAD.left, y1: y, x2: PAD.left + chartW, y2: y,
      stroke: '#334155', 'stroke-width': '1',
      'stroke-dasharray': frac === 0 ? 'none' : '4,4'
    }));
  });

  // Compute point positions
  const pts = days.map((d, i) => ({
    x: PAD.left + (i / (days.length - 1)) * chartW,
    y: PAD.top  + chartH * (1 - d.sum / maxVal),
    ...d
  }));

  // Area fill
  const areaPath = [
    `M ${pts[0].x} ${PAD.top + chartH}`,
    ...pts.map(p => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length-1].x} ${PAD.top + chartH}`,
    'Z'
  ].join(' ');
  const grad = mk('linearGradient', { id: 'agrad', x1:'0', y1:'0', x2:'0', y2:'1' });
  grad.appendChild(mk('stop', { offset:'0%',   'stop-color':'#6366f1', 'stop-opacity':'0.45' }));
  grad.appendChild(mk('stop', { offset:'100%', 'stop-color':'#6366f1', 'stop-opacity':'0.02' }));
  const defs = mk('defs', {});
  defs.appendChild(grad);
  lineChart.appendChild(defs);
  lineChart.appendChild(mk('path', { d: areaPath, fill: 'url(#agrad)' }));

  // Line
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  lineChart.appendChild(mk('path', {
    d: linePath, fill: 'none',
    stroke: '#6366f1', 'stroke-width': '2',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round'
  }));

  // Points + labels
  pts.forEach(p => {
    // dot
    lineChart.appendChild(mk('circle', {
      cx: p.x, cy: p.y, r: p.sum > 0 ? '4' : '3',
      fill: p.sum > 0 ? '#6366f1' : '#334155',
      stroke: '#0f172a', 'stroke-width': '2'
    }));

    // amount label (above dot, only if non-zero)
    if (p.sum > 0) {
      const lbl = mk('text', {
        x: p.x, y: p.y - 8,
        'text-anchor': 'middle',
        'font-size': '8',
        fill: '#94a3b8',
        'font-family': 'Segoe UI, sans-serif'
      });
      lbl.textContent = p.sum >= 1000
        ? (p.sum / 1000).toFixed(1) + 'k'
        : Math.round(p.sum);
      lineChart.appendChild(lbl);
    }

    // day label (below axis)
    const dl = mk('text', {
      x: p.x, y: H - 4,
      'text-anchor': 'middle',
      'font-size': '9',
      fill: '#64748b',
      'font-family': 'Segoe UI, sans-serif'
    });
    dl.textContent = p.label;
    lineChart.appendChild(dl);
  });
}

// Category bars (this month)
function renderCatBars() {
  catBars.innerHTML = '';
  const monthExp = expenses.filter(e => isInPeriod(e, 'month'));
  if (monthExp.length === 0) {
    catEmpty.classList.remove('hidden');
    return;
  }
  catEmpty.classList.add('hidden');

  const totals = {};
  monthExp.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
  const grand = monthExp.reduce((s, e) => s + e.amount, 0) || 1;

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  sorted.forEach(([key, sum]) => {
    const cat = CAT_MAP[key] || CAT_MAP.other;
    const pct = Math.round(sum / grand * 100);

    const item = document.createElement('div');
    item.className = 'cat-bar-item';

    const hdr = document.createElement('div');
    hdr.className = 'cat-bar-header';

    const left = document.createElement('div');
    left.className = 'cat-bar-left';
    const icon = document.createElement('span');
    icon.className = 'cat-bar-icon';
    icon.textContent = cat.icon;
    const name = document.createElement('span');
    name.className = 'cat-bar-name';
    name.textContent = cat.name;
    left.appendChild(icon);
    left.appendChild(name);

    const right = document.createElement('div');
    const amt = document.createElement('span');
    amt.className = 'cat-bar-amount';
    amt.textContent = fmtAmount(sum);
    const p = document.createElement('span');
    p.className = 'cat-bar-pct';
    p.textContent = pct + '%';
    right.appendChild(amt);
    right.appendChild(p);

    hdr.appendChild(left);
    hdr.appendChild(right);

    const track = document.createElement('div');
    track.className = 'cat-track';
    const fill = document.createElement('div');
    fill.className = 'cat-fill';
    fill.style.background = cat.color;
    fill.style.width = '0%';
    track.appendChild(fill);

    item.appendChild(hdr);
    item.appendChild(track);
    catBars.appendChild(item);

    // animate width after paint
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.width = pct + '%';
    }));
  });
}

// ─── Add expense ──────────────────────────────────────────────────────────────
function refreshAll() {
  updateSummary();
  renderRecent();
  // refresh active tab
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  if (activeTab === 'transactions') renderTxList();
  if (activeTab === 'stats')        renderStats();
}

addForm.addEventListener('submit', e => {
  e.preventDefault();
  const amt = parseFloat(amountInput.value);
  if (!amt || amt <= 0) {
    amountInput.focus();
    amountInput.style.color = 'var(--clr-red)';
    setTimeout(() => amountInput.style.color = '', 600);
    return;
  }

  const desc = descInput.value.trim();
  const cat  = autoCategory(desc);

  const expense = {
    id:          generateId(),
    amount:      amt,
    description: desc,
    category:    cat.key,
    date:        dateInput.value || todayStr(),
    time:        timeInput.value || nowTimeStr(),
  };

  expenses.unshift(expense);
  saveExpenses();
  refreshAll();

  // Reset form
  amountInput.value = '';
  descInput.value   = '';
  dateInput.value   = todayStr();
  timeInput.value   = nowTimeStr();
  updateCatChip('');
  amountInput.focus();

  showToast(`✓ Добавлено: ${fmtAmount(amt)}`);
});

// ─── Auto-update category chip ────────────────────────────────────────────────
function updateCatChip(desc) {
  const cat = autoCategory(desc);
  catChipIcon.textContent = cat.icon;
  catChipName.textContent = cat.name;
  catChip.style.borderColor = cat.key !== 'other' ? cat.color : '';
  catChip.style.color       = cat.key !== 'other' ? cat.color : '';
}

descInput.addEventListener('input', () => updateCatChip(descInput.value));

// ─── Edit modal ───────────────────────────────────────────────────────────────
function populateEditCategorySelect() {
  editCategory.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.key;
    opt.textContent = `${cat.icon} ${cat.name}`;
    editCategory.appendChild(opt);
  });
}

function openEditModal(id) {
  const expense = expenses.find(e => e.id === id);
  if (!expense) return;
  editingId = id;

  editAmount.value   = expense.amount;
  editDesc.value     = expense.description;
  editCategory.value = expense.category;
  editDate.value     = expense.date;

  openModal(editModal);
}

saveEditBtn.addEventListener('click', () => {
  const expense = expenses.find(e => e.id === editingId);
  if (!expense) return;

  const amt = parseFloat(editAmount.value);
  if (!amt || amt <= 0) return;

  expense.amount      = amt;
  expense.description = editDesc.value.trim();
  expense.category    = editCategory.value;
  expense.date        = editDate.value || expense.date;

  saveExpenses();
  closeModal(editModal);
  refreshAll();
  showToast('✓ Изменения сохранены');
  editingId = null;
});

deleteBtn.addEventListener('click', () => {
  expenses = expenses.filter(e => e.id !== editingId);
  saveExpenses();
  closeModal(editModal);
  refreshAll();
  showToast('🗑 Трата удалена');
  editingId = null;
});

editClose.addEventListener('click', () => closeModal(editModal));

// ─── Settings ─────────────────────────────────────────────────────────────────
function applySettings() {
  currencySymbol.textContent = settings.currency;
  currencySelect.value       = settings.currency;
  budgetInput.value          = settings.budget || '';
  document.querySelectorAll('#currency-symbol').forEach(el => el.textContent = settings.currency);
}

settingsBtn.addEventListener('click', () => openModal(settingsModal));
settingsClose.addEventListener('click', () => closeModal(settingsModal));

saveSettingsBtn.addEventListener('click', () => {
  settings.currency = currencySelect.value;
  settings.budget   = parseFloat(budgetInput.value) || 0;
  saveSettings();
  applySettings();
  closeModal(settingsModal);
  refreshAll();
  showToast('✓ Настройки сохранены');
});

clearDataBtn.addEventListener('click', () => {
  if (!confirm('Удалить все данные? Это действие необратимо.')) return;
  expenses = [];
  saveExpenses();
  closeModal(settingsModal);
  refreshAll();
  showToast('🗑 Все данные удалены');
});

// ─── CSV Export ───────────────────────────────────────────────────────────────
exportBtn.addEventListener('click', () => {
  if (expenses.length === 0) { showToast('Нет данных для экспорта'); return; }

  const rows = [
    ['Дата', 'Время', 'Сумма', 'Описание', 'Категория'],
    ...expenses.map(e => [
      e.date, e.time, e.amount,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      (CAT_MAP[e.category] || CAT_MAP.other).name
    ])
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `ax-expenses-${todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 Экспорт готов');
});

// ─── Init ─────────────────────────────────────────────────────────────────────
loadData();
applySettings();
updateHeaderDate();
populateCategoryFilter();
populateEditCategorySelect();

// Set default date/time in form
dateInput.value = todayStr();
timeInput.value = nowTimeStr();
updateCatChip('');

refreshAll();

// Keep header date up to date
setInterval(updateHeaderDate, 60_000);

(function () {
    'use strict';

    // ===== CATEGORIES =====
    var CATEGORIES = [
        { key: 'food',      icon: '🍔', name: 'Еда',         color: '#ff6b6b', keywords: ['еда','обед','завтрак','ужин','перекус','кафе','ресторан','бургер','пицца','суши','шаурма','столовая','фастфуд','продукты','магазин','супермаркет','рынок','молоко','хлеб','мясо','фрукт','овощ'] },
        { key: 'coffee',    icon: '☕', name: 'Кофе',        color: '#a17261', keywords: ['кофе','латте','капучино','американо','чай','starbucks','старбакс'] },
        { key: 'transport', icon: '🚕', name: 'Транспорт',   color: '#ffd93d', keywords: ['такси','uber','яндекс','бензин','метро','автобус','транспорт','парковка','поезд','билет','самолёт','самолет','каршеринг','bolt','indriver'] },
        { key: 'shopping',  icon: '🛍️', name: 'Покупки',     color: '#ff9ff3', keywords: ['одежда','обувь','покупк','шоппинг','магазин','подарок','подарки','техника','телефон','электроника'] },
        { key: 'health',    icon: '💊', name: 'Здоровье',    color: '#2ed573', keywords: ['аптека','лекарств','врач','клиника','больниц','стоматолог','зуб','здоровье','анализ','витамин'] },
        { key: 'fun',       icon: '🎮', name: 'Развлечения', color: '#a29bfe', keywords: ['кино','театр','игр','подписк','netflix','spotify','youtube','развлечен','музей','концерт','клуб','бар','вечеринка'] },
        { key: 'home',      icon: '🏠', name: 'Дом',         color: '#74b9ff', keywords: ['аренда','квартир','коммунал','интернет','свет','вода','газ','ремонт','мебель','уборка'] },
        { key: 'education', icon: '📚', name: 'Образование', color: '#fd79a8', keywords: ['курс','книг','обучен','школ','универ','репетитор','учёба','учеба'] },
        { key: 'sport',     icon: '🏃', name: 'Спорт',       color: '#55efc4', keywords: ['спорт','зал','фитнес','тренировк','бассейн','йога'] },
        { key: 'other',     icon: '📝', name: 'Другое',      color: '#636e72', keywords: [] }
    ];

    var STORAGE_KEY = 'ax_expenses';
    var SETTINGS_KEY = 'ax_settings';

    // ===== STATE =====
    var expenses = loadExpenses();
    var settings = loadSettings();
    var currentPeriod = 'day';
    var currentPage = 'home';
    var deleteTargetId = null;
    var editTargetId = null;

    // ===== DEFAULT SETTINGS =====
    function defaultSettings() {
        return {
            budget: 0,
            currency: '₸'
        };
    }

    // ===== DOM ELEMENTS =====
    var pageHome = document.getElementById('pageHome');
    var pageStats = document.getElementById('pageStats');
    var pageSettings = document.getElementById('pageSettings');
    var pages = { home: pageHome, stats: pageStats, settings: pageSettings };

    var totalAmount = document.getElementById('totalAmount');
    var budgetLabel = document.getElementById('budgetLabel');
    var budgetRingFill = document.getElementById('budgetRingFill');
    var categoryBreakdown = document.getElementById('categoryBreakdown');
    var expenseList = document.getElementById('expenseList');
    var emptyMsg = document.getElementById('emptyMsg');
    var expenseCount = document.getElementById('expenseCount');
    var periodBtns = document.querySelectorAll('.summary__period-btn');

    var fab = document.getElementById('fab');
    var navBtns = document.querySelectorAll('.nav__btn');

    var addModal = document.getElementById('addModal');
    var inputAmount = document.getElementById('inputAmount');
    var inputDesc = document.getElementById('inputDesc');
    var addCurrency = document.getElementById('addCurrency');
    var categoryIcon = document.getElementById('categoryIcon');
    var categoryName = document.getElementById('categoryName');
    var btnAdd = document.getElementById('btnAdd');

    var editModal = document.getElementById('editModal');
    var editAmount = document.getElementById('editAmount');
    var editDesc = document.getElementById('editDesc');
    var editCurrency = document.getElementById('editCurrency');
    var editCategoryIcon = document.getElementById('editCategoryIcon');
    var editCategoryName = document.getElementById('editCategoryName');
    var btnSaveEdit = document.getElementById('btnSaveEdit');
    var btnDeleteFromEdit = document.getElementById('btnDeleteFromEdit');

    var deleteModal = document.getElementById('deleteModal');
    var cancelDelete = document.getElementById('cancelDelete');
    var confirmDelete = document.getElementById('confirmDelete');

    var clearModal = document.getElementById('clearModal');
    var cancelClear = document.getElementById('cancelClear');
    var confirmClear = document.getElementById('confirmClear');

    var statsBody = document.getElementById('statsBody');
    var inputBudget = document.getElementById('inputBudget');
    var settingsCurrencyBudget = document.getElementById('settingsCurrencyBudget');
    var selectCurrency = document.getElementById('selectCurrency');
    var btnExport = document.getElementById('btnExport');
    var btnClearData = document.getElementById('btnClearData');
    var toastContainer = document.getElementById('toastContainer');

    // ===== STORAGE =====
    function loadExpenses() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function saveExpenses() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
        } catch (e) {
            // Storage full or unavailable
        }
    }

    function loadSettings() {
        try {
            var data = localStorage.getItem(SETTINGS_KEY);
            return data ? JSON.parse(data) : defaultSettings();
        } catch (e) {
            return defaultSettings();
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            // Storage full or unavailable
        }
    }

    // ===== TOAST NOTIFICATIONS =====
    function showToast(message, type) {
        type = type || 'success';
        var icons = { success: '✓', error: '✕', info: 'ℹ' };
        var toast = document.createElement('div');
        toast.className = 'toast toast--' + type;
        toast.innerHTML = '<span class="toast__icon">' + (icons[type] || '') + '</span>' + escapeHtml(message);
        toastContainer.appendChild(toast);
        setTimeout(function () {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 2500);
    }

    // ===== CATEGORY DETECTION =====
    function detectCategory(text) {
        if (!text) return CATEGORIES[CATEGORIES.length - 1];
        var lower = text.toLowerCase();
        for (var i = 0; i < CATEGORIES.length - 1; i++) {
            var cat = CATEGORIES[i];
            for (var j = 0; j < cat.keywords.length; j++) {
                if (lower.indexOf(cat.keywords[j]) !== -1) {
                    return cat;
                }
            }
        }
        return CATEGORIES[CATEGORIES.length - 1];
    }

    function getCategoryByKey(key) {
        for (var i = 0; i < CATEGORIES.length; i++) {
            if (CATEGORIES[i].key === key) return CATEGORIES[i];
        }
        return CATEGORIES[CATEGORIES.length - 1];
    }

    // ===== DATE HELPERS =====
    function today() {
        return new Date().toISOString().split('T')[0];
    }

    function yesterday() {
        var d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    }

    function formatDate(dateStr) {
        var d = new Date(dateStr + 'T00:00:00');
        var months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
        return d.getDate() + ' ' + months[d.getMonth()];
    }

    function formatTime(isoStr) {
        var d = new Date(isoStr);
        var h = d.getHours();
        var m = d.getMinutes();
        return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }

    function getDateStr(isoStr) {
        return isoStr.split('T')[0];
    }

    function isToday(dateStr) {
        return dateStr === today();
    }

    function isYesterday(dateStr) {
        return dateStr === yesterday();
    }

    function isThisWeek(dateStr) {
        var now = new Date();
        var d = new Date(dateStr + 'T00:00:00');
        var dayOfWeek = now.getDay() || 7;
        var monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek + 1);
        monday.setHours(0, 0, 0, 0);
        return d >= monday;
    }

    function isThisMonth(dateStr) {
        var now = new Date();
        var d = new Date(dateStr + 'T00:00:00');
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    // ===== FORMAT MONEY =====
    function formatMoney(amount) {
        var num = parseFloat(amount);
        if (isNaN(num)) return '0 ' + settings.currency;
        var parts = num.toFixed(num % 1 === 0 ? 0 : 2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return parts.join(',') + ' ' + settings.currency;
    }

    // ===== GENERATE ID =====
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    }

    // ===== ESCAPE HTML =====
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // ===== PAGE NAVIGATION =====
    function switchPage(page) {
        if (page === currentPage) return;
        currentPage = page;

        var key;
        for (key in pages) {
            if (Object.prototype.hasOwnProperty.call(pages, key)) {
                pages[key].classList.remove('active');
            }
        }
        if (pages[page]) {
            pages[page].classList.add('active');
        }

        for (var i = 0; i < navBtns.length; i++) {
            navBtns[i].classList.remove('active');
            if (navBtns[i].getAttribute('data-page') === page) {
                navBtns[i].classList.add('active');
            }
        }

        // Render page-specific content
        if (page === 'stats') renderStats();
        if (page === 'settings') loadSettingsUI();
    }

    // ===== FILTER EXPENSES =====
    function getFilteredExpenses(period) {
        return expenses.filter(function (e) {
            var d = getDateStr(e.date);
            switch (period) {
                case 'day': return isToday(d);
                case 'week': return isThisWeek(d);
                case 'month': return isThisMonth(d);
                default: return true;
            }
        });
    }

    // ===== RENDER SUMMARY =====
    function renderSummary() {
        var filtered = getFilteredExpenses(currentPeriod);
        var total = 0;
        var catTotals = {};

        for (var i = 0; i < filtered.length; i++) {
            total += filtered[i].amount;
            var key = filtered[i].category;
            catTotals[key] = (catTotals[key] || 0) + filtered[i].amount;
        }

        totalAmount.textContent = formatMoney(total);

        // Budget ring
        var budget = settings.budget;
        var circumference = 2 * Math.PI * 52; // 326.73
        if (budget > 0 && currentPeriod === 'month') {
            var pct = Math.min(total / budget, 1);
            var offset = circumference - (pct * circumference);
            budgetRingFill.style.strokeDashoffset = offset;
            if (pct >= 1) {
                budgetRingFill.style.stroke = '#ff4757';
            } else if (pct >= 0.8) {
                budgetRingFill.style.stroke = '#ffd93d';
            } else {
                budgetRingFill.style.stroke = '';
            }
            budgetLabel.textContent = 'из ' + formatMoney(budget);
        } else {
            budgetRingFill.style.strokeDashoffset = circumference;
            budgetLabel.textContent = filtered.length > 0 ? filtered.length + ' ' + pluralForm(filtered.length, 'расход', 'расхода', 'расходов') : '';
        }

        // Category tags
        var html = '';
        var keys = Object.keys(catTotals);
        keys.sort(function (a, b) { return catTotals[b] - catTotals[a]; });
        for (var j = 0; j < keys.length && j < 5; j++) {
            var cat = getCategoryByKey(keys[j]);
            html += '<span class="summary__cat-tag"><span>' + cat.icon + '</span> ' + formatMoney(catTotals[keys[j]]) + '</span>';
        }
        categoryBreakdown.innerHTML = html;
    }

    function pluralForm(count, one, few, many) {
        var mod = count % 10;
        var mod100 = count % 100;
        if (mod100 >= 11 && mod100 <= 14) return many;
        if (mod === 1) return one;
        if (mod >= 2 && mod <= 4) return few;
        return many;
    }

    // ===== RENDER EXPENSE LIST =====
    function renderExpenses() {
        if (expenses.length === 0) {
            emptyMsg.style.display = '';
            expenseList.innerHTML = '';
            expenseList.appendChild(emptyMsg);
            expenseCount.textContent = '';
            return;
        }

        emptyMsg.style.display = 'none';
        expenseCount.textContent = expenses.length + ' ' + pluralForm(expenses.length, 'запись', 'записи', 'записей');

        var sorted = expenses.slice().sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        var html = '';
        var lastDate = '';

        for (var i = 0; i < sorted.length; i++) {
            var e = sorted[i];
            var dateStr = getDateStr(e.date);

            if (dateStr !== lastDate) {
                lastDate = dateStr;
                var label;
                if (isToday(dateStr)) {
                    label = 'Сегодня';
                } else if (isYesterday(dateStr)) {
                    label = 'Вчера';
                } else {
                    label = formatDate(dateStr);
                }
                html += '<div class="expenses__date-header">' + label + '</div>';
            }

            var cat = getCategoryByKey(e.category);
            html += '<div class="expense-item" data-id="' + e.id + '" style="animation-delay:' + (Math.min(i, 10) * 0.03) + 's">';
            html += '  <div class="expense-item__icon">' + cat.icon + '</div>';
            html += '  <div class="expense-item__info">';
            html += '    <div class="expense-item__desc">' + escapeHtml(e.description || cat.name) + '</div>';
            html += '    <div class="expense-item__meta">' + cat.name + ' · ' + formatTime(e.date) + '</div>';
            html += '  </div>';
            html += '  <div class="expense-item__amount">−' + formatMoney(e.amount) + '</div>';
            html += '</div>';
        }

        expenseList.innerHTML = html;
    }

    // ===== ADD EXPENSE =====
    function openAddModal() {
        addModal.classList.add('visible');
        fab.classList.add('open');
        addCurrency.textContent = settings.currency;
        setTimeout(function () { inputAmount.focus(); }, 350);
    }

    function closeAddModal() {
        addModal.classList.remove('visible');
        fab.classList.remove('open');
        inputAmount.value = '';
        inputDesc.value = '';
        updateCategoryHint('');
    }

    function addExpense() {
        var amount = parseFloat(inputAmount.value);
        if (!amount || amount <= 0) {
            inputAmount.focus();
            showToast('Введите сумму', 'error');
            return;
        }

        var desc = inputDesc.value.trim();
        var cat = detectCategory(desc);

        var expense = {
            id: generateId(),
            amount: amount,
            description: desc,
            category: cat.key,
            date: new Date().toISOString()
        };

        expenses.push(expense);
        saveExpenses();

        closeAddModal();
        renderExpenses();
        renderSummary();

        showToast(formatMoney(amount) + ' добавлено', 'success');
    }

    function updateCategoryHint(text) {
        var cat = detectCategory(text);
        categoryIcon.textContent = cat.icon;
        categoryName.textContent = cat.name;
    }

    // ===== EDIT EXPENSE =====
    function openEditModal(id) {
        var expense = null;
        for (var i = 0; i < expenses.length; i++) {
            if (expenses[i].id === id) { expense = expenses[i]; break; }
        }
        if (!expense) return;

        editTargetId = id;
        editAmount.value = expense.amount;
        editDesc.value = expense.description || '';
        editCurrency.textContent = settings.currency;
        var cat = getCategoryByKey(expense.category);
        editCategoryIcon.textContent = cat.icon;
        editCategoryName.textContent = cat.name;
        editModal.classList.add('visible');
    }

    function closeEditModal() {
        editModal.classList.remove('visible');
        editTargetId = null;
    }

    function saveEdit() {
        if (!editTargetId) return;
        var amount = parseFloat(editAmount.value);
        if (!amount || amount <= 0) {
            editAmount.focus();
            showToast('Введите сумму', 'error');
            return;
        }

        for (var i = 0; i < expenses.length; i++) {
            if (expenses[i].id === editTargetId) {
                expenses[i].amount = amount;
                expenses[i].description = editDesc.value.trim();
                expenses[i].category = detectCategory(expenses[i].description).key;
                break;
            }
        }

        saveExpenses();
        closeEditModal();
        renderExpenses();
        renderSummary();
        showToast('Расход обновлён', 'success');
    }

    // ===== DELETE EXPENSE =====
    function showDeleteConfirm(id) {
        deleteTargetId = id;
        deleteModal.classList.add('visible');
    }

    function hideDeleteConfirm() {
        deleteTargetId = null;
        deleteModal.classList.remove('visible');
    }

    function deleteExpense() {
        if (!deleteTargetId) return;
        expenses = expenses.filter(function (e) { return e.id !== deleteTargetId; });
        saveExpenses();
        hideDeleteConfirm();
        closeEditModal();
        renderExpenses();
        renderSummary();
        showToast('Расход удалён', 'info');
    }

    // ===== STATS PAGE =====
    function renderStats() {
        var monthExpenses = getFilteredExpenses('month');
        var total = 0;
        var catTotals = {};
        var catCounts = {};

        for (var i = 0; i < monthExpenses.length; i++) {
            total += monthExpenses[i].amount;
            var key = monthExpenses[i].category;
            catTotals[key] = (catTotals[key] || 0) + monthExpenses[i].amount;
            catCounts[key] = (catCounts[key] || 0) + 1;
        }

        if (monthExpenses.length === 0) {
            statsBody.innerHTML = '<div class="stats-empty"><div class="stats-empty__icon">📊</div><p class="stats-empty__text">Нет данных за этот месяц</p></div>';
            return;
        }

        var html = '';

        // Summary cards
        var daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        var dayOfMonth = new Date().getDate();
        var dailyAvg = dayOfMonth > 0 ? total / dayOfMonth : 0;

        html += '<div class="stats-card">';
        html += '  <div class="stats-summary">';
        html += '    <div class="stats-summary__item"><span class="stats-summary__value">' + formatMoney(total) + '</span><span class="stats-summary__label">За месяц</span></div>';
        html += '    <div class="stats-summary__item"><span class="stats-summary__value">' + formatMoney(dailyAvg) + '</span><span class="stats-summary__label">В день (ср.)</span></div>';
        html += '    <div class="stats-summary__item"><span class="stats-summary__value">' + monthExpenses.length + '</span><span class="stats-summary__label">Операций</span></div>';
        html += '  </div>';
        html += '</div>';

        // Budget status (if set)
        if (settings.budget > 0) {
            var budgetPct = Math.min(Math.round((total / settings.budget) * 100), 100);
            var remaining = settings.budget - total;
            var dailyRemaining = (daysInMonth - dayOfMonth) > 0 ? remaining / (daysInMonth - dayOfMonth) : 0;
            var budgetColor = budgetPct >= 100 ? '#ff4757' : budgetPct >= 80 ? '#ffd93d' : '#2ed573';

            html += '<div class="stats-card">';
            html += '  <div class="stats-card__title">Бюджет</div>';
            html += '  <div class="stats-summary" style="grid-template-columns:1fr 1fr">';
            html += '    <div class="stats-summary__item"><span class="stats-summary__value" style="color:' + budgetColor + '">' + budgetPct + '%</span><span class="stats-summary__label">Использовано</span></div>';
            if (remaining > 0) {
                html += '    <div class="stats-summary__item"><span class="stats-summary__value">' + formatMoney(dailyRemaining) + '</span><span class="stats-summary__label">В день осталось</span></div>';
            } else {
                html += '    <div class="stats-summary__item"><span class="stats-summary__value" style="color:#ff4757">' + formatMoney(Math.abs(remaining)) + '</span><span class="stats-summary__label">Превышение</span></div>';
            }
            html += '  </div>';
            html += '</div>';
        }

        // Donut chart
        var keys = Object.keys(catTotals);
        keys.sort(function (a, b) { return catTotals[b] - catTotals[a]; });

        html += '<div class="stats-card">';
        html += '  <div class="stats-card__title">По категориям</div>';
        html += '  <div class="stats-donut">';
        html += '    <svg class="stats-donut__chart" viewBox="0 0 200 200">';

        var cumulativePercent = 0;
        var radius = 80;
        var circumference = 2 * Math.PI * radius;

        for (var j = 0; j < keys.length; j++) {
            var cat = getCategoryByKey(keys[j]);
            var pct = total > 0 ? catTotals[keys[j]] / total : 0;
            var dashArray = pct * circumference;
            var dashOffset = -cumulativePercent * circumference;

            html += '<circle cx="100" cy="100" r="' + radius + '" fill="none" stroke="' + cat.color + '" stroke-width="28" ';
            html += 'stroke-dasharray="' + dashArray + ' ' + (circumference - dashArray) + '" ';
            html += 'stroke-dashoffset="' + dashOffset + '" ';
            html += 'transform="rotate(-90 100 100)" />';

            cumulativePercent += pct;
        }

        html += '    </svg>';

        // Legend
        html += '    <div class="stats-donut__legend">';
        for (var k = 0; k < keys.length; k++) {
            var catL = getCategoryByKey(keys[k]);
            var pctL = total > 0 ? Math.round((catTotals[keys[k]] / total) * 100) : 0;
            html += '<div class="stats-donut__legend-item">';
            html += '  <div class="stats-donut__legend-left">';
            html += '    <div class="stats-donut__legend-color" style="background:' + catL.color + '"></div>';
            html += '    <span class="stats-donut__legend-icon">' + catL.icon + '</span>';
            html += '    <span class="stats-donut__legend-name">' + catL.name + ' (' + catCounts[keys[k]] + ')</span>';
            html += '  </div>';
            html += '  <div class="stats-donut__legend-right">';
            html += '    <span class="stats-donut__legend-amount">' + formatMoney(catTotals[keys[k]]) + '</span>';
            html += '    <span class="stats-donut__legend-pct">' + pctL + '%</span>';
            html += '  </div>';
            html += '</div>';
        }
        html += '    </div>';
        html += '  </div>';
        html += '</div>';

        statsBody.innerHTML = html;
    }

    // ===== SETTINGS =====
    function loadSettingsUI() {
        inputBudget.value = settings.budget || '';
        selectCurrency.value = settings.currency;
        settingsCurrencyBudget.textContent = settings.currency;
    }

    function updateCurrencyDisplay() {
        addCurrency.textContent = settings.currency;
        editCurrency.textContent = settings.currency;
        settingsCurrencyBudget.textContent = settings.currency;
    }

    function exportCSV() {
        if (expenses.length === 0) {
            showToast('Нет данных для экспорта', 'error');
            return;
        }

        var csv = '\uFEFF'; // BOM for Excel compatibility
        csv += 'Дата,Время,Сумма,Валюта,Категория,Описание\n';

        var sorted = expenses.slice().sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        for (var i = 0; i < sorted.length; i++) {
            var e = sorted[i];
            var cat = getCategoryByKey(e.category);
            var dateStr = getDateStr(e.date);
            var timeStr = formatTime(e.date);
            var desc = (e.description || '').replace(/"/g, '""');
            csv += dateStr + ',' + timeStr + ',' + e.amount + ',' + settings.currency + ',' + cat.name + ',"' + desc + '"\n';
        }

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'ax-expenses-' + today() + '.csv';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showToast('CSV экспортирован', 'success');
    }

    // ===== MODAL HELPERS =====
    function closeModal(id) {
        var modal = document.getElementById(id);
        if (modal) modal.classList.remove('visible');
        if (id === 'addModal') fab.classList.remove('open');
    }

    // ===== EVENT LISTENERS =====

    // FAB
    fab.addEventListener('click', function () {
        if (addModal.classList.contains('visible')) {
            closeAddModal();
        } else {
            openAddModal();
        }
    });

    // Bottom nav
    for (var n = 0; n < navBtns.length; n++) {
        navBtns[n].addEventListener('click', function () {
            switchPage(this.getAttribute('data-page'));
        });
    }

    // Period toggle
    for (var i = 0; i < periodBtns.length; i++) {
        periodBtns[i].addEventListener('click', function () {
            for (var j = 0; j < periodBtns.length; j++) {
                periodBtns[j].classList.remove('active');
            }
            this.classList.add('active');
            currentPeriod = this.getAttribute('data-period');
            renderSummary();
        });
    }

    // Add expense
    btnAdd.addEventListener('click', addExpense);
    inputDesc.addEventListener('input', function () {
        updateCategoryHint(this.value);
    });
    inputAmount.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            if (inputDesc.value.trim()) {
                addExpense();
            } else {
                inputDesc.focus();
            }
        }
    });
    inputDesc.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') addExpense();
    });

    // Edit expense category hint
    editDesc.addEventListener('input', function () {
        var cat = detectCategory(this.value);
        editCategoryIcon.textContent = cat.icon;
        editCategoryName.textContent = cat.name;
    });

    // Expense click -> edit
    expenseList.addEventListener('click', function (e) {
        var item = e.target.closest('.expense-item');
        if (item) {
            openEditModal(item.getAttribute('data-id'));
        }
    });

    // Edit modal actions
    btnSaveEdit.addEventListener('click', saveEdit);
    btnDeleteFromEdit.addEventListener('click', function () {
        if (editTargetId) {
            deleteTargetId = editTargetId;
            closeEditModal();
            showDeleteConfirm(deleteTargetId);
        }
    });

    // Delete confirmation
    confirmDelete.addEventListener('click', deleteExpense);
    cancelDelete.addEventListener('click', hideDeleteConfirm);

    // Clear data
    btnClearData.addEventListener('click', function () {
        clearModal.classList.add('visible');
    });
    cancelClear.addEventListener('click', function () {
        clearModal.classList.remove('visible');
    });
    confirmClear.addEventListener('click', function () {
        expenses = [];
        saveExpenses();
        clearModal.classList.remove('visible');
        renderExpenses();
        renderSummary();
        showToast('Все данные удалены', 'info');
    });

    // Close modals on overlay click
    var overlays = document.querySelectorAll('.modal__overlay');
    for (var ov = 0; ov < overlays.length; ov++) {
        overlays[ov].addEventListener('click', function () {
            var modalId = this.getAttribute('data-close');
            if (modalId) closeModal(modalId);
        });
    }

    // Settings: budget
    inputBudget.addEventListener('change', function () {
        var val = parseFloat(this.value);
        settings.budget = (val && val > 0) ? val : 0;
        saveSettings();
        renderSummary();
        if (settings.budget > 0) {
            showToast('Бюджет: ' + formatMoney(settings.budget) + '/мес', 'success');
        }
    });

    // Settings: currency
    selectCurrency.addEventListener('change', function () {
        settings.currency = this.value;
        saveSettings();
        updateCurrencyDisplay();
        renderSummary();
        renderExpenses();
        showToast('Валюта: ' + settings.currency, 'success');
    });

    // Settings: export
    btnExport.addEventListener('click', exportCSV);

    // ===== SERVICE WORKER =====
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('js/sw.js').catch(function () {
            // SW registration failed — app works without it
        });
    }

    // ===== INIT =====
    updateCurrencyDisplay();
    renderExpenses();
    renderSummary();
})();

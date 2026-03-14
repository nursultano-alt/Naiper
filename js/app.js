(function () {
    'use strict';

    // ===== CATEGORIES =====
    var CATEGORIES = [
        { key: 'food',      icon: '🍔', name: 'Еда',         keywords: ['еда','обед','завтрак','ужин','перекус','кафе','ресторан','бургер','пицца','суши','шаурма','столовая','фастфуд','продукты','магазин','супермаркет','рынок','молоко','хлеб','мясо','фрукт','овощ'] },
        { key: 'coffee',    icon: '☕', name: 'Кофе',        keywords: ['кофе','латте','капучино','американо','чай','starbucks','старбакс'] },
        { key: 'transport', icon: '🚕', name: 'Транспорт',   keywords: ['такси','uber','яндекс','бензин','метро','автобус','транспорт','парковка','поезд','билет','самолёт','самолет','каршеринг','bolt','indriver'] },
        { key: 'shopping',  icon: '🛍️', name: 'Покупки',     keywords: ['одежда','обувь','покупк','шоппинг','магазин','подарок','подарки','техника','телефон','электроника'] },
        { key: 'health',    icon: '💊', name: 'Здоровье',    keywords: ['аптека','лекарств','врач','клиника','больниц','стоматолог','зуб','здоровье','анализ','витамин'] },
        { key: 'fun',       icon: '🎮', name: 'Развлечения', keywords: ['кино','театр','игр','подписк','netflix','spotify','youtube','развлечен','музей','концерт','клуб','бар','вечеринка'] },
        { key: 'home',      icon: '🏠', name: 'Дом',         keywords: ['аренда','квартир','коммунал','интернет','свет','вода','газ','ремонт','мебель','уборка'] },
        { key: 'education', icon: '📚', name: 'Образование', keywords: ['курс','книг','обучен','школ','универ','репетитор','учёба','учеба'] },
        { key: 'sport',     icon: '🏃', name: 'Спорт',       keywords: ['спорт','зал','фитнес','тренировк','бассейн','йога'] },
        { key: 'other',     icon: '📝', name: 'Другое',      keywords: [] }
    ];

    var STORAGE_KEY = 'ax_expenses';

    // ===== STATE =====
    var expenses = loadExpenses();
    var currentPeriod = 'day';
    var deleteTargetId = null;

    // ===== DOM =====
    var inputAmount = document.getElementById('inputAmount');
    var inputDesc = document.getElementById('inputDesc');
    var categoryIcon = document.getElementById('categoryIcon');
    var categoryName = document.getElementById('categoryName');
    var btnAdd = document.getElementById('btnAdd');
    var expenseList = document.getElementById('expenseList');
    var emptyMsg = document.getElementById('emptyMsg');
    var totalAmount = document.getElementById('totalAmount');
    var categoryBreakdown = document.getElementById('categoryBreakdown');
    var btnStats = document.getElementById('btnStats');
    var statsModal = document.getElementById('statsModal');
    var closeStats = document.getElementById('closeStats');
    var statsBody = document.getElementById('statsBody');
    var deleteModal = document.getElementById('deleteModal');
    var cancelDelete = document.getElementById('cancelDelete');
    var confirmDelete = document.getElementById('confirmDelete');
    var periodBtns = document.querySelectorAll('.summary__period-btn');

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
        if (isNaN(num)) return '0 ₸';
        var parts = num.toFixed(num % 1 === 0 ? 0 : 2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return parts.join(',') + ' ₸';
    }

    // ===== GENERATE ID =====
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
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

        // Category tags
        var html = '';
        var keys = Object.keys(catTotals);
        // Sort by amount descending
        keys.sort(function (a, b) { return catTotals[b] - catTotals[a]; });
        for (var j = 0; j < keys.length && j < 5; j++) {
            var cat = getCategoryByKey(keys[j]);
            html += '<span class="summary__cat-tag"><span>' + cat.icon + '</span> ' + formatMoney(catTotals[keys[j]]) + '</span>';
        }
        categoryBreakdown.innerHTML = html;
    }

    // ===== RENDER EXPENSE LIST =====
    function renderExpenses() {
        if (expenses.length === 0) {
            emptyMsg.style.display = 'block';
            expenseList.innerHTML = '';
            expenseList.appendChild(emptyMsg);
            return;
        }

        emptyMsg.style.display = 'none';

        // Sort by date descending
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
                var label = isToday(dateStr) ? 'Сегодня' : formatDate(dateStr);
                html += '<div class="expenses__date-header">' + label + '</div>';
            }

            var cat = getCategoryByKey(e.category);
            html += '<div class="expense-item" data-id="' + e.id + '">';
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

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // ===== ADD EXPENSE =====
    function addExpense() {
        var amount = parseFloat(inputAmount.value);
        if (!amount || amount <= 0) {
            inputAmount.focus();
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

        // Reset form
        inputAmount.value = '';
        inputDesc.value = '';
        updateCategoryHint('');

        renderExpenses();
        renderSummary();

        inputAmount.focus();
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
        renderExpenses();
        renderSummary();
    }

    // ===== CATEGORY HINT =====
    function updateCategoryHint(text) {
        var cat = detectCategory(text);
        categoryIcon.textContent = cat.icon;
        categoryName.textContent = cat.name;
    }

    // ===== STATS MODAL =====
    function showStats() {
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

        var html = '';

        // Total
        html += '<div class="stats-total">';
        html += '  <div class="stats-total__label">Расходы за месяц</div>';
        html += '  <div class="stats-total__value">' + formatMoney(total) + '</div>';
        html += '  <div class="stats-total__count">' + monthExpenses.length + ' операций</div>';
        html += '</div>';

        // Category breakdown
        html += '<div class="stats-section">';
        html += '  <div class="stats-section__title">По категориям</div>';

        var keys = Object.keys(catTotals);
        keys.sort(function (a, b) { return catTotals[b] - catTotals[a]; });

        for (var j = 0; j < keys.length; j++) {
            var cat = getCategoryByKey(keys[j]);
            var pct = total > 0 ? Math.round((catTotals[keys[j]] / total) * 100) : 0;
            html += '<div class="stats-bar">';
            html += '  <div class="stats-bar__header">';
            html += '    <span class="stats-bar__label"><span>' + cat.icon + '</span> ' + cat.name + ' (' + catCounts[keys[j]] + ')</span>';
            html += '    <span>' + formatMoney(catTotals[keys[j]]) + '</span>';
            html += '  </div>';
            html += '  <div class="stats-bar__track"><div class="stats-bar__fill" style="width:' + pct + '%"></div></div>';
            html += '</div>';
        }

        html += '</div>';

        if (keys.length === 0) {
            html += '<p style="text-align:center;color:rgba(255,255,255,0.5);padding:20px 0">Нет данных за этот месяц</p>';
        }

        statsBody.innerHTML = html;
        statsModal.classList.add('visible');
    }

    function hideStats() {
        statsModal.classList.remove('visible');
    }

    // ===== EVENT LISTENERS =====
    btnAdd.addEventListener('click', addExpense);

    inputDesc.addEventListener('input', function () {
        updateCategoryHint(this.value);
    });

    // Submit on Enter in amount or desc field
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
        if (e.key === 'Enter') {
            addExpense();
        }
    });

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

    // Expense click -> delete
    expenseList.addEventListener('click', function (e) {
        var item = e.target.closest('.expense-item');
        if (item) {
            showDeleteConfirm(item.getAttribute('data-id'));
        }
    });

    confirmDelete.addEventListener('click', deleteExpense);
    cancelDelete.addEventListener('click', hideDeleteConfirm);

    // Close delete modal on outside click
    deleteModal.addEventListener('click', function (e) {
        if (e.target === deleteModal) hideDeleteConfirm();
    });

    // Stats
    btnStats.addEventListener('click', showStats);
    closeStats.addEventListener('click', hideStats);
    statsModal.addEventListener('click', function (e) {
        if (e.target === statsModal) hideStats();
    });

    // ===== SERVICE WORKER =====
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('js/sw.js').catch(function () {
            // SW registration failed — app works without it
        });
    }

    // ===== INIT =====
    renderExpenses();
    renderSummary();
})();

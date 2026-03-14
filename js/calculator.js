(function () {
    'use strict';

    var expressionEl = document.getElementById('expression');
    var resultEl = document.getElementById('result');

    var currentInput = '0';
    var previousInput = '';
    var operator = null;
    var shouldResetInput = false;
    var lastExpression = '';

    function updateDisplay() {
        resultEl.textContent = currentInput;
        expressionEl.textContent = lastExpression;

        if (currentInput.length > 12) {
            resultEl.classList.add('small');
        } else {
            resultEl.classList.remove('small');
        }
    }

    function inputDigit(digit) {
        if (shouldResetInput) {
            currentInput = digit;
            shouldResetInput = false;
        } else {
            currentInput = currentInput === '0' ? digit : currentInput + digit;
        }
    }

    function inputDecimal() {
        if (shouldResetInput) {
            currentInput = '0.';
            shouldResetInput = false;
            return;
        }
        if (currentInput.indexOf('.') === -1) {
            currentInput = currentInput + '.';
        }
    }

    function formatNumber(num) {
        if (Number.isNaN(num) || !Number.isFinite(num)) {
            return 'Ошибка';
        }
        var str = String(num);
        if (str.length > 15) {
            return parseFloat(num.toPrecision(10)).toString();
        }
        return str;
    }

    function calculate(a, op, b) {
        var left = parseFloat(a);
        var right = parseFloat(b);

        switch (op) {
            case 'add':
                return left + right;
            case 'subtract':
                return left - right;
            case 'multiply':
                return left * right;
            case 'divide':
                if (right === 0) return NaN;
                return left / right;
            default:
                return right;
        }
    }

    function getOperatorSymbol(op) {
        switch (op) {
            case 'add': return '+';
            case 'subtract': return '−';
            case 'multiply': return '×';
            case 'divide': return '÷';
            default: return '';
        }
    }

    function handleOperator(nextOperator) {
        var inputValue = currentInput;

        if (operator && !shouldResetInput) {
            var result = calculate(previousInput, operator, inputValue);
            currentInput = formatNumber(result);
            previousInput = currentInput;
            lastExpression = previousInput + ' ' + getOperatorSymbol(nextOperator);
        } else {
            previousInput = inputValue;
            lastExpression = inputValue + ' ' + getOperatorSymbol(nextOperator);
        }

        operator = nextOperator;
        shouldResetInput = true;
    }

    function handleEquals() {
        if (!operator) return;

        var inputValue = currentInput;
        lastExpression = previousInput + ' ' + getOperatorSymbol(operator) + ' ' + inputValue + ' =';
        var result = calculate(previousInput, operator, inputValue);
        currentInput = formatNumber(result);
        previousInput = '';
        operator = null;
        shouldResetInput = true;
    }

    function handleClear() {
        currentInput = '0';
        previousInput = '';
        operator = null;
        shouldResetInput = false;
        lastExpression = '';
    }

    function handleBackspace() {
        if (shouldResetInput) return;
        currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
    }

    function handlePercent() {
        var value = parseFloat(currentInput);
        currentInput = formatNumber(value / 100);
    }

    function handleAction(action) {
        switch (action) {
            case '0': case '1': case '2': case '3': case '4':
            case '5': case '6': case '7': case '8': case '9':
                inputDigit(action);
                break;
            case 'decimal':
                inputDecimal();
                break;
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
                handleOperator(action);
                break;
            case 'equals':
                handleEquals();
                break;
            case 'clear':
                handleClear();
                break;
            case 'backspace':
                handleBackspace();
                break;
            case 'percent':
                handlePercent();
                break;
        }
        updateDisplay();
    }

    // Button click handlers
    var buttons = document.querySelectorAll('.btn[data-action]');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function () {
            handleAction(this.getAttribute('data-action'));
        });
    }

    // Keyboard support
    document.addEventListener('keydown', function (e) {
        var key = e.key;
        if (key >= '0' && key <= '9') {
            handleAction(key);
        } else if (key === '.') {
            handleAction('decimal');
        } else if (key === '+') {
            handleAction('add');
        } else if (key === '-') {
            handleAction('subtract');
        } else if (key === '*') {
            handleAction('multiply');
        } else if (key === '/') {
            e.preventDefault();
            handleAction('divide');
        } else if (key === 'Enter' || key === '=') {
            handleAction('equals');
        } else if (key === 'Backspace') {
            handleAction('backspace');
        } else if (key === 'Escape') {
            handleAction('clear');
        }
    });

    updateDisplay();
})();

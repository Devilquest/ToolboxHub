import { switchTab, isAllowedKey, initCustomSteppers, showToast, confirmReset } from '../core.js';
import { APP_CONFIG } from '../config.js';
import { GlobalSettings } from '../utils/format-utils.js';

//=============================================
// Configuration
//=============================================

const DEFAULT_BRACKETS = APP_CONFIG.tools.taxCalculator.defaultBrackets;

//=============================================
// Tax Calculator Tool
//=============================================

/**
 * Advanced Tax Calculator with basic flat-rate and advanced progressive bracket modes.
 * Supports forward (gross→net) and reverse (net→gross) calculations.
 */
class TaxCalculator {
    constructor() {
        this.elements = {
            tabBasic: document.getElementById('taxTabBasic'),
            tabAdvanced: document.getElementById('taxTabAdvanced'),
            reverseToggle: document.getElementById('taxReverseToggle'),
            mainInputLabel: document.getElementById('taxMainInputLabel'),
            mainAmount: document.getElementById('taxMainAmount'),
            basicRateContainer: document.getElementById('taxBasicRateContainer'),
            basicRate: document.getElementById('taxBasicRate'),
            bracketsContainer: document.getElementById('taxBracketsContainer'),
            bracketsList: document.getElementById('taxBracketsList'),
            resTax: document.getElementById('taxResTax'),
            resMain: document.getElementById('taxResMain'),
            resResultLabel: document.getElementById('taxResResultLabel'),
            resEffective: document.getElementById('taxResEffective'),
            breakdownContainer: document.getElementById('taxBreakdownContainer'),
            breakdownList: document.getElementById('taxBreakdownList'),
            resetBracketsBtn: document.getElementById('taxResetBrackets'),
            addBracketBtn: document.getElementById('taxAddBracket'),
            breakdownDivider: document.getElementById('taxBreakdownDivider'),
            collapseHeader: document.getElementById('taxCollapseHeader'),
            collapseStatusText: document.getElementById('taxCollapseStatus'),
            examplesContainer: document.getElementById('taxUsageExamplesContainer')
        };

        this.isCollapsed = true;

        this.state = {
            mode: 'basic',
            reverse: false,
            inputs: { amount: 0, basicRate: APP_CONFIG.tools.taxCalculator.defaultRate },

            brackets: JSON.parse(JSON.stringify(DEFAULT_BRACKETS)).map(b => ({
                ...b,
                max: b.max === null ? Infinity : b.max
            }))
        };

        this.loadState();
        this.setupListeners();

        const basicContainer = document.getElementById('taxBasicRateContainer');
        const mainInputContainer = this.elements.mainAmount.closest('.tax-main-input') || this.elements.mainAmount.parentElement;

        if (mainInputContainer) {
            initCustomSteppers(mainInputContainer, () => this.calculate(true));
        }

        if (basicContainer) {
            initCustomSteppers(basicContainer, () => this.calculate(true));
        }

        this.updateButtonStates();
        this.render();
        GlobalSettings.subscribe(() => this.render());
    }

    /**
     * Loads saved tool state from localStorage.
     */
    loadState() {
        try {
            if (!GlobalSettings.canSaveData('tax-calculator')) return;

            const tool = APP_CONFIG.tools.list.find(t => t.id === 'tax-calculator');
            const saved = tool ? localStorage.getItem(tool.storageKey) : null;
            if (!saved) return;

            const parsed = JSON.parse(saved);
            this.state.mode = parsed.mode || 'basic';
            this.state.reverse = parsed.reverse || false;
            if (parsed.inputs) this.state.inputs = { ...this.state.inputs, ...parsed.inputs };
            if (parsed.brackets && Array.isArray(parsed.brackets)) {
                this.state.brackets = parsed.brackets.map(b => ({
                    ...b,
                    max: b.max === null ? Infinity : b.max
                }));
            }
        } catch (e) {
            console.error('Failed to load tax calculator state:', e);
        }
    }

    /**
     * Persists current tool state to localStorage.
     */
    saveState() {
        try {
            if (!GlobalSettings.canSaveData('tax-calculator')) return;

            const { amount, ...otherInputs } = this.state.inputs;
            const stateToSave = { ...this.state, inputs: otherInputs };

            const tool = APP_CONFIG.tools.list.find(t => t.id === 'tax-calculator');
            if (tool) {
                localStorage.setItem(tool.storageKey, JSON.stringify(stateToSave));
            }
        } catch (e) {
            console.error('Failed to save tax calculator state:', e);
        }
    }

    /**
     * Attaches event listeners to the calculator UI elements.
     */
    setupListeners() {
        this.elements.tabBasic.addEventListener('click', () => this.setMode('basic'));
        this.elements.tabAdvanced.addEventListener('click', () => this.setMode('advanced'));
        this.elements.reverseToggle.addEventListener('change', () => this.toggleReverse());
        this.elements.collapseHeader.addEventListener('click', (e) => {
            if (e.target.closest('#taxResetBrackets')) return;
            this.toggleCollapse();
        });

        [this.elements.mainAmount, this.elements.basicRate].forEach(input => {
            if (!input) return;

            input.addEventListener('blur', () => this.calculate(true));

            input.addEventListener("keydown", (event) => {
                if (!isAllowedKey(event, input, { allowNegative: false, allowComma: true })) {
                    event.preventDefault();
                }
            });

            input.addEventListener("input", () => {
                input.value = GlobalSettings.sanitizeInput(input.value, 2);
                this.handleInput();
            });
        });

        this.elements.resetBracketsBtn.addEventListener('click', () => this.handleResetBrackets());
        this.elements.addBracketBtn.addEventListener('click', () => this.addBracket());
    }

    /**
     * Switches between basic and advanced calculation modes.
     * @param {'basic'|'advanced'} mode 
     */
    setMode(mode) {
        this.state.mode = mode;
        this.render();
        this.calculate();
        this.saveState();
    }

    /**
     * Toggles the expansion state of the brackets editor.
     */
    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        this.updateCollapseUI();
    }

    /**
     * Updates the UI visibility of the brackets editor based on collapse state.
     */
    updateCollapseUI() {
        const isCollapsed = this.isCollapsed;
        this.elements.bracketsContainer.classList.toggle('collapsed', isCollapsed);
        if (this.elements.collapseStatusText) {
            this.elements.collapseStatusText.innerText = isCollapsed ? 'Click to Edit' : 'Click to Collapse';
        }
    }

    /**
     * Switches between gross-to-net and net-to-gross calculation.
     */
    toggleReverse() {
        this.state.reverse = !this.state.reverse;
        this.render();
        this.calculate();
        this.saveState();
    }

    /**
     * Handles changes to the main amount or flat rate inputs.
     */
    handleInput() {
        const amount = GlobalSettings.parseInput(this.elements.mainAmount.value);
        const basicRate = GlobalSettings.parseInput(this.elements.basicRate?.value || 0);

        this.state.inputs.amount = isNaN(amount) ? 0 : amount;
        this.state.inputs.basicRate = isNaN(basicRate) ? 0 : basicRate;

        this.calculate();
        this.saveState();
    }

    /**
     * Handles changes to individual bracket values.
     * @param {number} index - Index of the bracket being changed.
     * @param {'min'|'max'|'rate'} field - The property to update.
     * @param {string} value - The new value from the input.
     */
    handleBracketChange(index, field, value) {
        const val = GlobalSettings.parseInput(value);
        if (field === 'max' && value === '') return;

        const parsedVal = isNaN(val) ? 0 : val;
        this.state.brackets[index][field] = parsedVal;

        if (field === 'max' && index < this.state.brackets.length - 1) {
            this.state.brackets[index + 1].min = parsedVal;
            const nextMinInput = document.getElementById(`taxBracketMin-${index + 1}`);
            if (nextMinInput) nextMinInput.value = GlobalSettings.formatNumber(parsedVal, 0, false);
        } else if (field === 'min' && index > 0) {
            this.state.brackets[index - 1].max = parsedVal;
            const prevMaxInput = document.getElementById(`taxBracketMax-${index - 1}`);
            if (prevMaxInput) prevMaxInput.value = GlobalSettings.formatNumber(parsedVal, 0, false);
        }

        this.calculate(false);
        this.saveState();
    }

    /**
     * Adds a new tax bracket to the list.
     */
    addBracket() {
        if (this.state.brackets.length > 0) {
            const lastParams = this.state.brackets[this.state.brackets.length - 1];
            const prevMax = lastParams.min + APP_CONFIG.tools.taxCalculator.bracketIncrement;
            const newBracket = { min: lastParams.min, max: prevMax, rate: lastParams.rate };

            lastParams.min = prevMax;
            this.state.brackets.splice(this.state.brackets.length - 1, 0, newBracket);
        } else {
            this.state.brackets.push({ min: 0, max: Infinity, rate: 20 });
        }

        this.renderBrackets();
        this.calculate();
        this.saveState();
    }

    /**
     * Removes a tax bracket from the list.
     * @param {number} index - Index of the bracket to remove.
     */
    removeBracket(index) {
        if (this.state.brackets.length <= 1) return;

        if (index === this.state.brackets.length - 1) {
            this.state.brackets.pop();
            this.state.brackets[this.state.brackets.length - 1].max = Infinity;
        } else {
            this.state.brackets.splice(index, 1);
            if (index === 0) {
                this.state.brackets[0].min = 0;
            } else {
                this.state.brackets[index].min = this.state.brackets[index - 1].max;
            }
        }

        this.renderBrackets();
        this.calculate();
        this.saveState();
    }

    /**
     * Handles the reset request for tax brackets.
     * @async
     */
    async handleResetBrackets() {
        if (await confirmReset('Tax Brackets', 'Are you sure you want to reset the tax brackets to their default values?\n\nThis action cannot be undone.')) {
            this.resetBrackets();
            showToast('Tax Calculator brackets have been reset.', 'info');
        }
    }

    /**
     * Updates the enabled/disabled state of the reset button based on state purity.
     */
    updateButtonStates() {
        const defaultBrackets = DEFAULT_BRACKETS.map(b => ({
            ...b,
            max: b.max === null ? Infinity : b.max
        }));
        const isDirty = JSON.stringify(this.state.brackets) !== JSON.stringify(defaultBrackets);
        if (this.elements.resetBracketsBtn) {
            this.elements.resetBracketsBtn.disabled = !isDirty;
        }
    }

    /**
     * Resets brackets to default configuration.
     */
    resetBrackets() {
        this.state.brackets = JSON.parse(JSON.stringify(DEFAULT_BRACKETS)).map(b => ({
            ...b,
            max: b.max === null ? Infinity : b.max
        }));
        this.renderBrackets();
        this.calculate();
        this.saveState();
        this.updateButtonStates();
    }

    /**
     * Validates the integrity of the tax bracket sequence.
     * @returns {Object} Validation result {valid: boolean, msg: string}
     */
    validateBrackets() {
        const brackets = this.state.brackets;
        if (!brackets || brackets.length === 0) return { valid: false, msg: 'No brackets defined.' };
        if (brackets[0].min !== 0) return { valid: false, msg: 'First bracket must start at 0.' };

        for (let i = 0; i < brackets.length; i++) {
            const b = brackets[i];
            if (b.rate < 0 || b.rate > 100) return { valid: false, msg: `Rate at bracket ${i + 1} must be between 0 and 100.` };
            if (b.min < 0) return { valid: false, msg: `Lower bound at bracket ${i + 1} cannot be negative.` };

            if (i < brackets.length - 1) {
                if (b.max <= b.min) return { valid: false, msg: `Bracket ${i + 1}: Max must be greater than Min.` };
                const next = brackets[i + 1];
                if (b.max !== next.min) return { valid: false, msg: `Gap or overlap between bracket ${i + 1} and ${i + 2}.` };
            } else {
                if (b.max !== Infinity) return { valid: false, msg: 'Last bracket must have no upper limit (Infinite).' };
            }
        }

        return { valid: true };
    }

    /**
     * Formats a number as a currency string using global settings.
     * @param {number} num - The number to format.
     * @returns {string} The formatted currency string.
     */
    formatMoney(num) {
        return GlobalSettings.formatMoney(num);
    }

    /**
     * Performs the tax calculation based on current state.
     * @param {boolean} [showError=false] - Whether to show validation error toasts.
     */
    calculate(showError = false) {
        const { mode, reverse, inputs, brackets } = this.state;
        const validation = this.validateBrackets();

        if (mode === 'advanced') {
            if (!validation.valid) {
                if (showError) {
                    if (this.state.lastError !== validation.msg) {
                        showToast(validation.msg, 'error');
                        this.state.lastError = validation.msg;
                    }
                    this.clearResults();
                }
                return;
            } else {
                this.state.lastError = null;
            }
        }

        this.updateButtonStates();

        const amount = inputs.amount;
        if (!amount && amount !== 0) {
            this.clearResults();
            return;
        }

        let result;

        if (mode === 'basic') {
            const rate = inputs.basicRate;
            if (reverse) {
                const gross = (1 - (rate / 100)) === 0 ? 0 : amount / (1 - (rate / 100));
                const tax = gross - amount;
                result = { gross, net: amount, tax, breakdown: [{ label: 'Flat Rate', rate, tax, amount: gross }] };
            } else {
                const tax = amount * (rate / 100);
                const net = amount - tax;
                result = { gross: amount, net, tax, breakdown: [{ label: 'Flat Rate', rate, tax, amount }] };
            }
        } else {
            result = reverse
                ? this.calculateAdvancedReverse(amount, brackets)
                : this.calculateAdvancedForward(amount, brackets);
        }

        this.displayResults(result);
    }

    /**
     * Calculates progressive tax for forward mode (gross to net).
     * @param {number} gross
     * @param {Object[]} brackets
     * @returns {Object} { gross, net, tax, breakdown }
     */
    calculateAdvancedForward(gross, brackets) {
        let totalTax = 0;
        const breakdown = [];

        for (const b of brackets) {
            if (gross > b.min) {
                const taxableInBracket = Math.min(gross, b.max) - b.min;
                const taxInBracket = taxableInBracket * (b.rate / 100);
                totalTax += taxInBracket;
                breakdown.push({
                    label: `${this.formatMoney(b.min)} – ${b.max === Infinity ? '∞' : this.formatMoney(b.max)}`,
                    rate: b.rate,
                    base: taxableInBracket,
                    tax: taxInBracket
                });
            }
        }

        return { gross, net: gross - totalTax, tax: totalTax, breakdown };
    }

    /**
     * Calculates progressive tax for reverse mode (net to gross).
     * @param {number} targetNet
     * @param {Object[]} brackets
     * @returns {Object} { gross, net, tax, breakdown }
     */
    calculateAdvancedReverse(targetNet, brackets) {
        let remainingNet = targetNet;
        let totalGross = 0;
        let totalTax = 0;
        const breakdown = [];

        for (let i = 0; i < brackets.length; i++) {
            const b = brackets[i];
            const rateDec = b.rate / 100;
            const factor = 1 - rateDec;
            const bracketGrossCapacity = b.max === Infinity ? Infinity : (b.max - b.min);
            const bracketNetCapacity = bracketGrossCapacity === Infinity ? Infinity : bracketGrossCapacity * factor;

            let netInBracket = 0;
            let grossInBracket = 0;

            if (remainingNet <= bracketNetCapacity) {
                grossInBracket = factor === 0 ? 0 : remainingNet / factor;
                netInBracket = remainingNet;
                remainingNet = 0;
            } else {
                grossInBracket = bracketGrossCapacity;
                netInBracket = bracketNetCapacity;
                remainingNet -= bracketNetCapacity;
            }

            const taxInBracket = grossInBracket * rateDec;
            totalGross += grossInBracket;
            totalTax += taxInBracket;

            if (grossInBracket > 0) {
                breakdown.push({
                    label: `${this.formatMoney(b.min)} – ${b.max === Infinity ? '∞' : this.formatMoney(b.max)}`,
                    rate: b.rate,
                    base: grossInBracket,
                    tax: taxInBracket
                });
            }

            if (remainingNet <= 0.000001) break;
        }

        return { gross: totalGross, net: targetNet, tax: totalTax, breakdown };
    }

//=============================================
// Result Updates & Rendering
//=============================================

    /**
     * Resets the result UI to zeroed values.
     */
    clearResults() {
        this.elements.resTax.innerText = GlobalSettings.formatMoney(0);
        this.elements.resMain.innerText = GlobalSettings.formatMoney(0);
        this.elements.resEffective.innerText = 'Effective Rate: 0.00%';
        this.elements.breakdownContainer.classList.add('hidden');
        if (this.elements.breakdownDivider) this.elements.breakdownDivider.classList.add('hidden');
    }

    /**
     * Updates the UI with calculation results.
     * @param {Object} data - Result object from calculation.
     */
    displayResults(data) {
        this.elements.resTax.innerText = this.formatMoney(data.tax);

        if (this.state.reverse) {
            this.elements.resResultLabel.innerText = 'Required Gross Amount';
            this.elements.resMain.innerText = this.formatMoney(data.gross);
        } else {
            this.elements.resResultLabel.innerText = 'Net Amount';
            this.elements.resMain.innerText = this.formatMoney(data.net);
        }

        const effective = data.gross > 0 ? (data.tax / data.gross) * 100 : 0;
        let effectiveText = `Effective Rate: ${effective.toFixed(2)}%`;

        if (this.state.reverse && data.net > 0) {
            const markup = (data.tax / data.net) * 100;
            effectiveText += ` (Increase: ${markup.toFixed(2)}%)`;
        }

        this.elements.resEffective.innerText = effectiveText;

        const list = this.elements.breakdownList;
        list.innerHTML = '';

        if (data.breakdown.length > 0 && this.state.mode === 'advanced') {
            this.elements.breakdownContainer.classList.remove('hidden');
            if (this.elements.breakdownDivider) this.elements.breakdownDivider.classList.remove('hidden');
            data.breakdown.forEach(item => {
                const row = document.createElement('div');
                row.className = 'data-row';
                row.innerHTML = `
                    <div class="tax-breakdown-label">
                        <span>${item.label}</span>
                        <span class="app-badge app-badge-small app-badge-primary">${item.rate}%</span>
                    </div>
                    <div class="data-row-value">
                        <div>${this.formatMoney(item.tax)}</div>
                        <div class="tax-breakdown-base">on ${this.formatMoney(item.base)}</div>
                    </div>
                `;
                list.appendChild(row);
            });
        } else {
            this.elements.breakdownContainer.classList.add('hidden');
            if (this.elements.breakdownDivider) this.elements.breakdownDivider.classList.add('hidden');
        }
    }

    /**
     * Renders the main calculator interface.
     */
    render() {
        const isBasic = this.state.mode === 'basic';
        this.updateCollapseUI();
        this.renderExamples();

        if (isBasic) {
            switchTab('tax-basic');
            this.elements.basicRateContainer.classList.remove('hidden');
            this.elements.bracketsContainer.classList.add('hidden');
        } else {
            switchTab('tax-advanced');
            this.elements.basicRateContainer.classList.add('hidden');
            this.elements.bracketsContainer.classList.remove('hidden');
            this.renderBrackets();
        }

        this.elements.mainInputLabel.innerText = this.state.reverse
            ? `Desired Net Amount (${GlobalSettings.getCurrency().symbol})`
            : `Gross Amount (${GlobalSettings.getCurrency().symbol})`;

        this.elements.mainAmount.value = GlobalSettings.sanitizeInput(this.state.inputs.amount?.toString() || '', 2);
        this.elements.basicRate.value = GlobalSettings.sanitizeInput(this.state.inputs.basicRate?.toString() || '', 2);
        this.elements.reverseToggle.checked = this.state.reverse;

        this.calculate();
    }

    /**
     * Renders the brackets editor rows.
     */
    renderBrackets() {
        const list = this.elements.bracketsList;
        list.innerHTML = '';

        this.state.brackets.forEach((b, idx) => {
            const isLast = idx === this.state.brackets.length - 1;
            const el = document.createElement('div');
            el.className = 'bracket-row';

            el.innerHTML = `
                <div class="stack-xs">
                    <label>From (${GlobalSettings.getCurrency().symbol})</label>
                    <div class="numeric-input-wrapper">
                        <input type="text" id="taxBracketMin-${idx}" class="input-field input-small disabled-readonly" disabled value="${GlobalSettings.sanitizeInput(b.min.toString(), 2)}" data-idx="${idx}" data-field="min">
                    </div>
                </div>
                <div class="stack-xs">
                    <label>To (${GlobalSettings.getCurrency().symbol})</label>
                    <div class="numeric-input-wrapper">
                        <input type="text" id="taxBracketMax-${idx}" class="input-field input-small ${isLast ? 'disabled-readonly' : ''}" ${isLast ? 'disabled' : ''} value="${b.max === Infinity ? '' : GlobalSettings.sanitizeInput(b.max.toString(), 2)}" placeholder="${b.max === Infinity ? '∞' : ''}" data-idx="${idx}" data-field="max" step="any">
                        ${isLast ? '' : `
                        <div class="input-step-controls">
                            <button type="button" class="input-step-btn up" data-id="taxBracketMax-${idx}" aria-label="Increase">
                                <app-icon name="chevron-up"></app-icon>
                            </button>
                            <button type="button" class="input-step-btn down" data-id="taxBracketMax-${idx}" aria-label="Decrease">
                                <app-icon name="chevron-down"></app-icon>
                            </button>
                        </div>
                        `}
                    </div>
                </div>
                <div class="stack-xs bracket-rate">
                    <label>Rate (%)</label>
                    <div class="numeric-input-wrapper">
                        <input type="text" id="taxBracketRate-${idx}" class="input-field input-small" value="${GlobalSettings.sanitizeInput(b.rate.toString(), 2)}" data-idx="${idx}" data-field="rate" step="any">
                        <div class="input-step-controls">
                            <button type="button" class="input-step-btn up" data-id="taxBracketRate-${idx}" aria-label="Increase">
                                <app-icon name="chevron-up"></app-icon>
                            </button>
                            <button type="button" class="input-step-btn down" data-id="taxBracketRate-${idx}" aria-label="Decrease">
                                <app-icon name="chevron-down"></app-icon>
                            </button>
                        </div>
                    </div>
                </div>
                <button type="button" class="btn-clear ${this.state.brackets.length <= 1 ? 'disabled' : ''}" data-remove="${idx}" aria-label="Remove bracket">✕</button>
            `;

            el.querySelectorAll('input').forEach(input => {
                input.addEventListener('blur', () => this.calculate(true));

                input.addEventListener("keydown", (event) => {
                    if (!isAllowedKey(event, input, { allowNegative: false, allowComma: true })) {
                        event.preventDefault();
                    }
                });

                input.addEventListener("input", () => {
                    input.value = GlobalSettings.sanitizeInput(input.value, 2);
                    this.handleBracketChange(
                        parseInt(input.dataset.idx),
                        input.dataset.field,
                        input.value
                    );
                });
            });

            const removeBtn = el.querySelector('[data-remove]');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    this.removeBracket(parseInt(removeBtn.dataset.remove));
                });
            }

            list.appendChild(el);
            initCustomSteppers(el, () => this.calculate(true));
        });
    }

    /**
     * Renders educational usage examples.
     */
    renderExamples() {
        if (!this.elements.examplesContainer) return;

        const fn = (v) => GlobalSettings.formatNumber(v, 2, true);
        const fm = (v) => GlobalSettings.formatMoney(v, 2);

        const revGross = 50000 / (1 - 0.21);
        const revTax = revGross - 50000;

        this.elements.examplesContainer.innerHTML = `
            <div class="content-box content-box-example">
                <strong>Basic (Forward):</strong> Gross = ${fm(50000)}, Rate = 21%
                <div class="example-solution stack-xs mt-sm">
                    <div>Tax = ${fn(50000)} · (21 / 100) = <strong>${fm(10500)}</strong></div>
                    <div>Net = ${fn(50000)} - ${fn(10500)} = <strong>${fm(39500)}</strong></div>
                </div>
            </div>
            <div class="content-box content-box-example">
                <strong>Basic (Reverse):</strong> Desired Net = ${fm(50000)}, Rate = 21%
                <div class="example-solution stack-xs mt-sm">
                    <div>Gross = ${fn(50000)} / (1 - (21 / 100)) = <strong>${fm(revGross)}</strong></div>
                    <div>Tax = ${fn(revGross)} - ${fn(50000)} = <strong>${fm(revTax)}</strong></div>
                    <div>Net = ${fn(revGross)} - ${fn(revTax)} = <strong>${fm(50000)}</strong></div>
                </div>
            </div>
            <div class="content-box content-box-example">
                <strong>Progressive (Forward):</strong> Gross = ${fm(60000)} with brackets: 0-6k@21%, 6k-50k@25%, 50k+@30%
                <div class="example-solution stack-xs mt-sm">
                    <div>${fn(6000)} · (21 / 100) = ${fm(1260)}</div>
                    <div>${fn(44000)} · (25 / 100) = ${fm(11000)}</div>
                    <div>${fn(10000)} · (30 / 100) = ${fm(3000)}</div>
                    <div>Total Tax = <strong>${fm(15260)}</strong></div>
                    <div>Net = ${fn(60000)} - ${fn(15260)} = <strong>${fm(44740)}</strong></div>
                </div>
            </div>
            <div class="content-box content-box-example">
                <strong>Progressive (Reverse):</strong> Desired Net = ${fm(60000)} with brackets: 0-6k@21%, 6k-50k@25%, 50k+@30%
                <div class="example-solution stack-xs mt-sm">
                    <div>Net (0-6k) = ${fn(6000)} - (${fn(6000)} · (21 / 100)) = ${fm(4740)}</div>
                    <div>Net (6k-50k) = ${fn(44000)} - (${fn(44000)} · (25 / 100)) = ${fm(33000)}</div>
                    <div>Remaining Net = ${fn(60000)} - (${fm(4740)} + ${fm(33000)}) = ${fm(22260)}</div>
                    <div>Gross (50k+) = ${fn(22260)} / (1 - (30 / 100)) = ${fm(31800)}</div>
                    <div>Total Gross = ${fn(50000)} (B1+B2) + ${fn(31800)} = <strong>${fm(81800)}</strong></div>
                </div>
            </div>
        `;
    }

    /**
     * Cleans up tool resources.
     */
    destroy() {
    }
}

export default TaxCalculator;

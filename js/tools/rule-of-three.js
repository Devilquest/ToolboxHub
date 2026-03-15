import { isAllowedKey, initCustomSteppers } from '../core.js';
import { GlobalSettings } from '../utils/format-utils.js';

//=============================================
// Configuration
//=============================================

const TEXTS = {
    formula: 'X = (B · C) / A',
    emptyResult: 'X'
};

//=============================================
// Rule of Three Calculator Tool
//=============================================

/**
 * Calculates mathematical proportions and direct rules of three.
 */
class RuleCalculator {
    constructor() {
        this.elements = {
            valueA: document.getElementById('valueA'),
            valueB: document.getElementById('valueB'),
            valueC: document.getElementById('valueC'),
            result: document.getElementById('result'),
            liveFormula: document.getElementById('liveFormula'),
            clearAllBtn: document.getElementById('clearAllBtn')
        };

        this.valueInputIds = ['valueA', 'valueB', 'valueC'];
        this.setupListeners();
        initCustomSteppers(document.getElementById('app'));
        GlobalSettings.subscribe(() => {
            this.valueInputIds.forEach(id => {
                if (this.elements[id].value !== '') {
                    this.elements[id].value = GlobalSettings.sanitizeInput(this.elements[id].value);
                }
            });
            this.calculateRule();
        });
    }

    /**
     * Performs the rule of three calculation based on current input values.
     */
    calculateRule() {
        const rawA = this.elements.valueA.value.trim();
        const rawB = this.elements.valueB.value.trim();
        const rawC = this.elements.valueC.value.trim();

        const valueA = GlobalSettings.parseInput(rawA);
        const valueB = GlobalSettings.parseInput(rawB);
        const valueC = GlobalSettings.parseInput(rawC);

        const hasContent = this.valueInputIds.some(id => this.elements[id].value !== '');
        this.elements.clearAllBtn.disabled = !hasContent;

        const display = (parsed, raw, letter) => (!isNaN(parsed) && raw !== '') ? raw : letter;
        this.elements.liveFormula.innerText = `X = (${display(valueB, rawB, "B")} · ${display(valueC, rawC, "C")}) / ${display(valueA, rawA, "A")}`;

        if (isNaN(valueA) || isNaN(valueB) || isNaN(valueC) || valueA === 0) {
            this.elements.result.textContent = TEXTS.emptyResult;
            return;
        }

        const result = (valueB * valueC) / valueA;

        let formattedResult;
        if (Number.isInteger(result) || Math.abs(result) >= 0.01) {
            const decPlaces = Number.isInteger(result) ? 0 : 5;
            formattedResult = GlobalSettings.formatNumber(result, decPlaces, false);
            const format = GlobalSettings.getFormat();
            if (formattedResult.includes(format.dec)) {
                formattedResult = formattedResult.replace(/0+$/, '').replace(new RegExp(`\\${format.dec}$`), '');
            }
        } else {
            formattedResult = result.toExponential(2);
        }

        this.elements.result.textContent = formattedResult;
    }

    /**
     * Clears all inputs and resets the calculator state.
     */
    clearAll() {
        if (!this.elements.clearAllBtn.disabled) {
            this.valueInputIds.forEach(id => {
                this.elements[id].value = '';
            });
            this.elements.result.textContent = TEXTS.emptyResult;
            this.elements.clearAllBtn.disabled = true;

            this.elements.liveFormula.innerText = TEXTS.formula;
        }
    }

    /**
     * Attaches event listeners to input fields and buttons.
     */
    setupListeners() {
        this.elements.result.textContent = TEXTS.emptyResult;
        this.elements.liveFormula.innerText = TEXTS.formula;

        this.valueInputIds.forEach(id => {
            const element = this.elements[id];
            if (!element) return;

            element.addEventListener("keydown", (event) => {
                if (!isAllowedKey(event, element, { allowNegative: true, allowComma: true })) {
                    event.preventDefault();
                }
            });

            element.addEventListener("input", () => {
                element.value = GlobalSettings.sanitizeInput(element.value);
                this.calculateRule();
            });

            ['keyup', 'change'].forEach(eventType => {
                element.addEventListener(eventType, () => this.calculateRule());
            });

            element.addEventListener('paste', () => setTimeout(() => {
                element.value = GlobalSettings.sanitizeInput(element.value);
                this.calculateRule();
            }, 10));
        });

        this.elements.clearAllBtn.addEventListener('click', () => this.clearAll());

        this.valueInputIds.forEach(id => {
            this.elements[id].value = "";
        });
        this.elements.clearAllBtn.disabled = true;
    }
}

export default RuleCalculator;

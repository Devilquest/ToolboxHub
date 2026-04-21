import { isAllowedKey, initCustomSteppers } from '../core.js';
import { GlobalSettings } from '../utils/format-utils.js';
import { APP_CONFIG } from '../config.js';

//=============================================
// Aspect Ratio Calculator Tool
//=============================================

/**
 * Calculator for resizing layout and estimating dimensions keeping the aspect ratio.
 */
class AspectRatioCalculator {
    constructor() {
        this.elements = {
            arPreset: document.getElementById('arPreset'),
            arWidth: document.getElementById('arWidth'),
            arHeight: document.getElementById('arHeight'),
            widthInput: document.getElementById('widthInput'),
            heightInput: document.getElementById('heightInput'),
            clearAspectBtn: document.getElementById('clearAspectBtn'),
            clearDimensionsBtn: document.getElementById('clearDimensionsBtn'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            calculateRatioBtn: document.getElementById('calculateRatioBtn'),
            scaleMultiply: document.getElementById('scaleMultiply'),
            scaleDivide: document.getElementById('scaleDivide')
        };

        this.lastEdited = null;
        this.arInputIds = ['arWidth', 'arHeight'];
        this.dimensionInputIds = ['widthInput', 'heightInput'];

        this.state = {
            inputs: { arWidth: '', arHeight: '', widthInput: '', heightInput: '', arPreset: '' }
        };

        this.loadState();
        this.setupListeners();

        initCustomSteppers(document.getElementById('app'), (inputId) => {
            if (this.dimensionInputIds.includes(inputId)) {
                this.lastEdited = inputId === 'widthInput' ? 'width' : 'height';
            }
        });

        GlobalSettings.subscribe(() => {
            [...this.arInputIds, ...this.dimensionInputIds].forEach(id => {
                const el = this.elements[id];
                if (el && el.value !== '') {
                    el.value = GlobalSettings.sanitizeInput(el.value);
                }
            });
            this.calculateDimensions();
        });
    }

    /**
     * Loads saved tool state from localStorage.
     */
    loadState() {
        try {
            if (!GlobalSettings.canSaveData('aspect-ratio')) return;
            const tool = APP_CONFIG.tools.list.find(t => t.id === 'aspect-ratio');
            const saved = tool ? localStorage.getItem(tool.storageKey) : null;
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.inputs) this.state.inputs = { ...this.state.inputs, ...parsed.inputs };
                this.lastEdited = parsed.lastEdited || null;
            }
        } catch (e) {
            console.error('Failed to load aspect ratio state:', e);
        }
    }

    /**
     * Persists current tool state to localStorage.
     */
    saveState() {
        try {
            if (!GlobalSettings.canSaveData('aspect-ratio')) return;
            this.state.inputs.arWidth = this.elements.arWidth.value;
            this.state.inputs.arHeight = this.elements.arHeight.value;
            this.state.inputs.widthInput = this.elements.widthInput.value;
            this.state.inputs.heightInput = this.elements.heightInput.value;
            this.state.inputs.arPreset = this.elements.arPreset.value;
            this.state.lastEdited = this.lastEdited;

            const tool = APP_CONFIG.tools.list.find(t => t.id === 'aspect-ratio');
            if (tool) localStorage.setItem(tool.storageKey, JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save aspect ratio state:', e);
        }
    }

    /**
     * Calculates width or height based on the current aspect ratio and the other dimension.
     */
    calculateDimensions() {
        const arW = GlobalSettings.parseInput(this.elements.arWidth.value.trim());
        const arH = GlobalSettings.parseInput(this.elements.arHeight.value.trim());
        let width = GlobalSettings.parseInput(this.elements.widthInput.value.trim());
        let height = GlobalSettings.parseInput(this.elements.heightInput.value.trim());

        const hasAspect = this.arInputIds.some(id => this.elements[id].value !== '');
        this.elements.clearAspectBtn.disabled = !hasAspect;

        const hasDimensions = this.dimensionInputIds.some(id => this.elements[id].value !== '');
        this.elements.clearDimensionsBtn.disabled = !hasDimensions;
        this.elements.clearAllBtn.disabled = !hasAspect || !hasDimensions;

        const canCalculateRatio = !isNaN(width) && width > 0 && !isNaN(height) && height > 0;
        this.elements.calculateRatioBtn.disabled = !canCalculateRatio;

        const widthValid = !isNaN(width) && width > 0;
        const heightValid = !isNaN(height) && height > 0;
        const canScale = widthValid || heightValid;
        this.elements.scaleMultiply.disabled = !canScale;
        this.elements.scaleDivide.disabled = !canScale;

        if (isNaN(arW) || isNaN(arH) || arW <= 0 || arH <= 0) {
            return;
        }

        if (this.lastEdited === 'width') {
            if (!isNaN(width) && width > 0) {
                height = width * (arH / arW);
                this.elements.heightInput.value = this.formatResult(height);
            }
        } else if (this.lastEdited === 'height') {
            if (!isNaN(height) && height > 0) {
                width = height * (arW / arH);
                this.elements.widthInput.value = this.formatResult(width);
            }
        }

        this.saveState();
    }

    /**
     * Infers the aspect ratio from the currently entered width and height.
     */
    calculateAspectRatio() {
        const width = GlobalSettings.parseInput(this.elements.widthInput.value.trim());
        const height = GlobalSettings.parseInput(this.elements.heightInput.value.trim());

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            return;
        }

        const commonDivisor = this._gcd(width, height);
        const ratioWidth = width / commonDivisor;
        const ratioHeight = height / commonDivisor;

        this.elements.arWidth.value = this.formatResult(ratioWidth);
        this.elements.arHeight.value = this.formatResult(ratioHeight);
        this.updatePresetSelection();

        this.calculateDimensions();
    }

    /**
     * Calculates the Greatest Common Divisor of two numbers.
     * @private
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    _gcd(a, b) {
        if (b === 0) {
            return a;
        }
        return this._gcd(b, a % b);
    }

    /**
     * Scales the active dimension by the given factor and recalculates.
     * @param {number} factor
     */
    scaleDimension(factor) {
        let field = this.lastEdited || 'width';
        let input = field === 'width' ? this.elements.widthInput : this.elements.heightInput;
        let value = GlobalSettings.parseInput(input.value.trim());

        if (isNaN(value) || value <= 0) {
            field = field === 'width' ? 'height' : 'width';
            input = field === 'width' ? this.elements.widthInput : this.elements.heightInput;
            value = GlobalSettings.parseInput(input.value.trim());
        }

        if (isNaN(value) || value <= 0) return;

        input.value = this.formatResult(value * factor);
        this.lastEdited = field;
        this.calculateDimensions();
    }

    /**
     * Formats numeric results for display based on global settings.
     * @param {number} value
     * @returns {string}
     */
    formatResult(value) {
        if (Number.isInteger(value)) {
            return GlobalSettings.formatNumber(value, 0, false);
        } else if (Math.abs(value) < 0.01) {
            return value.toExponential(2);
        } else {
            let res = GlobalSettings.formatNumber(value, 5, false);
            const format = GlobalSettings.getFormat();
            if (res.includes(format.dec)) {
                res = res.replace(/0+$/, '').replace(new RegExp(`\\${format.dec}$`), '');
            }
            return res;
        }
    }

    /**
     * Attempts to match current aspect ratio inputs to a predefined preset.
     */
    updatePresetSelection() {
        const arW = GlobalSettings.parseInput(this.elements.arWidth.value.trim());
        const arH = GlobalSettings.parseInput(this.elements.arHeight.value.trim());

        if (isNaN(arW) || isNaN(arH) || arW <= 0 || arH <= 0) {
            this.elements.arPreset.value = '';
            return;
        }

        const inputRatio = arW / arH;
        let matched = false;

        for (const option of this.elements.arPreset.options) {
            if (!option.value) continue;

            const [w, h] = option.value.split(':').map(Number);
            if (!isNaN(w) && !isNaN(h) && h !== 0) {
                const presetRatio = w / h;
                if (Math.abs(inputRatio - presetRatio) < 0.0001) {
                    this.elements.arPreset.value = option.value;
                    matched = true;
                    break;
                }
            }
        }

        if (!matched) {
            this.elements.arPreset.value = '';
        }
    }

    /**
     * Handles changes to the aspect ratio preset dropdown.
     */
    handlePresetChange() {
        const value = this.elements.arPreset.value;
        if (value) {
            const [w, h] = value.split(':');
            this.elements.arWidth.value = w;
            this.elements.arHeight.value = h;
            this.calculateDimensions();
        }
    }

    /**
     * Resets the aspect ratio input fields.
     */
    clearAspect() {
        if (!this.elements.clearAspectBtn.disabled) {
            this.arInputIds.forEach(id => {
                this.elements[id].value = '';
            });
            this.elements.arPreset.value = '';
            this.calculateDimensions();
        }
    }

    /**
     * Resets the dimension input fields.
     */
    clearDimensions() {
        if (!this.elements.clearDimensionsBtn.disabled) {
            this.dimensionInputIds.forEach(id => {
                this.elements[id].value = '';
            });
            this.calculateDimensions();
        }
    }

    /**
     * Resets all input fields in the tool.
     */
    clearAll() {
        if (!this.elements.clearAllBtn.disabled) {
            [...this.arInputIds, ...this.dimensionInputIds].forEach(id => {
                this.elements[id].value = '';
            });
            this.elements.arPreset.value = '';
            this.calculateDimensions();
        }
    }

    /**
     * Attaches event listeners to interactive elements.
     */
    setupListeners() {
        this.elements.arPreset.addEventListener('change', () => this.handlePresetChange());

        [...this.arInputIds, ...this.dimensionInputIds].forEach(id => {
            const element = this.elements[id];
            if (!element) return;

            const isDimensionInput = this.dimensionInputIds.includes(id);

            if (isDimensionInput) {
                element.addEventListener('focus', () => {
                    this.lastEdited = id === 'widthInput' ? 'width' : 'height';
                });
            }

            ['input', 'keyup', 'change'].forEach(eventType => {
                element.addEventListener(eventType, () => {
                    if (this.arInputIds.includes(id)) {
                        this.updatePresetSelection();
                    }
                    this.calculateDimensions();
                });
            });

            element.addEventListener('paste', () => setTimeout(() => this.calculateDimensions(), 10));

            element.addEventListener("keydown", (event) => {
                if (!isAllowedKey(event, element)) {
                    event.preventDefault();
                }
            });

            element.addEventListener("input", () => {
                element.value = GlobalSettings.sanitizeInput(element.value);
            });
        });

        this.elements.calculateRatioBtn.addEventListener('click', () => this.calculateAspectRatio());
        this.elements.clearAspectBtn.addEventListener('click', () => this.clearAspect());
        this.elements.clearDimensionsBtn.addEventListener('click', () => this.clearDimensions());
        this.elements.clearAllBtn.addEventListener('click', () => this.clearAll());
        this.elements.scaleMultiply.addEventListener('click', () => this.scaleDimension(2));
        this.elements.scaleDivide.addEventListener('click', () => this.scaleDimension(0.5));

        this.arInputIds.forEach(id => this.elements[id].value = this.state.inputs[id] || '');
        this.dimensionInputIds.forEach(id => this.elements[id].value = this.state.inputs[id] || '');
        
        if (this.state.inputs.arPreset) {
            this.elements.arPreset.value = this.state.inputs.arPreset;
        }

        this.updatePresetSelection();
        this.calculateDimensions();
    }
}

export default AspectRatioCalculator;

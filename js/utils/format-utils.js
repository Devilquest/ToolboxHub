import { APP_CONFIG } from '../config.js';

//=============================================
// Constants & State
//=============================================
export const CURRENCIES = APP_CONFIG.formats.currencies;
export const FORMAT_TYPES = APP_CONFIG.formats.numberFormats;

//=============================================
// Global Settings Manager
//=============================================

/**
 * Manages application-wide settings and persistence.
 */
class GlobalSettingsManager {
    constructor() {
        this.settings = {
            currency: APP_CONFIG.defaults.currency,
            numberFormat: APP_CONFIG.defaults.numberFormat,
            dataSaving: { 'tax-calculator': true },
            animateBackground: true
        };

        this.listeners = [];
        this.loadSettings();
    }

    /**
     * Loads settings from localStorage and validates them.
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('toolboxGlobalSettings');
            if (saved) {
                const parsed = JSON.parse(saved);

                if (parsed.currency && CURRENCIES[parsed.currency]) {
                    this.settings.currency = parsed.currency;
                } else {
                    this.settings.currency = APP_CONFIG.defaults.currency;
                }

                if (parsed.numberFormat && FORMAT_TYPES[parsed.numberFormat]) {
                    this.settings.numberFormat = parsed.numberFormat;
                } else {
                    this.settings.numberFormat = APP_CONFIG.defaults.numberFormat;
                }

                if (parsed.dataSaving) {
                    this.settings.dataSaving = parsed.dataSaving;
                }

                if (parsed.hasOwnProperty('animateBackground')) {
                    this.settings.animateBackground = parsed.animateBackground;
                }

                if (!CURRENCIES[parsed.currency] || !FORMAT_TYPES[parsed.numberFormat]) {
                    this.saveSettings();
                }
            }
        } catch (e) {
            console.error('Failed to load global settings', e);
        }
    }

    /**
     * Persists current settings to localStorage.
     */
    saveSettings() {
        try {
            localStorage.setItem('toolboxGlobalSettings', JSON.stringify(this.settings));
            this.notifyListeners();
        } catch (e) {
            console.error('Failed to save global settings', e);
        }
    }

    /**
     * Updates the global currency.
     * @param {string} currency - Currency code (e.g., 'USD').
     */
    setCurrency(currency) {
        if (CURRENCIES[currency]) {
            this.settings.currency = currency;
            this.saveSettings();
        }
    }

    /**
     * Updates the global number format.
     * @param {string} format - Format ID (e.g., 'DECIMAL_DOT').
     */
    setNumberFormat(format) {
        if (FORMAT_TYPES[format]) {
            this.settings.numberFormat = format;
            this.saveSettings();
        }
    }

    /**
     * Enables or disables the grid background animation.
     * @param {boolean} allow
     */
    setAnimateBackground(allow) {
        this.settings.animateBackground = allow;
        this.saveSettings();
        this.applyBackgroundAnimation();
    }

    /**
     * Applies the background animation state to the document.
     */
    applyBackgroundAnimation() {
        if (this.settings.animateBackground) {
            document.documentElement.classList.remove('static-bg');
        } else {
            document.documentElement.classList.add('static-bg');
        }
    }

    /**
     * Returns the current number format configuration.
     * @returns {Object}
     */
    getFormat() {
        return FORMAT_TYPES[this.settings.numberFormat];
    }

    /**
     * Returns the current currency configuration.
     * @returns {Object}
     */
    getCurrency() {
        return CURRENCIES[this.settings.currency];
    }

    /**
     * Checks if a tool is allowed to save data.
     * @param {string} toolId
     * @returns {boolean}
     */
    canSaveData(toolId) {
        if (toolId === 'home') return true;
        
        if (!this.settings.dataSaving) {
            this.settings.dataSaving = {};
        }
        return this.settings.dataSaving[toolId] !== false;
    }

    /**
     * Updates the data saving permission for a tool.
     * @param {string} toolId
     * @param {boolean} allow
     */
    setSaveData(toolId, allow) {
        if (!this.settings.dataSaving) {
            this.settings.dataSaving = {};
        }
        this.settings.dataSaving[toolId] = allow;
        this.saveSettings();
    }

    /**
     * Subscribes a callback to settings changes.
     * @param {Function} callback
     */
    subscribe(callback) {
        this.listeners.push(callback);
    }

    /**
     * Unsubscribes a callback from settings changes.
     * @param {Function} callback
     */
    unsubscribe(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * Notifies all subscribers of a change.
     */
    notifyListeners() {
        this.listeners.forEach(cb => cb());
    }

    /**
     * Clears all saved tool-specific data from localStorage.
     */
    clearAllToolData() {
        APP_CONFIG.tools.list.forEach(tool => {
            this.clearToolData(tool.id);
        });
    }

    /**
     * Clears saved data for a specific tool.
     * @param {string} toolId
     */
    clearToolData(toolId) {
        const tool = APP_CONFIG.tools.list.find(t => t.id === toolId);
        if (tool && tool.storageKey) {
            localStorage.removeItem(tool.storageKey);
        }
    }

    /**
     * Checks if a specific tool has saved data.
     * @param {string} toolId
     * @returns {boolean}
     */
    hasToolData(toolId) {
        const tool = APP_CONFIG.tools.list.find(t => t.id === toolId);
        if (tool && tool.storageKey) {
            return localStorage.getItem(tool.storageKey) !== null;
        }
        return false;
    }

    /**
     * Checks if any tool has saved data.
     * @returns {boolean}
     */
    hasAnyToolData() {
        return APP_CONFIG.tools.list.some(tool => {
            return tool.storageKey ? localStorage.getItem(tool.storageKey) !== null : false;
        });
    }

    /**
     * Persists tool-specific data.
     * @param {string} toolId
     * @param {Object} data
     */
    saveToolData(toolId, data) {
        if (toolId === 'home') {
            localStorage.setItem('homeGalleryOrder', JSON.stringify(data));
            return;
        }

        const tool = APP_CONFIG.tools.list.find(t => t.id === toolId);
        if (tool && tool.storageKey) {
            localStorage.setItem(tool.storageKey, JSON.stringify(data));
        }
    }

    /**
     * Retrieves persisted tool-specific data.
     * @param {string} toolId
     * @returns {Object|null}
     */
    getToolData(toolId) {
        if (toolId === 'home') {
            const saved = localStorage.getItem('homeGalleryOrder');
            try { return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
        }

        const tool = APP_CONFIG.tools.list.find(t => t.id === toolId);
        if (tool && tool.storageKey) {
            const saved = localStorage.getItem(tool.storageKey);
            try {
                return saved ? JSON.parse(saved) : null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Formats a number with currency symbol according to global settings.
     * @param {number} num - The number to format.
     * @param {number} [decimalPlaces=2] - Minimum decimal places.
     * @returns {string} Formatted currency string.
     */
    formatMoney(num, decimalPlaces = 2) {
        const currency = this.getCurrency();
        const formattedNum = this.formatNumber(num, decimalPlaces);

        if (currency.position === 'before') {
            return `${currency.symbol}${formattedNum}`;
        } else {
            return `${formattedNum} ${currency.symbol}`;
        }
    }

    /**
     * Formats a number with thousands and decimal separators according to global settings.
     * @param {number} num - The number to format.
     * @param {number} [decimalPlaces=2] - Minimum decimal places.
     * @param {boolean} [useThousands=true] - Whether to use the thousands separator.
     * @returns {string} Formatted number string.
     */
    formatNumber(num, decimalPlaces = 2, useThousands = true) {
        if (isNaN(num) || num === null) return this.formatNumber(0, decimalPlaces, useThousands);

        const format = this.getFormat();
        const numStr = num.toFixed(decimalPlaces);
        const parts = numStr.split('.');

        let intPart = parts[0];
        const decPart = parts.length > 1 ? parts[1] : '';

        if (useThousands) {
            intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, format.thou);
        }

        if (decimalPlaces > 0 || decPart.length > 0) {
            return `${intPart}${format.dec}${decPart}`;
        }
        return intPart;
    }

    /**
     * Parses a string input into a number according to global settings.
     * @param {string|number} value - The value to parse.
     * @returns {number} Parsed float number.
     */
    parseInput(value) {
        if (value === undefined || value === null || value === '') return NaN;
        if (typeof value === 'number') return value;

        const format = this.getFormat();

        let cleaned = value.toString().split(format.thou).join('');
        cleaned = cleaned.replace(format.dec, '.');

        return parseFloat(cleaned);
    }

    /**
     * Sanitizes raw text input to use the correct decimal separator in real-time.
     * @param {string} value - Raw string value from input.
     * @param {number} [maxDecimals] - Optional maximum number of decimals allowed.
     * @returns {string} Sanitized string value.
     */
    sanitizeInput(value, maxDecimals) {
        if (!value) return '';
        const format = this.getFormat();
        const alternates = ['.', ','].filter(a => a !== format.dec);

        let sanitized = value.toString();
        alternates.forEach(alt => {
            sanitized = sanitized.split(alt).join(format.dec);
        });

        const escapedDec = format.dec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const allowedCharsRegex = new RegExp(`[^0-9${escapedDec}]`, 'g');
        sanitized = sanitized.replace(allowedCharsRegex, '');

        let parts = sanitized.split(format.dec);
        if (parts.length > 2) {
            sanitized = parts[0] + format.dec + parts.slice(1).join('');
            parts = [parts[0], Array.from(parts.slice(1)).join('')];
        }

        if (maxDecimals !== undefined && parts.length === 2 && maxDecimals >= 0) {
            sanitized = parts[0] + format.dec + parts[1].substring(0, maxDecimals);
        }

        return sanitized;
    }
}

//=============================================
// Global Singleton
//=============================================
export const GlobalSettings = new GlobalSettingsManager();

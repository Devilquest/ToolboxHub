import { GlobalSettings } from './format-utils.js';

//=============================================
// Input Validation Utilities
//=============================================

/**
 * Validates whether a keyboard event should be allowed in a numeric input field.
 * @param {KeyboardEvent} event - The keyboard event to validate.
 * @param {HTMLInputElement} input - The input element receiving the event.
 * @param {Object} [options] - Optional flags to extend allowed keys.
 * @param {boolean} [options.allowNegative=false] - Allow a leading minus sign.
 * @param {boolean} [options.allowComma=false] - Allow alternative decimal separators.
 * @returns {boolean} True if the key should be allowed.
 */
export function isAllowedKey(event, input, { allowNegative = false, allowComma = false } = {}) {
    const key = event.key;
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(key)) return true;

    if (event.ctrlKey || event.metaKey) return true;
    if (/^[0-9]$/.test(key)) return true;

    // Allow decimal separators if not already present; sanitizeInput handles the translation
    if ((key === '.' || key === ',') && !input.value.includes('.') && !input.value.includes(',')) return true;

    if (allowNegative && key === '-' && input.selectionStart === 0 && !input.value.includes('-')) return true;

    return false;
}

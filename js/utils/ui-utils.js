import { showToast } from '../components/toast.js';
import { GlobalSettings } from './format-utils.js';
import { APP_CONFIG } from '../config.js';

//=============================================
// Animations & Feedback
//=============================================

/**
 * Smoothly animates an element out of the DOM.
 * Applies fading, scaling, and height collapse before removing the element.
 * 
 * @param {HTMLElement} element - The element to remove
 * @param {Function} [callback] - Optional function to run after animation completes
 * @param {number} [duration=APP_CONFIG.ui.modalTransition] - Duration of the animation in ms
 */
export function animateRemove(element, callback, duration = APP_CONFIG.ui.modalTransition) {
    if (!element) return;

    element.style.opacity = '0';
    element.style.transform = 'scale(0.95)';
    element.style.maxHeight = '0';
    element.style.margin = '0';
    element.style.paddingTop = '0';
    element.style.paddingBottom = '0';
    element.style.border = 'none';
    element.style.pointerEvents = 'none';
    element.style.overflow = 'hidden';

    setTimeout(() => {
        element.remove();
        if (callback && typeof callback === 'function') {
            callback();
        }
    }, duration);
}

/**
 * Shows visual feedback (error/warning) on an input element and a toast message.
 * 
 * @param {HTMLElement} element - The input/container element to highlight
 * @param {string} message - The message for the toast notification
 * @param {'error'|'warning'} [type='error'] - The type of feedback
 * @param {number} [duration=APP_CONFIG.ui.validationFeedback] - How long to keep the highlight and show the toast
 */
export function showInputFeedback(element, message, type = 'error', duration = APP_CONFIG.ui.validationFeedback) {
    if (!element) return;

    if (element._feedbackTimer) {
        clearTimeout(element._feedbackTimer);
    }

    element.classList.remove('error', 'warning');
    void element.offsetWidth; // Force reflow
    element.classList.add(type);
    showToast(message, type, duration);

    element._feedbackTimer = setTimeout(() => {
        element.classList.remove('error', 'warning');
        delete element._feedbackTimer;
    }, duration);
}

//=============================================
// Input & Interaction
//=============================================

/**
 * Initialises custom stepper buttons (up/down arrows) for input fields.
 * Supports intelligent stepping based on 'step' attribute or dynamic decimals.
 * 
 * @param {HTMLElement} [container=document] - The container element to search for stepper buttons
 * @param {Function} [onUpdate] - Optional callback to call after a value is changed.
 */
export function initCustomSteppers(container = document, onUpdate = null) {
    container.querySelectorAll('.input-step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const inputId = btn.dataset.id;
            const input = document.getElementById(inputId);
            if (!input || input.disabled) return;

            const stepAttr = input.getAttribute("step");
            const valStr = input.value.toString();
            let step;
            let precision = 0;

            if (stepAttr && !isNaN(parseFloat(stepAttr))) {
                step = parseFloat(stepAttr);
                precision = (stepAttr.split(".")[1] || "").length;
            } else {
                const format = GlobalSettings.getFormat();
                step = 1;
                if (valStr.includes(format.dec)) {
                    precision = valStr.split(format.dec)[1].length;
                    step = Math.pow(10, -precision);
                }
            }

            const min = GlobalSettings.parseInput(input.min);
            const max = GlobalSettings.parseInput(input.max);
            let value = GlobalSettings.parseInput(input.value) || 0;

            if (btn.classList.contains('up')) {
                value += step;
            } else {
                value -= step;
            }

            if (!isNaN(min) && value < min) value = min;
            if (!isNaN(max) && value > max) value = max;

            const newValue = GlobalSettings.formatNumber(value, precision, false);
            input.value = newValue;

            if (onUpdate && typeof onUpdate === 'function') {
                onUpdate(inputId, newValue);
            }

            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    });
}

/**
 * Copies text to clipboard, uses CSS-only checkmark animation, and shows a toast.
 * @param {string} text - The text to copy.
 * @param {HTMLElement} button - The button element that triggered the copy.
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text, button) {
    if (!text || !text.trim()) return;

    try {
        await navigator.clipboard.writeText(text);
        button.classList.add('copied-success');

        setTimeout(() => {
            button.classList.remove('copied-success');
        }, APP_CONFIG.ui.clipboardFeedback);

    } catch (err) {
        showToast('Failed to copy.', 'error');
        console.error('Failed to copy to clipboard:', err);
    }
}

/**
 * Dedents a block of text based on the minimum indentation of non-empty lines.
 * 
 * @param {string} text - The text to dedent
 * @returns {string} 
 */
export function dedent(text) {
    if (!text) return '';
    const lines = text.split('\n');
    let firstLineIndex = 0;
    while (firstLineIndex < lines.length && lines[firstLineIndex].trim() === '') firstLineIndex++;
    let lastLineIndex = lines.length - 1;
    while (lastLineIndex >= firstLineIndex && lines[lastLineIndex].trim() === '') lastLineIndex--;
    if (firstLineIndex > lastLineIndex) return '';

    const relevantLines = lines.slice(firstLineIndex, lastLineIndex + 1);
    let minIndent = Infinity;
    relevantLines.forEach(line => {
        if (line.trim().length > 0) {
            const indent = line.match(/^\s*/)[0].length;
            if (indent < minIndent) minIndent = indent;
        }
    });

    if (minIndent === Infinity || minIndent === 0) return relevantLines.join('\n');
    return relevantLines.map(line => line.substring(minIndent)).join('\n');
}

//=============================================
// UI Components & Layout
//=============================================

/**
 * Standardised helper to render a panel of statistic items.
 * 
 * @param {HTMLElement} container - The element where stats will be rendered
 * @param {Array<{value: string|number, label: string, colorClass: string}>} stats - List of stats to show
 */
export function renderStats(container, stats) {
    if (!container) return;
    container.innerHTML = stats.map(s => `
        <div class="stat-item">
            <div class="stat-value ${s.colorClass || ''}">${s.value}</div>
            <div class="stat-label">${s.label}</div>
        </div>
    `).join('');
}

/**
 * Setup a standardised theme toggle for tool preview containers (iframes).
 * 
 * @param {HTMLElement} button - The button to trigger the toggle
 * @param {HTMLElement} container - The container that gets the theme class
 * @param {string} [initialTheme='dark'] - 'dark' or 'light'
 * @returns {string} The current theme after toggle
 */
export function setupThemeToggle(button, container, initialTheme = 'dark') {
    if (!button || !container) return initialTheme;

    let currentTheme = initialTheme;
    
    container.classList.toggle('theme-dark', currentTheme === 'dark');
    container.classList.toggle('theme-light', currentTheme === 'light');

    button.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        container.classList.toggle('theme-dark', currentTheme === 'dark');
        container.classList.toggle('theme-light', currentTheme === 'light');
    });

    return currentTheme;
}

/**
 * Sets up drag and drop event listeners on a panel and its dropzone.
 * @param {HTMLElement} panel - The panel element that receives drag events.
 * @param {HTMLElement} dropZone - The dropzone element to highlight.
 * @param {Function} onDrop - Callback function receiving (event, dropZone)
 * @param {Function} [onDragLeave=null] - Optional callback function for when drag leaves completely
 */
export function setupDragAndDrop(panel, dropZone, onDrop, onDragLeave = null) {
    let dragCounter = 0;

    panel.addEventListener('dragenter', e => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter++;
        dropZone.classList.add('dragover');
        dropZone.classList.remove('hidden');
    });

    panel.addEventListener('dragover', e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });

    panel.addEventListener('dragleave', e => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter--;
        if (dragCounter === 0) {
            if (onDragLeave) {
                onDragLeave();
            } else {
                dropZone.classList.remove('dragover');
            }
        }
    });

    panel.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter = 0;
        dropZone.classList.remove('dragover');
        onDrop(e, dropZone);
    });
}

/**
 * Toggles the visibility of an upload area relative to textarea content.
 * 
 * @param {HTMLElement} textarea - The textarea element
 * @param {HTMLElement} dropZone - The dropzone element
 * @param {boolean} hasContent - True if there is content to show
 * @param {Function} [showInfoCallback=null] - Callback to show file info
 * @param {Function} [hideInfoCallback=null] - Callback to hide file info
 */
export function toggleUploadArea(textarea, dropZone, hasContent, showInfoCallback = null, hideInfoCallback = null) {
    if (hasContent) {
        textarea.classList.add('has-content');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                dropZone.classList.add('hidden');
                setTimeout(() => {
                    dropZone.classList.remove('dragover');
                }, 450);
            });
        });
        if (showInfoCallback) showInfoCallback();
    } else {
        textarea.classList.remove('has-content');
        dropZone.classList.remove('hidden');
        dropZone.classList.remove('dragover');
        if (hideInfoCallback) hideInfoCallback();
    }
}

/**
 * Generates the HTML for a loading indicator.
 * @param {string} [message='Loading...'] - Optional message to display below the loader.
 * @returns {string} The HTML string for the loader.
 */
export function renderLoader(message = 'Loading...') {
    return `
        <div class="loading">
            <div class="loader">
                <span></span><span></span><span></span>
                <span></span><span></span><span></span>
                <span></span><span></span><span></span>
            </div>
            ${message ? `<span>${message}</span>` : ''}
        </div>
    `;
}

/**
 * Sets up drag-and-drop reordering for a grid of elements.
 * 
 * @param {HTMLElement} container - The container holding the draggable items.
 * @param {Object} [options={}] - Configuration options.
 * @returns {Function} A function to unsubscribe listeners.
 */
export function setupSortableGrid(container, options = {}) {
    const {
        itemSelector,
        draggingClass = 'is-dragging',
        placeholderClass = 'drag-placeholder',
        onOrderChange = null
    } = options;

    let draggedItem = null;
    let hasMovedOverTarget = false;

    const handleDragStart = (e) => {
        const item = e.target.closest(itemSelector);
        if (!item) return;

        draggedItem = item;
        hasMovedOverTarget = false;

        item.classList.add(placeholderClass);
        container.classList.add('is-sorting');
        e.dataTransfer.effectAllowed = 'move';
        
        const openOverlays = item.querySelectorAll('.open, .info-open');
        openOverlays.forEach(el => el.classList.remove('open', 'info-open'));
    };

    const handleDragEnd = (e) => {
        const item = e.target.closest(itemSelector);
        if (!item) return;

        draggedItem = null;
        hasMovedOverTarget = false;

        container.classList.remove('is-sorting');
        container.querySelectorAll(itemSelector).forEach(el => {
            el.classList.remove(placeholderClass, draggingClass);
        });

        if (onOrderChange) {
            onOrderChange();
        }
    };

    let sortAnimationFrame = null;

    const handleDragOver = (e) => {
        e.preventDefault();
        if (!draggedItem) return;

        const targetItem = e.target.closest(itemSelector);
        if (!targetItem || targetItem === draggedItem) return;

        if (sortAnimationFrame) return;

        sortAnimationFrame = requestAnimationFrame(() => {
            const currentTarget = targetItem;
            if (!currentTarget || !container.contains(currentTarget) || currentTarget === draggedItem) {
                sortAnimationFrame = null;
                return;
            }

            if (!hasMovedOverTarget) {
                hasMovedOverTarget = true;
                draggedItem.classList.remove(placeholderClass);
                draggedItem.classList.add(draggingClass);
            }

            const allItems = [...container.querySelectorAll(itemSelector)];
            const draggedIdx = allItems.indexOf(draggedItem);
            const targetIdx = allItems.indexOf(currentTarget);

            if (draggedIdx !== -1 && targetIdx !== -1) {
                if (draggedIdx < targetIdx) {
                    container.insertBefore(draggedItem, currentTarget.nextSibling);
                } else {
                    container.insertBefore(draggedItem, currentTarget);
                }
            }
            sortAnimationFrame = null;
        });
    };

    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragend', handleDragEnd);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', e => e.preventDefault());

    container.querySelectorAll(itemSelector).forEach(item => {
        item.draggable = true;
    });

    return () => {
        container.removeEventListener('dragstart', handleDragStart);
        container.removeEventListener('dragend', handleDragEnd);
        container.removeEventListener('dragover', handleDragOver);
    };
}

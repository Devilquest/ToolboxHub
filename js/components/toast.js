import { APP_CONFIG } from '../config.js';

//=============================================
// Toast Notification Component
//=============================================

/**
 * Displays a toast notification message with auto-dismiss.
 * @param {string} message - The message to display.
 * @param {'error'|'success'|'warning'|'info'} [type='error'] - The severity/type of the notification.
 * @param {number} [duration=APP_CONFIG.ui.toastDuration] - Time in milliseconds before auto-removal.
 */
export function showToast(message, type = 'error', duration = APP_CONFIG.ui.toastDuration) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.setProperty('--toast-duration', `${duration}ms`);
    toast.innerHTML = `
        <app-icon name="${type}" class="toast-icon"></app-icon>
        <div class="toast-message"></div>
        <button class="toast-close" aria-label="Close">✕</button>
        <div class="toast-progress"></div>
    `;

    toast.querySelector('.toast-message').textContent = message;

    const dismiss = () => {
        toast.classList.add('removing');
        toast.addEventListener('animationend', (e) => {
            if (e.animationName === 'toastOut') {
                toast.remove();
            }
        });
    };

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', dismiss);
    }
    container.prepend(toast);

    setTimeout(dismiss, duration);
}

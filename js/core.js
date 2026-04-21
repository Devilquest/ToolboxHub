//=============================================
// Imports & Exports
//=============================================

import { APP_CONFIG } from './config.js';

const TOOLS = APP_CONFIG.tools.list;

export { switchTab } from './utils/tabs.js';
export { downloadBlob, createZipBlob } from './utils/file-utils.js';
export { isAllowedKey } from './utils/validators.js';
export {
    animateRemove,
    initCustomSteppers,
    showInputFeedback,
    setupDragAndDrop,
    setupSortableGrid,
    copyToClipboard,
    toggleUploadArea,
    renderLoader,
    dedent,
    renderStats,
    setupThemeToggle
} from './utils/ui-utils.js';

import { showToast } from './components/toast.js';
import { FileList } from './components/file-list.js';
import { GlobalSettings } from './utils/format-utils.js';
import './components/app-icon.js';

export { showToast, FileList, GlobalSettings };

//=============================================
// Helpers
//=============================================

/**
 * Standard confirmation helper for destructive 'Reset' actions across the Hub.
 * @param {string} toolName - The name of the tool or component to reset.
 * @param {string} customMessage - Optional override for the message.
 * @returns {Promise<boolean>}
 */
export async function confirmReset(toolName = 'this tool', customMessage = null) {
    return await window.showConfirm({
        title: `Reset ${toolName}`,
        message: customMessage || `Are you sure you want to reset ${toolName} to its initial state?\n\nThis action cannot be undone.`,
        icon: 'warning',
        type: 'danger',
        confirmText: 'Reset Now'
    });
}

//=============================================
// Router Class
//=============================================

/**
 * Main application router and view orchestrator.
 */
class Router {
    constructor() {
        this.appContainer = document.getElementById('app');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.currentToolInstance = null;
        this.currentToolStyle = null;
        this.sidebar = document.querySelector('.sidebar');
        this.overlay = document.querySelector('.sidebar-overlay');
        this.menuToggle = document.querySelector('.menu-toggle');

        this.init();
    }

    /**
     * Initializes the router and global event listeners.
     */
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.menuToggle.addEventListener('click', () => this.toggleSidebar());
        this.overlay.addEventListener('click', () => this.closeSidebar());
        this.initScrollToTop();
        this.syncSidebarOrder();
        this.handleRoute();
    }

    /**
     * Handles route changes based on the URL hash.
     * @async
     */
    async handleRoute() {
        const hash = window.location.hash.slice(2) || '';
        this.closeSidebar();

        this.appContainer.classList.add('fade-out');

        await new Promise(resolve => setTimeout(resolve, APP_CONFIG.ui.routeTransition));

        this.cleanup();

        const footerPhrase = document.getElementById('footer-phrase');
        const favicon = document.getElementById('favicon');

        if (!hash || hash === '/') {
            await this.loadTemplate('home');
            await this.loadToolModule('home');
            this.setActiveNav('');
            this.appContainer.classList.remove('tool-wide');
            if (footerPhrase) footerPhrase.textContent = ': One toolbox to rule them all';
            document.title = 'ToolboxHub';
            if (favicon) favicon.href = 'images/favicon.ico';

            setTimeout(() => this.appContainer.classList.remove('fade-out'), 50);
            return;
        }

        const tool = TOOLS.find(t => t.id === hash);
        if (!tool) {
            await this.loadTemplate('home');
            this.setActiveNav('');
            this.appContainer.classList.remove('tool-wide');
            if (footerPhrase) footerPhrase.textContent = ': One toolbox to rule them all';
            document.title = 'ToolboxHub';
            if (favicon) favicon.href = 'images/favicon.ico';

            setTimeout(() => this.appContainer.classList.remove('fade-out'), 50);
            return;
        }

        if (tool.wide) {
            this.appContainer.classList.add('tool-wide');
        } else {
            this.appContainer.classList.remove('tool-wide');
        }

        await this.loadTemplate(tool.id);
        this.loadToolCSS(tool.id);
        await this.loadToolModule(tool.id);
        this.setActiveNav(tool.id);

        if (footerPhrase) {
            footerPhrase.textContent = tool.phrase;
        }

        document.title = `${tool.name} | ToolboxHub`;
        if (favicon) {
            favicon.href = `images/tools/${tool.id}.ico`;
        }

        setTimeout(() => this.appContainer.classList.remove('fade-out'), 50);
    }

    /**
     * Fetches and injects the HTML template for a specific tool.
     * @async
     * @param {string} name - Internal tool ID.
     */
    async loadTemplate(name) {
        const path = name === 'home' ? 'html/home.html' : `html/tools/${name}.html`;
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            this.appContainer.innerHTML = html;
        } catch {
            this.appContainer.innerHTML = `
                <div class="tool-header">
                    <h1>⚠️ Error</h1>
                    <p>Template not found: ${name}</p>
                </div>
            `;
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    /**
     * Dynamically injects tool-specific CSS into the document head.
     * @param {string} toolId - Internal tool ID.
     */
    loadToolCSS(toolId) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `css/tools/${toolId}.css?v=2`;
        link.id = 'tool-style';
        document.head.appendChild(link);
        this.currentToolStyle = link;
    }

    /**
     * Dynamically imports and instantiates the JavaScript logic for a tool.
     * @async
     * @param {string} toolId - Internal tool ID.
     */
    async loadToolModule(toolId) {
        try {
            const module = await import(`./tools/${toolId}.js`);
            const ToolClass = module.default;
            if (typeof ToolClass === 'function') {
                this.currentToolInstance = new ToolClass();
            } else {
                console.warn(`Tool module "${toolId}" does not export a default class.`);
            }
        } catch (error) {
            console.error(`Error loading tool module "${toolId}":`, error);
        }
    }

    /**
     * Cleans up the previous tool instance and its styles.
     */
    cleanup() {
        if (this.currentToolInstance) {
            if (typeof this.currentToolInstance.destroy === 'function') {
                this.currentToolInstance.destroy();
            }
            this.currentToolInstance = null;
        }
        if (this.currentToolStyle) {
            this.currentToolStyle.remove();
            this.currentToolStyle = null;
        }
        this.appContainer.innerHTML = '';
    }

    /**
     * Updates navigation UI state to reflect the current active tool.
     * @param {string} toolId
     */
    setActiveNav(toolId) {
        this.navLinks.forEach(link => {
            const linkId = link.getAttribute('data-tool');
            if (toolId && linkId === toolId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Synchronizes the sidebar link order with saved user preferences.
     */
    syncSidebarOrder() {
        const nav = document.querySelector('.sidebar-nav');
        if (!nav) return;

        const data = GlobalSettings.getToolData('home');
        const order = (data && data.order && Array.isArray(data.order)) 
            ? data.order 
            : APP_CONFIG.tools.defaultOrder;

        if (!order || !Array.isArray(order)) return;

        const links = [...nav.querySelectorAll('.nav-link')];
        const linkMap = {};
        links.forEach(link => {
            const id = link.getAttribute('data-tool');
            if (id) linkMap[id] = link;
        });

        order.forEach(id => {
            if (linkMap[id]) {
                nav.appendChild(linkMap[id]);
                delete linkMap[id];
            }
        });

        Object.values(linkMap).forEach(link => {
            nav.appendChild(link);
        });
        
        this.navLinks = nav.querySelectorAll('.nav-link');
    }

    /**
     * Toggles the sidebar visibility.
     */
    toggleSidebar() {
        this.sidebar.classList.toggle('open');
        this.overlay.classList.toggle('active');
        this.menuToggle.classList.toggle('active');
    }

    /**
     * Closes the sidebar explicitly.
     */
    closeSidebar() {
        this.sidebar.classList.remove('open');
        this.overlay.classList.remove('active');
        this.menuToggle.classList.remove('active');
    }

    /**
     * Initializes the 'Scroll to Top' button logic.
     */
    initScrollToTop() {
        const btn = document.getElementById('scrollToTopBtn');
        if (!btn) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > APP_CONFIG.ui.scrollThreshold) {
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

//=============================================
// Initialization & Global Logic
//=============================================

document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
    router.initScrollToTop();
    GlobalSettings.applyBackgroundAnimation();

    const handleResize = () => {
        if (window.innerWidth <= 1024) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsClose = document.getElementById('settingsModalClose');
    const curSelect = document.getElementById('globalCurrency');
    const numFormatToggle = document.getElementById('numFormatToggle');
    const animateBgCheckbox = document.getElementById('settingAnimateBg');
    const permissionsList = document.getElementById('settingsDataPermissionsList');

    /**
     * Updates the status of the 'Delete All Storage' button.
     */
    const updateDeleteAllButtonState = () => {
        const btnDeleteAll = document.getElementById('btnDeleteAllStorage');
        if (btnDeleteAll) {
            const anyDataExists = GlobalSettings.hasAnyToolData();
            btnDeleteAll.disabled = !anyDataExists;
            btnDeleteAll.title = anyDataExists ? 'Delete all tool data' : 'No data to delete';
        }
    };

    /**
     * Populates settings modal with current configuration values.
     */
    const populateSettingsUI = () => {
        if (curSelect) {
            curSelect.innerHTML = '';
            const currencies = APP_CONFIG.formats.currencies;
            Object.keys(currencies).forEach(code => {
                const opt = document.createElement('option');
                opt.value = code;
                opt.textContent = `${currencies[code].symbol} (${code})`;
                curSelect.appendChild(opt);
            });
            curSelect.value = GlobalSettings.settings.currency;
        }

        if (numFormatToggle) {
            numFormatToggle.innerHTML = '';
            const formats = APP_CONFIG.formats.numberFormats;
            Object.keys(formats).forEach(key => {
                const f = formats[key];
                const btn = document.createElement('button');
                btn.className = 'num-format-btn';
                btn.dataset.value = key;
                btn.setAttribute('aria-pressed', GlobalSettings.settings.numberFormat === key ? 'true' : 'false');
                
                const example = `1${f.thou}234${f.dec}56`;
                
                btn.innerHTML = `
                    <span class="num-format-example">${example}</span>
                    <span class="num-format-desc">Thousands: <span class="separator-highlight">${f.thou}</span> / 
                    Decimal: <span class="separator-highlight">${f.dec}</span></span>
                `;

                btn.addEventListener('click', () => {
                    if (btn.getAttribute('aria-pressed') === 'true') return;
                    GlobalSettings.setNumberFormat(key);
                    updateNumFormatToggle(key);
                    showToast(`Number format set to ${example}`, 'info');
                });

                numFormatToggle.appendChild(btn);
            });
        }

        if (animateBgCheckbox) {
            animateBgCheckbox.checked = GlobalSettings.settings.animateBackground;
        }

        if (permissionsList) {
            permissionsList.innerHTML = '';
            const tools = APP_CONFIG.tools.list;
            tools.forEach(tool => {
                if (!tool.storageKey) return;

                const row = document.createElement('div');
                row.className = 'settings-tool-row';
                
                const isChecked = GlobalSettings.canSaveData(tool.id);
                const hasData = GlobalSettings.hasToolData(tool.id);
                
                row.innerHTML = `
                    <label class="checkbox-wrapper">
                        <input type="checkbox" id="settingSaveData-${tool.id}" ${isChecked ? 'checked' : ''}>
                        <span class="checkbox-custom"></span>
                        <div class="checkbox-label-content">
                            <span class="checkbox-title">${tool.name}</span>
                        </div>
                    </label>
                    <button class="btn-delete-tool" data-tool="${tool.id}" ${!hasData ? 'disabled' : ''} title="${hasData ? `Delete ${tool.name} data` : 'No data to delete'}">
                        <app-icon name="delete" size="18px"></app-icon>
                    </button>
                `;

                const checkbox = row.querySelector('input');
                const deleteBtn = row.querySelector('.btn-delete-tool');

                checkbox.addEventListener('change', (e) => {
                    const allow = e.target.checked;
                    GlobalSettings.setSaveData(tool.id, allow);
                    if (allow) {
                        showToast(`${tool.name} data saving enabled.`, 'info');
                    } else {
                        showToast(`${tool.name} data saving disabled.`, 'info');
                    }
                });

                deleteBtn.addEventListener('click', async () => {
                    const confirmed = await window.showConfirm({
                        title: `Delete ${tool.name} Data`,
                        message: `Are you sure you want to delete all saved data for ${tool.name}?\n\nThis action cannot be undone.`,
                        icon: 'delete',
                        type: 'danger',
                        confirmText: 'Delete Data'
                    });

                    if (confirmed) {
                        GlobalSettings.clearToolData(tool.id);
                        deleteBtn.disabled = true;
                        deleteBtn.title = 'No data to delete';
                        updateDeleteAllButtonState();
                        showToast(`${tool.name} data has been deleted.`, 'info');
                    }
                });

                permissionsList.appendChild(row);
            });

            updateDeleteAllButtonState();
        }

        const versionEl = document.getElementById('settingsVersion');
        if (versionEl && APP_CONFIG.version) {
            versionEl.innerHTML = `<span class="version-tag">Version ${APP_CONFIG.version}</span>`;
        }
    };

    /**
     * Synchronizes tab appearance for numeric format selection.
     * @param {string} activeValue
     */
    const updateNumFormatToggle = (activeValue) => {
        const btns = numFormatToggle.querySelectorAll('.num-format-btn');
        btns.forEach(btn => {
            const isActive = btn.dataset.value === activeValue;
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    };

    populateSettingsUI();

    /**
     * Orchestrates settings modal entry.
     */
    const openSettingsModal = () => {
        if (settingsModal) {
            populateSettingsUI();
            settingsModal.classList.add('open');
            document.body.classList.add('modal-active');
        }
    };

    /**
     * Orchestrates settings modal exit.
     */
    const closeSettingsModal = () => {
        if (!settingsModal) return;
        settingsModal.classList.add('closing');
        document.body.classList.remove('modal-active');

        const advanced = settingsModal.querySelector('.advanced-settings');
        if (advanced && advanced.hasAttribute('open') && !advanced.classList.contains('closing')) {
            advanced.classList.add('closing');
            setTimeout(() => {
                advanced.removeAttribute('open');
                advanced.classList.remove('closing');
            }, APP_CONFIG.ui.accordionTransition);
        }

        setTimeout(() => {
            settingsModal.classList.remove('open', 'closing');
        }, APP_CONFIG.ui.modalTransition);
    };
    
    if (animateBgCheckbox) {
        animateBgCheckbox.addEventListener('change', (e) => {
            GlobalSettings.setAnimateBackground(e.target.checked);
            if (e.target.checked) {
                showToast('Background animation enabled.', 'info');
            } else {
                showToast('Background animation disabled.', 'info');
            }
        });
    }

    if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
    if (settingsClose) settingsClose.addEventListener('click', closeSettingsModal);
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) closeSettingsModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal && settingsModal.classList.contains('open')) {
            closeSettingsModal();
        }
    });

    if (curSelect) {
        curSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            GlobalSettings.setCurrency(value);
            const opt = curSelect.options[curSelect.selectedIndex];
            showToast(`Currency set to ${opt.text}`, 'info');
        });
    }

    const confirmModal = document.getElementById('confirmModal');
    const confirmPanel = confirmModal?.querySelector('.modal-panel');
    const confirmTitle = document.getElementById('confirmModalTitle');
    const confirmIcon = document.getElementById('confirmModalIcon');
    const confirmMessage = document.getElementById('confirmModalMessage');
    const btnConfirmCancel = document.getElementById('btnConfirmCancel');
    const btnConfirmAction = document.getElementById('btnConfirmAction');

    /**
     * Global standard for displaying interactive confirmation dialogs.
     * @param {Object} options
     * @returns {Promise<boolean>}
     */
    window.showConfirm = (options = {}) => {
        const {
            title = 'Confirm Action',
            message = 'Are you sure?',
            icon = 'warning',
            type = 'danger',
            confirmText = 'Confirm'
        } = options;

        return new Promise((resolve) => {
            confirmTitle.textContent = title;
            confirmMessage.textContent = message;
            confirmIcon.setAttribute('name', icon);
            btnConfirmAction.textContent = confirmText;
            
            confirmPanel.classList.remove('confirm-danger', 'confirm-primary');
            confirmPanel.classList.add(`confirm-${type}`);
            
            btnConfirmAction.classList.remove('btn-danger', 'btn-primary');
            btnConfirmAction.classList.add(`btn-${type}`);

            confirmModal.classList.add('open');
            document.body.classList.add('modal-active');
            
            const handleCancel = () => {
                confirmModal.classList.add('closing');
                document.body.classList.remove('modal-active');
                btnConfirmAction.removeEventListener('click', handleConfirm);
                btnConfirmCancel.removeEventListener('click', handleCancel);
                
                setTimeout(() => {
                    confirmModal.classList.remove('open', 'closing');
                    resolve(false);
                }, APP_CONFIG.ui.modalTransition);
            };

            const handleConfirm = () => {
                confirmModal.classList.add('closing');
                document.body.classList.remove('modal-active');
                btnConfirmAction.removeEventListener('click', handleConfirm);
                btnConfirmCancel.removeEventListener('click', handleCancel);
                
                setTimeout(() => {
                    confirmModal.classList.remove('open', 'closing');
                    resolve(true);
                }, APP_CONFIG.ui.modalTransition);
            };

            btnConfirmCancel.addEventListener('click', handleCancel, { once: true });
            btnConfirmAction.addEventListener('click', handleConfirm, { once: true });
            
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) handleCancel();
            }, { once: true });
        });
    };

    const btnDeleteAll = document.getElementById('btnDeleteAllStorage');
    if (btnDeleteAll) {
        btnDeleteAll.addEventListener('click', async () => {
            const confirmed = await window.showConfirm({
                title: 'Delete All Data',
                message: 'Are you sure you want to delete all saved tool data?\n\nThis action cannot be undone.',
                icon: 'warning',
                type: 'danger',
                confirmText: 'Delete Everything'
            });
            
            if (confirmed) {
                GlobalSettings.clearAllToolData();
                populateSettingsUI();
                showToast('All tool data has been deleted.', 'info');
            }
        });
    }

    const advancedSettings = document.querySelector('.advanced-settings');
    const advancedSummary = advancedSettings?.querySelector('summary');

    if (advancedSummary) {
        advancedSummary.addEventListener('click', (e) => {
            if (advancedSettings.hasAttribute('open')) {
                e.preventDefault();
                advancedSettings.classList.add('closing');
                
                setTimeout(() => {
                    advancedSettings.removeAttribute('open');
                    advancedSettings.classList.remove('closing');
                }, APP_CONFIG.ui.accordionTransition); 
            }
        });
    }
});

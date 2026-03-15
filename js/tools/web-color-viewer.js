import { showToast, copyToClipboard, GlobalSettings, renderLoader, confirmReset, setupSortableGrid } from '../core.js';
import { APP_CONFIG } from '../config.js';

//=============================================
// Configuration & Constants
//=============================================

const WEB_COLORS = APP_CONFIG.tools.webColorViewer.webColors;
const PRESETS = APP_CONFIG.tools.webColorViewer.presets;

//=============================================
// Helper Utilities
//=============================================

const hslCanvas = document.createElement('canvas');
hslCanvas.width = 1;
hslCanvas.height = 1;
const hslCtx = hslCanvas.getContext('2d');

/**
 * Calculates HSL values for a given color string.
 * @param {string} color - Any valid CSS color.
 * @returns {Object} {h, s, l}
 */
function getHSL(color) {
    hslCtx.fillStyle = color;
    hslCtx.fillRect(0, 0, 1, 1);
    const [r, g, b] = hslCtx.getImageData(0, 0, 1, 1).data;

    const rN = r / 255, gN = g / 255, bN = b / 255;
    const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rN: h = (gN - bN) / d + (gN < bN ? 6 : 0); break;
            case gN: h = (bN - rN) / d + 2; break;
            case bN: h = (rN - gN) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Extracts formatted HEX and RGB strings for a given color name.
 * @param {string} str - Color name or value.
 * @returns {Object} {hex, rgb}
 */
function getColorInfo(str) {
    if (!str) return { hex: '', rgb: '' };
    hslCtx.clearRect(0, 0, 1, 1);
    hslCtx.fillStyle = str;
    hslCtx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = hslCtx.getImageData(0, 0, 1, 1).data;

    const toHex = (n) => {
        const h = n.toString(16);
        return h.length === 1 ? '0' + h : h;
    };

    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 255 ? toHex(a) : ''}`.toUpperCase();
    const rgb = a < 255 ? `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})` : `rgb(${r}, ${g}, ${b})`;

    return { hex, rgb };
}

//=============================================
// Web Color Viewer Tool
//=============================================

/**
 * Tool for browsing, selecting, and organizing standard web colors.
 */
class WebColorViewer {
    constructor() {
        this.elements = {
            grid: document.getElementById('wcvGrid'),
            gridSizeSelect: document.getElementById('wcvGridSize'),
            presetSelect: document.getElementById('wcvPreset'),
            sortSelect: document.getElementById('wcvSort'),
            addCardBtn: document.getElementById('wcvAddCard'),
            importBtn: document.getElementById('wcvImportBtn'),
            randomBtn: document.getElementById('wcvRandom'),
            copyListBtn: document.getElementById('wcvCopyList'),
            resetAllBtn: document.getElementById('wcvResetAll'),
            importModal: document.getElementById('wcvImportModal'),
            cancelImportBtn: document.getElementById('wcvCancelImport'),
            confirmImportBtn: document.getElementById('wcvConfirmImport'),
            importTextarea: document.getElementById('wcvImportTextarea'),
            toggleBgBtn: document.getElementById('wcvToggleBg')
        };

        this.currentNumberOfCards = APP_CONFIG.tools.webColorViewer.defaultCards;

        this.renderGridSizeOptions();
        this.renderPresets();
        this.setupListeners();

        this.destroySortable = setupSortableGrid(this.elements.grid, {
            itemSelector: '.wcv-card',
            onOrderChange: () => this.saveState()
        });

        this.showLoading('Restoring palette...');
        setTimeout(() => this.initialize(), 50);
    }

    /**
     * Initializes the tool state and baseline palette.
     */
    initialize() {
        if (!this.loadState()) {
            const rainbowPreset = PRESETS.find(g => g.group === "The Spectra")
                ?.items.find(i => i.id === "rainbow7");

            const defaultColors = rainbowPreset ? rainbowPreset.colors.slice(0, 5) : [];
            this.finishLoadingState(defaultColors);
        }
    }

    /**
     * Renders the grid size dropdown options.
     */
    renderGridSizeOptions() {
        const select = this.elements.gridSizeSelect;
        if (!select) return;

        select.innerHTML = '';
        const options = APP_CONFIG.tools.webColorViewer.gridSizeOptions;

        options.forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = `${val} Cards`;
            if (val === this.currentNumberOfCards) opt.selected = true;
            select.appendChild(opt);
        });
    }

    /**
     * Attaches event listeners to tool controls.
     */
    setupListeners() {
        this.elements.gridSizeSelect.addEventListener('change', (e) => {
            this.currentNumberOfCards = parseInt(e.target.value);
            this.renderGrid(this.currentNumberOfCards);
            this.elements.presetSelect.value = '';
            this.updateGlobalButtonStates();
            this.saveState();
        });

        this.elements.presetSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadPreset(e.target.value);
            }
        });

        this.elements.sortSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.sortCards(e.target.value);
                this.updateGlobalButtonStates();
            }
        });

        this.elements.addCardBtn.addEventListener('click', () => {
            this.elements.grid.appendChild(this.createColorCard());
            this.updateGlobalButtonStates();
            this.saveState();
        });

        this.elements.randomBtn.addEventListener('click', () => {
            this.randomizePalette();
        });

        this.elements.copyListBtn.addEventListener('click', () => this.copyList());

        this.elements.resetAllBtn.addEventListener('click', () => {
            this.clearAll();
        });

        this.elements.toggleBgBtn.addEventListener('click', () => {
            this.elements.grid.classList.toggle('wcv-white-mode');
            this.elements.toggleBgBtn.classList.toggle('active');
        });

        this.elements.importBtn.addEventListener('click', () => {
            this.elements.importTextarea.value = '';
            this.elements.importModal.classList.add('open');
        });

        this.elements.cancelImportBtn.addEventListener('click', () => {
            this.elements.importModal.classList.remove('open');
        });

        this.elements.confirmImportBtn.addEventListener('click', () => {
            const text = this.elements.importTextarea.value;
            if (text.trim()) {
                this.processImport(text);
                this.elements.importModal.classList.remove('open');
            } else {
                showToast('Please paste some colors!', 'warning');
            }
        });

        this.elements.importModal.addEventListener('click', (e) => {
            if (e.target === this.elements.importModal) {
                this.elements.importModal.classList.remove('open');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.importModal.classList.contains('open')) {
                this.elements.importModal.classList.remove('open');
            }
        });

        document.addEventListener('click', (e) => {
            const openSelects = document.querySelectorAll('.custom-select.open');
            openSelects.forEach(sel => {
                if (!sel.contains(e.target)) {
                    sel.classList.remove('open');
                }
            });
        });
    }

    /**
     * Populates the preset selection dropdown.
     */
    renderPresets() {
        if (!PRESETS || !Array.isArray(PRESETS)) return;

        PRESETS.forEach(group => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group.group;

            group.items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;

                let label = item.label;
                if (item.id === 'all-colors') {
                    label = `All Web Colors (${WEB_COLORS.length})`;
                }

                option.textContent = label;
                optgroup.appendChild(option);
            });

            this.elements.presetSelect.appendChild(optgroup);
        });
    }

    /**
     * Creates a searchable custom select component for web colors.
     * @param {Function} onSelect - Callback when a color is chosen.
     * @returns {HTMLElement} The created element.
     */
    createCustomSelect(onSelect) {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select';
        wrapper.dataset.value = '';

        const trigger = document.createElement('button');
        trigger.className = 'custom-select-trigger';
        trigger.innerHTML = `
            <div class="color-swatch" style="display: none;"></div>
            <span class="trigger-text">Select color...</span>
            <span class="trigger-arrow">▼</span>
        `;


        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-select-options';

        const searchContainer = document.createElement('div');
        searchContainer.className = 'custom-select-search';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
        searchContainer.appendChild(searchInput);
        optionsContainer.appendChild(searchContainer);

        const listContainer = document.createElement('div');
        listContainer.className = 'custom-select-list';
        optionsContainer.appendChild(listContainer);

        const renderOptions = (filter = '') => {
            listContainer.innerHTML = '';

            const noneOption = document.createElement('div');
            noneOption.className = 'custom-select-option';
            noneOption.dataset.value = '';
            noneOption.innerHTML = '<span class="trigger-text">Select color...</span>';
            listContainer.appendChild(noneOption);

            const filteredColors = WEB_COLORS.filter(c => c.toLowerCase().includes(filter.toLowerCase()));
            filteredColors.forEach(color => {
                const opt = document.createElement('div');
                opt.className = 'custom-select-option';
                opt.dataset.value = color;
                opt.innerHTML = `
                    <div class="color-swatch" style="background-color: ${color}"></div>
                    <span>${color}</span>
                `;
                opt.classList.toggle('selected', wrapper.dataset.value === color);
                listContainer.appendChild(opt);
            });
        };

        renderOptions();

        searchInput.addEventListener('input', (e) => {
            renderOptions(e.target.value);
        });

        searchInput.addEventListener('click', (e) => e.stopPropagation());

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
            if (!isOpen) {
                wrapper.classList.add('open');
                searchInput.value = '';
                renderOptions();
                setTimeout(() => searchInput.focus(), 100);
            }
        });

        optionsContainer.addEventListener('click', (e) => {
            const opt = e.target.closest('.custom-select-option');
            if (opt) {
                const value = opt.dataset.value;
                this.setCustomSelectValue(wrapper, value);
                if (onSelect) onSelect(value);
                wrapper.classList.remove('open');
            }
        });

        wrapper.appendChild(trigger);
        wrapper.appendChild(optionsContainer);

        return wrapper;
    }

    /**
     * Updates the visual value of a custom select wrapper.
     * @param {HTMLElement} wrapper
     * @param {string} value
     */
    setCustomSelectValue(wrapper, value) {
        wrapper.dataset.value = value;
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const swatch = trigger.querySelector('.color-swatch');
        const text = trigger.querySelector('.trigger-text');
        const options = wrapper.querySelectorAll('.custom-select-option');

        options.forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === value);
        });

        if (value) {
            swatch.style.display = 'block';
            swatch.style.backgroundColor = value;
            text.textContent = value;
        } else {
            swatch.style.display = 'none';
            text.textContent = 'Select color...';
        }
    }

    /**
     * Creates a new color card element with all its inner UI and listeners.
     * @returns {HTMLElement}
     */
    createColorCard() {
        const card = document.createElement('div');
        card.className = 'wcv-card wcv-animating';
        card.draggable = true;

        card.addEventListener('animationend', (e) => {
            if (e.animationName === 'wcvEntrance') {
                card.classList.remove('wcv-animating');
            }
        }, { once: true });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-clear';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            card.classList.add('closing');
            setTimeout(() => {
                card.remove();
                this.updateGlobalButtonStates();
                this.saveState();
            }, 300);
        });

        const previewContainer = document.createElement('div');
        previewContainer.className = 'wcv-preview-container';

        const preview = document.createElement('div');
        preview.className = 'wcv-preview';

        const infoBtn = document.createElement('button');
        infoBtn.className = 'btn-clear btn-info';
        infoBtn.textContent = 'i';
        infoBtn.style.display = 'none';

        const infoOverlay = document.createElement('div');
        infoOverlay.className = 'wcv-info-overlay';

        const hexItem = document.createElement('div');
        hexItem.className = 'wcv-info-item';
        hexItem.innerHTML = `<span class="wcv-info-label">HEX</span><span class="wcv-info-value wcv-hex-value"></span>`;

        const rgbItem = document.createElement('div');
        rgbItem.className = 'wcv-info-item';
        rgbItem.innerHTML = `<span class="wcv-info-label">RGB</span><span class="wcv-info-value wcv-rgb-value"></span>`;

        const contrastContainer = document.createElement('div');
        contrastContainer.className = 'wcv-contrast-container';

        const whiteContrast = document.createElement('div');
        whiteContrast.className = 'wcv-contrast-pill wcv-contrast-white';
        whiteContrast.textContent = 'White Text';

        const blackContrast = document.createElement('div');
        blackContrast.className = 'wcv-contrast-pill wcv-contrast-black';
        blackContrast.textContent = 'Black Text';

        contrastContainer.appendChild(whiteContrast);
        contrastContainer.appendChild(blackContrast);

        infoOverlay.appendChild(hexItem);
        infoOverlay.appendChild(rgbItem);
        infoOverlay.appendChild(contrastContainer);

        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = infoOverlay.classList.toggle('open');
            infoBtn.classList.toggle('active', isOpen);
            card.classList.toggle('info-open', isOpen);
        });

        preview.addEventListener('click', () => {
            infoOverlay.classList.remove('open');
            infoBtn.classList.remove('active');
            card.classList.remove('info-open');
        });

        infoOverlay.addEventListener('click', (e) => {
            e.stopPropagation();
            infoOverlay.classList.remove('open');
            infoBtn.classList.remove('active');
            card.classList.remove('info-open');
        });

        hexItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = hexItem.querySelector('.wcv-hex-value').textContent;
            if (val) {
                copyToClipboard(val, hexItem);
            }
        });

        rgbItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const valEl = rgbItem.querySelector('.wcv-rgb-value');
            const val = valEl.dataset.full;
            if (val) {
                copyToClipboard(val, rgbItem);
            }
        });

        previewContainer.appendChild(preview);

        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'stack-xs';

        const select = this.createCustomSelect((val) => {
            this.updateColor(card, val);
        });

        const navRow = document.createElement('div');
        navRow.className = 'wcv-nav-row';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'wcv-nav-btn';
        prevBtn.innerHTML = '<app-icon name="chevron-left" size="18px"></app-icon>';
        prevBtn.addEventListener('click', () => {
            this.navigateColor(select, card, -1);
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'wcv-nav-btn';
        nextBtn.innerHTML = '<app-icon name="chevron-right" size="18px"></app-icon>';
        nextBtn.addEventListener('click', () => {
            this.navigateColor(select, card, 1);
        });

        navRow.appendChild(prevBtn);
        navRow.appendChild(nextBtn);

        controlsContainer.appendChild(select);
        controlsContainer.appendChild(navRow);

        card.appendChild(previewContainer);
        card.appendChild(controlsContainer);
        card.appendChild(infoOverlay);
        card.appendChild(infoBtn);
        card.appendChild(removeBtn);

        return card;
    }

    /**
     * Updates the color state of a card.
     * @param {HTMLElement} card
     * @param {string} colorName
     */
    updateColor(card, colorName) {
        if (!card) return;
        const preview = card.querySelector('.wcv-preview');
        const infoBtn = card.querySelector('.btn-info');
        const infoOverlay = card.querySelector('.wcv-info-overlay');
        const hexVal = card.querySelector('.wcv-hex-value');
        const rgbVal = card.querySelector('.wcv-rgb-value');

        if (colorName) {
            preview.style.backgroundColor = colorName;

            const info = getColorInfo(colorName);
            hexVal.textContent = info.hex;

            rgbVal.dataset.full = info.rgb;
            rgbVal.textContent = info.rgb.replace(/rgba?/, '');

            const contrastPills = card.querySelectorAll('.wcv-contrast-pill');
            contrastPills.forEach(pill => {
                pill.style.backgroundColor = colorName;
            });

            infoBtn.style.display = 'flex';
        } else {
            preview.style.backgroundColor = 'transparent';
            infoBtn.style.display = 'none';
            infoOverlay.classList.remove('open');
            infoBtn.classList.remove('active');
            card.classList.remove('info-open');
        }

        this.updateGlobalButtonStates();
        this.saveState();
    }

    /**
     * Navigates to the next/previous color name in the standard list.
     * @param {HTMLElement} select
     * @param {HTMLElement} card
     * @param {number} direction - 1 for forward, -1 for backward.
     */
    navigateColor(select, card, direction) {
        const currentColor = select.dataset.value;
        let nextIndex;

        if (!currentColor) {
            nextIndex = direction === 1 ? 0 : WEB_COLORS.length - 1;
        } else {
            const currentIndex = WEB_COLORS.indexOf(currentColor);
            nextIndex = currentIndex + direction;
            if (nextIndex >= WEB_COLORS.length) nextIndex = 0;
            if (nextIndex < 0) nextIndex = WEB_COLORS.length - 1;
        }

        const nextColor = WEB_COLORS[nextIndex];
        this.setCustomSelectValue(select, nextColor);
        this.updateColor(card, nextColor);
    }

    /**
     * Re-renders the grid with a specified number of empty cards.
     * @param {number} count
     */
    renderGrid(count) {
        this.elements.grid.innerHTML = '';
        for (let i = 0; i < count; i++) {
            this.elements.grid.appendChild(this.createColorCard());
        }
    }

    /**
     * Loads a specific preset into the grid.
     * @param {string} presetId
     */
    loadPreset(presetId) {
        this.showLoading('Loading preset...');

        setTimeout(() => {
            this._loadPresetContent(presetId);
        }, 50);
    }

    /**
     * Internal implementation of preset loading logic.
     * @private
     * @param {string} presetId 
     */
    _loadPresetContent(presetId) {
        let colorList = null;

        const allColorsPreset = PRESETS.flatMap(group => group.items).find(item => item.id === 'all-colors');
        if (allColorsPreset) {
            allColorsPreset.label = `All Web Colors (${WEB_COLORS.length})`;
            const option = this.elements.presetSelect.querySelector(`option[value="all-colors"]`);
            if (option) {
                option.textContent = allColorsPreset.label;
            }
        }

        if (presetId === 'all-colors') {
            colorList = [...WEB_COLORS];
        } else {
            for (const group of PRESETS) {
                const item = group.items.find(i => i.id === presetId);
                if (item) {
                    colorList = item.colors;
                    break;
                }
            }
        }

        if (!colorList) return;

        this.currentNumberOfCards = colorList.length;
        this.renderGrid(this.currentNumberOfCards);

        const exists = Array.from(this.elements.gridSizeSelect.options).some(opt => parseInt(opt.value) === this.currentNumberOfCards);
        if (exists) {
            this.elements.gridSizeSelect.value = this.currentNumberOfCards;
        } else {
            this.elements.gridSizeSelect.value = "";
        }

        const cards = this.elements.grid.querySelectorAll('.wcv-card');
        cards.forEach((card, i) => {
            const color = colorList[i] || '';
            const select = card.querySelector('.custom-select');
            this.setCustomSelectValue(select, color);
            this.updateColor(card, color);
        });
        this.updateGlobalButtonStates();
        this.saveState();
    }

    /**
     * Reorders existing cards based on selected property.
     * @param {'name'|'hue'|'luminance'} method
     */
    sortCards(method) {
        const cards = [...this.elements.grid.querySelectorAll('.wcv-card')];

        cards.sort((a, b) => {
            const valA = a.querySelector('.custom-select').dataset.value;
            const valB = b.querySelector('.custom-select').dataset.value;

            if (!valA && !valB) return 0;
            if (!valA) return 1;
            if (!valB) return -1;

            if (method === 'name') return valA.localeCompare(valB);

            const hslA = getHSL(valA);
            const hslB = getHSL(valB);

            if (method === 'hue') return hslA.h - hslB.h || hslA.s - hslB.s || hslA.l - hslB.l;
            if (method === 'luminance') return hslB.l - hslA.l;

            return 0;
        });

        cards.forEach(card => this.elements.grid.appendChild(card));
    }

    /**
     * Randomizes all currently visible color cards.
     */
    randomizePalette() {
        const cards = this.elements.grid.querySelectorAll('.wcv-card');
        let colorPool = [...WEB_COLORS];

        cards.forEach(card => {
            if (colorPool.length === 0) {
                colorPool = [...WEB_COLORS];
            }

            const randomIndex = Math.floor(Math.random() * colorPool.length);
            const randomColor = colorPool.splice(randomIndex, 1)[0];

            const select = card.querySelector('.custom-select');
            this.setCustomSelectValue(select, randomColor);
            this.updateColor(card, randomColor);
        });
        this.updateGlobalButtonStates();
        this.saveState();
    }

    /**
     * Resets the entire tool to its default state.
     */
    async clearAll() {
        if (await confirmReset('Web Color Viewer')) {
            this.currentNumberOfCards = APP_CONFIG.tools.webColorViewer.defaultCards;

            this.renderGrid(this.currentNumberOfCards);

            if (this.elements.gridSizeSelect) {
                this.elements.gridSizeSelect.value = this.currentNumberOfCards.toString();
            }

            const rainbowPreset = PRESETS.find(g => g.group === "The Spectra")
                ?.items.find(i => i.id === "rainbow7");
            const defaultColors = rainbowPreset ? rainbowPreset.colors.slice(0, 5) : [];

            const cards = this.elements.grid.querySelectorAll('.wcv-card');
            cards.forEach((card, i) => {
                const color = defaultColors[i] || '';
                const select = card.querySelector('.custom-select');
                this.setCustomSelectValue(select, color);
                this.updateColor(card, color);
            });

            this.elements.presetSelect.value = '';
            this.elements.sortSelect.value = '';

            this.updateGlobalButtonStates();
            this.saveState();

            showToast('Web Color Viewer has been reset.', 'info');
        }
    }

    /**
     * Copies the current list of colors to the clipboard.
     */
    copyList() {
        const selects = this.elements.grid.querySelectorAll('.custom-select');
        const colors = Array.from(selects)
            .map(s => s.dataset.value)
            .filter(v => v && v !== '')
            .join('\n');

        if (!colors) {
            return;
        }

        copyToClipboard(colors, this.elements.copyListBtn);
    }

    /**
     * Processes a list of imported color names.
     * @param {string} text - Raw input text from importer.
     */
    processImport(text) {
        const lines = text.split(/[\n,;]/).map(l => l.trim()).filter(l => l !== '');
        if (lines.length === 0) return;

        const validColors = lines.filter(colorName =>
            WEB_COLORS.some(wc => wc.toLowerCase() === colorName.toLowerCase())
        );

        if (validColors.length === 0) {
            showToast('No valid web colors found in the list!', 'error');
            return;
        }

        this.showLoading('Importing palette...');

        setTimeout(() => {
            this.currentNumberOfCards = validColors.length;
            this.elements.grid.innerHTML = '';
            validColors.forEach(colorName => {
                const card = this.createColorCard();
                this.elements.grid.appendChild(card);

                const select = card.querySelector('.custom-select');
                const matchedColor = WEB_COLORS.find(c => c.toLowerCase() === colorName.toLowerCase());

                this.setCustomSelectValue(select, matchedColor);
                this.updateColor(card, matchedColor);
            });

            if (validColors.length < lines.length) {
                showToast(`Imported ${validColors.length} colors (skipped ${lines.length - validColors.length} unknown).`, 'warning');
            } else {
                showToast(`Imported ${validColors.length} colors!`, 'success');
            }
            this.updateGlobalButtonStates();
            this.saveState();
        }, 50);
    }

    /**
     * Updates the status of global buttons (Copy, Reset).
     */
    updateGlobalButtonStates() {
        if (!this.elements.grid) return;

        const cards = this.elements.grid.querySelectorAll('.wcv-card');
        const selects = Array.from(cards).map(card => card.querySelector('.custom-select'));
        const currentColors = selects.map(s => s.dataset.value || '');
        const hasAnyColor = currentColors.some(v => v !== '');

        const defaultCount = APP_CONFIG.tools.webColorViewer.defaultCards;
        const rainbowPreset = PRESETS.find(g => g.group === "The Spectra")
            ?.items.find(i => i.id === "rainbow7");
        const defaultColors = rainbowPreset ? rainbowPreset.colors.slice(0, 5) : [];

        const isDefaultLength = currentColors.length === defaultCount;
        const isDefaultColors = isDefaultLength && currentColors.every((c, i) => c === (defaultColors[i] || ''));
        const isDefaultUI = (this.elements.presetSelect.value === '' || this.elements.presetSelect.value === null) &&
            (this.elements.sortSelect.value === '' || this.elements.sortSelect.value === null);

        const isDirty = !(isDefaultLength && isDefaultColors && isDefaultUI);

        this.elements.copyListBtn.disabled = !hasAnyColor;
        this.elements.resetAllBtn.disabled = !isDirty;
    }

    /**
     * Renders a loading animation in the grid.
     * @param {string} message
     */
    showLoading(message) {
        this.elements.grid.innerHTML = renderLoader(message);
    }

    /**
     * Saves current color state to localStorage.
     */
    saveState() {
        if (!GlobalSettings.canSaveData('web-color-viewer')) return;

        const cards = this.elements.grid.querySelectorAll('.wcv-card');
        const colors = Array.from(cards).map(card => {
            const select = card.querySelector('.custom-select');
            return select.dataset.value || '';
        });

        GlobalSettings.saveToolData('web-color-viewer', {
            colors: colors
        });
    }

    /**
     * Loads saved color state from localStorage.
     * @returns {boolean} True if state was loaded.
     */
    loadState() {
        if (!GlobalSettings.canSaveData('web-color-viewer')) return false;

        const data = GlobalSettings.getToolData('web-color-viewer');
        if (!data || !data.colors || !Array.isArray(data.colors)) return false;

        const colors = data.colors.filter(c =>
            c === '' || WEB_COLORS.some(wc => wc.toLowerCase() === c.toLowerCase())
        );

        if (colors.length === 0) return false;

        const validatedColors = colors.map(c => {
            if (c === '') return '';
            return WEB_COLORS.find(wc => wc.toLowerCase() === c.toLowerCase());
        });

        this.currentNumberOfCards = validatedColors.length;

        if (validatedColors.length > 50) {
            this.showLoading('Restoring palette...');
            setTimeout(() => this.finishLoadingState(validatedColors), 50);
        } else {
            this.finishLoadingState(validatedColors);
        }

        return true;
    }

    /**
     * Finalizes the loading of global state.
     * @param {Array} colors 
     */
    finishLoadingState(colors) {
        this.renderGrid(colors.length);
        const cards = this.elements.grid.querySelectorAll('.wcv-card');
        cards.forEach((card, i) => {
            const color = colors[i] || '';
            const select = card.querySelector('.custom-select');
            this.setCustomSelectValue(select, color);
            this.updateColor(card, color);
        });

        const exists = Array.from(this.elements.gridSizeSelect.options).some(opt => parseInt(opt.value) === this.currentNumberOfCards);
        if (exists) {
            this.elements.gridSizeSelect.value = this.currentNumberOfCards;
        } else {
            this.elements.gridSizeSelect.value = "";
        }
        this.updateGlobalButtonStates();
    }

    /**
     * Cleans up tool resources.
     */
    destroy() {
        if (this.destroySortable) {
            this.destroySortable();
        }
    }
}

export default WebColorViewer;

import { downloadBlob, createZipBlob, showToast, showInputFeedback, confirmReset, renderStats } from '../core.js';
import { setupDragAndDrop, copyToClipboard, toggleUploadArea } from '../utils/ui-utils.js';

//=============================================
// CSS Compare Tool
//=============================================

/**
 * Compares two CSS stylesheets to find shared rules, differences, and unique properties.
 */
class CSSComparator {
    constructor() {
        this.panel1 = document.getElementById('panel1');
        this.panel2 = document.getElementById('panel2');
        this.dropZone1 = document.getElementById('dropZone1');
        this.dropZone2 = document.getElementById('dropZone2');
        this.file1 = document.getElementById('file1');
        this.file2 = document.getElementById('file2');
        this.fileInfo1 = document.getElementById('fileInfo1');
        this.fileInfo2 = document.getElementById('fileInfo2');
        this.fileName1 = document.getElementById('fileName1');
        this.fileName2 = document.getElementById('fileName2');
        this.clearPanel1Btn = document.getElementById('clearPanel1');
        this.clearPanel2Btn = document.getElementById('clearPanel2');
        this.text1 = document.getElementById('text1');
        this.text2 = document.getElementById('text2');

        this.compareBtn = document.getElementById('compareBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.statsPanel = document.getElementById('statsPanel');
        this.commonResult = document.getElementById('commonResult');
        this.unique1Result = document.getElementById('unique1Result');
        this.unique2Result = document.getElementById('unique2Result');
        this.commonCount = document.getElementById('commonCount');
        this.unique1Count = document.getElementById('unique1Count');
        this.unique2Count = document.getElementById('unique2Count');
        this.unique1Title = document.getElementById('unique1Title');
        this.unique2Title = document.getElementById('unique2Title');

        this.downloadZipBtn = document.getElementById('downloadZipBtn');

        this.file1Name = null;
        this.file2Name = null;
        this._debounceTimers = {};
        this.isDirty = false;

        this.setupListeners();
    }

    /**
     * Attaches event listeners to interactive elements.
     */
    setupListeners() {
        this.compareBtn.addEventListener('click', () => this.runComparison());
        this.resetBtn.addEventListener('click', () => this.handleReset());
        this.downloadZipBtn.addEventListener('click', () => this.downloadZip());
        this.file1.addEventListener('change', (e) => this.handleFileUpload(e));
        this.file2.addEventListener('change', (e) => this.handleFileUpload(e));

        this.text1.addEventListener('input', () => {
            this.resultsContainer.style.display = 'none';
            this.isDirty = true;
            this.updateButtonStates();
            this.debouncedToggleUploadArea(1);
        });
        this.text2.addEventListener('input', () => {
            this.resultsContainer.style.display = 'none';
            this.isDirty = true;
            this.updateButtonStates();
            this.debouncedToggleUploadArea(2);
        });

        document.querySelector('.options-panel #intersectionMode')?.addEventListener('change', () => {
            if (this.resultsContainer.style.display !== 'none') {
                this.runComparison();
            }
        });

        this.dropZone1.addEventListener('click', () => this.file1.click());
        this.dropZone2.addEventListener('click', () => this.file2.click());

        this.clearPanel1Btn.addEventListener('click', () => this.clearPanel(1));
        this.clearPanel2Btn.addEventListener('click', () => this.clearPanel(2));

        document.querySelectorAll('#app .result-actions [data-filename]').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const filename = btn.dataset.filename;
                const content = document.getElementById(targetId).value;
                if (content.trim()) downloadBlob(new Blob([content], { type: 'text/css' }), filename);
            });
        });
        document.querySelectorAll('#app .result-actions [data-target]:not([data-filename])').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetId = e.target.dataset.target;
                const content = document.getElementById(targetId).value;
                if (content.trim()) await copyToClipboard(content, e.target);
            });
        });

        [
            { zone: this.dropZone1, panel: this.panel1, id: 'panel1', num: 1 },
            { zone: this.dropZone2, panel: this.panel2, id: 'panel2', num: 2 }
        ].forEach(({ zone, panel, id, num }) => {
            setupDragAndDrop(panel, zone, (e, dropZone) => {
                this.handleDrop(e, dropZone, id);
            }, () => this._doToggleUploadArea(num));
        });

        this._doToggleUploadArea(1);
        this._doToggleUploadArea(2);
        this.updateButtonStates();
    }

    /**
     * Debounces the upload area toggle to prevent excessive UI updates.
     * @param {number} panelNumber - 1 or 2
     */
    debouncedToggleUploadArea(panelNumber) {
        clearTimeout(this._debounceTimers[panelNumber]);
        this._debounceTimers[panelNumber] = setTimeout(() => this._doToggleUploadArea(panelNumber), 300);
    }

    /**
     * Shows or hides the upload area based on textarea content.
     * @param {number} panelNumber - 1 or 2
     */
    _doToggleUploadArea(panelNumber) {
        const textarea = panelNumber === 1 ? this.text1 : this.text2;
        const dropZone = panelNumber === 1 ? this.dropZone1 : this.dropZone2;
        const hasContent = textarea.value.trim().length > 0;
        const currentFileName = panelNumber === 1 ? this.file1Name : this.file2Name;

        toggleUploadArea(
            textarea,
            dropZone,
            hasContent,
            () => this.showFileInfo(panelNumber, currentFileName || "Custom code"),
            () => this.hideFileInfo(panelNumber)
        );
    }

    /**
     * Displays file information for a loaded stylesheet.
     * @param {number} panelNumber - 1 or 2
     * @param {string} name - The file name to display
     */
    showFileInfo(panelNumber, name) {
        const fileInfo = panelNumber === 1 ? this.fileInfo1 : this.fileInfo2;
        const fileName = panelNumber === 1 ? this.fileName1 : this.fileName2;
        fileName.textContent = name;
        fileInfo.classList.remove('d-none');
    }

    /**
     * Hides file information for a panel.
     * @param {number} panelNumber - 1 or 2
     */
    hideFileInfo(panelNumber) {
        const fileInfo = panelNumber === 1 ? this.fileInfo1 : this.fileInfo2;
        fileInfo.classList.add('d-none');
    }

    /**
     * Clears a panel back to its initial empty state.
     * @param {number} panelNumber - 1 or 2
     */
    clearPanel(panelNumber) {
        const textarea = panelNumber === 1 ? this.text1 : this.text2;
        const fileInput = panelNumber === 1 ? this.file1 : this.file2;
        const dropZone = panelNumber === 1 ? this.dropZone1 : this.dropZone2;

        this.resultsContainer.style.display = 'none';
        textarea.value = '';
        textarea.classList.remove('has-content');
        fileInput.value = '';
        this.isDirty = true;

        if (panelNumber === 1) {
            this.file1Name = null;
        } else {
            this.file2Name = null;
        }

        this.hideFileInfo(panelNumber);
        dropZone.classList.remove('hidden');
        this.updateButtonStates();
    }

    /**
     * Updates the enabled/disabled state of action buttons.
     */
    updateButtonStates() {
        const hasContent1 = this.text1.value.trim() !== '';
        const hasContent2 = this.text2.value.trim() !== '';

        this.compareBtn.disabled = !(hasContent1 && hasContent2);
        this.resetBtn.disabled = !(hasContent1 || hasContent2);
    }

    /**
     * Handles file drops onto the comparison panels.
     * @param {DragEvent} event
     * @param {HTMLElement} zone
     * @param {string} panelId
     */
    handleDrop(event, zone, panelId) {
        event.preventDefault();
        zone.classList.remove('dragover');
        const files = event.dataTransfer.files;
        const panelNumber = panelId === 'panel1' ? 1 : 2;

        if (files.length > 0) {
            const file = files[0];
            let success;
            if (panelId === 'panel1') {
                success = this.processFile(file, this.text1, this.file1, 1);
                if (!success) {
                    showInputFeedback(this.dropZone1, 'Invalid file type. Please use a .css file.', 'error');
                    this._doToggleUploadArea(1);
                }
            } else if (panelId === 'panel2') {
                success = this.processFile(file, this.text2, this.file2, 2);
                if (!success) {
                    showInputFeedback(this.dropZone2, 'Invalid file type. Please use a .css file.', 'error');
                    this._doToggleUploadArea(2);
                }
            }
        } else {
            this._doToggleUploadArea(panelNumber);
        }
    }

    /**
     * Handles standard file selection via input[type="file"].
     * @param {Event} event
     */
    handleFileUpload(event) {
        const fileInput = event.target;
        const file = fileInput.files[0];
        let success;

        if (fileInput.id === 'file1') {
            success = this.processFile(file, this.text1, this.file1, 1);
            if (!success) {
                showInputFeedback(this.dropZone1, 'Invalid file type. Please use a .css file.', 'error');
            }
        } else if (fileInput.id === 'file2') {
            success = this.processFile(file, this.text2, this.file2, 2);
            if (!success) {
                showInputFeedback(this.dropZone2, 'Invalid file type. Please use a .css file.', 'error');
            }
        }
    }

    /**
     * Validates and reads a CSS file.
     * @param {File} file
     * @param {HTMLTextAreaElement} textarea
     * @param {HTMLInputElement} fileInput
     * @param {number} fileNumber
     * @returns {boolean}
     */
    processFile(file, textarea, fileInput, fileNumber) {
        if (!file) return true;

        if (!file.name.toLowerCase().endsWith('.css')) {
            fileInput.value = '';
            return false;
        }

        if (fileNumber === 1) {
            this.file1Name = file.name;
        } else if (fileNumber === 2) {
            this.file2Name = file.name;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.resultsContainer.style.display = 'none';
            textarea.value = e.target.result;
            this.showFileInfo(fileNumber, file.name);
            this.isDirty = true;
            this._doToggleUploadArea(fileNumber);
            this.updateButtonStates();
        };
        reader.readAsText(file);
        return true;
    }

    /**
     * Parses CSS text into a structured map of rules and declarations.
     * @param {string} cssText
     * @returns {Map}
     */
    parseCSS(cssText) {
        cssText = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
        const rulesMap = new Map();

        const processRule = (selector, declarations, mediaQuery) => {
            const selectorKey = `${mediaQuery || 'none'}@@${selector.trim()}`;
            if (!rulesMap.has(selectorKey)) {
                rulesMap.set(selectorKey, new Map());
            }
            const declarationsMap = rulesMap.get(selectorKey);
            declarations.split(';').forEach(declaration => {
                if (declaration.trim()) {
                    const [prop, ...val] = declaration.split(':');
                    if (prop && val.length > 0) {
                        declarationsMap.set(prop.trim(), val.join(':').trim());
                    }
                }
            });
        };

        const keyframesRegex = /(@keyframes\s+[\w-]+)\s*\{([\s\S]*?})\s*}/g;
        const mediaRegex = /@media\s*(.*?)\s*\{([\s\S]*?})\s*}/g;
        const ruleRegex = /([^{}]+?)\s*\{([^{}]+?)}/g;

        let remainingCss = cssText;
        let match;

        while ((match = keyframesRegex.exec(cssText)) !== null) {
            const keyframeName = match[1];
            const keyframeContent = match[2].trim();
            rulesMap.set(`keyframes@@${keyframeName}`, keyframeContent);
            remainingCss = remainingCss.replace(match[0], '');
        }

        let mediaCss = remainingCss;
        while ((match = mediaRegex.exec(mediaCss)) !== null) {
            const mediaQuery = match[1].trim();
            const mediaContent = match[2];
            remainingCss = remainingCss.replace(match[0], '');

            let mediaRuleMatch;
            while ((mediaRuleMatch = ruleRegex.exec(mediaContent)) !== null) {
                mediaRuleMatch[1].split(',').forEach(selector => {
                    processRule(selector, mediaRuleMatch[2], mediaQuery);
                });
            }
            ruleRegex.lastIndex = 0;
        }

        while ((match = ruleRegex.exec(remainingCss)) !== null) {
            match[1].split(',').forEach(selector => {
                processRule(selector, match[2], 'none');
            });
        }

        return rulesMap;
    }

    /**
     * Compares two sets of CSS rules to find commonality and differences.
     * @param {Map} map1
     * @param {Map} map2
     * @param {boolean} isIntersection - Whether to find shared properties within differing rules.
     * @returns {Object} { common, unique1, unique2 }
     */
    compare(map1, map2, isIntersection) {
        const common = new Map();
        const unique1 = new Map(map1);
        const unique2 = new Map(map2);

        for (const [key, value1] of unique1.entries()) {
            if (unique2.has(key)) {
                const value2 = unique2.get(key);

                if (key.startsWith('keyframes@@')) {
                    if (value1.replace(/\s/g, '') === value2.replace(/\s/g, '')) {
                        common.set(key, value1);
                        unique1.delete(key);
                        unique2.delete(key);
                    }
                }
                else {
                    const sortedDecls1 = [...value1.entries()].sort().toString();
                    const sortedDecls2 = [...value2.entries()].sort().toString();

                    if (sortedDecls1 === sortedDecls2) {
                        common.set(key, value1);
                        unique1.delete(key);
                        unique2.delete(key);
                    } else if (isIntersection) {
                        const intersectionDecls = new Map();
                        const uniqueDecls1 = new Map(value1);
                        const uniqueDecls2 = new Map(value2);
                        for (const [prop, val] of value1.entries()) {
                            if (value2.has(prop) && value2.get(prop) === val) {
                                intersectionDecls.set(prop, val);
                                uniqueDecls1.delete(prop);
                                uniqueDecls2.delete(prop);
                            }
                        }
                        if (intersectionDecls.size > 0) common.set(key, intersectionDecls);
                        if (uniqueDecls1.size > 0) unique1.set(key, uniqueDecls1);
                        else unique1.delete(key);
                        if (uniqueDecls2.size > 0) unique2.set(key, uniqueDecls2);
                        else unique2.delete(key);
                    }
                }
            }
        }
        return { common, unique1, unique2 };
    }

    /**
     * Converst a rules map back into a CSS string.
     * @param {Map} rulesMap
     * @returns {string}
     */
    formatCSS(rulesMap) {
        let cssString = '';
        const mediaGroups = new Map();

        for (const [key, value] of rulesMap.entries()) {
            if (key.startsWith('keyframes@@')) {
                const keyframeName = key.split('@@')[1];
                cssString += `${keyframeName} {\n${value}\n}\n\n`;
            }
            else {
                const [mediaQuery, selector] = key.split('@@');
                if (!mediaGroups.has(mediaQuery)) mediaGroups.set(mediaQuery, []);
                mediaGroups.get(mediaQuery).push({ selector, declarations: value });
            }
        }

        if (mediaGroups.has('none')) {
            mediaGroups.get('none').forEach(({ selector, declarations }) => {
                cssString += `${selector} {\n`;
                declarations.forEach((val, prop) => cssString += `    ${prop}: ${val};\n`);
                cssString += `}\n\n`;
            });
        }

        mediaGroups.forEach((rules, mediaQuery) => {
            if (mediaQuery !== 'none' && rules.length > 0) {
                cssString += `@media ${mediaQuery} {\n`;
                rules.forEach(({ selector, declarations }) => {
                    cssString += `    ${selector} {\n`;
                    declarations.forEach((val, prop) => cssString += `        ${prop}: ${val};\n`);
                    cssString += `    }\n`;
                });
                cssString += `}\n\n`;
            }
        });

        return cssString.trim();
    }

    /**
     * Updates the UI with comparison results and statistics.
     * @param {Object} results
     * @param {number} total1
     * @param {number} total2
     * @param {string} css1
     * @param {string} css2
     */
    displayResults(results, total1, total2, css1, css2) {
        const fileName1 = this.file1Name || 'File 1';
        const fileName2 = this.file2Name || 'File 2';
        this.unique1Title.textContent = `Unique to [${fileName1}]`;
        this.unique2Title.textContent = `Unique to [${fileName2}]`;

        const commonContent = this.formatCSS(results.common);
        const unique1Content = this.formatCSS(results.unique1);
        const unique2Content = this.formatCSS(results.unique2);

        this.commonResult.value = commonContent;
        this.unique1Result.value = unique1Content;
        this.unique2Result.value = unique2Content;

        const commonBox = this.commonResult.closest('.result-box');
        commonBox.querySelector('.result-actions [data-filename]').disabled = !commonContent.trim();
        commonBox.querySelector('.result-actions [data-target]:not([data-filename])').disabled = !commonContent.trim();

        const unique1Box = this.unique1Result.closest('.result-box');
        unique1Box.querySelector('.result-actions [data-filename]').disabled = !unique1Content.trim();
        unique1Box.querySelector('.result-actions [data-target]:not([data-filename])').disabled = !unique1Content.trim();

        const unique2Box = this.unique2Result.closest('.result-box');
        unique2Box.querySelector('.result-actions [data-filename]').disabled = !unique2Content.trim();
        unique2Box.querySelector('.result-actions [data-target]:not([data-filename])').disabled = !unique2Content.trim();

        const commonCount = results.common.size;
        const unique1Count = results.unique1.size;
        const unique2Count = results.unique2.size;
        this.commonCount.textContent = commonCount;
        this.unique1Count.textContent = unique1Count;
        this.unique2Count.textContent = unique2Count;

        const label1 = this.file1Name ? `<span class="text-truncate stat-label-text" title="Total Rules ${this.file1Name}">Total Rules ${this.file1Name}</span>` : 'Total Rules File 1';
        const label2 = this.file2Name ? `<span class="text-truncate stat-label-text" title="Total Rules ${this.file2Name}">Total Rules ${this.file2Name}</span>` : 'Total Rules File 2';

        const uniqueLabel1 = this.file1Name ? `<span class="text-truncate stat-label-text" title="Unique to ${this.file1Name}">Unique to ${this.file1Name}</span>` : 'Unique to File 1';
        const uniqueLabel2 = this.file2Name ? `<span class="text-truncate stat-label-text" title="Unique to ${this.file2Name}">Unique to ${this.file2Name}</span>` : 'Unique to File 2';

        renderStats(this.statsPanel, [
            { value: total1, label: label1 },
            { value: total2, label: label2 },
            { value: commonCount, label: 'Common Rules' },
            { value: unique1Count, label: uniqueLabel1 },
            { value: unique2Count, label: uniqueLabel2 }
        ]);

        this.resultsContainer.style.display = 'block';
    }

    /**
     * Orchestrates the comparison process.
     */
    runComparison() {
        this.isDirty = false;
        this.updateButtonStates();

        const css1 = this.text1.value;
        const css2 = this.text2.value;
        const isIntersection = document.getElementById('intersectionMode').checked;

        const target1 = this.text1.classList.contains('has-content') ? this.text1 : this.dropZone1;
        const target2 = this.text2.classList.contains('has-content') ? this.text2 : this.dropZone2;

        const validateCSS = (css, target, fileNum) => {
            if (!css.trim()) {
                showInputFeedback(target, `Please provide content for File ${fileNum}.`, 'error');
                return false;
            }
            if (!/[{}]/.test(css) && !css.trim().startsWith('@')) {
                showInputFeedback(target, `No valid CSS structure detected in File ${fileNum}.`, 'error');
                return false;
            }
            return true;
        };

        const isValid1 = validateCSS(css1, target1, 1);
        const isValid2 = validateCSS(css2, target2, 2);

        if (!isValid1 || !isValid2) {
            this.resultsContainer.style.display = 'none';
            return;
        }

        const parsed1 = this.parseCSS(css1);
        const parsed2 = this.parseCSS(css2);

        if (parsed1.size === 0) {
            this.resultsContainer.style.display = 'none';
            showInputFeedback(target1, 'No comparable CSS rules found in File 1 (e.g. only comments or empty blocks).', 'warning');
            return;
        }
        if (parsed2.size === 0) {
            this.resultsContainer.style.display = 'none';
            showInputFeedback(target2, 'No comparable CSS rules found in File 2 (e.g. only comments or empty blocks).', 'warning');
            return;
        }

        target1.classList.remove('error', 'warning');
        target2.classList.remove('error', 'warning');

        const results = this.compare(parsed1, parsed2, isIntersection);
        this.displayResults(results, parsed1.size, parsed2.size, css1, css2);
    }

    /**
     * Generates a ZIP file containing the comparison results.
     */
    downloadZip() {
        const files = [];
        const commonContent = this.commonResult.value.trim();
        const unique1Content = this.unique1Result.value.trim();
        const unique2Content = this.unique2Result.value.trim();

        if (commonContent) files.push({ name: 'common.css', content: commonContent });
        if (unique1Content) files.push({ name: 'unique_1.css', content: unique1Content });
        if (unique2Content) files.push({ name: 'unique_2.css', content: unique2Content });

        if (files.length === 0) return;

        const baseName = 'css_comparison';
        const zipName = `${baseName}.zip`;
        const zipBlob = createZipBlob(files);
        downloadBlob(zipBlob, zipName);
    }

    /**
     * Initiates the tool reset process.
     * @async
     */
    async handleReset() {
        if (await confirmReset('CSS Compare')) {
            this.reset();
            showToast('CSS Compare has been reset.', 'info');
        }
    }

    /**
     * Resets the tool to its initial state.
     */
    reset() {
        this.resultsContainer.style.display = 'none';
        const intersectionCheck = document.getElementById('intersectionMode');
        if (intersectionCheck) intersectionCheck.checked = true;
        this.clearPanel(1);
        this.clearPanel(2);
        this.commonResult.value = '';
        this.unique1Result.value = '';
        this.unique2Result.value = '';
        this.unique1Title.textContent = 'Unique to File 1';
        this.unique2Title.textContent = 'Unique to File 2';
    }
}

export default CSSComparator;

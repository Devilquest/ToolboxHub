import { switchTab, downloadBlob, createZipBlob, showToast, showInputFeedback, confirmReset, dedent, renderStats, setupThemeToggle } from '../core.js';
import { setupDragAndDrop, toggleUploadArea } from '../utils/ui-utils.js';

//=============================================
// HTML Extractor Tool
//=============================================

/**
 * Tool to extract inline CSS and JS blocks from an HTML file, allowing them to be saved separately.
 */
class HTMLExtractor {
    constructor() {
        this.elements = {
            inputContainer: document.getElementById('inputContainer'),
            resultsContainer: document.getElementById('resultsContainer'),
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            pasteArea: document.getElementById('pasteArea'),
            pasteAreaContainer: document.getElementById('pasteAreaContainer'),
            fileInfo: document.getElementById('fileInfo'),
            fileNameDisplay: document.getElementById('fileNameDisplay'),
            clearFileBtn: document.getElementById('clearFileBtn'),
            extractBtn: document.getElementById('extractBtn'),
            resetInputBtn: document.getElementById('resetInputBtn'),
            resetBtn: document.getElementById('resetBtn'),
            stats: document.getElementById('stats'),
            tabs: document.querySelectorAll('.tab'),
            tabContents: document.querySelectorAll('.tab-content'),
            htmlOutput: document.getElementById('htmlOutput'),
            cssOutput: document.getElementById('cssOutput'),
            jsOutput: document.getElementById('jsOutput'),
            htmlFilename: document.getElementById('htmlFilename'),
            cssFilename: document.getElementById('cssFilename'),
            jsFilename: document.getElementById('jsFilename'),
            downloadHtmlBtn: document.getElementById('downloadHtmlBtn'),
            downloadCssBtn: document.getElementById('downloadCssBtn'),
            downloadJsBtn: document.getElementById('downloadJsBtn'),
            downloadZipBtn: document.getElementById('downloadZipBtn'),
            previewFrame: document.getElementById('livePreview'),
            previewContainer: document.getElementById('previewContainer'),
            togglePreviewTheme: document.getElementById('togglePreviewTheme'),
            useFoldersCheckbox: document.getElementById('useFoldersCheckbox'),
        };

        this.previewTheme = 'dark';

        this.originalFilename = 'Custom code';
        this.originalHtmlContent = null;
        this.extracted = { html: '', css: '', js: '' };
        this.isDirty = true;
        this._debounceTimer = null;
        this._processTimer = null;
        this.errorTimeout = null;

        this.init();
    }

    /**
     * Initializes the tool logic and listeners.
     */
    init() {
        this.addEventListeners();
        this.toggleUploadArea();
        this.updateButtonState();
    }

    /**
     * Attaches event listeners to the component elements.
     */
    addEventListeners() {
        this.elements.uploadArea.addEventListener('click', (e) => {
            if (e.target !== this.elements.fileInput) {
                this.elements.fileInput.click();
            }
        });
        this.elements.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        this.elements.pasteArea.addEventListener('input', () => {
            this.elements.resultsContainer.style.display = 'none';
            this.originalFilename = 'Custom code';
            this.isDirty = true;
            this.debouncedToggleUploadArea();
            this.updateButtonState();
        });

        setupDragAndDrop(this.elements.inputContainer, this.elements.uploadArea, (e) => {
            const file = e.dataTransfer.files[0];
            if (file) {
                this.processFile(file);
            } else {
                this.toggleUploadArea();
            }
        }, () => this.toggleUploadArea());

        this.elements.clearFileBtn.addEventListener('click', () => this.clearFile());

        this.elements.resetInputBtn.addEventListener('click', this.handleReset.bind(this));

        this.elements.extractBtn.addEventListener('click', () => {
            const content = this.elements.pasteArea.value;
            if (content) this.processHTML(content);
        });

        this.elements.resetBtn?.addEventListener('click', this.handleReset.bind(this));
        this.elements.tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

        this.elements.downloadHtmlBtn.addEventListener('click', () => {
            const blob = new Blob([this.extracted.html], { type: 'text/html' });
            downloadBlob(blob, this.elements.htmlFilename.value);
        });
        this.elements.downloadCssBtn.addEventListener('click', () => {
            const blob = new Blob([this.extracted.css], { type: 'text/css' });
            downloadBlob(blob, this.elements.cssFilename.value);
        });
        this.elements.downloadJsBtn.addEventListener('click', () => {
            const blob = new Blob([this.extracted.js], { type: 'application/javascript' });
            downloadBlob(blob, this.elements.jsFilename.value);
        });
        this.elements.downloadZipBtn.addEventListener('click', this.downloadAllAsZip.bind(this));

        this.elements.useFoldersCheckbox.addEventListener('change', this.handleOptionsChange.bind(this));

        setupThemeToggle(this.elements.togglePreviewTheme, this.elements.previewContainer, 'dark');
    }

    /**
     * Implementation of debounced upload area toggle.
     */
    debouncedToggleUploadArea() {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => this.toggleUploadArea(), 300);
    }

    /**
     * Updates the status of action buttons based on input validity.
     */
    updateButtonState() {
        const hasContent = this.elements.pasteArea.value.trim().length > 0;
        if (this.elements.extractBtn) {
            this.elements.extractBtn.disabled = !hasContent;
        }
        if (this.elements.resetInputBtn) {
            this.elements.resetInputBtn.disabled = !hasContent;
        }
    }

    /**
     * Toggles between the upload area and the paste area based on content.
     */
    toggleUploadArea() {
        const hasContent = this.elements.pasteArea.value.trim().length > 0;
        toggleUploadArea(
            this.elements.pasteArea,
            this.elements.uploadArea,
            hasContent,
            () => this.showFileInfo(this.originalFilename || "Custom code"),
            () => this.hideFileInfo()
        );
    }

    /**
     * Displays information about the currently selected file.
     * @param {string} name
     */
    showFileInfo(name) {
        this.elements.fileNameDisplay.textContent = name;
        this.elements.fileInfo.classList.remove('d-none');
    }

    /**
     * Hides the file information display.
     */
    hideFileInfo() {
        this.elements.fileInfo.classList.add('d-none');
    }

    /**
     * Clears the current file selection and input content.
     */
    clearFile() {
        this.elements.pasteArea.value = '';
        this.elements.fileInput.value = '';
        this.originalFilename = 'Custom code';
        this.originalHtmlContent = null;
        this.isDirty = true;
        this.toggleUploadArea();
        this.updateButtonState();
        this.elements.resultsContainer.style.display = 'none';
    }

    /**
     * Handles changes to extraction options.
     */
    handleOptionsChange() {
        if (this.originalHtmlContent) {
            this.processHTML(this.originalHtmlContent);
        }
    }

    /**
     * Handles file selection from input.
     * @param {Event} e
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    /**
     * Processes a selected file.
     * @param {File} file
     */
    processFile(file) {
        if (!file) return;

        if (!/\.html?$/i.test(file.name)) {
            const target = this.elements.uploadArea.classList.contains('hidden') ? this.elements.pasteArea : this.elements.uploadArea;
            showInputFeedback(target, 'Invalid file type. Please upload an HTML file (.html or .htm).', 'error');
            this.elements.fileInput.value = '';
            this.toggleUploadArea();
            return;
        }

        this.originalFilename = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.resultsContainer.style.display = 'none';
            const content = e.target.result;
            this.elements.pasteArea.value = content;
            this.isDirty = true;
            this.toggleUploadArea();
            this.updateButtonState();
        };
        reader.readAsText(file);
    }

    /**
     * Core logic to extract CSS and JS from an HTML string.
     * @param {string} htmlString
     */
    processHTML(htmlString) {
        this.isDirty = false;
        this.updateButtonState();

        const target = this.elements.uploadArea.classList.contains('hidden') ? this.elements.pasteArea : this.elements.uploadArea;

        if (!/<[a-z][\s\S]*>/i.test(htmlString)) {
            this.elements.resultsContainer.style.display = 'none';
            if (htmlString.trim().length > 0) {
                showInputFeedback(target, 'No valid HTML tags detected. Please provide HTML code.', 'error');
            }
            return;
        }

        target.classList.remove('error', 'warning');

        this.originalHtmlContent = htmlString;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        if (!doc.head) {
            const head = doc.createElement('head');
            if (doc.documentElement) doc.documentElement.prepend(head);
        }
        if (!doc.body) {
            const body = doc.createElement('body');
            if (doc.documentElement) doc.documentElement.appendChild(body);
        }

        const styleNodes = doc.querySelectorAll('style');
        const scriptNodes = doc.querySelectorAll('script:not([src])');

        if (styleNodes.length === 0 && scriptNodes.length === 0) {
            this.elements.resultsContainer.style.display = 'none';
            showInputFeedback(target, 'No <style> or <script> blocks found to extract.', 'warning');
            return;
        }

        let cssContent = Array.from(styleNodes)
            .map(node => dedent(node.innerHTML))
            .join('\n\n/* --- Next Style Block --- */\n\n');
        styleNodes.forEach(node => {
            if (node.previousSibling && node.previousSibling.nodeType === Node.TEXT_NODE &&
                node.previousSibling.textContent.match(/^\s*\n\s*$/)) {
                node.previousSibling.remove();
            }
            node.remove();
        });
        let jsContent = Array.from(scriptNodes)
            .filter(node => node.innerHTML.trim())
            .map(node => dedent(node.innerHTML))
            .join('\n\n// --- Next Script Block ---\n\n');
        scriptNodes.forEach(node => {
            if (node.previousSibling && node.previousSibling.nodeType === Node.TEXT_NODE &&
                node.previousSibling.textContent.match(/^\s*\n\s*$/)) {
                node.previousSibling.remove();
            }
            node.remove();
        });
        this.extracted.css = cssContent.trim();
        this.extracted.js = jsContent.trim();

        const hasDoctype = htmlString.trim().toLowerCase().startsWith('<!doctype html');
        let cleanedHtml = (hasDoctype ? '<!DOCTYPE html>\n' : '') + doc.documentElement.outerHTML;

        const useFolders = this.elements.useFoldersCheckbox.checked;
        if (this.extracted.css) {
            const cssFilename = this.elements.cssFilename.value;
            const cssLinkHref = useFolders ? `styles/${cssFilename}` : cssFilename;
            const linkTag = `<link rel="stylesheet" href="${cssLinkHref}">`;
            const comment = `<!-- Extracted Style -->`;
            cleanedHtml = cleanedHtml.replace(/(\s*)<\/head>/i, (match, whitespace) => {
                const lastNewline = whitespace.lastIndexOf('\n');
                const indent = lastNewline > -1 ? whitespace.substring(lastNewline + 1) : whitespace;
                const childIndent = indent + '    ';
                return `\n${childIndent}\n${childIndent}${comment}\n${childIndent}${linkTag}\n${indent}</head>`;
            });
        }
        if (this.extracted.js) {
            const jsFilename = this.elements.jsFilename.value;
            const jsScriptSrc = useFolders ? `scripts/${jsFilename}` : jsFilename;
            const scriptTag = `<script src="${jsScriptSrc}" defer=""><\/script>`;
            const comment = `<!-- Extracted Script -->`;
            cleanedHtml = cleanedHtml.replace(/(\s*)<\/body>/i, (match, whitespace) => {
                const lastNewline = whitespace.lastIndexOf('\n');
                const indent = lastNewline > -1 ? whitespace.substring(lastNewline + 1) : whitespace;
                const childIndent = indent + '    ';
                return `\n${childIndent}\n${childIndent}${comment}\n${childIndent}${scriptTag}\n${indent}</body>`;
            });
        }

        cleanedHtml = cleanedHtml.replace(/<\/body>(\s*)<\/html>/i, '</body>\n</html>');
        this.extracted.html = cleanedHtml;

        this.displayResults({
            styleBlocks: styleNodes.length,
            scriptBlocks: scriptNodes.length
        });
    }

    /**
     * Updates the UI to show the extraction results.
     * @param {Object} stats
     */
    displayResults(stats) {
        this.elements.htmlOutput.value = this.extracted.html;
        this.elements.cssOutput.value = this.extracted.css;
        this.elements.jsOutput.value = this.extracted.js;
        this.elements.resultsContainer.style.display = 'block';
        this.toggleUploadArea();
        this.updateStats(stats);
        this.updatePreview();
    }

    /**
     * Updates the stats display.
     * @param {Object} counts
     */
    updateStats(counts) {
        const cssChars = this.extracted.css.length;
        const cssLines = this.extracted.css ? this.extracted.css.split('\n').length : 0;
        const jsChars = this.extracted.js.length;
        const jsLines = this.extracted.js ? this.extracted.js.split('\n').length : 0;

        renderStats(this.elements.stats, [
            { value: counts.styleBlocks, label: '&lt;style&gt; Blocks' },
            { value: counts.scriptBlocks, label: '&lt;script&gt; Blocks' },
            { value: `${cssChars.toLocaleString()} / ${cssLines.toLocaleString()}`, label: 'CSS Chars/Lines' },
            { value: `${jsChars.toLocaleString()} / ${jsLines.toLocaleString()}`, label: 'JS Chars/Lines' }
        ]);
    }

    /**
     * Updates the live preview with the currently extracted code.
     */
    updatePreview() {
        let previewHtml = this.extracted.html;
        const useFolders = this.elements.useFoldersCheckbox.checked;

        if (this.extracted.css) {
            const cssFilename = this.elements.cssFilename.value;
            const cssLinkHref = useFolders ? `styles/${cssFilename}` : cssFilename;
            const linkTag = `<link rel="stylesheet" href="${cssLinkHref}">`;
            previewHtml = previewHtml.replace(linkTag, `<style>${this.extracted.css}</style>`);
        }

        if (this.extracted.js) {
            const jsFilename = this.elements.jsFilename.value;
            const jsScriptSrc = useFolders ? `scripts/${jsFilename}` : jsFilename;
            const scriptTag = `<script src="${jsScriptSrc}" defer=""><\/script>`;
            // We escape </script> to avoid breaking the preview if it appears inside the JS code (e.g. in strings)
            const safeJs = this.extracted.js.replace(/<\/script>/gi, '<\\/script>');
            previewHtml = previewHtml.replace(scriptTag, `<script>${safeJs}</script>`);
        }

        this.elements.previewFrame.srcdoc = previewHtml;
    }

    /**
     * Handles tool reset with confirmation.
     */
    async handleReset() {
        if (await confirmReset('HTML Extractor')) {
            this.reset();
            showToast('HTML Extractor has been reset.', 'info');
        }
    }

    /**
     * Resets the tool to its baseline state.
     */
    reset() {
        this.elements.fileInput.value = '';
        this.elements.pasteArea.value = '';
        this.originalFilename = 'Custom code';
        this.originalHtmlContent = null;
        this.extracted = { html: '', css: '', js: '' };
        this.elements.resultsContainer.style.display = 'none';
        this.toggleUploadArea();
        this.updateButtonState();
        if (this.elements.useFoldersCheckbox) this.elements.useFoldersCheckbox.checked = true;
        switchTab('html');
    }

    /**
     * Packs all extracted files into a ZIP and initiates download.
     */
    downloadAllAsZip() {
        const useFolders = this.elements.useFoldersCheckbox.checked;
        const cssFilename = this.elements.cssFilename.value;
        const jsFilename = this.elements.jsFilename.value;
        const htmlFilename = this.elements.htmlFilename.value;
        const cssZipPath = useFolders ? `styles/${cssFilename}` : cssFilename;
        const jsZipPath = useFolders ? `scripts/${jsFilename}` : jsFilename;
        const files = [
            { name: htmlFilename, content: this.extracted.html },
            { name: cssZipPath, content: this.extracted.css },
            { name: jsZipPath, content: this.extracted.js },
        ].filter(f => f.content);
        if (files.length === 0) return;
        const baseName = this.originalFilename.substring(0, this.originalFilename.lastIndexOf('.')) || this.originalFilename;
        const zipName = `${baseName}.zip`;
        const zipBlob = createZipBlob(files);
        downloadBlob(zipBlob, zipName);
    }

    /**
     * Tool cleanup.
     */
    destroy() { if (this.errorTimeout) clearTimeout(this.errorTimeout); }
}

export default HTMLExtractor;

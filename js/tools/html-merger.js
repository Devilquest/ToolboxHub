import { downloadBlob, showToast, switchTab, FileList, showInputFeedback, confirmReset, renderStats, setupThemeToggle } from '../core.js';
import { readFileAsText } from '../utils/file-utils.js';
import { setupDragAndDrop, copyToClipboard } from '../utils/ui-utils.js';

//=============================================
// HTML Merger Tool
//=============================================

/**
 * Combines HTML, CSS, and JS files into a single, standalone HTML document.
 */
class HTMLMerger {
    constructor() {
        this.files = {
            html: null,
            css: [],
            js: []
        };
        this.mergedContent = null;
        this.errorTimeouts = {};

        this.validExtensions = {
            html: '.html',
            css: '.css',
            js: '.js'
        };

        this.initDOM();
        this.initFileListComponents();
        this.initializeEventListeners();
    }

    /**
     * Initializes DOM elements used by the component.
     */
    initDOM() {
        this.dom = {
            panels: {
                html: {
                    panel: document.getElementById('htmlPanel'),
                    dropZone: document.getElementById('htmlDropZone'),
                    fileInput: document.getElementById('htmlFileInput'),
                    fileList: document.getElementById('htmlFileList')
                },
                css: {
                    panel: document.getElementById('cssPanel'),
                    dropZone: document.getElementById('cssDropZone'),
                    fileInput: document.getElementById('cssFileInput'),
                    fileList: document.getElementById('cssFileList')
                },
                js: {
                    panel: document.getElementById('jsPanel'),
                    dropZone: document.getElementById('jsDropZone'),
                    fileInput: document.getElementById('jsFileInput'),
                    fileList: document.getElementById('jsFileList')
                }
            },
            mergeBtn: document.getElementById('mergeBtn'),
            resetBtn: document.getElementById('resetBtn'),
            outputContainer: document.getElementById('outputContainer'),
            mergedCode: document.getElementById('mergedCode'),
            livePreview: document.getElementById('livePreview'),
            previewContainer: document.getElementById('previewContainer'),
            togglePreviewTheme: document.getElementById('togglePreviewTheme'),
            downloadBtn: document.getElementById('downloadBtn'),
            copyBtn: document.getElementById('copyBtn'),
            statsPanel: document.getElementById('stats')
        };
    }

    /**
     * Initializes custom FileList components for each file type.
     */
    initFileListComponents() {
        this.fileLists = {
            html: new FileList(this.dom.panels.html.fileList, {
                onRemove: () => {
                    this.files.html = null;
                    this.mergedContent = null;
                    this.dom.outputContainer.style.display = 'none';
                    this.updateButtonState();
                }
            }),
            css: new FileList(this.dom.panels.css.fileList, {
                onRemove: (index) => {
                    this.files.css.splice(index, 1);
                    this.mergedContent = null;
                    this.dom.outputContainer.style.display = 'none';
                    this.updateButtonState();
                }
            }),
            js: new FileList(this.dom.panels.js.fileList, {
                onRemove: (index) => {
                    this.files.js.splice(index, 1);
                    this.mergedContent = null;
                    this.dom.outputContainer.style.display = 'none';
                    this.updateButtonState();
                }
            })
        };
    }

    /**
     * Attaches event listeners to the component elements.
     */
    initializeEventListeners() {
        this.dom.mergeBtn.addEventListener('click', () => this.mergeFiles());
        this.dom.resetBtn.addEventListener('click', () => this.handleReset());
        this.dom.downloadBtn.addEventListener('click', () => {
            if (!this.mergedContent) return;
            const blob = new Blob([this.mergedContent], { type: 'text/html' });
            downloadBlob(blob, 'merged.html');
        });
        this.dom.copyBtn.addEventListener('click', async () => {
            if (!this.mergedContent) return;
            await copyToClipboard(this.mergedContent, this.dom.copyBtn);
        });

        Object.entries(this.dom.panels).forEach(([type, elements]) => {
            elements.dropZone.addEventListener('click', () => elements.fileInput.click());
            elements.fileInput.addEventListener('change', e => this.handleFileSelect(e, type));

            setupDragAndDrop(elements.panel, elements.dropZone, (e, zone) => {
                this.handleDrop(e, zone, type);
            });
        });

        document.querySelectorAll('#app .tab').forEach(tab => {
            tab.addEventListener('click', e => switchTab(e.target.dataset.tab));
        });

        this.previewTheme = 'dark';
        setupThemeToggle(this.dom.togglePreviewTheme, this.dom.previewContainer, 'dark');
    }

    /**
     * Handles drag over events on drop zones.
     * @param {DragEvent} event
     * @param {HTMLElement} dropZone
     */
    handleDragOver(event, dropZone) { event.preventDefault(); dropZone.classList.add('dragover'); }

    /**
     * Handles drag leave events on drop zones.
     * @param {DragEvent} event
     * @param {HTMLElement} dropZone
     */
    handleDragLeave(event, dropZone) { event.preventDefault(); dropZone.classList.remove('dragover'); }

    /**
     * Handles file drops on drop zones.
     * @param {DragEvent} event
     * @param {HTMLElement} dropZone
     * @param {string} type - 'html', 'css', or 'js'.
     */
    handleDrop(event, dropZone, type) {
        const files = event.dataTransfer.files;
        this.addFiles(files, type);
    }

    /**
     * Handles manual file selection via input.
     * @param {Event} event
     * @param {string} type - 'html', 'css', or 'js'.
     */
    handleFileSelect(event, type) {
        const files = event.target.files;
        this.addFiles(files, type);
    }

    /**
     * Validates and adds files to the internal state.
     * @param {FileList} fileList
     * @param {string} type - 'html', 'css', or 'js'.
     */
    addFiles(fileList, type) {
        const acceptedFiles = [];
        const rejectedFiles = [];
        const extension = this.validExtensions[type];
        Array.from(fileList).forEach(file => {
            if (file.name.toLowerCase().endsWith(extension)) acceptedFiles.push(file);
            else rejectedFiles.push(file.name);
        });
        if (rejectedFiles.length > 0) showInputFeedback(this.dom.panels[type].dropZone, `Invalid file type. Only ${extension} files are allowed.`, 'error');
        if (acceptedFiles.length === 0) return;

        if (type === 'html') this.files.html = acceptedFiles[0];
        else this.files[type].push(...acceptedFiles);

        this.dom.outputContainer.style.display = 'none';
        this.fileLists[type].update(type === 'html' ? this.files.html : this.files[type]);
        this.updateButtonState();
    }

    /**
     * Updates action button states based on current file selection.
     */
    updateButtonState() {
        const isMergeable = this.files.html && (this.files.css.length > 0 || this.files.js.length > 0);
        this.dom.mergeBtn.disabled = !isMergeable;
        const hasFiles = this.files.html || this.files.css.length > 0 || this.files.js.length > 0;
        this.dom.resetBtn.disabled = !hasFiles;
    }

    /**
     * Performs the merging logic by reading all file contents and injecting them into the HTML document.
     * @async
     */
    async mergeFiles() {
        try {
            let htmlText = await readFileAsText(this.files.html);
            const cssContents = await Promise.all(this.files.css.map(file => readFileAsText(file)));
            const jsContents = await Promise.all(this.files.js.map(file => readFileAsText(file)));

            const combinedCss = cssContents.join('\n');
            const combinedJs = jsContents.join('\n');

            if (combinedCss) {
                const styleTag = `\n<style>\n${combinedCss}\n</style>\n`;
                if (htmlText.includes('</head>')) {
                    htmlText = htmlText.replace('</head>', `${styleTag}</head>`);
                } else {
                    htmlText += styleTag;
                }
            }

            if (combinedJs) {
                const scriptTag = `\n<script>\n${combinedJs}\n</script>\n`;
                if (htmlText.includes('</body>')) {
                    htmlText = htmlText.replace('</body>', `${scriptTag}</body>`);
                } else {
                    htmlText += scriptTag;
                }
            }

            this.mergedContent = htmlText;
            this.dom.mergedCode.value = htmlText;
            this.dom.livePreview.srcdoc = htmlText;

            const originalHtmlText = await readFileAsText(this.files.html);
            const htmlSize = new Blob([originalHtmlText]).size;

            const totalFiles = 1 + this.files.css.length + this.files.js.length;
            const finalSize = new Blob([htmlText]).size;

            const increase = htmlSize > 0 ? Math.round(((finalSize - htmlSize) / htmlSize) * 100) : 0;

            renderStats(this.dom.statsPanel, [
                { value: totalFiles, label: 'Merged Files' },
                { value: `${Math.round(htmlSize / 1024)} KB`, label: 'Base HTML' },
                { value: `${Math.round(finalSize / 1024)} KB`, label: 'Merged Size' },
                { value: `+${increase}%`, label: 'Size Increase', colorClass: 'text-accent' }
            ]);

            this.dom.outputContainer.style.display = 'block';
            this.updateButtonState();

            setTimeout(() => switchTab('code'), 100);
        } catch (error) {
            console.error('Merge error:', error);
            showInputFeedback(this.dom.mergeBtn, 'Error merging files. Check console for details.', 'error');
        }
    }

    /**
     * Handles tool reset with confirmation.
     * @async
     */
    async handleReset() {
        if (await confirmReset('HTML Merger')) {
            this.clearAll();
            showToast('HTML Merger has been reset.', 'info');
        }
    }

    /**
     * Resets the tool to its baseline state.
     */
    clearAll() {
        this.files.html = null;
        this.files.css = [];
        this.files.js = [];
        this.mergedContent = null;
        this.previewTheme = 'dark';
        this.dom.previewContainer.classList.add('theme-dark');
        this.dom.previewContainer.classList.remove('theme-light');

        Object.keys(this.dom.panels).forEach(type => {
            this.fileLists[type].update(null);
            this.dom.panels[type].fileInput.value = '';
        });

        this.dom.outputContainer.style.display = 'none';
        this.dom.mergedCode.value = '';
        this.updateButtonState();
    }
}

export default HTMLMerger;

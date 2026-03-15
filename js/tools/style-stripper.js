import {
    setupDragAndDrop,
    copyToClipboard,
    toggleUploadArea,
    switchTab,
    showInputFeedback,
    downloadBlob,
    showToast,
    confirmReset
} from '../core.js';
import { readFileAsText } from '../utils/file-utils.js';
import { APP_CONFIG } from '../config.js';

//=============================================
// Style Stripper Tool
//=============================================

/**
 * Removes inline styles, classes, and style-related JS logic from code.
 */
class StyleStripper {
    constructor() {
        this.elements = {
            inputContainer: document.getElementById('inputContainer'),
            resultsContainer: document.getElementById('resultsContainer'),
            inputArea: document.getElementById('inputArea'),
            outputArea: document.getElementById('outputArea'),
            diffContainer: document.getElementById('diffContainer'),
            cleanBtn: document.getElementById('cleanBtn'),
            copyBtn: document.getElementById('copyBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            resetBtn: document.getElementById('resetBtn'),
            fileInput: document.getElementById('fileInput'),
            dropZone: document.getElementById('dropZone'),
            fileInfo: document.getElementById('fileInfo'),
            fileNameDisplay: document.getElementById('fileNameDisplay'),
            clearFileBtn: document.getElementById('clearFileBtn'),
            stripJsLogic: document.getElementById('stripJsLogic'),
            stripUnusedVars: document.getElementById('stripUnusedVars'),
            stripCommentInstead: document.getElementById('stripCommentInstead'),
            unusedVarsLabel: document.getElementById('unusedVarsLabel'),
            cleanScriptStyles: document.getElementById('cleanScriptStyles'),
            stripStyleBlock: document.getElementById('stripStyleBlock'),
            statsPanel: document.getElementById('stats'),
            previewFrame: document.getElementById('preview-frame'),
            previewContainer: document.getElementById('previewContainer'),
            togglePreviewTheme: document.getElementById('togglePreviewTheme'),
            tabs: document.querySelectorAll('.tab')
        };

        this.currentFileName = null;
        this.previewTheme = 'dark';
        this.isToastBlocked = false;
        this.setupListeners();
    }

    /**
     * Attaches event listeners to tool controls and interactive elements.
     */
    setupListeners() {
        this.elements.inputArea.addEventListener('input', () => {
            this.elements.resultsContainer.classList.add('hidden');
            this.updateUIState();
        });

        this.elements.cleanBtn.addEventListener('click', () => this.process());
        this.elements.copyBtn.addEventListener('click', (e) => {
            const textToCopy = this.elements.outputArea.value;
            if (textToCopy) copyToClipboard(textToCopy, e.currentTarget);
        });
        this.elements.downloadBtn.addEventListener('click', () => this.download());
        this.elements.resetBtn.addEventListener('click', () => this.handleReset());
        
        this.elements.stripCommentInstead.addEventListener('change', () => {
            const isCommentMode = this.elements.stripCommentInstead.checked;
            this.elements.unusedVarsLabel.textContent = isCommentMode 
                ? 'Comment unused variable declarations' 
                : 'Remove unused variable declarations';

            if (!this.elements.resultsContainer.classList.contains('hidden')) {
                this.process();
            }
        });

        this.elements.stripJsLogic.addEventListener('change', () => {
            if (!this.elements.resultsContainer.classList.contains('hidden')) {
                this.process();
            }
        });

        this.elements.cleanScriptStyles.addEventListener('change', () => {
            const isEnabled = this.elements.cleanScriptStyles.checked;
            
            const subOptions = [
                { el: this.elements.stripJsLogic, container: 'jsLogicContainer' },
                { el: this.elements.stripUnusedVars, container: 'unusedVarsContainer' }
            ];

            subOptions.forEach(opt => {
                opt.el.disabled = !isEnabled;
                const container = document.getElementById(opt.container);
                if (container) {
                    container.style.opacity = isEnabled ? '1' : '0.5';
                    container.style.pointerEvents = isEnabled ? 'auto' : 'none';
                }
            });

            if (!this.elements.resultsContainer.classList.contains('hidden')) {
                this.process();
            }
        });

        this.elements.stripUnusedVars.addEventListener('change', () => {
            if (!this.elements.resultsContainer.classList.contains('hidden')) {
                this.process();
            }
        });

        this.elements.stripStyleBlock.addEventListener('change', () => {
            if (!this.elements.resultsContainer.classList.contains('hidden')) {
                this.process();
            }
        });

        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                if (tabName === 'preview' && !this.canPreview()) {
                    if (!this.isToastBlocked) {
                        showToast('Live Preview not available for pure JS/Text code.', 'info');
                        this.isToastBlocked = true;
                        setTimeout(() => {
                            this.isToastBlocked = false;
                        }, APP_CONFIG.ui.toastDuration);
                    }
                    return;
                }

                switchTab(tabName);
                if (tabName === 'diff') this.renderDiff();
                if (tabName === 'preview') this.updatePreview();
            });
        });

        this.elements.dropZone.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFile(file);
        });

        this.elements.clearFileBtn.addEventListener('click', () => this.clearFile());

        setupDragAndDrop(
            this.elements.inputArea.parentElement,
            this.elements.dropZone,
            (e) => {
                const file = e.dataTransfer.files[0];
                if (!file) return;

                const allowedExtensions = ['.html', '.htm', '.js', '.jsx', '.ts', '.tsx'];
                const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

                if (!allowedExtensions.includes(ext)) {
                    showInputFeedback(this.elements.dropZone, `Invalid file type "${ext}". Accepted: ${allowedExtensions.join(', ')}`, 'error');
                    return;
                }

                this.handleFile(file);
            },
            () => this.updateUIState()
        );

        this.updateUIState();

        this.elements.togglePreviewTheme.addEventListener('click', () => {
            this.previewTheme = this.previewTheme === 'dark' ? 'light' : 'dark';
            this.elements.previewContainer.classList.toggle('theme-dark', this.previewTheme === 'dark');
            this.elements.previewContainer.classList.toggle('theme-light', this.previewTheme === 'light');
        });

        this.elements.unusedVarsLabel.textContent = this.elements.stripCommentInstead.checked 
            ? 'Comment unused variable declarations' 
            : 'Remove unused variable declarations';
    }

    /**
     * Handles file input and populates the editor area.
     * @async
     * @param {File} file
     */
    async handleFile(file) {
        try {
            const text = await readFileAsText(file);
            this.elements.resultsContainer.classList.add('hidden');
            this.currentFileName = file.name;
            this.elements.fileNameDisplay.textContent = file.name;
            this.elements.inputArea.value = text;
            this.updateUIState();
        } catch (err) {
            console.error("Error reading file:", err);
        }
    }

    /**
     * Clears current file and resets editor state.
     */
    clearFile() {
        this.currentFileName = null;
        this.elements.fileInput.value = '';
        this.elements.inputArea.value = '';
        this.elements.resultsContainer.classList.add('hidden');
        this.updateUIState();
    }

    /**
     * Handles reset action with user confirmation.
     * @async
     */
    async handleReset() {
        if (await confirmReset('Style Stripper')) {
            this.reset();
            showToast('Style Stripper has been reset.', 'info');
        }
    }

    /**
     * Resets the tool to its baseline state.
     */
    reset() {
        this.elements.inputArea.value = '';
        this.currentFileName = null;
        this.elements.fileInput.value = '';
        this.elements.resultsContainer.classList.add('hidden');
        this.updateUIState();
        this.updateTabVisuals();
    }

    /**
     * Updates action button states based on editor content.
     */
    updateUIState() {
        const hasContent = this.elements.inputArea.value.trim().length > 0;

        toggleUploadArea(
            this.elements.inputArea,
            this.elements.dropZone,
            hasContent,
            () => {
                const displayText = this.currentFileName || "Custom code";
                this.elements.fileNameDisplay.textContent = displayText;
                this.elements.fileInfo.classList.remove('d-none');
            },
            () => {
                this.elements.fileInfo.classList.add('d-none');
            }
        );

        this.elements.cleanBtn.disabled = !hasContent;
        this.elements.resetBtn.disabled = !hasContent;
    }

    /**
     * Core logic to remove style-related patterns from a code string.
     * @param {string} str - Raw input code.
     * @returns {string} Cleaned code.
     */
    cleanCode(str) {
        if (!str) return "";

        const cleanScriptStyles = this.elements.cleanScriptStyles.checked;
        const stripJsLogic = this.elements.stripJsLogic.checked;
        const stripUnusedVars = this.elements.stripUnusedVars.checked;
        const stripStyleBlock = this.elements.stripStyleBlock.checked;
        const commentInstead = this.elements.stripCommentInstead.checked;

        const attrRegex = /\s*(?:class|className|style)\s*=\s*(?:(["'`])(?:(?!\1).)*\1|\{\{.*?\}\})/g;

        const scripts = [];
        let result = str.replace(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi, (match, scriptContent) => {
            const placeholder = `__SCRIPT_MASK_${scripts.length}__`;
            scripts.push({
                fullMatch: match,
                content: scriptContent,
                placeholder: placeholder
            });
            return placeholder;
        });

        if (commentInstead) {
            const lines = result.split('\n');
            result = lines.map(line => {
                if (attrRegex.test(line)) {
                    const cleanedLine = line.replace(attrRegex, '');
                    return `<!-- ${line.trim()} -->\n${cleanedLine}`;
                }
                return line;
            }).join('\n');
        } else {
            result = result.replace(attrRegex, '');
        }

        if (stripStyleBlock) {
            if (commentInstead) {
                result = result.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, (match) => `<!-- ${match} -->`);
            } else {
                result = result.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
            }
        }

        scripts.forEach(script => {
            let processedScript = script.content;
            
            if (cleanScriptStyles) {
                if (commentInstead) {
                    const lines = processedScript.split('\n');
                    processedScript = lines.map(line => {
                        if (attrRegex.test(line)) {
                            const indent = line.match(/^\s*/)[0];
                            const cleanedLine = line.replace(attrRegex, '');
                            return `${indent}<!-- ${line.trim()} -->\n${cleanedLine}`;
                        }
                        return line;
                    }).join('\n');
                } else {
                    processedScript = processedScript.replace(attrRegex, '');
                }

                if (stripJsLogic) {
                    const jsLogicRegex = /\.(classList|style|setAttribute\s*\(\s*(['"])style|css\s*\(|addClass|removeClass|toggleClass)/;
                    const lines = processedScript.split('\n');
                    if (commentInstead) {
                        processedScript = lines.map(line => {
                            if (jsLogicRegex.test(line)) {
                                const indent = line.match(/^\s*/)[0];
                                return `${indent}// ${line.trim()}`;
                            }
                            return line;
                        }).join('\n');
                    } else {
                        processedScript = lines
                            .filter(line => !jsLogicRegex.test(line))
                            .join('\n');
                    }
                }

                if (stripUnusedVars) {
                    const selectorPatterns = [
                        /document\.(querySelector|getElementById|getElementsByClassName|getElementsByTagName|querySelectorAll)/,
                        /\$\(['"].*?['"]\)/
                    ];
                    
                    const declRegex = /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(.*?);/;
                    let lines = processedScript.split('\n');
                    
                    const scriptTextForUsage = lines
                        .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('<!--'))
                        .join('\n');

                    const orphansToRemove = [];
                    lines.forEach(line => {
                        const match = line.match(declRegex);
                        if (match && !line.trim().startsWith('//')) {
                            const varName = match[1];
                            const assignment = match[2];
                            if (selectorPatterns.some(p => p.test(assignment))) {
                                const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
                                const usages = scriptTextForUsage.match(usageRegex) || [];
                                if (usages.length === 1) {
                                    orphansToRemove.push(line);
                                }
                            }
                        }
                    });

                    processedScript = lines.map(line => {
                        if (orphansToRemove.includes(line)) {
                            const indent = line.match(/^\s*/)[0];
                            return commentInstead ? `${indent}// ${line.trim()}` : null;
                        }
                        return line;
                    }).filter(l => l !== null).join('\n');
                }
            }
            
            const restoredScript = script.fullMatch.replace(script.content, processedScript);
            result = result.replace(script.placeholder, restoredScript);
        });

        return result;
    }

    /**
     * Generates a visual diff between original and cleaned code.
     */
    renderDiff() {
        const diffEngine = window.Diff;
        if (!diffEngine) return;

        const original = this.elements.inputArea.value;
        const cleaned = this.elements.outputArea.value;

        try {
            const diff = diffEngine.diffLines(original, cleaned);
            this.elements.diffContainer.innerHTML = '';
            const pre = document.createElement('pre');

            diff.forEach((part) => {
                const span = document.createElement('span');
                let prefix = '  ';

                if (part.added) {
                    span.className = 'diff-added diff-line';
                    prefix = '+ ';
                } else if (part.removed) {
                    span.className = 'diff-removed diff-line';
                    prefix = '- ';
                } else {
                    span.className = 'diff-line opacity-50';
                }

                span.textContent = part.value.split('\n')
                    .filter((line, i, arr) => i < arr.length - 1 || line !== '')
                    .map(line => prefix + line)
                    .join('\n') + '\n';

                if (span.textContent.trim()) {
                    pre.appendChild(span);
                }
            });

            this.elements.diffContainer.appendChild(pre);
        } catch (err) {
            console.error("Error generating diff:", err);
            this.elements.diffContainer.innerHTML = '<div class="text-error p-4 text-center">Error generating diff analysis</div>';
        }
    }

    /**
     * Checks if the current code output can be rendered in the preview frame.
     * @returns {boolean}
     */
    canPreview() {
        const content = this.elements.outputArea.value;
        return content && /<[a-z][\s\S]*>/i.test(content);
    }

    /**
     * Updates visibility and disabled status for tabs.
     */
    updateTabVisuals() {
        const previewTab = Array.from(this.elements.tabs).find(t => t.dataset.tab === 'preview');
        if (previewTab) {
            const possible = this.canPreview();
            previewTab.classList.toggle('disabled', !possible);
            previewTab.style.opacity = possible ? '1' : '0.5';
            previewTab.style.cursor = possible ? 'pointer' : 'not-allowed';
        }
    }

    /**
     * Updates the live preview iframe.
     */
    updatePreview() {
        const content = this.elements.outputArea.value;
        if (!content) return;

        if (this.canPreview()) {
            this.elements.previewFrame.srcdoc = content;
        }
    }

    /**
     * Main orchestration method to clean and analyze the input code.
     */
    process() {
        const original = this.elements.inputArea.value;
        if (!original.trim()) return;

        const target = this.elements.dropZone.classList.contains('hidden') ? this.elements.inputArea : this.elements.dropZone;

        target.classList.remove('error', 'warning');

        if (!/[<>{}=]/.test(original)) {
            this.elements.resultsContainer.classList.add('hidden');
            showInputFeedback(target, 'No valid code structure detected. Please provide HTML or JS code.', 'error');
            return;
        }

        const htmlOnly = original.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
        const hasHtmlAttrs = /\s*(?:class|className|style)\s*=\s*(?:(["'`])(?:(?!\1).)*\1|\{\{.*?\}\})/.test(htmlOnly);
        const hasStyleBlocks = /<style[\s\S]*?>/.test(htmlOnly);
        
        const scriptMatches = original.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi) || [];
        const scriptContent = scriptMatches.map(m => m.replace(/<script[\s\S]*?>|<\/script>/gi, '')).join('\n');
        
        const hasAttrsInScripts = /\s*(?:class|className|style)\s*=\s*(?:(["'`])(?:(?!\1).)*\1|\{\{.*?\}\})/.test(scriptContent);
        const jsLogicRegex = /\.(classList|style|setAttribute\s*\(\s*(['"])style|css\s*\(|addClass|removeClass|toggleClass)/;
        const hasJsLogic = jsLogicRegex.test(scriptContent);

        const canCleanScripts = this.elements.cleanScriptStyles.checked && (hasAttrsInScripts || (this.elements.stripJsLogic.checked && hasJsLogic));
        const canCleanStyleBlocks = this.elements.stripStyleBlock.checked && hasStyleBlocks;

        if (!hasHtmlAttrs && !canCleanScripts && !canCleanStyleBlocks) {
            this.elements.resultsContainer.classList.add('hidden');
            showInputFeedback(target, 'No strippable content found with current options.', 'warning');
            return;
        }

        const cleaned = this.cleanCode(original);
        this.elements.outputArea.value = cleaned;

        const originalSize = new Blob([original]).size;
        const cleanedSize = new Blob([cleaned]).size;
        const reductionPercent = originalSize > 0 ? Math.round((Math.max(0, originalSize - cleanedSize) / originalSize) * 100) : 0;

        const attrMatch = htmlOnly.match(/\s*(?:class|className|style)\s*=\s*/g) || [];
        const scriptAttrMatch = canCleanScripts ? (scriptContent.match(/\s*(?:class|className|style)\s*=\s*/g) || []) : [];
        const jsMatch = (canCleanScripts && this.elements.stripJsLogic.checked) ? (scriptContent.match(/\.(classList|style|setAttribute|css)/g) || []) : [];
        const styleMatch = canCleanStyleBlocks ? (htmlOnly.match(/<style/g) || []) : [];
        const totalItems = attrMatch.length + scriptAttrMatch.length + jsMatch.length + styleMatch.length;

        this.elements.statsPanel.innerHTML = `
            <div class="stat-item"><div class="stat-value">${totalItems}</div><div class="stat-label">Stripped Items</div></div>
            <div class="stat-item"><div class="stat-value">${Math.round(originalSize / 1024)} KB</div><div class="stat-label">Original Size</div></div>
            <div class="stat-item"><div class="stat-value">${Math.round(cleanedSize / 1024)} KB</div><div class="stat-label">Stripped Size</div></div>
            <div class="stat-item"><div class="stat-value text-accent">-${reductionPercent}%</div><div class="stat-label">Size Reduction</div></div>`;

        this.elements.resultsContainer.classList.remove('hidden');
        this.updateTabVisuals();
        this.updatePreview();
        
        const activeTab = document.querySelector('.tab.active');
        if (activeTab?.dataset.tab === 'diff') this.renderDiff();
        
        if (activeTab?.dataset.tab === 'preview' && !this.canPreview()) {
            switchTab('results');
        }
    }

    /**
     * Packs result into a blob and initiates download.
     */
    download() {
        const content = this.elements.outputArea.value;
        if (!content) return;

        let filename = 'stripped.html';
        if (this.currentFileName) {
            const lastDot = this.currentFileName.lastIndexOf('.');
            if (lastDot !== -1) {
                const namePart = this.currentFileName.substring(0, lastDot);
                const extPart = this.currentFileName.substring(lastDot);
                filename = `${namePart}.stripped${extPart}`;
            } else {
                filename = `${this.currentFileName}.stripped`;
            }
        }

        const blob = new Blob([content], { type: 'text/html' });
        downloadBlob(blob, filename);
    }

    /**
     * Tool cleanup.
     */
    destroy() { }
}

export default StyleStripper;

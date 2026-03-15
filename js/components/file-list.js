import { animateRemove } from '../utils/ui-utils.js';

//=============================================
// File List Manager
//=============================================

/**
 * Manages a list of uploaded files, offering smooth animations and sync with tool state.
 */
export class FileList {
    /**
     * Creates an instance of FileList.
     * @param {HTMLElement} container - The element where the list will be rendered.
     * @param {Object} [options={}] - Configuration options.
     * @param {Function} [options.onRemove] - Callback triggered when a file is removed.
     */
    constructor(container, options = {}) {
        this.container = container;
        this.onRemove = options.onRemove || (() => { });
        this.files = [];
    }

    /**
     * Updates the internal file list and renders it.
     * @param {Array|File} files - Single file or array of files.
     */
    update(files) {
        this.files = Array.isArray(files) ? files : (files ? [files] : []);
        this.render();
    }

    /**
     * Renders the file list items into the container.
     */
    render() {
        this.container.innerHTML = '';
        if (this.files.length === 0) return;

        this.files.forEach((file, index) => {
            if (!file) return;
            const item = this.createFileItem(file, index);
            this.container.appendChild(item);
        });
    }

    /**
     * Creates a single file item element.
     * @param {File} file - The file object.
     * @param {number} index - The current index in the file list.
     * @returns {HTMLElement} The created element.
     */
    createFileItem(file, index) {
        const item = document.createElement('div');
        item.className = 'file-info-bar';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `📄 ${file.name}`;
        item.appendChild(nameSpan);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn-clear';
        clearBtn.innerHTML = '✕';
        clearBtn.title = 'Remove file';

        clearBtn.onclick = () => {
            animateRemove(item, () => {
                this.files.splice(index, 1);
                this.onRemove(index);
                this.refreshIndices();
            });
        };

        item.appendChild(clearBtn);
        return item;
    }

    /**
     * Refreshes the click handlers of list items after an item is removed.
     */
    refreshIndices() {
        const items = this.container.querySelectorAll('.file-info-bar');
        items.forEach((item, newIndex) => {
            const btn = item.querySelector('.btn-clear');
            if (btn) {
                btn.onclick = () => {
                    animateRemove(item, () => {
                        this.files.splice(newIndex, 1);
                        this.onRemove(newIndex);
                        this.refreshIndices();
                    });
                };
            }
        });
    }
}

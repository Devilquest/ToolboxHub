import { switchTab, downloadBlob, showToast, confirmReset } from '../core.js';
import { GlobalSettings } from '../utils/format-utils.js';
import { setupDragAndDrop, copyToClipboard, toggleUploadArea, renderLoader } from '../utils/ui-utils.js';

//=============================================
// Constants & Configuration
//=============================================

const TEXTS = {
    binaryInformation: 'Binary Information',
    fileHeaderLabel: 'File header',
    experimentalPromptLabel: '[Exp] P.Text',
    first16BytesLabel: 'First 16 bytes (hex)',
};

const SPECIAL_KEYS = [
    TEXTS.fileHeaderLabel,
    TEXTS.experimentalPromptLabel,
    TEXTS.first16BytesLabel
];

//=============================================
// File Metadata Viewer Tool
//=============================================

/**
 * Viewer that extracts metadata (EXIF, ID3, ID, signatures) and provides different representations of file binaries.
 */
class FileMetadataViewer {
    constructor() {
        this.currentMetadata = null;
        this.currentFile = null;
        this.fileBuffer = null;
        this.uploadArea = document.getElementById('uploadArea');
        this.metadataInputCard = document.getElementById('metadataInputCard');
        this.errorTimeout = null;

        this.initializeEventListeners();
    }


    /**
     * Initializes the tool's DOM element references and event listeners.
     */
    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const downloadBtn = document.getElementById('downloadBtn');
        const downloadCsvBtn = document.getElementById('downloadCsvBtn');
        const resetBtn = document.getElementById('resetBtn');

        setupDragAndDrop(this.metadataInputCard, this.uploadArea, (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            } else {
                this.toggleUploadArea();
            }
        }, () => this.toggleUploadArea());

        this.uploadArea.addEventListener('click', (e) => {
            if (e.target !== fileInput) fileInput.click();
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) this.handleFile(e.target.files[0]);
        });

        downloadBtn.addEventListener('click', () => this.downloadJSON());
        downloadCsvBtn.addEventListener('click', () => this.downloadCSV());
        resetBtn.addEventListener('click', () => this.handleReset());

        document.querySelectorAll('#app .tab').forEach(tab => {
            tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
        });

        const copyRawBtn = document.getElementById('copyRawBtn');
        const copyHexBtn = document.getElementById('copyHexBtn');

        copyRawBtn?.addEventListener('click', () => {
            const rawContent = document.getElementById('rawContent').value;
            copyToClipboard(rawContent, copyRawBtn);
        });

        copyHexBtn?.addEventListener('click', () => {
            const hexContent = document.getElementById('hexContent').value;
            copyToClipboard(hexContent, copyHexBtn);
        });
    }

    /**
     * Toggles the visibility of the file upload zone vs the workstation controls.
     */
    toggleUploadArea() {
        const controls = document.getElementById('workstationControls');
        const title = this.metadataInputCard.querySelector('.card-title');

        toggleUploadArea(
            this.uploadArea,
            this.uploadArea,
            this.currentFile !== null,
            () => {
                if (controls) controls.style.display = 'flex';
                if (title) title.textContent = 'File ready to view';
            },
            () => {
                if (controls) controls.style.display = 'none';
                if (title) title.textContent = 'Select a file';
            }
        );
    }

    /**
     * Entry point for processing a newly selected file.
     * @async
     * @param {File} file
     */
    async handleFile(file) {
        this.currentFile = file;
        this.toggleUploadArea();
        this.showFilePreview(file);
        this.showLoading();
        try {
            const metadata = await this.extractMetadata(file);
            this.displayMetadata(metadata);
        } catch (error) {
            this.showError('Error retrieving metadata: ' + error.message);
            this.clearAll();
        }
    }

    /**
     * Generates and displays a preview for the selected file.
     * @param {File} file
     */
    showFilePreview(file) {
        const previewContainer = document.getElementById('filePreview');
        const fileIcon = this.getFileIcon(file.type);
        const fileSize = this.formatFileSize(file.size);
        let previewHTML = `
            <div class="file-preview">
                <div class="file-icon">${fileIcon}</div>
                <div class="file-info">
                    <div class="file-name">${this.escapeHtml(file.name)}</div>
                    <div class="file-size">${fileSize} • ${file.type || 'Unknown type'}</div>
                </div>
            </div>`;
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewHTML += `<img src="${e.target.result}" class="image-preview mt-md" alt="Preview">`;
                previewContainer.innerHTML = previewHTML;
                previewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.innerHTML = previewHTML;
            previewContainer.classList.remove('hidden');
        }
    }

    /**
     * Maps a MIME type to a representative emoji icon.
     * @param {string} mimeType
     * @returns {string} Emoji icon.
     */
    getFileIcon(mimeType) {
        if (!mimeType) return '📄';
        const typeMap = {
            'image': '🖼️', 'video': '🎬', 'audio': '🎵',
            'application/pdf': '📕', 'application/zip': '📦',
            'application/x-rar': '📦', 'application/x-7z': '📦',
            'text': '📝', 'application/msword': '📘',
            'application/vnd.ms-excel': '📊', 'application/vnd.ms-powerpoint': '📙',
            'application/json': '{ }', 'application/xml': '< >',
            'application/javascript': '📜', 'font': '🔤'
        };
        for (const [key, icon] of Object.entries(typeMap)) {
            if (mimeType.includes(key)) return icon;
        }
        const mainType = mimeType.split('/')[0];
        return typeMap[mainType] || '📄';
    }

    /**
     * Formats file size in bytes to a human-readable string (KB, MB, etc.).
     * @param {number} bytes
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const val = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
        return GlobalSettings.formatNumber(val, 0) + ' ' + sizes[i];
    }

    /**
     * Orchestrates the extraction of metadata from a file object.
     * @async
     * @param {File} file
     * @returns {Promise<Object>} Metadata object.
     */
    async extractMetadata(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.fileBuffer = e.target.result;
                    const metadata = this.parseFileMetadata(file, this.fileBuffer);
                    resolve(metadata);
                } catch (error) { reject(error); }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Parses the file buffer to extract general and format-specific metadata.
     * @async
     * @param {File} file
     * @param {ArrayBuffer} arrayBuffer
     * @returns {Promise<Object>} Metadata tree.
     */
    async parseFileMetadata(file, arrayBuffer) {
        const metadata = {
            'File Information': {
                'Name': file.name, 'Size': this.formatFileSize(file.size),
                'Size (bytes)': file.size.toString(), 'Type': file.type || 'Unknown',
                'Last Modified': new Date(file.lastModified).toLocaleString(),
                'Last Modified (timestamp)': file.lastModified.toString()
            }
        };
        const view = new DataView(arrayBuffer);
        const signature = this.detectFileSignature(view);
        if (signature) metadata['File Information']['Detected Format'] = signature;

        if (file.type.startsWith('image/') || signature?.includes('Image')) {
            Object.assign(metadata, this.parseImageMetadata(view, file.type));
        } else if (file.type.startsWith('audio/') || signature?.includes('Audio')) {
            Object.assign(metadata, this.parseAudioMetadata(view));
        } else if (file.type.startsWith('video/') || signature?.includes('Video')) {
            Object.assign(metadata, this.parseVideoMetadata(view));
        } else if (file.type === 'application/pdf' || signature === 'PDF Document') {
            Object.assign(metadata, this.parsePDFMetadata(view));
        } else if (file.type.includes('zip') || signature?.includes('Archive')) {
            Object.assign(metadata, this.parseArchiveMetadata(view, signature));
        }

        metadata[TEXTS.binaryInformation] = {
            [TEXTS.first16BytesLabel]: this.getHexString(view, 0, 16),
            [TEXTS.fileHeaderLabel]: this.getFileHeaderInfo(view)
        };
        return metadata;
    }

    /**
     * Detects file format based on magic number signatures (headers).
     * @param {DataView} view
     * @returns {string|null} Format name or null.
     */
    detectFileSignature(view) {
        if (view.byteLength < 4) return null;
        const signatures = {
            '89504E47': 'PNG Image', 'FFD8FF': 'JPEG Image', '47494638': 'GIF Image',
            '424D': 'BMP Image', '49492A00': 'TIFF Image (Little Endian)',
            '4D4D002A': 'TIFF Image (Big Endian)', '52494646': 'RIFF (WAV/AVI/WebP)',
            '504B0304': 'ZIP Archive', '504B0506': 'ZIP Archive (empty)',
            '504B0708': 'ZIP Archive (spanned)', '52617221': 'RAR Archive',
            '377ABCAF': '7-Zip Archive', '25504446': 'PDF Document',
            '4F676753': 'OGG Media', '494433': 'MP3 with ID3',
            'FFFB': 'MP3 Audio', '664C6143': 'FLAC Audio',
            '00000018': 'MP4 Video', '00000020': 'MP4 Video',
            '1A45DFA3': 'MKV Video', '3C3F786D': 'XML Document',
            '7B': 'JSON (possible)', '5B': 'JSON Array (possible)',
            'CAFEBABE': 'Java Class', '4D5A': 'Windows Executable',
            '7F454C46': 'Linux Executable (ELF)', 'D0CF11E0': 'Microsoft Office (OLE)'
        };
        for (const [sig, format] of Object.entries(signatures)) {
            const sigBytes = sig.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
            let match = true;
            for (let i = 0; i < sigBytes.length && i < view.byteLength; i++) {
                if (view.getUint8(i) !== sigBytes[i]) { match = false; break; }
            }
            if (match) return format;
        }
        return null;
    }

    /**
     * Determines which format-specific image metadata parser to use.
     * @param {DataView} view
     * @param {string} mimeType
     * @returns {Object} Image metadata.
     */
    parseImageMetadata(view, mimeType) {
        const metadata = {};
        if (this.isPNG(view)) {
            const pngData = this.parsePNGChunks(view);
            if (Object.keys(pngData).length > 0) metadata['PNG Metadata'] = pngData;
            if (view.byteLength >= 24) {
                metadata['Image Dimensions'] = {
                    'Width': view.getUint32(16) + ' pixels',
                    'Height': view.getUint32(20) + ' pixels'
                };
            }
        } else if (this.isJPEG(view)) {
            const jpegData = this.parseJPEGSegments(view);
            if (Object.keys(jpegData).length > 0) metadata['JPEG Metadata'] = jpegData;
        } else if (this.isGIF(view)) {
            if (view.byteLength >= 10) {
                metadata['GIF Information'] = {
                    'Version': this.getString(view, 3, 3),
                    'Width': view.getUint16(6, true) + ' pixels',
                    'Height': view.getUint16(8, true) + ' pixels'
                };
            }
        } else if (this.isWebP(view)) {
            metadata['WebP Information'] = { 'Format': 'WebP Image', 'File Size': view.byteLength + ' bytes' };
        }
        return metadata;
    }

    /**
     * Extracts metadata from audio files (ID3, RIFF/WAV, etc.).
     * @param {DataView} view
     * @returns {Object} Audio metadata.
     */
    parseAudioMetadata(view) {
        const metadata = {};
        if (view.byteLength >= 10 && this.getString(view, 0, 3) === 'ID3') {
            const id3Data = this.parseID3Tags(view);
            if (Object.keys(id3Data).length > 0) metadata['ID3 Tags'] = id3Data;
        } else if (view.byteLength >= 4 && this.getString(view, 0, 4) === 'fLaC') {
            metadata['FLAC Information'] = { 'Format': 'FLAC Audio', 'Lossless': 'Yes' };
        } else if (view.byteLength >= 44 && this.getString(view, 0, 4) === 'RIFF') {
            const wavData = this.parseWAVHeader(view);
            if (Object.keys(wavData).length > 0) metadata['WAV Information'] = wavData;
        }
        return metadata;
    }

    /**
     * Extracts container information from video files.
     * @param {DataView} view
     * @returns {Object} Video metadata.
     */
    parseVideoMetadata(view) {
        const metadata = {};
        if (view.byteLength >= 8) {
            const ftyp = this.getString(view, 4, 4);
            if (ftyp === 'ftyp') {
                metadata['Video Information'] = { 'Format': 'MP4/MOV', 'Brand': this.getString(view, 8, 4) };
            }
        } else if (this.getString(view, 0, 4) === 'RIFF' && view.byteLength >= 12) {
            const format = this.getString(view, 8, 4);
            if (format === 'AVI ') metadata['Video Information'] = { 'Format': 'AVI Video', 'Container': 'RIFF' };
        } else if (view.byteLength >= 4 && view.getUint32(0) === 0x1A45DFA3) {
            metadata['Video Information'] = { 'Format': 'Matroska Video (MKV)', 'Container': 'EBML' };
        }
        return metadata;
    }

    /**
     * Extracts basic header information from PDF files.
     * @param {DataView} view
     * @returns {Object} PDF metadata.
     */
    parsePDFMetadata(view) {
        const metadata = {};
        if (view.byteLength >= 1024) {
            const header = this.getString(view, 0, 1024);
            const versionMatch = header.match(/%PDF-(\d\.\d)/);
            if (versionMatch) metadata['PDF Information'] = { 'Version': versionMatch[1], 'Format': 'Portable Document Format' };
            const titleMatch = header.match(/\/Title\s*\((.*?)\)/);
            const authorMatch = header.match(/\/Author\s*\((.*?)\)/);
            const creatorMatch = header.match(/\/Creator\s*\((.*?)\)/);
            if (titleMatch || authorMatch || creatorMatch) {
                metadata['PDF Metadata'] = {};
                if (titleMatch) metadata['PDF Metadata']['Title'] = titleMatch[1];
                if (authorMatch) metadata['PDF Metadata']['Author'] = authorMatch[1];
                if (creatorMatch) metadata['PDF Metadata']['Creator'] = creatorMatch[1];
            }
        }
        return metadata;
    }

    /**
     * Extracts information from archive files (ZIP).
     * @param {DataView} view
     * @param {string} signature - Detected signature name.
     * @returns {Object} Archive metadata.
     */
    parseArchiveMetadata(view, signature) {
        const metadata = { 'Archive Information': { 'Type': signature || 'Archive', 'Compressed': 'Yes' } };
        if (signature?.includes('ZIP')) {
            metadata['Archive Information']['Format'] = 'ZIP';
            let fileCount = 0;
            for (let i = 0; i < view.byteLength - 4; i++) {
                if (view.getUint32(i) === 0x504B0304) fileCount++;
            }
            if (fileCount > 0) metadata['Archive Information']['Approximate Files'] = fileCount.toString();
        }
        return metadata;
    }

    /**
     * Iterates through PNG chunks to find text-based metadata (tEXt, iTXt, zTXt).
     * @param {DataView} view
     * @returns {Object} PNG metadata.
     */
    parsePNGChunks(view) {
        const metadata = {};
        let offset = 8;
        while (offset < view.byteLength - 8) {
            const length = view.getUint32(offset);
            const type = this.getString(view, offset + 4, 4);
            if (type === 'tEXt' || type === 'iTXt' || type === 'zTXt') {
                const textData = new Uint8Array(view.buffer, offset + 8, length);
                const textStr = new TextDecoder('utf-8').decode(textData);
                if (type === 'tEXt') {
                    const nullIndex = textStr.indexOf('\0');
                    if (nullIndex !== -1) {
                        metadata[textStr.substring(0, nullIndex)] = textStr.substring(nullIndex + 1);
                    }
                } else if (type === 'iTXt') {
                    const parts = textStr.split('\0');
                    if (parts.length >= 2) metadata[parts[0]] = parts[parts.length - 1];
                }
            }
            offset += 12 + length;
            if (type === 'IEND') break;
        }
        if (offset >= 16) {
            const width = view.getUint32(16);
            const height = view.getUint32(20);
            metadata['Image Width'] = width.toString();
            metadata['Image Height'] = height.toString();
            metadata['Image Size'] = `${width}x${height}`;
        }
        const finalMetadata = this.buildNewMetadata(metadata, this.extractTextsFromJSON(metadata.prompt));
        return finalMetadata || metadata;
    }

    /**
     * Enhances metadata with AI prompts if they are detected.
     * @param {Object} metadata
     * @param {string[]} extractedPrompts
     * @returns {Object|null} New metadata or null.
     */
    buildNewMetadata(metadata, extractedPrompts) {
        if (!extractedPrompts || extractedPrompts.length === 0) return null;
        const newMetadata = {};
        for (let i = 0; i < extractedPrompts.length; i++) {
            newMetadata[TEXTS.experimentalPromptLabel + ` - ${i + 1}`] = extractedPrompts[i];
        }
        for (const key in metadata) newMetadata[key] = metadata[key];
        return newMetadata;
    }

    /**
     * Extracts relevant text fields from a ComfyUI/JSON metadata string.
     * @param {string} jsonString
     * @returns {string[]} List of extracted texts.
     */
    extractTextsFromJSON(jsonString) {
        const results = [];
        try {
            const parsed = JSON.parse(jsonString);
            for (const nodeId in parsed) {
                const node = parsed[nodeId];
                if (node && node.class_type) {
                    const classType = node.class_type;
                    if (classType.includes("CLIPTextEncode") || classType.includes("TextBox")) {
                        const texts = [node.inputs?.text, node.inputs?.text1];
                        texts.forEach(value => {
                            if (value && value.length > 3) results.push(value);
                        });
                    }
                }
            }
        } catch (e) { }
        return results;
    }

    /**
     * Iterates through JPEG segments to extract Exif data and dimensions.
     * @param {DataView} view
     * @returns {Object} JPEG metadata.
     */
    parseJPEGSegments(view) {
        const metadata = {};
        let offset = 2;
        while (offset < view.byteLength - 2) {
            const marker = view.getUint16(offset);
            if ((marker & 0xFF00) !== 0xFF00) break;
            const markerType = marker & 0x00FF;
            offset += 2;
            if (markerType === 0xE1) {
                const length = view.getUint16(offset);
                const exifData = new Uint8Array(view.buffer, offset + 2, length - 2);
                const exifString = new TextDecoder('utf-8', { ignoreBOMString: true }).decode(exifData);
                if (exifString.includes('parameters') || exifString.includes('prompt')) {
                    exifString.split('\n').forEach(line => {
                        if (line.includes(':')) {
                            const [key, ...values] = line.split(':');
                            const value = values.join(':').trim();
                            if (key.trim() && value) metadata[key.trim()] = value;
                        }
                    });
                }
                offset += length;
            } else if (markerType >= 0xE0 && markerType <= 0xEF) {
                offset += view.getUint16(offset);
            } else if (markerType === 0xC0 || markerType === 0xC2) {
                const length = view.getUint16(offset);
                if (length >= 8) {
                    const height = view.getUint16(offset + 3);
                    const width = view.getUint16(offset + 5);
                    metadata['Image Width'] = width.toString();
                    metadata['Image Height'] = height.toString();
                    metadata['Image Size'] = `${width}x${height}`;
                }
                offset += length;
            } else { break; }
        }
        return metadata;
    }

    /**
     * Extracts ID3 v2.x tags from an MP3 file buffer.
     * @param {DataView} view
     * @returns {Object} ID3 tags.
     */
    parseID3Tags(view) {
        const tags = {};
        try {
            const version = view.getUint8(3);
            tags['ID3 Version'] = `2.${version}`;
            let offset = 10;
            const tagSize = this.getSynchsafeInt(view, 6);
            const maxOffset = Math.min(offset + tagSize, view.byteLength);
            while (offset < maxOffset - 10) {
                const frameId = this.getString(view, offset, 4);
                if (!frameId.match(/^[A-Z0-9]{4}$/)) break;
                const frameSize = view.getUint32(offset + 4);
                if (frameSize === 0 || frameSize > maxOffset - offset - 10) break;
                const frameData = new Uint8Array(view.buffer, offset + 10, Math.min(frameSize, 100));
                const frameText = new TextDecoder('utf-8', { fatal: false }).decode(frameData);
                const frameNames = { 'TIT2': 'Title', 'TPE1': 'Artist', 'TALB': 'Album', 'TYER': 'Year', 'TCON': 'Genre' };
                if (frameNames[frameId]) tags[frameNames[frameId]] = frameText.replace(/\0/g, '').substring(0, 100);
                offset += 10 + frameSize;
            }
        } catch (e) { }
        return tags;
    }

    /**
     * Parses the RIFF/WAV header to extract audio characteristics.
     * @param {DataView} view
     * @returns {Object} WAV information.
     */
    parseWAVHeader(view) {
        const wavData = {};
        try {
            if (view.byteLength >= 44) {
                const format = this.getString(view, 8, 4);
                if (format === 'WAVE') {
                    wavData['Format'] = 'WAV Audio';
                    wavData['Channels'] = view.getUint16(22, true).toString();
                    wavData['Sample Rate'] = view.getUint32(24, true) + ' Hz';
                    wavData['Bit Depth'] = view.getUint16(34, true) + ' bits';
                    wavData['Bitrate'] = Math.round(view.getUint32(28, true) * 8 / 1000) + ' kbps';
                }
            }
        } catch (e) { }
        return wavData;
    }

//=============================================
// Binary & Numeric Helpers
//=============================================

    /**
     * Generates a printable ASCII string from the first few bytes of a file.
     * @param {DataView} view
     * @returns {string} ASCII header representation.
     */
    getFileHeaderInfo(view) {
        const maxBytes = Math.min(view.byteLength, 256);
        let ascii = '';
        for (let i = 0; i < maxBytes; i++) {
            const byte = view.getUint8(i);
            ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
        }
        return ascii.substring(0, 100);
    }

    /**
     * Converts a range of bytes into a space-separated HEX string.
     * @param {DataView} view
     * @param {number} start
     * @param {number} length
     * @returns {string} HEX string.
     */
    getHexString(view, start, length) {
        let hex = '';
        const end = Math.min(start + length, view.byteLength);
        for (let i = start; i < end; i++) hex += view.getUint8(i).toString(16).padStart(2, '0').toUpperCase() + ' ';
        return hex.trim();
    }

    /**
     * Decodes a synchsafe integer (used in ID3 tags).
     * @param {DataView} view
     * @param {number} offset
     * @returns {number} Decoded integer.
     */
    getSynchsafeInt(view, offset) {
        return (view.getUint8(offset) << 21) | (view.getUint8(offset + 1) << 14) | (view.getUint8(offset + 2) << 7) | view.getUint8(offset + 3);
    }

    /** @returns {boolean} True if PNG. */
    isPNG(view) { return view.byteLength >= 8 && view.getUint32(0) === 0x89504E47 && view.getUint32(4) === 0x0D0A1A0A; }
    
    /** @returns {boolean} True if JPEG. */
    isJPEG(view) { return view.byteLength >= 2 && view.getUint16(0) === 0xFFD8; }
    
    /** @returns {boolean} True if GIF. */
    isGIF(view) { return view.byteLength >= 6 && this.getString(view, 0, 3) === 'GIF'; }
    
    /** @returns {boolean} True if WebP. */
    isWebP(view) { return view.byteLength >= 12 && this.getString(view, 0, 4) === 'RIFF' && this.getString(view, 8, 4) === 'WEBP'; }

    /**
     * Reads a fixed-length string from the buffer.
     * @param {DataView} view
     * @param {number} offset
     * @param {number} length
     * @returns {string}
     */
    getString(view, offset, length) {
        let str = '';
        for (let i = 0; i < length && offset + i < view.byteLength; i++) str += String.fromCharCode(view.getUint8(offset + i));
        return str;
    }

//=============================================
// UI Update & Rendering
//=============================================

    /**
     * Updates all UI panels with the extracted metadata.
     * @param {Object} metadata
     */
    displayMetadata(metadata) {
        this.currentMetadata = metadata;
        const container = document.getElementById('metadataContainer');
        container.style.display = 'block';

        this.toggleUploadArea();

        this.updateStats(metadata);
        this.updateFormattedView(metadata);
        this.updateRawView(metadata);
        this.updateHexView();
    }

    /**
     * Computes and displays numerical statistics about the file.
     * @param {Object} metadata
     */
    updateStats(metadata) {
        const stats = document.getElementById('metadataStats');
        let totalFields = 0;
        for (const category in metadata) {
            if (typeof metadata[category] === 'object') totalFields += Object.keys(metadata[category]).length;
            else totalFields++;
        }

        const extension = this.currentFile.name.split('.').pop().toUpperCase();
        let sizeText = `${Math.round(this.currentFile.size / 1024)} KB`;
        let linesBox = '';

        if (this.currentFile.type.startsWith('text/') || this.currentFile.type === 'application/json' || this.currentFile.type === 'application/javascript') {
            try {
                const text = new TextDecoder("utf-8").decode(this.fileBuffer);
                const lines = text.split('\n').length;
                linesBox = `\n            <div class="stat-item"><div class="stat-value">${lines.toLocaleString()}</div><div class="stat-label">Lines</div></div>`;
            } catch (e) { }
        }

        stats.innerHTML = `
            <div class="stat-item"><div class="stat-value">${totalFields}</div><div class="stat-label">Total Fields</div></div>
            <div class="stat-item"><div class="stat-value">${extension}</div><div class="stat-label">Extension</div></div>${linesBox}
            <div class="stat-item"><div class="stat-value">${sizeText}</div><div class="stat-label">File Size</div></div>`;
    }

    /**
     * Renders the formatted properties table.
     * @param {Object} metadata
     */
    updateFormattedView(metadata) {
        const content = document.getElementById('metadataContent');
        let html = '';
        const categoryEmojis = {
            'File Information': '📄', 'PNG Metadata': '🖼️', 'JPG Metadata': '🖼️',
            'Image Dimensions': '📏', 'Binary Information': '👾',
            'Video Information': '🎬', 'Archive Information': '🗂️'
        };
        for (const [category, data] of Object.entries(metadata)) {
            const emoji = categoryEmojis[category] || '📁';
            html += `<h3 class="mt-lg mb-sm card-title text-start">${emoji} ${this.escapeHtml(category)}</h3><div class="data-list data-table-container">`;
            if (typeof data === 'object') {
                for (const [key, value] of Object.entries(data)) {
                    const isLong = (value && value.length > 100) || SPECIAL_KEYS.includes(key);
                    const escapedValue = this.escapeHtml(value);
                    const dataAttr = escapedValue.replace(/'/g, "&#39;");
                    html += `<div class="data-row data-row-table">
                        <div class="data-row-label">${this.formatKey(key)}</div>
                        <div class="data-row-value"><div ${isLong ? 'class="long-value"' : ''}>${escapedValue}</div></div>
                        <div class="metadata-copy-btn"><button class="btn btn-tertiary btn-sm" data-value='${dataAttr}'>Copy</button></div>
                    </div>`;
                }
            } else {
                html += `<div class="data-row data-row-table"><div class="data-row-value">${this.escapeHtml(data)}</div></div>`;
            }
            html += '</div>';
        }
        content.innerHTML = html;

        content.querySelectorAll('.btn-tertiary').forEach(btn => {
            btn.addEventListener('click', () => copyToClipboard(btn.dataset.value, btn));
        });
    }

    /**
     * Updates the raw JSON view textarea.
     * @param {Object} metadata
     */
    updateRawView(metadata) {
        document.getElementById('rawContent').value = JSON.stringify(metadata, null, 2);
    }

    /**
     * Generates and displays a hex dump of the first few bytes.
     */
    updateHexView() {
        const hexContent = document.getElementById('hexContent');
        const view = new DataView(this.fileBuffer);
        const maxBytes = Math.min(512, view.byteLength);
        let hexString = '';
        let asciiString = '';
        for (let i = 0; i < maxBytes; i += 16) {
            hexString += i.toString(16).padStart(8, '0').toUpperCase() + '  ';
            asciiString = '';
            for (let j = 0; j < 16 && i + j < maxBytes; j++) {
                const byte = view.getUint8(i + j);
                hexString += byte.toString(16).padStart(2, '0').toUpperCase() + ' ';
                if (j === 7) hexString += ' ';
                asciiString += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
            }
            hexString = hexString.padEnd(59, ' ');
            hexString += '  |' + asciiString + '|\n';
        }
        hexContent.value = hexString;
    }

//=============================================
// Downloads & State Management
//=============================================

    /**
     * Downloads the metadata as a JSON file.
     */
    downloadJSON() {
        if (!this.currentMetadata) return;
        const json = JSON.stringify(this.currentMetadata, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        downloadBlob(blob, `${this.currentFile.name}_metadata.json`);
    }

    /**
     * Downloads the metadata as a CSV file.
     */
    downloadCSV() {
        if (!this.currentMetadata) return;
        let csv = 'Category,Field,Value\n';
        for (const [category, data] of Object.entries(this.currentMetadata)) {
            if (typeof data === 'object') {
                for (const [key, value] of Object.entries(data)) {
                    csv += `"${category}","${key}","${value.replace(/"/g, '""')}"\n`;
                }
            } else {
                csv += `"${category}","","${data.replace(/"/g, '""')}"\n`;
            }
        }
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadBlob(blob, `${this.currentFile.name}_metadata.csv`);
    }

    /**
     * Initiates the tool reset process.
     * @async
     */
    async handleReset() {
        if (await confirmReset('File Metadata Viewer')) {
            this.clearAll();
            showToast('File Metadata Viewer has been reset.', 'info');
        }
    }

    /**
     * Resets the application state and UI.
     */
    clearAll() {
        this.currentMetadata = null;
        this.currentFile = null;
        this.fileBuffer = null;
        const container = document.getElementById('metadataContainer');
        if (container) container.style.display = 'none';
        const preview = document.getElementById('filePreview');
        if (preview) {
            preview.innerHTML = '';
            preview.classList.add('hidden');
        }
        document.getElementById('fileInput').value = '';
        this.toggleUploadArea();
    }

    /**
     * Shows a loading indicator while processing.
     * @param {string} [message]
     */
    showLoading(message = 'Loading metadata...') {
        const content = document.getElementById('metadataContent');
        content.innerHTML = renderLoader(message);
        document.getElementById('metadataContainer').style.display = 'block';
    }

    /**
     * Displays an error message to the user.
     * @param {string} message
     */
    showError(message) {
        if (this.errorTimeout) clearTimeout(this.errorTimeout);

        this.uploadArea.classList.add('error');
        showToast(message, 'error');

        this.errorTimeout = setTimeout(() => {
            this.uploadArea.classList.remove('error');
            this.errorTimeout = null;
        }, 5000);
    }

//=============================================
// String Helpers
//=============================================

    /**
     * Escapes HTML special characters.
     * @param {string} text
     * @returns {string} Escaped string.
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text.toString();
        return div.innerHTML;
    }

    /**
     * Capitalizes the first letter of a string.
     * @param {string} str
     * @returns {string}
     */
    capitalizeFirstLetter(str) {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Formats a metadata key for display.
     * @param {string} key
     * @returns {string}
     */
    formatKey(key) {
        return this.capitalizeFirstLetter(this.escapeHtml(key));
    }
}

export default FileMetadataViewer;
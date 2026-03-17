//=============================================
// General File Utilities
//=============================================

/**
 * Downloads a Blob as a file via a temporary anchor element.
 * @param {Blob} blob - The Blob to download.
 * @param {string} filename - The suggested filename for the download.
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Reads a File object as text.
 * @param {File} file - The file to read.
 * @returns {Promise<string>} A promise that resolves with the file's text content.
 */
export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
    });
}

//=============================================
// ZIP Generator
//=============================================

let crc32Table = null;

function getCrc32Table() {
    if (crc32Table) return crc32Table;
    crc32Table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        crc32Table[i] = c;
    }
    return crc32Table;
}

function calculateCrc32(bytes) {
    const table = getCrc32Table();
    let crc = 0 ^ -1;
    for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ -1) >>> 0;
}

/**
 * Creates a ZIP file blob from an array of files without external libraries.
 * @param {Array<{name: string, content: string|Uint8Array}>} files - The files to include in the ZIP.
 * @returns {Blob} The generated ZIP blob.
 */
export function createZipBlob(files) {
    const textEncoder = new TextEncoder();
    const fileParts = [];
    const centralDirectoryParts = [];
    let centralDirectorySize = 0;
    let offset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >>> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

    files.forEach(file => {
        const nameBytes = textEncoder.encode(file.name);
        // Ensure content is encoded; accept both string and Uint8Array
        const contentBytes = typeof file.content === 'string' ? textEncoder.encode(file.content) : file.content;
        const crc = calculateCrc32(contentBytes);

        // General purpose bit flag: set Bit 11 for UTF-8 filename (0x0800)
        const flags = 0x0800;

        // Local file header (30 bytes + name length)
        const header = new ArrayBuffer(30 + nameBytes.length);
        const view = new DataView(header);
        view.setUint32(0, 0x04034b50, true); // Signature
        view.setUint16(4, 20, true);         // Version needed (2.0 for UTF-8)
        view.setUint16(6, flags, true);      // General purpose bit flag
        view.setUint16(8, 0, true);          // Compression method (0 = Store)
        view.setUint16(10, dosTime, true);
        view.setUint16(12, dosDate, true);
        view.setUint32(14, crc, true);
        view.setUint32(18, contentBytes.length, true); // Compressed size (no compression)
        view.setUint32(22, contentBytes.length, true); // Uncompressed size
        view.setUint16(26, nameBytes.length, true);
        view.setUint16(28, 0, true);                   // Extra field length
        new Uint8Array(header, 30).set(nameBytes);
        fileParts.push(new Uint8Array(header), contentBytes);

        // Central directory header (46 bytes + name length)
        const cdHeader = new ArrayBuffer(46 + nameBytes.length);
        const cdView = new DataView(cdHeader);
        cdView.setUint32(0, 0x02014b50, true); // Signature
        cdView.setUint16(4, 20, true);         // Made by (2.0)
        cdView.setUint16(6, 20, true);         // Version needed (2.0)
        cdView.setUint16(8, flags, true);      // General purpose bit flag
        cdView.setUint16(10, 0, true);         // Compression method (0 = Store)
        cdView.setUint16(12, dosTime, true);
        cdView.setUint16(14, dosDate, true);
        cdView.setUint32(16, crc, true);
        cdView.setUint32(20, contentBytes.length, true);
        cdView.setUint32(24, contentBytes.length, true);
        cdView.setUint16(28, nameBytes.length, true);
        cdView.setUint16(30, 0, true);         // Extra field length
        cdView.setUint16(32, 0, true);         // File comment length
        cdView.setUint16(34, 0, true);         // Disk number start
        cdView.setUint16(36, 0, true);         // Internal attr
        cdView.setUint32(38, 0, true);         // External attr
        cdView.setUint32(42, offset, true);    // Offset to local header
        new Uint8Array(cdHeader, 46).set(nameBytes);
        centralDirectoryParts.push(new Uint8Array(cdHeader));
        centralDirectorySize += cdHeader.byteLength;
        offset += header.byteLength + contentBytes.length;
    });

    // End of central directory record (22 bytes)
    const eocd = new ArrayBuffer(22);
    const eocdView = new DataView(eocd);
    eocdView.setUint32(0, 0x06054b50, true); // Signature
    eocdView.setUint16(4, 0, true);          // Disk number
    eocdView.setUint16(6, 0, true);          // Disk with CD
    eocdView.setUint16(8, files.length, true); // Entries on this disk
    eocdView.setUint16(10, files.length, true); // Total entries
    eocdView.setUint32(12, centralDirectorySize, true);
    eocdView.setUint32(16, offset, true);
    eocdView.setUint16(20, 0, true);         // Comment length

    const allParts = [...fileParts, ...centralDirectoryParts, new Uint8Array(eocd)];
    return new Blob(allParts, { type: 'application/zip' });
}

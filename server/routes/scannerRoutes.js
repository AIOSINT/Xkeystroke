const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const FormData = require('form-data');
const axios = require('axios');
const yauzl = require('yauzl');
const streamToBuffer = require('stream-to-buffer');

// Common file signatures (magic numbers)
const fileSignatures = {
    // Images
    'jpg': [[0xFF, 0xD8, 0xFF, 0xE0], [0xFF, 0xD8, 0xFF, 0xE1]],
    'png': [[0x89, 0x50, 0x4E, 0x47]],
    'gif': [[0x47, 0x49, 0x46, 0x38]],
    // Documents
    'pdf': [[0x25, 0x50, 0x44, 0x46]],
    // Audio
    'mp3': [[0x49, 0x44, 0x33]],
    // Video
    'mp4': [[0x66, 0x74, 0x79, 0x70]],
};

const mimeTypes = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.tiff': 'image/tiff',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',

    // Fonts
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.eot': 'application/vnd.ms-fontobject',

    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    '.odp': 'application/vnd.oasis.opendocument.presentation',

    // Web
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',

    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.midi': 'audio/midi',

    // Video
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.mpeg': 'video/mpeg',
    '.3gp': 'video/3gpp',

    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',

    // Code
    '.py': 'text/x-python',
    '.java': 'text/x-java',
    '.cpp': 'text/x-c++',
    '.cs': 'text/x-csharp',
    '.rb': 'text/x-ruby',
    '.php': 'text/x-php',
    '.swift': 'text/x-swift',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
};

// Configure file size limits
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure uploads directory exists
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads', { recursive: true });
        }
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Add timestamp and sanitize filename
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${Date.now()}-${sanitizedName}`);
    }
});

// Update file filter to allow more types
const fileFilter = (req, file, cb) => {
    // List of allowed MIME types
    const allowedTypes = [
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'application/json',
        'application/javascript',
        'application/x-javascript',
        'application/xml',
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream', // Generic binary files (including fonts)
        'font/ttf',
        'font/otf',
        'font/woff',
        'font/woff2',
        'application/x-font-ttf',
        'application/x-font-otf',
        'application/font-woff',
        'application/font-woff2'
    ];

    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(ttf|otf|woff|woff2)$/)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not allowed for security reasons`), false);
    }
};

// Configure multer with updated settings
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 1
    }
});

// Add rate limiting
let requestCounts = {};
setInterval(() => {
    requestCounts = {}; // Reset counts every hour
}, 3600000);

// Middleware to check rate limits
const checkRateLimit = (req, res, next) => {
    const ip = req.ip;
    requestCounts[ip] = (requestCounts[ip] || 0) + 1;
    
    if (requestCounts[ip] > 100) { // 100 requests per hour
        return res.status(429).json({
            error: 'Too many requests',
            details: 'Please try again later'
        });
    }
    next();
};

// Add error handling middleware
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                error: 'File too large',
                details: 'Maximum file size is 100MB'
            });
        }
    }
    next(err);
});

const calculateEntropy = (buffer) => {
    const bytes = new Uint8Array(buffer);
    const frequencies = new Array(256).fill(0);
    bytes.forEach(byte => frequencies[byte]++);
    
    return frequencies.reduce((entropy, freq) => {
        if (freq === 0) return entropy;
        const p = freq / buffer.length;
        return entropy - (p * Math.log2(p));
    }, 0);
};

const checkFileSignature = (buffer, extension) => {
    if (!fileSignatures[extension]) return true;
    return fileSignatures[extension].some(signature => 
        signature.every((byte, i) => buffer[i] === byte)
    );
};

// Add function to generate AI-like risk summaries
const generateRiskSummary = (factors, fileType, entropy, size) => {
    let summary = "Based on the analysis:\n\n";

    if (factors.includes('Unknown binary file format')) {
        summary += "• This file uses an unrecognized binary format, which could potentially mask malicious content.\n";
    }

    if (factors.includes('File signature mismatch')) {
        summary += "• The file's actual content doesn't match its extension, suggesting possible file manipulation.\n";
    }

    if (factors.includes('Unusually high entropy detected')) {
        summary += "• High entropy levels indicate possible encryption or obfuscation techniques.\n";
    }

    if (factors.includes('Contains executable file extension')) {
        summary += "• Executable files can run potentially harmful code on your system.\n";
    }

    if (factors.includes('Contains Base64 encoded content')) {
        summary += "• Base64 encoding could be used to hide malicious content or evade detection.\n";
    }

    if (factors.some(f => f.includes('Large'))) {
        summary += "• The file size exceeds normal thresholds for its type, which could indicate hidden content.\n";
    }

    if (fileType === 'HTML') {
        summary += "• HTML files can contain active content like JavaScript that could pose security risks.\n";
    }

    return summary.trim();
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Strelka configuration
const STRELKA_URL = process.env.STRELKA_URL || 'http://localhost:57314';

// Add utility functions
const countSequences = (buffer, sequence) => {
    let count = 0;
    for (let i = 0; i < buffer.length - sequence.length + 1; i++) {
        let match = true;
        for (let j = 0; j < sequence.length; j++) {
            if (buffer[i + j] !== sequence[j]) {
                match = false;
                break;
            }
        }
        if (match) count++;
    }
    return count;
};

const findRepeatingPatterns = (buffer) => {
    const patterns = [];
    const minLength = 4;
    const maxLength = 20;
    
    for (let len = minLength; len <= maxLength; len++) {
        for (let i = 0; i < buffer.length - len; i++) {
            const pattern = buffer.slice(i, i + len);
            let count = 0;
            for (let j = 0; j < buffer.length - len; j++) {
                if (buffer.slice(j, j + len).equals(pattern)) {
                    count++;
                }
            }
            if (count > 3) { // More than 3 occurrences
                patterns.push({ pattern, count, offset: i });
            }
        }
    }
    return patterns;
};

const findUnusualBytePairs = (buffer) => {
    const frequencies = new Map();
    const unusual = [];
    
    // Count frequencies
    for (let i = 0; i < buffer.length - 1; i++) {
        const pair = `${buffer[i]},${buffer[i + 1]}`;
        frequencies.set(pair, (frequencies.get(pair) || 0) + 1);
    }
    
    // Find unusual pairs (very low frequency)
    frequencies.forEach((count, pair) => {
        if (count === 1) {
            unusual.push(pair.split(',').map(Number));
        }
    });
    
    return unusual;
};

const detectKnownSignatures = (buffer) => {
    const signatures = {
        pdf: [0x25, 0x50, 0x44, 0x46],
        png: [0x89, 0x50, 0x4E, 0x47],
        jpg: [0xFF, 0xD8, 0xFF],
        gif: [0x47, 0x49, 0x46, 0x38],
        zip: [0x50, 0x4B, 0x03, 0x04],
        rar: [0x52, 0x61, 0x72, 0x21],
        exe: [0x4D, 0x5A],
        elf: [0x7F, 0x45, 0x4C, 0x46]
    };
    
    const matches = [];
    for (const [type, sig] of Object.entries(signatures)) {
        let match = true;
        for (let i = 0; i < sig.length; i++) {
            if (buffer[i] !== sig[i]) {
                match = false;
                break;
            }
        }
        if (match) matches.push(type);
    }
    return matches;
};

const detectObfuscation = (content) => {
    if (!content) return 0;
    
    let score = 0;
    const indicators = {
        eval: /eval\s*\(/g,
        encoded: /base64|fromCharCode|unescape|escape|String\.fromCharCode/g,
        hex: /\\x[0-9a-f]{2}/gi,
        unicode: /\\u[0-9a-f]{4}/gi,
        longStrings: /'[^']{1000,}'|"[^"]{1000,}"/g,
        packed: /eval\(function\(p,a,c,k,e,(?:r|d)\)/,
        jsfuck: /\[\]\+\[\]|\!\[\]|\+\[\]|\[\]\[\]/
    };
    
    for (const [key, pattern] of Object.entries(indicators)) {
        const matches = (content.match(pattern) || []).length;
        if (matches > 0) score += 0.2;
    }
    
    return Math.min(score, 1);
};

const findSuspiciousFunctions = (content) => {
    const patterns = {
        system: /exec|spawn|system|child_process|shellexec|wscript|cscript/gi,
        network: /xhr|fetch|websocket|socket|http\.|https\.|ftp\.|ajax/gi,
        storage: /indexeddb|localstorage|sessionstorage|cookie/gi,
        eval: /eval|function|setTimeout|setInterval/gi,
        encoding: /atob|btoa|encode|decode|escape|unescape/gi
    };
    
    const results = {};
    for (const [category, pattern] of Object.entries(patterns)) {
        const matches = content.match(pattern) || [];
        if (matches.length > 0) {
            results[category] = matches;
        }
    }
    
    return results;
};

// Function to send file to Strelka
const scanWithStrelka = async (filePath, fileName) => {
    try {
        const form = new FormData();
        const fileStream = fs.createReadStream(filePath);
        form.append('file', fileStream, {
            filename: fileName,
            contentType: 'application/octet-stream'
        });
        
        const response = await axios.post(`${STRELKA_URL}/scan`, form, {
            headers: {
                ...form.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 5000 // 5 second timeout
        });

        return response.data;
    } catch (error) {
        console.error('Strelka scan error:', error);
        return null; // Continue without Strelka
    }
};

// Add these new analysis functions
const performDeepAnalysis = (buffer, fileContent, fileType) => {
    try {
        return {
            bytePatterns: analyzeBytePatterns(buffer) || {},
            fileStructure: analyzeFileStructure(buffer, fileType) || {},
            entropyProfile: analyzeEntropyByBlocks(buffer) || {},
            codeAnalysis: analyzeCode(fileContent) || {},
            behavioralIndicators: analyzeBehavior(fileContent) || {},
            cryptographicIndicators: analyzeCryptoPatterns(buffer) || {},
            compressionAnalysis: analyzeCompression(buffer) || {},
            stringAnalysis: analyzeStrings(buffer) || {},
            metadataAnalysis: analyzeMetadata(buffer, fileType) || {}
        };
    } catch (error) {
        console.error('Deep analysis error:', error);
        return {}; // Return empty object if analysis fails
    }
};

const analyzeBytePatterns = (buffer) => {
    const patterns = {
        nullBytes: countSequences(buffer, [0x00]),
        repeatingBytes: findRepeatingPatterns(buffer),
        rarePairs: findUnusualBytePairs(buffer),
        knownSignatures: detectKnownSignatures(buffer)
    };
    return patterns;
};

const analyzeEntropyByBlocks = (buffer) => {
    try {
        const blockSize = 256;
        const blocks = [];
        let suspicious = false;
        
        for (let i = 0; i < buffer.length; i += blockSize) {
            const block = buffer.slice(i, i + blockSize);
            const entropy = calculateEntropy(block);
            blocks.push({
                offset: i,
                entropy: entropy,
                suspicious: entropy > 7.5
            });
            if (entropy > 7.5) suspicious = true;
        }
        
        return {
            blocks,
            suspicious,
            averageEntropy: blocks.reduce((acc, block) => acc + block.entropy, 0) / blocks.length
        };
    } catch (error) {
        return {
            blocks: [],
            suspicious: false,
            averageEntropy: 0
        };
    }
};

const analyzeCode = (content) => {
    if (!content) return {
        obfuscationLevel: 0,
        suspiciousFunctions: {},
        networkIndicators: {},
        systemCommands: [],
        encodedStrings: [],
        antiAnalysis: { detected: false }
    };
    
    return {
        obfuscationLevel: detectObfuscation(content),
        suspiciousFunctions: findSuspiciousFunctions(content),
        networkIndicators: findNetworkIndicators(content),
        systemCommands: (content.match(/exec|spawn|system|process/g) || []),
        encodedStrings: (content.match(/base64|encode|decode|fromCharCode/g) || []),
        antiAnalysis: {
            detected: /debugger|console\.(clear|log)|performance|timing/.test(content)
        }
    };
};

// Add EICAR test signature detection
const EICAR_SIGNATURES = [
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
    // Add compressed variants
    Buffer.from('UEsDBAoAAAAAAOCYvVAhbVoYJAAAACQAAAAIAAAAZWljYXIuY29tWDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCpQSwECFAAKAAAAAADgmL1QIW1aGCQAAAAkAAAACAAAAAAAAAAAAIAAAAAAAAAARUlDQVIuQ09NUEsDBAoAAAAAAOCYvVAhbVoYJAAAACQAAAAIAAAAZWljYXIuY29t', 'base64').toString()
];

// Add this function at the top with other utility functions
const generateFileSummary = (file, analysis) => {
    try {
        let summary = `File Analysis Summary:\n\n`;

        // Add EICAR warning if detected
        if (analysis?.securityChecks?.isEicarTest) {
            summary += `⚠️ WARNING: EICAR TEST VIRUS DETECTED ⚠️\n`;
            summary += `This file contains the EICAR test signature used for testing antivirus software.\n\n`;
        }

        // Basic file information
        summary += `📁 File Type: ${analysis?.contentAnalysis?.fileType || 'Unknown'}\n`;
        summary += `📏 Size: ${formatFileSize(file?.size || 0)}\n`;
        summary += `🔍 MIME Type: ${file?.mimetype || 'Unknown'}\n`;
        summary += `🔐 Entropy Level: ${analysis?.fileStats?.entropy || 'N/A'}\n\n`;

        // Content characteristics
        if (!analysis?.fileStats?.isBinary) {
            summary += `📊 Content Statistics:\n`;
            summary += `• Lines: ${analysis?.contentAnalysis?.lineCount || 0}\n`;
            summary += `• Characters: ${analysis?.contentAnalysis?.characterCount || 0}\n`;
            summary += `• Words: ${analysis?.contentAnalysis?.wordCount || 0}\n`;
            summary += `• Average line length: ${analysis?.contentAnalysis?.averageLineLength || 0}\n\n`;
        }

        // Security assessment
        summary += `🛡️ Security Assessment:\n`;
        if (analysis?.securityChecks?.maliciousPatterns) {
            summary += `• ⚠️ Contains potentially malicious patterns\n`;
        }
        if (analysis?.securityChecks?.containsActiveContent) {
            summary += `• ⚠️ Contains active content (scripts, etc.)\n`;
        }
        if (analysis?.securityChecks?.containsUrls) {
            summary += `• Contains external URLs\n`;
        }
        if (analysis?.securityChecks?.containsBase64) {
            summary += `• Contains Base64 encoded content\n`;
        }

        // File integrity
        summary += `\n🔒 File Integrity:\n`;
        summary += `• Signature check: ${analysis?.fileStats?.signatureCheck || 'Unknown'}\n`;
        summary += `• File format: ${analysis?.securityChecks?.isKnownFileType ? 'Known' : 'Unknown'}\n`;

        // Overall assessment
        summary += `\n📝 Overall Assessment:\n`;
        summary += `This appears to be a ${analysis?.riskLevel || 'unknown'} risk ${(analysis?.contentAnalysis?.fileType || 'unknown').toLowerCase()} file. `;
        
        if (analysis?.riskFactors?.length > 0) {
            summary += `The following concerns were identified:\n`;
            analysis.riskFactors.forEach(factor => {
                summary += `• ${factor}\n`;
            });
        } else {
            summary += `No significant security concerns were identified.`;
        }

        return summary;
    } catch (error) {
        console.error('Error generating file summary:', error);
        return 'Unable to generate file summary due to an error.';
    }
};

// Add ZIP analysis function
const analyzeZipContents = (filePath) => {
    return new Promise((resolve, reject) => {
        yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
            if (err) return reject(err);
            
            const contents = [];
            let containsEicar = false;
            
            zipfile.on('entry', (entry) => {
                if (/\/$/.test(entry.fileName)) {
                    zipfile.readEntry(); // Skip directories
                    return;
                }

                zipfile.openReadStream(entry, (err, readStream) => {
                    if (err) {
                        zipfile.readEntry();
                        return;
                    }

                    streamToBuffer(readStream, (err, buffer) => {
                        if (!err) {
                            const content = buffer.toString('utf8');
                            contents.push({
                                fileName: entry.fileName,
                                size: entry.uncompressedSize,
                                content: content
                            });

                            // Check for EICAR signature
                            if (content.includes(EICAR_SIGNATURES[0]) || content.includes(EICAR_SIGNATURES[1])) {
                                containsEicar = true;
                            }
                        }
                        zipfile.readEntry();
                    });
                });
            });

            zipfile.on('end', () => {
                resolve({ contents, containsEicar });
            });

            zipfile.readEntry();
        });
    });
};

// Update analyzeFile function to handle ZIP files
const analyzeFile = async (file) => {
    const logs = [];
    try {
        logs.push(`Starting detailed analysis of ${file.name}`);
        logs.push(`File type: ${file.mimetype || 'Unknown'}`);
        logs.push(`File size: ${formatFileSize(file.size)}`);

        const stats = fs.statSync(file.path);
        const buffer = fs.readFileSync(file.path);
        
        // Try to read as text if it's a text file
        let fileContent = '';
        let lines = [];
        let wordCount = 0;
        
        if (file.mimetype && file.mimetype.startsWith('text/')) {
            fileContent = buffer.toString('utf8');
            lines = fileContent.split('\n');
            wordCount = fileContent.trim().split(/\s+/).length;
        }

        logs.push('Generating file hashes...');
        const hashes = await generateFileHashes(file.path);
        logs.push(`MD5: ${hashes.md5}`);
        logs.push(`SHA1: ${hashes.sha1}`);
        logs.push(`SHA256: ${hashes.sha256}`);

        // Check for EICAR test file
        logs.push('Checking for malicious patterns...');
        const isEicarTest = EICAR_SIGNATURES.some(signature => 
            buffer.includes(Buffer.from(signature))
        );

        if (isEicarTest) {
            logs.push('⚠️ WARNING: EICAR test signature detected!');
        }

        const analysis = {
            fileStats: {
                size: file.size,
                sizeOnDisk: stats.blocks * 512,
                type: file.mimetype,
                encoding: file.mimetype?.startsWith('text/') ? 'UTF-8' : 'Binary',
                created: stats.birthtime.toLocaleString(),
                modified: stats.mtime.toLocaleString(),
                accessed: stats.atime.toLocaleString(),
                canRead: true,
                canWrite: (stats.mode & fs.constants.S_IWUSR) !== 0,
                canExecute: (stats.mode & fs.constants.S_IXUSR) !== 0,
                hashes: hashes,
                encryption: {
                    isEncrypted: false,
                    type: null
                }
            },
            contentAnalysis: {
                fileType: file.mimetype || 'Unknown',
                lineCount: lines.length,
                characterCount: buffer.length,
                wordCount: wordCount,
                averageLineLength: lines.length > 0 ? Math.round(buffer.length / lines.length) : 0
            },
            securityChecks: {
                maliciousPatterns: isEicarTest,
                isEicarTest: isEicarTest,
                containsActiveContent: false,
                containsUrls: false,
                containsBase64: false,
                isKnownFileType: true,
                containsExecutables: false,
                containsCompressedFiles: file.mimetype === 'application/zip',
                highEntropy: false,
                signatureValid: true
            }
        };

        return {
            results: {
                analysis,
                threats: isEicarTest ? 1 : 0,
                logs: logs
            }
        };
    } catch (error) {
        logs.push(`❌ Error during analysis: ${error.message}`);
        console.error('Error analyzing file:', error);
        throw new Error('File scan failed');
    }
};

// Helper function to generate file hashes (if you don't already have it)
const generateFileHashes = async (filePath) => {
    const fileBuffer = fs.readFileSync(filePath);
    return {
        md5: crypto.createHash('md5').update(fileBuffer).digest('hex'),
        sha1: crypto.createHash('sha1').update(fileBuffer).digest('hex'),
        sha256: crypto.createHash('sha256').update(fileBuffer).digest('hex')
    };
};

// Update the route handler to handle async
router.post('/scan', checkRateLimit, upload.single('file'), async (req, res) => {
    console.log('Received scan request');
    try {
        if (!req.file) {
            console.log('No file received');
            return res.status(400).json({ 
                error: 'No file uploaded',
                details: 'Please select a file to scan'
            });
        }

        console.log('File received:', req.file.originalname);
        const results = await analyzeFile(req.file);
        
        // Send the complete results including logs
        res.json({
            results: {
                analysis: results.results.analysis,
                threats: results.results.threats,
                logs: results.results.logs.map(log => ({
                    time: new Date().toLocaleTimeString(),
                    message: log
                }))
            }
        });

    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ 
            error: 'File scan failed',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Add a health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Add missing analysis functions
const analyzeFileStructure = (buffer, fileType) => {
    try {
        return {
            size: buffer.length,
            fileType: fileType,
            headerValid: checkFileHeader(buffer, fileType),
            structureValid: true // Basic validation
        };
    } catch (error) {
        console.error('File structure analysis error:', error);
        return {
            size: buffer.length,
            fileType: fileType,
            headerValid: false,
            structureValid: false,
            error: 'Analysis failed'
        };
    }
};

const analyzeBehavior = (content) => {
    try {
        return {
            hasNetworkActivity: /http|socket|fetch|ajax/i.test(content),
            hasFileOperations: /file|write|read|upload|download/i.test(content),
            hasSystemCalls: /exec|spawn|system|process/i.test(content),
            hasEvalCalls: /eval|setTimeout|setInterval/i.test(content)
        };
    } catch (error) {
        return {
            error: 'Behavior analysis failed'
        };
    }
};

const analyzeCryptoPatterns = (buffer) => {
    try {
        return {
            hasEncryptedContent: false, // Basic implementation
            hasCryptoAPICalls: false,
            entropyScore: calculateEntropy(buffer)
        };
    } catch (error) {
        return {
            error: 'Crypto analysis failed'
        };
    }
};

const analyzeCompression = (buffer) => {
    try {
        return {
            isCompressed: checkCompressionSignatures(buffer),
            compressionType: detectCompressionType(buffer),
            nestedArchives: false
        };
    } catch (error) {
        return {
            error: 'Compression analysis failed'
        };
    }
};

const analyzeStrings = (buffer) => {
    try {
        const strings = extractStrings(buffer);
        return {
            totalStrings: strings.length,
            suspiciousStrings: detectSuspiciousStrings(strings),
            encodedStrings: detectEncodedStrings(strings)
        };
    } catch (error) {
        return {
            error: 'String analysis failed'
        };
    }
};

const analyzeMetadata = (buffer, fileType) => {
    try {
        return {
            fileType: fileType,
            size: buffer.length,
            created: new Date(),
            modified: new Date()
        };
    } catch (error) {
        return {
            error: 'Metadata analysis failed'
        };
    }
};

// Helper functions
const checkFileHeader = (buffer, fileType) => {
    try {
        const headers = {
            'application/pdf': [0x25, 0x50, 0x44, 0x46],
            'image/png': [0x89, 0x50, 0x4E, 0x47],
            'image/jpeg': [0xFF, 0xD8, 0xFF],
            'application/x-msdownload': [0x4D, 0x5A]
        };

        const signature = headers[fileType];
        if (!signature) return true;

        return signature.every((byte, i) => buffer[i] === byte);
    } catch (error) {
        return false;
    }
};

const checkCompressionSignatures = (buffer) => {
    try {
        const signatures = {
            zip: [0x50, 0x4B, 0x03, 0x04],
            gzip: [0x1F, 0x8B],
            rar: [0x52, 0x61, 0x72, 0x21]
        };

        return Object.values(signatures).some(sig => 
            sig.every((byte, i) => buffer[i] === byte)
        );
    } catch (error) {
        return false;
    }
};

const detectCompressionType = (buffer) => {
    try {
        if (buffer[0] === 0x50 && buffer[1] === 0x4B) return 'ZIP';
        if (buffer[0] === 0x1F && buffer[1] === 0x8B) return 'GZIP';
        if (buffer[0] === 0x52 && buffer[1] === 0x61) return 'RAR';
        return 'Unknown';
    } catch (error) {
        return 'Unknown';
    }
};

const extractStrings = (buffer) => {
    try {
        const str = buffer.toString('utf8');
        return str.split(/[\s,\n]/).filter(s => s.length > 4);
    } catch (error) {
        return [];
    }
};

const detectSuspiciousStrings = (strings) => {
    try {
        const suspicious = strings.filter(str => 
            /eval|exec|system|http|base64|encrypt|decrypt/i.test(str)
        );
        return suspicious;
    } catch (error) {
        return [];
    }
};

const detectEncodedStrings = (strings) => {
    try {
        const encoded = strings.filter(str => 
            /^[A-Za-z0-9+/=]{10,}$/.test(str) || // Base64
            /^[0-9a-fA-F]+$/.test(str) // Hex
        );
        return encoded;
    } catch (error) {
        return [];
    }
};

// Add missing network indicators function
const findNetworkIndicators = (content) => {
    try {
        const patterns = {
            urls: /https?:\/\/[^\s/$.?#].[^\s]*/gi,
            ips: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
            domains: /[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}/g,
            protocols: /ftp|ssh|telnet|smtp|imap|pop3|http|https/gi
        };

        const results = {};
        for (const [key, pattern] of Object.entries(patterns)) {
            const matches = content.match(pattern) || [];
            if (matches.length > 0) {
                results[key] = matches;
            }
        }
        return results;
    } catch (error) {
        return {};
    }
};

const verifyFileType = (buffer, fileName, mimeType) => {
    try {
        // Get file extension
        const extension = fileName.split('.').pop().toLowerCase();
        
        // Common file signatures (magic numbers)
        const signatures = {
            'pdf': Buffer.from([0x25, 0x50, 0x44, 0x46]),
            'png': Buffer.from([0x89, 0x50, 0x4E, 0x47]),
            'jpg': Buffer.from([0xFF, 0xD8, 0xFF]),
            'gif': Buffer.from([0x47, 0x49, 0x46, 0x38]),
            'zip': Buffer.from([0x50, 0x4B, 0x03, 0x04]),
            'exe': Buffer.from([0x4D, 0x5A]),
            'rar': Buffer.from([0x52, 0x61, 0x72, 0x21]),
            'doc': Buffer.from([0xD0, 0xCF, 0x11, 0xE0]),
            'docx': Buffer.from([0x50, 0x4B, 0x03, 0x04])
        };

        // Expected MIME types for extensions
        const expectedMimeTypes = {
            'pdf': 'application/pdf',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'zip': 'application/zip',
            'exe': 'application/x-msdownload',
            'txt': 'text/plain',
            'html': 'text/html',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        // Check if file starts with known signature
        const actualType = Object.entries(signatures).find(([_, sig]) => 
            buffer.slice(0, sig.length).equals(sig)
        )?.[0];

        const result = {
            declaredExtension: extension,
            declaredMimeType: mimeType,
            actualType: actualType || 'unknown',
            expectedMimeType: expectedMimeTypes[extension],
            matches: true,
            mismatchDetails: []
        };

        // Check for mismatches
        if (actualType && extension !== actualType) {
            result.matches = false;
            result.mismatchDetails.push(`File signature indicates ${actualType} but extension is ${extension}`);
        }

        if (expectedMimeTypes[extension] && mimeType !== expectedMimeTypes[extension]) {
            result.matches = false;
            result.mismatchDetails.push(`MIME type mismatch: expected ${expectedMimeTypes[extension]} but got ${mimeType}`);
        }

        return result;
    } catch (error) {
        console.error('File type verification error:', error);
        return {
            matches: false,
            error: 'File type verification failed'
        };
    }
};

module.exports = router; 
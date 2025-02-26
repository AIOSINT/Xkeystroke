import React, { useState, useEffect, useRef } from 'react';
import './FileScanner.css';

// Move formatKey to be a utility function at the top level
const formatKey = (key) => {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
};

// eslint-disable-next-line no-unused-vars
const RiskBadge = ({ level }) => (
    <span className={`risk-badge ${level}`}>
        <span role="img" aria-label={`Risk level: ${level}`}>
            {level === 'high' ? '🔴' : level === 'medium' ? '🟡' : '🟢'}
        </span>
        {level}
    </span>
);

const AnalysisSection = ({ title, data }) => {
    if (!data || Object.keys(data).length === 0) return null;
    
    const securityTooltips = {
        maliciousPatterns: "Known patterns associated with malware or suspicious code",
        isEicarTest: "EICAR test file used to verify antivirus detection",
        containsActiveContent: "Contains scripts or code that can be executed",
        containsUrls: "Contains web links or URLs that could be malicious",
        containsBase64: "Contains encoded data that could hide malicious content",
        isKnownFileType: "File extension matches its actual content type",
        containsExecutables: "Contains or is an executable program",
        containsCompressedFiles: "Contains compressed or archived files",
        highEntropy: "High randomness in data, possible encryption or obfuscation",
        signatureValid: "File's digital signature is valid and trusted",
        canExecute: "File has executable permissions",
        isEncrypted: "File content is encrypted"
    };

    const fileStatTooltips = {
        size: "Total size of the file in bytes",
        sizeOnDisk: "Actual space the file occupies on the storage device, may differ from file size due to block size allocation",
        type: "MIME type indicating the format and nature of the file",
        encoding: "Character encoding system used to represent the file's content (e.g., Binary, UTF-8, ASCII)",
        created: "Timestamp when the file was originally created",
        modified: "Last timestamp when the file content was changed",
        accessed: "Last timestamp when the file was read or accessed",
        canRead: "Whether the current user has permission to read the file",
        canWrite: "Whether the current user has permission to modify the file",
        canExecute: "Whether the file has executable permissions",
        hashes: "Cryptographic hash values used to verify file integrity and uniquely identify content",
        encryption: "Indicates if the file content is encrypted and the encryption method used"
    };

    const contentAnalysisTooltips = {
        fileType: "The detected type of file based on its content and structure",
        lineCount: "Total number of lines in the file",
        characterCount: "Total number of characters in the file",
        wordCount: "Total number of words in text-based files",
        averageLineLength: "Average number of characters per line"
    };

    const formatValue = (value, key) => {
        const dangerKeys = [
            'containsExecutableCode',
            'containsActiveContent',
            'maliciousPatterns',
            'containsBase64',
            'containsExecutables',
            'containsCompressedFiles',
            'containsUrls',
            'highEntropy',
            'antiAnalysis',
            'containsThreats',
            'isEicarTest',
            'canExecute'
        ];

        const safeKeys = [
            'isKnownFileType',
            'signatureValid',
            'signatureCheck',
            'integrityValid'
        ];

        const badgeStyle = {
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: '500',
            backgroundColor: 'transparent',
            display: 'inline-block',
            width: 'fit-content'
        };

        // Special handling for encryption object
        if (key === 'encryption') {
            const isEncrypted = value.isEncrypted;
            badgeStyle.backgroundColor = isEncrypted ? '#dc354520' : '#28a74520';
            badgeStyle.color = isEncrypted ? '#dc3545' : '#28a745';
            return <span style={badgeStyle}>{isEncrypted ? `Yes (${value.type})` : 'No'}</span>;
        }

        // Special handling for security checks
        if (title === "Security Checks" && typeof value === 'boolean') {
            if (dangerKeys.includes(key)) {
                badgeStyle.backgroundColor = value ? '#dc354520' : '#28a74520';
                badgeStyle.color = value ? '#dc3545' : '#28a745';
            } else if (safeKeys.includes(key)) {
                badgeStyle.backgroundColor = value ? '#28a74520' : '#dc354520';
                badgeStyle.color = value ? '#28a745' : '#dc3545';
            } else {
                badgeStyle.backgroundColor = value ? '#28a74520' : '#dc354520';
                badgeStyle.color = value ? '#28a745' : '#dc3545';
            }
            
            return (
                <div className="security-check-wrapper">
                    <span style={badgeStyle}>{value ? 'Yes' : 'No'}</span>
                    {securityTooltips[key] && (
                        <span className="security-tooltip">{securityTooltips[key]}</span>
                    )}
                </div>
            );
        }

        // Handle boolean values
        if (typeof value === 'boolean') {
            if (dangerKeys.includes(key)) {
                badgeStyle.backgroundColor = value ? '#dc354520' : '#28a74520';
                badgeStyle.color = value ? '#dc3545' : '#28a745';
            } else if (safeKeys.includes(key)) {
                badgeStyle.backgroundColor = value ? '#28a74520' : '#dc354520';
                badgeStyle.color = value ? '#28a745' : '#dc3545';
            } else {
                badgeStyle.backgroundColor = value ? '#28a74520' : '#dc354520';
                badgeStyle.color = value ? '#28a745' : '#dc3545';
            }
            return <span style={badgeStyle}>{value ? 'Yes' : 'No'}</span>;
        }
        
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        
        if (typeof value === 'object' && value !== null) {
            if (key === 'hashes') {
                return (
                    <div className="hash-container">
                        {Object.entries(value).map(([hashType, hash]) => (
                            <div key={hashType} className="hash-entry">
                                <div className="hash-type">{hashType.toUpperCase()}</div>
                                <div className="hash-value">
                                    <code>{hash}</code>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
            return JSON.stringify(value);
        }
        
        if (title === "Security Checks") {
            return (
                <div className="security-check-item">
                    <span style={badgeStyle}>{value ? 'Yes' : 'No'}</span>
                    {securityTooltips[key] && (
                        <div className="tooltip">{securityTooltips[key]}</div>
                    )}
                </div>
            );
        }
        
        if (title === "File Statistics") {
            return (
                <div className="stat-check-item">
                    <span style={badgeStyle}>
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                    </span>
                    {fileStatTooltips[key] && (
                        <div className="tooltip">{fileStatTooltips[key]}</div>
                    )}
                </div>
            );
        }

        if (title === "Content Analysis") {
            return (
                <div className="stat-check-item">
                    <span style={badgeStyle}>
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                    </span>
                    {contentAnalysisTooltips[key] && (
                        <div className="tooltip">{contentAnalysisTooltips[key]}</div>
                    )}
                </div>
            );
        }
        
        return value || 'N/A';
    };

    return (
        <div className="analysis-section">
            <h4>{title}</h4>
            <div className="analysis-grid">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="analysis-item">
                        <span className="analysis-label">{formatKey(key)}</span>
                        <span className="analysis-value">{formatValue(value, key)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };
    
    return (
        <button 
            className="copy-button" 
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy to clipboard"}
        >
            {copied ? "✓" : "📋"}
        </button>
    );
};

// eslint-disable-next-line no-unused-vars
const HashSection = ({ hashes }) => {
    if (!hashes) return null;
    
    return (
        <div className="hashes-section">
            <div className="hash-grid">
                {Object.entries(hashes).map(([type, hash]) => (
                    <div key={type} className="hash-item">
                        <span className="hash-type">{type.toUpperCase()}</span>
                        <div className="hash-value-container">
                            <span className="hash-value">{hash}</span>
                            <CopyButton text={hash} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// eslint-disable-next-line no-unused-vars
const StatisticsSection = ({ stats }) => {
    if (!stats || Object.keys(stats).length === 0) return null;
    
    const formatValue = (value, key) => {
        if (typeof value === 'number') {
            if (key === 'processingTime') return `${value}ms`;
            if (key === 'bytesAnalyzed') return `${(value / 1024).toFixed(2)} KB`;
            return value.toLocaleString();
        }
        return value || 'N/A';
    };

    return (
        <div className="statistics-section">
            <h4>File Statistics</h4>
            <div className="analysis-grid">
                {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="analysis-item">
                        <span className="analysis-label">{formatKey(key)}</span>
                        <span className="analysis-value">{formatValue(value, key)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// eslint-disable-next-line no-unused-vars
const RiskFactors = ({ factors, summary, fileSummary }) => (
    <div className="risk-factors">
        {factors && factors.length > 0 && (
            <>
                <h4>Risk Factors</h4>
                <ul>
                    {factors.map((factor, index) => (
                        <li key={index} className="risk-factor-item">
                            <span role="img" aria-label="Warning">⚠️</span> {factor}
                        </li>
                    ))}
                </ul>
                {summary && (
                    <div className="risk-summary">
                        <h4>Risk Analysis</h4>
                        <pre className="summary-text">{summary}</pre>
                    </div>
                )}
            </>
        )}
        <div className="file-summary">
            <h4>File Analysis</h4>
            <pre className="summary-text">{fileSummary}</pre>
        </div>
    </div>
);

// eslint-disable-next-line no-unused-vars
const BinaryFileInfo = ({ data }) => {
    // Implementation
};

// eslint-disable-next-line no-unused-vars
const FileSummary = ({ summary }) => {
    // Implementation
};

// eslint-disable-next-line no-unused-vars
const ContentStats = ({ stats }) => {
    // Implementation
};

// eslint-disable-next-line no-unused-vars
const NetworkBackground = () => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const points = [];
        const numPoints = 30;
        const connectionDistance = 150;
        
        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        for (let i = 0; i < numPoints; i++) {
            points.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw points
            points.forEach(point => {
                point.x += point.vx;
                point.y += point.vy;
                
                if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
                if (point.y < 0 || point.y > canvas.height) point.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#4a90e2';
                ctx.fill();
            });
            
            // Draw connections
            points.forEach((point, i) => {
                points.slice(i + 1).forEach(otherPoint => {
                    const distance = Math.hypot(point.x - otherPoint.x, point.y - otherPoint.y);
                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(otherPoint.x, otherPoint.y);
                        ctx.strokeStyle = `rgba(74, 144, 226, ${1 - distance / connectionDistance})`;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                });
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);
    
    return <canvas ref={canvasRef} />;
};

const FileScanner = () => {
    const [scannedFiles, setScannedFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        return () => {
            setSelectedFile(null);
            setScanning(false);
            setScanProgress(0);
        };
    }, []);

    const handleFileSelection = (file) => {
        setSelectedFile(file);
    };

    // eslint-disable-next-line no-unused-vars
    const addLog = (message) => {
        // Implementation for future use
    };

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        for (const file of files) {
            console.log('Starting upload for file:', file.name);
            setScanning(true);
            setScanProgress(0);
            
            const tempFile = {
                id: Date.now() + Math.random(),
                name: file.name,
                logs: [{
                    time: new Date().toLocaleTimeString(),
                    message: `Starting scan of ${file.name}`
                }],
                status: 'scanning',
                size: (file.size / 1024).toFixed(2) + ' KB',
                type: file.type || 'Unknown',
                date: new Date().toISOString().split('T')[0],
            };

            setScannedFiles(prev => [tempFile, ...prev]);
            setSelectedFile(tempFile);

            const formData = new FormData();
            formData.append('file', file);

            try {
                let progressInterval = setInterval(() => {
                    setScanProgress(prev => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return prev;
                        }
                        return prev + Math.random() * 10;
                    });
                }, 500);

                console.log('Sending request to server...');
                const response = await fetch('http://localhost:3001/api/scanner/scan', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                });

                console.log('Response received:', response.status);
                clearInterval(progressInterval);
                setScanProgress(100);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Response data:', data);

                // Create a new log entry for scan completion
                const completionLog = {
                    time: new Date().toLocaleTimeString(),
                    message: `Scan completed successfully`
                };

                // Combine all logs: initial + server logs + completion
                const allLogs = [
                    ...(tempFile.logs || []),
                    ...(data.results.logs || []),
                    completionLog
                ];

                // Update the selected file with all information including logs
                setSelectedFile(prev => ({
                    ...prev,
                    ...data.results,
                    logs: allLogs,
                    status: data.results.threats > 0 ? 'suspicious' : 'clean'
                }));

                // Update the scanned files list
                setScannedFiles(prev => prev.map(f => 
                    f.id === tempFile.id 
                        ? { 
                            ...f, 
                            ...data.results,
                            logs: allLogs,
                            status: data.results.threats > 0 ? 'suspicious' : 'clean' 
                        }
                        : f
                ));

            } catch (err) {
                console.error('Error during scan:', err);
                const errorLog = {
                    time: new Date().toLocaleTimeString(),
                    message: `Error: ${err.message}`
                };

                setError(`Failed to scan ${file.name}: ${err.message}`);
                setSelectedFile(prev => ({
                    ...prev,
                    logs: [...(prev?.logs || []), errorLog],
                    status: 'error'
                }));
            } finally {
                setScanning(false);
                setScanProgress(0);
            }
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // eslint-disable-next-line no-unused-vars
    const securityAssessment = `
        <span role="img" aria-label="Shield">🛡️</span> Security Assessment:
        ${selectedFile?.analysis?.securityChecks?.maliciousPatterns ? 
            `<span role="img" aria-label="Warning">⚠️</span> Contains potentially malicious patterns\n` 
            : ''}
    `;

    const handleDeleteScan = (e, fileId) => {
        e.stopPropagation();
        setScannedFiles(prev => prev.filter(file => file.id !== fileId));
        if (selectedFile?.id === fileId) {
            setSelectedFile(null);
        }
    };

    // eslint-disable-next-line no-unused-vars
    const formatCheckName = (check) => {
        // Implementation for future use
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (event) => {
        event.preventDefault();
        setIsDragging(false);
        
        const files = Array.from(event.dataTransfer.files);
        if (files.length === 0) return;

        for (const file of files) {
            await handleFileUpload({ target: { files: [file] } });
        }
    };

    const renderAnalysis = () => {
        if (!selectedFile || !selectedFile.analysis) return null;

        return (
            <div className="analysis-container">
                <AnalysisSection title="File Statistics" data={selectedFile.analysis.fileStats} />
                <AnalysisSection title="Content Analysis" data={selectedFile.analysis.contentAnalysis} />
                <AnalysisSection title="Security Checks" data={selectedFile.analysis.securityChecks} />
            </div>
        );
    };

    // eslint-disable-next-line no-unused-vars
    const InfoItem = ({ label, value }) => {
        // Implementation for future use
    };

    // eslint-disable-next-line no-unused-vars
    const SecurityChecks = ({ data }) => {
        // Add null check for data
        if (!data) return null;

        const checkCategories = {
            'Malware Detection': ['maliciousPatterns', 'isEicarTest'],
            'Content Analysis': ['containsActiveContent', 'containsUrls', 'containsBase64'],
            'File Integrity': ['isKnownFileType', 'signatureValid', 'fileTypeMismatch'],
            'Risk Factors': ['containsExecutables', 'containsCompressedFiles', 'highEntropy']
        };

        const dangerKeys = [
            'maliciousPatterns',
            'isEicarTest',
            'containsActiveContent',
            'containsCompressedFiles',
            'highEntropy',
            'containsUrls',
            'containsBase64',
            'containsExecutables'
        ];

        return (
            <div className="security-checks">
                {Object.entries(checkCategories).map(([category, checks]) => (
                    <div key={category} className="check-category">
                        <h4>{category}</h4>
                        <div className="check-group">
                            {checks.map(key => {
                                if (key in data) {
                                    let isPositive = !dangerKeys.includes(key) ? data[key] : !data[key];
                                    return (
                                        <div key={key} className="security-check-item">
                                            <span className="check-label">{formatKey(key)}</span>
                                            <span className={`check-value ${isPositive ? 'positive' : 'negative'}`}>
                                                {data[key] ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // eslint-disable-next-line no-unused-vars
    const generateFileSummary = (file, analysis) => {
        try {
            let summary = `File Analysis Summary:\n\n`;

            // Basic file information - with null checks
            summary += `<span role="img" aria-label="Folder">📁</span> File Type: ${analysis?.contentAnalysis?.fileType || 'Unknown'}\n`;
            summary += `<span role="img" aria-label="Ruler">📏</span> Size: ${formatFileSize(file?.size || 0)}\n`;
            summary += `<span role="img" aria-label="Magnifying Glass">🔍</span> MIME Type: ${file?.mimetype || 'Unknown'}\n`;
            summary += `<span role="img" aria-label="Lock">🔐</span> Entropy Level: ${analysis?.fileStats?.entropy || 'N/A'}\n\n`;

            // Content characteristics
            if (analysis?.contentAnalysis?.fileType === 'Text' || analysis?.contentAnalysis?.fileType === 'HTML') {
                summary += `<span role="img" aria-label="Bar Chart">📊</span> Content Statistics:\n`;
            }

            // Security assessment
            summary += `<span role="img" aria-label="Shield">🛡️</span> Security Assessment:\n`;
            if (analysis?.securityChecks?.maliciousPatterns) {
                summary += `• <span role="img" aria-label="Warning">⚠️</span> Contains potentially malicious patterns\n`;
            }
            if (analysis?.securityChecks?.containsActiveContent) {
                summary += `• <span role="img" aria-label="Warning">⚠️</span> Contains active content (scripts, etc.)\n`;
            }
            if (analysis?.securityChecks?.containsUrls) {
                summary += `• Contains external URLs\n`;
            }
            if (analysis?.securityChecks?.containsBase64) {
                summary += `• Contains Base64 encoded content\n`;
            }

            // File integrity
            summary += `\n<span role="img" aria-label="Lock">🔒</span> File Integrity:\n`;
            summary += `• Signature check: ${analysis?.fileStats?.signatureCheck || 'Unknown'}\n`;
            summary += `• File format: ${analysis?.securityChecks?.isKnownFileType ? 'Known' : 'Unknown'}\n`;

            // Overall assessment
            summary += `\n<span role="img" aria-label="Memo">📝</span> Overall Assessment:\n`;
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
        } catch (err) {
            console.error('Error generating file summary:', err);
            return 'Unable to generate file summary due to an error.';
        }
    };

    return (
        <div className="file-scanner-container">
            <div className="file-scanner-sidebar">
                <div className="upload-section">
                    <label className="upload-button" htmlFor="file-upload">
                        Upload File
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            disabled={scanning}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                <div className="scanned-files">
                    <h3>Recent Scans</h3>
                    {scannedFiles.map(file => (
                        <div 
                            key={file.id} 
                            className={`file-item ${file.status}`}
                            onClick={() => handleFileSelection(file)}
                        >
                            <div className="file-info">
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                                <span className="file-date">{new Date(file.date).toLocaleString()}</span>
                            </div>
                            <div className="status-container">
                                <span className={`status-badge ${file.status}`}>
                                    {file.status}
                                </span>
                                <div 
                                    className="delete-scan"
                                    onClick={(e) => handleDeleteScan(e, file.id)}
                                    title="Delete scan"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="main-content">
                {selectedFile ? (
                    <div className="file-details">
                        <h2>{selectedFile.name}</h2>
                        <div className="file-metadata">
                            <div className="metadata-item">
                                <span className="metadata-label">Size:</span>
                                <span className="metadata-value">{formatFileSize(selectedFile.size)}</span>
                            </div>
                            <div className="metadata-item">
                                <span className="metadata-label">Type:</span>
                                <span className="metadata-value">{selectedFile.type}</span>
                            </div>
                            <div className="metadata-item">
                                <span className="metadata-label">Uploaded:</span>
                                <span className="metadata-value">{new Date(selectedFile.date).toLocaleString()}</span>
                            </div>
                        </div>
                        
                        {renderAnalysis()}
                    </div>
                ) : (
                    <div 
                        className={`upload-placeholder ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="upload-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                            </svg>
                        </div>
                        <p>Drag and drop files here</p>
                        <p>or</p>
                        <label className="upload-button-main" htmlFor="file-upload-main">
                            Select Files
                            <input
                                id="file-upload-main"
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                disabled={scanning}
                                style={{ display: 'none' }}
                            />
                        </label>
                        <p className="upload-hint">Supported file types: All files</p>
                    </div>
                )}
                
                {scanning && (
                    <div className="scanning-status">
                        <div className="scanning-text">
                            Scanning... {Math.round(scanProgress)}%
                        </div>
                        <div className="progress-bar-container">
                            <div 
                                className="progress-bar" 
                                style={{ width: `${scanProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="scanner-terminal">
                <div className="terminal-header">
                    <span>Scanner Log {selectedFile ? `- ${selectedFile.name}` : ''}</span>
                </div>
                <div className="terminal-content">
                    {selectedFile && selectedFile.logs ? (
                        selectedFile.logs.map((log, index) => (
                            <div key={index} className="log-entry">
                                <span className="log-time">{log.time}</span>
                                <span className="log-message">{log.message}</span>
                            </div>
                        ))
                    ) : (
                        <div className="empty-log">
                            <span>No scan logs to display</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileScanner; 
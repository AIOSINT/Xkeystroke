import React, { useState, useEffect, useRef } from 'react';
import Graph from 'react-vis-network-graph';
import './Dashboard.css';

const Dashboard = () => {
    const [activeTheme, setActiveTheme] = useState('dark');
    const [searchResults, setSearchResults] = useState([]);
    const [activeTools, setActiveTools] = useState([]);
    const [recentScans, setRecentScans] = useState([]);
    const canvasRef = useRef(null);
    const [systemStatus, setSystemStatus] = useState({
        containers: 'healthy',
        proxyChains: 'active',
        apiConnections: 'stable'
    });

    const graph = {
        nodes: [
            { id: 1, label: 'Target Profile', title: 'Main Target', color: '#ff5733' },
            { id: 2, label: 'Twitter', title: '@username', color: '#1DA1F2' },
            { id: 3, label: 'LinkedIn', title: 'Professional Profile', color: '#0077B5' },
            { id: 4, label: 'Email', title: 'Primary Contact', color: '#28a745' },
            { id: 5, label: 'Domain', title: 'Website', color: '#17a2b8' },
            { id: 6, label: 'GitHub', title: 'Code Repository', color: '#6e5494' }
        ],
        edges: [
            { from: 1, to: 2 },
            { from: 1, to: 3 },
            { from: 3, to: 4 },
            { from: 4, to: 5 },
            { from: 5, to: 6 }
        ]
    };

    const options = {
        nodes: {
            shape: 'dot',
            size: 10,
            font: {
                size: 14,
                color: '#f8f8f2',
                face: 'Courier New',
                strokeWidth: 0
            },
            borderWidth: 1,
            borderColor: '#ff79c6',
            color: {
                background: '#282a36',
                border: '#ff79c6',
                highlight: {
                    background: '#44475a',
                    border: '#ff79c6'
                }
            },
            shadow: {
                enabled: true,
                color: 'rgba(255, 121, 198, 0.2)',
                size: 3
            }
        },
        edges: {
            width: 1,
            color: {
                color: '#bd93f9',
                highlight: '#ff79c6',
                opacity: 0.8
            },
            smooth: {
                type: 'cubicBezier',
                roundness: 0.6
            },
            arrows: {
                to: {
                    enabled: true,
                    scaleFactor: 0.5
                }
            }
        },
        physics: {
            hierarchicalRepulsion: {
                centralGravity: 0.0,
                springLength: 150,
                springConstant: 0.01,
                nodeDistance: 120,
                damping: 0.09
            },
            solver: 'hierarchicalRepulsion'
        },
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'UD',
                sortMethod: 'directed',
                nodeSpacing: 150,
                treeSpacing: 200
            }
        },
        interaction: {
            hover: true,
            tooltipDelay: 200,
            zoomView: true,
            dragView: true
        },
        background: '#282a36'
    };

    const events = {
        select: function(event) {
            const { nodes, edges } = event;
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        // Simulated data fetch
        setActiveTools([
            { name: 'Social Scraper', status: 'active', tasks: 3 },
            { name: 'Dark Web Monitor', status: 'scanning', tasks: 1 },
            { name: 'API Aggregator', status: 'idle', tasks: 0 }
        ]);

        setRecentScans([
            { type: 'Social Profile', target: 'twitter.com/user123', status: 'complete' },
            { type: 'Domain Analysis', target: 'example.com', status: 'in_progress' },
            { type: 'Dark Web Scan', target: 'keyword_watch', status: 'scheduled' }
        ]);
    };

    return (
        <div className={`dashboard-container theme-${activeTheme}`}>
            <header className="dashboard-header">
                <h1>Xkeystroke OSINT Dashboard</h1>
                <div className="system-status">
                    <span className={`status-indicator ${systemStatus.containers}`}>
                        Containers: {systemStatus.containers}
                    </span>
                    <span className={`status-indicator ${systemStatus.proxyChains}`}>
                        Proxy Chains: {systemStatus.proxyChains}
                    </span>
                    <span className={`status-indicator ${systemStatus.apiConnections}`}>
                        API Status: {systemStatus.apiConnections}
                    </span>
                </div>
            </header>

            <div className="dashboard-grid">
                <section className="quick-actions">
                    <h2>Quick Actions</h2>
                    <div className="action-buttons">
                        <button>New OSINT Scan</button>
                        <button>View Active Containers</button>
                        <button>Manage Proxy Chains</button>
                        <button>API Dashboard</button>
                    </div>
                </section>

                <section className="active-tools">
                    <h2>Active Tools</h2>
                    <div className="tools-list">
                        {activeTools.map((tool, index) => (
                            <div key={index} className={`tool-card ${tool.status}`}>
                                <h3>{tool.name}</h3>
                                <p>Status: {tool.status}</p>
                                <p>Active Tasks: {tool.tasks}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="recent-scans">
                    <h2>Recent Scans</h2>
                    <div className="scans-list">
                        {recentScans.map((scan, index) => (
                            <div key={index} className={`scan-card ${scan.status}`}>
                                <h3>{scan.type}</h3>
                                <p>Target: {scan.target}</p>
                                <p>Status: {scan.status}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="data-visualization">
                    <h2>Network Analysis</h2>
                    <div className="visualization-container">
                        <div className="graph-container">
                            <Graph
                                graph={graph}
                                options={options}
                                style={{ height: "600px" }}
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;

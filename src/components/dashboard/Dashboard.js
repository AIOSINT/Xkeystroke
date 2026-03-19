import React, { useEffect, useMemo, useState } from 'react';
import { Card, Classes, Menu, MenuItem } from "@blueprintjs/core";
import './Dashboard.css';

const ACTIVE_INSTANCE_KEY = "xk_active_instance_id_v1";
const INSTANCE_CHANGED_EVENT = "xk:instance-changed";
const LEFT_PANE_STATE_PREFIX = "xk_left_pane_state_v1:";

function readActiveInstanceId() {
    try {
        return window.localStorage.getItem(ACTIVE_INSTANCE_KEY) || "main";
    } catch {
        return "main";
    }
}

function readLeftPaneState(instanceId) {
    try {
        const raw = window.localStorage.getItem(`${LEFT_PANE_STATE_PREFIX}${instanceId}`);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function writeLeftPaneState(instanceId, state) {
    try {
        window.localStorage.setItem(`${LEFT_PANE_STATE_PREFIX}${instanceId}`, JSON.stringify(state));
    } catch {
        // ignore
    }
}

const Dashboard = () => {
    const [activeTheme] = useState('dark');
    const [activeInstanceId, setActiveInstanceId] = useState(() => (typeof window === "undefined" ? "main" : readActiveInstanceId()));
    const [selectedPanel, setSelectedPanel] = useState("Target");

    const items = useMemo(() => ([
        { key: "Target", icon: "target" },
        { key: "SockPuppet", icon: "user" },
        { key: "World Map", icon: "globe-network" },
        { key: "Network Map", icon: "graph" },
        { key: "Connections Map", icon: "flows" },
        { key: "Markdown Notes", icon: "document" },
        { key: "Storage", icon: "database" },
        { key: "Logs", icon: "console" },
        { key: "Timeline", icon: "timeline-events" },
        { key: "Search", icon: "search" },
    ]), []);

    const searchBottomItems = useMemo(() => ([
        { key: "Browser Fingerprint", icon: "application" },
        { key: "Behavior Simulation", icon: "predictive-analysis" },
        { key: "User-Agent", icon: "id-number" },
        { key: "Cookies/Session", icon: "lock" },
        { key: "Cache", icon: "history" },
        { key: "Proxy/Routing", icon: "git-branch" },
        { key: "Request Header", icon: "properties" },
        { key: "Traffic", icon: "exchange" },
        { key: "Isolation", icon: "segmented-control" },
        { key: "Emulation", icon: "mobile-phone" },
        { key: "Timezone", icon: "time" },
        { key: "Referer", icon: "direction-right" },
        { key: "Language", icon: "translate" },
        { key: "DNT", icon: "shield" },
        { key: "LocalStorage", icon: "database" },
        { key: "Logs", icon: "console" },
        { key: "Manager", icon: "cog" },
    ]), []);

    const timelineBottomItems = useMemo(() => ([
        { key: "Timestamp Normalization", icon: "time" },
        { key: "Time Correlation", icon: "comparison" },
        { key: "Event Sequencing Logic", icon: "layout-linear" },
        { key: "Temporal Clustering", icon: "group-objects" },
        { key: "Pattern Detection (Time-based)", icon: "heatmap" },
        { key: "Cross-Platform Activity Correlation", icon: "satellite" },
        { key: "Alias Usage Over Time", icon: "user" },
        { key: "Behavioral Pattern Analysis", icon: "predictive-analysis" },
        { key: "Domain Registration Correlation", icon: "globe" },
        { key: "DNS Change Correlation", icon: "data-lineage" },
        { key: "Infrastructure Change Tracking", icon: "changes" },
        { key: "Breach Timeline Correlation", icon: "warning-sign" },
        { key: "Credential Exposure Correlation", icon: "key" },
        { key: "Metadata Time Extraction", icon: "properties" },
        { key: "Media Timestamp Correlation", icon: "media" },
        { key: "Geolocation Timeline Correlation", icon: "map-marker" },
        { key: "Movement Pattern Analysis", icon: "path-search" },
        { key: "Anomaly Detection (time-based)", icon: "issue" },
        { key: "Gap Analysis (missing time periods)", icon: "remove-column-right" },
        { key: "Time-based Filtering Engine", icon: "filter" },
        { key: "Time Range Comparison Logic", icon: "timeline-line-chart" },
        { key: "Multi-entity Timeline Correlation", icon: "people" },
    ]), []);

    const sockpuppetBottomItems = useMemo(() => ([
        { key: "Identity Profile Creation", icon: "new-person" },
        { key: "Persona Management", icon: "people" },
        { key: "Alias Generation", icon: "id-number" },
        { key: "Username Generation", icon: "user" },
        { key: "Email Generation / Management", icon: "envelope" },
        { key: "Account Creation Automation", icon: "automatic-updates" },
        { key: "Account Warm-up / Aging", icon: "time" },
        { key: "Activity Seeding", icon: "scatter-plot" },
        { key: "Content Seeding", icon: "document" },
        { key: "Behavior Simulation (Human-like activity)", icon: "predictive-analysis" },
        { key: "Interaction Simulation (likes, follows, posts)", icon: "hand" },
        { key: "Engagement Pattern Control", icon: "timeline-area-chart" },
        { key: "Browser Profile Isolation", icon: "application" },
        { key: "Session Isolation", icon: "segmented-control" },
        { key: "Cookie / Session Persistence", icon: "lock" },
        { key: "Proxy Assignment per Identity", icon: "git-branch" },
        { key: "IP Consistency Management", icon: "globe-network" },
        { key: "Geo-Location Consistency", icon: "map-marker" },
        { key: "Device / Fingerprint Assignment", icon: "mobile-phone" },
        { key: "Fingerprint Consistency Management", icon: "clean" },
        { key: "Account Compartmentalization", icon: "layout-grid" },
        { key: "Identity Separation Enforcement", icon: "segmented-control" },
        { key: "Credential Management", icon: "key" },
        { key: "Multi-account Management", icon: "layers" },
        { key: "Recovery / Backup Management", icon: "cloud-download" },
        { key: "Burn / Disposal (identity teardown)", icon: "trash" },
        { key: "Risk Scoring / Detection Avoidance", icon: "shield" },
        { key: "Usage Pattern Randomization", icon: "random" },
    ]), []);

    const worldMapBottomItems = useMemo(() => ([
        { key: "Edit Layers", icon: "layers" },
        { key: "Layer Filtering", icon: "filter" },
        { key: "Entity Plotting", icon: "map-marker" },
        { key: "Clustering / Heatmaps", icon: "heatmap" },
        { key: "Geocoding / Reverse", icon: "geosearch" },
        { key: "Route / Movement", icon: "path-search" },
        { key: "Time-based Mapping", icon: "time" },
        { key: "Area / Radius Analysis", icon: "circle" },
        { key: "Distance / Proximity", icon: "timeline-area-chart" },
        { key: "Spatial Correlation", icon: "comparison" },
        { key: "Data Enrichment", icon: "add" },
    ]), []);

    const markdownNotesBottomItems = useMemo(() => ([
        { key: "Backlink Tracking", icon: "link" },
        { key: "Contextual Linking", icon: "link" },
        { key: "Templates", icon: "properties" },
        { key: "Snapshot Embedding", icon: "media" },
    ]), []);

    const networkMapBottomItems = useMemo(() => ([
        { key: "Topology Visualization", icon: "graph" },
        { key: "Node Mapping", icon: "diagram-tree" },
        { key: "Connection Mapping", icon: "flows" },
        { key: "Hierarchy Mapping", icon: "layout-hierarchy" },
        { key: "Network Segmentation", icon: "segmented-control" },
        { key: "Dynamic Updates", icon: "automatic-updates" },
        { key: "Snapshotting", icon: "camera" },
        { key: "Multi-network Overlay", icon: "layers" },
        { key: "Logical vs Physical Mapping", icon: "layout-grid" },
        { key: "Topology Filtering", icon: "filter" },
        { key: "Sub-topology Isolation", icon: "layout-linear" },
        { key: "Dependency Mapping", icon: "data-lineage" },
        { key: "Redundancy Mapping", icon: "repeat" },
        { key: "Topology Correlation", icon: "comparison" },
    ]), []);

    const connectionsMapBottomItems = useMemo(() => ([
        { key: "Entity Mapping", icon: "diagram-tree" },
        { key: "Relationship Mapping", icon: "flows" },
        { key: "Connection Visualization", icon: "graph" },
        { key: "Relationship Classification", icon: "tag" },
        { key: "Direction Mapping", icon: "arrow-right" },
        { key: "Multi-entity Linking", icon: "people" },
        { key: "Cross-source Correlation", icon: "comparison" },
        { key: "Connection Discovery", icon: "search" },
        { key: "Indirect Link Detection", icon: "path-search" },
        { key: "Cluster Detection", icon: "heatmap" },
        { key: "Group Identification", icon: "group-objects" },
        { key: "Influence / Centrality Mapping", icon: "layout-hierarchy" },
        { key: "Key Entity Identification", icon: "star" },
        { key: "Connection Filtering", icon: "filter" },
        { key: "Subgraph Isolation", icon: "layout-linear" },
        { key: "Relationship Enrichment", icon: "add" },
    ]), []);

    const storageBottomItems = useMemo(() => ([
        { key: "Tagging / Labeling", icon: "tag" },
        { key: "Duplicate Detection", icon: "duplicate" },
        { key: "Version Tracking", icon: "history" },
        { key: "Virus Scanner", icon: "shield" },
        { key: "Format Conversion", icon: "exchange" },
        { key: "Encryption / Decryption", icon: "lock" },
        { key: "Thumbnail Generation", icon: "media" },
        { key: "Access Protection", icon: "key" },
        { key: "Media Viewer", icon: "eye-open" },
        { key: "Editors", icon: "edit" },
    ]), []);

    const logsBottomItems = useMemo(() => ([
        { key: "Status", icon: "info-sign" },
        { key: "Sources", icon: "database" },
        { key: "Process Tracking", icon: "gantt-chart" },
        { key: "Instance Logs", icon: "layers" },
        { key: "Severity Levels", icon: "warning-sign" },
        { key: "Event Categorization", icon: "tag" },
        { key: "Log Persistence", icon: "floppy-disk" },
        { key: "Correlation", icon: "comparison" },
        { key: "Context Linking", icon: "link" },
        { key: "Error Tracking", icon: "issue" },
    ]), []);

    const targetBottomItems = useMemo(() => ([
        { key: "Categorization", icon: "tag" },
        { key: "Attribute Mgmt", icon: "properties" },
        { key: "Linking", icon: "link" },
        { key: "Data Aggregation", icon: "layers" },
        { key: "Correlation", icon: "comparison" },
        { key: "Relationships", icon: "flows" },
        { key: "Activity", icon: "timeline-events" },
        { key: "Risk / Priority", icon: "warning-sign" },
        { key: "Notes", icon: "document" },
    ]), []);

    const sidebarPanelClass = useMemo(() => {
        const slug = String(selectedPanel || "")
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
        return `panel-${slug || "target"}`;
    }, [selectedPanel]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const applyForInstance = (instanceId) => {
            setActiveInstanceId(instanceId);
            const state = readLeftPaneState(instanceId);
            if (state && typeof state.selectedPanel === "string") {
                setSelectedPanel(state.selectedPanel);
            } else {
                setSelectedPanel("Target");
            }
        };

        applyForInstance(readActiveInstanceId());

        const handler = (e) => {
            const nextId = e?.detail?.instanceId || readActiveInstanceId();
            applyForInstance(nextId);
        };
        window.addEventListener(INSTANCE_CHANGED_EVENT, handler);

        // If some other tab modifies localStorage, keep in sync.
        const onStorage = (e) => {
            if (e.key === ACTIVE_INSTANCE_KEY) {
                applyForInstance(e.newValue || "main");
            }
        };
        window.addEventListener("storage", onStorage);

        return () => {
            window.removeEventListener(INSTANCE_CHANGED_EVENT, handler);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        writeLeftPaneState(activeInstanceId, { selectedPanel });
    }, [activeInstanceId, selectedPanel]);

    return (
        <div className={`dashboard-shell theme-${activeTheme} ${Classes.DARK}`}>
            <aside className={`dashboard-sidebar ${selectedPanel === "Timeline" ? "is-timeline" : ""} ${sidebarPanelClass}`}>
                <Card className="dashboard-sidebar-card" elevation={0}>
                    <div className="dashboard-sidebar-inner">
                        <div className="dashboard-sidebar-top">
                            <div className="dashboard-sidebar-top-box">
                                <Menu className={Classes.DARK}>
                                    {items.map((item) => (
                                        <MenuItem
                                            key={item.key}
                                            icon={item.icon}
                                            text={item.key}
                                            active={selectedPanel === item.key}
                                            onClick={() => setSelectedPanel(item.key)}
                                        />
                                    ))}
                                </Menu>
                            </div>
                        </div>

                        <div className="dashboard-sidebar-bottom-box">
                            <Menu className={Classes.DARK}>
                                <MenuItem
                                    icon={items.find((i) => i.key === selectedPanel)?.icon}
                                    text={selectedPanel}
                                    active
                                    className="bp5-popover-dismiss"
                                />
                                {selectedPanel === "Search"
                                    ? searchBottomItems.map((item) => (
                                        <MenuItem key={item.key} icon={item.icon} text={item.key} />
                                    ))
                                    : selectedPanel === "Timeline"
                                        ? timelineBottomItems.map((item) => (
                                            <MenuItem key={item.key} icon={item.icon} text={item.key} />
                                        ))
                                        : selectedPanel === "SockPuppet"
                                            ? sockpuppetBottomItems.map((item) => (
                                                <MenuItem key={item.key} icon={item.icon} text={item.key} />
                                            ))
                                            : selectedPanel === "World Map"
                                                ? worldMapBottomItems.map((item) => (
                                                    <MenuItem key={item.key} icon={item.icon} text={item.key} />
                                                ))
                                                : selectedPanel === "Markdown Notes"
                                                    ? markdownNotesBottomItems.map((item) => (
                                                        <MenuItem key={item.key} icon={item.icon} text={item.key} />
                                                    ))
                                                    : selectedPanel === "Network Map"
                                                        ? networkMapBottomItems.map((item) => (
                                                            <MenuItem key={item.key} icon={item.icon} text={item.key} />
                                                        ))
                                                        : selectedPanel === "Connections Map"
                                                            ? connectionsMapBottomItems.map((item) => (
                                                                <MenuItem key={item.key} icon={item.icon} text={item.key} />
                                                            ))
                                                            : selectedPanel === "Storage"
                                                                ? storageBottomItems.map((item) => (
                                                                    <MenuItem key={item.key} icon={item.icon} text={item.key} />
                                                                ))
                                                                : selectedPanel === "Logs"
                                                                    ? logsBottomItems.map((item) => (
                                                                        <MenuItem key={item.key} icon={item.icon} text={item.key} />
                                                                    ))
                                                                    : selectedPanel === "Target"
                                                                        ? targetBottomItems.map((item) => (
                                                                            <MenuItem key={item.key} icon={item.icon} text={item.key} />
                                                                        ))
                                    : null}
                            </Menu>
                        </div>
                    </div>
                </Card>
            </aside>
        </div>
    );
};

export default Dashboard;

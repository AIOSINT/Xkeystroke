import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { Alert, Alignment, Button, Classes, Dialog, Menu, MenuItem, Navbar, NavbarGroup, NavbarHeading, Popover, Position, Tag } from "@blueprintjs/core";
import './Header.css';
import { useAuth } from '../../AuthContext';

const INSTANCES_KEY = "xk_instances_v1";
const ACTIVE_INSTANCE_KEY = "xk_active_instance_id_v1";
const INSTANCE_CHANGED_EVENT = "xk:instance-changed";

function loadInstances() {
    try {
        const raw = window.localStorage.getItem(INSTANCES_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {
        // ignore
    }
    return [{ id: "main", name: "Main instance" }];
}

function loadActiveInstanceId() {
    try {
        return window.localStorage.getItem(ACTIVE_INSTANCE_KEY) || "main";
    } catch {
        return "main";
    }
}

const Header = () => {
    const { isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const history = useHistory();

    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    const username = localStorage.getItem('currentUsername');
    const uuid = localStorage.getItem('uuid');
    const userRole = localStorage.getItem('userRole');
    const shortUuid = uuid ? uuid.substring(0, 6) : '';

    const [instances, setInstances] = useState(() => (typeof window === "undefined" ? [{ id: "main", name: "Main instance" }] : loadInstances()));
    const [activeInstanceId, setActiveInstanceId] = useState(() => (typeof window === "undefined" ? "main" : loadActiveInstanceId()));
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInstancePopoverOpen, setIsInstancePopoverOpen] = useState(false);
    const [editingInstanceId, setEditingInstanceId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, instanceId: null });
    const [selectedInstanceIds, setSelectedInstanceIds] = useState(() => new Set());
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState({ isOpen: false });
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const [isSecureStatusOpen, setIsSecureStatusOpen] = useState(false);

    const activeInstance = useMemo(
        () => instances.find(i => i.id === activeInstanceId) || instances[0] || { id: "main", name: "Main instance" },
        [instances, activeInstanceId]
    );

    useEffect(() => {
        try {
            window.localStorage.setItem(INSTANCES_KEY, JSON.stringify(instances));
            window.localStorage.setItem(ACTIVE_INSTANCE_KEY, activeInstanceId);
        } catch {
            // ignore
        }
    }, [instances, activeInstanceId]);

    useEffect(() => {
        try {
            window.dispatchEvent(new CustomEvent(INSTANCE_CHANGED_EVENT, { detail: { instanceId: activeInstanceId } }));
        } catch {
            // ignore
        }
    }, [activeInstanceId]);

    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    const addInstance = () => {
        const nextIndex = instances.length + 1;
        const id = `inst_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const name = `Instance ${nextIndex}`;
        setInstances(prev => [...prev, { id, name }]);
        setActiveInstanceId(id);
    };

    const beginInlineEdit = (inst) => {
        setEditingInstanceId(inst.id);
        setEditingName(inst.name);
    };

    const commitInlineEdit = () => {
        if (!editingInstanceId) return;
        const trimmed = editingName.trim();
        setInstances(prev =>
            prev.map(p => (p.id === editingInstanceId ? { ...p, name: trimmed || p.name } : p))
        );
        setEditingInstanceId(null);
        setEditingName("");
    };

    const deleteInstance = (instanceId) => {
        if (!instanceId || instanceId === "main") return;

        setInstances(prev => {
            const next = prev.filter(i => i.id !== instanceId);

            setActiveInstanceId(prevActive => {
                if (prevActive !== instanceId) return prevActive;
                return next.find(i => i.id === "main")?.id || next[0]?.id || "main";
            });

            return next.length > 0 ? next : [{ id: "main", name: "Main instance" }];
        });

        setEditingInstanceId(null);
        setEditingName("");
    };

    const toggleSelected = (instanceId, force) => {
        setSelectedInstanceIds(prev => {
            const next = new Set(prev);
            const shouldSelect = typeof force === "boolean" ? force : !next.has(instanceId);
            if (shouldSelect) next.add(instanceId);
            else next.delete(instanceId);
            return next;
        });
    };

    const clearSelection = () => setSelectedInstanceIds(new Set());

    const deleteManyInstances = (ids) => {
        const toDelete = ids.filter((id) => id && id !== "main");
        if (toDelete.length === 0) return;
        setInstances(prev => {
            const next = prev.filter(i => !toDelete.includes(i.id));
            const nextActive =
                toDelete.includes(activeInstanceId)
                    ? (next.find(i => i.id === "main")?.id || next[0]?.id || "main")
                    : activeInstanceId;
            setActiveInstanceId(nextActive);
            return next.length > 0 ? next : [{ id: "main", name: "Main instance" }];
        });
        clearSelection();
        setEditingInstanceId(null);
        setEditingName("");
    };

    const PlusSvg = (
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
                fill="currentColor"
                d="M11 11V4a1 1 0 1 1 2 0v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7z"
            />
        </svg>
    );

    const TemplateTSvg = (
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
                fill="currentColor"
                d="M4 5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2h-6v14a1 1 0 1 1-2 0V6H5a1 1 0 0 1-1-1z"
            />
        </svg>
    );

    const MultiSelectSquareSvg = (
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
                fill="currentColor"
                d="M5 3h14a2 2 0 0 1 2 2v14a1 1 0 1 1-2 0V5H5v14h14a1 1 0 1 1 0 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
            />
        </svg>
    );

    const activeDeleteName = useMemo(() => {
        const id = deleteConfirm.instanceId;
        if (!id) return "";
        return instances.find(i => i.id === id)?.name || "";
    }, [deleteConfirm.instanceId, instances]);

    const EditSvg = (
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
                fill="currentColor"
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l8.06-8.06.92.92L5.92 20.08zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
            />
        </svg>
    );

    const TrashSvg = (
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
                fill="currentColor"
                d="M9 3h6l1 2h5a1 1 0 1 1 0 2h-1v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7H3a1 1 0 1 1 0-2h5l1-2zm9 4H6v14h12V7zm-8 3a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0v-8zm4 0a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0v-8z"
            />
        </svg>
    );

    return (
        <Navbar className={`${Classes.NAVBAR} bp5-dark app-navbar`} fixedToTop>
            <NavbarGroup align={Alignment.LEFT}>
                <NavbarHeading className="app-brand">
                    <Link to={isAuthenticated ? "/dashboard" : "/login"} className="brand-link">
                        Xkeystroke
                    </Link>
                </NavbarHeading>
                {isAuthenticated && !isAuthPage && (
                    <>
                        <Popover
                            position={Position.BOTTOM_LEFT}
                            minimal
                            hasBackdrop
                            isOpen={isInstancePopoverOpen}
                            onInteraction={(nextOpen) => {
                                setIsInstancePopoverOpen(nextOpen);
                                if (!nextOpen) {
                                    setEditingInstanceId(null);
                                    setEditingName("");
                                    clearSelection();
                                    setIsMultiSelectMode(false);
                                }
                            }}
                            backdropClassName="instance-switcher-backdrop"
                            content={
                                <Menu>
                                    {isMultiSelectMode && selectedInstanceIds.size > 0 ? (
                                        <>
                                            <MenuItem
                                                disabled
                                                text={`${selectedInstanceIds.size} selected`}
                                                className="instance-bulk-row"
                                            />
                                            <MenuItem
                                                icon="trash"
                                                intent="danger"
                                                text="Delete selected"
                                                disabled={[...selectedInstanceIds].every((id) => id === "main")}
                                                onClick={() => setBulkDeleteConfirm({ isOpen: true })}
                                                shouldDismissPopover={false}
                                            />
                                            <MenuItem
                                                icon="cross"
                                                text="Clear selection"
                                                onClick={() => clearSelection()}
                                                shouldDismissPopover={false}
                                            />
                                            <MenuItem divider />
                                        </>
                                    ) : null}
                                    {instances.map((inst, idx) => {
                                        const isEditing = editingInstanceId === inst.id;
                                        const canDelete = inst.id !== "main";
                                        const isSelected = selectedInstanceIds.has(inst.id);

                                        return (
                                            <MenuItem
                                                key={inst.id}
                                                icon={isSelected ? "selection" : (inst.id === activeInstanceId ? "tick" : "blank")}
                                                shouldDismissPopover={false}
                                                text={
                                                    isEditing ? (
                                                        <input
                                                            className="instance-inline-input"
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") commitInlineEdit();
                                                                if (e.key === "Escape") {
                                                                    setEditingInstanceId(null);
                                                                    setEditingName("");
                                                                }
                                                            }}
                                                            onBlur={commitInlineEdit}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        inst.name
                                                    )
                                                }
                                                labelElement={
                                                    <span className="instance-item-actions">
                                                        <button
                                                            type="button"
                                                            className="instance-icon-button"
                                                            aria-label={`Edit ${inst.name}`}
                                                            title="Rename / delete"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                beginInlineEdit(inst);
                                                            }}
                                                        >
                                                            {EditSvg}
                                                        </button>

                                                        {canDelete ? (
                                                            <button
                                                                type="button"
                                                                className="instance-icon-button instance-delete-button"
                                                                aria-label={`Delete ${inst.name}`}
                                                                title="Delete instance"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setDeleteConfirm({ isOpen: true, instanceId: inst.id });
                                                                }}
                                                            >
                                                                {TrashSvg}
                                                            </button>
                                                        ) : null}
                                                    </span>
                                                }
                                                onClick={() => {
                                                    if (isEditing) return;
                                                    if (isMultiSelectMode) {
                                                        toggleSelected(inst.id);
                                                        return;
                                                    }
                                                    setActiveInstanceId(inst.id);
                                                    setIsInstancePopoverOpen(false);
                                                }}
                                            />
                                        );
                                    })}

                                    <MenuItem divider />
                                    <MenuItem
                                        disabled
                                        text={
                                            <div className="instance-dropdown-actions">
                                                <button
                                                    type="button"
                                                    className="instance-action-icon"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsTemplatesOpen(true);
                                                    }}
                                                    title="Instance templates"
                                                    aria-label="Instance templates"
                                                >
                                                    {TemplateTSvg}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`instance-action-icon ${isMultiSelectMode ? "active" : ""}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsMultiSelectMode(v => {
                                                            const next = !v;
                                                            if (!next) clearSelection();
                                                            return next;
                                                        });
                                                    }}
                                                    title="Multi-select"
                                                    aria-label="Multi-select"
                                                >
                                                    {MultiSelectSquareSvg}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="instance-action-icon"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        addInstance();
                                                    }}
                                                    title="Add instance"
                                                    aria-label="Add instance"
                                                >
                                                    {PlusSvg}
                                                </button>
                                            </div>
                                        }
                                        shouldDismissPopover={false}
                                        className="instance-actions-row"
                                    />
                                </Menu>
                            }
                        >
                            <Button
                                minimal
                                rightIcon="caret-down"
                                icon="layers"
                                text={activeInstance.name}
                                onClick={() => setIsInstancePopoverOpen((v) => !v)}
                            />
                        </Popover>
                    </>
                )}
            </NavbarGroup>

            <NavbarGroup align={Alignment.RIGHT}>
                {isAuthenticated && !isAuthPage && (
                    <>
                        <Button
                            minimal
                            className="secure-status-button"
                            onClick={() => setIsSecureStatusOpen(true)}
                            title="Secure Status"
                        >
                            <span className="secure-status-label">Secure Status</span>{" "}
                            <span className="secure-status-score">
                                <span className="secure-status-7">7</span>
                                <span className="secure-status-slash">/</span>
                                <span className="secure-status-10">10</span>
                            </span>
                        </Button>

                        <Button minimal icon="cog" text="Settings" onClick={() => setIsSettingsOpen(true)} />

                        <Popover
                            position={Position.BOTTOM_RIGHT}
                            content={
                                <Menu>
                                    <MenuItem icon="user" text="Profile" onClick={() => history.push("/profile")} />
                                    {userRole?.toLowerCase() === 'admin' ? (
                                        <MenuItem icon="people" text="Users" onClick={() => history.push("/users")} />
                                    ) : null}
                                    <MenuItem icon="log-out" text="Logout" intent="danger" onClick={handleLogout} />
                                </Menu>
                            }
                        >
                            <Button
                                minimal
                                rightIcon="caret-down"
                                icon="person"
                                text={
                                    <span className="user-pill">
                                        {username}
                                        {shortUuid ? <span className="user-uuid">({shortUuid})</span> : null}
                                        {userRole ? (
                                            <Tag minimal className={`role-tag role-${userRole.toLowerCase()}`}>
                                                {userRole}
                                            </Tag>
                                        ) : null}
                                    </span>
                                }
                            />
                        </Popover>

                        <Dialog
                            isOpen={isSettingsOpen}
                            onClose={() => setIsSettingsOpen(false)}
                            title="Settings"
                            className={Classes.DARK}
                            portalClassName="settings-portal"
                            style={{
                                width: "80vw",
                                height: "80vh",
                                maxWidth: 1200,
                                maxHeight: 900,
                            }}
                        >
                            <div className={Classes.DIALOG_BODY} style={{ height: "100%" }}>
                                <div style={{ opacity: 0.8 }}>
                                    {/* blank on purpose (requested) */}
                                </div>
                            </div>
                        </Dialog>

                        <Dialog
                            isOpen={isSecureStatusOpen}
                            onClose={() => setIsSecureStatusOpen(false)}
                            title="Secure Status"
                            className={Classes.DARK}
                            portalClassName="secure-status-portal"
                            style={{
                                width: "80vw",
                                height: "80vh",
                                maxWidth: 1200,
                                maxHeight: 900,
                            }}
                        >
                            <div className={Classes.DIALOG_BODY} style={{ height: "100%" }}>
                                <div style={{ fontSize: 18, fontWeight: 600 }}>
                                    Secure Status
                                </div>
                            </div>
                        </Dialog>

                        <Dialog
                            isOpen={isTemplatesOpen}
                            onClose={() => setIsTemplatesOpen(false)}
                            title="Instance Templates"
                            className={Classes.DARK}
                            portalClassName="templates-portal"
                            style={{
                                width: "80vw",
                                height: "80vh",
                                maxWidth: 1200,
                                maxHeight: 900,
                            }}
                        >
                            <div className={Classes.DIALOG_BODY} style={{ height: "100%" }}>
                                <div style={{ fontSize: 18, fontWeight: 600 }}>
                                    Instance Templates
                                </div>
                            </div>
                        </Dialog>

                        <Alert
                            isOpen={deleteConfirm.isOpen}
                            intent="danger"
                            cancelButtonText="Cancel"
                            confirmButtonText="Delete instance"
                            onCancel={() => setDeleteConfirm({ isOpen: false, instanceId: null })}
                            onConfirm={() => {
                                const instanceId = deleteConfirm.instanceId;
                                setDeleteConfirm({ isOpen: false, instanceId: null });
                                deleteInstance(instanceId);
                            }}
                            className={Classes.DARK}
                        >
                            <p style={{ margin: 0 }}>
                                Delete <strong>{activeDeleteName || "this instance"}</strong>? This will permanently delete the instance and its local settings.
                            </p>
                        </Alert>

                        <Alert
                            isOpen={bulkDeleteConfirm.isOpen}
                            intent="danger"
                            cancelButtonText="Cancel"
                            confirmButtonText="Delete selected"
                            onCancel={() => setBulkDeleteConfirm({ isOpen: false })}
                            onConfirm={() => {
                                setBulkDeleteConfirm({ isOpen: false });
                                deleteManyInstances([...selectedInstanceIds]);
                            }}
                            className={Classes.DARK}
                        >
                            <p style={{ margin: 0 }}>
                                Delete {selectedInstanceIds.size} instance{selectedInstanceIds.size === 1 ? "" : "s"}? This cannot be undone.
                            </p>
                        </Alert>
                    </>
                )}
            </NavbarGroup>
        </Navbar>
    );
};

export default Header;

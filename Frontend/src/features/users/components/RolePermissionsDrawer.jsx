// src/features/users/components/RolePermissionsDrawer.jsx
import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock } from 'lucide-react';
import { PERMISSION_GROUPS } from '../../../lib/rbac';

export function RolePermissionsDrawer({ isOpen, onClose, roles, onSaveRole, isSaving }) {
    const [selectedRoleId, setSelectedRoleId] = useState(roles[1]?.id || 'qa');
    const [draftPermissions, setDraftPermissions] = useState([]);

    const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

    useEffect(() => {
        if (isOpen && activeRole) {
            setDraftPermissions(activeRole.permissions);
        }
    }, [isOpen, activeRole]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen || !activeRole) return null;

    const togglePermission = (permKey) => {
        if (activeRole.isSystem) return;
        setDraftPermissions((prev) =>
            prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Role permissions matrix">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
            <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-red-600" />
                        <h2 className="text-lg font-bold text-slate-900">RBAC Role Permissions</h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close role drawer" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="border-b border-slate-100 px-6 py-3 bg-slate-50 flex flex-wrap gap-2">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            type="button"
                            onClick={() => setSelectedRoleId(role.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${role.id === activeRole.id
                                ? 'bg-red-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            {role.name}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeRole.isSystem && (
                        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                            <Lock className="h-4 w-4 shrink-0" />
                            Admin is a protected system role and always retains full access.
                        </div>
                    )}

                    {PERMISSION_GROUPS.map((group) => (
                        <div key={group.group} className="space-y-2.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{group.group}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {group.items.map((item) => {
                                    const checked = draftPermissions.includes(item.key);
                                    return (
                                        <label
                                            key={item.key}
                                            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${checked ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-white'
                                                } ${activeRole.isSystem ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:border-slate-300'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={activeRole.isSystem}
                                                onChange={() => togglePermission(item.key)}
                                                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                            />
                                            <span className="text-slate-800 text-xs font-medium">{item.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Close
                    </button>
                    {!activeRole.isSystem && (
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => onSaveRole({ roleId: activeRole.id, permissions: draftPermissions })}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                            {isSaving ? 'Saving...' : 'Save Role Permissions'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
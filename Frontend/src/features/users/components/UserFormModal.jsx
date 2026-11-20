// src/features/users/components/UserFormModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { ACCOUNT_SCOPES, PLANTS } from '../../../lib/rbac';

export function UserFormModal({ isOpen, onClose, onSubmit, roles, initialUser = null, isSubmitting }) {
    const isEdit = Boolean(initialUser);
    const [form, setForm] = useState({
        name: '',
        email: '',
        roleId: 'qa',
        accountScope: 'full_app',
        plantAccess: 'All',
        temporaryPassword: '',
        mustChangePassword: true,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setLocalError('');
        setShowPassword(false);
        if (initialUser) {
            setForm({
                name: initialUser.name,
                email: initialUser.email,
                roleId: initialUser.roleId,
                accountScope: initialUser.accountScope,
                plantAccess: initialUser.plantAccess,
                temporaryPassword: '',
                mustChangePassword: false,
            });
        } else {
            setForm({
                name: '',
                email: '',
                roleId: roles[1]?.id || 'qa',
                accountScope: 'full_app',
                plantAccess: 'All',
                temporaryPassword: '',
                mustChangePassword: true,
            });
        }
    }, [isOpen, initialUser, roles]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!form.name.trim()) return setLocalError('Full name is required.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            return setLocalError('Please enter a valid email address.');
        }
        if (!isEdit && form.temporaryPassword.length < 8) {
            return setLocalError('Temporary password must be at least 8 characters.');
        }

        try {
            await onSubmit(form);
            onClose();
        } catch (err) {
            setLocalError(err.message || 'Could not save user.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 id="user-modal-title" className="text-lg font-bold text-slate-900">
                        {isEdit ? `Edit ${initialUser.name}` : 'Create New User'}
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Close modal" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
                    {localError && (
                        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                            {localError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="user-name" className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                            <input
                                id="user-name"
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                                placeholder="e.g. Hemant Patel"
                            />
                        </div>

                        <div>
                            <label htmlFor="user-email" className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                            <input
                                id="user-email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                                placeholder="name@rednexpharma.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="user-role" className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                            <select
                                id="user-role"
                                value={form.roleId}
                                onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                            >
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="user-plant" className="block text-xs font-semibold text-slate-700 mb-1">Plant Access *</label>
                            <select
                                id="user-plant"
                                value={form.plantAccess}
                                onChange={(e) => setForm((f) => ({ ...f, plantAccess: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                            >
                                {PLANTS.map((p) => (
                                    <option key={p} value={p}>{p === 'All' ? 'All Plants' : `${p} Plant`}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="user-scope" className="block text-xs font-semibold text-slate-700 mb-1">Account Scope</label>
                        <select
                            id="user-scope"
                            value={form.accountScope}
                            onChange={(e) => setForm((f) => ({ ...f, accountScope: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                        >
                            {ACCOUNT_SCOPES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-500">
                            Daily Reporting Only accounts are capped exclusively to submitting daily logs.
                        </p>
                    </div>

                    {!isEdit && (
                        <div className="space-y-2">
                            <label htmlFor="user-temp-password" className="block text-xs font-semibold text-slate-700">Temporary Password *</label>
                            <div className="relative">
                                <input
                                    id="user-temp-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.temporaryPassword}
                                    onChange={(e) => setForm((f) => ({ ...f, temporaryPassword: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 pl-3 pr-10 py-2 text-sm focus:border-red-500 focus:outline-none"
                                    placeholder="Min. 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <label className="flex items-center gap-2 text-xs text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.mustChangePassword}
                                    onChange={(e) => setForm((f) => ({ ...f, mustChangePassword: e.target.checked }))}
                                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                />
                                Require password change on first login
                            </label>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
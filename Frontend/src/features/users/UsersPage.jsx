// src/features/users/UsersPage.jsx
import React, { useState } from 'react';
import { Plus, Shield, Search, Edit2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useUsersManagement } from './hooks/useUsersManagement';
import { UserFormModal } from './components/UserFormModal';
import { RolePermissionsDrawer } from './components/RolePermissionsDrawer';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../lib/rbac';

export function UsersPage() {
    const { currentUser, can } = useAuth();
    const {
        canViewUsers,
        isLoading,
        isError,
        error,
        roles,
        counts,
        filteredUsers,
        searchQuery,
        setSearchQuery,
        scopeTab,
        setScopeTab,
        roleFilter,
        setRoleFilter,
        draftRoles,
        setDraftRole,
        savingRowIds,
        feedback,
        clearFeedback,
        createUser,
        isCreating,
        updateUser,
        isUpdating,
        saveInlineRole,
        toggleStatus,
        updateRolePermissions,
        isSavingRoleMatrix,
    } = useUsersManagement();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);

    const canManageUsers = can(PERMISSIONS.USERS_MANAGE);
    const canManageRoles = can(PERMISSIONS.ROLES_MANAGE);

    if (!canViewUsers) {
        return (
            <div role="alert" className="rounded-2xl bg-white p-8 border border-slate-200 text-center">
                <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
                <h2 className="text-lg font-semibold text-slate-900">Access Denied</h2>
                <p className="text-sm text-slate-500 mt-1">You do not have permission to view User Management.</p>
            </div>
        );
    }

    const tabs = [
        { key: 'all', label: `All (${counts.all})` },
        { key: 'full_app', label: `App Accounts (${counts.full_app})` },
        { key: 'daily_reporting_only', label: `Daily Reporting Only (${counts.daily_reporting_only})` },
        { key: 'inactive', label: `Inactive (${counts.inactive})` },
    ];

    const handleModalSubmit = async (formValues) => {
        if (editingUser) {
            await updateUser({
                userId: editingUser.id,
                updates: {
                    name: formValues.name,
                    email: formValues.email,
                    roleId: formValues.roleId,
                    accountScope: formValues.accountScope,
                    plantAccess: formValues.plantAccess,
                },
            });
        } else {
            await createUser(formValues);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Unified RBAC directory for app accounts, plant scoping, and daily reporting users.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {canManageRoles && (
                        <button
                            type="button"
                            onClick={() => setRoleDrawerOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                        >
                            <Shield className="h-4 w-4 text-red-600" /> Role Permissions
                        </button>
                    )}
                    {canManageUsers && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingUser(null);
                                setModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-xs"
                        >
                            <Plus className="h-4 w-4" /> New User
                        </button>
                    )}
                </div>
            </div>

            {feedback && (
                <div
                    role={feedback.type === 'error' ? 'alert' : 'status'}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${feedback.type === 'error'
                            ? 'border-red-200 bg-red-50 text-red-800'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        }`}
                >
                    <span className="flex items-center gap-2 font-medium">
                        {feedback.type === 'error' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {feedback.message}
                    </span>
                    <button type="button" onClick={clearFeedback} className="text-xs underline">
                        Dismiss
                    </button>
                </div>
            )}

            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Account scope filter">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={scopeTab === tab.key}
                                onClick={() => setScopeTab(tab.key)}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${scopeTab === tab.key
                                        ? 'bg-red-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, or role..."
                                aria-label="Search users"
                                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                            />
                        </div>

                        <select
                            aria-label="Filter by role"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-red-500 focus:outline-none sm:w-56"
                        >
                            <option value="all">All roles</option>
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {isError ? (
                    <div role="alert" className="p-6 text-sm text-red-700">{error?.message}</div>
                ) : isLoading ? (
                    <div className="p-6 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3.5">Name</th>
                                    <th className="px-5 py-3.5">Email</th>
                                    <th className="px-5 py-3.5">Plant / Scope</th>
                                    <th className="px-5 py-3.5">Role</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    {canManageUsers && <th className="px-5 py-3.5 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                                            No users match the current filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => {
                                        const selectedRoleId = draftRoles[user.id] ?? user.roleId;
                                        const isDirty = selectedRoleId !== user.roleId;
                                        const isRowSaving = Boolean(savingRowIds[user.id]);
                                        const isSelf = currentUser?.id === user.id;

                                        return (
                                            <tr key={user.id} className="hover:bg-slate-50/70">
                                                <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                                                    {user.name}
                                                    {isSelf && (
                                                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                                            You
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{user.email}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                            {user.plantAccess}
                                                        </span>
                                                        {user.accountScope === 'daily_reporting_only' && (
                                                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                                                Daily Log Only
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            aria-label={`Role for ${user.name}`}
                                                            value={selectedRoleId}
                                                            disabled={!canManageUsers || isRowSaving}
                                                            onChange={(e) => setDraftRole(user.id, e.target.value)}
                                                            className="w-52 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-100"
                                                        >
                                                            {roles.map((r) => (
                                                                <option key={r.id} value={r.id}>{r.name}</option>
                                                            ))}
                                                        </select>
                                                        {canManageUsers && (
                                                            <button
                                                                type="button"
                                                                disabled={!isDirty || isRowSaving}
                                                                onClick={() => saveInlineRole(user)}
                                                                className={`text-xs font-semibold transition-colors ${isDirty ? 'text-red-600 hover:text-red-700' : 'text-slate-300 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                {isRowSaving ? 'Saving...' : 'Save'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        disabled={!canManageUsers || isRowSaving}
                                                        onClick={() => toggleStatus(user)}
                                                        title={canManageUsers ? 'Click to toggle active status' : undefined}
                                                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${user.status === 'Active'
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            } disabled:opacity-60`}
                                                    >
                                                        {user.status}
                                                    </button>
                                                </td>
                                                {canManageUsers && (
                                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            aria-label={`Edit ${user.name}`}
                                                            onClick={() => {
                                                                setEditingUser(user);
                                                                setModalOpen(true);
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" /> Edit
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <UserFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleModalSubmit}
                roles={roles}
                initialUser={editingUser}
                isSubmitting={isCreating || isUpdating}
            />

            <RolePermissionsDrawer
                isOpen={roleDrawerOpen}
                onClose={() => setRoleDrawerOpen(false)}
                roles={roles}
                onSaveRole={updateRolePermissions}
                isSaving={isSavingRoleMatrix}
            />
        </div>
    );
}
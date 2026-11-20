import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS } from '../../../lib/rbac';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

export const USERS_QUERY_KEY = ['users', 'directory'];

export function useUsersManagement() {
    const queryClient = useQueryClient();
    const { currentUser, can, syncRolePermissions } = useAuth();

    const canViewUsers = can(PERMISSIONS.USERS_VIEW);

    const [searchQuery, setSearchQuery] = useState('');
    const [scopeTab, setScopeTab] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [draftRoles, setDraftRoles] = useState({});
    const [savingRowIds, setSavingRowIds] = useState({});
    const [feedback, setFeedback] = useState(null);

    const debouncedSearch = useDebouncedValue(searchQuery, 200);

    const query = useQuery({
        queryKey: USERS_QUERY_KEY,
        queryFn: ({ signal }) => api.fetchUsersAndRoles(signal),
        enabled: canViewUsers,
        staleTime: 60 * 1000,
    });

    const users = query.data?.users ?? [];
    const roles = query.data?.roles ?? [];

    const roleMap = useMemo(() => {
        const map = {};
        for (const r of roles) map[r.id] = r;
        return map;
    }, [roles]);

    const counts = useMemo(() => {
        let fullApp = 0;
        let dailyOnly = 0;
        let inactive = 0;
        for (const u of users) {
            if (u.status === 'Inactive') inactive += 1;
            if (u.accountScope === 'daily_reporting_only') dailyOnly += 1;
            else fullApp += 1;
        }
        return { all: users.length, full_app: fullApp, daily_reporting_only: dailyOnly, inactive };
    }, [users]);

    const filteredUsers = useMemo(() => {
        const term = debouncedSearch.trim().toLowerCase();
        return users.filter((u) => {
            if (scopeTab === 'inactive' && u.status !== 'Inactive') return false;
            if (scopeTab === 'full_app' && u.accountScope !== 'full_app') return false;
            if (scopeTab === 'daily_reporting_only' && u.accountScope !== 'daily_reporting_only') return false;
            if (roleFilter !== 'all' && u.roleId !== roleFilter) return false;
            if (!term) return true;
            const roleName = (roleMap[u.roleId]?.name || '').toLowerCase();
            return (
                u.name.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term) ||
                roleName.includes(term)
            );
        });
    }, [users, scopeTab, roleFilter, debouncedSearch, roleMap]);

    const createUserMutation = useMutation({
        mutationFn: (payload) => api.createUser(payload),
        onSuccess: (created) => {
            queryClient.setQueryData(USERS_QUERY_KEY, (old) =>
                old ? { ...old, users: [created, ...old.users] } : old
            );
            setFeedback({ type: 'success', message: `User "${created.name}" created successfully.` });
        },
        // Errors bubble to UserFormModal's inline alert (prevents duplicate alerts)
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ userId, updates }) =>
            api.updateUser({ userId, updates, actorId: currentUser?.id }),
        onMutate: async ({ userId, updates }) => {
            setSavingRowIds((prev) => ({ ...prev, [userId]: true }));
            await queryClient.cancelQueries({ queryKey: USERS_QUERY_KEY });
            const previous = queryClient.getQueryData(USERS_QUERY_KEY);

            queryClient.setQueryData(USERS_QUERY_KEY, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    users: old.users.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
                };
            });
            return { previous, userId };
        },
        onError: (err, vars, ctx) => {
            if (ctx?.previous) queryClient.setQueryData(USERS_QUERY_KEY, ctx.previous);
            if (!vars?.fromModal) {
                setFeedback({ type: 'error', message: err.message });
            }
        },
        onSuccess: (updated, { userId }) => {
            setDraftRoles((prev) => {
                if (!(userId in prev)) return prev;
                const next = { ...prev };
                delete next[userId];
                return next;
            });
            setFeedback({ type: 'success', message: `Updated "${updated.name}".` });
        },
        onSettled: (_data, _err, { userId }) => {
            setSavingRowIds((prev) => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
            queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
        },
    });

    const updateRolePermissionsMutation = useMutation({
        mutationFn: (vars) => api.updateRolePermissions(vars),
        onSuccess: (updatedRole) => {
            queryClient.setQueryData(USERS_QUERY_KEY, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    roles: old.roles.map((r) => (r.id === updatedRole.id ? updatedRole : r)),
                };
            });
            syncRolePermissions(updatedRole);
            setFeedback({ type: 'success', message: `Saved permissions for role "${updatedRole.name}".` });
        },
        onError: (err) => setFeedback({ type: 'error', message: err.message }),
    });

    const setDraftRole = useCallback((userId, roleId) => {
        setDraftRoles((prev) => ({ ...prev, [userId]: roleId }));
    }, []);

    const saveInlineRole = useCallback(
        (user) => {
            const nextRoleId = draftRoles[user.id];
            if (!nextRoleId || nextRoleId === user.roleId || savingRowIds[user.id]) return;
            updateUserMutation.mutate({ userId: user.id, updates: { roleId: nextRoleId } });
        },
        [draftRoles, savingRowIds, updateUserMutation]
    );

    const toggleStatus = useCallback(
        (user) => {
            if (savingRowIds[user.id]) return;
            const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
            updateUserMutation.mutate({ userId: user.id, updates: { status: nextStatus } });
        },
        [savingRowIds, updateUserMutation]
    );

    const updateUserFromModal = useCallback(
        (params) => updateUserMutation.mutateAsync({ ...params, fromModal: true }),
        [updateUserMutation]
    );

    return {
        ...query,
        canViewUsers,
        users,
        roles,
        roleMap,
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
        clearFeedback: () => setFeedback(null),
        createUser: createUserMutation.mutateAsync,
        isCreating: createUserMutation.isPending,
        updateUser: updateUserFromModal,
        isUpdating: updateUserMutation.isPending,
        saveInlineRole,
        toggleStatus,
        updateRolePermissions: updateRolePermissionsMutation.mutateAsync,
        isSavingRoleMatrix: updateRolePermissionsMutation.isPending,
    };
}
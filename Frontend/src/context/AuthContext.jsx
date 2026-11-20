// src/context/AuthContext.jsx
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { DEFAULT_ROLES, resolveEffectivePermissions, canAccessPlant } from '../lib/rbac';

const AuthContext = createContext(null);

const DEFAULT_SESSION_USER = {
    id: 'usr-admin-1',
    name: 'Admin',
    email: 'info@rednexpharma.com',
    roleId: 'admin',
    accountScope: 'full_app',
    plantAccess: 'All',
    status: 'Active',
};

export function AuthProvider({ children, initialUser = DEFAULT_SESSION_USER, initialRoles = DEFAULT_ROLES }) {
    const [currentUser, setCurrentUser] = useState(initialUser);
    const [roles, setRoles] = useState(initialRoles);

    const effectivePermissions = useMemo(
        () => resolveEffectivePermissions(currentUser, roles),
        [currentUser, roles]
    );

    const can = useCallback(
        (permission) => effectivePermissions.has(permission),
        [effectivePermissions]
    );

    const checkPlant = useCallback(
        (plant) => canAccessPlant(currentUser, plant),
        [currentUser]
    );

    const syncRolePermissions = useCallback((updatedRole) => {
        setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
    }, []);

    const value = useMemo(
        () => ({
            currentUser,
            setCurrentUser,
            roles,
            syncRolePermissions,
            effectivePermissions,
            can,
            canAccessPlant: checkPlant,
        }),
        [currentUser, roles, syncRolePermissions, effectivePermissions, can, checkPlant]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
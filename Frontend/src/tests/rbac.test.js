// src/tests/rbac.test.js
import { describe, it, expect } from 'vitest';
import {
    DEFAULT_ROLES,
    PERMISSIONS,
    resolveEffectivePermissions,
    resolveEffectivePlantFilter,
    validateUserMutationGuard,
} from '../lib/rbac';

describe('RBAC Engine (Unit)', () => {
    it('restricts daily_reporting_only accounts to daily_reporting:submit even with Admin role', () => {
        const perms = resolveEffectivePermissions(
            { id: 'u1', roleId: 'admin', accountScope: 'daily_reporting_only', status: 'Active' },
            DEFAULT_ROLES
        );
        expect(perms.has(PERMISSIONS.DAILY_REPORTING_SUBMIT)).toBe(true);
        expect(perms.has(PERMISSIONS.USERS_MANAGE)).toBe(false);
        expect(perms.has(PERMISSIONS.DASHBOARD_VIEW)).toBe(false);
    });

    it('clamps plant filter to user plantAccess regardless of URL query tampering', () => {
        const betaUser = { plantAccess: 'Beta' };
        expect(resolveEffectivePlantFilter(betaUser, 'General')).toBe('Beta');
        expect(resolveEffectivePlantFilter(betaUser, 'All')).toBe('Beta');
        expect(resolveEffectivePlantFilter({ plantAccess: 'All' }, 'General')).toBe('General');
        expect(resolveEffectivePlantFilter({ plantAccess: 'All' }, 'InvalidPlant')).toBe('All');
    });

    it('blocks self-deactivation and demoting the last active Admin', () => {
        const admin = { id: 'a1', roleId: 'admin', status: 'Active' };
        expect(
            validateUserMutationGuard({ actorId: 'a1', targetUser: admin, nextStatus: 'Inactive', allUsers: [admin] }).allowed
        ).toBe(false);

        expect(
            validateUserMutationGuard({ actorId: 'a2', targetUser: admin, nextRoleId: 'qa', nextStatus: 'Active', allUsers: [admin] }).allowed
        ).toBe(false);
    });
});
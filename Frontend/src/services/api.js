// src/services/api.js
import { ENV } from '../config/env';
import { httpRequest } from './httpClient';
import { mockDb } from './mockDb';
import { validateUserMutationGuard } from '../lib/rbac';

const delay = (ms = 60) => new Promise((res) => setTimeout(res, ms));

export const api = {
    async fetchDashboard(signal) {
        if (!ENV.USE_MOCK_API) return httpRequest('/dashboard', { signal });
        await delay();
        return {
            stages: [...mockDb.stages].sort((a, b) => a.sequence - b.sequence),
            orders: [...mockDb.orders],
        };
    },

    async fetchUsersAndRoles(signal) {
        if (!ENV.USE_MOCK_API) return httpRequest('/users', { signal });
        await delay();
        return {
            users: [...mockDb.users],
            roles: [...mockDb.roles],
        };
    },

    async createUser(payload) {
        if (!ENV.USE_MOCK_API) return httpRequest('/users', { method: 'POST', body: payload });
        await delay();

        const cleanName = String(payload.name || '').trim();
        const normalizedEmail = String(payload.email || '').trim().toLowerCase();

        if (!cleanName) throw new Error('Full name is required.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            throw new Error('Please enter a valid email address.');
        }
        if (!payload.temporaryPassword || payload.temporaryPassword.length < 8) {
            throw new Error('Temporary password must be at least 8 characters.');
        }
        if (mockDb.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
            throw new Error('A user with this email address already exists.');
        }

        const created = {
            id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: cleanName,
            email: normalizedEmail,
            roleId: payload.roleId,
            accountScope: payload.accountScope || 'full_app',
            plantAccess: payload.plantAccess || 'All',
            status: 'Active',
            mustChangePassword: Boolean(payload.mustChangePassword ?? true),
            updatedAt: new Date().toISOString(),
        };
        mockDb.users = [created, ...mockDb.users];
        return created;
    },

    async updateUser({ userId, updates, actorId }) {
        if (!ENV.USE_MOCK_API) {
            return httpRequest(`/users/${userId}`, { method: 'PATCH', body: updates });
        }
        await delay();

        const idx = mockDb.users.findIndex((u) => u.id === userId);
        if (idx === -1) throw new Error('User not found.');

        const target = mockDb.users[idx];
        const guard = validateUserMutationGuard({
            actorId,
            targetUser: target,
            nextRoleId: updates.roleId ?? target.roleId,
            nextStatus: updates.status ?? target.status,
            allUsers: mockDb.users,
        });
        if (!guard.allowed) throw new Error(guard.reason);

        const sanitized = { ...updates };
        if (sanitized.email !== undefined) {
            sanitized.email = sanitized.email.trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.email)) {
                throw new Error('Please enter a valid email address.');
            }
            if (mockDb.users.some((u) => u.id !== userId && u.email.toLowerCase() === sanitized.email)) {
                throw new Error('Another user already uses this email address.');
            }
        }
        if (sanitized.name !== undefined) {
            sanitized.name = sanitized.name.trim();
            if (!sanitized.name) throw new Error('Full name cannot be empty.');
        }

        const updated = { ...target, ...sanitized, updatedAt: new Date().toISOString() };
        mockDb.users = mockDb.users.map((u, i) => (i === idx ? updated : u));
        return updated;
    },

    async updateRolePermissions({ roleId, permissions }) {
        if (!ENV.USE_MOCK_API) {
            return httpRequest(`/roles/${roleId}`, { method: 'PATCH', body: { permissions } });
        }
        await delay();

        const role = mockDb.roles.find((r) => r.id === roleId);
        if (!role) throw new Error('Role not found.');
        if (role.isSystem) throw new Error('System Admin role permissions cannot be restricted.');

        const updatedRole = { ...role, permissions: Array.from(new Set(permissions)) };
        mockDb.roles = mockDb.roles.map((r) => (r.id === roleId ? updatedRole : r));
        return updatedRole;
    },
};
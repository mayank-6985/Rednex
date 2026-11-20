// src/lib/rbac.js
export const PERMISSIONS = {
    DASHBOARD_VIEW: 'dashboard:view',
    ORDERS_VIEW: 'orders:view',
    ORDERS_CREATE: 'orders:create',
    ORDERS_CANCEL: 'orders:cancel',
    ORDERS_VIEW_RATE: 'orders:view_rate',
    WORKFLOW_CONFIGURE: 'workflow:configure',
    ARTWORK_MANAGE: 'artwork:manage',
    PM_SUPPLY_MANAGE: 'pm_supply:manage',
    QA_MANAGE: 'qa:manage',
    PRODUCTION_MANAGE: 'production:manage',
    QC_MANAGE: 'qc:manage',
    PACKING_MANAGE: 'packing:manage',
    DISPATCH_MANAGE: 'dispatch:manage',
    DAILY_REPORTING_SUBMIT: 'daily_reporting:submit',
    DAILY_REPORTING_VIEW_ALL: 'daily_reporting:view_all',
    PRODUCT_MASTER_MANAGE: 'product_master:manage',
    STANDARD_MASTER_MANAGE: 'standard_master:manage',
    USERS_VIEW: 'users:view',
    USERS_MANAGE: 'users:manage',
    ROLES_MANAGE: 'roles:manage',
};

export const PERMISSION_GROUPS = [
    {
        group: 'Core & Orders',
        items: [
            { key: PERMISSIONS.DASHBOARD_VIEW, label: 'View Dashboard' },
            { key: PERMISSIONS.ORDERS_VIEW, label: 'View Sales Orders' },
            { key: PERMISSIONS.ORDERS_CREATE, label: 'Create Sales Orders' },
            { key: PERMISSIONS.ORDERS_CANCEL, label: 'Cancel Orders' },
            { key: PERMISSIONS.ORDERS_VIEW_RATE, label: 'View Order Rate & Amount' },
            { key: PERMISSIONS.WORKFLOW_CONFIGURE, label: 'Configure Dynamic Workflow Steps' },
        ],
    },
    {
        group: 'Pipeline Stages',
        items: [
            { key: PERMISSIONS.ARTWORK_MANAGE, label: 'Artwork Stage' },
            { key: PERMISSIONS.PM_SUPPLY_MANAGE, label: 'PM Supply Tracking' },
            { key: PERMISSIONS.QA_MANAGE, label: 'QA (BMR/BPR)' },
            { key: PERMISSIONS.PRODUCTION_MANAGE, label: 'Production Stage' },
            { key: PERMISSIONS.QC_MANAGE, label: 'QC Release Stage' },
            { key: PERMISSIONS.PACKING_MANAGE, label: 'Packing Stage' },
            { key: PERMISSIONS.DISPATCH_MANAGE, label: 'Dispatch Stage' },
        ],
    },
    {
        group: 'Reporting, Masters & Administration',
        items: [
            { key: PERMISSIONS.DAILY_REPORTING_SUBMIT, label: 'Submit Daily Work Log' },
            { key: PERMISSIONS.DAILY_REPORTING_VIEW_ALL, label: 'Review All Daily Logs' },
            { key: PERMISSIONS.PRODUCT_MASTER_MANAGE, label: 'Manage Product Master' },
            { key: PERMISSIONS.STANDARD_MASTER_MANAGE, label: 'Manage Standard Master' },
            { key: PERMISSIONS.USERS_VIEW, label: 'View Users Directory' },
            { key: PERMISSIONS.USERS_MANAGE, label: 'Create, Edit & Toggle Users' },
            { key: PERMISSIONS.ROLES_MANAGE, label: 'Edit Role Permission Matrix' },
        ],
    },
];

export const PLANTS = ['All', 'Beta', 'General'];

export const ACCOUNT_SCOPES = [
    { value: 'full_app', label: 'Full App Account' },
    { value: 'daily_reporting_only', label: 'Daily Reporting Only' },
];

export const DEFAULT_ROLES = [
    { id: 'admin', name: 'Admin', isSystem: true, permissions: Object.values(PERMISSIONS) },
    {
        id: 'qa',
        name: 'QA',
        isSystem: false,
        permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.QA_MANAGE, PERMISSIONS.DAILY_REPORTING_SUBMIT],
    },
    {
        id: 'qc',
        name: 'QC',
        isSystem: false,
        permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.QC_MANAGE, PERMISSIONS.DAILY_REPORTING_SUBMIT],
    },
    {
        id: 'designer',
        name: 'Designer',
        isSystem: false,
        permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ARTWORK_MANAGE],
    },
    {
        id: 'ppmc',
        name: 'Primary Production Planning & Material Control',
        isSystem: false,
        permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.PM_SUPPLY_MANAGE],
    },
    {
        id: 'production',
        name: 'Production',
        isSystem: false,
        permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.PRODUCTION_MANAGE, PERMISSIONS.DAILY_REPORTING_SUBMIT],
    },
    {
        id: 'packing',
        name: 'Packing',
        isSystem: false,
        permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.PACKING_MANAGE],
    },
    {
        id: 'dispatch',
        name: 'Dispatch',
        isSystem: false,
        permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.DISPATCH_MANAGE],
    },
    {
        id: 'purchase',
        name: 'Purchase',
        isSystem: false,
        permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ORDERS_VIEW, PERMISSIONS.PM_SUPPLY_MANAGE, PERMISSIONS.STANDARD_MASTER_MANAGE],
    },
];

export function resolveEffectivePermissions(user, rolesList) {
    if (!user || user.status !== 'Active') return new Set();
    if (user.accountScope === 'daily_reporting_only') {
        return new Set([PERMISSIONS.DAILY_REPORTING_SUBMIT]);
    }
    const role = rolesList.find((r) => r.id === user.roleId);
    return role ? new Set(role.permissions) : new Set();
}

export function canAccessPlant(user, plant) {
    if (!user) return false;
    if (!user.plantAccess || user.plantAccess === 'All' || plant === 'All') return true;
    return user.plantAccess === plant;
}

export function resolveEffectivePlantFilter(user, requestedPlant) {
    if (user?.plantAccess && user.plantAccess !== 'All') {
        return user.plantAccess;
    }
    return PLANTS.includes(requestedPlant) ? requestedPlant : 'All';
}

export function validateUserMutationGuard({ actorId, targetUser, nextRoleId, nextStatus, allUsers }) {
    const isSelf = actorId === targetUser.id;
    const activeAdmins = allUsers.filter((u) => u.roleId === 'admin' && u.status === 'Active');
    const isTargetActiveAdmin = targetUser.roleId === 'admin' && targetUser.status === 'Active';

    if (isSelf && nextStatus === 'Inactive') {
        return { allowed: false, reason: 'You cannot deactivate your own active account.' };
    }
    if (isSelf && targetUser.roleId === 'admin' && nextRoleId && nextRoleId !== 'admin') {
        return { allowed: false, reason: 'You cannot remove Admin privileges from your own account.' };
    }
    if (
        isTargetActiveAdmin &&
        activeAdmins.length <= 1 &&
        (nextStatus === 'Inactive' || (nextRoleId && nextRoleId !== 'admin'))
    ) {
        return { allowed: false, reason: 'At least one active Admin account must remain in the system.' };
    }
    return { allowed: true, reason: null };
}
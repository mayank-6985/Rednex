import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PERMISSIONS } from '../lib/rbac';
import { ROUTES } from './routePaths';

const DashboardPage = lazy(() =>
    import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const UsersPage = lazy(() =>
    import('../features/users/UsersPage').then((m) => ({ default: m.UsersPage }))
);

function PageFallback() {
    return (
        <div className="space-y-4" aria-busy="true" aria-label="Loading page">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
                ))}
            </div>
        </div>
    );
}

function ComingSoon({ title }) {
    return (
        <div className="rounded-2xl bg-white p-8 border border-slate-200">
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500 mt-1">Scheduled for the next implementation phase.</p>
        </div>
    );
}

const PLACEHOLDER_MODULES = [
    { path: ROUTES.ORDERS, title: 'Sales Orders', permission: PERMISSIONS.ORDERS_VIEW },
    { path: ROUTES.NEW_ORDER, title: 'New Order', permission: PERMISSIONS.ORDERS_CREATE },
    { path: ROUTES.WORKFLOW, title: 'Dynamic Workflow Builder', permission: PERMISSIONS.WORKFLOW_CONFIGURE },
    { path: ROUTES.PM_SUPPLY, title: 'PM Supply', permission: PERMISSIONS.PM_SUPPLY_MANAGE },
    { path: ROUTES.QA, title: 'QA Pending', permission: PERMISSIONS.QA_MANAGE },
    { path: ROUTES.DAILY_REPORTING, title: 'Daily Reporting', permission: PERMISSIONS.DAILY_REPORTING_SUBMIT },
    { path: ROUTES.PRODUCT_MASTER, title: 'Product Master', permission: PERMISSIONS.PRODUCT_MASTER_MANAGE },
    { path: ROUTES.STANDARD_MASTER, title: 'Standard Master', permission: PERMISSIONS.STANDARD_MASTER_MANAGE },
];

export function AppRoutes() {
    return (
        <Suspense fallback={<PageFallback />}>
            <Routes>
                <Route element={<AppShell />}>
                    <Route
                        path={ROUTES.DASHBOARD}
                        element={
                            <ProtectedRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path={ROUTES.USERS}
                        element={
                            <ProtectedRoute permission={PERMISSIONS.USERS_VIEW}>
                                <UsersPage />
                            </ProtectedRoute>
                        }
                    />
                    {PLACEHOLDER_MODULES.map((mod) => (
                        <Route
                            key={mod.path}
                            path={mod.path}
                            element={
                                <ProtectedRoute permission={mod.permission}>
                                    <ComingSoon title={mod.title} />
                                </ProtectedRoute>
                            }
                        />
                    ))}
                    <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                </Route>
            </Routes>
        </Suspense>
    );
}
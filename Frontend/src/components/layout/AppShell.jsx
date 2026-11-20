import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    LayoutGrid, ListOrdered, PlusCircle, Package, CheckSquare,
    CalendarDays, Box, Bookmark, Users, LogOut, Menu, X, Workflow,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../lib/rbac';
import { ROUTES } from '../../routes/routePaths';

const NAV_ITEMS = [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutGrid, permission: PERMISSIONS.DASHBOARD_VIEW, end: true },
    { to: ROUTES.ORDERS, label: 'Sales Orders', icon: ListOrdered, permission: PERMISSIONS.ORDERS_VIEW },
    { to: ROUTES.NEW_ORDER, label: 'New Order', icon: PlusCircle, permission: PERMISSIONS.ORDERS_CREATE },
    { to: ROUTES.WORKFLOW, label: 'Workflow Builder', icon: Workflow, permission: PERMISSIONS.WORKFLOW_CONFIGURE },
    { to: ROUTES.PM_SUPPLY, label: 'PM Supply', icon: Package, permission: PERMISSIONS.PM_SUPPLY_MANAGE },
    { to: ROUTES.QA, label: 'QA', icon: CheckSquare, permission: PERMISSIONS.QA_MANAGE },
    { to: ROUTES.DAILY_REPORTING, label: 'Daily Reporting', icon: CalendarDays, permission: PERMISSIONS.DAILY_REPORTING_SUBMIT },
    { to: ROUTES.PRODUCT_MASTER, label: 'Product Master', icon: Box, permission: PERMISSIONS.PRODUCT_MASTER_MANAGE },
    { to: ROUTES.STANDARD_MASTER, label: 'Standard Master', icon: Bookmark, permission: PERMISSIONS.STANDARD_MASTER_MANAGE },
    { to: ROUTES.USERS, label: 'Users', icon: Users, permission: PERMISSIONS.USERS_VIEW },
];

export function AppShell() {
    const { currentUser, can } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const visibleNav = useMemo(
        () => NAV_ITEMS.filter((item) => can(item.permission)),
        [can]
    );

    useEffect(() => {
        if (!mobileOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setMobileOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [mobileOpen]);

    const initials = useMemo(() => {
        if (!currentUser?.name) return 'U';
        return currentUser.name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }, [currentUser?.name]);

    const renderSidebar = () => (
        <div className="flex h-full flex-col bg-white border-r border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-slate-700 font-black text-red-600 text-sm">
                        R
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900">Rednex</span>
                </div>
                <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation menu"
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="px-4 py-3">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{currentUser?.name}</p>
                        <p className="truncate text-xs text-slate-500 capitalize">{currentUser?.roleId}</p>
                    </div>
                </div>
            </div>

            <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {visibleNav.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                }`
                            }
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="border-t border-slate-100 p-3">
                <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                {renderSidebar()}
            </aside>

            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
                    <div className="relative z-10 w-64 max-w-[80vw] h-full">{renderSidebar()}</div>
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
                <header className="sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation menu"
                        className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="font-bold text-slate-900">Rednex</span>
                    <div className="h-8 w-8 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                        {initials}
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
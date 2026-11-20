import React from 'react';
import { Link } from 'react-router-dom';
import {
    List, Activity, Truck, XCircle, Search, RefreshCw, AlertTriangle, FilterX,
} from 'lucide-react';
import { useDashboardData } from './hooks/useDashboardData';
import { useAuth } from '../../context/AuthContext';
import { PLANTS } from '../../lib/rbac';
import { ROUTES } from '../../routes/routePaths';

const STAGE_STYLES = {
    amber: { border: 'border-l-amber-400', bg: 'bg-amber-50/70', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    purple: { border: 'border-l-purple-500', bg: 'bg-purple-50/70', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
    sky: { border: 'border-l-sky-500', bg: 'bg-sky-50/70', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
    orange: { border: 'border-l-orange-500', bg: 'bg-orange-50/70', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
    lime: { border: 'border-l-lime-500', bg: 'bg-lime-50/70', badge: 'bg-lime-50 text-lime-700 border-lime-200' },
    teal: { border: 'border-l-teal-500', bg: 'bg-teal-50/70', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
    rose: { border: 'border-l-rose-500', bg: 'bg-rose-50/70', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    emerald: { border: 'border-l-emerald-500', bg: 'bg-emerald-50/70', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

function formatDate(iso) {
    if (!iso) return '—';
    const date = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export function DashboardPage() {
    const { currentUser } = useAuth();
    const {
        canViewDashboard,
        isLoading,
        isError,
        error,
        refetch,
        kpis,
        pipelineStages,
        stageMap,
        recentOrders,
        selectedPlant,
        setSelectedPlant,
        selectedStageId,
        toggleStageFilter,
        searchQuery,
        setSearchQuery,
        clearFilters,
    } = useDashboardData();

    if (!canViewDashboard) {
        return (
            <div role="alert" className="rounded-2xl bg-white p-8 border border-slate-200 text-center">
                <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
                <h2 className="text-lg font-semibold text-slate-900">Access Restricted</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Your role does not have permission to view the Sales-to-Dispatch Dashboard.
                </p>
            </div>
        );
    }

    if (isError) {
        return (
            <div role="alert" className="rounded-2xl bg-red-50 border border-red-200 p-6 flex items-center justify-between gap-4">
                <div>
                    <h2 className="font-semibold text-red-900">Failed to load dashboard</h2>
                    <p className="text-sm text-red-700">{error?.message || 'Unexpected network error'}</p>
                </div>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                    <RefreshCw className="h-4 w-4" /> Retry
                </button>
            </div>
        );
    }

    const plantLocked = Boolean(currentUser?.plantAccess && currentUser.plantAccess !== 'All');

    const kpiCards = [
        { label: 'TOTAL ORDERS', value: kpis.total, icon: List, tone: 'bg-red-50 text-red-600' },
        { label: 'ACTIVE', value: kpis.active, icon: Activity, tone: 'bg-sky-50 text-sky-600' },
        { label: 'DISPATCHED', value: kpis.dispatched, icon: Truck, tone: 'bg-emerald-50 text-emerald-600' },
        { label: 'CANCELLED', value: kpis.cancelled, icon: XCircle, tone: 'bg-rose-50 text-rose-600' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Sales-to-dispatch pipeline overview across all orders.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <label htmlFor="dashboard-plant-filter" className="text-xs font-medium text-slate-500 uppercase">
                        Plant
                    </label>
                    <select
                        id="dashboard-plant-filter"
                        value={selectedPlant}
                        disabled={plantLocked}
                        onChange={(e) => setSelectedPlant(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-2xs focus:border-red-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    >
                        {PLANTS.map((plant) => (
                            <option key={plant} value={plant}>
                                {plant === 'All' ? 'All Plants' : `${plant} Plant`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <section aria-label="Order summary metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {kpiCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
                            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            {isLoading ? (
                                <div className="mt-4 h-8 w-16 animate-pulse rounded bg-slate-200" />
                            ) : (
                                <p className="mt-4 text-3xl font-bold text-slate-900">{card.value}</p>
                            )}
                            <p className="mt-1 text-xs font-semibold tracking-wider text-slate-500">{card.label}</p>
                        </div>
                    );
                })}
            </section>

            {/* Dynamic Pipeline */}
            <section aria-label="Dynamic order pipeline" className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-slate-900">Pipeline</h2>
                    {selectedStageId && (
                        <button
                            type="button"
                            onClick={() => toggleStageFilter(selectedStageId)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700"
                        >
                            <FilterX className="h-3.5 w-3.5" /> Clear stage filter
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x lg:grid lg:grid-cols-4 xl:grid-cols-8 lg:overflow-visible lg:pb-0">
                        {pipelineStages.map((stage) => {
                            const style = STAGE_STYLES[stage.color] || STAGE_STYLES.sky;
                            const isSelected = selectedStageId === stage.id;
                            return (
                                <button
                                    key={stage.id}
                                    type="button"
                                    onClick={() => toggleStageFilter(stage.id)}
                                    aria-pressed={isSelected}
                                    className={`min-w-[120px] snap-start rounded-xl border border-slate-200 border-l-4 px-4 py-3.5 text-center transition-all ${style.border
                                        } ${style.bg} ${isSelected ? 'ring-2 ring-red-600 ring-offset-1' : 'hover:shadow-sm'
                                        }`}
                                >
                                    <p className="text-xl font-bold text-slate-900">{stage.count}</p>
                                    <p className="mt-1 truncate text-xs font-medium text-slate-600">{stage.name}</p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Recent Orders */}
            <section aria-label="Recent orders" className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <h2 className="text-base font-semibold text-slate-900">
                            Recent orders{' '}
                            <span className="ml-1 text-xs font-normal text-slate-500">({recentOrders.length})</span>
                        </h2>
                        <Link to={ROUTES.ORDERS} className="text-xs font-semibold text-red-600 hover:text-red-700">
                            View all
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-72">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search order no, party, brand..."
                                aria-label="Search recent orders"
                                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:outline-none"
                            />
                        </div>
                        {(searchQuery || selectedStageId) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table aria-label="Recent orders table" className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <th className="px-5 py-3.5">Order No</th>
                                <th className="px-5 py-3.5">Party</th>
                                <th className="px-5 py-3.5">Brand</th>
                                <th className="px-5 py-3.5">Order Date</th>
                                <th className="px-5 py-3.5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                                        No matching orders found.
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => {
                                    const stage = stageMap[order.stageId];
                                    const stageBadgeStyle =
                                        order.status === 'Cancelled'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : STAGE_STYLES[stage?.color]?.badge || 'bg-slate-100 text-slate-700 border-slate-200';

                                    return (
                                        <tr
                                            key={order.id}
                                            className={order.status === 'Cancelled' ? 'bg-red-50/30' : 'hover:bg-slate-50/70'}
                                        >
                                            <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">{order.orderNo}</td>
                                            <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap">{order.party}</td>
                                            <td className="px-5 py-3.5 text-slate-700 max-w-md truncate" title={order.brand}>
                                                {order.brand}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(order.orderDate)}</td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${stageBadgeStyle}`}>
                                                        {order.status === 'Cancelled' ? 'Cancelled' : stage?.name || order.stageId}
                                                    </span>
                                                    {order.qaPending && order.status !== 'Cancelled' && (
                                                        <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                                                            QA Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div data-testid="mobile-orders-list" className="divide-y divide-slate-100 md:hidden">
                    {recentOrders.length === 0 ? (
                        <p className="p-6 text-center text-sm text-slate-500">No matching orders found.</p>
                    ) : (
                        recentOrders.map((order) => {
                            const stage = stageMap[order.stageId];
                            return (
                                <div key={order.id} className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="font-semibold text-slate-900 text-sm">{order.orderNo}</span>
                                        <span className="text-xs text-slate-500">{formatDate(order.orderDate)}</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-700">{order.party}</p>
                                    <p className="text-xs text-slate-500 line-clamp-2">{order.brand}</p>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                                            {order.status === 'Cancelled' ? 'Cancelled' : stage?.name || order.stageId}
                                        </span>
                                        {order.qaPending && order.status !== 'Cancelled' && (
                                            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                                                QA Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
}
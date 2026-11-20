// src/features/dashboard/hooks/useDashboardData.js
import { useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS, resolveEffectivePlantFilter } from '../../../lib/rbac';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

export const DASHBOARD_QUERY_KEY = ['dashboard', 'overview'];

export function useDashboardData() {
    const { currentUser, can, canAccessPlant } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const debouncedSearch = useDebouncedValue(searchQuery, 200);

    const canViewDashboard = can(PERMISSIONS.DASHBOARD_VIEW);

    // Strictly enforce RBAC plant scope even if someone edits ?plant= in the URL
    const selectedPlant = resolveEffectivePlantFilter(currentUser, searchParams.get('plant') || 'All');
    const rawStageParam = searchParams.get('stage') || null;

    const query = useQuery({
        queryKey: DASHBOARD_QUERY_KEY,
        queryFn: ({ signal }) => api.fetchDashboard(signal),
        enabled: canViewDashboard,
        staleTime: 30 * 1000,
    });

    // Validate stage param against active dynamic stages so deleted/renamed stages don't break view
    const stageMap = useMemo(() => {
        const map = {};
        for (const st of query.data?.stages ?? []) map[st.id] = st;
        return map;
    }, [query.data?.stages]);

    const selectedStageId = rawStageParam && stageMap[rawStageParam]?.active ? rawStageParam : null;

    const scopedOrders = useMemo(() => {
        const rawOrders = query.data?.orders ?? [];
        return rawOrders.filter((order) => {
            if (!canAccessPlant(order.plant)) return false;
            if (selectedPlant !== 'All' && order.plant !== selectedPlant) return false;
            return true;
        });
    }, [query.data?.orders, selectedPlant, canAccessPlant]);

    const kpis = useMemo(() => {
        let active = 0;
        let dispatched = 0;
        let cancelled = 0;

        for (const order of scopedOrders) {
            if (order.status === 'Cancelled') cancelled += 1;
            else if (order.status === 'Dispatched') dispatched += 1;
            else active += 1;
        }

        return { total: scopedOrders.length, active, dispatched, cancelled };
    }, [scopedOrders]);

    const pipelineStages = useMemo(() => {
        const activeStages = (query.data?.stages ?? [])
            .filter((s) => s.active)
            .sort((a, b) => a.sequence - b.sequence);

        const counts = scopedOrders.reduce((acc, order) => {
            if (order.status !== 'Cancelled') {
                acc[order.stageId] = (acc[order.stageId] || 0) + 1;
            }
            return acc;
        }, {});

        return activeStages.map((stage) => ({
            ...stage,
            count: counts[stage.id] || 0,
        }));
    }, [query.data?.stages, scopedOrders]);

    const recentOrders = useMemo(() => {
        const term = debouncedSearch.trim().toLowerCase();
        return scopedOrders
            .filter((order) => {
                if (selectedStageId && order.stageId !== selectedStageId) return false;
                if (!term) return true;
                return (
                    order.orderNo.toLowerCase().includes(term) ||
                    order.party.toLowerCase().includes(term) ||
                    order.brand.toLowerCase().includes(term)
                );
            })
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    }, [scopedOrders, selectedStageId, debouncedSearch]);

    const updateParams = useCallback(
        (patch) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    Object.entries(patch).forEach(([k, v]) => {
                        if (!v || v === 'All') next.delete(k);
                        else next.set(k, v);
                    });
                    return next;
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );

    const setSelectedPlant = useCallback(
        (plant) => {
            if (currentUser?.plantAccess && currentUser.plantAccess !== 'All') return;
            updateParams({ plant });
        },
        [currentUser?.plantAccess, updateParams]
    );

    const toggleStageFilter = useCallback(
        (stageId) => {
            updateParams({ stage: selectedStageId === stageId ? null : stageId });
        },
        [selectedStageId, updateParams]
    );

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        updateParams({ stage: null, q: null });
    }, [updateParams]);

    return {
        ...query,
        canViewDashboard,
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
    };
}
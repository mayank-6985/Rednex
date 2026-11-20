import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { resetMockDb } from '../services/mockDb';
import { api } from '../services/api';

function renderDashboard({ initialUser, initialRoute = '/' } = {}) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={qc}>
            <MemoryRouter initialEntries={[initialRoute]}>
                <AuthProvider initialUser={initialUser}>
                    <DashboardPage />
                </AuthProvider>
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('DashboardPage (Integration)', () => {
    beforeEach(() => resetMockDb());

    it('filters recent orders when clicking a dynamic pipeline stage', async () => {
        const user = userEvent.setup();
        renderDashboard();

        const table = await waitFor(() =>
            screen.getByRole('table', { name: /Recent orders table/i })
        );
        await waitFor(() =>
            expect(within(table).getByText('RED-GT-2026-09-0002')).toBeInTheDocument()
        );

        const artworkBtn = screen.getByRole('button', { name: /Artwork/i });
        await user.click(artworkBtn);

        expect(artworkBtn).toHaveAttribute('aria-pressed', 'true');
        expect(within(table).getByText('RED-BT-2026-08-0002')).toBeInTheDocument();
        expect(within(table).queryByText('RED-GT-2026-09-0002')).not.toBeInTheDocument();
    });

    it('ignores URL plant tampering for Beta-scoped users and locks plant selector', async () => {
        renderDashboard({
            initialRoute: '/?plant=General',
            initialUser: {
                id: 'u-beta',
                name: 'Beta Prod',
                roleId: 'production',
                accountScope: 'full_app',
                plantAccess: 'Beta',
                status: 'Active',
            },
        });

        const table = await waitFor(() =>
            screen.getByRole('table', { name: /Recent orders table/i })
        );
        await waitFor(() =>
            expect(within(table).getByText('RED-BT-2026-08-0002')).toBeInTheDocument()
        );
        expect(within(table).queryByText('RED-GT-2026-09-0002')).not.toBeInTheDocument();
        expect(screen.getByLabelText(/Plant/i)).toHaveValue('Beta');
        expect(screen.getByLabelText(/Plant/i)).toBeDisabled();
    });

    it('does not trigger dashboard API fetch when user lacks dashboard:view', () => {
        const spy = vi.spyOn(api, 'fetchDashboard');
        renderDashboard({
            initialUser: {
                id: 'u-dr',
                name: 'SIYA',
                roleId: 'qa',
                accountScope: 'daily_reporting_only',
                plantAccess: 'General',
                status: 'Active',
            },
        });

        expect(screen.getByRole('alert')).toHaveTextContent(/Access Restricted/i);
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });
});
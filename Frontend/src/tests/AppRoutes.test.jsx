import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { AppRoutes } from '../routes/AppRoutes';
import { resetMockDb } from '../services/mockDb';

function renderApp({ initialRoute = '/', initialUser } = {}) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={qc}>
            <MemoryRouter initialEntries={[initialRoute]}>
                <AuthProvider initialUser={initialUser}>
                    <AppRoutes />
                </AuthProvider>
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('AppRoutes (Integration)', () => {
    beforeEach(() => resetMockDb());

    it('renders Dashboard on "/" for Admin', async () => {
        renderApp({ initialRoute: '/' });
        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    });

    it('renders Users module on "/users" for Admin', async () => {
        renderApp({ initialRoute: '/users' });
        expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
    });

    it('blocks QA role from navigating directly to "/users"', async () => {
        renderApp({
            initialRoute: '/users',
            initialUser: {
                id: 'usr-qa-1',
                name: 'QA',
                roleId: 'qa',
                accountScope: 'full_app',
                plantAccess: 'All',
                status: 'Active',
            },
        });
        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent(/Access Restricted/i)
        );
    });
});
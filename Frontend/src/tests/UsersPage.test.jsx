import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { UsersPage } from '../features/users/UsersPage';
import { resetMockDb } from '../services/mockDb';
import { api } from '../services/api';

function renderUsers(initialUser) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={qc}>
            <MemoryRouter>
                <AuthProvider initialUser={initialUser}>
                    <UsersPage />
                </AuthProvider>
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('UsersPage RBAC (Integration)', () => {
    beforeEach(() => resetMockDb());

    it('creates a user and blocks case-insensitive duplicate emails inside the modal', async () => {
        const user = userEvent.setup();
        renderUsers();

        await waitFor(() => expect(screen.getByText('qa.2022rednex@gmail.com')).toBeInTheDocument());

        await user.click(screen.getByRole('button', { name: /New User/i }));
        await user.type(screen.getByLabelText(/Full Name/i), '  Rohan Shah  ');
        await user.type(screen.getByLabelText(/Email Address/i), 'ROHAN@RednexPharma.com');
        await user.type(screen.getByLabelText(/Temporary Password/i), 'Rednex@2026');
        await user.click(screen.getByRole('button', { name: /Create User/i }));

        await waitFor(() => expect(screen.getByText('rohan@rednexpharma.com')).toBeInTheDocument());

        await user.click(screen.getByRole('button', { name: /New User/i }));
        const dialog = screen.getByRole('dialog');
        await user.type(within(dialog).getByLabelText(/Full Name/i), 'Duplicate Rohan');
        await user.type(within(dialog).getByLabelText(/Email Address/i), 'rohan@rednexpharma.com');
        await user.type(within(dialog).getByLabelText(/Temporary Password/i), 'Rednex@2026');
        await user.click(within(dialog).getByRole('button', { name: /Create User/i }));

        expect(await within(dialog).findByRole('alert')).toHaveTextContent(/already exists/i);
    });

    it('clears stale inline draft role when the same user is edited via modal', async () => {
        const user = userEvent.setup();
        renderUsers();

        await waitFor(() => expect(screen.getByLabelText('Role for QA')).toBeInTheDocument());

        await user.selectOptions(screen.getByLabelText('Role for QA'), 'packing');
        expect(screen.getByLabelText('Role for QA')).toHaveValue('packing');

        await user.click(screen.getByRole('button', { name: 'Edit QA' }));
        const dialog = screen.getByRole('dialog');
        await user.selectOptions(within(dialog).getByLabelText(/^Role \*/i), 'qc');
        await user.click(within(dialog).getByRole('button', { name: /Save Changes/i }));

        await waitFor(() => expect(screen.getByLabelText('Role for QA')).toHaveValue('qc'));
    });

    it('blocks self-deactivation and rolls back optimistic status update', async () => {
        const user = userEvent.setup();
        renderUsers();

        await waitFor(() => expect(screen.getByText('info@rednexpharma.com')).toBeInTheDocument());

        const adminRow = screen.getByText('info@rednexpharma.com').closest('tr');
        const statusBtn = within(adminRow).getByRole('button', { name: 'Active' });
        await user.click(statusBtn);

        expect(await screen.findByRole('alert')).toHaveTextContent(/cannot deactivate your own/i);
        expect(statusBtn).toHaveTextContent('Active');
    });

    it('blocks unauthorized users from fetching /users API', () => {
        const spy = vi.spyOn(api, 'fetchUsersAndRoles');
        renderUsers({
            id: 'usr-qa-1',
            name: 'QA',
            roleId: 'qa',
            accountScope: 'full_app',
            plantAccess: 'All',
            status: 'Active',
        });

        expect(screen.getByRole('alert')).toHaveTextContent(/Access Denied/i);
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });
});
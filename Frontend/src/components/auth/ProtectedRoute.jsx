// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ permission, children }) {
    const { can } = useAuth();

    if (permission && !can(permission)) {
        return (
            <div role="alert" className="rounded-2xl bg-white p-8 border border-slate-200 text-center max-w-lg mx-auto mt-8">
                <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
                <h2 className="text-lg font-semibold text-slate-900">Access Restricted</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Your role does not have permission to access this module.
                </p>
            </div>
        );
    }

    return children;
}
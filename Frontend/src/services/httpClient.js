// src/services/httpClient.js
import { ENV } from '../config/env';

export async function httpRequest(endpoint, { method = 'GET', body, headers = {}, signal } = {}) {
    const res = await fetch(`${ENV.API_BASE_URL}${endpoint}`, {
        method,
        credentials: 'include', // Ready for HTTP-only JWT cookies from Next.js API
        signal,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
    }
    return data;
}
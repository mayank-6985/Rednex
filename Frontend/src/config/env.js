function readEnv(key, fallback = '') {
    const metaEnv = import.meta.env;
    if (metaEnv && Object.prototype.hasOwnProperty.call(metaEnv, key) && metaEnv[key] !== undefined) {
        return metaEnv[key];
    }
    return fallback;
}

export const ENV = {
    API_BASE_URL: readEnv('VITE_API_BASE_URL', '/api'),
    USE_MOCK_API: readEnv('VITE_USE_MOCK_API', 'true') !== 'false',
};
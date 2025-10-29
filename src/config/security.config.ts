export const security = {
    accessTtlSec: 15 * 60, // 15 minutes
    refreshTtlSec: 30 * 24 * 60 * 60, // 30 days
    issuer: 'your-app',
    audience: 'your-app-clients',
    cookieName: 'rt', // cookie refresh token name
};

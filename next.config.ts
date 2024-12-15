/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            // Redirect authenticated users from public routes to home
            {
                source: '/login',
                has: [
                    {
                        type: 'cookie',
                        key: 'session',
                    },
                ],
                permanent: false,
                destination: '/',
            },
            {
                source: '/recovery',
                has: [
                    {
                        type: 'cookie',
                        key: 'session',
                    },
                ],
                permanent: false,
                destination: '/',
            },
            // Protect admin routes
            {
                source: '/admin/manage-admins',
                missing: [
                    {
                        type: 'cookie',
                        key: 'session',
                    },
                ],
                permanent: false,
                destination: '/login',
            },
            // Protect generic routes
            {
                source: '/:path(profile|return|inventory|admin)/:slug*',
                missing: [
                    {
                        type: 'cookie',
                        key: 'session',
                    },
                ],
                permanent: false,
                destination: '/login',
            },
        ];
    },
};

export default nextConfig;

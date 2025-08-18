
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // This is required to allow the Next.js dev server to accept requests from
  // your Cloud Workstation.
  allowedDevOrigins: ["*.cloudworkstations.dev"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'placehold.co',
        },
        {
            protocol: 'https',
            hostname: 'images.unsplash.com',
        },
        {
            protocol: 'https',
            hostname: 'leadergrid3.firebasestorage.app'
        }
    ],
  },
  async headers() {
    // In a production environment, you would want to be more restrictive than this
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Resolve 'async_hooks' to a false value on the client side
      config.resolve.alias.async_hooks = false;
    }
    return config;
  },
};

export default nextConfig;

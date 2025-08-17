
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
            hostname: 'firebasestorage.googleapis.com',
        }
    ],
  },
  experimental: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1755027599040.cluster-2xid2zxbenc4ixa74rpk7q7fyk.cloudworkstations.dev',
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
};

export default nextConfig;

    
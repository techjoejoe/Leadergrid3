
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // This is required to allow the Next.js dev server to accept requests from
  // your Cloud Workstation.
  allowedDevOrigins: [
    "*.cloudworkstations.dev", 
    "*.web.app", 
    "*.firebaseapp.com",
    // Adding the specific origin from the logs to ensure connectivity.
    "6000-firebase-studio-1755027599040.cluster-2xid2zxbenc4ixa74rpk7q7fyk.cloudworkstations.dev"
  ],
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
};

export default nextConfig;

    
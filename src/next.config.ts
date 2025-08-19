
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar'],
  },
  
  // Existing config
  allowedDevOrigins: [
    "*.cloudworkstations.dev", 
    "*.web.app", 
    "*.firebaseapp.com",
    "6000-firebase-studio-1755027599040.cluster-2xid2zxbenc4ixa74rpk7q7fyk.cloudworkstations.dev"
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Optimize images
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
    // Add image optimization
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Enable compression
  compress: true,
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          // Add caching headers
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;

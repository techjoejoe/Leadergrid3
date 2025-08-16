
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
    ],
  },
  experimental: {
    allowedDevOrigins: [
      "https://6000-firebase-studio-1755027599040.cluster-2xid2zxbenc4ixa74rpk7q7fyk.cloudworkstations.dev"
    ]
  }
};

export default nextConfig;

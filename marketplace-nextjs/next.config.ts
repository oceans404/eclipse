import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/graphql-proxy',
        destination: 'https://indexer.dev.hyperindex.xyz/1f84b17/v1/graphql',
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/graphql-proxy',
        destination: 'https://indexer.dev.hyperindex.xyz/e322c4a/v1/graphql',
      },
    ];
  },
};

export default nextConfig;

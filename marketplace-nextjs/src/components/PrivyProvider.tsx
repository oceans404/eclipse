'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { baseSepolia } from 'viem/chains';
import { http, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // Wagmi config specifically for Privy
  const baseRpcUrl =
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

  const wagmiConfig = createConfig({
    chains: [baseSepolia],
    transports: {
      [baseSepolia.id]: http(baseRpcUrl),
    },
  });

  return (
    <BasePrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#3B82F6',
        },
        defaultChain: {
          id: 84532,
          name: 'Base Sepolia',
          network: 'base-sepolia',
          nativeCurrency: {
            decimals: 18,
            name: 'Ethereum',
            symbol: 'ETH',
          },
          rpcUrls: {
            default: {
              http: [baseRpcUrl],
            },
            public: {
              http: [baseRpcUrl],
            },
          },
          blockExplorers: {
            default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
          },
        },
        supportedChains: [
          {
            id: 84532,
            name: 'Base Sepolia',
            network: 'base-sepolia',
            nativeCurrency: {
              decimals: 18,
              name: 'Ethereum',
              symbol: 'ETH',
            },
            rpcUrls: {
              default: {
                http: [baseRpcUrl],
              },
              public: {
                http: [baseRpcUrl],
              },
            },
            blockExplorers: {
              default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
            },
          },
        ],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </BasePrivyProvider>
  );
}

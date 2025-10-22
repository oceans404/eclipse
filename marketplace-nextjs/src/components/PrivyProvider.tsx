'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { sepolia } from 'viem/chains';
import { http, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // Wagmi config specifically for Privy
  const wagmiConfig = createConfig({
    chains: [sepolia],
    transports: {
      [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
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
          id: 11155111,
          name: 'Sepolia',
          network: 'sepolia',
          nativeCurrency: {
            decimals: 18,
            name: 'Ethereum',
            symbol: 'ETH',
          },
          rpcUrls: {
            default: {
              http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'],
            },
            public: {
              http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'],
            },
          },
          blockExplorers: {
            default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
          },
        },
        supportedChains: [
          {
            id: 11155111,
            name: 'Sepolia',
            network: 'sepolia',
            nativeCurrency: {
              decimals: 18,
              name: 'Ethereum',
              symbol: 'ETH',
            },
            rpcUrls: {
              default: {
                http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'],
              },
              public: {
                http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'],
              },
            },
            blockExplorers: {
              default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
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
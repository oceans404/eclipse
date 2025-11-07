import { baseSepolia } from 'viem/chains';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Chain and contract configuration
export const CHAIN_CONFIG = {
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    explorer: 'https://sepolia.basescan.org',
  }
} as const;

export const CONTRACT_ADDRESSES = {
  PRODUCT_PAYMENT_SERVICE: '0x9d0948391f7e84fcac40b8e792a406ac7c4d591f' as const,
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const,
} as const;

// Wagmi configuration for wallet interactions
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
    ),
  },
});

export const USDC_DECIMALS = 6;

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_BASESCAN_EXPLORER || CHAIN_CONFIG.BASE_SEPOLIA.explorer;

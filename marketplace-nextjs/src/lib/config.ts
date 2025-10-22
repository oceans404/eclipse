import { sepolia } from 'viem/chains';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Chain and contract configuration
export const CHAIN_CONFIG = {
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    explorer: 'https://sepolia.etherscan.io',
  }
} as const;

export const CONTRACT_ADDRESSES = {
  PRODUCT_PAYMENT_SERVICE: '0x9c91a92cf1cd0b94fb632292fe63ed966833518d' as const,
  PYUSD: '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9' as const,
} as const;

// Wagmi configuration for wallet interactions
export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
  },
});

export const PYUSD_DECIMALS = 6;
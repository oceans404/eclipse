export const CHAIN_IDS = {
  BASE_SEPOLIA: 84532,
} as const;

export const TOKEN_ADDRESSES = {
  USDC: {
    BASE_SEPOLIA: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const,
  },
} as const;

export const BLOCK_EXPLORERS = {
  BASE_SEPOLIA: {
    BASE_URL: "https://sepolia.basescan.org",
    TOKEN_URL: (address: string) => `https://sepolia.basescan.org/token/${address}`,
  },
} as const;

export const USDC_BASE_SEPOLIA_EXPLORER_URL = BLOCK_EXPLORERS.BASE_SEPOLIA.TOKEN_URL(
  TOKEN_ADDRESSES.USDC.BASE_SEPOLIA
);

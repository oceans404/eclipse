export const CHAIN_IDS = {
  SEPOLIA: 11155111,
} as const;

export const TOKEN_ADDRESSES = {
  PYUSD: {
    SEPOLIA: "0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9" as const,
  },
} as const;

export const BLOCK_EXPLORERS = {
  SEPOLIA: {
    BASE_URL: "https://sepolia.etherscan.io",
    TOKEN_URL: (address: string) => `https://sepolia.etherscan.io/token/${address}`,
  },
} as const;

// Helper to get PYUSD block explorer URL
export const PYUSD_SEPOLIA_EXPLORER_URL = BLOCK_EXPLORERS.SEPOLIA.TOKEN_URL(TOKEN_ADDRESSES.PYUSD.SEPOLIA);
import type { HardhatUserConfig } from 'hardhat/config';

import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem';

// Load environment variables from .env file
import 'dotenv/config';

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: '0.8.28',
      },
      production: {
        version: '0.8.28',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: 'edr-simulated',
      chainType: 'l1',
    },
    hardhatOp: {
      type: 'edr-simulated',
      chainType: 'op',
    },
    sepolia: {
      type: 'http',
      chainType: 'l1',
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: [
        process.env.SEPOLIA_PRIVATE_KEY,
        process.env.BUYER_PRIVATE_KEY,
      ].filter(Boolean) as string[], // Filter out undefined values
    },
  },
};

export default config;

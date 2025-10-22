# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eclipse is a private data marketplace built for EthOnline 2025 that enables buyers to verify encrypted content through AI agents before purchase. It leverages Nillion's privacy infrastructure (nilDB, nilAI, nilCC) and PYUSD for payments.

## Build Commands

Navigate to the onchain-payments directory before running commands:

```bash
cd onchain-payments

# Install dependencies
npm install

# Run all tests
npx hardhat test

# Run only Solidity tests
npx hardhat test solidity

# Run only Node.js tests  
npx hardhat test nodejs

# Deploy contracts
npx hardhat ignition deploy ignition/modules/Counter.ts

# Deploy to Sepolia
npx hardhat ignition deploy ignition/modules/Counter.ts --network sepolia

# Run scripts
npx hardhat run scripts/sendOptimismTransaction.ts
```

## Architecture Overview

The project uses a modular architecture:

1. **Smart Contracts** (`onchain-payments/contracts/`): Handle payments and access control
   - Currently has placeholder Counter.sol
   - Will integrate PYUSD payment system
   - Uses Solidity 0.8.28 with Hardhat 3 Beta

2. **Testing Strategy**:
   - Foundry-style Solidity tests (`.t.sol` files) for unit testing
   - Node.js tests with Viem for integration testing
   - Test files located in `onchain-payments/test/`

3. **Deployment** (`onchain-payments/ignition/modules/`):
   - Uses Hardhat Ignition for deployment management
   - Supports mainnet, Optimism, and Sepolia networks

4. **Privacy Layer** (Planned):
   - Nillion Private Storage (nilDB) for encrypted data
   - Nillion Private LLMs (nilAI) for content verification
   - Nillion Private Compute (nilCC) for secure processing

## Key Technical Details

- **Type System**: ES modules enabled (`"type": "module"` in package.json)
- **TypeScript**: Strict mode with ES2022 target
- **Ethereum Library**: Viem for all blockchain interactions
- **Networks**: Configured for local forks of mainnet/Optimism and Sepolia testnet
- **Environment Variables**: 
  - `SEPOLIA_RPC_URL`: RPC endpoint for Sepolia
  - `PRIVATE_KEY`: Deployment wallet private key

## Development Notes

1. The project is in early hackathon stage - core marketplace logic is not yet implemented
2. When adding new contracts, create corresponding:
   - Solidity test file (`.t.sol`) for unit tests
   - TypeScript test file in `test/` for integration tests
   - Deployment module in `ignition/modules/`
3. Use Viem instead of ethers.js for all blockchain interactions
4. Follow existing patterns for async/await and ES module imports
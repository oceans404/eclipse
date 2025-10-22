# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eclipse is a private data marketplace built for EthOnline 2025 that enables buyers to verify encrypted content through AI agents before purchase. It leverages Nillion's privacy infrastructure (nilDB, nilAI, nilCC) and PYUSD for payments.

## Build Commands

**Smart Contracts** (navigate to onchain-payments directory):

```bash
cd onchain-payments

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
```

**Event Indexer** (navigate to envio-indexer directory):

```bash
cd envio-indexer

# Install dependencies
pnpm install

# Generate types and start local indexer
pnpm codegen && pnpm dev
```

## Architecture Overview

The project uses a modular architecture:

1. **Smart Contracts** (`onchain-payments/contracts/`):

   - **ProductPaymentService.sol**: Core marketplace contract managing PYUSD payments
   - **MockERC20.sol**: Test token for development and testing
   - Direct creator payments with no platform fees
   - Integration with Nillion storage via contentId references
   - Uses Solidity 0.8.28 with Hardhat 3 Beta

2. **Testing Strategy**:

   - **Solidity Tests** (`contracts/ProductPaymentService.t.sol`): Foundry-based unit tests
   - **Integration Tests** (`test/ProductPaymentService.ts`): Node.js tests with Viem
   - Comprehensive coverage including multi-user scenarios and event testing

3. **Deployment & Scripts** (`onchain-payments/scripts/`):

   - **deploy.ts**: Deploy ProductPaymentService to Sepolia with PYUSD integration
   - **add-product.ts**: Create marketplace listings with Nillion content IDs
   - **buy-product.ts**: Purchase products using PYUSD payments
   - **update-product-price.ts**: Update product prices (creator-only)

4. **Constants & Configuration** (`onchain-payments/constants.ts`):

   - Chain IDs, token addresses, block explorer URLs
   - PYUSD Sepolia address: `0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9`
   - Sepolia chain ID: `11155111`

5. **Event Indexing** (`envio-indexer/`):

   - **Live GraphQL API**: https://indexer.dev.hyperindex.xyz/adebdd9/v1/graphql
   - **Dual Entity System**: Historical events + current Product state tracking
   - **Event Handlers**: Process PaymentReceived, ProductAdded, and ProductUpdated events
   - **Smart State Management**: Product entity auto-updates with price changes

6. **Privacy Layer Integration**:
   - Nillion Private Storage (nilDB) for encrypted data via contentId
   - Nillion Private LLMs (nilAI) for content verification
   - Nillion Private Compute (nilCC) for secure processing

## Key Technical Details

- **Type System**: ES modules enabled (`"type": "module"` in package.json)
- **TypeScript**: Strict mode with ES2022 target
- **Ethereum Library**: Viem for all blockchain interactions
- **Networks**: Configured for local forks of mainnet/Optimism and Sepolia testnet
- **Environment Variables**:
  - `SEPOLIA_RPC_URL`: RPC endpoint for Sepolia
  - `SEPOLIA_PRIVATE_KEY`: Deployment wallet private key
  - `BUYER_PRIVATE_KEY`: Second wallet for buyer interactions
  - `PAYMENT_SERVICE_ADDRESS`: Deployed contract address for interaction scripts

## Current Deployment

- **ProductPaymentService Contract**: `0x9c91a92cf1cd0b94fb632292fe63ed966833518d` (Sepolia)
- **Etherscan**: https://sepolia.etherscan.io/address/0x9c91a92cf1cd0b94fb632292fe63ed966833518d#code
- **Blockscout**: https://eth-sepolia.blockscout.com/address/0x9c91a92cf1cd0b94fb632292fe63ed966833518d?tab=contract
- **Payment Token**: PYUSD at `0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9`

## Development Notes

1. **Marketplace is fully implemented** with ProductPaymentService contract handling PYUSD payments
2. When adding new contracts, create corresponding:
   - Solidity test file (`.t.sol`) for unit tests
   - TypeScript test file in `test/` for integration tests
   - Deployment script in `scripts/`
3. Use Viem instead of ethers.js for all blockchain interactions
4. Follow existing patterns for async/await and ES module imports
5. **PYUSD Integration**: All prices use 6 decimal places (PYUSD standard)
6. **Nillion Integration**: Use contentId format like `"nillion://example-content"` for storage references

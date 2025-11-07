# 🌒 Eclipse Marketplace

A fully functional Web3 marketplace for private data with integrated wallet connectivity, USDC payments on Base Sepolia, and real-time blockchain data.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:4269](http://localhost:4269) to explore the marketplace.

## ✨ What You Can Do

### 🔗 **Wallet Integration**

- **Connect with Privy**: Email-based authentication + Base Sepolia wallet support
- **USDC Balance**: Real-time balance tracking in navbar
- **Smart Ownership**: Visual indicators for owned vs. created products

### 💰 **On-Chain Actions**

- **Create Products**: Add your content with USDC pricing (requires wallet)
- **Purchase Products**: Auto-batched approval + payment flow
- **Ownership Tracking**: "YOU ALREADY OWN THIS" prevention system
- **Transaction History**: Complete Etherscan integration

### 📊 **Marketplace Features**

- **Browse Products**: Search, filter, and smart priority sorting
- **Verification Filter**: Surface listings that require buyer verification
- **Explore Creators**: Creator profiles with revenue stats
- **Track Prices**: Complete price history and sales data
- **My Products**: Separate views for owned vs. created items

## 🏗️ Tech Stack

### **Frontend**

- **Next.js 15** with App Router and TypeScript
- **Privy** for wallet authentication and Web3 integration
- **Apollo Client v3** for GraphQL data management
- **Tailwind CSS** for responsive styling

### **Blockchain Integration**

- **USDC** (6 decimals) for payments on Base Sepolia testnet
- **ProductPaymentService** smart contract for marketplace logic
- **Envio GraphQL API** for real-time blockchain indexing
- **Viem** for contract interactions and transaction encoding

## 📱 Pages

- **`/`** - Product listing with smart ownership sorting
- **`/product/[id]`** - Product details with purchase functionality
- **`/creators`** - All creators with revenue statistics
- **`/creator/[address]`** - Individual creator profiles and sales
- **`/my-products`** - Personal dashboard (owned + created products)
- **`/create`** - Product creation form (wallet required)

## 🔧 Environment Setup

Create `.env.local`:

```bash
# GraphQL endpoint for blockchain data
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://indexer.dev.hyperindex.xyz/1f84b17/v1/graphql

# Blockchain explorer for transaction links
NEXT_PUBLIC_BASESCAN_EXPLORER=https://sepolia.basescan.org

# Privy app ID for wallet authentication
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Base Sepolia RPC endpoint
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### 🔑 **Required Setup:**

1. **[Get Privy App ID](https://privy.io)** - For wallet authentication
2. **[Get Alchemy API Key](https://alchemy.com)** - For reliable RPC (recommended)
3. **Connect to Base Sepolia** - Make sure your wallet has Base Sepolia ETH for gas

## 🎯 **Live Contract Integration**

The marketplace is now **fully connected** to the Base Sepolia testnet:

- **Contract**: `0x9d0948391f7e84fcac40b8e792a406ac7c4d591f` ([View on BaseScan](https://sepolia.basescan.org/address/0x9d0948391f7e84fcac40b8e792a406ac7c4d591f))
- **Token**: USDC on Base Sepolia (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`)
- **Real-time sync**: All transactions appear instantly in the UI
- **Gas optimized**: Proper gas estimation prevents failed transactions

## 🔗 Related

- [Smart Contracts](../onchain-payments/) - USDC payment processing
- [Envio Indexer](../envio-indexer/) - Real-time blockchain indexing

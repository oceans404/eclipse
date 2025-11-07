# 🌒 Eclipse Marketplace

A fully functional Web3 marketplace for private data with integrated wallet connectivity, PYUSD payments, and real-time blockchain data.

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

- **Connect with Privy**: Email-based authentication + Sepolia wallet support
- **PYUSD Balance**: Real-time balance tracking in navbar
- **Smart Ownership**: Visual indicators for owned vs. created products

### 💰 **On-Chain Actions**

- **Create Products**: Add your content with PYUSD pricing (requires wallet)
- **Purchase Products**: Auto-batched approval + payment flow
- **Ownership Tracking**: "YOU ALREADY OWN THIS" prevention system
- **Transaction History**: Complete Etherscan integration

### 📊 **Marketplace Features**

- **Browse Products**: Search, filter, and smart priority sorting
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

- **PYUSD** (6 decimals) for payments on Sepolia testnet
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
NEXT_PUBLIC_SEPOLIA_EXPLORER=https://sepolia.etherscan.io

# Privy app ID for wallet authentication
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Alchemy RPC endpoint for Sepolia transactions
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key
```

### 🔑 **Required Setup:**

1. **[Get Privy App ID](https://privy.io)** - For wallet authentication
2. **[Get Alchemy API Key](https://alchemy.com)** - For reliable RPC (recommended)
3. **Connect to Sepolia** - Make sure your wallet has Sepolia ETH for gas

## 🎯 **Live Contract Integration**

The marketplace is now **fully connected** to the Sepolia blockchain:

- **Contract**: `0x9c91a92cf1cd0b94fb632292fe63ed966833518d` ([View on Etherscan](https://sepolia.etherscan.io/address/0x9c91a92cf1cd0b94fb632292fe63ed966833518d))
- **Token**: PYUSD on Sepolia (`0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9`)
- **Real-time sync**: All transactions appear instantly in the UI
- **Gas optimized**: Proper gas estimation prevents failed transactions

## 🔗 Related

- [Smart Contracts](../onchain-payments/) - PYUSD payment processing
- [Envio Indexer](../envio-indexer/) - Real-time blockchain indexing

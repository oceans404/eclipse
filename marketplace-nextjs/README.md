# 🌒 Eclipse Marketplace

Browse products, creators, and transaction history powered by real-time blockchain data.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:4269](http://localhost:4269) to explore the marketplace.

## ✨ What You Can Do

- **Browse Products**: View all products with search and sorting
- **Explore Creators**: See creator profiles and their product portfolios
- **Track Prices**: View complete price history for each product
- **See Transactions**: Browse sales with direct Etherscan links
- **Real-time Data**: All data synced live from Sepolia blockchain

## 🏗️ Tech Stack

- **Next.js 15** with App Router and TypeScript
- **Apollo Client v3** for GraphQL data management
- **Tailwind CSS** for styling
- **Envio GraphQL API** for blockchain data

## 📱 Pages

- **`/`** - Product listing with search and filters
- **`/product/[id]`** - Product details with price history
- **`/creators`** - All creators with stats
- **`/creator/[address]`** - Individual creator profiles

## 🔧 Environment Setup

Create `.env.local`:

```bash
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://indexer.dev.hyperindex.xyz/30b0185/v1/graphql
NEXT_PUBLIC_SEPOLIA_EXPLORER=https://sepolia.etherscan.io
```

## 🚧 Coming Next

- **Wallet Connection**: Connect MetaMask to make purchases
- **Nillion Integration**: Private data storage and verification
- **Direct Payments**: Buy products directly through the UI

## 🔗 Related

- [Smart Contracts](../onchain-payments/) - PYUSD payment processing
- [Envio Indexer](../envio-indexer/) - Real-time blockchain indexing

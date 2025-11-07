# ProductPaymentService Indexer

[Envio HyperIndex indexer](https://docs.envio.dev/docs/HyperIndex/overview) for the ProductPaymentService contract on Base Sepolia testnet. See [ProductPaymentService contracts](../onchain-payments/)

## Live Deployment

🚀 **Hosted GraphQL API**: https://indexer.dev.hyperindex.xyz/0ae1800/v1/graphql

## Contract Info

- **ProductPaymentService Address**: `0x9d0948391f7e84fcac40b8e792a406ac7c4d591f`
- **Network**: Base Sepolia (Chain ID: 84532)
- **HyperSync**: Enabled

## Features

### Dual Entity System

The indexer maintains two types of entities:

1. **Event Entities** - Historical records of blockchain events:

   - `ProductPaymentService_ProductAdded` - Product creation events
   - `ProductPaymentService_ProductUpdated` - Price change events
   - `ProductPaymentService_PaymentReceived` - Payment events with transaction tracking

2. **Product Entity** - Current state tracking:
   - Always shows current price (auto-updated on price changes)
   - Tracks creator, content ID, timestamps, and update count
   - Perfect for frontend applications needing current product data

### Transaction Tracking

Payment events include full transaction metadata:

- **Transaction Hash** - Direct links to blockchain transactions
- **Block Number** - Block-level tracking
- **Block Timestamp** - Precise transaction timing
- **Payer Address** - Buyer identification

This enables:

- Direct Etherscan transaction links
- Accurate chronological ordering
- Real-time transaction verification
- Enhanced user experience with blockchain transparency

### GraphQL API

Query examples and comprehensive documentation: [GraphQLQueries.md](./GraphQLQueries.md)

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate types
pnpm codegen

# Start local indexer (requires Docker)
pnpm dev
```

Access the local GraphQL API at: http://localhost:8080/console (password: `testing`)

## Deployment

```bash
# Deploy to Envio hosted service
pnpm envio deploy
```

## Project Structure

- `config.yaml` - Indexer configuration
- `schema.graphql` - GraphQL schema definition
- `src/EventHandlers.ts` - Event processing logic
- `generated/` - Auto-generated types (don't edit)

## Resources

- [Envio Docs](https://docs.envio.dev)
- [Setup Guide](./SetupGuide.md)

# ProductPaymentService Indexer

[Envio HyperIndex indexer](https://docs.envio.dev/docs/HyperIndex/overview) for the ProductPaymentService contract on Ethereum Sepolia testnet. See [ProductPaymentService contracts](../onchain-payments/)

## Contract Info

- **ProductPaymentService Address**: `0x9c91a92cf1cd0b94fb632292fe63ed966833518d`
- **Network**: Sepolia (Chain ID: 11155111)
- **HyperSync**: Enabled

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate types
pnpm codegen

# Start local indexer (requires Docker)
pnpm dev
```

Access the GraphQL API at: http://localhost:8080/console (password: `testing`)

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

# 🌒 Eclipse

Eclipse is a private data marketplace—a private AI agent answers your questions about encrypted content so you buy with confidence.

## The Problem

Today, buying private data requires blind trust in the seller. As a buyer, you can't verify what you're getting without seeing it, and sellers can't prove their data's value without giving it away for free.

Eclipse solves this with a private AI agent that has access to the encrypted content. Buyers can ask the agent questions about the data or request it to verify that the content matches the creator's title and description—all before committing to purchase. This bridges the gap between "I can't see it" and "I know what I'm getting."

## MVP

### User Flow

- A creator can upload a private image, title, description, and set a price in PYUSD
  - After the image is uploaded, a private AI agent is granted access to the image
- Users can ask the private AI agent questions about the image to make an informed decision on whether to buy the image
- Users can pay to unlock the content

### Payments

- A smart contract tracks PYUSD payments per product id
- Envio indexes payment events
- A verifiable compute service grants access to content after successful payment events

### Tech Stack

- [PYUSD](https://ethglobal.com/events/ethonline2025/prizes#paypal-usd) for stable, digital payments
  - [PYUSD on ETH Sepolia](https://sepolia.etherscan.io/token/0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9)
- [Hardhat 3](https://ethglobal.com/events/ethonline2025/prizes#hardhat) for local smart contract development + testing
- [Envio](https://ethglobal.com/events/ethonline2025/prizes#envio) HyperIndex or HyperSync for optimized indexing of emitted payment events
- [Nillion Private Storage](https://docs.nillion.com/build/private-storage/overview) (nilDB) for private image storage
- [Nillion Private LLMs](https://docs.nillion.com/build/private-llms/overview) (nilAI) for private image analysis (multimodal image + text prompt)
- [Nillion Private Compute](https://docs.nillion.com/build/compute/overview) (nilCC) for verifiably granting data access via [Nillion nuc](https://docs.nillion.com/build/private-storage/overview#nuc-tokens) (JWTs) for data permissioning upon payment

## Project Structure

### 📦 [onchain-payments/](./onchain-payments/)

Smart contract infrastructure for marketplace payments using PYUSD.

- **ProductPaymentService.sol**: Core marketplace contract with direct creator payments
- **Comprehensive testing**: Solidity unit tests + TypeScript integration tests
- **Deployment scripts**: Deploy and interact with contracts on Sepolia testnet
- **Live on Sepolia**: [0x9c91a92cf1cd0b94fb632292fe63ed966833518d](https://sepolia.etherscan.io/address/0x9c91a92cf1cd0b94fb632292fe63ed966833518d#code)

### 🔍 [envio-indexer/](./envio-indexer/)

Event indexing service for real-time marketplace data.

- **Live GraphQL API**: https://indexer.dev.hyperindex.xyz/30b0185/v1/graphql
- **Dual Entity System**: Tracks both historical events and current product state
- **HyperSync enabled**: Fast historical data synchronization
- **Real-time indexing**: Live event tracking from ProductPaymentService contract

### 🌐 [marketplace-nextjs/](./marketplace-nextjs/)

Eclipse marketplace frontend built with Next.js 15.

- **Live Demo**: http://localhost:4269 (when running locally)
- **Product Discovery**: Browse products with search, filtering, and sorting
- **Creator Profiles**: View creator statistics and product portfolios
- **Transaction Tracking**: Complete price history and Etherscan links
- **Real-time Data**: Apollo Client synced with Envio GraphQL API

---

_Built for [EthOnline 2025](https://ethglobal.com/events/ethonline2025)_

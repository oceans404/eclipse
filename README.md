# 🌒 Eclipse

**Verify before you buy. Protect until you sell.**

Eclipse is a private data marketplace where an AI agent analyzes encrypted content to answer buyer questions—creators don't leak their work until they get paid.

- **Live Demo**: https://eclipse-pm.vercel.app
- **EthGlobal Showcase**: https://ethglobal.com/showcase/eclipse-n93ec

## The Problem

**Buyers can't verify.** You want to know if a dataset has the right format, if a meal plan works for vegetarians, if a tutorial matches your skill level—but you can't see the content until after you pay.

**Creators can't scale.** Every buyer has different questions. You answer DMs endlessly, try to predict FAQs, and still miss edge cases. Sleep through a notification? Lose the sale. Give away too much detail? Also lose the sale.

## The Solution

<img width="1172" height="843" alt="Eclipse Marketplace Interface" src="https://github.com/user-attachments/assets/f352b572-af7c-45dc-82f5-891efe0b911d" />

Eclipse runs **Google Gemini 2.0 Flash inside Nillion's Trusted Execution Environment (nilCC)** to access encrypted content and answer buyer questions in real-time.

- **For Buyers:** Ask the AI anything. Get real answers before you commit. "Is this vegetarian?" "Does this include coordinates?" "What skill level?"
- **For Creators:** Upload once. The AI handles unlimited buyer questions automatically. Zero customer support.
- **For Trust:** Content stays encrypted everywhere except in the TEE's memory during analysis. Payment verified on-chain via Envio before download access.

No previews. No leaks. No blind purchases.

## How It Works

1. **Creator uploads** → Content encrypted with AES-256-GCM, stored in Vercel Blob + Nillion nilDB
2. **Buyer asks questions** → Gemini 2.0 decrypts content in TEE memory, answers with privacy guardrails
3. **Buyer pays in PYUSD** → Smart contract payment indexed by Envio
4. **Instant access** → TEE verifies payment, grants download

## Tech Stack

- **[PYUSD](https://github.com/oceans404/eclipse/blob/main/onchain-payments/scripts/deploy.ts#L28)** - Stablecoin payments for predictable pricing
- **[Hardhat 3](https://hardhat.org/docs/getting-started)** - Smart contract development + comprehensive testing
  - [ProductPaymentService.sol](https://github.com/oceans404/eclipse/blob/main/onchain-payments/contracts/ProductPaymentService.sol) - Core payment contract
  - [TypeScript Tests](https://github.com/oceans404/eclipse/blob/main/onchain-payments/test/ProductPaymentService.ts) - End-to-end integration
  - [Solidity Tests](https://github.com/oceans404/eclipse/blob/main/onchain-payments/contracts/ProductPaymentService.t.sol) - Unit testing
- **[Envio HyperIndex](https://docs.envio.dev/docs/HyperIndex/overview)** - Real-time event indexing with [GraphQL API](https://github.com/oceans404/eclipse/blob/main/envio-indexer/GraphQLQueries.md)
- **[Nillion nilDB](https://docs.nillion.com/build/private-storage/overview)** - Private storage for encrypted metadata
- **[Nillion nilCC](https://docs.nillion.com/build/compute/overview)** - TEE running the agent for private multimodal analysis over the private content

## Project Structure

### 📦 [onchain-payments/](./onchain-payments/)

Smart contract infrastructure for marketplace payments using PYUSD.

- **[ProductPaymentService.sol](https://github.com/oceans404/eclipse/blob/main/onchain-payments/contracts/ProductPaymentService.sol)** - Core marketplace contract with direct creator payments
- **Comprehensive testing** - Solidity unit tests + TypeScript integration tests
- **Deployment scripts** - Deploy and interact with contracts on Sepolia testnet
- **Live on Sepolia** - [0x9c91a92cf1cd0b94fb632292fe63ed966833518d](https://sepolia.etherscan.io/address/0x9c91a92cf1cd0b94fb632292fe63ed966833518d#code)

### 🔍 [envio-indexer/](./envio-indexer/)

Event indexing service for real-time marketplace data.

- **Live GraphQL API** - https://indexer.dev.hyperindex.xyz/1f84b17/v1/graphql
- **Dual Entity System** - Tracks both historical events and current product state
- **HyperSync enabled** - Fast historical data synchronization
- **Real-time indexing** - Live event tracking from [ProductPaymentService.sol](https://github.com/oceans404/eclipse/blob/main/onchain-payments/contracts/ProductPaymentService.sol)

### 🌐 [marketplace-nextjs/](./marketplace-nextjs/)

Eclipse marketplace frontend built with Next.js 15.

- **Live Demo** - https://eclipse-pm.vercel.app
- **Product Discovery** - Browse with search, filtering, and sorting
- **Creator Profiles** - View statistics and product portfolios
- **Transaction Tracking** - Complete price history and Etherscan links
- **Real-time Data** - Apollo Client synced with Envio GraphQL API

### 🔐 [tee-storage-and-agent/](./tee-storage-and-agent/)

TEE-based storage and AI agent service running in Nillion's nilCC infrastructure.

- **Live nilCC Service** - https://2e08d150-6083-49aa-99e3-2b786e51fb2f.workloads.nilcc.sandbox.nillion.network/health
- **AES-256-GCM encryption** - Secure content encryption with master key protection
- **Nillion nilDB integration** - Encrypted metadata and key storage
- **Google Gemini 2.0 Flash** - Multimodal content analysis (text + images)
- **Privacy guardrails** - Prevents content leakage during AI interactions
- **Payment verification** - Blockchain integration via Envio before granting access
- **nilCC compliant** - Runs in Nillion's trusted execution environment

---

_Built for [EthOnline 2025](https://ethglobal.com/events/ethonline2025)_

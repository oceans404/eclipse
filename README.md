# 🌒 Eclipse

**Verify before you buy. Protect until you sell.**

Eclipse is a private data marketplace where an AI agent analyzes encrypted content to answer buyer questions—creators don't leak their work until they get paid.

- Demo: https://eclipse-pm.vercel.app

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
3. **Buyer pays in USDC (Base Sepolia)** → Smart contract payment indexed by Envio
4. **Instant access** → TEE verifies payment, grants download

## Tech Stack

- **[USDC on Base Sepolia](https://github.com/oceans404/eclipse/blob/main/onchain-payments/scripts/deploy.ts#L28)** - Stablecoin payments for predictable pricing
- **[Envio HyperIndex](https://docs.envio.dev/docs/HyperIndex/overview)** - Real-time event indexing with [GraphQL API](https://github.com/oceans404/eclipse/blob/main/envio-indexer/GraphQLQueries.md)
- **[Nillion nilDB](https://docs.nillion.com/build/private-storage/overview)** - Private storage for encrypted metadata
- **[Nillion nilCC](https://docs.nillion.com/build/compute/overview)** - TEE running the agent for private multimodal analysis over the private content

## Project Structure

### 📦 [onchain-payments/](./onchain-payments/)

Smart contract infrastructure for marketplace payments using USDC on Base Sepolia and verification allowlist.

### 🔍 [envio-indexer/](./envio-indexer/)

Event indexing service for real-time marketplace data.

### 🌐 [marketplace-nextjs/](./marketplace-nextjs/)

Eclipse marketplace frontend built with Next.js 15.

### 🔐 [tee-storage-and-agent/](./tee-storage-and-agent/)

TEE-based storage and AI agent service running in Nillion's nilCC infrastructure.

---

[EthOnline 2025 Showcase](https://ethglobal.com/showcase/eclipse-n93ec)

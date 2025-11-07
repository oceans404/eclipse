# Eclipse TEE Storage and Agent

TEE (nilCC) service that encrypts creator files, stores metadata in Nillion, runs AI previews, and enforces Base Sepolia purchases before decrypting content.

## What it does
1. `POST /encrypt-asset` – AES-256-GCM encrypt upload, write metadata to Nillion, upload encrypted blob to Vercel Blob.
2. `POST /chat-with-asset` – Decrypt in memory, run Google Gemini 2.0 Flash with guardrails, send paraphrased answer.
3. `POST /decrypt-for-download` – Check ProductPaymentService on Base Sepolia (creator bypass + purchaser check), stream decrypted bytes.
4. `POST /verified-list/add` – (admin) add a wallet + identifier to NilccVerifiedList.
5. `GET /asset-metadata/:contentId` – Return non-sensitive metadata.
6. `GET /health` (+ dev-only endpoints) – Operational checks.

## Project map
- `src/config.ts` – Validates env vars, exposes typed config.
- `src/service-context.ts` – Initializes Crypto, Nillion, AI, Blockchain services once and shares them with routes.
- `src/routes-*.ts` – Health, dev tools, assets, chat, decrypt, metadata routers.
- `src/utils.ts` – Shared helpers (contentId parsing & blob fetch).
- `src/crypto.ts`, `src/nillion.ts`, `src/ai.ts`, `src/blockchain.ts` – Service wrappers around the underlying systems.
- `src/index.ts` – Express bootstrap that wires everything together.

## Environment

```bash
MASTER_KEY=<64 hex chars>
NILLION_API_KEY=<nilDB builder key>
NILLION_COLLECTION_ID=<collection id>
GOOGLE_GENERATIVE_AI_API_KEY=<Gemini key>
RPC_URL=https://sepolia.base.org
PAYMENT_SERVICE_ADDRESS=0x9d0948391f7e84fcac40b8e792a406ac7c4d591f
BLOB_READ_WRITE_TOKEN=<Vercel Blob RW token>
VERIFIED_LIST_CONTRACT_ADDRESS=0x424a83804df6a77280847e9d20feb2766dc5fa60
VERIFIED_LIST_MANAGER_PRIVATE_KEY=0xabc... # wallet that owns verifier role
```

## Running locally

```bash
npm install
cp .env.example .env
npm run dev      # tsx watch
npm run build    # emits dist/index.js (esbuild bundle)
node dist/index.js
```

Use `FILES=. docker-compose up` (or the nilCC compose file) if you want to mimic the production deployment layout.

## Security basics
- Master key never leaves the container; wrapped AES keys live in Nillion.
- Decrypted buffers are zeroed immediately after use.
- Download route re-checks Base Sepolia purchases on every request.

That’s it—adjust the env vars, run `npm run dev`, and the service is ready to accept uploads, chats, and secure downloads.***

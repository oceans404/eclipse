# Eclipse Encryption Service - Technical Flow Documentation

## Overview

The encryption service provides privacy-preserving content storage and AI-powered verification for the Eclipse marketplace. It enables buyers to verify encrypted content through AI agents before purchase, without exposing the raw data.

## Architecture Components

### 1. **Core Services**

- **CryptoService**: Handles file encryption/decryption using AES-256-GCM
- **NillionService**: Manages encrypted metadata storage in Nillion's private database
- **AIService**: Processes content with Gemini 2.0 Flash while enforcing privacy guardrails
- **BlockchainService**: Verifies on-chain purchases for download authorization
- **Vercel Blob Storage**: Stores encrypted file content

### 2. **Technology Stack**

- Node.js + Express + TypeScript
- Google Gemini 2.0 Flash (via `@ai-sdk/google`)
- Nillion SDK for private storage
- Vercel Blob for encrypted file storage
- AES-256-GCM encryption

## Data Flow

### 1. **Content Upload & Encryption** (`/encrypt-asset`)

```
User uploads file → Encryption Service
                    ├─ Generate unique Asset ID
                    ├─ Encrypt file with AES-256-GCM
                    │   ├─ Generate encryption key
                    │   ├─ Wrap key with master key
                    │   └─ Produce: encrypted buffer, IV, auth tag
                    ├─ Store metadata in Nillion
                    │   └─ Including wrapped encryption key
                    └─ Upload encrypted file to Vercel Blob
                        └─ Update Nillion with blob URL
```

### 2. **AI Chat with Encrypted Content** (`/chat-with-asset`)

```
User sends chat request → Verify asset exists in Nillion
                         ├─ Fetch encrypted file from Blob URL
                         ├─ Decrypt in memory only
                         ├─ Process with Gemini 2.0 Flash
                         │   └─ Apply privacy guardrails
                         ├─ Clear decrypted buffer
                         └─ Return AI response
```

### 3. **Authorized Download** (`/decrypt-for-download`)

```
Buyer requests download → Verify on-chain purchase
                         ├─ Fetch asset metadata from Nillion
                         ├─ Retrieve encrypted file from Blob
                         ├─ Decrypt file
                         ├─ Update download analytics
                         └─ Stream decrypted file to buyer
```

## Privacy & Security Features

### Encryption Details

- **Algorithm**: AES-256-GCM (Authenticated Encryption)
- **Key Management**:
  - Each file has unique encryption key
  - Keys are wrapped with master key before storage
  - Wrapped keys stored in Nillion (private storage)
- **Data at Rest**: Always encrypted in Vercel Blob
- **Data in Transit**: Decrypted only in memory, immediately cleared

### AI Privacy Guardrails

The AI service enforces strict rules to prevent content leakage:

1. **System Prompt Restrictions**:

   - Never quote entire sections verbatim
   - Always summarize and paraphrase
   - Maximum 2-3 line excerpts only
   - Focus on analysis, not reproduction

2. **Content Validation**:

   - Post-processing check for verbatim content
   - Automatic rejection of responses containing large exact matches
   - Response length limited to 500 tokens

3. **Supported Content Types**:
   - **Text files** ✅ - All text/\* MIME types with full content analysis
   - **JSON files** ✅ - Treated as text with structured data understanding
   - **Images** ✅ - PNG, JPEG, WebP via Gemini 2.0 Flash multimodal (AI SDK v5)
   - **PDFs** ⚠️ - Files encrypt/store successfully; AI analysis uses metadata-only approach pending full PDF support in AI SDK v5

## API Endpoints

### Core Endpoints

1. **`POST /encrypt-asset`**

   - Encrypts and stores a new asset
   - Required: file, productId, owner, title
   - Returns: assetId, blobUrl

2. **`POST /chat-with-asset`**

   - AI chat with encrypted content
   - Required: contentId, userMessage
   - Returns: AI reply with privacy guardrails

3. **`POST /decrypt-for-download`**

   - Download decrypted file (requires purchase verification)
   - Required: contentId, requesterAddress
   - Returns: Decrypted file stream

4. **`GET /asset-metadata/:contentId`**
   - Get non-sensitive metadata
   - URL parameter must be URL-encoded
   - Returns: title, description, analytics, etc.

### Testing Endpoints

- **`GET /health`** - Service health check
- **`GET /test-nillion`** - Test Nillion connectivity
- **`GET /test-nillion-list`** - List all Nillion assets

## Example Usage

### 1. Encrypt a Document

```bash
curl -X POST http://localhost:3001/encrypt-asset \
  -F "file=@document.pdf" \
  -F "productId=prod-123" \
  -F "owner=0x742d35Cc6634C0532925a3b844Bc9e7595f2bD40" \
  -F "title=Research Paper" \
  -F "description=Confidential research findings"
```

**Response:**

```json
{
  "assetId": "081e2d3c-fad8-4843-ad41-d16453e5ec6d",
  "nillionCollectionId": "8d759f9e-3652-48ab-9faa-312c6707dd22",
  "nillionRecordId": "081e2d3c-fad8-4843-ad41-d16453e5ec6d",
  "blobUrl": "https://ozzuc6uvataclbf9.public.blob.vercel-storage.com/encrypted-assets/...",
  "success": true,
  "message": "File encrypted and uploaded successfully",
  "contentId": "nillion://8d759f9e-3652-48ab-9faa-312c6707dd22/081e2d3c-fad8-4843-ad41-d16453e5ec6d"
}
```

### 2. Chat with Encrypted Content

```bash
curl -X POST http://localhost:3001/chat-with-asset \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "nillion://8d759f9e-3652-48ab-9faa-312c6707dd22/081e2d3c-fad8-4843-ad41-d16453e5ec6d",
    "userMessage": "What are the main findings of this research?"
  }'
```

### 3. Download (After Purchase)

```bash
curl -X POST http://localhost:3001/decrypt-for-download \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "nillion://8d759f9e-3652-48ab-9faa-312c6707dd22/081e2d3c-fad8-4843-ad41-d16453e5ec6d",
    "requesterAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD40"
  }'
```

### 4. Get Asset Metadata

```bash
# Note: URL-encode the contentId when using in the path
curl http://localhost:3001/asset-metadata/nillion%3A%2F%2F8d759f9e-3652-48ab-9faa-312c6707dd22%2F081e2d3c-fad8-4843-ad41-d16453e5ec6d
```

## Data Schema (Nillion Storage)

```typescript
{
  _id: string;                    // Unique asset ID
  productId: string;              // Marketplace product ID
  owner: string;                  // Ethereum address
  title: string;                  // Display title
  description: string;            // Asset description
  blobUrl: string;                // Vercel Blob URL
  mimeType: string;               // File MIME type
  fileSize: number;               // Original file size
  encryption: {
    algorithm: string;            // "aes-256-gcm"
    wrappedKey: { '%allot': string }; // Nillion-encrypted key
    iv: string;                   // Initialization vector
    authTag: string;              // Authentication tag
    keyVersion: string;           // Key version ID
  };
  analytics: {
    totalChats: number;           // AI chat count
    totalDownloads: number;       // Download count
    lastAccessedAt: string;       // ISO timestamp
  };
  createdAt: string;              // ISO timestamp
  updatedAt: string;              // ISO timestamp
}
```

## Marketplace Integration Flow

### Complete Creator Flow

1. **Creator encrypts their content:**

   ```bash
   POST /encrypt-asset
   ```

   Returns critical identifiers:

   - `assetId`: Unique identifier for the encrypted asset
   - `nillionCollectionId`: The Nillion collection where metadata is stored
   - `nillionRecordId`: The specific record ID (same as assetId)
   - `contentId`: Pre-formatted URI for smart contract (`nillion://collection/record`)

2. **Creator adds product to smart contract:**

   ```javascript
   // Using the ProductPaymentService contract
   await contract.addProduct(
     12345, // productId (must match encryption)
     parseUnits('10', 6), // price in PYUSD (6 decimals)
     'nillion://8d759f9e-3652-48ab-9faa-312c6707dd22/081e2d3c-fad8-4843-ad41-d16453e5ec6d' // contentId from encryption
   );
   ```

3. **Linking is maintained through:**
   - The `productId` stored with the encrypted asset matches the on-chain product ID
   - The `contentId` in the smart contract points to the Nillion storage location
   - The encryption service automatically retrieves the productId from the asset metadata

**Note**: The productId is stored during encryption but doesn't need to be passed in API calls since it can be derived from the contentId. This simplifies the API and ensures consistency.

### Content ID Format

The `contentId` follows a URI scheme that enables future extensibility:

```
nillion://[collectionId]/[recordId]
```

Example:

```
nillion://8d759f9e-3652-48ab-9faa-312c6707dd22/081e2d3c-fad8-4843-ad41-d16453e5ec6d
```

This format:

- Clearly identifies the storage provider (Nillion)
- Includes the collection ID for namespace isolation
- Specifies the exact record within that collection
- Can be parsed by smart contracts or frontend applications

### Buyer Verification Flow

When a buyer purchases content on-chain and wants to access it:

1. **Smart contract emits purchase event** with:

   - Buyer address
   - Product ID
   - Content ID

2. **Frontend parses the content ID** to extract:

   - Collection ID: `8d759f9e-3652-48ab-9faa-312c6707dd22`
   - Record ID: `081e2d3c-fad8-4843-ad41-d16453e5ec6d`

3. **Encryption service verifies purchase** via:

   ```bash
   POST /decrypt-for-download
   {
     "contentId": "nillion://8d759f9e-3652-48ab-9faa-312c6707dd22/081e2d3c-fad8-4843-ad41-d16453e5ec6d",
     "requesterAddress": "0xBuyerAddress"
   }
   ```

4. **Service checks:**
   - Parses contentId to get asset from Nillion
   - Retrieves productId from the asset metadata
   - Verifies buyer has on-chain purchase record for that productId
   - Returns decrypted content if verified

## Security Considerations

1. **No Plaintext Storage**: Original files never stored unencrypted
2. **Memory Safety**: Decrypted buffers cleared immediately after use
3. **Access Control**: Downloads require blockchain purchase verification
4. **Key Isolation**: Encryption keys stored separately in Nillion
5. **AI Guardrails**: Prevents verbatim content reproduction
6. **Audit Trail**: Analytics track all access patterns

## Model Configuration

The service uses Google's Gemini 2.0 Flash model with AI SDK v5:

- Model ID: `gemini-2.0-flash` (AI SDK v5 format)
- Dependencies: `@ai-sdk/google@2.0.20` + `ai@^5.0.0`
- Temperature: 0.7
- Max tokens: 500
- Supports text and image inputs via multimodal API
- PDF support: Currently using metadata-only approach

This configuration provides fast, cost-effective AI processing while maintaining quality responses for content verification tasks.

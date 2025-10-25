# Eclipse TEE Storage and Agent

A secure TEE-based (nilCC) storage and AI agent service for Eclipse marketplace that handles file encryption, Nillion integration, and AI-powered content analysis.

## Overview

This service provides:
- 🔐 AES-256-GCM file encryption/decryption
- 🔑 Master key protection for wrapped keys
- 📦 Nillion Private Storage integration
- 🤖 AI-powered content analysis without exposing raw data
- ⛓️ On-chain access verification

## Architecture

The TEE storage and agent service runs in an isolated nilCC container and is the only component that:
- Has access to the master encryption key
- Can communicate with Nillion Private Storage
- Can decrypt files for AI processing
- Handles all cryptographic operations

## nilCC Compliance

This service is designed to be fully compatible with Nillion's nilCC infrastructure. We adhere to all [nilCC limitations](https://docs.nillion.com/build/compute/limitations).

### Key Compliance Points

1. **Volume Mounts**: All volumes use `${FILES}` prefix
2. **No Security Overrides**: No privileged mode, security_opt, or cap_add
3. **Standard Filesystems**: No tmpfs or custom filesystem drivers
4. **Default Networking**: Standard bridge networking only
5. **Node Image**: Uses standard `node:20` image (no custom builds)
6. **File Uploads**: Only specific files are uploaded (dist/index.js, package*.json)

### Deployment Options

#### Local Development
```bash
# Always set FILES=. for local development
FILES=. docker-compose up

# Or export it
export FILES=.
docker-compose up
```

#### nilCC Deployment
```bash
# FILES is set automatically by the platform
# Just use the nilCC-compliant compose file
docker-compose -f docker-compose.nilcc.yml up
```

### File Mounting Strategy

This project uses environment variable-based file mounting:

```yaml
volumes:
  - ${FILES}/package.json:/app/package.json
  - ${FILES}/src/index.ts:/app/src/index.ts
  - ${FILES}/temp:/app/temp
```

- **Local Development**: Set `FILES=.` to mount from current directory
- **nilCC Deployment**: Platform sets `FILES` automatically
- **Specific Files**: Only required files are mounted (not entire directories)
- **Read-Only**: Most files mounted as read-only for security

### Common Issues

#### "The FILES variable is not set"
```bash
# Always include FILES=. when running locally
FILES=. docker-compose up

# Or add to your .env file
echo "FILES=." >> .env
```

#### "Cannot find module"
- Ensure all required files are explicitly mounted in docker-compose.yml
- Check that FILES is set correctly
- Verify file paths match your local structure

## API Endpoints

### POST /encrypt-asset
Encrypts a file and stores metadata in Nillion.

### POST /chat-with-asset
Processes encrypted content with AI to provide safe responses.

### POST /decrypt-for-download
Decrypts and returns file for authorized users.

### GET /asset-metadata/:id
Returns basic metadata without sensitive information.

### GET /health
Service health check endpoint.

## Environment Variables

```bash
# Security
MASTER_KEY=<64-character hex string>

# Nillion
NILLION_API_KEY=<your API key>
NILLION_COLLECTION_ID=<pre-created collection ID>

# AI
OPENAI_API_KEY=<OpenAI API key>

# Blockchain
RPC_URL=<Ethereum RPC endpoint>
CONTRACT_ADDRESS=<ProductPaymentService address>
```

## Security Features

- Master key never leaves the container
- All file operations happen in memory
- Temporary files are cleaned up immediately
- No decrypted content is ever logged
- Network isolation from other services

## Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Run with Docker (recommended)
FILES=. docker-compose up

# Run without Docker (for debugging)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Build Docker image only
docker build -t eclipse-tee-storage-and-agent .
```

### Docker Commands

```bash
# Start services
FILES=. docker-compose up

# Start in background
FILES=. docker-compose up -d

# View logs
FILES=. docker-compose logs -f tee-storage-and-agent

# Stop services
FILES=. docker-compose down

# Rebuild after changes
FILES=. docker-compose up --build
```

## Production Deployment

### Building for Production

```bash
# 1. Install dependencies and generate lock file
npm install

# 2. Build TypeScript to single JavaScript file
npm run build

# 3. Ensure these files exist for nilCC upload:
#    - dist/index.js (bundled JavaScript)
#    - package.json
#    - package-lock.json

# 4. Test locally with production setup
FILES=. docker-compose -f docker-compose.nilcc.yml up
```

### Files Required for nilCC

When deploying to nilCC, you need exactly 3 files:

1. **`dist/index.js`** - Bundled JavaScript entry point (created by build)
2. **`package.json`** - Runtime dependencies only
3. **`package-lock.json`** - Lock file for reproducible installs

The service runs `npm ci --only=production` on startup to install dependencies.

### Build Process

The build uses esbuild to create a single bundled file:
- Bundles all local TypeScript modules
- Keeps external dependencies separate (installed via npm)
- Targets Node.js 20
- Output: `dist/index.js`

## Production Considerations

1. **Master Key Management**: Store securely, consider key rotation strategy
2. **Monitoring**: Set up logging without exposing sensitive data
3. **Backup**: Regular backups of Nillion collection data
4. **Rate Limiting**: Implement to prevent abuse
5. **Memory Management**: Monitor for large file processing
6. **Build Process**: Always compile TypeScript before deployment

## Troubleshooting

### Container won't start
- Check all required environment variables are set
- Verify master key is exactly 64 hex characters
- Ensure Nillion API key is valid

### File encryption fails
- Check file size limits
- Verify temporary volume has space
- Monitor memory usage for large files

### Nillion connection errors
- Verify API key and collection ID
- Check network connectivity
- Ensure builder profile is registered
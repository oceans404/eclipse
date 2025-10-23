# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eclipse is a private data marketplace built for EthOnline 2025 that enables buyers to verify encrypted content through AI agents before purchase. It leverages Nillion's privacy infrastructure (nilDB, nilAI, nilCC) and PYUSD for payments.

## Build Commands

**Smart Contracts** (navigate to onchain-payments directory):

```bash
cd onchain-payments

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
```

**Event Indexer** (navigate to envio-indexer directory):

```bash
cd envio-indexer

# Install dependencies
pnpm install

# Generate types and start local indexer
pnpm codegen && pnpm dev
```

**Next.js Marketplace** (navigate to marketplace-nextjs directory):

```bash
cd marketplace-nextjs

# Install dependencies
npm install

# Start development server
npm run dev
```

Access at http://localhost:4269

## Architecture Overview

The project uses a modular architecture:

1. **Smart Contracts** (`onchain-payments/contracts/`):

   - **ProductPaymentService.sol**: Core marketplace contract managing PYUSD payments
   - **MockERC20.sol**: Test token for development and testing
   - Direct creator payments with no platform fees
   - Integration with Nillion storage via contentId references
   - Uses Solidity 0.8.28 with Hardhat 3 Beta

2. **Testing Strategy**:

   - **Solidity Tests** (`contracts/ProductPaymentService.t.sol`): Foundry-based unit tests
   - **Integration Tests** (`test/ProductPaymentService.ts`): Node.js tests with Viem
   - Comprehensive coverage including multi-user scenarios and event testing

3. **Deployment & Scripts** (`onchain-payments/scripts/`):

   - **deploy.ts**: Deploy ProductPaymentService to Sepolia with PYUSD integration
   - **add-product.ts**: Create marketplace listings with Nillion content IDs
   - **buy-product.ts**: Purchase products using PYUSD payments
   - **update-product-price.ts**: Update product prices (creator-only)

4. **Constants & Configuration** (`onchain-payments/constants.ts`):

   - Chain IDs, token addresses, block explorer URLs
   - PYUSD Sepolia address: `0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9`
   - Sepolia chain ID: `11155111`

5. **Event Indexing** (`envio-indexer/`):

   - **Live GraphQL API**: https://indexer.dev.hyperindex.xyz/30b0185/v1/graphql
   - **Dual Entity System**: Historical events + current Product state tracking
   - **Event Handlers**: Process PaymentReceived, ProductAdded, and ProductUpdated events
   - **Smart State Management**: Product entity auto-updates with price changes

6. **Frontend Application** (`marketplace-nextjs/`):

   - **Eclipse marketplace frontend** built with Next.js 15 + TypeScript
   - **Apollo Client v3**: GraphQL data management with real-time syncing
   - **Product Discovery**: Search, filtering, and sorting functionality
   - **Creator Profiles**: Individual creator dashboards with analytics
   - **Transaction Tracking**: Complete price history and Etherscan links
   - **Responsive Design**: Tailwind CSS with modern UI components

7. **Privacy Layer Integration**:
   - Nillion Private Storage (nilDB) for encrypted data via contentId
   - Nillion Private LLMs (nilAI) for content verification
   - Nillion Private Compute (nilCC) for secure processing

## Key Technical Details

- **Type System**: ES modules enabled (`"type": "module"` in package.json)
- **TypeScript**: Strict mode with ES2022 target
- **Ethereum Library**: Viem for all blockchain interactions
- **Networks**: Configured for local forks of mainnet/Optimism and Sepolia testnet
- **Environment Variables**:
  - `SEPOLIA_RPC_URL`: RPC endpoint for Sepolia
  - `SEPOLIA_PRIVATE_KEY`: Deployment wallet private key
  - `BUYER_PRIVATE_KEY`: Second wallet for buyer interactions
  - `PAYMENT_SERVICE_ADDRESS`: Deployed contract address for interaction scripts

## Current Deployment

- **ProductPaymentService Contract**: `0x9c91a92cf1cd0b94fb632292fe63ed966833518d` (Sepolia)
- **Etherscan**: https://sepolia.etherscan.io/address/0x9c91a92cf1cd0b94fb632292fe63ed966833518d#code
- **Blockscout**: https://eth-sepolia.blockscout.com/address/0x9c91a92cf1cd0b94fb632292fe63ed966833518d?tab=contract
- **Payment Token**: PYUSD at `0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9`

## Development Notes

1. **Marketplace is fully implemented** with ProductPaymentService contract handling PYUSD payments
2. When adding new contracts, create corresponding:
   - Solidity test file (`.t.sol`) for unit tests
   - TypeScript test file in `test/` for integration tests
   - Deployment script in `scripts/`
3. Use Viem instead of ethers.js for all blockchain interactions
4. Follow existing patterns for async/await and ES module imports
5. **PYUSD Integration**: All prices use 6 decimal places (PYUSD standard)
6. **Nillion Integration**: Use contentId format like `"nillion://example-content"` for storage references

## Eclipse Design System

**IMPORTANT**: Eclipse has a sophisticated, premium design system that must be followed for all UI development. This design language was carefully crafted and implemented across the entire application.

### Design Principles

**Visual Identity**:
- **Brand Colors**: 
  - Primary: `#1a1a1a` (Deep charcoal)
  - Accent: `#D97757` (Warm terracotta/coral)
  - Background: `#fafaf8` (Warm off-white)
  - Text: `#666` (Medium gray) for secondary text
  - Borders: `#e0e0e0` (Light gray)
  - Tech sections: `#f5f5f3` (Subtle warm gray background)

**Typography**:
- **Primary Font**: `'Crimson Pro'` (serif) - Used for headings and body text
- **Secondary Font**: `'Inter'` (sans-serif) - Used for UI elements, labels, and interactive text
- **Font Weights**: Primarily 300 (light) and 400 (normal), with 500-600 for emphasis
- **Letter Spacing**: Negative spacing (`-0.02em`) for large headings, positive spacing (`0.15em`) for uppercase labels

**Layout & Spacing**:
- **Container**: `.container-eclipse` with max-width 1200px and 3rem horizontal padding
- **Sections**: Large vertical padding (10rem+) with 1px border separators
- **Grid Systems**: CSS Grid with auto-fit/auto-fill patterns for responsive layouts
- **Hover Effects**: Subtle border color changes to accent color with 200ms transitions

### UI Patterns

**Page Structure** (follows this exact pattern):
```
1. Header section (12rem top padding for nav clearance)
   - Small uppercase label (.hero-label style)
   - Large title (4-5rem font, 300 weight)
   - Descriptive subtitle (1.25rem, #666 color)
   - Border bottom separator

2. Content sections (6-10rem vertical padding)
   - Consistent border-bottom separators
   - Grid layouts for cards/content
   - Hover interactions on interactive elements

3. Cards/Components
   - 1px solid #e0e0e0 borders
   - Hover: border-color changes to #D97757
   - 200ms transition timing
   - 2-3rem internal padding
```

**Interactive Elements**:
- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-nav` classes defined in globals.css
- **Form Elements**: Consistent padding (0.875rem), border styling, focus states with accent color
- **Links**: Subtle hover effects, underline treatments for secondary actions
- **Loading States**: Spinning animations with accent color, consistent across all pages

**Responsive Design**:
- Mobile-first approach with specific breakpoints at 768px and 1024px
- Grid columns collapse to single column on smaller screens
- Typography scales down appropriately
- Maintains visual hierarchy and spacing proportions

### Implementation Guidelines

**When creating new pages/components**:

1. **Always start with the standard page structure**: Navbar + header section + content sections + proper padding
2. **Use inline styles for layout-specific properties** (the codebase uses inline styles extensively for precise control)
3. **Reference existing CSS classes** for buttons, typography, and common patterns
4. **Follow the spacing system**: Large sections (10rem), medium components (2-4rem), small details (0.5-1rem)
5. **Implement consistent hover states**: 200ms transitions, border-color changes to #D97757
6. **Use the proper fonts**: Crimson Pro for content, Inter for UI labels and interactive elements

**Color Usage**:
- Use `#D97757` sparingly for accents, calls-to-action, and hover states
- Maintain high contrast with `#1a1a1a` for primary text
- Use `#666` for secondary text and descriptions
- Keep backgrounds light with `#fafaf8` and `#f5f5f3` for subtle sections

**Loading & Error States**:
- Consistent spinner animation (see existing keyframes in components)
- Error states with bordered containers and Inter font
- Empty states with large emojis (4rem+ size, 0.2-0.3 opacity)
- Proper messaging hierarchy and action buttons

This design system creates a premium, cohesive experience that reflects Eclipse's sophisticated approach to private data marketplace technology. Every new component should feel like a natural extension of this established design language.

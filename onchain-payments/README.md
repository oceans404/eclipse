# Eclipse Onchain Payments

Smart contract infrastructure for Eclipse, a private data marketplace

## ProductPaymentService Contract

The core contract (`contracts/ProductPaymentService.sol`) manages one-time payments for digital products using a set ERC20 as the payment token.

- ProductPaymentService Sepolia Contract: https://sepolia.etherscan.io/address/0x9c91a92cf1cd0b94fb632292fe63ed966833518d#code
- Blockscout Verified Contract: https://eth-sepolia.blockscout.com/address/0x9c91a92cf1cd0b94fb632292fe63ed966833518d?tab=contract
- PYUSDC Sepolia token: https://sepolia.etherscan.io/token/0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9

### Key Features

- **Direct Creator Payments**: Payments flow directly from buyer to creator (no escrow or platform fees)
- **Payment Tracking**: Prevents double payments and tracks payment status per user/product
- **Storage Integration**: Ready for storage tracking via contentId
- **Gas Optimized**: Uses custom errors and efficient storage patterns

### Contract Structure

```solidity
struct Product {
    uint256 price;      // Price in tokens
    address creator;    // Content creator's ETH address
    string contentId;   // ID Reference to content in Nillion Private Storage
    bool exists;        // Whether this product exists
}
```

### Testing Suite

The project includes comprehensive dual-layer testing:

#### Solidity Unit Tests (`contracts/ProductPaymentService.t.sol`)

- Foundry-based unit tests for core functionality
- Tests product creation, payments, access control, and error conditions
- Uses `MockERC20.sol` for isolated testing

#### TypeScript Integration Tests (`test/ProductPaymentService.ts`)

- Integration tests using `node:test` and `viem`
- Tests complex multi-user scenarios, event emissions, and concurrent operations
- Validates real-world marketplace usage patterns

## Project Overview

This Hardhat 3 Beta project includes:

- **ProductPaymentService.sol**: Core marketplace payment contract
- **MockERC20.sol**: Test token for development and testing
- Foundry-compatible Solidity unit tests
- TypeScript integration tests using [`node:test`](nodejs.org/api/test.html) and [`viem`](https://viem.sh/)
- Network configurations for Sepolia testnet and local development

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `node:test` tests:

```shell
npx hardhat test solidity
npx hardhat test nodejs
```

### Deploying to Sepolia

Deploy the ProductPaymentService contract to Sepolia testnet:

```shell
npx hardhat run scripts/deploy.ts --network sepolia
```

This will output deployment details

After deployment, verify the contract and check out the verified result on [Blockscout](./BlockscoutVerification.txt):

```shell
npx hardhat verify --network sepolia 0x9c91a92cf1cd0b94fb632292fe63ed966833518d "0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9"
```

### Interacting with Deployed Contract

Set the deployed contract address in your environment:

```shell
export PAYMENT_SERVICE_ADDRESS=0x9c91a92cf1cd0b94fb632292fe63ed966833518d
```

#### Add a Product

Create a new product in the marketplace:

```shell
npx hardhat run scripts/add-product.ts --network sepolia
```

This script adds a product with ID 1, price 10 PYUSD, and Nillion content ID.

#### Buy a Product

Purchase a product using PYUSD:

```shell
npx hardhat run scripts/buy-product.ts --network sepolia
```

This script purchases product ID 1, handles PYUSD approval, and completes the payment to the creator.

#### Update Product Price

Update the price of an existing product (creator only):

```shell
npx hardhat run scripts/update-product-price.ts --network sepolia
```

This script updates product ID 1's price to 1 PYUSD. Only the product creator can execute this.

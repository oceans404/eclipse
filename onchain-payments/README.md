# Eclipse Onchain Payments

Smart contract infrastructure for Eclipse, a private data marketplace

## Contracts

- **NilccVerifiedList (`contracts/NilccVerifiedList.sol`)** — append-only registry of wallets that cleared a NilCC workload off-chain. Owners appoint managers, and managers map each verified wallet to a unique identifier for downstream checks.
- **ProductPaymentService (`contracts/ProductPaymentService.sol`)** — manages one-time, token-denominated purchases for digital products. Creators can require that a product may only be purchased by wallets already present on NilccVerifiedList.

**Primary network target:** Base Sepolia (Chain ID `84532`)

- RPC URL: `https://sepolia.base.org`
- Explorer: https://sepolia.basescan.org
- USDC (Base Sepolia): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- NilccVerifiedList (current deployment): [`0x424a83804df6a77280847e9d20feb2766dc5fa60`](https://sepolia.basescan.org/address/0x424a83804df6a77280847e9d20feb2766dc5fa60#code)
  - Owner: `0x3a8f416b53164e6b73b298a1b58fef5338954066`
  - Initial Manager: `0x55b9d16d93544cdccfe54bdbcf4eed7cefac1ed0`
- ProductPaymentService: [`0xacec86a66312c15fbc7a045664923cdfdd4e1c60`](https://sepolia.basescan.org/address/0xacec86a66312c15fbc7a045664923cdfdd4e1c60#code)

### ProductPaymentService Highlights

- **Direct Creator Payments**: Payments flow directly from buyer to creator (no escrow or platform fees)
- **Payment Tracking**: Prevents double payments and tracks payment status per user/product
- **Nilcc Verification Toggle**: Each product can opt-in to NilccVerifiedList membership checks
- **Storage Integration**: Ready for content pointers (e.g., Nillion storage)
- **Gas Optimized**: Custom errors and compact structs

```solidity
struct Product {
    uint256 price;
    address creator;
    string contentId;
    bool mustBeVerified;
    bool exists;
}
```

### Testing Suite

The project includes comprehensive dual-layer testing:

#### Solidity Unit Tests

- `contracts/ProductPaymentService.t.sol` covers product creation, payment flow, verification gating, and double-spend prevention with mocked ERC20 & verified list contracts.
- `contracts/ProductPaymentService.t.sol::test_VerifiedBuyerCanPurchaseMultipleRestrictedProducts` and related cases ensure state stays consistent as verification status changes.

#### TypeScript Integration Tests

- `test/ProductPaymentService.ts` drives Hardhat/viem deployments, multi-wallet purchases, event queries, and verification edge cases (restricted vs open products).
- `test/NilccVerifiedList.ts` validates ownership transfer, manager controls, and append-only verification semantics.

## Project Overview

This Hardhat 3 Beta project includes:

- **ProductPaymentService.sol** — Core marketplace payment contract
- **NilccVerifiedList.sol** — Workload-facing verification registry
- **MockERC20.sol** — Test token for development and testing
- Foundry-compatible Solidity unit tests
- TypeScript integration tests using [`node:test`](nodejs.org/api/test.html) and [`viem`](https://viem.sh/)
- Network configurations for Base Sepolia plus local development profiles

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

### Deployment Guide

Run through the steps below in order:

1. **Deploy NilccVerifiedList (if you don’t already have one).** Either run the bundled script (recommended) or deploy manually.

   _Scripted deployment with automatic manager grant (already used to deploy `0x424a…` shown above):_

   ```shell
   export NILCC_VERIFIED_LIST_MANAGER=0x55b9d16d93544cdccfe54bdbcf4eed7cefac1ed0
   npx hardhat run scripts/deploy-verified-list.ts --network baseSepolia
   ```

   _Optional: verify NilccVerifiedList on BaseScan_

   ```shell
   npx hardhat verify --network baseSepolia 0x424a83804df6a77280847e9d20feb2766dc5fa60
   ```

2. **Add initial managers.** Only the owner can add managers who will append verified wallets:

   ```shell
   cast send <VerifiedListAddress> "addManager(address)" <manager-address> --private-key <owner-key>
   ```

3. **Configure environment variables.**

   ```shell
   export NILCC_VERIFIED_LIST_ADDRESS=0xYourNilccVerifiedListAddress
   export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   export BASE_SEPOLIA_PRIVATE_KEY=0xYourDeployerPrivateKey
   ```

4. **Deploy ProductPaymentService referencing the verified list.**

   ```shell
   npx hardhat run scripts/deploy.ts --network baseSepolia
   ```

5. **Verify the ProductPaymentService deployment (optional but recommended).**

   ```shell
   npx hardhat verify --network baseSepolia \
     <ProductPaymentServiceAddress> \
     0x036CbD53842c5426634e7929541eC2318f3dCF7e \
     "$NILCC_VERIFIED_LIST_ADDRESS"
   ```

6. **Publish Nilcc verification entries as workflows complete.**

   ```shell
   cast send <VerifiedListAddress> \
     "addToVerifiedList(address,uint256)" <wallet> <identifier> \
     --private-key <manager-key>
   ```

7. **Use the provided scripts to add, update, and sell products (see next section).**

### Managing NilccVerifiedList

- Add a manager:

  ```shell
  export NILCC_VERIFIED_LIST_ADDRESS=0x424a83804df6a77280847e9d20feb2766dc5fa60
  export NILCC_VERIFIED_LIST_MANAGER=0xManagerToGrant
  npx hardhat run scripts/add-manager.ts --network baseSepolia
  ```

- Add a verified wallet (manager role required):

  ```shell
  export NILCC_VERIFIED_LIST_ADDRESS=0x424a83804df6a77280847e9d20feb2766dc5fa60
  export NILCC_VERIFIED_WALLET=0xVerifiedWalletToAdd
  export NILCC_VERIFIED_IDENTIFIER=12345
  npx hardhat run scripts/add-to-verified-list.ts --network baseSepolia
  ```

- Reuse the helper in other repos:

  ```ts
  import { addAddressToNilccVerifiedList } from 'onchain-payments/lib/addToVerifiedList.js';

  const uniqueIdentifier =
    '15535701803086811607459169505655338296775766844858246098982861081778465600787';

  await addAddressToNilccVerifiedList({
    contractAddress: '0x424a83804df6a77280847e9d20feb2766dc5fa60',
    verifiedWalletToAdd: '0xVerifiedWalletToAdd',
    identifier: BigInt(uniqueIdentifier),
    account: managerAccount,
    viem,
    publicClient,
  });
  ```

### Interacting with Deployed Contract

Set the deployed contract address (and optionally a default verification flag) in your environment:

```shell
export PAYMENT_SERVICE_ADDRESS=0xYourProductPaymentServiceAddress
export MUST_BE_VERIFIED=false
```

#### Add a Product

Create a new product in the marketplace:

```shell
npx hardhat run scripts/add-product.ts --network baseSepolia
```

This script adds a product with ID 1, price 10 USDC (Base), and Nillion content ID.
Set `MUST_BE_VERIFIED=true` before running if the product should enforce Nilcc verification.

#### Buy a Product

Purchase a product using Base USDC:

```shell
npx hardhat run scripts/buy-product.ts --network baseSepolia
```

This script purchases product ID 1, handles USDC approval, and completes the payment to the creator.
If the product requires verification, ensure the buyer wallet has been added to `NilccVerifiedList`.

#### Update Product Price

Update the price of an existing product (creator only):

```shell
npx hardhat run scripts/update-product-price.ts --network baseSepolia
```

This script updates product ID 1's price to 1 USDC. Only the product creator can execute this.

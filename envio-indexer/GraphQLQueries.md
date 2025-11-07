# GraphQL Query Guide

## Adding a Product Entity

Initially, the indexer only had **event entities** that logged blockchain events:

- `ProductPaymentService_ProductAdded` - Logs when products are added
- `ProductPaymentService_ProductUpdated` - Logs price changes
- `ProductPaymentService_PaymentReceived` - Logs payments

**The Problem:** Event entities only show historical snapshots. If you query `ProductPaymentService_ProductAdded`, you get the **original price**, not the current price after updates.

**The Solution:** A `Product` entity was added that automatically tracks the **current state** of each product. Now when querying `Product`, the result always shows the latest price, even after multiple updates.

**How it works:**

1. When `ProductAdded` event fires → Creates both the event record AND a `Product` entity
2. When `ProductUpdated` event fires → Updates the `Product` entity with the new price
3. The `Product` entity always reflects the current state

---

## Product Entity - Current Data Queries

Use the `Product` entity for most queries. It tracks:

- Current price (always up-to-date)
- Creator address
- Content ID
- `mustBeVerified` flag (whether a buyer must be on the verified list)
- Update count (how many times price changed)
- Timestamps

### Get All Products

```graphql
query AllProducts {
  Product {
    productId
    currentPrice
    creator
    contentId
    updateCount
  }
}
```

### Get Specific Product

```graphql
query GetProduct {
  Product(where: { productId: { _eq: "1" } }) {
    productId
    currentPrice
    creator
    contentId
  }
}
```

### Get Products by Creator

```graphql
query CreatorProducts {
  Product(
    where: { creator: { _eq: "0x55B9d16d93544CdcCfE54BdbcF4eED7CEFAc1Ed0" } }
  ) {
    productId
    currentPrice
    contentId
  }
}
```

### Get Most Expensive Products

```graphql
query MostExpensive {
  Product(order_by: { currentPrice: desc }, limit: 10) {
    productId
    currentPrice
    creator
  }
}
```

### Get Products in Price Range

```graphql
query PriceRange {
  Product(
    where: { currentPrice: { _gte: "1000000", _lte: "10000000000000000000" } }
    order_by: { currentPrice: desc }
  ) {
    productId
    currentPrice
    contentId
  }
}
```

### Search by Content ID

```graphql
query SearchContent {
  Product(where: { contentId: { _like: "%nillion%" } }) {
    productId
    currentPrice
    contentId
  }
}
```

### Get Products That Changed Price

```graphql
query UpdatedProducts {
  Product(where: { updateCount: { _gt: 0 } }, order_by: { updateCount: desc }) {
    productId
    currentPrice
    updateCount
    lastUpdatedAt
  }
}
```

### Filter by Verification Requirement

```graphql
query ProductsRequiringVerification {
  Product(where: { mustBeVerified: { _eq: true } }) {
    productId
    contentId
    creator
  }
}

query ProductsOpenToAll {
  Product(where: { mustBeVerified: { _eq: false } }) {
    productId
    contentId
    creator
  }
}
```

No additional configuration is required—`mustBeVerified` is indexed on every `Product` entity as it streams in from `ProductAdded` events, so standard GraphQL filters can segment verified-only vs open products.

### Product Statistics

```graphql
query ProductStats {
  Product_aggregate {
    aggregate {
      count
      avg {
        currentPrice
      }
      max {
        currentPrice
      }
      min {
        currentPrice
      }
    }
  }
}
```

### Paginated Products

```graphql
query PaginatedProducts {
  Product(limit: 10, offset: 0, order_by: { productId: desc }) {
    productId
    currentPrice
    creator
  }
}
```

---

## Payment Queries

### Get All Payments

```graphql
query AllPayments {
  ProductPaymentService_PaymentReceived {
    payer
    productId
    amount
    transactionHash
    blockNumber
    blockTimestamp
  }
}
```

### Payments for Specific Product

```graphql
query ProductPayments {
  ProductPaymentService_PaymentReceived(where: { productId: { _eq: "1" } }) {
    payer
    amount
    transactionHash
    blockTimestamp
  }
}
```

### Payments by User

```graphql
query UserPayments {
  ProductPaymentService_PaymentReceived(
    where: { payer: { _eq: "0xYourAddress" } }
  ) {
    productId
    amount
    transactionHash
    blockTimestamp
  }
}
```

### Total Revenue

```graphql
query TotalRevenue {
  ProductPaymentService_PaymentReceived_aggregate {
    aggregate {
      sum {
        amount
      }
      count
    }
  }
}
```

### Revenue Per Product

```graphql
query RevenuePerProduct {
  ProductPaymentService_PaymentReceived_aggregate(group_by: [productId]) {
    aggregate {
      sum {
        amount
      }
      count
    }
    keys
  }
}
```

### Top Payers

```graphql
query TopPayers {
  ProductPaymentService_PaymentReceived_aggregate(group_by: [payer]) {
    aggregate {
      sum {
        amount
      }
      count
    }
    keys
  }
}
```

---

## Transaction Tracking Queries

### Recent Payments with Full Transaction Data

```graphql
query RecentPaymentsWithTransactions {
  ProductPaymentService_PaymentReceived(
    limit: 10
    order_by: { blockTimestamp: desc }
  ) {
    id
    payer
    productId
    amount
    transactionHash
    blockNumber
    blockTimestamp
  }
}
```

### Payments with Etherscan Links

```graphql
query PaymentsForEtherscan {
  ProductPaymentService_PaymentReceived(where: { productId: { _eq: "1" } }) {
    transactionHash # Use for: https://sepolia.etherscan.io/tx/{transactionHash}
    payer # Use for: https://sepolia.etherscan.io/address/{payer}
    amount
    blockTimestamp # Convert: new Date(Number(blockTimestamp) * 1000)
  }
}
```

### Time-Based Payment Analysis

```graphql
query PaymentsByTimeRange {
  ProductPaymentService_PaymentReceived(
    where: {
      blockTimestamp: {
        _gte: "1761157000" # Unix timestamp
        _lte: "1761170000"
      }
    }
    order_by: { blockTimestamp: asc }
  ) {
    transactionHash
    payer
    productId
    amount
    blockTimestamp
  }
}
```

---

## Combined Queries

### Product with Payment Stats

```graphql
query ProductDashboard {
  product: Product(where: { productId: { _eq: "1" } }) {
    productId
    currentPrice
    creator
    updateCount
  }

  payments: ProductPaymentService_PaymentReceived_aggregate(
    where: { productId: { _eq: "1" } }
  ) {
    aggregate {
      sum {
        amount
      }
      count
    }
  }
}
```

### Creator Dashboard

```graphql
query CreatorDashboard {
  products: Product(
    where: { creator: { _eq: "0x55B9d16d93544CdcCfE54BdbcF4eED7CEFAc1Ed0" } }
  ) {
    productId
    currentPrice
    contentId
  }

  totalRevenue: ProductPaymentService_PaymentReceived_aggregate {
    aggregate {
      sum {
        amount
      }
      count
    }
  }
}
```

### Platform Overview

```graphql
query PlatformOverview {
  products: Product_aggregate {
    aggregate {
      count
    }
  }

  revenue: ProductPaymentService_PaymentReceived_aggregate {
    aggregate {
      sum {
        amount
      }
      count
    }
  }
}
```

### Best Selling Products

```graphql
query BestSellers {
  payments: ProductPaymentService_PaymentReceived_aggregate(
    group_by: [productId]
  ) {
    aggregate {
      count
      sum {
        amount
      }
    }
    keys
  }

  products: Product {
    productId
    currentPrice
    contentId
  }
}
```

---

## When to Use Event Entities

While `Product` is your main entity, event entities are useful for:

### Price History

```graphql
query PriceHistory {
  # Current price
  current: Product(where: { productId: { _eq: "1" } }) {
    currentPrice
  }

  # All historical price changes
  history: ProductPaymentService_ProductUpdated(
    where: { productId: { _eq: "1" } }
    order_by: { id: asc }
  ) {
    newPrice
  }
}
```

### Original Launch Price

```graphql
query OriginalPrice {
  ProductPaymentService_ProductAdded(where: { productId: { _eq: "1" } }) {
    price
  }
}
```

### Recent Activity

```graphql
query RecentActivity {
  newProducts: ProductPaymentService_ProductAdded(
    order_by: { id: desc }
    limit: 5
  ) {
    productId
    price
  }

  priceChanges: ProductPaymentService_ProductUpdated(
    order_by: { id: desc }
    limit: 5
  ) {
    productId
    newPrice
  }
}
```

---

## Quick Reference

### Common Operators

- `_eq` - Equal to
- `_gt` / `_gte` - Greater than / Greater than or equal
- `_lt` / `_lte` - Less than / Less than or equal
- `_like` - Pattern matching (use `%` as wildcard)
- `_in` - Value in array

### Ordering

```graphql
order_by: {field: desc}  # Descending
order_by: {field: asc}   # Ascending
```

### Pagination

```graphql
limit: 10    # Get 10 results
offset: 20   # Skip first 20
```

### Aggregations

```graphql
Product_aggregate {
  aggregate {
    count
    sum { field }
    avg { field }
    max { field }
    min { field }
  }
}
```

### Using Variables

```graphql
query GetProduct($productId: BigInt!) {
  Product(where: {productId: {_eq: $productId}}) {
    productId
    currentPrice
  }
}

# Variables
{
  "productId": "1"
}
```

---

## Tips

1. **Use `Product` for current state** - It's always up-to-date
2. **Use event entities for history** - When needing to see past changes
3. **Combine queries** - Get related data in one request
4. **Add pagination** - Use `limit` and `offset` for large datasets
5. **Use aggregations** - Get analytics like sums, counts, averages

---

## Transaction Field Configuration

To enable transaction hash and timestamp tracking, the indexer uses Envio's `field_selection` feature in `config.yaml`:

```yaml
field_selection:
  transaction_fields:
    - 'hash'
    - 'transactionIndex'
```

This configuration enables:

- `transactionHash` field in payment events
- `blockTimestamp` and `blockNumber` from block data
- Direct blockchain transaction references
- Enhanced frontend integration capabilities

**Required steps for transaction tracking:**

1. Add `field_selection` to `config.yaml`
2. Update schema with transaction fields
3. Modify event handlers to capture transaction data
4. Redeploy indexer to apply changes

---

**GraphQL endpoint:** https://indexer.dev.hyperindex.xyz/0ae1800/v1/graphql

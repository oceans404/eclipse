import { gql } from '@apollo/client';

export const GET_ALL_PRODUCTS = gql`
  query AllProducts {
    Product {
      id
      productId
      currentPrice
      creator
      contentId
      createdAt
      lastUpdatedAt
    }
  }
`;

export const GET_PRODUCT_DETAILS = gql`
  query ProductDetails($productId: numeric!) {
    Product(where: { productId: { _eq: $productId } }) {
      productId
      currentPrice
      creator
      contentId
      updateCount
      createdAt
      lastUpdatedAt
    }
    ProductPaymentService_PaymentReceived(
      where: { productId: { _eq: $productId } }
      order_by: { blockTimestamp: desc }
    ) {
      amount
      payer
      transactionHash
      blockTimestamp
    }
  }
`;

export const GET_PRODUCT_PAYMENTS = gql`
  query ProductPayments($productId: numeric!) {
    ProductPaymentService_PaymentReceived_aggregate(
      where: { productId: { _eq: $productId } }
    ) {
      aggregate {
        count
        sum {
          amount
        }
      }
    }
  }
`;

export const GET_RECENT_PAYMENTS = gql`
  query RecentPayments($productId: numeric!) {
    ProductPaymentService_PaymentReceived(
      where: { productId: { _eq: $productId } }
      order_by: { id: desc }
      limit: 10
    ) {
      payer
      amount
    }
  }
`;

export const GET_ALL_PAYMENTS = gql`
  query AllPayments($productId: numeric!) {
    ProductPaymentService_PaymentReceived(
      where: { productId: { _eq: $productId } }
    ) {
      amount
    }
  }
`;

export const GET_PRICE_HISTORY = gql`
  query PriceHistory($productId: numeric!) {
    added: ProductPaymentService_ProductAdded(
      where: { productId: { _eq: $productId } }
    ) {
      price
      blockTimestamp
      transactionHash
    }
    updates: ProductPaymentService_ProductUpdated(
      where: { productId: { _eq: $productId } }
      order_by: { blockTimestamp: asc }
    ) {
      newPrice
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_ALL_CREATORS = gql`
  query AllCreators {
    Product(distinct_on: creator) {
      creator
    }
  }
`;

export const GET_CREATOR_STATS = gql`
  query CreatorStats($creator: String!) {
    products: Product(where: { creator: { _eq: $creator } }) {
      productId
      currentPrice
      contentId
      updateCount
    }
  }
`;

export const GET_CREATOR_REVENUE = gql`
  query CreatorRevenue($productIds: [numeric!]!) {
    ProductPaymentService_PaymentReceived(
      where: { productId: { _in: $productIds } }
      order_by: { blockTimestamp: desc }
    ) {
      id
      amount
      productId
      payer
      transactionHash
      blockNumber
      blockTimestamp
    }
  }
`;

export const GET_PRODUCTS_BY_CREATOR = gql`
  query ProductsByCreator($creator: String!) {
    Product(where: { creator: { _eq: $creator } }) {
      productId
      currentPrice
      creator
      contentId
      updateCount
      createdAt
      lastUpdatedAt
    }
  }
`;

export const GET_CREATOR_PROFILE = gql`
  query CreatorProfile($creator: String!) {
    Product(where: { creator: { _eq: $creator } }) {
      id
      productId
      currentPrice
      creator
      contentId
      updateCount
      createdAt
      lastUpdatedAt
    }
  }
`;

export const GET_USER_OWNED_PRODUCTS = gql`
  query UserOwnedProducts($userAddress: String!) {
    ProductPaymentService_PaymentReceived(
      where: { payer: { _eq: $userAddress } }
      distinct_on: productId
    ) {
      productId
      amount
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_OWNED_PRODUCTS_WITH_DETAILS = gql`
  query OwnedProductsWithDetails($productIds: [numeric!]!) {
    Product(where: { productId: { _in: $productIds } }) {
      id
      productId
      currentPrice
      creator
      contentId
      createdAt
      lastUpdatedAt
    }
  }
`;
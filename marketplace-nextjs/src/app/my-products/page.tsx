'use client';

import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@apollo/client';
import { GET_USER_OWNED_PRODUCTS, GET_OWNED_PRODUCTS_WITH_DETAILS, GET_PRODUCTS_BY_CREATOR } from '@/lib/queries';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';

export default function MyProductsPage() {
  const { authenticated, user, login } = usePrivy();

  // First query: Get all products the user has purchased
  const { loading: loadingOwned, error: errorOwned, data: ownedData } = useQuery(
    GET_USER_OWNED_PRODUCTS,
    {
      variables: { userAddress: user?.wallet?.address },
      skip: !authenticated || !user?.wallet?.address,
    }
  );

  // Extract product IDs from owned products
  const ownedProductIds = ownedData?.ProductPaymentService_PaymentReceived?.map(
    (payment: any) => payment.productId
  ) || [];

  // Second query: Get full product details for owned products
  const { loading: loadingDetails, error: errorDetails, data: detailsData } = useQuery(
    GET_OWNED_PRODUCTS_WITH_DETAILS,
    {
      variables: { productIds: ownedProductIds },
      skip: ownedProductIds.length === 0,
    }
  );

  // Third query: Get products created by the user
  const { loading: loadingCreated, error: errorCreated, data: createdData } = useQuery(
    GET_PRODUCTS_BY_CREATOR,
    {
      variables: { creator: user?.wallet?.address },
      skip: !authenticated || !user?.wallet?.address,
    }
  );

  // Not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to view your purchased products
            </p>
            <button
              onClick={login}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors mr-3"
            >
              Connect Wallet
            </button>
            <Link
              href="/"
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors inline-block"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const loading = loadingOwned || loadingDetails || loadingCreated;
  const error = errorOwned || errorDetails || errorCreated;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-600 font-medium">Error loading your products</p>
          <p className="text-red-500 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const ownedProducts = detailsData?.Product || [];
  const createdProducts = createdData?.Product || [];

  // Create a map of purchase details for each product
  const purchaseDetailsMap = new Map();
  ownedData?.ProductPaymentService_PaymentReceived?.forEach((payment: any) => {
    purchaseDetailsMap.set(payment.productId, {
      amount: payment.amount,
      purchaseDate: payment.blockTimestamp,
      transactionHash: payment.transactionHash,
    });
  });

  const formatDate = (timestamp: string) => {
    return new Date(Number(timestamp) * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            📦 <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">My Products</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Products you've purchased and created on Eclipse marketplace
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Wallet</h2>
              <p className="text-gray-600 font-mono text-sm">
                {user?.wallet?.address}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Products Owned</p>
              <p className="text-3xl font-bold text-green-600">{ownedProducts.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Products Created</p>
              <p className="text-3xl font-bold text-blue-600">{createdProducts.length}</p>
            </div>
          </div>
        </div>

        {/* Owned Products Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <span>🛒</span>
              <span>Products I Own</span>
            </h2>
            {ownedProducts.length > 0 && (
              <span className="text-sm text-gray-500">
                {ownedProducts.length} product{ownedProducts.length !== 1 ? 's' : ''} • Sorted by purchase date
              </span>
            )}
          </div>

          {ownedProducts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products owned yet</h3>
              <p className="text-gray-600 mb-6">
                Start exploring the marketplace to purchase your first product!
              </p>
              <Link
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...ownedProducts]
                .sort((a: any, b: any) => {
                  const purchaseA = purchaseDetailsMap.get(a.productId);
                  const purchaseB = purchaseDetailsMap.get(b.productId);
                  return Number(purchaseB?.purchaseDate || 0) - Number(purchaseA?.purchaseDate || 0);
                })
                .map((product: any) => {
                  const purchaseDetails = purchaseDetailsMap.get(product.productId);
                  return (
                    <div key={product.productId} className="relative">
                      {/* Owned Badge */}
                      <div className="absolute top-4 right-4 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        OWNED
                      </div>
                      
                      <ProductCard
                        productId={product.productId}
                        contentId={product.contentId}
                        currentPrice={product.currentPrice}
                        creator={product.creator}
                      />
                      
                      {/* Purchase Info */}
                      {purchaseDetails && (
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-800 mb-2">Purchase Details</h4>
                          <div className="space-y-1 text-sm text-green-700">
                            <p>
                              <span className="font-medium">Purchased:</span>{' '}
                              {formatDate(purchaseDetails.purchaseDate)}
                            </p>
                            <a
                              href={`${process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER}/tx/${purchaseDetails.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-block"
                            >
                              View Transaction →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Created Products Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <span>✨</span>
              <span>Products I Created</span>
            </h2>
            {createdProducts.length > 0 && (
              <span className="text-sm text-gray-500">
                {createdProducts.length} product{createdProducts.length !== 1 ? 's' : ''} • Sorted by creation date
              </span>
            )}
          </div>

          {createdProducts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products created yet</h3>
              <p className="text-gray-600 mb-6">
                Ready to become a creator? Add your first product to the marketplace!
              </p>
              <Link
                href="/create"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
              >
                Create Product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...createdProducts]
                .sort((a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
                .map((product: any) => (
                  <div key={product.productId} className="relative">
                    {/* Creator Badge */}
                    <div className="absolute top-4 right-4 z-10 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      CREATOR
                    </div>
                    
                    <ProductCard
                      productId={product.productId}
                      contentId={product.contentId}
                      currentPrice={product.currentPrice}
                      creator={product.creator}
                    />
                    
                    {/* Creator Info */}
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Creation Details</h4>
                      <div className="space-y-1 text-sm text-blue-700">
                        <p>
                          <span className="font-medium">Created:</span>{' '}
                          {formatDate(product.createdAt)}
                        </p>
                        <p>
                          <span className="font-medium">Updates:</span>{' '}
                          {product.updateCount || 0} time{product.updateCount !== 1 ? 's' : ''}
                        </p>
                        <Link
                          href={`/product/${product.productId}`}
                          className="text-blue-600 hover:underline inline-block"
                        >
                          View Sales Data →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
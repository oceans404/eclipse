'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { usePrivy } from '@privy-io/react-auth';
import { GET_ALL_PRODUCTS, GET_USER_OWNED_PRODUCTS } from '@/lib/queries';
import { ProductCard } from '@/components/ProductCard';

export default function ProductsPage() {
  const [sortBy, setSortBy] = useState<'price' | 'newest' | 'oldest'>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const { authenticated, user } = usePrivy();
  
  const { loading, error, data } = useQuery(GET_ALL_PRODUCTS);
  
  // Get user's owned products to determine ownership
  const { data: ownedData } = useQuery(GET_USER_OWNED_PRODUCTS, {
    variables: { userAddress: user?.wallet?.address },
    skip: !authenticated || !user?.wallet?.address,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-600 font-medium">Error loading products</p>
          <p className="text-red-500 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const products = data?.Product || [];
  
  // Create sets for owned and created products for quick lookup
  const ownedProductIds = new Set(
    ownedData?.ProductPaymentService_PaymentReceived?.map((payment: any) => payment.productId) || []
  );
  const userAddress = user?.wallet?.address?.toLowerCase();
  
  const filteredProducts = products
    .filter((product: any) => 
      product.contentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.creator.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => {
      // First, determine ownership status for priority sorting
      const aIsCreated = authenticated && userAddress === a.creator.toLowerCase();
      const aIsOwned = ownedProductIds.has(a.productId);
      const aIsAvailable = !aIsCreated && !aIsOwned;
      
      const bIsCreated = authenticated && userAddress === b.creator.toLowerCase();
      const bIsOwned = ownedProductIds.has(b.productId);
      const bIsAvailable = !bIsCreated && !bIsOwned;
      
      // Priority order: Available > Owned > Created
      if (aIsAvailable && !bIsAvailable) return -1;
      if (!aIsAvailable && bIsAvailable) return 1;
      if (aIsOwned && bIsCreated) return -1;
      if (aIsCreated && bIsOwned) return 1;
      
      // If same ownership status, sort by user preference
      switch (sortBy) {
        case 'price':
          const priceA = BigInt(a.currentPrice || '0');
          const priceB = BigInt(b.currentPrice || '0');
          return priceA < priceB ? -1 : priceA > priceB ? 1 : 0;
        case 'newest':
          const timeA = BigInt(a.createdAt || '0');
          const timeB = BigInt(b.createdAt || '0');
          return timeB < timeA ? -1 : timeB > timeA ? 1 : 0;
        case 'oldest':
          const timeOldA = BigInt(a.createdAt || '0');
          const timeOldB = BigInt(b.createdAt || '0');
          return timeOldA < timeOldB ? -1 : timeOldA > timeOldB ? 1 : 0;
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🌒 <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Eclipse</span> Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover and purchase private data with AI verification powered by Nillion
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products or creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price">Price: Low to High</option>
            </select>
          </div>
        </div>

        {/* Ownership Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Product Status Legend:</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Created by you</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Owned by you</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">Available to purchase</span>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'Be the first to add a product!'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product: any) => (
                <ProductCard
                  key={product.productId}
                  productId={product.productId}
                  contentId={product.contentId}
                  currentPrice={product.currentPrice}
                  creator={product.creator}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

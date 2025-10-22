'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_PRODUCTS } from '@/lib/queries';
import { ProductCard } from '@/components/ProductCard';

export default function ProductsPage() {
  const [sortBy, setSortBy] = useState<'price' | 'newest' | 'oldest'>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { loading, error, data } = useQuery(GET_ALL_PRODUCTS);

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
  
  const filteredProducts = products
    .filter((product: any) => 
      product.contentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.creator.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => {
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

'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_CREATORS } from '@/lib/queries';
import { CreatorCard } from '@/components/CreatorCard';

export default function CreatorsPage() {
  const { loading, error, data } = useQuery(GET_ALL_CREATORS);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading creators...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-600 font-medium">Error loading creators</p>
          <p className="text-red-500 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const creators = data?.Product ? 
    [...new Set(data.Product.map((product: any) => product.creator))] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            👥 <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Creators</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Meet the talented creators powering Eclipse marketplace
          </p>
        </div>

        {creators.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No creators found</h3>
            <p className="text-gray-600">Be the first to create and sell content!</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {creators.length} creator{creators.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {creators.map((creator: string) => (
                <CreatorCard key={creator} creator={creator} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useHasPaid } from '@/hooks/useContract';
import { PriceDisplay } from './PriceDisplay';
import { AddressDisplay } from './AddressDisplay';

interface ProductCardProps {
  productId: string;
  contentId: string;
  currentPrice: string;
  creator: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  productId, 
  contentId, 
  currentPrice, 
  creator 
}) => {
  const router = useRouter();
  const { authenticated, user } = usePrivy();
  
  // Check if user owns this product
  const { data: hasPaid } = useHasPaid(user?.wallet?.address, Number(productId));
  
  // Check if user created this product
  const isCreator = authenticated && user?.wallet?.address?.toLowerCase() === creator.toLowerCase();

  const handleClick = () => {
    router.push(`/product/${productId}`);
  };

  return (
    <div 
      className={`bg-white border rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group relative ${
        isCreator 
          ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-25' 
          : hasPaid 
          ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-25' 
          : 'border-gray-100'
      }`}
      onClick={handleClick}
    >
      {/* Ownership Badges */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {isCreator && (
          <span className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full font-medium shadow-sm">
            CREATED BY YOU
          </span>
        )}
        {hasPaid && !isCreator && (
          <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-medium shadow-sm">
            OWNED
          </span>
        )}
      </div>

      <div className="flex justify-between items-start mb-4">
        <span className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full font-medium">
          #{productId}
        </span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-400">Click to view →</span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className={`w-full h-2 rounded-full mb-3 ${
          isCreator 
            ? 'bg-gradient-to-r from-blue-300 to-blue-500' 
            : hasPaid 
            ? 'bg-gradient-to-r from-green-300 to-green-500' 
            : 'bg-gradient-to-r from-gray-200 to-gray-300'
        }`}></div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900 break-all group-hover:text-blue-600 transition-colors">
          {contentId}
        </h3>
      </div>
      
      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600 mb-1">💰 Price</p>
        <PriceDisplay priceInPyusd={currentPrice} className="text-2xl text-gray-900 font-bold" />
      </div>
      
      <div className="pt-3 border-t border-gray-100">
        <p className="text-sm text-gray-600 mb-1">👤 Creator</p>
        <AddressDisplay 
          address={creator} 
          showCopy={false} 
          showExplorer={false}
          className="text-gray-700"
        />
      </div>
    </div>
  );
};
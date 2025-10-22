'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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

  const handleClick = () => {
    router.push(`/product/${productId}`);
  };

  return (
    <div 
      className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full font-medium">
          #{productId}
        </span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-400">Click to view →</span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="w-full h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full mb-3"></div>
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
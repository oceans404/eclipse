'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_CREATOR_STATS, GET_CREATOR_REVENUE } from '@/lib/queries';
import { AddressDisplay } from './AddressDisplay';
import { pyusdToFormatted } from '@/utils/formatting';

interface CreatorCardProps {
  creator: string;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {
  const router = useRouter();
  const { data: statsData } = useQuery(GET_CREATOR_STATS, {
    variables: { creator }
  });

  const products = statsData?.products || [];
  const productIds = products.map((p: any) => p.productId);

  const { data: revenueData } = useQuery(GET_CREATOR_REVENUE, {
    variables: { productIds },
    skip: productIds.length === 0
  });

  const handleClick = () => {
    router.push(`/creator/${creator}`);
  };

  const totalRevenue = revenueData?.ProductPaymentService_PaymentReceived?.reduce((sum: string, payment: any) => {
    return (BigInt(sum) + BigInt(payment.amount || '0')).toString();
  }, '0') || '0';

  return (
    <div 
      className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-3xl">👤</div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-400">View profile →</span>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Creator Address</p>
        <AddressDisplay 
          address={creator} 
          showCopy={false} 
          showExplorer={false}
          className="text-gray-900 font-medium"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-sm text-gray-600">Products</p>
          <p className="text-xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="text-lg font-bold text-gray-900">
            {pyusdToFormatted(totalRevenue)}
          </p>
          <p className="text-xs text-gray-500">PYUSD</p>
        </div>
      </div>
    </div>
  );
};
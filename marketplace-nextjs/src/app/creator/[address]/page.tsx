'use client';

import React, { use } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { GET_CREATOR_PROFILE, GET_CREATOR_REVENUE } from '@/lib/queries';
import { ProductCard } from '@/components/ProductCard';
import { AddressDisplay } from '@/components/AddressDisplay';
import { PriceDisplay } from '@/components/PriceDisplay';
import { pyusdToFormatted } from '@/utils/formatting';

interface CreatorPageProps {
  params: Promise<{
    address: string;
  }>;
}

export default function CreatorPage({ params }: CreatorPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { loading, error, data } = useQuery(GET_CREATOR_PROFILE, {
    variables: { creator: resolvedParams.address }
  });

  const products = data?.Product || [];
  const productIds = products.map((p: any) => p.productId);

  const { data: revenueData } = useQuery(GET_CREATOR_REVENUE, {
    variables: { productIds },
    skip: productIds.length === 0
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-600 font-medium">Error loading creator</p>
          <p className="text-red-500 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Creator not found</h3>
          <p className="text-gray-600 mb-6">This creator doesn't have any products yet.</p>
          <button
            onClick={() => router.push('/creators')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Creators
          </button>
        </div>
      </div>
    );
  }

  const totalSales = revenueData?.ProductPaymentService_PaymentReceived?.length || 0;
  const totalRevenue = revenueData?.ProductPaymentService_PaymentReceived?.reduce((sum: string, payment: any) => {
    return (BigInt(sum) + BigInt(payment.amount || '0')).toString();
  }, '0') || '0';

  // Remove debug logging
  console.log('Revenue data:', revenueData?.ProductPaymentService_PaymentReceived?.[0]);

  const averagePrice = products.length > 0 ? 
    products.reduce((sum: number, product: any) => sum + Number(product.currentPrice), 0) / products.length : 0;

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

  const oldestProduct = products.reduce((oldest: any, product: any) => 
    Number(product.createdAt) < Number(oldest.createdAt) ? product : oldest
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/creators')}
          className="mb-8 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Creators</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <h1 className="text-3xl font-bold">Creator Profile</h1>
                <AddressDisplay 
                  address={resolvedParams.address}
                  className="text-blue-100"
                  showCopy={true}
                  showExplorer={true}
                />
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-2xl p-6 text-center border border-blue-100">
                <Package size={24} className="mx-auto mb-3 text-blue-600" />
                <p className="text-2xl font-bold text-blue-900">{products.length}</p>
                <p className="text-sm text-blue-600">Products Created</p>
              </div>

              <div className="bg-green-50 rounded-2xl p-6 text-center border border-green-100">
                <DollarSign size={24} className="mx-auto mb-3 text-green-600" />
                <p className="text-2xl font-bold text-green-900">
                  {pyusdToFormatted(totalRevenue)}
                </p>
                <p className="text-sm text-green-600">Total Revenue (PYUSD)</p>
              </div>

              <div className="bg-purple-50 rounded-2xl p-6 text-center border border-purple-100">
                <TrendingUp size={24} className="mx-auto mb-3 text-purple-600" />
                <p className="text-2xl font-bold text-purple-900">{totalSales}</p>
                <p className="text-sm text-purple-600">Total Sales</p>
              </div>

              <div className="bg-orange-50 rounded-2xl p-6 text-center border border-orange-100">
                <Calendar size={24} className="mx-auto mb-3 text-orange-600" />
                <p className="text-lg font-bold text-orange-900">
                  {formatDate(oldestProduct.createdAt)}
                </p>
                <p className="text-sm text-orange-600">Member Since</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Products by this Creator</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map((product: any) => (
                    <ProductCard
                      key={product.id}
                      productId={product.productId}
                      contentId={product.contentId}
                      currentPrice={product.currentPrice}
                      creator={product.creator}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Creator Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Average Product Price</p>
                      <p className="text-xl font-bold text-gray-900">
                        {pyusdToFormatted(averagePrice.toString())} PYUSD
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenue per Sale</p>
                      <p className="text-xl font-bold text-gray-900">
                        {totalSales > 0 ? pyusdToFormatted((Number(totalRevenue) / totalSales).toString()) : '0.00'} PYUSD
                      </p>
                    </div>
                  </div>
                </div>

                {revenueData?.ProductPaymentService_PaymentReceived && revenueData.ProductPaymentService_PaymentReceived.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
                    <div className="space-y-3">
                      {revenueData.ProductPaymentService_PaymentReceived.slice(0, 5).map((payment: any, index: number) => (
                        <a
                          key={index}
                          href={`${process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER}/tx/${payment.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex justify-between items-center bg-white rounded-xl p-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Product #{payment.productId}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(payment.blockTimestamp)}
                            </p>
                            <p className="text-xs text-blue-600 group-hover:underline">
                              View transaction →
                            </p>
                          </div>
                          <PriceDisplay 
                            priceInPyusd={payment.amount} 
                            className="font-semibold text-gray-900"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
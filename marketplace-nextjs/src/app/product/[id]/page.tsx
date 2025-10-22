'use client';

import React, { use } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Package, User, DollarSign } from 'lucide-react';
import { GET_PRODUCT_DETAILS, GET_PRICE_HISTORY } from '@/lib/queries';
import { PriceDisplay } from '@/components/PriceDisplay';
import { AddressDisplay } from '@/components/AddressDisplay';
import { PurchaseButton } from '@/components/PurchaseButton';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const productId = Number(resolvedParams.id);

  const { loading, error, data } = useQuery(GET_PRODUCT_DETAILS, {
    variables: { productId },
    skip: isNaN(productId),
  });

  const { data: priceHistoryData } = useQuery(GET_PRICE_HISTORY, {
    variables: { productId },
    skip: isNaN(productId),
  });

  if (isNaN(productId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Invalid Product ID
          </h3>
          <p className="text-gray-600 mb-6">
            The product ID must be a valid number.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-600 font-medium">Error loading product</p>
          <p className="text-red-500 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const product = data?.Product?.[0];
  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Product not found
          </h3>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const totalSales = data?.ProductPaymentService_PaymentReceived?.length || 0;
  const totalRevenue =
    data?.ProductPaymentService_PaymentReceived?.reduce(
      (sum: string, payment: any) => {
        return (BigInt(sum) + BigInt(payment.amount || '0')).toString();
      },
      '0'
    ) || '0';

  // Build complete price history
  const priceHistory = [];
  if (priceHistoryData?.added?.[0]) {
    priceHistory.push({
      price: priceHistoryData.added[0].price,
      timestamp: priceHistoryData.added[0].blockTimestamp,
      type: 'created',
    });
  }
  if (priceHistoryData?.updates) {
    priceHistoryData.updates.forEach((update: any) => {
      priceHistory.push({
        price: update.newPrice,
        timestamp: update.blockTimestamp,
        type: 'updated',
      });
    });
  }
  priceHistory.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

  const formatDate = (timestamp: string) => {
    return new Date(Number(timestamp) * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-8 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Products</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center space-x-2 mb-4">
              <Package size={24} />
              <span className="text-lg font-medium">
                Product #{product.productId}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-2 break-all">
              {product.contentId}
            </h1>
            <p className="text-blue-100">
              Premium data content stored securely with Nillion
            </p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <DollarSign size={20} className="text-green-600" />
                    <h3 className="text-lg font-semibold">Current Price</h3>
                  </div>
                  <PriceDisplay
                    priceInPyusd={product.currentPrice}
                    className="text-3xl font-bold text-gray-900"
                  />
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <User size={20} className="text-blue-600" />
                    <h3 className="text-lg font-semibold">Creator</h3>
                  </div>
                  <div
                    className="cursor-pointer"
                    onClick={() => router.push(`/creator/${product.creator}`)}
                  >
                    <AddressDisplay
                      address={product.creator}
                      className="text-gray-900 hover:text-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Calendar size={20} className="text-purple-600" />
                    <h3 className="text-lg font-semibold">Created</h3>
                  </div>
                  <p className="text-gray-900">
                    {formatDate(product.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">
                    Sales Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-700">
                        {totalSales}
                      </p>
                      <p className="text-sm text-green-600">Total Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-700">
                        <PriceDisplay priceInPyusd={totalRevenue} />
                      </p>
                      <p className="text-sm text-green-600">Revenue</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">
                    Product Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        Content ID
                      </p>
                      <p className="text-blue-900 break-all font-mono text-sm">
                        {product.contentId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        Product ID
                      </p>
                      <p className="text-blue-900 font-mono">
                        {product.productId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        Last Updated
                      </p>
                      <p className="text-blue-900">
                        {formatDate(product.lastUpdatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">
                    Purchase Product
                  </h3>
                  <PurchaseButton
                    productId={product.productId}
                    price={
                      product.currentPrice
                        ? (Number(product.currentPrice) / 1e6).toFixed(2)
                        : '0.00'
                    }
                    onPurchaseSuccess={() => {
                      // Optionally refresh the page or show success message
                      window.location.reload();
                    }}
                  />
                </div>
              </div>
            </div>

            {priceHistory.length > 0 && (
              <div className="mt-8 bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Price History</h3>
                <div className="space-y-3">
                  {priceHistory.map((entry: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-white rounded-xl p-4"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            entry.type === 'created'
                              ? 'bg-blue-500'
                              : 'bg-orange-500'
                          }`}
                        ></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {entry.type === 'created'
                              ? 'Product Created'
                              : 'Price Updated'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <PriceDisplay
                          priceInPyusd={entry.price}
                          className="font-semibold text-gray-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data?.ProductPaymentService_PaymentReceived &&
              data.ProductPaymentService_PaymentReceived.length > 0 && (
                <div className="mt-8 bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Recent Purchases
                  </h3>
                  <div className="space-y-3">
                    {data.ProductPaymentService_PaymentReceived.slice(0, 5).map(
                      (payment: any, index: number) => (
                        <a
                          key={index}
                          href={`${process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER}/tx/${payment.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex justify-between items-center bg-white rounded-xl p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                              <AddressDisplay
                                address={payment.payer}
                                className="text-gray-700"
                                showCopy={false}
                                showExplorer={false}
                              />
                              <p className="text-xs text-gray-500">
                                {formatDate(payment.blockTimestamp)}
                              </p>
                              <p className="text-xs text-blue-600 group-hover:underline">
                                View transaction →
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <PriceDisplay
                              priceInPyusd={payment.amount}
                              className="font-semibold text-gray-900"
                            />
                          </div>
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

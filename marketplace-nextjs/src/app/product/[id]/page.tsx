'use client';

import React, { use } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { GET_PRODUCT_DETAILS, GET_PRICE_HISTORY } from '@/lib/queries';
import { PriceDisplay } from '@/components/PriceDisplay';
import { AddressDisplay } from '@/components/AddressDisplay';
import { PurchaseButton } from '@/components/PurchaseButton';
import { Navbar } from '@/components/Navbar';

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
      <div className="min-h-screen flex items-center justify-center">
        <div
          style={{ textAlign: 'center', maxWidth: '32rem', padding: '3rem' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '2rem', opacity: 0.3 }}>
            🌒
          </div>
          <h3
            style={{
              fontSize: '2.5rem',
              fontWeight: 300,
              marginBottom: '1rem',
            }}
          >
            Invalid Product ID
          </h3>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#666',
              marginBottom: '2rem',
            }}
          >
            The product ID must be a valid number.
          </p>
          <button
            onClick={() => router.push('/products')}
            className="btn-primary"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              animation: 'spin 1s linear infinite',
              borderRadius: '50%',
              height: '3rem',
              width: '3rem',
              borderBottom: '2px solid #D97757',
              margin: '0 auto 1rem',
            }}
          ></div>
          <p style={{ color: '#666' }}>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          style={{
            textAlign: 'center',
            border: '1px solid #e0e0e0',
            padding: '2rem',
            maxWidth: '28rem',
          }}
        >
          <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Error loading product
          </p>
          <p
            style={{
              color: '#666',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-inter)',
            }}
          >
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  const product = data?.Product?.[0];
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          style={{ textAlign: 'center', maxWidth: '32rem', padding: '3rem' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '2rem', opacity: 0.3 }}>
            🌒
          </div>
          <h3
            style={{
              fontSize: '2.5rem',
              fontWeight: 300,
              marginBottom: '1rem',
            }}
          >
            Product not found
          </h3>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#666',
              marginBottom: '2rem',
            }}
          >
            The product you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push('/products')}
            className="btn-primary"
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

  const formatDateNoYear = (timestamp: string) => {
    return new Date(Number(timestamp) * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        <div
          className="container-eclipse"
          style={{
            maxWidth: '1200px',
            paddingTop: '10rem',
            paddingBottom: '8rem',
          }}
        >
          {/* Product Info + Stats Dashboard */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr',
              gap: '2.5rem',
              alignItems: 'start',
              paddingBottom: '4rem',
              borderBottom: '1px solid #e0e0e0',
              marginBottom: '3rem',
              minHeight: '280px',
            }}
            className="responsive-product-header"
          >
            {/* Left: Product Info */}
            <div
              style={{
                padding: '2rem',
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafaf8',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#D97757',
                  marginBottom: '2rem',
                  fontWeight: 500,
                }}
              >
                Product #{product.productId}
              </div>

              {/* Product Content */}
              <div
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                {/* Product Icon & Name */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {/* Product Icon Placeholder */}
                  <div
                    style={{
                      width: '4.5rem',
                      height: '4.5rem',
                      backgroundColor: '#f5f5f3',
                      border: '2px dashed #e0e0e0',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      color: '#999',
                      flexShrink: 0,
                    }}
                  >
                    🌒
                  </div>

                  {/* Product Name & Date */}
                  <div style={{ flex: 1 }}>
                    <h1
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 300,
                        lineHeight: 1.2,
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.01em',
                        wordBreak: 'break-all',
                      }}
                    >
                      {product.contentId}
                    </h1>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: '#666',
                        fontFamily: 'var(--font-inter)',
                      }}
                    >
                      Created {formatDate(product.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Product Description */}
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: '#666',
                    marginBottom: '1.5rem',
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  Private data stored securely with Nillion's privacy
                  infrastructure. Content is encrypted and verifiable through AI
                  agents.
                </p>

                {/* Creator */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: '#999',
                      marginBottom: '0.5rem',
                      fontWeight: 500,
                    }}
                  >
                    Creator
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#f5f5f3',
                      cursor: 'pointer',
                      transition: 'border-color 200ms',
                    }}
                    onClick={() => router.push(`/creator/${product.creator}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#D97757';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '0.875rem',
                        color: '#1a1a1a',
                        flex: 1,
                      }}
                    >
                      {product.creator.slice(0, 6)}...
                      {product.creator.slice(-4)}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.75rem',
                        color: '#D97757',
                        fontWeight: 500,
                      }}
                    >
                      View profile →
                    </span>
                  </div>
                </div>

                {/* Purchase Section - Bottom aligned */}
                <div style={{ marginTop: 'auto' }}>
                  <div
                    style={{
                      padding: '1.5rem',
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#f5f5f3',
                      textAlign: 'center',
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: '#666',
                        marginBottom: '1rem',
                        fontWeight: 500,
                      }}
                    >
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
                        window.location.reload();
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stats + Purchase Dashboard */}
            <div
              style={{
                padding: '2rem',
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafaf8',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Price & Stats Section */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                {/* Current Price */}
                <div style={{ textAlign: 'center' }}>
                  <p
                    style={{
                      fontSize: '2rem',
                      fontWeight: 500,
                      color: '#D97757',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <PriceDisplay priceInPyusd={product.currentPrice} />
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#999',
                      fontWeight: 500,
                    }}
                  >
                    Current Price
                  </p>
                </div>

                {/* Update Count */}
                <div style={{ textAlign: 'center' }}>
                  <p
                    style={{
                      fontSize: '2rem',
                      fontWeight: 300,
                      color: '#1a1a1a',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {product.updateCount || 0}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#999',
                      fontWeight: 500,
                    }}
                  >
                    Updates
                  </p>
                </div>

                {/* Total Sales */}
                <div style={{ textAlign: 'center' }}>
                  <p
                    style={{
                      fontSize: '2rem',
                      fontWeight: 300,
                      color: '#1a1a1a',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {totalSales}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#999',
                      fontWeight: 500,
                    }}
                  >
                    Sales
                  </p>
                </div>

                {/* Total Revenue */}
                <div style={{ textAlign: 'center' }}>
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '1.25rem',
                      fontWeight: 500,
                      color: '#1a1a1a',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <PriceDisplay priceInPyusd={totalRevenue} />
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#999',
                      fontWeight: 500,
                    }}
                  >
                    Revenue
                  </p>
                </div>
              </div>

              {/* Price History - Compact */}
              {priceHistory.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.75rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#666',
                        fontWeight: 500,
                      }}
                    >
                      Price History
                    </h3>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.7rem',
                        color: '#999',
                      }}
                    >
                      {priceHistory.length} changes
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    }}
                  >
                    {priceHistory.slice(-3).reverse().map((entry: any, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '0.5rem',
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#f5f5f3',
                          fontSize: '0.75rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontWeight: 500,
                              color: entry.type === 'created' ? '#D97757' : '#1a1a1a',
                            }}
                          >
                            {entry.type === 'created' ? 'Created' : 'Updated'}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontWeight: 500,
                              color: '#D97757',
                            }}
                          >
                            <PriceDisplay priceInPyusd={entry.price} />
                          </span>
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.7rem',
                            color: '#999',
                          }}
                        >
                          {formatDateNoYear(entry.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Purchases - Compact */}
              {data?.ProductPaymentService_PaymentReceived &&
                data.ProductPaymentService_PaymentReceived.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.75rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#666',
                          fontWeight: 500,
                        }}
                      >
                        Latest Purchases
                      </h3>
                      <span
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.7rem',
                          color: '#999',
                        }}
                      >
                        {data.ProductPaymentService_PaymentReceived.length}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      {data.ProductPaymentService_PaymentReceived.slice(
                        0,
                        2
                      ).map((payment: any, index: number) => (
                        <a
                          key={index}
                          href={`${process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER}/tx/${payment.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0.5rem',
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#f5f5f3',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'border-color 200ms',
                            fontSize: '0.75rem',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.borderColor = '#D97757')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.borderColor = '#e0e0e0')
                          }
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontWeight: 500,
                              }}
                            >
                              {payment.payer.slice(0, 6)}...
                              {payment.payer.slice(-4)}
                            </span>
                            <span
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontWeight: 500,
                                color: '#D97757',
                              }}
                            >
                              <PriceDisplay priceInPyusd={payment.amount} />
                            </span>
                          </div>
                          <span
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.7rem',
                              color: '#999',
                            }}
                          >
                            {formatDateNoYear(payment.blockTimestamp)}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

            </div>
          </div>

        </div>
      </div>

      {/* Loading spinner animation */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .responsive-product-header {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }

        @media (max-width: 640px) {
          .responsive-product-header div:last-child > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

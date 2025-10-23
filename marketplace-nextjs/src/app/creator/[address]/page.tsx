'use client';

import React, { use } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { GET_CREATOR_PROFILE, GET_CREATOR_REVENUE } from '@/lib/queries';
import { ProductCard } from '@/components/ProductCard';
import { AddressDisplay } from '@/components/AddressDisplay';
import { PriceDisplay } from '@/components/PriceDisplay';
import { pyusdToFormatted } from '@/utils/formatting';
import { Navbar } from '@/components/Navbar';

interface CreatorPageProps {
  params: Promise<{
    address: string;
  }>;
}

export default function CreatorPage({ params }: CreatorPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { loading, error, data } = useQuery(GET_CREATOR_PROFILE, {
    variables: { creator: resolvedParams.address },
  });

  const products = data?.Product || [];
  const productIds = products.map((p: any) => p.productId);

  const { data: revenueData } = useQuery(GET_CREATOR_REVENUE, {
    variables: { productIds },
    skip: productIds.length === 0,
  });

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
          <p style={{ color: '#666' }}>Loading creator profile...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
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
            Error loading creator
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

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          style={{ textAlign: 'center', maxWidth: '32rem', padding: '3rem' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '2rem', opacity: 0.3 }}>
            👤
          </div>
          <h3
            style={{
              fontSize: '2.5rem',
              fontWeight: 300,
              marginBottom: '1rem',
            }}
          >
            Creator not found
          </h3>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#666',
              marginBottom: '2rem',
            }}
          >
            This creator doesn't have any products yet.
          </p>
          <button
            onClick={() => router.push('/creators')}
            className="btn-primary"
          >
            Back to Creators
          </button>
        </div>
      </div>
    );
  }

  const totalSales =
    revenueData?.ProductPaymentService_PaymentReceived?.length || 0;
  const totalRevenue =
    revenueData?.ProductPaymentService_PaymentReceived?.reduce(
      (sum: string, payment: any) => {
        return (BigInt(sum) + BigInt(payment.amount || '0')).toString();
      },
      '0'
    ) || '0';

  const averagePrice =
    products.length > 0
      ? products.reduce(
          (sum: number, product: any) => sum + Number(product.currentPrice),
          0
        ) / products.length
      : 0;

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

  const oldestProduct = products.reduce((oldest: any, product: any) =>
    Number(product.createdAt) < Number(oldest.createdAt) ? product : oldest
  );

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
          {/* Profile + Stats Dashboard */}
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
            className="responsive-creator-header"
          >
            {/* Left: Creator Profile */}
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
              {/* Profile Content */}
              <div
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                {/* Creator Image & Name Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {/* Creator Image Placeholder */}
                  <div
                    style={{
                      width: '4.5rem',
                      height: '4.5rem',
                      backgroundColor: '#f5f5f3',
                      border: '2px dashed #e0e0e0',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      color: '#999',
                      flexShrink: 0,
                    }}
                  >
                    👤
                  </div>

                  {/* Creator Name */}
                  <div style={{ flex: 1 }}>
                    <h1
                      style={{
                        fontSize: '2rem',
                        fontWeight: 300,
                        lineHeight: 1.1,
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.02em',
                        color: '#D97757',
                        fontStyle: 'italic',
                      }}
                    >
                      [Creator Name]
                    </h1>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: '#666',
                        fontFamily: 'var(--font-inter)',
                      }}
                    >
                      Member since {formatDate(oldestProduct.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Creator Description */}
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: '#999',
                    fontStyle: 'italic',
                    marginBottom: '1.5rem',
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  [Creator description and bio will appear here. This could be a
                  longer description about the creator's background and
                  expertise.]
                </p>

                {/* Address - Bottom aligned */}
                <div
                  style={{
                    marginTop: 'auto',
                  }}
                >
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
                    Wallet Address
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#f5f5f3',
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
                      {resolvedParams.address.slice(0, 6)}...
                      {resolvedParams.address.slice(-4)}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(resolvedParams.address)
                        }
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: '1px solid #e0e0e0',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          transition: 'all 200ms',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#666',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#D97757';
                          e.currentTarget.style.color = '#D97757';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.color = '#666';
                        }}
                        title="Copy address"
                      >
                        Copy
                      </button>
                      <a
                        href={`${process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER}/address/${resolvedParams.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: '1px solid #e0e0e0',
                          backgroundColor: 'transparent',
                          textDecoration: 'none',
                          color: '#666',
                          transition: 'all 200ms',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#D97757';
                          e.currentTarget.style.color = '#D97757';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.color = '#666';
                        }}
                        title="View on Etherscan"
                      >
                        View onchain →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stats Dashboard */}
            <div
              style={{
                padding: '2rem',
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafaf8',
                height: '100%',
              }}
            >
              {/* Main Dashboard Content */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: '1.5rem',
                }}
              >
                {/* Left: Key Metrics Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1.5rem',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <p
                      style={{
                        fontSize: '2rem',
                        fontWeight: 300,
                        color: '#1a1a1a',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {products.length}
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
                      Products
                    </p>
                  </div>

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
                      Total Sales
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '1.25rem',
                        fontWeight: 500,
                        color: '#D97757',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {pyusdToFormatted(totalRevenue)} PYUSD
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
                      Total Revenue
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        color: '#1a1a1a',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {pyusdToFormatted(averagePrice.toString())} PYUSD
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
                      Avg Price
                    </p>
                  </div>
                </div>

                {/* Right: Recent Sales Section */}
                {revenueData?.ProductPaymentService_PaymentReceived &&
                  revenueData.ProductPaymentService_PaymentReceived.length >
                    0 && (
                    <div
                      style={{
                        height: 'fit-content',
                      }}
                    >
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
                          Latest Sales
                        </h3>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        {revenueData.ProductPaymentService_PaymentReceived.slice(
                          0,
                          3
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
                                #{payment.productId}
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

          {/* Products Section */}
          <div style={{ marginBottom: '3rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
              }}
            >
              <h2
                style={{
                  fontSize: '2rem',
                  fontWeight: 300,
                  letterSpacing: '-0.01em',
                }}
              >
                Products ({products.length})
              </h2>
              {products.length > 6 && (
                <button
                  onClick={() => router.push('/products')}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    color: '#D97757',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  View all in marketplace →
                </button>
              )}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2rem',
              }}
            >
              {products.slice(0, 6).map((product: any) => (
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
        </div>
      </div>

      {/* Responsive styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-creator-header {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }

        @media (max-width: 640px) {
          .responsive-creator-header div:last-child {
            grid-template-columns: 1fr !important;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

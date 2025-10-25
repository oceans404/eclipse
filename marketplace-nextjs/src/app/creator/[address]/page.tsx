'use client';

import React, { use, useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { GET_CREATOR_PROFILE, GET_CREATOR_REVENUE } from '@/lib/queries';
import { ProductCard } from '@/components/ProductCard';
import { AddressDisplay } from '@/components/AddressDisplay';
import { PriceDisplay } from '@/components/PriceDisplay';
import { EditProfileModal } from '@/components/EditProfileModal';
import { pyusdToFormatted } from '@/utils/formatting';
import { Navbar } from '@/components/Navbar';
import { CreatorProfile } from '@/lib/db';

interface CreatorPageProps {
  params: Promise<{
    address: string;
  }>;
}

export default function CreatorPage({ params }: CreatorPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { authenticated, user } = usePrivy();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const { loading, error, data } = useQuery(GET_CREATOR_PROFILE, {
    variables: { creator: resolvedParams.address },
  });

  // Check if the current user is the creator
  const isOwnProfile =
    authenticated &&
    user?.wallet?.address?.toLowerCase() ===
      resolvedParams.address.toLowerCase();

  // Fetch creator profile from database
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      try {
        const response = await fetch(`/api/creator/${resolvedParams.address}`);
        if (response.ok) {
          const profile = await response.json();
          setCreatorProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching creator profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchCreatorProfile();
  }, [resolvedParams.address]);

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
              margin: '0 auto',
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
            paddingTop: '6rem',
            paddingBottom: '4rem',
          }}
        >
          {/* Compact Creator Header */}
          <div
            style={{
              marginBottom: '2rem',
            }}
          >
            {/* Header Card */}
            <div
              style={{
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafaf8',
                padding: '2rem',
                marginBottom: '2rem',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                }}
                className="responsive-product-header"
              >
                {/* Creator Icon */}
                <div
                  style={{
                    width: '4rem',
                    height: '4rem',
                    backgroundColor: '#f5f5f3',
                    border: creatorProfile?.image_url
                      ? '1px solid #e0e0e0'
                      : '1px dashed #e0e0e0',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    color: '#999',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {creatorProfile?.image_url ? (
                    <img
                      src={creatorProfile.image_url}
                      alt={creatorProfile.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '👤';
                      }}
                    />
                  ) : (
                    '👤'
                  )}
                </div>

                {/* Creator Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <h1
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {creatorProfile?.name ||
                            `${resolvedParams.address.slice(
                              0,
                              6
                            )}...${resolvedParams.address.slice(-4)}`}
                        </h1>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.875rem',
                              fontFamily: 'var(--font-mono, monospace)',
                              color: '#666',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#f5f5f3',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                            }}
                          >
                            {resolvedParams.address.slice(0, 6)}...
                            {resolvedParams.address.slice(-4)}
                          </span>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                resolvedParams.address
                              )
                            }
                            style={{
                              padding: '0.25rem',
                              border: '1px solid #e0e0e0',
                              backgroundColor: 'transparent',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 200ms',
                              fontSize: '0.7rem',
                              fontFamily: 'var(--font-inter)',
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
                            title="Copy wallet address"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      {/* Edit Profile Button - Inline with name */}
                      {isOwnProfile && (
                        <button
                          onClick={() => setIsEditModalOpen(true)}
                          style={{
                            padding: '0.625rem 1.5rem',
                            border: '1px solid #D97757',
                            backgroundColor: '#D97757',
                            color: '#fafaf8',
                            cursor: 'pointer',
                            transition: 'all 200ms',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            borderRadius: '4px',
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#c86548';
                            e.currentTarget.style.borderColor = '#c86548';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#D97757';
                            e.currentTarget.style.borderColor = '#D97757';
                          }}
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: '#666',
                        fontFamily: 'var(--font-inter)',
                        marginTop: '0.25rem',
                      }}
                    >
                      Creator • Member since{' '}
                      {formatDate(oldestProduct.createdAt)}
                    </p>
                  </div>

                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      lineHeight: 1.4,
                      marginBottom: '0.75rem',
                    }}
                  >
                    {creatorProfile?.description || 'No description provided'}
                  </p>

                  {/* Stats Row */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '1.5rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Products */}
                    <div>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: '#999',
                          fontFamily: 'var(--font-inter)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.125rem',
                        }}
                      >
                        Products
                      </p>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        {products.length}
                      </p>
                    </div>

                    {/* Sales */}
                    <div>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: '#999',
                          fontFamily: 'var(--font-inter)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.125rem',
                        }}
                      >
                        Total Sales
                      </p>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        {totalSales}
                      </p>
                    </div>

                    {/* Revenue */}
                    <div>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: '#999',
                          fontFamily: 'var(--font-inter)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.125rem',
                        }}
                      >
                        Total Revenue
                      </p>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ color: '#D97757' }}>
                          {pyusdToFormatted(totalRevenue)} PYUSD
                        </span>
                      </p>
                    </div>

                    {/* Avg Price */}
                    <div>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: '#999',
                          fontFamily: 'var(--font-inter)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.125rem',
                        }}
                      >
                        Avg Price
                      </p>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        {pyusdToFormatted(averagePrice.toString())} PYUSD
                      </p>
                    </div>

                    {/* Recent Sales - Inline */}
                    {revenueData?.ProductPaymentService_PaymentReceived &&
                      revenueData.ProductPaymentService_PaymentReceived.length >
                        0 && (
                        <div
                          style={{
                            borderLeft: '1px solid #e0e0e0',
                            paddingLeft: '1.5rem',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontSize: '0.75rem',
                                color: '#999',
                                fontFamily: 'var(--font-inter)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '0.125rem',
                              }}
                            >
                              Recent Sales
                            </p>
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              {revenueData.ProductPaymentService_PaymentReceived.slice(
                                0,
                                3
                              ).map((payment: any, index: number) => (
                                <a
                                  key={`payment-${payment.transactionHash}-${index}`}
                                  href={`${process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER}/tx/${payment.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    fontSize: '0.75rem',
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    transition: 'all 200ms',
                                    padding: '0.375rem 0.625rem',
                                    backgroundColor: '#f5f5f3',
                                    borderRadius: '4px',
                                    minWidth: '100px',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      'rgba(217, 151, 87, 0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      '#f5f5f3';
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color: '#D97757',
                                      fontSize: '0.875rem',
                                      marginBottom: '0.125rem',
                                    }}
                                  >
                                    ${pyusdToFormatted(payment.amount)}
                                  </span>
                                  <span
                                    style={{
                                      fontFamily: 'var(--font-inter)',
                                      color: '#666',
                                      fontSize: '0.65rem',
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    Product #{payment.productId}
                                    <br />
                                    {formatDateNoYear(payment.blockTimestamp)}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div style={{ marginBottom: '3rem', marginTop: '3rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 400,
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
                    creatorProfile={creatorProfile}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          address={resolvedParams.address}
          currentProfile={creatorProfile}
          onProfileUpdated={(updatedProfile) => {
            setCreatorProfile(updatedProfile);
            setIsEditModalOpen(false);
          }}
        />

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
      </div>
    </>
  );
}

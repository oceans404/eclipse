'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@apollo/client';
import {
  GET_USER_OWNED_PRODUCTS,
  GET_OWNED_PRODUCTS_WITH_DETAILS,
  GET_PRODUCTS_BY_CREATOR,
} from '@/lib/queries';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CreatorProfile } from '@/lib/db';
import { EXPLORER_URL } from '@/lib/config';

export default function MyProductsPage() {
  const { authenticated, user, login } = usePrivy();
  const [creatorProfiles, setCreatorProfiles] = useState<
    Map<string, CreatorProfile>
  >(new Map());

  // Slider refs and states
  const ownedSliderRef = useRef<HTMLDivElement>(null);
  const createdSliderRef = useRef<HTMLDivElement>(null);
  const [ownedScrollPosition, setOwnedScrollPosition] = useState(0);
  const [createdScrollPosition, setCreatedScrollPosition] = useState(0);

  // First query: Get all products the user has purchased
  const {
    loading: loadingOwned,
    error: errorOwned,
    data: ownedData,
  } = useQuery(GET_USER_OWNED_PRODUCTS, {
    variables: { userAddress: user?.wallet?.address },
    skip: !authenticated || !user?.wallet?.address,
  });

  // Extract product IDs from owned products
  const ownedProductIds =
    ownedData?.ProductPaymentService_PaymentReceived?.map(
      (payment: any) => payment.productId
    ) || [];

  // Second query: Get full product details for owned products
  const {
    loading: loadingDetails,
    error: errorDetails,
    data: detailsData,
  } = useQuery(GET_OWNED_PRODUCTS_WITH_DETAILS, {
    variables: { productIds: ownedProductIds },
    skip: ownedProductIds.length === 0,
  });

  // Third query: Get products created by the user
  const {
    loading: loadingCreated,
    error: errorCreated,
    data: createdData,
  } = useQuery(GET_PRODUCTS_BY_CREATOR, {
    variables: { creator: user?.wallet?.address },
    skip: !authenticated || !user?.wallet?.address,
  });

  // Fetch creator profiles when products are loaded
  useEffect(() => {
    const fetchCreatorProfiles = async () => {
      const allProducts = [
        ...(detailsData?.Product || []),
        ...(createdData?.Product || []),
      ];

      if (allProducts.length === 0) return;

      const uniqueCreators = [
        ...new Set(allProducts.map((p: any) => p.creator)),
      ];
      const profiles = new Map<string, CreatorProfile>();

      await Promise.all(
        uniqueCreators.map(async (address: string) => {
          try {
            const response = await fetch(`/api/creator/${address}`);
            if (response.ok) {
              const profile = await response.json();
              profiles.set(address, profile);
            }
          } catch (error) {
            console.error(`Failed to fetch profile for ${address}:`, error);
          }
        })
      );

      setCreatorProfiles(profiles);
    };

    fetchCreatorProfiles();
  }, [detailsData, createdData]);

  // Not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          style={{
            textAlign: 'center',
            maxWidth: '32rem',
            padding: '3rem',
            border: '1px solid #e0e0e0',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '2rem', opacity: 0.3 }}>
            🔒
          </div>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 300,
              marginBottom: '1rem',
            }}
          >
            Sign in required
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#666',
              marginBottom: '2rem',
            }}
          >
            Please connect your wallet to view your products
          </p>
          <div
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}
          >
            <button onClick={login} className="btn-primary">
              Connect Wallet
            </button>
            <Link
              href="/products"
              className="btn-secondary"
              style={{ display: 'inline-block' }}
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const loading = loadingOwned || loadingDetails || loadingCreated;
  const error = errorOwned || errorDetails || errorCreated;

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
          <p style={{ color: '#666' }}>Loading your products...</p>
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
            Error loading your products
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

  const ownedProducts = detailsData?.Product || [];
  const createdProducts = createdData?.Product || [];

  // Create a map of purchase details for each product
  const purchaseDetailsMap = new Map();
  ownedData?.ProductPaymentService_PaymentReceived?.forEach((payment: any) => {
    purchaseDetailsMap.set(payment.productId, {
      amount: payment.amount,
      purchaseDate: payment.blockTimestamp,
      transactionHash: payment.transactionHash,
    });
  });

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

  // Slider navigation functions
  const scrollSlider = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right'
  ) => {
    if (!ref.current) return;

    const scrollAmount = 320; // Width of one product card + gap
    const currentScroll = ref.current.scrollLeft;
    const newScroll =
      direction === 'left'
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount;

    ref.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  };

  // Check scroll positions for button visibility
  const updateScrollPosition = (
    ref: React.RefObject<HTMLDivElement | null>,
    setPosition: (pos: number) => void
  ) => {
    if (!ref.current) return;
    setPosition(ref.current.scrollLeft);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        <div className="container-eclipse" style={{ maxWidth: '1400px' }}>
          {/* Header */}
          <div
            style={{
              paddingTop: '8rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: 300,
                  lineHeight: 1.1,
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                }}
              >
                My Products
              </h1>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                Products you've purchased and created on Eclipse
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                color: '#666',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-inter)',
              }}
            >
              <span>{ownedProducts.length} owned</span>
              <span>•</span>
              <span>{createdProducts.length} created</span>
            </div>
          </div>

          {/* Owned Products Section */}
          <div style={{ padding: '3rem 0', borderBottom: '1px solid #e0e0e0' }}>
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
                Products I own
              </h2>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}
              >
                {ownedProducts.length > 0 && (
                  <>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        color: '#666',
                      }}
                    >
                      {ownedProducts.length} product
                      {ownedProducts.length !== 1 ? 's' : ''}
                    </span>
                    {/* Navigation Arrows */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => scrollSlider(ownedSliderRef, 'left')}
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          border: '1px solid #e0e0e0',
                          backgroundColor:
                            ownedScrollPosition > 0 ? '#fafaf8' : '#f5f5f3',
                          cursor:
                            ownedScrollPosition > 0 ? 'pointer' : 'not-allowed',
                          opacity: ownedScrollPosition > 0 ? 1 : 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 200ms',
                        }}
                        disabled={ownedScrollPosition === 0}
                        onMouseEnter={(e) => {
                          if (ownedScrollPosition > 0) {
                            e.currentTarget.style.backgroundColor = '#D97757';
                            e.currentTarget.style.color = '#fafaf8';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            ownedScrollPosition > 0 ? '#fafaf8' : '#f5f5f3';
                          e.currentTarget.style.color = '#1a1a1a';
                        }}
                      >
                        ←
                      </button>
                      <button
                        onClick={() => scrollSlider(ownedSliderRef, 'right')}
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fafaf8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 200ms',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#D97757';
                          e.currentTarget.style.color = '#fafaf8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fafaf8';
                          e.currentTarget.style.color = '#1a1a1a';
                        }}
                      >
                        →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {ownedProducts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fafaf8',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    opacity: 0.3,
                  }}
                >
                  🛒
                </div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 300,
                    marginBottom: '0.75rem',
                  }}
                >
                  No products owned yet
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginBottom: '1.5rem',
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Start exploring the marketplace
                </p>
                <Link href="/products" className="btn-primary">
                  Browse Products
                </Link>
              </div>
            ) : (
              <div
                style={{
                  position: 'relative',
                  overflowX: 'hidden',
                  overflowY: 'visible',
                }}
              >
                <div
                  ref={ownedSliderRef}
                  onScroll={() =>
                    updateScrollPosition(ownedSliderRef, setOwnedScrollPosition)
                  }
                  style={{
                    display: 'flex',
                    gap: '2rem',
                    overflowX: 'auto',
                    overflowY: 'visible',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingTop: '0.5rem', // Small top padding for container
                  }}
                >
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {[...ownedProducts]
                    .sort((a: any, b: any) => {
                      const purchaseA = purchaseDetailsMap.get(a.productId);
                      const purchaseB = purchaseDetailsMap.get(b.productId);
                      return (
                        Number(purchaseB?.purchaseDate || 0) -
                        Number(purchaseA?.purchaseDate || 0)
                      );
                    })
                    .map((product: any) => {
                      const purchaseDetails = purchaseDetailsMap.get(
                        product.productId
                      );
                      return (
                        <div
                          key={product.productId}
                          style={{
                            flexShrink: 0,
                            width: '300px',
                            paddingTop: '8px', // Space for hover animation
                          }}
                        >
                          <ProductCard
                            productId={product.productId}
                            contentId={product.contentId}
                            currentPrice={product.currentPrice}
                            creator={product.creator}
                            mustBeVerified={Boolean(product.mustBeVerified)}
                            creatorProfile={
                              creatorProfiles.get(product.creator) || null
                            }
                          />

                          {/* Purchase Info */}
                          {purchaseDetails && (
                            <div
                              style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                border: '1px solid #e0e0e0',
                                backgroundColor: '#f5f5f3',
                              }}
                            >
                              <p
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '0.75rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  color: '#999',
                                  marginBottom: '0.5rem',
                                }}
                              >
                                Purchased
                              </p>
                              <p
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '0.875rem',
                                  color: '#1a1a1a',
                                  marginBottom: '0.5rem',
                                }}
                              >
                                {formatDate(purchaseDetails.purchaseDate)}
                              </p>
                              <a
                                href={`${EXPLORER_URL}/tx/${purchaseDetails.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '0.75rem',
                                  color: '#D97757',
                                  textDecoration: 'none',
                                  borderBottom: '1px solid #D97757',
                                  paddingBottom: '0.125rem',
                                }}
                              >
                                View transaction →
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Created Products Section */}
          <div style={{ padding: '3rem 0 4rem' }}>
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
                Products I created
              </h2>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}
              >
                {createdProducts.length > 0 && (
                  <>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        color: '#666',
                      }}
                    >
                      {createdProducts.length} product
                      {createdProducts.length !== 1 ? 's' : ''}
                    </span>
                    {/* Navigation Arrows */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => scrollSlider(createdSliderRef, 'left')}
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          border: '1px solid #e0e0e0',
                          backgroundColor:
                            createdScrollPosition > 0 ? '#fafaf8' : '#f5f5f3',
                          cursor:
                            createdScrollPosition > 0
                              ? 'pointer'
                              : 'not-allowed',
                          opacity: createdScrollPosition > 0 ? 1 : 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 200ms',
                        }}
                        disabled={createdScrollPosition === 0}
                        onMouseEnter={(e) => {
                          if (createdScrollPosition > 0) {
                            e.currentTarget.style.backgroundColor = '#D97757';
                            e.currentTarget.style.color = '#fafaf8';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            createdScrollPosition > 0 ? '#fafaf8' : '#f5f5f3';
                          e.currentTarget.style.color = '#1a1a1a';
                        }}
                      >
                        ←
                      </button>
                      <button
                        onClick={() => scrollSlider(createdSliderRef, 'right')}
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fafaf8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 200ms',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#D97757';
                          e.currentTarget.style.color = '#fafaf8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fafaf8';
                          e.currentTarget.style.color = '#1a1a1a';
                        }}
                      >
                        →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {createdProducts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fafaf8',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    opacity: 0.3,
                  }}
                >
                  ✨
                </div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 300,
                    marginBottom: '0.75rem',
                  }}
                >
                  No products created yet
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginBottom: '1.5rem',
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Ready to become a creator?
                </p>
                <Link href="/create" className="btn-primary">
                  Create Product
                </Link>
              </div>
            ) : (
              <div
                style={{
                  position: 'relative',
                  overflowX: 'hidden',
                  overflowY: 'visible',
                }}
              >
                <div
                  ref={createdSliderRef}
                  onScroll={() =>
                    updateScrollPosition(
                      createdSliderRef,
                      setCreatedScrollPosition
                    )
                  }
                  style={{
                    display: 'flex',
                    gap: '2rem',
                    overflowX: 'auto',
                    overflowY: 'visible',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingBottom: '10rem', // Added extra padding for creator info boxes
                    paddingTop: '0.5rem', // Small top padding for container
                  }}
                >
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {[...createdProducts]
                    .sort(
                      (a: any, b: any) =>
                        Number(b.createdAt || 0) - Number(a.createdAt || 0)
                    )
                    .map((product: any) => (
                      <div
                        key={product.productId}
                        style={{
                          flexShrink: 0,
                          width: '300px',
                          paddingTop: '8px', // Space for hover animation
                        }}
                      >
                        <ProductCard
                          productId={product.productId}
                          contentId={product.contentId}
                          currentPrice={product.currentPrice}
                          creator={product.creator}
                          mustBeVerified={Boolean(product.mustBeVerified)}
                          creatorProfile={
                            creatorProfiles.get(product.creator) || null
                          }
                        />

                        {/* Creator Info */}
                        <div
                          style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#f5f5f3',
                          }}
                        >
                          <p
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.75rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: '#999',
                              marginBottom: '0.5rem',
                            }}
                          >
                            Created
                          </p>
                          <p
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.875rem',
                              color: '#1a1a1a',
                              marginBottom: '0.5rem',
                            }}
                          >
                            {formatDate(product.createdAt)}
                          </p>
                          <p
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.75rem',
                              color: '#666',
                              marginBottom: '0.5rem',
                            }}
                          >
                            {product.updateCount || 0} update
                            {product.updateCount !== 1 ? 's' : ''}
                          </p>
                          <Link
                            href={`/product/${product.productId}`}
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.75rem',
                              color: '#D97757',
                              textDecoration: 'none',
                              borderBottom: '1px solid #D97757',
                              paddingBottom: '0.125rem',
                            }}
                          >
                            View sales data →
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import React, { use, useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { GET_PRODUCT_DETAILS, GET_PRICE_HISTORY } from '@/lib/queries';
import { PriceDisplay } from '@/components/PriceDisplay';
import { AddressDisplay } from '@/components/AddressDisplay';
import { PurchaseButton } from '@/components/PurchaseButton';
import { Navbar } from '@/components/Navbar';
import { CreatorProfile } from '@/lib/db';
import { useAssetMetadata } from '@/hooks/useAssetMetadata';
import { useHasPaid } from '@/hooks/useContract';
import { usePrivy } from '@privy-io/react-auth';
import { ContentViewer } from '@/components/ContentViewer';
import { ChatInterface } from '@/components/ChatInterface';
import { EXPLORER_URL } from '@/lib/config';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const productId = Number(resolvedParams.id);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<'chat' | 'content'>('chat');
  const [tabInitialized, setTabInitialized] = useState(false);
  const { authenticated, user } = usePrivy();

  const { loading, error, data } = useQuery(GET_PRODUCT_DETAILS, {
    variables: { productId },
    skip: isNaN(productId),
  });

  const {
    data: priceHistoryData,
    loading: priceHistoryLoading,
    error: priceHistoryError,
  } = useQuery(GET_PRICE_HISTORY, {
    variables: { productId },
    skip: isNaN(productId),
  });

  // Use the asset metadata hook
  const product = data?.Product?.[0];
  const requiresVerification = Boolean(product?.mustBeVerified);
  const { getTitle, getDescription, metadata } = useAssetMetadata(
    product?.contentId || null
  );

  // Check if user owns this product
  const { data: hasPaid } = useHasPaid(user?.wallet?.address, productId);

  // Check if user created this product
  const isCreator =
    authenticated &&
    user?.wallet?.address?.toLowerCase() === product?.creator?.toLowerCase();

  // Set default tab based on access
  useEffect(() => {
    if (!tabInitialized && product && (hasPaid || isCreator)) {
      setActiveTab('content');
      setTabInitialized(true);
    }
  }, [hasPaid, isCreator, product, tabInitialized]);

  // Fetch creator profile when product data is loaded
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      if (!data?.Product?.[0]?.creator) return;

      try {
        const response = await fetch(`/api/creator/${data.Product[0].creator}`);
        if (response.ok) {
          const profile = await response.json();
          setCreatorProfile(profile);
        }
      } catch (error) {
        console.error('Failed to fetch creator profile:', error);
      }
    };

    fetchCreatorProfile();
  }, [data]);

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

  // Find user's purchase transaction
  const userPurchase = data?.ProductPaymentService_PaymentReceived?.find(
    (payment: any) =>
      payment.payer.toLowerCase() === user?.wallet?.address?.toLowerCase()
  );

  // Build complete price history
  const priceHistory = [];
  if (priceHistoryData?.added?.[0]) {
    priceHistory.push({
      price: priceHistoryData.added[0].price,
      timestamp: priceHistoryData.added[0].blockTimestamp,
      type: 'created',
      transactionHash: priceHistoryData.added[0].transactionHash,
    });
  }
  if (priceHistoryData?.updates) {
    priceHistoryData.updates.forEach((update: any) => {
      priceHistory.push({
        price: update.newPrice,
        timestamp: update.blockTimestamp,
        type: 'updated',
        transactionHash: update.transactionHash,
      });
    });
  }
  priceHistory.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

  // Debug log
  if (isCreator) {
    console.log('Price history data:', priceHistoryData);
    console.log('Price history loading:', priceHistoryLoading);
    console.log('Price history error:', priceHistoryError);
    console.log('Product ID:', productId);
  }

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
            paddingTop: '6rem',
          }}
        >
          {/* Compact Product Header */}
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
                padding: '1.5rem',
                marginBottom: '2rem',
                position: 'relative',
              }}
            >
              {/* Buy Button - Top Right */}
              <div
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                }}
              >
                {!isCreator && !hasPaid ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
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
                      compact={true}
                    />
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.7rem',
                        color: '#666',
                        marginTop: '0.5rem',
                        textAlign: 'center',
                        lineHeight: 1.4,
                      }}
                    >
                      Buy in 2 steps: <br /> 1. Approve USDC spending cap{' '}
                      <br /> 2. Purchase product
                    </p>
                    {requiresVerification && (
                      <p
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.7rem',
                          color: '#999',
                          marginTop: '0.25rem',
                          textAlign: 'center',
                          lineHeight: 1.4,
                        }}
                      >
                        Unlocks once Base Sepolia USDC payment is indexed and
                        verification completes.
                      </p>
                    )}
                  </div>
                ) : isCreator ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#f5f5f3',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-inter)',
                        fontWeight: 500,
                        color: '#666',
                      }}
                    >
                      👑
                      <span>You created this product</span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: '#666',
                        fontFamily: 'var(--font-inter)',
                        textAlign: 'right',
                      }}
                    >
                      {formatDate(product.createdAt)} • Price:{' '}
                      <span style={{ fontWeight: 500, color: '#D97757' }}>
                        <PriceDisplay priceInUsdc={product.currentPrice} />
                      </span>
                    </div>
                  </div>
                ) : hasPaid && userPurchase ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#f5f5f3',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-inter)',
                        fontWeight: 500,
                        color: '#666',
                      }}
                    >
                      ✓<span>You purchased this product</span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: '#666',
                        fontFamily: 'var(--font-inter)',
                        textAlign: 'right',
                      }}
                    >
                      {formatDate(userPurchase.blockTimestamp)} • Paid{' '}
                      <span style={{ fontWeight: 500, color: '#D97757' }}>
                        <PriceDisplay priceInUsdc={userPurchase.amount} />
                      </span>
                    </div>
                    <a
                      href={`${EXPLORER_URL}/tx/${userPurchase.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.7rem',
                        color: '#D97757',
                        fontFamily: 'var(--font-inter)',
                        textDecoration: 'none',
                        borderBottom: '1px solid transparent',
                        transition: 'border-color 200ms',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderBottomColor = '#D97757';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderBottomColor = 'transparent';
                      }}
                    >
                      View transaction →
                    </a>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.875rem',
                      backgroundColor: '#f5f5f3',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-inter)',
                      fontWeight: 500,
                      color: '#666',
                    }}
                  >
                    ✓<span>Owned</span>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'flex-start',
                  paddingRight: '200px',
                }}
                className="responsive-product-header"
              >
                {/* Product Icon */}
                <div
                  style={{
                    width: '4rem',
                    height: '4rem',
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
                  {isCreator || hasPaid ? '🌔' : '🌑'}
                </div>

                {/* Title and Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h1
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 300,
                        marginBottom: '0.25rem',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2,
                      }}
                    >
                      {getTitle(product.contentId)}
                    </h1>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#666',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    Product #{product.productId} • Created{' '}
                    {formatDate(product.createdAt)}
                  </p>
                  {requiresVerification && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(217, 151, 87, 0.12)',
                        border: '1px solid rgba(217, 151, 87, 0.4)',
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-inter)',
                        fontWeight: 500,
                        color: '#D97757',
                        marginTop: '0.5rem',
                      }}
                    >
                      🔐 Verification required
                    </div>
                  )}
                </div>

                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      lineHeight: 1.4,
                      marginBottom: '0.75rem',
                    }}
                  >
                    {getDescription()}
                  </p>

                  {/* Creator and Stats Row */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '1.5rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Creator */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/creator/${product.creator}`)}
                    >
                      {creatorProfile?.image_url ? (
                        <img
                          src={creatorProfile.image_url}
                          alt={creatorProfile.name || 'Creator'}
                          style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid #e0e0e0',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            backgroundColor: '#f5f5f3',
                            border: '1px solid #e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                          }}
                        >
                          👤
                        </div>
                      )}
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
                          Creator
                        </p>
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: '#D97757',
                            fontFamily: 'var(--font-inter)',
                            fontWeight: 500,
                          }}
                        >
                          {creatorProfile?.name ||
                            `${product.creator.slice(
                              0,
                              6
                            )}...${product.creator.slice(-4)}`}
                        </p>
                      </div>
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
                        Sales
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
                        Revenue
                      </p>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        <PriceDisplay priceInUsdc={totalRevenue} />
                      </p>
                    </div>

                    {/* Price */}
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
                        Price
                      </p>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: '#D97757',
                        }}
                      >
                        <PriceDisplay priceInUsdc={product.currentPrice} />
                      </p>
                    </div>

                    {/* Updates */}
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
                        Updates
                      </p>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        {product.updateCount || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info + Stats Dashboard - Remove this old section */}
            <div style={{ display: 'none' }}>
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
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
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
                            wordBreak: 'break-word',
                          }}
                        >
                          {getTitle(product.contentId)}
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
                      {getDescription()}
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
                        onClick={() =>
                          router.push(`/creator/${product.creator}`)
                        }
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#D97757';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                        }}
                      >
                        {/* Creator Profile Image */}
                        {creatorProfile?.image_url ? (
                          <img
                            src={creatorProfile.image_url}
                            alt={creatorProfile.name || 'Creator'}
                            style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid #e0e0e0',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '50%',
                              backgroundColor: '#f5f5f3',
                              border: '1px solid #e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.25rem',
                              flexShrink: 0,
                            }}
                          >
                            👤
                          </div>
                        )}

                        {/* Creator Info */}
                        <div style={{ flex: 1 }}>
                          {creatorProfile?.name ? (
                            <div>
                              <div
                                style={{
                                  fontSize: '0.9rem',
                                  color: '#1a1a1a',
                                  fontWeight: 400,
                                  marginBottom: '0.125rem',
                                }}
                              >
                                {creatorProfile.name}
                              </div>
                              <div
                                style={{
                                  fontFamily: 'var(--font-mono, monospace)',
                                  fontSize: '0.75rem',
                                  color: '#666',
                                }}
                              >
                                {product.creator.slice(0, 6)}...
                                {product.creator.slice(-4)}
                              </div>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                fontSize: '0.875rem',
                                color: '#1a1a1a',
                              }}
                            >
                              {product.creator.slice(0, 6)}...
                              {product.creator.slice(-4)}
                            </span>
                          )}
                        </div>

                        <span
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.75rem',
                            color: '#D97757',
                            fontWeight: 500,
                            flexShrink: 0,
                          }}
                        >
                          View profile →
                        </span>
                      </div>
                    </div>

                    {/* Purchase Section - Bottom aligned */}
                    <div style={{ marginTop: 'auto' }}>
                      {!isCreator && !hasPaid ? (
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
                                ? (Number(product.currentPrice) / 1e6).toFixed(
                                    2
                                  )
                                : '0.00'
                            }
                            onPurchaseSuccess={() => {
                              window.location.reload();
                            }}
                          />
                          <p
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.75rem',
                              color: '#666',
                              marginTop: '1rem',
                              textAlign: 'center',
                              lineHeight: 1.5,
                            }}
                          >
                            <strong style={{ color: '#1a1a1a' }}>Note:</strong>{' '}
                            Purchase is a 2-step process
                            <br />
                            1) Approve USDC spending
                            <br />
                            2) Complete product purchase
                            {requiresVerification && (
                              <>
                                <br />
                                Content unlocks after verification confirms your
                                Base Sepolia USDC payment.
                              </>
                            )}
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '1.5rem',
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#f5f5f3',
                            textAlign: 'center',
                          }}
                        >
                          {isCreator ? (
                            <>
                              <div
                                style={{
                                  fontSize: '1.5rem',
                                  marginBottom: '0.5rem',
                                  opacity: 0.7,
                                }}
                              >
                                👑
                              </div>
                              <h3
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '0.875rem',
                                  letterSpacing: '0.05em',
                                  textTransform: 'uppercase',
                                  color: '#666',
                                  marginBottom: '0.5rem',
                                  fontWeight: 500,
                                }}
                              >
                                You Created This
                              </h3>
                              <p
                                style={{
                                  fontSize: '0.875rem',
                                  color: '#666',
                                  fontFamily: 'var(--font-inter)',
                                }}
                              >
                                As the creator, you have full access to this
                                content
                              </p>
                            </>
                          ) : hasPaid ? (
                            <>
                              <div
                                style={{
                                  fontSize: '1.5rem',
                                  marginBottom: '0.5rem',
                                  opacity: 0.7,
                                }}
                              >
                                ✓
                              </div>
                              <h3
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '0.875rem',
                                  letterSpacing: '0.05em',
                                  textTransform: 'uppercase',
                                  color: '#22c55e',
                                  marginBottom: '0.5rem',
                                  fontWeight: 500,
                                }}
                              >
                                Already Purchased
                              </h3>
                              <p
                                style={{
                                  fontSize: '0.875rem',
                                  color: '#666',
                                  fontFamily: 'var(--font-inter)',
                                }}
                              >
                                You own this product and have full access
                              </p>
                            </>
                          ) : null}
                        </div>
                      )}
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
                        <PriceDisplay priceInUsdc={product.currentPrice} />
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
                        <PriceDisplay priceInUsdc={totalRevenue} />
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
                        {priceHistory
                          .slice(-3)
                          .reverse()
                          .map((entry: any, index: number) => (
                            <div
                              key={`price-${entry.timestamp}-${index}`}
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
                                    color:
                                      entry.type === 'created'
                                        ? '#D97757'
                                        : '#1a1a1a',
                                  }}
                                >
                                  {entry.type === 'created'
                                    ? 'Created'
                                    : 'Updated'}
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'var(--font-inter)',
                                    fontWeight: 500,
                                    color: '#D97757',
                                  }}
                                >
                                  <PriceDisplay priceInUsdc={entry.price} />
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
                              key={`payment-${payment.transactionHash}-${index}`}
                              href={`${EXPLORER_URL}/tx/${payment.transactionHash}`}
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
                                  <PriceDisplay priceInUsdc={payment.amount} />
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

            {/* Tabbed Interface for Chat and Content */}
            <div
              style={{
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafaf8',
                overflow: 'hidden',
              }}
            >
              {/* Tab Navigation */}
              <div
                style={{
                  display: 'flex',
                  gap: '2rem',
                  borderBottom: '1px solid #e0e0e0',
                  padding: '0 2rem',
                  backgroundColor: '#f5f5f3',
                }}
              >
                <button
                  onClick={() => setActiveTab('chat')}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: activeTab === 'chat' ? '#D97757' : '#666',
                    background: 'none',
                    border: 'none',
                    padding: '1rem 0',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'color 200ms',
                  }}
                >
                  Ask AI About This Product
                  {activeTab === 'chat' && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-1px',
                        left: 0,
                        right: 0,
                        height: '2px',
                        backgroundColor: '#D97757',
                      }}
                    />
                  )}
                </button>

                {(hasPaid || isCreator) && (
                  <button
                    onClick={() => setActiveTab('content')}
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: activeTab === 'content' ? '#D97757' : '#666',
                      background: 'none',
                      border: 'none',
                      padding: '1rem 0',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'color 200ms',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    View Full Content
                    <span
                      style={{
                        fontSize: '0.7rem',
                        backgroundColor: '#D97757',
                        color: '#fff',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '2px',
                      }}
                    >
                      {isCreator ? 'CREATOR' : 'OWNED'}
                    </span>
                    {activeTab === 'content' && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-1px',
                          left: 0,
                          right: 0,
                          height: '2px',
                          backgroundColor: '#D97757',
                        }}
                      />
                    )}
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div style={{ padding: '1.5rem' }}>
                {activeTab === 'chat' ? (
                  <div>
                    <ChatInterface
                      contentId={product.contentId}
                      productId={product.productId.toString()}
                      productTitle={getTitle(product.contentId)}
                    />
                  </div>
                ) : hasPaid || isCreator ? (
                  <div>
                    <ContentViewer
                      contentId={product.contentId}
                      productId={product.productId.toString()}
                      mimeType={metadata?.mimeType}
                      title={getTitle(product.contentId)}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Loading spinner animation */}
        <style jsx>
          {`
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
                padding-right: 0 !important;
              }
              .responsive-product-header + div {
                position: static !important;
                margin-top: 1rem;
                text-align: left !important;
              }
            }

            @media (max-width: 640px) {
              .responsive-product-header div:last-child > div:first-child {
                grid-template-columns: 1fr !important;
              }
            }

            /* Tab responsive design */
            @media (max-width: 640px) {
              button[style*='letterSpacing'] {
                font-size: 0.75rem !important;
                padding: 0.75rem 0 !important;
              }
            }
          `}
        </style>
      </div>
    </>
  );
}

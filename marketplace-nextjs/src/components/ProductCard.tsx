'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useHasPaid } from '@/hooks/useContract';
import { PriceDisplay } from './PriceDisplay';
import { AddressDisplay } from './AddressDisplay';
import { CreatorProfile } from '@/lib/db';

interface ProductCardProps {
  productId: string;
  contentId: string;
  currentPrice: string;
  creator: string;
  creatorProfile?: CreatorProfile | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  productId,
  contentId,
  currentPrice,
  creator,
  creatorProfile,
}) => {
  const router = useRouter();
  const { authenticated, user } = usePrivy();

  // Check if user owns this product
  const { data: hasPaid } = useHasPaid(
    user?.wallet?.address,
    Number(productId)
  );

  // Check if user created this product
  const isCreator =
    authenticated &&
    user?.wallet?.address?.toLowerCase() === creator.toLowerCase();

  const handleClick = () => {
    router.push(`/product/${productId}`);
  };

  // Determine status color for the dot indicator
  const getStatusColor = () => {
    if (isCreator) return '#D97757'; // Orange for created
    if (hasPaid) return '#1a1a1a'; // Black for owned
    return 'transparent'; // Transparent for available
  };

  const getStatusBorderColor = () => {
    if (!isCreator && !hasPaid) return '#e0e0e0'; // Gray border for available
    return getStatusColor();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        transition: 'all 300ms ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) rotate(0.5deg)';
        e.currentTarget.style.filter = 'brightness(1.05)';
        const cardElement = e.currentTarget.querySelector('.product-card-inner') as HTMLElement;
        if (cardElement) {
          cardElement.style.background = 'linear-gradient(135deg, #f8f8f6 0%, #efefed 50%, #f5f5f3 100%)';
          cardElement.style.boxShadow = '0 8px 25px rgba(217, 151, 87, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) rotate(0deg)';
        e.currentTarget.style.filter = 'brightness(1)';
        const cardElement = e.currentTarget.querySelector('.product-card-inner') as HTMLElement;
        if (cardElement) {
          cardElement.style.background = 'linear-gradient(135deg, #f5f5f3 0%, #e8e8e6 100%)';
          cardElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {/* Product Image/Visual */}
      <div
        className="product-card-inner"
        style={{
          aspectRatio: '4/5',
          background: 'linear-gradient(135deg, #f5f5f3 0%, #e8e8e6 100%)',
          border: '1px solid #e0e0e0',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 300ms ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#D97757';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e0e0e0';
        }}
      >
        {/* Product ID Badge */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            color: '#D97757',
            backgroundColor: 'rgba(250, 250, 248, 0.9)',
            padding: '0.25rem 0.75rem',
            border: '1px solid #e0e0e0',
          }}
        >
          #{productId}
        </div>

        {/* Status Indicator Dot */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            width: '0.75rem',
            height: '0.75rem',
            backgroundColor: getStatusColor(),
            border: `1px solid ${getStatusBorderColor()}`,
            borderRadius: '50%',
          }}
        />

        {/* Placeholder Icon */}
        <div
          style={{
            fontSize: '3rem',
            color: '#d0d0ce',
            marginBottom: '1.5rem',
          }}
        >
          🌒
        </div>

        {/* Product Info */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          {/* Content ID / Title */}
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 400,
              marginBottom: '0.5rem',
              letterSpacing: '-0.01em',
              wordBreak: 'break-all',
              lineHeight: 1.2,
              color: '#1a1a1a',
            }}
          >
            {contentId}
          </h3>

          {/* Creator */}
          <div
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.75rem',
              color: '#999',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              marginBottom: '1rem',
            }}
          >
            {creatorProfile?.image_url ? (
              <img
                src={creatorProfile.image_url}
                alt={creatorProfile.name || 'Creator'}
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid #e0e0e0',
                }}
              />
            ) : (
              <span style={{ fontSize: '0.7rem' }}>👤</span>
            )}
            {creatorProfile?.name ? (
              <span>{creatorProfile.name}</span>
            ) : (
              <AddressDisplay
                address={creator}
                showCopy={false}
                showExplorer={false}
                className="text-inherit"
              />
            )}
          </div>

          {/* Status Label */}
          {(isCreator || hasPaid) && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.5rem',
                border: '1px solid #e0e0e0',
                backgroundColor: 'rgba(250, 250, 248, 0.8)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: isCreator ? '#D97757' : '#1a1a1a',
                  fontWeight: 500,
                }}
              >
                {isCreator ? 'Created by you' : 'Owned'}
              </span>
            </div>
          )}

          {/* Price Box */}
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              padding: '1rem',
              border: '1px solid #e0e0e0',
              backgroundColor: 'rgba(250, 250, 248, 0.8)',
              marginTop: 'auto',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.7rem',
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem',
              }}
            >
              Price
            </p>
            <div
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '1.25rem',
                fontWeight: 500,
                color: '#D97757',
              }}
            >
              <PriceDisplay priceInPyusd={currentPrice} />
            </div>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.6rem',
                color: '#999',
                marginTop: '0.125rem',
              }}
            >
              PYUSD
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

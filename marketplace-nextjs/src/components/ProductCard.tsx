'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useHasPaid } from '@/hooks/useContract';
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
  creator,
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
        transition: 'transform 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Product Image/Visual */}
      <div
        style={{
          aspectRatio: '4/5',
          background: 'linear-gradient(135deg, #f5f5f3 0%, #e8e8e6 100%)',
          border: '1px solid #e0e0e0',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 200ms ease',
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
            fontSize: '4rem',
            color: '#d0d0ce',
          }}
        >
          🌒
        </div>
      </div>

      {/* Product Info */}
      <div style={{ textAlign: 'center' }}>
        {/* Content ID / Title */}
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 400,
            marginBottom: '0.75rem',
            letterSpacing: '-0.01em',
            wordBreak: 'break-all',
            lineHeight: 1.3,
          }}
        >
          {contentId}
        </h3>

        {/* Price */}
        <div
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1rem',
            fontWeight: 500,
            color: '#D97757',
            marginBottom: '0.75rem',
          }}
        >
          <PriceDisplay priceInPyusd={currentPrice} />
        </div>

        {/* Creator */}
        <div
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.8125rem',
            color: '#999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.75rem' }}>👤</span>
          <AddressDisplay
            address={creator}
            showCopy={false}
            showExplorer={false}
            className="text-inherit"
          />
        </div>

        {/* Status Label (optional, only show on hover) */}
        {(isCreator || hasPaid) && (
          <div
            style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e0e0e0',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
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
      </div>
    </div>
  );
};

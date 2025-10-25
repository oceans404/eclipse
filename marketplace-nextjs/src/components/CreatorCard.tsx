'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_CREATOR_STATS, GET_CREATOR_REVENUE } from '@/lib/queries';
import { AddressDisplay } from './AddressDisplay';
import { pyusdToFormatted } from '@/utils/formatting';
import { CreatorProfile } from '@/lib/db';

interface CreatorCardProps {
  creator: string;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {
  const router = useRouter();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(
    null
  );

  const { data: statsData } = useQuery(GET_CREATOR_STATS, {
    variables: { creator },
  });

  const products = statsData?.products || [];
  const productIds = products.map((p: any) => p.productId);

  const { data: revenueData } = useQuery(GET_CREATOR_REVENUE, {
    variables: { productIds },
    skip: productIds.length === 0,
  });

  // Fetch creator profile from database
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      try {
        const response = await fetch(`/api/creator/${creator}`);
        if (response.ok) {
          const profile = await response.json();
          setCreatorProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching creator profile:', error);
      }
    };

    fetchCreatorProfile();
  }, [creator]);

  const handleClick = () => {
    router.push(`/creator/${creator}`);
  };

  const totalRevenue =
    revenueData?.ProductPaymentService_PaymentReceived?.reduce(
      (sum: string, payment: any) => {
        return (BigInt(sum) + BigInt(payment.amount || '0')).toString();
      },
      '0'
    ) || '0';

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
        const cardElement = e.currentTarget.querySelector(
          '.creator-card-inner'
        ) as HTMLElement;
        if (cardElement) {
          cardElement.style.background =
            'linear-gradient(135deg, #f8f8f6 0%, #efefed 50%, #f5f5f3 100%)';
          cardElement.style.boxShadow =
            '0 8px 25px rgba(217, 151, 87, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) rotate(0deg)';
        e.currentTarget.style.filter = 'brightness(1)';
        const cardElement = e.currentTarget.querySelector(
          '.creator-card-inner'
        ) as HTMLElement;
        if (cardElement) {
          cardElement.style.background =
            'linear-gradient(135deg, #f5f5f3 0%, #e8e8e6 100%)';
          cardElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {/* Card Visual */}
      <div
        className="creator-card-inner"
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
          padding: '2rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#D97757';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e0e0e0';
        }}
      >
        {/* Creator Image */}
        <div
          style={{
            width: '5rem',
            height: '5rem',
            backgroundColor: '#f5f5f3',
            border: creatorProfile?.image_url
              ? '2px solid #e0e0e0'
              : '2px dashed #e0e0e0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            color: '#d0d0ce',
            marginBottom: '2rem',
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

        {/* Creator Name or Label */}
        {creatorProfile ? (
          <h3
            style={{
              fontSize: '1.75rem',
              fontWeight: 300,
              color: '#1a1a1a',
              marginBottom: '0.5rem',
              letterSpacing: '-0.01em',
              textAlign: 'center',
            }}
          >
            {creatorProfile.name}
          </h3>
        ) : (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#999',
              marginBottom: '0.5rem',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            Creator
          </p>
        )}

        {/* Creator Description */}
        {creatorProfile?.description && (
          <p
            style={{
              fontSize: '0.875rem',
              color: '#666',
              textAlign: 'center',
              marginBottom: '0.75rem',
              lineHeight: 1.4,
              maxHeight: '2.8rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              padding: '0 1rem',
            }}
          >
            {creatorProfile.description}
          </p>
        )}

        {/* Address */}
        <div
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            color: '#999',
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <AddressDisplay
            address={creator}
            showCopy={false}
            showExplorer={false}
            className="text-inherit"
          />
        </div>

        {/* Stats Grid */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}
        >
          {/* Products Count */}
          <div
            style={{
              textAlign: 'center',
              padding: '0.75rem',
              border: '1px solid #e0e0e0',
              backgroundColor: 'rgba(250, 250, 248, 0.8)',
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
              Products
            </p>
            <p
              style={{
                fontSize: '1.25rem',
                fontWeight: 300,
                color: '#1a1a1a',
              }}
            >
              {products.length}
            </p>
          </div>

          {/* Revenue */}
          <div
            style={{
              textAlign: 'center',
              padding: '0.75rem',
              border: '1px solid #e0e0e0',
              backgroundColor: 'rgba(250, 250, 248, 0.8)',
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
              Revenue
            </p>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: '#D97757',
              }}
            >
              ${pyusdToFormatted(totalRevenue)}
            </p>
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

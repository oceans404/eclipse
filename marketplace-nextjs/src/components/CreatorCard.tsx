'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_CREATOR_STATS, GET_CREATOR_REVENUE } from '@/lib/queries';
import { AddressDisplay } from './AddressDisplay';
import { pyusdToFormatted } from '@/utils/formatting';

interface CreatorCardProps {
  creator: string;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {
  const router = useRouter();
  const { data: statsData } = useQuery(GET_CREATOR_STATS, {
    variables: { creator },
  });

  const products = statsData?.products || [];
  const productIds = products.map((p: any) => p.productId);

  const { data: revenueData } = useQuery(GET_CREATOR_REVENUE, {
    variables: { productIds },
    skip: productIds.length === 0,
  });

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
        transition: 'transform 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Card Visual */}
      <div
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
          transition: 'border-color 200ms ease',
          padding: '2rem',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#D97757';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e0e0e0';
        }}
      >
        {/* Creator Icon */}
        <div
          style={{
            fontSize: '5rem',
            color: '#d0d0ce',
            marginBottom: '2rem',
          }}
        >
          👤
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
              padding: '1rem',
              border: '1px solid #e0e0e0',
              backgroundColor: 'rgba(250, 250, 248, 0.8)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              Products
            </p>
            <p
              style={{
                fontSize: '1.5rem',
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
              padding: '1rem',
              border: '1px solid #e0e0e0',
              backgroundColor: 'rgba(250, 250, 248, 0.8)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              Revenue
            </p>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                fontWeight: 500,
                color: '#D97757',
              }}
            >
              {pyusdToFormatted(totalRevenue)}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.625rem',
                color: '#999',
                marginTop: '0.25rem',
              }}
            >
              PYUSD
            </p>
          </div>
        </div>
      </div>

      {/* Creator Info */}
      <div style={{ textAlign: 'center' }}>
        {/* Creator Label */}
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#999',
            marginBottom: '0.5rem',
            fontWeight: 500,
          }}
        >
          Creator
        </p>

        {/* Address */}
        <div
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.8125rem',
            color: '#1a1a1a',
          }}
        >
          <AddressDisplay
            address={creator}
            showCopy={false}
            showExplorer={false}
            className="text-inherit"
          />
        </div>
      </div>
    </div>
  );
};

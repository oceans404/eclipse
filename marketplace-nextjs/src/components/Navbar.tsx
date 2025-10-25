'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useBalance } from 'wagmi';
import { useQuery } from '@apollo/client';
import { formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, PYUSD_DECIMALS } from '@/lib/config';
import { GET_PRODUCTS_BY_CREATOR } from '@/lib/queries';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { CreatorProfile } from '@/lib/db';

export function Navbar() {
  const { login, logout, authenticated, user } = usePrivy();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(
    null
  );

  // Get PYUSD balance if user is connected
  const { data: pyusdBalance } = useBalance({
    address: user?.wallet?.address as `0x${string}`,
    token: CONTRACT_ADDRESSES.PYUSD,
    query: {
      enabled: !!user?.wallet?.address,
    },
  });

  // Check if user has created any products
  const { data: createdProductsData } = useQuery(GET_PRODUCTS_BY_CREATOR, {
    variables: { creator: user?.wallet?.address },
    skip: !authenticated || !user?.wallet?.address,
  });

  const hasCreatedProducts = createdProductsData?.Product?.length > 0;

  // Fetch creator profile if user is a creator
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      if (hasCreatedProducts && user?.wallet?.address) {
        try {
          const response = await fetch(`/api/creator/${user.wallet.address}`);
          if (response.ok) {
            const profile = await response.json();
            setCreatorProfile(profile);
          }
        } catch (error) {
          console.error('Error fetching creator profile:', error);
        }
      } else {
        setCreatorProfile(null);
      }
    };

    fetchCreatorProfile();
  }, [hasCreatedProducts, user?.wallet?.address]);

  const formatPyusdBalance = (balance: bigint | undefined) => {
    if (!balance) return '0.00';
    return formatUnits(balance, PYUSD_DECIMALS);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(250, 250, 248, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e0e0e0',
        padding: '.5rem 0',
      }}
    >
      <div
        className="container-eclipse"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontSize: '1.5rem',
            fontWeight: 300,
            letterSpacing: '0.02em',
            textDecoration: 'none',
            color: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>🌒</span>
          <span>Eclipse</span>
        </Link>

        {/* Navigation Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3rem',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.875rem',
          }}
        >
          <Link
            href="/products"
            style={{
              textDecoration: 'none',
              color: '#1a1a1a',
              transition: 'color 200ms',
              fontWeight: 400,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#D97757')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#1a1a1a')}
          >
            Products
          </Link>
          <Link
            href="/creators"
            style={{
              textDecoration: 'none',
              color: '#1a1a1a',
              transition: 'color 200ms',
              fontWeight: 400,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#D97757')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#1a1a1a')}
          >
            Creators
          </Link>
          {authenticated && (
            <>
              <Link
                href="/my-products"
                style={{
                  textDecoration: 'none',
                  color: '#1a1a1a',
                  transition: 'color 200ms',
                  fontWeight: 400,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#D97757')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#1a1a1a')}
              >
                My Products
              </Link>
              <Link
                href="/create"
                style={{
                  textDecoration: 'none',
                  color: '#1a1a1a',
                  transition: 'color 200ms',
                  fontWeight: 400,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#D97757')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#1a1a1a')}
              >
                Create
              </Link>
              {hasCreatedProducts && (
                <Link
                  href={`/creator/${user?.wallet?.address}`}
                  style={{
                    textDecoration: 'none',
                    color: '#1a1a1a',
                    transition: 'color 200ms',
                    fontWeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#D97757';
                    const img = e.currentTarget.querySelector(
                      'img'
                    ) as HTMLElement;
                    if (img) {
                      img.style.borderColor = '#D97757';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#1a1a1a';
                    const img = e.currentTarget.querySelector(
                      'img'
                    ) as HTMLElement;
                    if (img) {
                      img.style.borderColor = '#e0e0e0';
                    }
                  }}
                >
                  {creatorProfile?.image_url && (
                    <img
                      src={creatorProfile.image_url}
                      alt={creatorProfile.name}
                      style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid #e0e0e0',
                        transition: 'border-color 200ms',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  My Profile
                </Link>
              )}
            </>
          )}

          {/* Get PYUSD Link - shows when balance is 0 */}
          {authenticated && pyusdBalance?.value === 0n && (
            <a
              href="https://faucet.paxos.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: '#D97757',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                border: '1px solid #D97757',
                borderRadius: '0.25rem',
                transition: 'all 200ms ease',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#D97757';
                e.currentTarget.style.color = '#fafaf8';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow =
                  '0 2px 8px rgba(217, 151, 87, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#D97757';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Get Eth Sepolia PYUSD
            </a>
          )}

          {/* Wallet Section */}
          {authenticated && user?.wallet?.address ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafaf8',
                borderRadius: '0.25rem',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#D97757';
                e.currentTarget.style.boxShadow =
                  '0 2px 8px rgba(217, 151, 87, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.boxShadow =
                  '0 1px 3px rgba(0, 0, 0, 0.05)';
              }}
            >
              {/* Wallet Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  flexDirection: 'column',
                  padding: '0.5rem 0.75rem',
                  gap: '0.125rem',
                  minWidth: '120px',
                }}
              >
                {/* User Address */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <div
                    style={{
                      width: '0.375rem',
                      height: '0.375rem',
                      backgroundColor: '#D97757',
                      borderRadius: '50%',
                      boxShadow: '0 0 0 1px rgba(217, 151, 87, 0.3)',
                    }}
                  ></div>
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      color: '#1a1a1a',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {user.wallet.address.slice(0, 6)}...
                    {user.wallet.address.slice(-4)}
                  </span>
                </div>

                {/* PYUSD Balance */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.25rem',
                    paddingLeft: '0.75rem',
                  }}
                >
                  <span
                    style={{
                      color: '#999',
                      fontSize: '0.625rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    PYUSD
                  </span>
                  <span
                    style={{
                      color: '#D97757',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    {formatPyusdBalance(pyusdBalance?.value)}
                  </span>
                </div>
              </div>

              {/* Disconnect Button */}
              <button
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms ease',
                  backgroundColor: 'transparent',
                  color: '#999',
                  padding: '0 0.625rem',
                  border: 'none',
                  borderLeft: '1px solid #e0e0e0',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-inter)',
                  cursor: 'pointer',
                  fontWeight: 400,
                  minWidth: '2rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#D97757';
                  e.currentTarget.style.color = '#fafaf8';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Disconnect wallet"
              >
                ×
              </button>
            </div>
          ) : (
            <button onClick={login} className="btn-nav">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

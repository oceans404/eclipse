'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { usePrivy } from '@privy-io/react-auth';
import { GET_ALL_PRODUCTS, GET_USER_OWNED_PRODUCTS } from '@/lib/queries';
import { ProductCard } from '@/components/ProductCard';
import { Navbar } from '@/components/Navbar';
import { CreatorProfile } from '@/lib/db';

export default function ProductsPage() {
  const [sortBy, setSortBy] = useState<'price' | 'newest' | 'oldest'>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [creatorProfiles, setCreatorProfiles] = useState<Map<string, CreatorProfile>>(new Map());
  const { authenticated, user } = usePrivy();

  const { loading, error, data } = useQuery(GET_ALL_PRODUCTS);

  // Get user's owned products to determine ownership
  const { data: ownedData } = useQuery(GET_USER_OWNED_PRODUCTS, {
    variables: { userAddress: user?.wallet?.address },
    skip: !authenticated || !user?.wallet?.address,
  });

  // Fetch creator profiles when products are loaded
  useEffect(() => {
    const fetchCreatorProfiles = async () => {
      if (!data?.Product) return;

      const uniqueCreators = [...new Set(data.Product.map((p: any) => p.creator))];
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
  }, [data]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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
          <p style={{ color: '#666' }}>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            border: '1px solid #e0e0e0',
            padding: '2rem',
            maxWidth: '28rem',
          }}
        >
          <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Error loading products
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

  const products = data?.Product || [];

  // Create sets for owned and created products for quick lookup
  const ownedProductIds = new Set(
    ownedData?.ProductPaymentService_PaymentReceived?.map(
      (payment: any) => payment.productId
    ) || []
  );
  const userAddress = user?.wallet?.address?.toLowerCase();

  const filteredProducts = products
    .filter(
      (product: any) =>
        product.contentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.creator.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => {
      // First, determine ownership status for priority sorting
      const aIsCreated =
        authenticated && userAddress === a.creator.toLowerCase();
      const aIsOwned = ownedProductIds.has(a.productId);
      const aIsAvailable = !aIsCreated && !aIsOwned;

      const bIsCreated =
        authenticated && userAddress === b.creator.toLowerCase();
      const bIsOwned = ownedProductIds.has(b.productId);
      const bIsAvailable = !bIsCreated && !bIsOwned;

      // Priority order: Available > Owned > Created
      if (aIsAvailable && !bIsAvailable) return -1;
      if (!aIsAvailable && bIsAvailable) return 1;
      if (aIsOwned && bIsCreated) return -1;
      if (aIsCreated && bIsOwned) return 1;

      // If same ownership status, sort by user preference
      switch (sortBy) {
        case 'price':
          const priceA = BigInt(a.currentPrice || '0');
          const priceB = BigInt(b.currentPrice || '0');
          return priceA < priceB ? -1 : priceA > priceB ? 1 : 0;
        case 'newest':
          const timeA = BigInt(a.createdAt || '0');
          const timeB = BigInt(b.createdAt || '0');
          return timeB < timeA ? -1 : timeB > timeA ? 1 : 0;
        case 'oldest':
          const timeOldA = BigInt(a.createdAt || '0');
          const timeOldB = BigInt(b.createdAt || '0');
          return timeOldA < timeOldB ? -1 : timeOldA > timeOldB ? 1 : 0;
        default:
          return 0;
      }
    });

  return (
    <>
      <Navbar />

      <div style={{ minHeight: '100vh' }}>
        <div className="container-eclipse" style={{ maxWidth: '1400px' }}>
          {/* Header */}
          <div
            style={{
              textAlign: 'center',
              paddingTop: '12rem',
              paddingBottom: '6rem',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <div className="hero-label">Browse Marketplace</div>
            <h1
              style={{
                fontSize: '4.5rem',
                fontWeight: 300,
                lineHeight: 1.1,
                marginBottom: '2rem',
                letterSpacing: '-0.02em',
              }}
            >
              Private data,
              <br />
              verified by AI.
            </h1>
            <p
              style={{
                fontSize: '1.25rem',
                color: '#666',
                maxWidth: '42rem',
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Each product is encrypted and verifiable through our private AI
              agent before purchase.
            </p>
          </div>

          {/* Filters Section */}
          <div
            style={{
              padding: '3rem 0',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '2rem',
                flexWrap: 'wrap',
              }}
            >
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                Showing {filteredProducts.length} product
                {filteredProducts.length !== 1 ? 's' : ''}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '2rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <input
                    type="text"
                    placeholder="Search products or creators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#fafaf8',
                      color: '#1a1a1a',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-inter)',
                      outline: 'none',
                      transition: 'border-color 200ms',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#D97757')}
                    onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                  />
                </div>

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <span
                    style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    Sort by
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#fafaf8',
                      fontSize: '0.875rem',
                      color: '#1a1a1a',
                      fontFamily: 'var(--font-inter)',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'border-color 200ms',
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = '#D97757')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = '#e0e0e0')
                    }
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price">Price: Low to High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Ownership Legend - Only show when wallet is connected */}
          {authenticated && (
            <div
              style={{
                padding: '2rem 0',
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <h3
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#666',
                    marginBottom: '1.5rem',
                    fontFamily: 'var(--font-inter)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Product Status
                </h3>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '3rem',
                    fontSize: '0.875rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        width: '0.75rem',
                        height: '0.75rem',
                        backgroundColor: '#D97757',
                        borderRadius: '50%',
                      }}
                    ></div>
                    <span
                      style={{ color: '#666', fontFamily: 'var(--font-inter)' }}
                    >
                      Created by you
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        width: '0.75rem',
                        height: '0.75rem',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '50%',
                      }}
                    ></div>
                    <span
                      style={{ color: '#666', fontFamily: 'var(--font-inter)' }}
                    >
                      Owned by you
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        width: '0.75rem',
                        height: '0.75rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '50%',
                      }}
                    ></div>
                    <span
                      style={{ color: '#666', fontFamily: 'var(--font-inter)' }}
                    >
                      Available to purchase
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div style={{ padding: '6rem 0 8rem' }}>
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '8rem 0' }}>
                <div
                  style={{
                    fontSize: '4.5rem',
                    marginBottom: '2rem',
                    opacity: 0.2,
                  }}
                >
                  🌒
                </div>
                <h3
                  style={{
                    fontSize: '3rem',
                    fontWeight: 300,
                    marginBottom: '1rem',
                  }}
                >
                  No products found
                </h3>
                <p style={{ fontSize: '1.125rem', color: '#666' }}>
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Be the first to add a product'}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '4rem 3rem',
                }}
              >
                {filteredProducts.map((product: any) => (
                  <ProductCard
                    key={product.productId}
                    productId={product.productId}
                    contentId={product.contentId}
                    currentPrice={product.currentPrice}
                    creator={product.creator}
                    creatorProfile={creatorProfiles.get(product.creator) || null}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add keyframes for loading spinner */}
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
    </>
  );
}

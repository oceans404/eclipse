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
  const [creatorProfiles, setCreatorProfiles] = useState<
    Map<string, CreatorProfile>
  >(new Map());
  const [productTitles, setProductTitles] = useState<Map<string, string>>(
    new Map()
  );
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

      const uniqueCreators = [
        ...new Set(data.Product.map((p: any) => p.creator)),
      ] as string[];
      const profiles = new Map<string, CreatorProfile>();

      await Promise.all(
        uniqueCreators.map(async (address) => {
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

  // Fetch product titles for search functionality
  useEffect(() => {
    const fetchProductTitles = async () => {
      if (!data?.Product) return;

      const titles = new Map<string, string>();

      await Promise.all(
        data.Product.map(async (product: any) => {
          try {
            const response = await fetch(
              `/api/asset/${encodeURIComponent(product.contentId)}`
            );
            if (response.ok) {
              const metadata = await response.json();
              if (metadata.title) {
                titles.set(product.contentId, metadata.title);
              }
            }
          } catch (error) {
            console.error(
              `Failed to fetch title for ${product.contentId}:`,
              error
            );
          }
        })
      );

      setProductTitles(titles);
    };

    fetchProductTitles();
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
    .filter((product: any) => {
      const searchLower = searchTerm.toLowerCase();

      // Search by product title
      const productTitle = productTitles.get(product.contentId) || '';
      if (productTitle.toLowerCase().includes(searchLower)) return true;

      // Search by creator address
      if (product.creator.toLowerCase().includes(searchLower)) return true;

      // Search by creator name
      const creatorProfile = creatorProfiles.get(product.creator);
      if (creatorProfile?.name?.toLowerCase().includes(searchLower))
        return true;

      return false;
    })
    .sort((a: any, b: any) => {
      // Sort by user preference
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
              paddingTop: '6rem',
              paddingBottom: '.5rem',
            }}
          >
            <div className="hero-label" style={{ marginBottom: '.5rem' }}>
              Browse Marketplace
            </div>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 300,
                lineHeight: 1.1,
                marginBottom: '1rem',
                letterSpacing: '-0.02em',
              }}
            >
              Private data, verified by AI.
            </h1>
            <p
              style={{
                fontSize: '1rem',
                color: '#666',
                maxWidth: '36rem',
                margin: '0 auto',
                lineHeight: 1.5,
              }}
            >
              Each product is encrypted and verifiable through our private AI
              agent before purchase.
            </p>
          </div>

          {/* Filters Section */}
          <div
            style={{
              padding: '1.5rem 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search products or creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem 0.625rem 2.5rem',
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#fafaf8',
                    color: '#1a1a1a',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--font-inter)',
                    outline: 'none',
                    transition: 'all 200ms',
                    borderRadius: '6px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D97757';
                    e.target.style.backgroundColor = '#fff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.backgroundColor = '#fafaf8';
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#999',
                    fontSize: '0.875rem',
                    pointerEvents: 'none',
                  }}
                >
                  🔍
                </div>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  padding: '0.625rem 2.5rem 0.625rem 1rem',
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fafaf8',
                  fontSize: '0.8125rem',
                  color: '#1a1a1a',
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 200ms',
                  borderRadius: '6px',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.7rem center',
                  backgroundSize: '1rem',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#D97757';
                  e.currentTarget.style.backgroundColor = '#fff';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.backgroundColor = '#fafaf8';
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price">Price: Low to High</option>
              </select>

              <div
                style={{
                  padding: '0.375rem 0.875rem',
                  backgroundColor: '#f5f5f3',
                  border: '1px solid #e0e0e0',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  color: '#666',
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div style={{ padding: '2rem 0 4rem' }}>
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <div
                  style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    opacity: 0.2,
                  }}
                >
                  🌒
                </div>
                <h3
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 300,
                    marginBottom: '0.5rem',
                  }}
                >
                  No products found
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>
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
                  gap: '2rem',
                }}
              >
                {filteredProducts.map((product: any) => (
                  <ProductCard
                    key={product.productId}
                    productId={product.productId}
                    contentId={product.contentId}
                    currentPrice={product.currentPrice}
                    creator={product.creator}
                    creatorProfile={
                      creatorProfiles.get(product.creator) || null
                    }
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

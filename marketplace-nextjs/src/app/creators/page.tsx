'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_CREATORS } from '@/lib/queries';
import { CreatorCard } from '@/components/CreatorCard';
import { Navbar } from '@/components/Navbar';
import { CreatorProfile } from '@/lib/db';

export default function CreatorsPage() {
  const { loading, error, data } = useQuery(GET_ALL_CREATORS);
  const [creatorProfiles, setCreatorProfiles] = useState<{
    [address: string]: CreatorProfile;
  }>({});
  const [profilesLoading, setProfilesLoading] = useState(true);

  const creators = (
    data?.Product
      ? [
          ...new Set(
            data.Product.map((product: any) => product.creator as string)
          ),
        ]
      : []
  ) as string[];

  // Fetch all creator profiles
  useEffect(() => {
    const fetchCreatorProfiles = async () => {
      if (creators.length === 0) {
        setProfilesLoading(false);
        return;
      }

      try {
        const profilePromises = creators.map(async (creator) => {
          try {
            const response = await fetch(`/api/creator/${creator}`);
            if (response.ok) {
              const profile = await response.json();
              return { address: creator, profile };
            }
          } catch (error) {
            console.error(`Error fetching profile for ${creator}:`, error);
          }
          return { address: creator, profile: null };
        });

        const results = await Promise.all(profilePromises);
        const profilesMap: { [address: string]: CreatorProfile } = {};

        results.forEach(({ address, profile }) => {
          if (profile) {
            profilesMap[address] = profile;
          }
        });

        setCreatorProfiles(profilesMap);
      } catch (error) {
        console.error('Error fetching creator profiles:', error);
      } finally {
        setProfilesLoading(false);
      }
    };

    fetchCreatorProfiles();
  }, [creators.length]);

  // Sort creators: those with profiles first, then by creation date
  const sortedCreators = [...creators].sort((a, b) => {
    const aHasProfile = creatorProfiles[a] ? 1 : 0;
    const bHasProfile = creatorProfiles[b] ? 1 : 0;

    // First sort by profile existence (profiles first)
    if (aHasProfile !== bHasProfile) {
      return bHasProfile - aHasProfile;
    }

    // Then sort alphabetically by address as fallback
    return a.localeCompare(b);
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
              margin: '0 auto 1rem',
            }}
          ></div>
          <p style={{ color: '#666' }}>Loading creators...</p>
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
            Error loading creators
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
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
            <div
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#D97757',
                marginBottom: '2.5rem',
                fontWeight: 500,
              }}
            >
              Creator Directory
            </div>
            <h1
              style={{
                fontSize: '4.5rem',
                fontWeight: 300,
                lineHeight: 1.1,
                marginBottom: '2rem',
                letterSpacing: '-0.02em',
              }}
            >
              Meet the creators.
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
              The talented individuals powering Eclipse marketplace with private
              data.
            </p>
          </div>

          {/* Creators Grid or Empty State */}
          <div style={{ padding: '6rem 0 8rem' }}>
            {creators.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '8rem 0' }}>
                <div
                  style={{
                    fontSize: '4.5rem',
                    marginBottom: '2rem',
                    opacity: 0.2,
                  }}
                >
                  👤
                </div>
                <h3
                  style={{
                    fontSize: '3rem',
                    fontWeight: 300,
                    marginBottom: '1rem',
                  }}
                >
                  No creators yet
                </h3>
                <p style={{ fontSize: '1.125rem', color: '#666' }}>
                  Be the first to create and sell content
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
                {sortedCreators.map((creator: string) => (
                  <CreatorCard key={creator} creator={creator} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

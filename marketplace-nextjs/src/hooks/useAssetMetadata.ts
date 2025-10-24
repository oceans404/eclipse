'use client';

import { useState, useEffect } from 'react';

interface AssetMetadata {
  title: string;
  description: string;
  contentId: string;
  mimeType?: string;
  fileSize?: number;
  // Add other metadata fields as needed
}

interface UseAssetMetadataResult {
  metadata: AssetMetadata | null;
  loading: boolean;
  error: string | null;
  // Helper functions for fallback display
  getTitle: (fallbackContentId?: string) => string;
  getDescription: () => string;
}

export function useAssetMetadata(contentId: string | null): UseAssetMetadataResult {
  const [metadata, setMetadata] = useState<AssetMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssetMetadata = async () => {
      if (!contentId) {
        setMetadata(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/asset/${encodeURIComponent(contentId)}`);
        if (response.ok) {
          const data = await response.json();
          setMetadata(data);
        } else {
          // Don't treat this as an error - just means no metadata available
          setMetadata(null);
        }
      } catch (err) {
        console.error('Failed to fetch asset metadata:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
        setMetadata(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAssetMetadata();
  }, [contentId]);

  const getTitle = (fallbackContentId?: string): string => {
    if (loading) return 'Loading title...';
    if (metadata?.title) return metadata.title;
    return fallbackContentId || contentId || 'Untitled Product';
  };

  const getDescription = (): string => {
    if (loading) return 'Loading description...';
    if (metadata?.description) return metadata.description;
    return 'Private data stored securely with Nillion\'s privacy infrastructure. Content is encrypted and verifiable through AI agents.';
  };

  return {
    metadata,
    loading,
    error,
    getTitle,
    getDescription,
  };
}
'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface ContentViewerProps {
  contentId: string;
  productId: string;
  mimeType?: string;
}

export function ContentViewer({ contentId, productId, mimeType }: ContentViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [contentBlob, setContentBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { user } = usePrivy();

  const handleDecryptAndView = async () => {
    if (content && isVisible) {
      // Toggle visibility if already decrypted
      setIsVisible(!isVisible);
      return;
    }

    if (!user?.wallet?.address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/request-decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          requesterAddress: user.wallet.address,
          productId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to decrypt content');
      }

      // Get the content type from response
      const contentType = response.headers.get('content-type') || mimeType || 'text/plain';
      
      // Handle different content types
      if (contentType.startsWith('image/')) {
        // For images, create a blob and object URL
        const blob = await response.blob();
        setContentBlob(blob);
        const objectUrl = URL.createObjectURL(blob);
        setContent(objectUrl);
      } else {
        // For text content, read as text
        const decryptedContent = await response.text();
        setContent(decryptedContent);
      }
      setIsVisible(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decrypt content');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!user?.wallet?.address) {
      setError('Wallet not connected');
      return;
    }

    try {
      const response = await fetch('/api/request-decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          requesterAddress: user.wallet.address,
          productId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to download content');
      }

      // Get the content disposition header for filename
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'decrypted-content.txt';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download content');
    }
  };

  return (
    <div
      style={{
        padding: '2rem',
        border: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f3',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.875rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#666',
            fontWeight: 500,
          }}
        >
          Private Content
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleDecryptAndView}
            disabled={loading}
            style={{
              backgroundColor: isVisible && content ? '#1a1a1a' : '#D97757',
              color: '#fafaf8',
              border: 'none',
              padding: '0.5rem 1rem',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 200ms',
            }}
          >
            {loading ? 'Decrypting...' : isVisible && content ? 'Hide Content' : 'View Content'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #e0e0e0',
              padding: '0.5rem 1rem',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'border-color 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D97757';
              e.currentTarget.style.color = '#D97757';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.color = '#666';
            }}
          >
            Download
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            border: '1px solid #e0e0e0',
            backgroundColor: '#fafaf8',
            marginBottom: '1rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.875rem',
              color: '#D97757',
              margin: 0,
            }}
          >
            Error: {error}
          </p>
        </div>
      )}

      {isVisible && content && (
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid #e0e0e0',
            backgroundColor: '#fafaf8',
            maxHeight: '600px',
            overflowY: 'auto',
          }}
        >
          {contentBlob && contentBlob.type.startsWith('image/') ? (
            <img
              src={content}
              alt="Decrypted content"
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                margin: '0 auto',
              }}
            />
          ) : (
            <pre
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#1a1a1a',
              }}
            >
              {content}
            </pre>
          )}
        </div>
      )}

      {!isVisible && !content && (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            border: '2px dashed #e0e0e0',
            backgroundColor: '#fafaf8',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>
            🔒
          </div>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.875rem',
              color: '#666',
              margin: 0,
            }}
          >
            Click "View Content" to decrypt and display the private data
          </p>
        </div>
      )}
    </div>
  );
}
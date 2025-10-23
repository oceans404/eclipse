'use client';

import { useState } from 'react';
import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

export default function CreateProductPage() {
  const { authenticated, user } = usePrivy();
  const { addProduct, isLoading, hash, error } = usePrivyWallet();
  const router = useRouter();

  const [formData, setFormData] = useState({
    productId: '',
    price: '',
    contentId: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  // Helper function to get user-friendly error messages
  const getErrorMessage = (error: any) => {
    const message = error?.message || '';

    console.error('Full error object:', error);
    console.error('Error message:', message);

    if (message.includes('User rejected') || message.includes('User denied')) {
      return 'Transaction was cancelled by user';
    }

    if (message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }

    if (message.includes('ProductAlreadyExists')) {
      return 'Product ID already exists - please choose a different ID';
    }

    if (message.includes('InvalidPrice')) {
      return 'Invalid price - please enter a valid amount';
    }

    if (message.includes('InvalidContentId')) {
      return 'Invalid content ID - please enter a description';
    }

    if (message.includes('execution reverted')) {
      return 'Contract execution failed - check if product ID already exists';
    }

    if (process.env.NODE_ENV === 'development') {
      return `Transaction failed: ${message.slice(0, 100)}${
        message.length > 100 ? '...' : ''
      }`;
    }

    return 'Transaction failed - please try again';
  };

  // Redirect if transaction is confirmed
  React.useEffect(() => {
    if (isConfirmed && submitted) {
      setRedirectCountdown(3);

      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            window.location.href = '/products';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isConfirmed, submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authenticated || !user?.wallet?.address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!formData.productId || !formData.price || !formData.contentId) {
      alert('Please fill in all fields');
      return;
    }

    const productIdNum = parseInt(formData.productId);
    if (isNaN(productIdNum) || productIdNum <= 0) {
      alert('Product ID must be a positive number');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Price must be a positive number');
      return;
    }

    try {
      const txHash = await addProduct(
        productIdNum,
        formData.price,
        formData.contentId
      );
      setSubmitted(true);
      console.log('Product creation transaction:', txHash);

      setTimeout(() => {
        setIsConfirmed(true);
      }, 5000);
    } catch (err) {
      console.error('Error creating product:', err);
      setSubmitted(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          style={{
            textAlign: 'center',
            maxWidth: '32rem',
            padding: '3rem',
            border: '1px solid #e0e0e0',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '2rem', opacity: 0.3 }}>
            🔒
          </div>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 300,
              marginBottom: '1rem',
            }}
          >
            Access required
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#666',
              marginBottom: '2rem',
            }}
          >
            Please connect your wallet to create products
          </p>
          <button
            onClick={() => (window.location.href = '/products')}
            className="btn-primary"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        <div
          className="container-eclipse"
          style={{
            maxWidth: '900px',
            paddingTop: '10rem',
            paddingBottom: '8rem',
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: 'center',
              paddingBottom: '4rem',
              borderBottom: '1px solid #e0e0e0',
              marginBottom: '4rem',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#D97757',
                marginBottom: '2rem',
                fontWeight: 500,
              }}
            >
              Add to Marketplace
            </div>
            <h1
              style={{
                fontSize: '4rem',
                fontWeight: 300,
                lineHeight: 1.1,
                marginBottom: '1.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              Create new product.
            </h1>
            <p
              style={{
                fontSize: '1.125rem',
                color: '#666',
                maxWidth: '36rem',
                margin: '0 auto',
              }}
            >
              Add your encrypted content to Eclipse
            </p>
          </div>

          {/* Form Container */}
          <div
            style={{
              border: '1px solid #e0e0e0',
              padding: '3rem',
            }}
          >
            {/* Transaction Status */}
            {(submitted || error) && (
              <div
                style={{
                  marginBottom: '2rem',
                  padding: '1.5rem',
                  border: '1px solid #e0e0e0',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.875rem',
                }}
              >
                {isLoading && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        animation: 'spin 1s linear infinite',
                        borderRadius: '50%',
                        height: '1.25rem',
                        width: '1.25rem',
                        borderBottom: '2px solid #D97757',
                      }}
                    ></div>
                    <span>Submitting transaction...</span>
                  </div>
                )}
                {submitted && !isLoading && !isConfirmed && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        animation: 'spin 1s linear infinite',
                        borderRadius: '50%',
                        height: '1.25rem',
                        width: '1.25rem',
                        borderBottom: '2px solid #D97757',
                      }}
                    ></div>
                    <span>Confirming transaction...</span>
                  </div>
                )}
                {isConfirmed && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span>✓</span>
                      <span>
                        Product created successfully!
                        {redirectCountdown > 0 &&
                          ` Redirecting in ${redirectCountdown}...`}
                      </span>
                    </div>
                    <button
                      onClick={() => (window.location.href = '/products')}
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.8125rem',
                        color: '#D97757',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Go to products page now →
                    </button>
                  </div>
                )}
                {error && (
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                      Transaction failed:
                    </div>
                    <div style={{ color: '#666' }}>
                      {getErrorMessage(error)}
                    </div>
                  </div>
                )}
                {hash && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#D97757',
                        textDecoration: 'none',
                        borderBottom: '1px solid #D97757',
                        paddingBottom: '0.125rem',
                      }}
                    >
                      View on Etherscan →
                    </a>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Product ID */}
              <div style={{ marginBottom: '2rem' }}>
                <label
                  htmlFor="productId"
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#1a1a1a',
                    marginBottom: '0.75rem',
                  }}
                >
                  Product ID *
                </label>
                <input
                  type="number"
                  id="productId"
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  placeholder="Enter a unique product ID"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '1px solid #e0e0e0',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'border-color 200ms',
                  }}
                  required
                  disabled={isLoading || isConfirmed}
                  onFocus={(e) => (e.target.style.borderColor = '#D97757')}
                  onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                />
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.8125rem',
                    color: '#999',
                    marginTop: '0.5rem',
                  }}
                >
                  Choose a unique number to identify your product
                </p>
              </div>

              {/* Price */}
              <div style={{ marginBottom: '2rem' }}>
                <label
                  htmlFor="price"
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#1a1a1a',
                    marginBottom: '0.75rem',
                  }}
                >
                  Price (PYUSD) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '1px solid #e0e0e0',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'border-color 200ms',
                  }}
                  required
                  disabled={isLoading || isConfirmed}
                  onFocus={(e) => (e.target.style.borderColor = '#D97757')}
                  onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                />
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.8125rem',
                    color: '#999',
                    marginTop: '0.5rem',
                  }}
                >
                  Set your product price in PYUSD
                </p>
              </div>

              {/* Content ID */}
              <div style={{ marginBottom: '2rem' }}>
                <label
                  htmlFor="contentId"
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#1a1a1a',
                    marginBottom: '0.75rem',
                  }}
                >
                  Content ID / Description *
                </label>
                <textarea
                  id="contentId"
                  name="contentId"
                  value={formData.contentId}
                  onChange={handleChange}
                  placeholder="Enter content ID or description"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '1px solid #e0e0e0',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'border-color 200ms',
                    resize: 'vertical',
                  }}
                  required
                  disabled={isLoading || isConfirmed}
                  onFocus={(e) => (e.target.style.borderColor = '#D97757')}
                  onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                />
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.8125rem',
                    color: '#999',
                    marginTop: '0.5rem',
                  }}
                >
                  Describe your content or provide a content identifier
                </p>
              </div>

              {/* Creator Info */}
              <div
                style={{
                  padding: '1.5rem',
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#f5f5f3',
                  marginBottom: '2rem',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#1a1a1a',
                    marginBottom: '0.75rem',
                  }}
                >
                  Creator Information
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.8125rem',
                    color: '#666',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>Your Address:</span>{' '}
                  <span style={{ wordBreak: 'break-all' }}>
                    {user?.wallet?.address}
                  </span>
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.75rem',
                    color: '#999',
                  }}
                >
                  You will receive payments directly to this address
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isConfirmed}
                className="btn-primary"
                style={{
                  width: '100%',
                  opacity: isLoading || isConfirmed ? 0.6 : 1,
                  cursor: isLoading || isConfirmed ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        animation: 'spin 1s linear infinite',
                        borderRadius: '50%',
                        height: '1.25rem',
                        width: '1.25rem',
                        borderBottom: '2px solid #fafaf8',
                      }}
                    ></div>
                    <span>Submitting...</span>
                  </div>
                ) : isConfirmed ? (
                  'Product Created ✓'
                ) : (
                  'Create Product'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Loading spinner animation */}
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

'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { CreatorProfile } from '@/lib/db';
import FileUpload from '@/components/FileUpload';

export default function CreateProductPage() {
  const { authenticated, user } = usePrivy();
  const { addProduct, isLoading, hash, error } = usePrivyWallet();
  const router = useRouter();

  // Profile setup state
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(
    null
  );
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    description: '',
    image_url: '',
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Product creation state
  const [formData, setFormData] = useState({
    productId: '',
    price: '',
    title: '',
    description: '',
    contentId: '',
  });

  // File upload state
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadStep, setUploadStep] = useState<
    'upload' | 'create' | 'completed'
  >('upload');

  const [submitted, setSubmitted] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  // Check if user has a creator profile
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      if (!authenticated || !user?.wallet?.address) {
        setProfileLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/creator/${user.wallet.address}`);
        if (response.ok) {
          const profile = await response.json();
          setCreatorProfile(profile);
        } else if (response.status === 404) {
          // Profile doesn't exist, show profile form
          setShowProfileForm(true);
        }
      } catch (error) {
        console.error('Error fetching creator profile:', error);
        setShowProfileForm(true); // Default to showing form on error
      } finally {
        setProfileLoading(false);
      }
    };

    fetchCreatorProfile();
  }, [authenticated, user?.wallet?.address]);

  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);
    setProfileError('');

    if (!user?.wallet?.address) {
      setProfileError('Wallet address not found');
      setProfileSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/creator/${user.wallet.address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }

      const profile = await response.json();
      setCreatorProfile(profile);
      setShowProfileForm(false);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'Failed to create profile'
      );
    } finally {
      setProfileSubmitting(false);
    }
  };

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
    if (isConfirmed && submitted && formData.productId) {
      setRedirectCountdown(3);

      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            window.location.href = `/product/${formData.productId}`;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isConfirmed, submitted, formData.productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authenticated || !user?.wallet?.address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!formData.price || !formData.title || !formData.description) {
      alert('Please fill in all fields');
      return;
    }

    if (!uploadResult || !formData.contentId) {
      alert('Please upload a file first');
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
      setUploadStep('completed');

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

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfileFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Fetch next available product ID
  const fetchNextProductId = async () => {
    try {
      const response = await fetch('/api/next-product-id');
      if (response.ok) {
        const data = await response.json();
        return data.nextProductId;
      }
    } catch (error) {
      console.error('Error fetching next product ID:', error);
    }
    // Fallback: return a reasonable default
    return 10;
  };

  // Handle successful file upload
  const handleUploadSuccess = async (result: any) => {
    setUploadResult(result);
    setUploadError('');

    // Auto-generate next product ID
    const nextProductId = await fetchNextProductId();

    setFormData((prev) => ({
      ...prev,
      productId: nextProductId.toString(),
      contentId: result.contentId,
    }));
    setUploadStep('create');
  };

  // Handle upload error
  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadResult(null);
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

  if (profileLoading) {
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
          <p style={{ color: '#666' }}>Loading creator information...</p>
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        <div
          className="container-eclipse"
          style={{
            maxWidth: '800px',
            paddingTop: '8rem',
          }}
        >
          {/* Compact Header */}
          <div
            style={{
              textAlign: 'center',
              paddingBottom: '2rem',
              borderBottom: '1px solid #e0e0e0',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#D97757',
                marginBottom: '1rem',
                fontWeight: 500,
              }}
            >
              {showProfileForm ? 'Creator Setup' : 'Add to Marketplace'}
            </div>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 300,
                lineHeight: 1.1,
                marginBottom: '0.75rem',
                letterSpacing: '-0.02em',
              }}
            >
              {showProfileForm ? 'Create your profile.' : 'Create new product.'}
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#666',
                maxWidth: '32rem',
                margin: '0 auto',
              }}
            >
              {showProfileForm
                ? 'Set up your creator profile before adding products'
                : 'Add your encrypted content to Eclipse'}
            </p>
          </div>

          {/* Form Container */}
          <div
            style={{
              border: '1px solid #e0e0e0',
              padding: '2rem',
            }}
          >
            {showProfileForm ? (
              // Profile Setup Form
              <>
                <div
                  style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#f5f5f3',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#1a1a1a',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Step 1: Create Your Profile
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      color: '#666',
                      margin: 0,
                    }}
                  >
                    Set up your creator profile before adding products to the
                    marketplace.
                  </p>
                </div>

                {profileError && (
                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      fontSize: '0.875rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {profileError}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit}>
                  {/* Profile Name */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      htmlFor="name"
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: '#1a1a1a',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Display Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profileFormData.name}
                      onChange={handleProfileChange}
                      placeholder="Enter your display name"
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        border: '1px solid #e0e0e0',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 200ms',
                      }}
                      required
                      disabled={profileSubmitting}
                      onFocus={(e) => (e.target.style.borderColor = '#D97757')}
                      onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                    />
                  </div>

                  {/* Profile Description */}
                  <div style={{ marginBottom: '2rem' }}>
                    <label
                      htmlFor="description"
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#1a1a1a',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={profileFormData.description}
                      onChange={handleProfileChange}
                      placeholder="Tell others about yourself and your expertise"
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
                      disabled={profileSubmitting}
                      onFocus={(e) => (e.target.style.borderColor = '#D97757')}
                      onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                    />
                  </div>

                  {/* Profile Image URL */}
                  <div style={{ marginBottom: '2rem' }}>
                    <label
                      htmlFor="image_url"
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#1a1a1a',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Profile Image URL
                    </label>
                    <input
                      type="url"
                      id="image_url"
                      name="image_url"
                      value={profileFormData.image_url}
                      onChange={handleProfileChange}
                      placeholder="https://example.com/your-profile-image.jpg"
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        border: '1px solid #e0e0e0',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 200ms',
                      }}
                      disabled={profileSubmitting}
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
                      Optional: URL to your profile picture
                    </p>
                  </div>

                  {/* Creator Address Info */}
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
                      Creator Address
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
                      This address will be associated with your creator profile
                    </p>
                  </div>

                  {/* Submit Profile Button */}
                  <button
                    type="submit"
                    disabled={
                      profileSubmitting ||
                      !profileFormData.name.trim() ||
                      !profileFormData.description.trim()
                    }
                    className="btn-primary"
                    style={{
                      width: '100%',
                      opacity:
                        profileSubmitting ||
                        !profileFormData.name.trim() ||
                        !profileFormData.description.trim()
                          ? 0.6
                          : 1,
                      cursor:
                        profileSubmitting ||
                        !profileFormData.name.trim() ||
                        !profileFormData.description.trim()
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {profileSubmitting ? (
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
                        <span>Creating Profile...</span>
                      </div>
                    ) : (
                      'Create Profile & Continue'
                    )}
                  </button>
                </form>
              </>
            ) : (
              // Product Creation Form with File Upload
              <>
                {/* Step Indicator */}
                <div
                  style={{
                    marginBottom: '2rem',
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#f5f5f3',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '50%',
                        backgroundColor:
                          uploadStep === 'upload'
                            ? '#D97757'
                            : uploadResult
                            ? '#22c55e'
                            : '#e0e0e0',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {uploadResult ? '✓' : '1'}
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: uploadResult
                          ? '#22c55e'
                          : uploadStep === 'upload'
                          ? '#D97757'
                          : '#666',
                      }}
                    >
                      Upload & Encrypt File
                    </span>

                    <div
                      style={{
                        width: '2rem',
                        height: '1px',
                        backgroundColor: uploadResult ? '#22c55e' : '#e0e0e0',
                      }}
                    />

                    <div
                      style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '50%',
                        backgroundColor:
                          uploadStep === 'create'
                            ? '#D97757'
                            : uploadStep === 'completed'
                            ? '#22c55e'
                            : '#e0e0e0',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {uploadStep === 'completed' ? '✓' : '2'}
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color:
                          uploadStep === 'completed'
                            ? '#22c55e'
                            : uploadStep === 'create'
                            ? '#D97757'
                            : '#666',
                      }}
                    >
                      Create Product Listing
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      color: '#666',
                      margin: 0,
                    }}
                  >
                    {uploadStep === 'upload' &&
                      'First, upload your file to encrypt and store it securely'}
                    {uploadStep === 'create' &&
                      'Now create your product listing on the blockchain'}
                    {uploadStep === 'completed' &&
                      'Your product has been created successfully!'}
                  </p>
                </div>

                {/* Upload Error */}
                {uploadError && (
                  <div
                    style={{
                      marginBottom: '2rem',
                      padding: '1rem',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      fontSize: '0.875rem',
                    }}
                  >
                    Upload Error: {uploadError}
                  </div>
                )}

                {/* Upload Success */}
                {uploadResult && (
                  <div
                    style={{
                      marginBottom: '2rem',
                      padding: '1rem',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#16a34a',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                      ✓ File encrypted and uploaded successfully!
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                      Content ID: {uploadResult.contentId}
                    </div>
                  </div>
                )}

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
                          onClick={() =>
                            (window.location.href = `/product/${formData.productId}`)
                          }
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
                          View your product now →
                        </button>
                      </div>
                    )}
                    {error && (
                      <div>
                        <div
                          style={{ fontWeight: 500, marginBottom: '0.5rem' }}
                        >
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
                  {/* File Upload Section */}
                  {uploadStep === 'upload' && (
                    <>
                      {/* Title */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label
                          htmlFor="title"
                          style={{
                            display: 'block',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#1a1a1a',
                            marginBottom: '0.75rem',
                          }}
                        >
                          Product Title *
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          placeholder="Enter a descriptive title for your content"
                          style={{
                            width: '100%',
                            padding: '0.625rem',
                            border: '1px solid #e0e0e0',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.875rem',
                            outline: 'none',
                            transition: 'border-color 200ms',
                          }}
                          required
                          onFocus={(e) =>
                            (e.target.style.borderColor = '#D97757')
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = '#e0e0e0')
                          }
                        />
                      </div>

                      {/* Description */}
                      <div style={{ marginBottom: '2rem' }}>
                        <label
                          htmlFor="description"
                          style={{
                            display: 'block',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#1a1a1a',
                            marginBottom: '0.75rem',
                          }}
                        >
                          Description *
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Describe your content - what will buyers receive?"
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '0.875rem',
                            border: '1px solid #e0e0e0',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.875rem',
                            outline: 'none',
                            transition: 'border-color 200ms',
                            resize: 'vertical',
                          }}
                          required
                          onFocus={(e) =>
                            (e.target.style.borderColor = '#D97757')
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = '#e0e0e0')
                          }
                        />
                      </div>

                      {/* File Upload */}
                      <FileUpload
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        productId={formData.productId || 'temp'}
                        owner={user?.wallet?.address || ''}
                        title={formData.title}
                        description={formData.description}
                        disabled={!formData.title || !formData.description}
                      />

                      {!formData.title || !formData.description ? (
                        <div
                          style={{
                            padding: '1rem',
                            backgroundColor: '#f5f5f3',
                            border: '1px solid #e0e0e0',
                            fontSize: '0.875rem',
                            color: '#666',
                          }}
                        >
                          Please fill in the title and description before
                          uploading your file.
                        </div>
                      ) : null}
                    </>
                  )}

                  {/* Product Details Section */}
                  {uploadStep === 'create' && (
                    <>
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
                            padding: '0.625rem',
                            border: '1px solid #e0e0e0',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.875rem',
                            outline: 'none',
                            transition: 'border-color 200ms',
                          }}
                          required
                          disabled={isLoading || isConfirmed}
                          onFocus={(e) =>
                            (e.target.style.borderColor = '#D97757')
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = '#e0e0e0')
                          }
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
                    </>
                  )}

                  {/* Creator Info */}
                  {uploadStep === 'create' && (
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
                  )}

                  {/* Submit Button */}
                  {uploadStep === 'create' && (
                    <button
                      type="submit"
                      disabled={isLoading || isConfirmed}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        opacity: isLoading || isConfirmed ? 0.6 : 1,
                        cursor:
                          isLoading || isConfirmed ? 'not-allowed' : 'pointer',
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
                  )}
                </form>
              </>
            )}
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

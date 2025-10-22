'use client';

import { useState } from 'react';
import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useRouter } from 'next/navigation';

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
    
    // Log full error for debugging
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
    
    // In development, show more details
    if (process.env.NODE_ENV === 'development') {
      return `Transaction failed: ${message.slice(0, 100)}${message.length > 100 ? '...' : ''}`;
    }
    
    // For other errors, show a generic message
    return 'Transaction failed - please try again';
  };

  // Redirect to home if transaction is confirmed
  React.useEffect(() => {
    if (isConfirmed && submitted) {
      setRedirectCountdown(3);
      
      const interval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Use window.location instead of router.push to avoid React conflicts
            window.location.href = '/';
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

    // Validate product ID is a positive number
    const productIdNum = parseInt(formData.productId);
    if (isNaN(productIdNum) || productIdNum <= 0) {
      alert('Product ID must be a positive number');
      return;
    }

    // Validate price is a positive number
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Price must be a positive number');
      return;
    }

    console.log('Creating product with:', {
      productId: productIdNum,
      price: formData.price,
      contentId: formData.contentId,
      creator: user.wallet.address
    });

    try {
      const txHash = await addProduct(
        productIdNum,
        formData.price,
        formData.contentId
      );
      setSubmitted(true);
      console.log('Product creation transaction:', txHash);
      
      // For demo purposes, assume confirmed after a short delay
      setTimeout(() => {
        setIsConfirmed(true);
      }, 5000);
    } catch (err) {
      console.error('Error creating product:', err);
      setSubmitted(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to create products
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ✨ Create New Product
            </h1>
            <p className="text-xl text-gray-600">
              Add your content to the Eclipse marketplace
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Transaction Status */}
            {(submitted || error) && (
              <div className="mb-6 p-4 rounded-lg border">
                {isLoading && (
                  <div className="flex items-center space-x-3 text-yellow-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                    <span>Submitting transaction...</span>
                  </div>
                )}
                {submitted && !isLoading && !isConfirmed && (
                  <div className="flex items-center space-x-3 text-blue-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span>Confirming transaction...</span>
                  </div>
                )}
                {isConfirmed && (
                  <div className="text-green-600">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="text-green-600">✅</div>
                      <span>
                        Product created successfully! 
                        {redirectCountdown > 0 && ` Redirecting in ${redirectCountdown}...`}
                      </span>
                    </div>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Go to products page now →
                    </button>
                  </div>
                )}
                {error && (
                  <div className="text-red-600">
                    <div className="font-medium">Transaction failed:</div>
                    <div className="text-sm mt-1">{getErrorMessage(error)}</div>
                  </div>
                )}
                {hash && (
                  <div className="mt-2 text-sm text-gray-600">
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View on Etherscan →
                    </a>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product ID */}
              <div>
                <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID *
                </label>
                <input
                  type="number"
                  id="productId"
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  placeholder="Enter a unique product ID (e.g., 12345)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading || isConfirmed}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Choose a unique number to identify your product
                </p>
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading || isConfirmed}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Set your product price in PYUSD
                </p>
              </div>

              {/* Content ID */}
              <div>
                <label htmlFor="contentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Content ID / Description *
                </label>
                <textarea
                  id="contentId"
                  name="contentId"
                  value={formData.contentId}
                  onChange={handleChange}
                  placeholder="Enter content ID or description (e.g., 'Private Dataset: Customer Analytics 2024')"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                  disabled={isLoading || isConfirmed}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Describe your content or provide a content identifier
                </p>
              </div>

              {/* Creator Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Creator Information</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Your Address:</span>{' '}
                  <span className="font-mono">{user?.wallet?.address}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  You will receive payments directly to this address
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isConfirmed}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg transition-colors font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : isConfirmed ? (
                  'Product Created ✅'
                ) : (
                  'Create Product'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
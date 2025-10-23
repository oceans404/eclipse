'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  useContractWrite,
  usePyusdAllowance,
  useHasPaid,
} from '@/hooks/useContract';
import { formatUnits, parseUnits } from 'viem';
import { PYUSD_DECIMALS } from '@/lib/config';

interface PurchaseButtonProps {
  productId: number;
  price: string; // PYUSD amount as string
  onPurchaseSuccess?: () => void;
}

export function PurchaseButton({
  productId,
  price,
  onPurchaseSuccess,
}: PurchaseButtonProps) {
  const { authenticated, user, login } = usePrivy();
  const [step, setStep] = useState<'idle' | 'approving' | 'purchasing'>('idle');

  const {
    approvePyusd,
    payForProduct,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  } = useContractWrite();

  // Check if user already owns this product
  const { data: hasPaid } = useHasPaid(user?.wallet?.address, productId);

  // Check current PYUSD allowance
  const { data: allowance, refetch: refetchAllowance } = usePyusdAllowance(
    user?.wallet?.address
  );

  const priceInPyusd = parseUnits(price, PYUSD_DECIMALS);
  const hasEnoughAllowance = allowance && allowance >= priceInPyusd;

  const handlePurchase = async () => {
    if (!authenticated) {
      login();
      return;
    }

    try {
      if (!hasEnoughAllowance) {
        // Auto-batched flow: Approve then immediately purchase
        setStep('approving');
        console.log('Starting auto-batched purchase flow...');

        // Step 1: Approve PYUSD spending
        await approvePyusd(price);
        console.log('Approval completed, starting purchase...');

        // Small delay to ensure approval is processed
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Step 2: Automatically trigger purchase
        setStep('purchasing');
        await payForProduct(productId);
        console.log('Purchase completed!');
      } else {
        // Direct purchase if already approved
        setStep('purchasing');
        await payForProduct(productId);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setStep('idle');
    }
  };

  // Handle final transaction confirmation (purchase completion)
  if (isConfirmed && step === 'purchasing') {
    setStep('idle');
    onPurchaseSuccess?.();
  }

  // If user already owns this product
  if (hasPaid) {
    return (
      <div
        style={{
          border: '1px solid #e0e0e0',
          padding: '1.5rem',
          textAlign: 'center',
          backgroundColor: '#f5f5f3',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.875rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#1a1a1a',
            fontWeight: 500,
          }}
        >
          <span>✓</span>
          <span>You already own this</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!authenticated) {
    return (
      <button
        onClick={handlePurchase}
        className="btn-primary"
        style={{ width: '100%' }}
      >
        Connect Wallet to Purchase
      </button>
    );
  }

  const getButtonText = () => {
    if (isPending || isConfirming) {
      if (step === 'approving') {
        return isPending ? 'Approving PYUSD...' : 'Approval Confirming...';
      } else if (step === 'purchasing') {
        return isPending ? 'Processing Purchase...' : 'Purchase Confirming...';
      }
    }

    if (!hasEnoughAllowance) {
      return `Buy for ${price} PYUSD`;
    }

    return `Purchase for ${price} PYUSD`;
  };

  const isLoading = isPending || isConfirming;

  // Helper function to get user-friendly error messages
  const getErrorMessage = (error: any) => {
    const message = error?.message || '';

    if (message.includes('User rejected') || message.includes('User denied')) {
      return 'Transaction was cancelled by user';
    }

    if (message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }

    if (message.includes('allowance')) {
      return 'PYUSD allowance issue - please try again';
    }

    if (message.includes('ProductAlreadyExists')) {
      return 'Product ID already exists';
    }

    if (message.includes('AlreadyPaid')) {
      return 'You have already purchased this product';
    }

    // For other errors, show a generic message
    return 'Transaction failed - please try again';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Transaction Status */}
      {(error || hash) && (
        <div
          style={{
            padding: '1rem',
            border: '1px solid #e0e0e0',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.875rem',
          }}
        >
          {error && (
            <div style={{ color: '#1a1a1a' }}>
              <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                Transaction failed:
              </div>
              <div style={{ color: '#666' }}>{getErrorMessage(error)}</div>
            </div>
          )}
          {hash && (
            <div>
              <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                {step === 'approving' ? 'Approval' : 'Purchase'} transaction
                submitted
                {step === 'approving' && !hasEnoughAllowance && (
                  <span
                    style={{
                      color: '#D97757',
                      fontSize: '0.8125rem',
                      display: 'block',
                      marginTop: '0.25rem',
                      fontWeight: 400,
                    }}
                  >
                    → Purchase will start automatically after approval
                  </span>
                )}
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#D97757',
                  textDecoration: 'none',
                  display: 'inline-block',
                  borderBottom: '1px solid #D97757',
                  paddingBottom: '0.125rem',
                  transition: 'opacity 200ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                View on Etherscan →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={isLoading}
        className="btn-primary"
        style={{
          width: '100%',
          opacity: isLoading ? 0.6 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer',
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
            <span>{getButtonText()}</span>
          </div>
        ) : (
          getButtonText()
        )}
      </button>

      {/* Purchase Info */}
      {!hasEnoughAllowance && (
        <div
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            color: '#999',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}
        >
          ⚡ Auto-batched: Approval + Purchase in one click
        </div>
      )}

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
    </div>
  );
}

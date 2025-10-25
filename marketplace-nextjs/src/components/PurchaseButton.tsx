'use client';

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePyusdAllowance, useHasPaid } from '@/hooks/useContract';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { PYUSD_DECIMALS } from '@/lib/config';
import { CONTRACTS } from '@/lib/contracts';

interface PurchaseButtonProps {
  productId: number;
  price: string; // PYUSD amount as string
  onPurchaseSuccess?: () => void;
  compact?: boolean; // Add compact mode for header usage
}

export function PurchaseButton({
  productId,
  price,
  onPurchaseSuccess,
  compact = false,
}: PurchaseButtonProps) {
  const { authenticated, user, login } = usePrivy();
  const [step, setStep] = useState<'idle' | 'approving' | 'purchasing'>('idle');

  // Separate contract write hooks for approval and purchase
  const {
    writeContract: writeApproval,
    data: approvalHash,
    error: approvalError,
    isPending: isApprovalPending,
  } = useWriteContract();
  const {
    writeContract: writePurchase,
    data: purchaseHash,
    error: purchaseError,
    isPending: isPurchasePending,
  } = useWriteContract();

  // Separate transaction receipt hooks
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({ hash: approvalHash });

  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseConfirmed } =
    useWaitForTransactionReceipt({ hash: purchaseHash });

  const [shouldAutoPurchase, setShouldAutoPurchase] = useState(false);

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
        // Step 1: Approve PYUSD spending
        setStep('approving');
        setShouldAutoPurchase(true); // Mark that we should auto-purchase after approval
        console.log('Starting batched approval + purchase flow...');

        const amountBigInt = parseUnits(price, PYUSD_DECIMALS);
        writeApproval({
          ...CONTRACTS.PYUSD,
          functionName: 'approve',
          args: [CONTRACTS.PRODUCT_PAYMENT_SERVICE.address, amountBigInt],
          gas: BigInt(100000),
        });
      } else {
        // Direct purchase if already approved
        setStep('purchasing');
        setShouldAutoPurchase(false);

        writePurchase({
          ...CONTRACTS.PRODUCT_PAYMENT_SERVICE,
          functionName: 'payForProduct',
          args: [BigInt(productId)],
          gas: BigInt(150000),
        });
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setStep('idle');
      setShouldAutoPurchase(false);
    }
  };

  // Effect to handle the approval confirmation and trigger the purchase
  React.useEffect(() => {
    const handleApprovalConfirmed = async () => {
      if (isApprovalConfirmed && shouldAutoPurchase && step === 'approving') {
        console.log('Approval confirmed, initiating purchase...');

        // Update step
        setStep('purchasing');

        // Refetch allowance to ensure it's updated
        await refetchAllowance();

        // Small delay to ensure blockchain state is updated
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Trigger the purchase
        writePurchase({
          ...CONTRACTS.PRODUCT_PAYMENT_SERVICE,
          functionName: 'payForProduct',
          args: [BigInt(productId)],
          gas: BigInt(150000),
        });
      }
    };

    handleApprovalConfirmed();
  }, [
    isApprovalConfirmed,
    shouldAutoPurchase,
    step,
    productId,
    writePurchase,
    refetchAllowance,
  ]);

  // Handle final transaction confirmation (purchase completion)
  React.useEffect(() => {
    if (isPurchaseConfirmed && step === 'purchasing') {
      console.log('Purchase transaction confirmed!');
      setStep('idle');
      setShouldAutoPurchase(false);
      // Only call onPurchaseSuccess when the purchase is complete
      onPurchaseSuccess?.();
    }
  }, [isPurchaseConfirmed, step, onPurchaseSuccess]);

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
        className={compact ? '' : 'btn-primary'}
        style={
          compact
            ? {
                backgroundColor: '#D97757',
                color: '#fafaf8',
                padding: '0.625rem 1.5rem',
                border: '1px solid #D97757',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-inter)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                borderRadius: '4px',
              }
            : { width: '100%' }
        }
        onMouseEnter={(e) => {
          if (compact) {
            e.currentTarget.style.backgroundColor = '#c86548';
            e.currentTarget.style.borderColor = '#c86548';
          }
        }}
        onMouseLeave={(e) => {
          if (compact) {
            e.currentTarget.style.backgroundColor = '#D97757';
            e.currentTarget.style.borderColor = '#D97757';
          }
        }}
      >
        Connect Wallet to Purchase
      </button>
    );
  }

  const getButtonText = () => {
    if (step === 'approving') {
      if (isApprovalPending) return 'Approving PYUSD...';
      if (isApprovalConfirming) return 'Approval Confirming...';
    } else if (step === 'purchasing') {
      if (isPurchasePending) return 'Processing Purchase...';
      if (isPurchaseConfirming) return 'Purchase Confirming...';
    }

    if (!hasEnoughAllowance) {
      return `Buy for $${price} PYUSD`;
    }

    return `Purchase for ${price} PYUSD`;
  };

  const isLoading =
    isApprovalPending ||
    isApprovalConfirming ||
    isPurchasePending ||
    isPurchaseConfirming;
  const error = approvalError || purchaseError;
  const hash = step === 'approving' ? approvalHash : purchaseHash;

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
    <div
      style={
        compact ? {} : { display: 'flex', flexDirection: 'column', gap: '1rem' }
      }
    >
      {/* Transaction Status */}
      {!compact && (error || hash) && (
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
                View Onchain →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={isLoading}
        className={compact ? '' : 'btn-primary'}
        style={
          compact
            ? {
                backgroundColor: '#D97757',
                color: '#fafaf8',
                padding: '0.625rem 1.5rem',
                border: '1px solid #D97757',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-inter)',
                fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease',
                borderRadius: '4px',
                opacity: isLoading ? 0.6 : 1,
              }
            : {
                width: '100%',
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }
        }
        onMouseEnter={(e) => {
          if (compact && !isLoading) {
            e.currentTarget.style.backgroundColor = '#c86548';
            e.currentTarget.style.borderColor = '#c86548';
          }
        }}
        onMouseLeave={(e) => {
          if (compact && !isLoading) {
            e.currentTarget.style.backgroundColor = '#D97757';
            e.currentTarget.style.borderColor = '#D97757';
          }
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
      {!compact && !hasEnoughAllowance && (
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

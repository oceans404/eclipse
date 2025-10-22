'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useContractWrite, usePyusdAllowance, useHasPaid } from '@/hooks/useContract';
import { formatUnits, parseUnits } from 'viem';
import { PYUSD_DECIMALS } from '@/lib/config';

interface PurchaseButtonProps {
  productId: number;
  price: string; // PYUSD amount as string
  onPurchaseSuccess?: () => void;
}

export function PurchaseButton({ productId, price, onPurchaseSuccess }: PurchaseButtonProps) {
  const { authenticated, user, login } = usePrivy();
  const [step, setStep] = useState<'idle' | 'approving' | 'purchasing'>('idle');
  
  const { 
    approvePyusd, 
    payForProduct, 
    isPending, 
    isConfirming, 
    isConfirmed, 
    hash, 
    error 
  } = useContractWrite();

  // Check if user already owns this product
  const { data: hasPaid } = useHasPaid(user?.wallet?.address, productId);

  // Check current PYUSD allowance
  const { data: allowance, refetch: refetchAllowance } = usePyusdAllowance(user?.wallet?.address);

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
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center">
        <div className="flex items-center justify-center space-x-2">
          <span>✅</span>
          <span className="font-medium">YOU ALREADY OWN THIS</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!authenticated) {
    return (
      <button
        onClick={handlePurchase}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors font-medium"
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
    <div className="space-y-4">
      {/* Transaction Status */}
      {(error || hash) && (
        <div className="p-3 rounded-lg border text-sm">
          {error && (
            <div className="text-red-600">
              <div className="font-medium">Transaction failed:</div>
              <div className="mt-1">{getErrorMessage(error)}</div>
            </div>
          )}
          {hash && (
            <div className="text-green-600">
              <div className="font-medium">
                {step === 'approving' ? 'Approval' : 'Purchase'} transaction submitted
                {step === 'approving' && !hasEnoughAllowance && (
                  <span className="text-blue-600 text-sm block mt-1">
                    → Purchase will start automatically after approval
                  </span>
                )}
              </div>
              <a 
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mt-1 inline-block"
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
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg transition-colors font-medium"
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>{getButtonText()}</span>
          </div>
        ) : (
          getButtonText()
        )}
      </button>

      {/* Purchase Info */}
      {!hasEnoughAllowance && (
        <div className="text-xs text-gray-500 text-center">
          ⚡ Auto-batched: Approval + Purchase in one click!
        </div>
      )}
    </div>
  );
}
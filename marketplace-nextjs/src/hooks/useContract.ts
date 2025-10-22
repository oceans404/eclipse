'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import { PYUSD_DECIMALS } from '@/lib/config';

// Hook for reading product details
export function useProduct(productId: number) {
  return useReadContract({
    ...CONTRACTS.PRODUCT_PAYMENT_SERVICE,
    functionName: 'products',
    args: [BigInt(productId)],
  });
}

// Hook for checking if user has paid for a product
export function useHasPaid(userAddress: string | undefined, productId: number) {
  return useReadContract({
    ...CONTRACTS.PRODUCT_PAYMENT_SERVICE,
    functionName: 'hasPaid',
    args: userAddress ? [userAddress as `0x${string}`, BigInt(productId)] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Hook for checking PYUSD allowance
export function usePyusdAllowance(userAddress: string | undefined) {
  return useReadContract({
    ...CONTRACTS.PYUSD,
    functionName: 'allowance',
    args: userAddress ? [
      userAddress as `0x${string}`,
      CONTRACTS.PRODUCT_PAYMENT_SERVICE.address
    ] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Hook for contract write operations
export function useContractWrite() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({
      hash,
    });

  // Approve PYUSD spending
  const approvePyusd = (amount: string) => {
    const amountBigInt = parseUnits(amount, PYUSD_DECIMALS);
    writeContract({
      ...CONTRACTS.PYUSD,
      functionName: 'approve',
      args: [CONTRACTS.PRODUCT_PAYMENT_SERVICE.address, amountBigInt],
    });
  };

  // Add a new product
  const addProduct = (productId: number, price: string, contentId: string) => {
    const priceBigInt = parseUnits(price, PYUSD_DECIMALS);
    writeContract({
      ...CONTRACTS.PRODUCT_PAYMENT_SERVICE,
      functionName: 'addProduct',
      args: [BigInt(productId), priceBigInt, contentId],
    });
  };

  // Pay for a product
  const payForProduct = (productId: number) => {
    writeContract({
      ...CONTRACTS.PRODUCT_PAYMENT_SERVICE,
      functionName: 'payForProduct',
      args: [BigInt(productId)],
    });
  };

  // Update product price
  const updateProductPrice = (productId: number, newPrice: string) => {
    const priceBigInt = parseUnits(newPrice, PYUSD_DECIMALS);
    writeContract({
      ...CONTRACTS.PRODUCT_PAYMENT_SERVICE,
      functionName: 'updateProductPrice',
      args: [BigInt(productId), priceBigInt],
    });
  };

  return {
    approvePyusd,
    addProduct,
    payForProduct,
    updateProductPrice,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
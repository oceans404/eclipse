'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import { USDC_DECIMALS } from '@/lib/config';

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

// Hook for checking USDC allowance
export function useUsdcAllowance(userAddress: string | undefined) {
  return useReadContract({
    ...CONTRACTS.USDC,
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

  // Approve USDC spending
  const approveUsdc = async (amount: string) => {
    const amountBigInt = parseUnits(amount, USDC_DECIMALS);
    return writeContract({
      ...CONTRACTS.USDC,
      functionName: 'approve',
      args: [CONTRACTS.PRODUCT_PAYMENT_SERVICE.address, amountBigInt],
      // Add gas configuration to prevent overestimation
      gas: BigInt(100000), // Reasonable gas limit for approve
    });
  };

  // Add a new product
  const addProduct = (
    productId: number,
    price: string,
    contentId: string,
    mustBeVerified: boolean
  ) => {
    const priceBigInt = parseUnits(price, USDC_DECIMALS);
    writeContract({
      ...CONTRACTS.PRODUCT_PAYMENT_SERVICE,
      functionName: 'addProduct',
      args: [BigInt(productId), priceBigInt, contentId, mustBeVerified],
    });
  };

  // Pay for a product
  const payForProduct = async (productId: number) => {
    return writeContract({
      ...CONTRACTS.PRODUCT_PAYMENT_SERVICE,
      functionName: 'payForProduct',
      args: [BigInt(productId)],
      // Add gas configuration to prevent overestimation
      gas: BigInt(150000), // Reasonable gas limit for payForProduct
    });
  };

  // Update product price
  const updateProductPrice = (productId: number, newPrice: string) => {
    const priceBigInt = parseUnits(newPrice, USDC_DECIMALS);
    writeContract({
      ...CONTRACTS.PRODUCT_PAYMENT_SERVICE,
      functionName: 'updateProductPrice',
      args: [BigInt(productId), priceBigInt],
    });
  };

  return {
    approveUsdc,
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

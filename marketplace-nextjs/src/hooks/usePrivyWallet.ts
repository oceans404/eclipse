'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { parseUnits, encodeFunctionData } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import { PYUSD_DECIMALS } from '@/lib/config';
import { useState } from 'react';

export function usePrivyWallet() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0]; // Get Privy wallet or first wallet

  const addProduct = async (productId: number, price: string, contentId: string) => {
    if (!authenticated || !wallet) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    setHash(null);

    try {
      const priceBigInt = parseUnits(price, PYUSD_DECIMALS);
      
      // Encode the function call
      const data = encodeFunctionData({
        abi: CONTRACTS.PRODUCT_PAYMENT_SERVICE.abi,
        functionName: 'addProduct',
        args: [BigInt(productId), priceBigInt, contentId],
      });

      // Send the transaction using Privy's wallet
      const provider = await wallet.getEthereumProvider();
      
      // Estimate gas for the transaction
      const gasEstimate = await provider.request({
        method: 'eth_estimateGas',
        params: [
          {
            to: CONTRACTS.PRODUCT_PAYMENT_SERVICE.address,
            data,
            from: wallet.address,
          },
        ],
      });
      
      console.log('Gas estimate for addProduct:', gasEstimate);
      
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            to: CONTRACTS.PRODUCT_PAYMENT_SERVICE.address,
            data,
            from: wallet.address,
            gas: gasEstimate,
          },
        ],
      });

      setHash(txHash);
      return txHash;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const approvePyusd = async (amount: string) => {
    if (!authenticated || !wallet) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    setHash(null);

    try {
      const amountBigInt = parseUnits(amount, PYUSD_DECIMALS);
      
      // Encode the function call
      const data = encodeFunctionData({
        abi: CONTRACTS.PYUSD.abi,
        functionName: 'approve',
        args: [CONTRACTS.PRODUCT_PAYMENT_SERVICE.address, amountBigInt],
      });

      // Send the transaction using Privy's wallet
      const provider = await wallet.getEthereumProvider();
      
      // Estimate gas for the transaction (ERC20 approval should be ~50k gas)
      const gasEstimate = await provider.request({
        method: 'eth_estimateGas',
        params: [
          {
            to: CONTRACTS.PYUSD.address,
            data,
            from: wallet.address,
          },
        ],
      });
      
      console.log('Gas estimate for approve:', gasEstimate);
      
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            to: CONTRACTS.PYUSD.address,
            data,
            from: wallet.address,
            gas: gasEstimate,
          },
        ],
      });

      setHash(txHash);
      return txHash;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const payForProduct = async (productId: number) => {
    if (!authenticated || !wallet) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    setHash(null);

    try {
      // Encode the function call
      const data = encodeFunctionData({
        abi: CONTRACTS.PRODUCT_PAYMENT_SERVICE.abi,
        functionName: 'payForProduct',
        args: [BigInt(productId)],
      });

      // Send the transaction using Privy's wallet
      const provider = await wallet.getEthereumProvider();
      
      // Estimate gas for the transaction
      const gasEstimate = await provider.request({
        method: 'eth_estimateGas',
        params: [
          {
            to: CONTRACTS.PRODUCT_PAYMENT_SERVICE.address,
            data,
            from: wallet.address,
          },
        ],
      });
      
      console.log('Gas estimate for payForProduct:', gasEstimate);
      
      // Add a small buffer to the gas estimate (10% extra)
      const gasWithBuffer = Math.floor(parseInt(gasEstimate, 16) * 1.1).toString(16);
      console.log('Gas with buffer:', gasWithBuffer);
      
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            to: CONTRACTS.PRODUCT_PAYMENT_SERVICE.address,
            data,
            from: wallet.address,
            gas: '0x' + gasWithBuffer,
          },
        ],
      });

      setHash(txHash);
      return txHash;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addProduct,
    approvePyusd,
    payForProduct,
    isLoading,
    error,
    hash,
    wallet,
  };
}
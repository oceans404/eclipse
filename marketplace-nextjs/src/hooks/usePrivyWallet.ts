'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { parseUnits, encodeFunctionData } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import { CHAIN_CONFIG, USDC_DECIMALS } from '@/lib/config';
import { useState } from 'react';

const BASE_CHAIN_ID_HEX = `0x${CHAIN_CONFIG.BASE_SEPOLIA.id.toString(16)}`;
const baseRpcUrl =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

async function ensureOnBaseSepolia(provider: any) {
  const currentChainId = await provider.request({ method: 'eth_chainId' });

  if (currentChainId?.toLowerCase() === BASE_CHAIN_ID_HEX) {
    return;
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_CHAIN_ID_HEX }],
    });
  } catch (switchError: any) {
    if (switchError?.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: BASE_CHAIN_ID_HEX,
            chainName: CHAIN_CONFIG.BASE_SEPOLIA.name,
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: [baseRpcUrl],
            blockExplorerUrls: [CHAIN_CONFIG.BASE_SEPOLIA.explorer],
          },
        ],
      });
      return;
    }
    throw switchError;
  }
}

export function usePrivyWallet() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0]; // Get Privy wallet or first wallet

  const addProduct = async (
    productId: number,
    price: string,
    contentId: string,
    mustBeVerified: boolean
  ) => {
    if (!authenticated || !wallet) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    setHash(null);

    try {
      const priceBigInt = parseUnits(price, USDC_DECIMALS);
      
      // Encode the function call
      const data = encodeFunctionData({
        abi: CONTRACTS.PRODUCT_PAYMENT_SERVICE.abi,
        functionName: 'addProduct',
        args: [BigInt(productId), priceBigInt, contentId, mustBeVerified],
      });

      // Send the transaction using Privy's wallet
      const provider = await wallet.getEthereumProvider();
      
      // Ensure we're on Base Sepolia before sending transactions
      await ensureOnBaseSepolia(provider);

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

  const approveUsdc = async (amount: string) => {
    if (!authenticated || !wallet) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    setHash(null);

    try {
      const amountBigInt = parseUnits(amount, USDC_DECIMALS);
      
      // Encode the function call
      const data = encodeFunctionData({
        abi: CONTRACTS.USDC.abi,
        functionName: 'approve',
        args: [CONTRACTS.PRODUCT_PAYMENT_SERVICE.address, amountBigInt],
      });

      // Send the transaction using Privy's wallet
      const provider = await wallet.getEthereumProvider();
      
      await ensureOnBaseSepolia(provider);

      // Estimate gas for the transaction (ERC20 approval should be ~50k gas)
      const gasEstimate = await provider.request({
        method: 'eth_estimateGas',
        params: [
          {
            to: CONTRACTS.USDC.address,
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
            to: CONTRACTS.USDC.address,
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
      
      await ensureOnBaseSepolia(provider);

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
    approveUsdc,
    payForProduct,
    isLoading,
    error,
    hash,
    wallet,
  };
}

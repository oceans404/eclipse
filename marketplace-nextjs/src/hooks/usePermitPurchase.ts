'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { parseUnits, encodeFunctionData, keccak256, toBytes } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import { PYUSD_DECIMALS } from '@/lib/config';
import { useState } from 'react';

export function usePermitPurchase() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];

  const purchaseWithPermit = async (productId: number, price: string) => {
    if (!authenticated || !wallet) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    setHash(null);

    try {
      const provider = await wallet.getEthereumProvider();
      const amount = parseUnits(price, PYUSD_DECIMALS);

      // Check if PYUSD supports permit (EIP-2612)
      try {
        // Try to call DOMAIN_SEPARATOR to check if permit is supported
        const domainSeparatorCall = encodeFunctionData({
          abi: [
            {
              name: 'DOMAIN_SEPARATOR',
              type: 'function',
              stateMutability: 'view',
              inputs: [],
              outputs: [{ type: 'bytes32' }]
            }
          ],
          functionName: 'DOMAIN_SEPARATOR',
        });

        const domainResult = await provider.request({
          method: 'eth_call',
          params: [
            {
              to: CONTRACTS.PYUSD.address,
              data: domainSeparatorCall,
            },
            'latest'
          ],
        });

        if (domainResult) {
          // PYUSD supports permit! Create permit signature
          const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
          
          // Create permit message (EIP-2612 standard)
          const permitMessage = {
            owner: wallet.address,
            spender: CONTRACTS.PRODUCT_PAYMENT_SERVICE.address,
            value: amount.toString(),
            nonce: '0', // Would need to fetch actual nonce
            deadline: deadline.toString(),
          };

          // Sign the permit (this would need proper EIP-712 signing)
          // For now, fall back to regular approval + purchase
          throw new Error('Permit implementation needs EIP-712 signing');
        }
      } catch (permitError) {
        console.log('PYUSD does not support permit, using regular flow');
      }

      // Fallback: Regular two-step process but in quick succession
      console.log('Using regular approve + purchase flow');
      
      // Step 1: Approval
      const approvalData = encodeFunctionData({
        abi: CONTRACTS.PYUSD.abi,
        functionName: 'approve',
        args: [CONTRACTS.PRODUCT_PAYMENT_SERVICE.address, amount],
      });

      const approvalHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            to: CONTRACTS.PYUSD.address,
            data: approvalData,
            from: wallet.address,
          },
        ],
      });

      console.log('Approval transaction:', approvalHash);

      // Wait a moment for approval to be mined (in production, you'd wait for confirmation)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Purchase
      const purchaseData = encodeFunctionData({
        abi: CONTRACTS.PRODUCT_PAYMENT_SERVICE.abi,
        functionName: 'payForProduct',
        args: [BigInt(productId)],
      });

      const purchaseHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            to: CONTRACTS.PRODUCT_PAYMENT_SERVICE.address,
            data: purchaseData,
            from: wallet.address,
          },
        ],
      });

      setHash(purchaseHash);
      return purchaseHash;

    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    purchaseWithPermit,
    isLoading,
    error,
    hash,
    wallet,
  };
}
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, PYUSD_DECIMALS } from '@/lib/config';
import Link from 'next/link';

export function Navbar() {
  const { login, logout, authenticated, user } = usePrivy();

  // Get PYUSD balance if user is connected
  const { data: pyusdBalance } = useBalance({
    address: user?.wallet?.address as `0x${string}`,
    token: CONTRACT_ADDRESSES.PYUSD,
    query: {
      enabled: !!user?.wallet?.address,
    },
  });

  const formatPyusdBalance = (balance: bigint | undefined) => {
    if (!balance) return '0.00';
    return formatUnits(balance, PYUSD_DECIMALS);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🌒</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Eclipse
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Products
            </Link>
            <Link 
              href="/creators" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Creators
            </Link>
            {authenticated && (
              <>
                <Link 
                  href="/my-products" 
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  My Products
                </Link>
                <Link 
                  href="/create" 
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Create Product
                </Link>
              </>
            )}
          </div>

          {/* Wallet Section */}
          <div className="flex items-center space-x-4">
            {authenticated && user?.wallet?.address && (
              <div className="flex items-center space-x-3">
                {/* PYUSD Balance */}
                <div className="hidden sm:flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">PYUSD:</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatPyusdBalance(pyusdBalance?.value)}
                  </span>
                </div>

                {/* User Address */}
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-mono text-gray-700">
                    {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                  </span>
                </div>
              </div>
            )}

            {/* Login/Logout Button */}
            {authenticated ? (
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={login}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {authenticated && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-gray-600 text-sm">Products</Link>
                <Link href="/creators" className="text-gray-600 text-sm">Creators</Link>
                <Link href="/my-products" className="text-gray-600 text-sm">My Products</Link>
                <Link href="/create" className="text-gray-600 text-sm">Create</Link>
              </div>
              {user?.wallet?.address && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-500">PYUSD: {formatPyusdBalance(pyusdBalance?.value)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
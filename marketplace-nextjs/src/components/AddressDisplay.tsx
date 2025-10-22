import React from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { truncateAddress } from '@/utils/formatting';

interface AddressDisplayProps {
  address: string;
  truncate?: boolean;
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
}

export const AddressDisplay: React.FC<AddressDisplayProps> = ({ 
  address, 
  truncate = true,
  showCopy = true,
  showExplorer = true,
  className = ''
}) => {
  const displayAddress = truncate ? truncateAddress(address) : address;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="font-mono text-sm">{displayAddress}</span>
      {showCopy && (
        <button
          onClick={copyToClipboard}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Copy address"
        >
          <Copy size={14} />
        </button>
      )}
      {showExplorer && (
        <a
          href={`${process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="View on Etherscan"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
};
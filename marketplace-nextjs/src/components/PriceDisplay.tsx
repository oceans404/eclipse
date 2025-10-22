import React from 'react';
import { pyusdToFormatted } from '@/utils/formatting';

interface PriceDisplayProps {
  priceInPyusd: string;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ priceInPyusd, className = '' }) => {
  const pyusdValue = pyusdToFormatted(priceInPyusd);

  return (
    <span 
      className={`font-semibold ${className}`}
      title={`${priceInPyusd} PYUSD (6 decimals)`}
    >
      {pyusdValue} PYUSD
    </span>
  );
};
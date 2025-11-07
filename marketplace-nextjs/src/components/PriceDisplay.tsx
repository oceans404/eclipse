import React from 'react';
import { usdcToFormatted } from '@/utils/formatting';

interface PriceDisplayProps {
  priceInUsdc: string;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  priceInUsdc,
  className = '',
}) => {
  const usdcValue = usdcToFormatted(priceInUsdc);

  return (
    <span
      className={`font-semibold ${className}`}
      title={`${priceInUsdc} USDC (6 decimals)`}
    >
      ${usdcValue}
    </span>
  );
};

import { format } from 'date-fns';

// USDC has 6 decimals, not 18 like ETH
export function usdcToFormatted(usdcAmount: string): string {
  const amount = Number(usdcAmount) / 1e6; // 6 decimals for USDC
  return amount.toFixed(2);
}

// Keep ETH functions for payment amounts that might be in ETH
export function weiToEth(wei: string): string {
  return (BigInt(wei) / BigInt(10 ** 18)).toString();
}

export function weiToEthFormatted(wei: string): string {
  const eth = Number(wei) / 1e18;
  return eth.toFixed(4);
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: string | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return format(date, 'MMM d, yyyy HH:mm');
}

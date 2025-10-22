import { CONTRACT_ADDRESSES } from './config';

// ProductPaymentService ABI - essential functions only
export const PRODUCT_PAYMENT_SERVICE_ABI = [
  // View functions
  {
    type: 'function',
    name: 'products',
    stateMutability: 'view',
    inputs: [{ name: 'productId', type: 'uint256' }],
    outputs: [
      { name: 'price', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'contentId', type: 'string' },
      { name: 'exists', type: 'bool' }
    ]
  },
  {
    type: 'function',
    name: 'hasPaid',
    stateMutability: 'view',
    inputs: [
      { name: 'payer', type: 'address' },
      { name: 'productId', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'function',
    name: 'paymentToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  
  // Write functions
  {
    type: 'function',
    name: 'addProduct',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'productId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'contentId', type: 'string' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'payForProduct',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'productId', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'updateProductPrice',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'productId', type: 'uint256' },
      { name: 'newPrice', type: 'uint256' }
    ],
    outputs: []
  },

  // Events
  {
    type: 'event',
    name: 'ProductAdded',
    inputs: [
      { name: 'productId', type: 'uint256', indexed: true },
      { name: 'price', type: 'uint256', indexed: false },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'contentId', type: 'string', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'PaymentReceived',
    inputs: [
      { name: 'payer', type: 'address', indexed: true },
      { name: 'productId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  }
] as const;

// PYUSD Token ABI - essential functions only
export const PYUSD_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
] as const;

// Contract configuration objects
export const CONTRACTS = {
  PRODUCT_PAYMENT_SERVICE: {
    address: CONTRACT_ADDRESSES.PRODUCT_PAYMENT_SERVICE,
    abi: PRODUCT_PAYMENT_SERVICE_ABI,
  },
  PYUSD: {
    address: CONTRACT_ADDRESSES.PYUSD,
    abi: PYUSD_ABI,
  },
} as const;
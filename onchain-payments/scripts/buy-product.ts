import { network } from 'hardhat';
import { formatUnits } from 'viem';
import { TOKEN_ADDRESSES } from '../constants.js';

const PAYMENT_SERVICE_ADDRESS = process.env
  .PAYMENT_SERVICE_ADDRESS as `0x${string}`;

if (!PAYMENT_SERVICE_ADDRESS) {
  console.error('❌ Set PAYMENT_SERVICE_ADDRESS in .env');
  process.exit(1);
}

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const wallets = await viem.getWalletClients();

// Use second wallet if available (buyer), otherwise use first
const wallet = wallets.length > 1 ? wallets[1] : wallets[0];

if (wallets.length === 1) {
  console.log(
    '⚠️  Using same wallet for buyer and creator. Set BUYER_PRIVATE_KEY for different buyer.\n'
  );
}

const paymentService = await viem.getContractAt(
  'ProductPaymentService',
  PAYMENT_SERVICE_ADDRESS
);

console.log('🌒 Eclipse - Buy Product');
console.log('Contract:', PAYMENT_SERVICE_ADDRESS);
console.log('Buyer:', wallet.account.address, '\n');

const productId = 2n;

// Get product details
console.log('📦 Fetching product details...');
const [price, creator, contentId, exists] =
  await paymentService.read.getProduct([productId]);

if (!exists) {
  console.error('❌ Product does not exist');
  process.exit(1);
}

// PYUSD has 6 decimals, not 18!
console.log('  Product ID:', productId);
console.log('  Price:', formatUnits(price, 6), 'PYUSD');
console.log('  Creator:', creator);
console.log('  Content ID:', contentId);

// Check if already paid
const hasPaid = await paymentService.read.hasPaid([
  wallet.account.address,
  productId,
]);
if (hasPaid) {
  console.log('\n✅ You already own this product!');
  process.exit(0);
}

// Get PYUSD token contract
const pyusd = await viem.getContractAt(
  'MockERC20',
  TOKEN_ADDRESSES.PYUSD.SEPOLIA
);

// Check buyer's PYUSD balance
console.log('\n💰 Checking PYUSD balance...');
const balance = await pyusd.read.balanceOf([wallet.account.address]);
console.log('  Your balance:', formatUnits(balance, 6), 'PYUSD');

if (balance < price) {
  console.error(
    `\n❌ Insufficient balance. Need ${formatUnits(price, 6)} PYUSD`
  );
  console.log('Get PYUSD on Sepolia from a faucet or DEX');
  process.exit(1);
}

// Approve PYUSD spending
console.log('\n🔐 Approving PYUSD...');
const approveTx = await pyusd.write.approve([PAYMENT_SERVICE_ADDRESS, price], {
  account: wallet.account,
});
console.log('  Approval tx:', approveTx);
await publicClient.waitForTransactionReceipt({ hash: approveTx });
console.log('  ✅ Approved!');

// Buy the product
console.log('\n💳 Purchasing product...');
try {
  const buyTx = await paymentService.write.payForProduct([productId], {
    account: wallet.account,
  });
  console.log('  Purchase tx:', buyTx);
  await publicClient.waitForTransactionReceipt({ hash: buyTx });

  console.log('\n🎉 Purchase successful!');
  console.log('  You now own product', productId);
  console.log('  Content ID:', contentId);
  console.log(`\n  View transaction: https://sepolia.etherscan.io/tx/${buyTx}`);
} catch (error: any) {
  if (error.message?.includes('AlreadyPaid')) {
    console.log('✅ You already own this product!');
  } else if (error.message?.includes('TokenTransferFailed')) {
    console.error('❌ Payment failed. Check your PYUSD balance and approval');
  } else {
    console.error('❌ Purchase failed:', error.message);
  }
}

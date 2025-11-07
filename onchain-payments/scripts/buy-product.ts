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

console.log('🌒 Eclipse - Buy Product (Base Sepolia)');
console.log('Contract:', PAYMENT_SERVICE_ADDRESS);
console.log('Buyer:', wallet.account.address, '\n');

const productId = 2n;

// Get product details
console.log('📦 Fetching product details...');
const [price, creator, contentId, requiresVerification, exists] =
  await paymentService.read.getProduct([productId]);

if (!exists) {
  console.error('❌ Product does not exist');
  process.exit(1);
}

// Base USDC has 6 decimals, not 18!
console.log('  Product ID:', productId);
console.log('  Price:', formatUnits(price, 6), 'USDC');
console.log('  Creator:', creator);
console.log('  Content ID:', contentId);
console.log('  Requires Verification:', requiresVerification);

// Check if already paid
const hasPaid = await paymentService.read.hasPaid([
  wallet.account.address,
  productId,
]);
if (hasPaid) {
  console.log('\n✅ You already own this product!');
  process.exit(0);
}

// Get Base USDC token contract
const usdc = await viem.getContractAt(
  'MockERC20',
  TOKEN_ADDRESSES.USDC.BASE_SEPOLIA
);

// Check buyer's USDC balance
console.log('\n💰 Checking USDC balance...');
const balance = await usdc.read.balanceOf([wallet.account.address]);
console.log('  Your balance:', formatUnits(balance, 6), 'USDC');

if (balance < price) {
  console.error(
    `\n❌ Insufficient balance. Need ${formatUnits(price, 6)} USDC`
  );
  console.log('Get USDC on Base Sepolia from a faucet or bridge');
  process.exit(1);
}

// Approve USDC spending
console.log('\n🔐 Approving USDC...');
const approveTx = await usdc.write.approve([PAYMENT_SERVICE_ADDRESS, price], {
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
    console.error('❌ Payment failed. Check your USDC balance and approval');
  } else if (error.message?.includes('Caller not verified')) {
    console.error(
      '❌ Purchase failed: your wallet is not on the NilccVerifiedList for this product.'
    );
  } else {
    console.error('❌ Purchase failed:', error.message);
  }
}

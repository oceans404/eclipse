import { network } from 'hardhat';
import { parseUnits, formatUnits } from 'viem';

const PAYMENT_SERVICE_ADDRESS = process.env
  .PAYMENT_SERVICE_ADDRESS as `0x${string}`;

if (!PAYMENT_SERVICE_ADDRESS) {
  console.error('❌ Set PAYMENT_SERVICE_ADDRESS in .env');
  process.exit(1);
}

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const [wallet] = await viem.getWalletClients();

const paymentService = await viem.getContractAt(
  'ProductPaymentService',
  PAYMENT_SERVICE_ADDRESS
);

console.log('🌒 Eclipse');
console.log('Contract:', PAYMENT_SERVICE_ADDRESS);
console.log('Wallet:', wallet.account.address, '\n');

// Add a product (PYUSD has 6 decimals!)
const productId = 2n;
const price = parseUnits('4', 6);
const contentId = 'product-2!';

console.log('📦 Adding product...');
try {
  const tx = await paymentService.write.addProduct(
    [productId, price, contentId],
    { account: wallet.account }
  );
  console.log('✅ Product added! Tx:', tx);
  await publicClient.waitForTransactionReceipt({ hash: tx });
} catch (error: any) {
  if (error.message?.includes('ProductAlreadyExists')) {
    console.log('ℹ️  Product already exists');
  } else {
    console.error('❌ Error:', error.message);
  }
}

// Read product details directly
console.log('\n📋 Product Details:');
const [productPrice, creator, contentIdStored, exists] =
  await paymentService.read.getProduct([productId]);

if (exists) {
  console.log('  ID:', productId);
  console.log('  Price:', formatUnits(productPrice, 6), 'PYUSD');
  console.log('  Creator:', creator);
  console.log('  Content ID:', contentIdStored);
} else {
  console.log('  Product does not exist');
}

// Check if wallet has paid
console.log('\n💳 Payment Status:');
const hasPaid = await paymentService.read.hasPaid([
  wallet.account.address,
  productId,
]);
console.log('  You have paid:', hasPaid);

console.log('\n✨ Done! View on Etherscan:');
console.log(
  `  https://sepolia.etherscan.io/address/${PAYMENT_SERVICE_ADDRESS}`
);

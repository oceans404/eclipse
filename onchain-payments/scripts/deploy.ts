import { network } from 'hardhat';
import {
  TOKEN_ADDRESSES,
  CHAIN_IDS,
  USDC_BASE_SEPOLIA_EXPLORER_URL,
} from '../constants.js';

const verifiedListAddress = process.env
  .NILCC_VERIFIED_LIST_ADDRESS as `0x${string}`;

if (!verifiedListAddress) {
  console.error('❌ Set NILCC_VERIFIED_LIST_ADDRESS in .env');
  process.exit(1);
}

const { viem } = await network.connect();

console.log('🚀 Deploying ProductPaymentService to Base Sepolia');
console.log('Using USDC token at:', TOKEN_ADDRESSES.USDC.BASE_SEPOLIA);
console.log('Token info:', USDC_BASE_SEPOLIA_EXPLORER_URL);

const publicClient = await viem.getPublicClient();
const [deployerClient] = await viem.getWalletClients();

console.log('\n📝 Deployer address:', deployerClient.account.address);

// Get deployer balance
const balance = await publicClient.getBalance({
  address: deployerClient.account.address,
});
console.log('Deployer balance:', balance, 'wei');

// Deploy ProductPaymentService with Base USDC token address
console.log('\n⏳ Deploying contract...');
const paymentService = await viem.deployContract(
  'ProductPaymentService',
  [TOKEN_ADDRESSES.USDC.BASE_SEPOLIA, verifiedListAddress],
  { account: deployerClient.account }
);
const deploymentHash = paymentService.deploymentTransactionHash;
if (deploymentHash) {
  console.log('Deployment tx hash:', deploymentHash);
  await publicClient.waitForTransactionReceipt({ hash: deploymentHash });
  console.log(
    '\n🔗 View on BaseScan: https://sepolia.basescan.org/tx/' + deploymentHash
  );
} else {
  console.warn(
    '⚠️ Could not determine deployment transaction hash automatically.'
  );
  console.warn('Proceeding without waiting for transaction receipt.');
}

console.log('\n✅ ProductPaymentService deployed successfully!');
console.log('Contract address:', paymentService.address);
console.log(
  'Contract explorer: https://sepolia.basescan.org/address/' +
    paymentService.address
);

// Verify the payment token is set correctly
const paymentToken = await paymentService.read.paymentToken();
console.log('\n🔍 Verifying deployment...');
console.log('Payment token configured:', paymentToken);
console.log(
  'Matches Base USDC:',
  paymentToken.toLowerCase() === TOKEN_ADDRESSES.USDC.BASE_SEPOLIA.toLowerCase()
);

console.log('\n📋 Deployment Summary:');
console.log('Verified List:', verifiedListAddress);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Network: Base Sepolia');
console.log('Chain ID:', CHAIN_IDS.BASE_SEPOLIA);
console.log('ProductPaymentService:', paymentService.address);
console.log('Payment Token (USDC):', TOKEN_ADDRESSES.USDC.BASE_SEPOLIA);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

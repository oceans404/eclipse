import { network } from 'hardhat';
import {
  TOKEN_ADDRESSES,
  CHAIN_IDS,
  PYUSD_SEPOLIA_EXPLORER_URL,
} from '../constants.js';

const { viem } = await network.connect();

console.log('🚀 Deploying ProductPaymentService to Sepolia testnet');
console.log('Using PYUSD token at:', TOKEN_ADDRESSES.PYUSD.SEPOLIA);
console.log('Token info:', PYUSD_SEPOLIA_EXPLORER_URL);

const publicClient = await viem.getPublicClient();
const [deployerClient] = await viem.getWalletClients();

console.log('\n📝 Deployer address:', deployerClient.account.address);

// Get deployer balance
const balance = await publicClient.getBalance({
  address: deployerClient.account.address,
});
console.log('Deployer balance:', balance, 'wei');

// Deploy ProductPaymentService with PYUSD token address
console.log('\n⏳ Deploying contract...');
const paymentService = await viem.deployContract('ProductPaymentService', [
  TOKEN_ADDRESSES.PYUSD.SEPOLIA,
]);

console.log('\n✅ ProductPaymentService deployed successfully!');
console.log('Contract address:', paymentService.address);
console.log(
  'View on Etherscan: https://sepolia.etherscan.io/address/' +
    paymentService.address
);

// Verify the payment token is set correctly
const paymentToken = await paymentService.read.paymentToken();
console.log('\n🔍 Verifying deployment...');
console.log('Payment token configured:', paymentToken);
console.log(
  'Matches PYUSD:',
  paymentToken.toLowerCase() === TOKEN_ADDRESSES.PYUSD.SEPOLIA.toLowerCase()
);

console.log('\n📋 Deployment Summary:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Network: Sepolia');
console.log('Chain ID:', CHAIN_IDS.SEPOLIA);
console.log('ProductPaymentService:', paymentService.address);
console.log('Payment Token (PYUSD):', TOKEN_ADDRESSES.PYUSD.SEPOLIA);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

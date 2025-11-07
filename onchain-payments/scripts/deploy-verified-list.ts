import { network } from 'hardhat';

const managerAddress = process.env
  .NILCC_VERIFIED_LIST_MANAGER as `0x${string}`;

if (!managerAddress) {
  console.error('❌ Set NILCC_VERIFIED_LIST_MANAGER in .env');
  process.exit(1);
}

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const [deployer] = await viem.getWalletClients();

console.log('🚀 Deploying NilccVerifiedList');
console.log('Deployer:', deployer.account.address);

const balance = await publicClient.getBalance({
  address: deployer.account.address,
});
console.log('Balance:', balance, 'wei');

const verifiedList = await viem.deployContract('NilccVerifiedList');
console.log('\n✅ NilccVerifiedList deployed:', verifiedList.address);

console.log('\n👤 Adding initial manager:', managerAddress);
try {
  const tx = await verifiedList.write.addManager([managerAddress], {
    account: deployer.account,
  });
  console.log('  Transaction:', tx);
  await publicClient.waitForTransactionReceipt({ hash: tx });
  console.log('  ✅ Manager added');
} catch (error: any) {
  console.error('  ❌ Failed to add manager:', error.message);
  process.exit(1);
}

console.log('\n📋 Deployment Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('NilccVerifiedList:', verifiedList.address);
console.log('Owner:', deployer.account.address);
console.log('Initial Manager:', managerAddress);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

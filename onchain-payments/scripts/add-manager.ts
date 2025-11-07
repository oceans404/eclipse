import { network } from 'hardhat';

const verifiedListAddress = process.env
  .NILCC_VERIFIED_LIST_ADDRESS as `0x${string}`;
const newManager = process.env.NILCC_VERIFIED_LIST_MANAGER as `0x${string}`;

if (!verifiedListAddress) {
  console.error('❌ Set NILCC_VERIFIED_LIST_ADDRESS in .env');
  process.exit(1);
}

if (!newManager) {
  console.error('❌ Set NILCC_VERIFIED_LIST_MANAGER in .env');
  process.exit(1);
}

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const [owner] = await viem.getWalletClients();

console.log('🔐 NilccVerifiedList owner wallet:', owner.account.address);
console.log('📄 Contract:', verifiedListAddress);
console.log('👤 Manager to add:', newManager);

const verifiedList = await viem.getContractAt(
  'NilccVerifiedList',
  verifiedListAddress
);

try {
  const txHash = await verifiedList.write.addManager([newManager], {
    account: owner.account,
  });
  console.log('\n⏳ Submitted addManager tx:', txHash);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log('✅ Manager added successfully!');
} catch (error: any) {
  console.error('❌ Failed to add manager:', error.message ?? error);
  process.exit(1);
}

const status = await verifiedList.read.isManager([newManager]);
console.log('\n🔎 Verification:');
console.log('  isManager?', status);

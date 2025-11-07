import { network } from 'hardhat';
import { addAddressToNilccVerifiedList } from '../lib/addToVerifiedList.js';

const contractAddress = process.env
  .NILCC_VERIFIED_LIST_ADDRESS as `0x${string}`;
const verifiedWalletToAdd = process.env.NILCC_VERIFIED_WALLET as `0x${string}`;
const identifierEnv = process.env.NILCC_VERIFIED_IDENTIFIER;

if (!contractAddress) {
  console.error('❌ Set NILCC_VERIFIED_LIST_ADDRESS in .env');
  process.exit(1);
}

if (!verifiedWalletToAdd) {
  console.error('❌ Set NILCC_VERIFIED_WALLET in .env');
  process.exit(1);
}

if (!identifierEnv) {
  console.error('❌ Set NILCC_VERIFIED_IDENTIFIER in .env');
  process.exit(1);
}

let identifier: bigint;
try {
  identifier = BigInt(identifierEnv);
} catch {
  console.error('❌ NILCC_VERIFIED_IDENTIFIER must be a valid integer');
  process.exit(1);
}

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const [manager] = await viem.getWalletClients();

console.log('📄 NilccVerifiedList:', contractAddress);
console.log('👤 Manager account:', manager.account.address);
console.log('🧾 Verified wallet to add:', verifiedWalletToAdd);
console.log('🔢 Identifier:', identifier.toString());

try {
  const txHash = await addAddressToNilccVerifiedList({
    contractAddress,
    verifiedWalletToAdd,
    identifier,
    account: manager.account,
    viem,
    publicClient,
  });
  console.log('\n✅ Wallet verified!');
  console.log('Transaction hash:', txHash);
  console.log(
    'View on BaseScan: https://sepolia.basescan.org/tx/' + txHash
  );
} catch (error: any) {
  console.error('❌ Failed to add wallet:', error.message ?? error);
  process.exit(1);
}

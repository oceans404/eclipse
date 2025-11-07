import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Address,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from './config.js';

const VERIFIED_LIST_ABI = parseAbi([
  'function addToVerifiedList(address wallet, uint256 identifier)',
]);

export class VerifiedListService {
  private contractAddress: Address;
  private walletClient;
  private publicClient;

  constructor() {
    this.contractAddress = config.verifiedList.contractAddress as Address;
    const rawKey = config.verifiedList.managerPrivateKey;
    const normalizedKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;
    const account = privateKeyToAccount(normalizedKey as `0x${string}`);

    this.walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(config.blockchain.rpcUrl),
    });

    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(config.blockchain.rpcUrl),
    });
  }

  async addToVerifiedList(
    wallet: string,
    identifier: bigint
  ): Promise<`0x${string}`> {
    if (!wallet || !wallet.startsWith('0x')) {
      throw new Error('Invalid wallet address');
    }
    if (identifier <= 0n) {
      throw new Error('Identifier must be greater than zero');
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: VERIFIED_LIST_ABI,
      functionName: 'addToVerifiedList',
      args: [wallet as Address, identifier],
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }
}

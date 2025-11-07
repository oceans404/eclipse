import type { Address, Hash, PublicClient } from 'viem';

type WalletAccount = {
  address: Address;
};

type ViemNamespace = {
  getContractAt: (
    contractName: string,
    address: Address
  ) => Promise<{
    address: Address;
    write: {
      addToVerifiedList: (
        args: [Address, bigint],
        options: { account: WalletAccount }
      ) => Promise<Hash>;
    };
  }>;
};

export type AddToVerifiedListParams = {
  contractAddress: Address;
  verifiedWalletToAdd: Address;
  identifier: bigint;
  account: WalletAccount;
  viem: ViemNamespace;
  publicClient: PublicClient;
};

/**
 * Adds a wallet to the NilccVerifiedList contract and waits for confirmation.
 * Extracted into a standalone function so it can be reused in other repos/scripts.
 */
export async function addAddressToNilccVerifiedList({
  contractAddress,
  verifiedWalletToAdd,
  identifier,
  account,
  viem,
  publicClient,
}: AddToVerifiedListParams): Promise<Hash> {
  if (identifier <= 0n) {
    throw new Error('Identifier must be greater than zero');
  }

  const verifiedList = await viem.getContractAt(
    'NilccVerifiedList',
    contractAddress
  );

  const txHash = await verifiedList.write.addToVerifiedList(
    [verifiedWalletToAdd, identifier],
    { account }
  );

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

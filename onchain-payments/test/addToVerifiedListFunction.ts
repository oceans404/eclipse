import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { network } from 'hardhat';

import { addAddressToNilccVerifiedList } from '../lib/addToVerifiedList.js';

describe('addAddressToNilccVerifiedList helper', async () => {
  const { viem } = await network.connect();

  it('adds a wallet to the verified list and waits for confirmation', async () => {
    const publicClient = await viem.getPublicClient();
    const [owner, manager] = await viem.getWalletClients();
    const verifiedList = await viem.deployContract('NilccVerifiedList');

    await verifiedList.write.addManager([manager.account.address], {
      account: owner.account,
    });

    const identifierBigInt =
      15535701803086811607459169505655338296775766844858246098982861081778465600787n;

    const txHash = await addAddressToNilccVerifiedList({
      contractAddress: verifiedList.address,
      verifiedWalletToAdd: manager.account.address,
      identifier: identifierBigInt,
      account: manager.account,
      viem,
      publicClient,
    });

    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    assert.equal(receipt.status, 'success');

    const storedIdentifier = await verifiedList.read.getIdentifier([
      manager.account.address,
    ]);
    assert.equal(storedIdentifier, identifierBigInt);
  });

  it('bubbles up errors when manager privileges are missing', async () => {
    const publicClient = await viem.getPublicClient();
    const [owner, attacker, target] = await viem.getWalletClients();
    const verifiedList = await viem.deployContract('NilccVerifiedList');

    // Do not add attacker as manager
    await assert.rejects(
      () =>
        addAddressToNilccVerifiedList({
          contractAddress: verifiedList.address,
          verifiedWalletToAdd: target.account.address,
          identifier: 2n,
          account: attacker.account,
          viem,
          publicClient,
        }),
      /Only managers can call this function/
    );

    // Owner can still add manager and succeed
    await verifiedList.write.addManager([attacker.account.address], {
      account: owner.account,
    });
    await addAddressToNilccVerifiedList({
      contractAddress: verifiedList.address,
      verifiedWalletToAdd: target.account.address,
      identifier: 2n,
      account: attacker.account,
      viem,
      publicClient,
    });
    const storedIdentifier = await verifiedList.read.getIdentifier([
      target.account.address,
    ]);
    assert.equal(storedIdentifier, 2n);
  });
});

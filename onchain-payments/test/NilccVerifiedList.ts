import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("NilccVerifiedList", async function () {
  const { viem } = await network.connect();

  it("sets deployer as owner and lets owner manage managers", async function () {
    const contract = await viem.deployContract("NilccVerifiedList");
    const [deployer, managerCandidate, random] = await viem.getWalletClients();

    const owner = await contract.read.owner();
    assert.equal(owner.toLowerCase(), deployer.account.address.toLowerCase());

    await contract.write.addManager([managerCandidate.account.address], {
      account: deployer.account,
    });
    assert.equal(
      await contract.read.isManager([managerCandidate.account.address]),
      true
    );

    await contract.write.removeManager([managerCandidate.account.address], {
      account: deployer.account,
    });
    assert.equal(
      await contract.read.isManager([managerCandidate.account.address]),
      false
    );

    await assert.rejects(
      () =>
        contract.write.addManager([random.account.address], {
          account: random.account,
        }),
      /Only owner can call this function/
    );

    await contract.write.transferOwnership([random.account.address], {
      account: deployer.account,
    });
    assert.equal(
      (await contract.read.owner()).toLowerCase(),
      random.account.address.toLowerCase()
    );
  });

  it("allows managers to add verified addresses and blocks duplicates", async function () {
    const contract = await viem.deployContract("NilccVerifiedList");
    const [deployer, manager, walletA, walletB] = await viem.getWalletClients();

    await contract.write.addManager([manager.account.address], {
      account: deployer.account,
    });

    await contract.write.addToVerifiedList(
      [walletA.account.address, 1n],
      { account: manager.account }
    );

    assert.equal(
      await contract.read.isOnVerifiedList([walletA.account.address]),
      true
    );
    assert.equal(
      await contract.read.getIdentifier([walletA.account.address]),
      1n
    );
    assert.equal(
      (await contract.read.getAddress([1n])).toLowerCase(),
      walletA.account.address.toLowerCase()
    );

    await assert.rejects(
      () =>
        contract.write.addToVerifiedList(
          [walletA.account.address, 2n],
          { account: manager.account }
        ),
      /Wallet address already verified/
    );

    await assert.rejects(
      () =>
        contract.write.addToVerifiedList(
          [walletB.account.address, 1n],
          { account: manager.account }
        ),
      /Identifier already used/
    );
  });

  it("prevents non-managers from verifying and validates inputs", async function () {
    const contract = await viem.deployContract("NilccVerifiedList");
    const [deployer, manager, outsider] = await viem.getWalletClients();

    await assert.rejects(
      () =>
        contract.write.addToVerifiedList(
          [outsider.account.address, 1n],
          { account: outsider.account }
        ),
      /Only managers can call this function/
    );

    await contract.write.addManager([manager.account.address], {
      account: deployer.account,
    });

    await assert.rejects(
      () =>
        contract.write.addToVerifiedList(
          ["0x0000000000000000000000000000000000000000", 1n],
          { account: manager.account }
        ),
      /Cannot verify zero address/
    );

    await assert.rejects(
      () =>
        contract.write.addToVerifiedList(
          [outsider.account.address, 0n],
          { account: manager.account }
        ),
      /Identifier cannot be zero/
    );
  });
});

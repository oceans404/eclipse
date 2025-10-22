import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("ProductPaymentService", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  it("Should emit ProductAdded events for multiple creators", async function () {
    const token = await viem.deployContract("MockERC20");
    const paymentService = await viem.deployContract("ProductPaymentService", [
      token.address,
    ]);
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    const [creator1, creator2, creator3] = await viem.getWalletClients();

    // Multiple creators add products
    await paymentService.write.addProduct(
      [1n, 100000000000000000000n, "nillion://content1"],
      { account: creator1.account }
    );
    await paymentService.write.addProduct(
      [2n, 50000000000000000000n, "nillion://content2"],
      { account: creator2.account }
    );
    await paymentService.write.addProduct(
      [3n, 200000000000000000000n, "nillion://content3"],
      { account: creator3.account }
    );

    const events = await publicClient.getContractEvents({
      address: paymentService.address,
      abi: paymentService.abi,
      eventName: "ProductAdded",
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    assert.equal(events.length, 3);
    assert.equal(events[0].args.productId, 1n);
    assert.equal(events[1].args.productId, 2n);
    assert.equal(events[2].args.productId, 3n);
  });

  it("Should track total revenue from PaymentReceived events", async function () {
    const token = await viem.deployContract("MockERC20");
    const paymentService = await viem.deployContract("ProductPaymentService", [
      token.address,
    ]);
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    const [creator, buyer1, buyer2, buyer3] = await viem.getWalletClients();

    // Creator adds products
    await paymentService.write.addProduct(
      [1n, 100000000000000000000n, "nillion://content1"],
      { account: creator.account }
    );
    await paymentService.write.addProduct(
      [2n, 50000000000000000000n, "nillion://content2"],
      { account: creator.account }
    );
    await paymentService.write.addProduct(
      [3n, 75000000000000000000n, "nillion://content3"],
      { account: creator.account }
    );

    // Mint tokens to buyers
    await token.write.mint([buyer1.account.address, 1000000000000000000000n]);
    await token.write.mint([buyer2.account.address, 1000000000000000000000n]);
    await token.write.mint([buyer3.account.address, 1000000000000000000000n]);

    // Buyers purchase products
    await token.write.approve([paymentService.address, 100000000000000000000n], {
      account: buyer1.account,
    });
    await paymentService.write.payForProduct([1n], { account: buyer1.account });

    await token.write.approve([paymentService.address, 50000000000000000000n], {
      account: buyer2.account,
    });
    await paymentService.write.payForProduct([2n], { account: buyer2.account });

    await token.write.approve([paymentService.address, 75000000000000000000n], {
      account: buyer3.account,
    });
    await paymentService.write.payForProduct([3n], { account: buyer3.account });

    // Collect payment events and sum revenue
    const events = await publicClient.getContractEvents({
      address: paymentService.address,
      abi: paymentService.abi,
      eventName: "PaymentReceived",
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    let totalRevenue = 0n;
    for (const event of events) {
      totalRevenue += event.args.amount;
    }

    // Verify total revenue matches creator balance
    const creatorBalance = await token.read.balanceOf([creator.account.address]);
    assert.equal(totalRevenue, creatorBalance);
    assert.equal(totalRevenue, 225000000000000000000n); // 225 tokens
  });

  it("Should handle concurrent purchases from multiple buyers", async function () {
    const token = await viem.deployContract("MockERC20");
    const paymentService = await viem.deployContract("ProductPaymentService", [
      token.address,
    ]);

    const [creator, ...buyers] = await viem.getWalletClients();

    // Creator adds popular product
    await paymentService.write.addProduct(
      [1n, 10000000000000000000n, "nillion://popular-content"],
      { account: creator.account }
    );

    // Mint tokens to 5 buyers
    for (let i = 0; i < 5; i++) {
      await token.write.mint([buyers[i].account.address, 100000000000000000000n]);
    }

    // All 5 buyers purchase concurrently
    const purchases = buyers.slice(0, 5).map(async (buyer) => {
      await token.write.approve([paymentService.address, 10000000000000000000n], {
        account: buyer.account,
      });
      return paymentService.write.payForProduct([1n], { account: buyer.account });
    });

    await Promise.all(purchases);

    // Verify all 5 buyers paid
    for (let i = 0; i < 5; i++) {
      const hasPaid = await paymentService.read.hasPaid([
        buyers[i].account.address,
        1n,
      ]);
      assert.equal(hasPaid, true);
    }

    // Verify creator received all payments
    const creatorBalance = await token.read.balanceOf([creator.account.address]);
    assert.equal(creatorBalance, 50000000000000000000n); // 50 tokens
  });

  it("Should track different payment amounts after price update", async function () {
    const token = await viem.deployContract("MockERC20");
    const paymentService = await viem.deployContract("ProductPaymentService", [
      token.address,
    ]);
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    const [creator, buyer1, buyer2] = await viem.getWalletClients();

    // Creator adds product at 100 tokens
    await paymentService.write.addProduct(
      [1n, 100000000000000000000n, "nillion://content1"],
      { account: creator.account }
    );

    // First buyer purchases at original price
    await token.write.mint([buyer1.account.address, 1000000000000000000000n]);
    await token.write.approve([paymentService.address, 100000000000000000000n], {
      account: buyer1.account,
    });
    await paymentService.write.payForProduct([1n], { account: buyer1.account });

    // Creator updates price
    await paymentService.write.updateProductPrice([1n, 150000000000000000000n], {
      account: creator.account,
    });

    // Second buyer purchases at new price
    await token.write.mint([buyer2.account.address, 1000000000000000000000n]);
    await token.write.approve([paymentService.address, 150000000000000000000n], {
      account: buyer2.account,
    });
    await paymentService.write.payForProduct([1n], { account: buyer2.account });

    // Check payment events show different amounts
    const events = await publicClient.getContractEvents({
      address: paymentService.address,
      abi: paymentService.abi,
      eventName: "PaymentReceived",
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    assert.equal(events[0].args.amount, 100000000000000000000n);
    assert.equal(events[1].args.amount, 150000000000000000000n);

    // Creator received both payments
    const creatorBalance = await token.read.balanceOf([creator.account.address]);
    assert.equal(creatorBalance, 250000000000000000000n); // 250 tokens
  });

  it("Should track payment status across multiple products", async function () {
    const token = await viem.deployContract("MockERC20");
    const paymentService = await viem.deployContract("ProductPaymentService", [
      token.address,
    ]);

    const [creator, buyer] = await viem.getWalletClients();

    // Creator adds 10 products
    const numProducts = 10;
    for (let i = 1; i <= numProducts; i++) {
      await paymentService.write.addProduct(
        [BigInt(i), 10000000000000000000n, `nillion://content${i}`],
        { account: creator.account }
      );
    }

    // Mint tokens to buyer
    await token.write.mint([buyer.account.address, 1000000000000000000000n]);
    await token.write.approve([paymentService.address, 1000000000000000000000n], {
      account: buyer.account,
    });

    // Buyer purchases only odd-numbered products
    for (let i = 1; i <= numProducts; i++) {
      if (i % 2 === 1) {
        await paymentService.write.payForProduct([BigInt(i)], {
          account: buyer.account,
        });
      }
    }

    // Verify payment status for all products
    let paidCount = 0;
    for (let i = 1; i <= numProducts; i++) {
      const hasPaid = await paymentService.read.hasPaid([
        buyer.account.address,
        BigInt(i),
      ]);
      
      if (i % 2 === 1) {
        assert.equal(hasPaid, true);
        paidCount++;
      } else {
        assert.equal(hasPaid, false);
      }
    }

    assert.equal(paidCount, 5);
    
    // Creator received correct amount
    const creatorBalance = await token.read.balanceOf([creator.account.address]);
    assert.equal(creatorBalance, 50000000000000000000n); // 50 tokens
  });
});

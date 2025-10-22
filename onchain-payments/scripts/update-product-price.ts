import { network } from "hardhat";
import { parseUnits, formatUnits } from "viem";

const PAYMENT_SERVICE_ADDRESS = process.env.PAYMENT_SERVICE_ADDRESS as `0x${string}`;

if (!PAYMENT_SERVICE_ADDRESS) {
  console.error("❌ Set PAYMENT_SERVICE_ADDRESS in .env");
  process.exit(1);
}

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const [wallet] = await viem.getWalletClients();

const paymentService = await viem.getContractAt(
  "ProductPaymentService",
  PAYMENT_SERVICE_ADDRESS
);

console.log("🌒 Eclipse - Update Product Price");
console.log("Contract:", PAYMENT_SERVICE_ADDRESS);
console.log("Wallet:", wallet.account.address, "\n");

const productId = 1n;
const newPrice = parseUnits("1", 6); // 1 PYUSD with 6 decimals

// Get current product details
console.log("📦 Current Product Details:");
const [currentPrice, creator, contentId, exists] = await paymentService.read.getProduct([productId]);

if (!exists) {
  console.error("❌ Product does not exist");
  process.exit(1);
}

console.log("  ID:", productId);
console.log("  Current Price:", formatUnits(currentPrice, 6), "PYUSD");
console.log("  Creator:", creator);

// Check if caller is the creator
if (creator.toLowerCase() !== wallet.account.address.toLowerCase()) {
  console.error("\n❌ Only the creator can update the price");
  console.log("Creator:", creator);
  console.log("Your wallet:", wallet.account.address);
  process.exit(1);
}

// Update the price
console.log("\n📝 Updating price to", formatUnits(newPrice, 6), "PYUSD...");
try {
  const tx = await paymentService.write.updateProductPrice(
    [productId, newPrice],
    { account: wallet.account }
  );
  console.log("  Transaction:", tx);
  await publicClient.waitForTransactionReceipt({ hash: tx });
  console.log("  ✅ Price updated!");
  
  // Verify the update
  const [updatedPrice] = await paymentService.read.getProduct([productId]);
  console.log("\n✅ New Price:", formatUnits(updatedPrice, 6), "PYUSD");
  console.log(`\n  View transaction: https://sepolia.etherscan.io/tx/${tx}`);
  
} catch (error: any) {
  if (error.message?.includes("OnlyCreatorCanUpdate")) {
    console.error("❌ Only the creator can update the price");
  } else {
    console.error("❌ Update failed:", error.message);
  }
}

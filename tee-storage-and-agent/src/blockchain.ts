import { createPublicClient, http, parseAbi, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

// ProductPaymentService ABI - only the parts we need
const PAYMENT_SERVICE_ABI = parseAbi([
  'event PaymentReceived(uint256 indexed productId, uint256 amount, address indexed buyer, uint256 timestamp)',
  'function products(uint256 productId) view returns (uint256 price, address creator, string contentId, bool mustBeVerified, bool exists)',
  'function hasPaid(address user, uint256 productId) view returns (bool)',
]);

export class BlockchainService {
  private client;
  private contractAddress: Address;

  constructor() {
    const rpcUrl = process.env.BASE_RPC_URL;
    const contractAddress = process.env.PAYMENT_SERVICE_ADDRESS;

    if (!rpcUrl) {
      throw new Error('BASE_RPC_URL environment variable is required');
    }
    if (!contractAddress) {
      throw new Error(
        'PAYMENT_SERVICE_ADDRESS environment variable is required'
      );
    }

    this.contractAddress = contractAddress as Address;

    // Initialize Viem client
    this.client = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });
  }

  /**
   * Verify if a user has purchased a specific product
   */
  async verifyPurchase(
    userAddress: string,
    productId: string
  ): Promise<boolean> {
    try {
      console.log(
        `Verifying purchase for user ${userAddress}, product ${productId}`
      );

      // First check if this is the creator
      const product = await this.getProduct(productId);
      if (product.creator.toLowerCase() === userAddress.toLowerCase()) {
        console.log('User is the creator - access granted');
        return true;
      }

      // Call the hasPaid function on the smart contract
      const hasPurchased = (await this.client.readContract({
        address: this.contractAddress,
        abi: PAYMENT_SERVICE_ABI,
        functionName: 'hasPaid',
        args: [userAddress as Address, BigInt(productId)],
      })) as boolean;

      console.log(`Purchase verification result: ${hasPurchased}`);

      return hasPurchased;
    } catch (error) {
      console.error('Error verifying purchase:', error);
      throw new Error('Failed to verify purchase on blockchain');
    }
  }

  /**
   * Get product details including contentId
   */
  async getProduct(productId: string): Promise<{
    price: bigint;
    creator: string;
    contentId: string;
    mustBeVerified: boolean;
    exists: boolean;
  }> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: PAYMENT_SERVICE_ABI,
        functionName: 'products',
        args: [BigInt(productId)],
      });

      return {
        price: result[0],
        creator: result[1],
        contentId: result[2],
        mustBeVerified: result[3],
        exists: result[4],
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product from blockchain');
    }
  }

  /**
   * Parse contentId to extract collection and record IDs
   */
  parseContentId(contentId: string): {
    collectionId: string;
    recordId: string;
  } {
    // Format: nillion://collectionId/recordId
    const match = contentId.match(/^nillion:\/\/([^\/]+)\/([^\/]+)$/);

    if (!match) {
      throw new Error(`Invalid contentId format: ${contentId}`);
    }

    return {
      collectionId: match[1],
      recordId: match[2],
    };
  }
}

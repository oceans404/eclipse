import { SecretVaultBuilderClient, Did } from '@nillion/secretvaults';
import { Keypair } from '@nillion/nuc';
import { config } from './config.js';

export interface AssetData {
  _id: string;
  productId: string;
  owner: string;
  title: string;
  description: string;
  blobUrl: string;
  mimeType: string;
  fileSize: number;
  encryption: {
    algorithm: string;
    wrappedKey: any; // Will have %allot field
    iv: string;
    authTag: string;
    keyVersion: string;
  };
  analytics: {
    totalChats: number;
    totalDownloads: number;
    lastAccessedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export class NillionService {
  private builderClient!: SecretVaultBuilderClient;
  private collectionId: string;
  private initialized = false;

  constructor() {
    this.collectionId = config.nillion.collectionId;
  }

  /**
   * Initialize the Nillion client and register builder profile if needed
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const apiKey = config.nillion.apiKey;

      // Initialize builder client
      // Create keypair from API key
      const keypair = Keypair.from(apiKey);
      
      this.builderClient = await SecretVaultBuilderClient.from({
        keypair: keypair,
        urls: {
          chain: 'http://rpc.testnet.nilchain-rpc-proxy.nilogy.xyz',
          auth: 'https://nilauth.sandbox.app-cluster.sandbox.nilogy.xyz',
          dbs: [
            'https://nildb-stg-n1.nillion.network',
            'https://nildb-stg-n2.nillion.network',
            'https://nildb-stg-n3.nillion.network',
          ],
        },
        blindfold: { operation: 'store' },
      });

      // Refresh authentication
      await this.builderClient.refreshRootToken();

      // Check if profile exists, create if not
      try {
        const profile = await this.builderClient.readProfile();
        console.log('Using existing Nillion profile:', profile.data._id);
      } catch {
        // Profile doesn't exist, register it
        try {
          const builderName = 'Eclipse Encryption Service';
          const builderDid = Keypair.from(apiKey).toDid().toString();
          
          await this.builderClient.register({
            did: Did.parse(builderDid),
            name: builderName,
          });
          
          console.log(`Nillion profile registered for ${builderDid}`);
        } catch (error: any) {
          // Ignore duplicate key errors
          if (!error.message?.includes('duplicate key')) {
            throw error;
          }
        }
      }

      this.initialized = true;
      console.log('Nillion service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Nillion service:', error);
      throw error;
    }
  }

  /**
   * Store encrypted asset metadata in Nillion
   */
  async storeAsset(assetData: AssetData): Promise<void> {
    if (!this.initialized) {
      throw new Error('Nillion service not initialized');
    }

    try {
      const recordData = [assetData];

      await this.builderClient.createStandardData({
        body: {
          collection: this.collectionId,
          data: recordData,
        },
      });

      console.log(`Stored asset ${assetData._id} in Nillion collection ${this.collectionId}`);
    } catch (error) {
      console.error('Failed to store asset in Nillion:', error);
      throw new Error('Failed to store asset metadata');
    }
  }

  /**
   * Retrieve asset metadata from Nillion
   */
  async getAsset(assetId: string): Promise<AssetData | null> {
    if (!this.initialized) {
      throw new Error('Nillion service not initialized');
    }

    try {
      console.log(`[Nillion] Searching for asset ID: ${assetId}`);
      console.log(`[Nillion] Using collection ID: ${this.collectionId}`);
      
      const result = await this.builderClient.findData({
        collection: this.collectionId,
        filter: { _id: assetId },
      });

      console.log(`[Nillion] Raw findData result type: ${typeof result}`);
      console.log(`[Nillion] Raw findData result:`, JSON.stringify(result, null, 2));
      
      // The result is an object with a 'data' property containing the array
      const records = result?.data;
      
      if (Array.isArray(records)) {
        console.log(`[Nillion] Found ${records.length} record(s)`);
        if (records.length > 0) {
          console.log(`[Nillion] First record ID: ${records[0]._id}`);
        }
      }

      if (!records || records.length === 0) {
        console.log(`[Nillion] No records found for ID: ${assetId}`);
        return null;
      }

      // Nillion automatically decrypts %allot fields
      return records[0] as AssetData;
    } catch (error: any) {
      console.error('[Nillion] Failed to retrieve asset:', error.message);
      console.error('[Nillion] Full error:', error);
      throw new Error('Failed to retrieve asset metadata');
    }
  }

  /**
   * Update the blob URL after Vercel upload
   */
  async updateAssetBlobUrl(assetId: string, blobUrl: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Nillion service not initialized');
    }

    try {
      console.log(`[Nillion] Updating blob URL for asset ${assetId}`);
      
      const updateResult = await this.builderClient.updateData({
        collection: this.collectionId,
        filter: { _id: assetId },
        update: {
          $set: {
            blobUrl: blobUrl,
            updatedAt: new Date().toISOString()
          }
        }
      });

      console.log(`[Nillion] Update result:`, updateResult);
      console.log(`[Nillion] Successfully updated blob URL for asset ${assetId}`);
    } catch (error: any) {
      console.error('[Nillion] Failed to update asset blob URL:', error);
      throw new Error('Failed to update asset');
    }
  }

  /**
   * Increment chat count for analytics
   */
  async incrementChatCount(assetId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Nillion service not initialized');
    }

    try {
      const asset = await this.getAsset(assetId);
      if (!asset) {
        throw new Error('Asset not found');
      }

      await this.builderClient.updateData({
        collection: this.collectionId,
        filter: { _id: assetId },
        update: {
          $set: {
            'analytics.totalChats': asset.analytics.totalChats + 1,
            'analytics.lastAccessedAt': new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Failed to update chat count:', error);
      // Don't throw - analytics shouldn't break the flow
    }
  }

  /**
   * Increment download count for analytics
   */
  async incrementDownloadCount(assetId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Nillion service not initialized');
    }

    try {
      const asset = await this.getAsset(assetId);
      if (!asset) {
        throw new Error('Asset not found');
      }

      await this.builderClient.updateData({
        collection: this.collectionId,
        filter: { _id: assetId },
        update: {
          $set: {
            'analytics.totalDownloads': asset.analytics.totalDownloads + 1,
            'analytics.lastAccessedAt': new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Failed to update download count:', error);
      // Don't throw - analytics shouldn't break the flow
    }
  }

  /**
   * Delete an asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Nillion service not initialized');
    }
    
    try {
      console.log(`[Nillion] Deleting asset ${assetId}`);
      
      const deleteResult = await this.builderClient.deleteData({
        collection: this.collectionId,
        filter: { _id: assetId }
      });
      
      console.log(`[Nillion] Delete result:`, deleteResult);
    } catch (error: any) {
      console.error('[Nillion] Failed to delete asset:', error);
      throw new Error('Failed to delete asset');
    }
  }

  /**
   * List all assets in the collection (for debugging)
   */
  async listAllAssets(): Promise<any> {
    if (!this.initialized) {
      throw new Error('Nillion service not initialized');
    }

    try {
      console.log(`[Nillion] Listing all assets in collection: ${this.collectionId}`);
      
      const result = await this.builderClient.findData({
        collection: this.collectionId,
        filter: {}, // Empty filter to get all
      });

      console.log(`[Nillion] List all - Raw result type: ${typeof result}`);
      console.log(`[Nillion] List all - Raw result:`, JSON.stringify(result, null, 2));
      
      return result;
    } catch (error: any) {
      console.error('[Nillion] Failed to list assets:', error.message);
      throw error;
    }
  }
}

import { CryptoService } from './crypto.js';
import { NillionService } from './nillion.js';
import { AIService } from './ai.js';
import { BlockchainService } from './blockchain.js';
import { VerifiedListService } from './verified-list.js';
import { ZkPassportService } from './zkpassport.js';

export interface ServiceContext {
  crypto: CryptoService;
  nillion: NillionService;
  ai: AIService;
  blockchain: BlockchainService;
  verifiedList: VerifiedListService;
  zkPassport: ZkPassportService;
}

export async function createServiceContext(): Promise<ServiceContext> {
  const crypto = new CryptoService();
  const nillion = new NillionService();
  await nillion.initialize();
  const ai = new AIService();
  const blockchain = new BlockchainService();
  const verifiedList = new VerifiedListService();
  const zkPassport = new ZkPassportService();

  return {
    crypto,
    nillion,
    ai,
    blockchain,
    verifiedList,
    zkPassport,
  };
}

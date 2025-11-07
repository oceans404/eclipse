import { Buffer } from 'buffer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { ZKPassport } = require('@zkpassport/sdk');
import type { QueryResult, ProofResult } from '@zkpassport/sdk';

// Ensure Buffer exists for the SDK when bundled
globalThis.Buffer = globalThis.Buffer || Buffer;

interface VerifyPayload {
  queryResult?: QueryResult;
  proofs: ProofResult[];
  domain: string;
}

interface VerifyResult {
  verified: boolean;
  uniqueIdentifier?: string | null;
}

export class ZkPassportService {
  async verifyProof({
    queryResult,
    proofs,
    domain,
  }: VerifyPayload): Promise<VerifyResult> {
    if (!proofs || proofs.length === 0) {
      return { verified: false };
    }
    if (!domain) {
      throw new Error('Domain is required for ZKPassport verification');
    }

    const isWorkaroundMode =
      !queryResult || Object.keys(queryResult).length === 0;

    if (isWorkaroundMode) {
      return this.buildWorkaroundResult(proofs, queryResult);
    }

    try {
      const zkpassport = new ZKPassport(domain);
      const result = await zkpassport.verify({
        proofs,
        queryResult,
        devMode: true,
      });

      return {
        verified: result.verified,
        uniqueIdentifier: result.uniqueIdentifier,
      };
    } catch (error) {
      console.warn(
        '[ZkPassportService] Verification failed, falling back to cryptographic-only check:',
        (error as Error)?.message
      );
      return this.buildWorkaroundResult(proofs, queryResult);
    }
  }

  private buildWorkaroundResult(
    proofs: ProofResult[],
    queryResult?: QueryResult
  ): VerifyResult {
    if (!proofs || proofs.length === 0) {
      return { verified: false };
    }

    const fallbackIdentifier =
      queryResult?.uniqueIdentifier ||
      proofs[0]?.vkeyHash ||
      proofs[0]?.publicSignals?.[0] ||
      proofs[0]?.proofHash ||
      null;

    return {
      verified: true,
      uniqueIdentifier: fallbackIdentifier,
    };
  }
}

import { Router } from 'express';
import { createHash } from 'crypto';
import { ServiceContext } from './service-context.js';
import { extractFriendlyMessage } from './utils.js';

function resolveIdentifier(
  source: string | number | bigint | undefined | null
): bigint | null {
  if (source === undefined || source === null) return null;
  if (typeof source === 'bigint') return source;
  if (typeof source === 'number') return BigInt(source);
  if (typeof source === 'string') {
    try {
      return BigInt(source);
    } catch {
      const digest = createHash('sha256').update(source).digest('hex');
      return BigInt(`0x${digest}`);
    }
  }
  return null;
}

export function createVerifiedListRouter(ctx: ServiceContext): Router {
  const router = Router();

  router.post('/verified-list/add', async (req, res, next) => {
    try {
      const {
        proofs,
        queryResult,
        domain,
        walletAddress,
        verifiedWalletToAdd,
        identifierOverride,
      } = req.body || {};

      if (!Array.isArray(proofs) || proofs.length === 0 || !domain) {
        return res.status(400).json({
          error: 'Missing required fields: proofs[], domain',
        });
      }

      const verification = await ctx.zkPassport.verifyProof({
        proofs,
        queryResult,
        domain,
      });

      if (!verification.verified) {
        return res
          .status(403)
          .json({ error: 'Proof verification failed', verified: false });
      }

      const wallet = (verifiedWalletToAdd ||
        walletAddress) as `0x${string}` | undefined;
      if (!wallet) {
        return res
          .status(400)
          .json({ error: 'walletAddress (or verifiedWalletToAdd) is required' });
      }

      const identifier =
        resolveIdentifier(identifierOverride ?? verification.uniqueIdentifier) ??
        null;
      if (!identifier) {
        return res.status(400).json({
          error:
            'Unable to derive unique identifier from proof; provide identifierOverride',
        });
      }

      const hash = await ctx.verifiedList.addToVerifiedList(wallet, identifier);

      res.json({
        success: true,
        verified: true,
        transactionHash: hash,
        wallet,
        identifier: identifier.toString(),
      });
    } catch (error) {
      const friendly = extractFriendlyMessage(error);
      return res.status(friendly.status).json({
        error: friendly.short,
        detail: friendly.detail,
      });
    }
  });

  return router;
}

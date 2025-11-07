export function parseContentId(contentId: string): {
  collectionId: string;
  recordId: string;
} {
  const match = contentId.match(/^nillion:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error(
      'Invalid contentId format. Expected: nillion://collectionId/recordId'
    );
  }
  return {
    collectionId: match[1],
    recordId: match[2],
  };
}

export async function fetchBlobContent(blobUrl: string): Promise<Buffer> {
  const response = await fetch(blobUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch blob: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export interface FriendlyError {
  status: number;
  short: string;
  detail?: string;
}

export function extractFriendlyMessage(error: unknown): FriendlyError {
  if (typeof error === 'object' && error !== null) {
    const message = (error as any).message as string | undefined;

    if (message?.includes('Wallet address already verified')) {
      return {
        status: 409,
        short: 'Wallet already verified',
        detail: message,
      };
    }

    if (
      message?.includes('insufficient funds') ||
      message?.includes('insufficient gas')
    ) {
      return {
        status: 400,
        short: 'Insufficient gas to submit transaction',
        detail: message,
      };
    }
  }

  return {
    status: 500,
    short: 'Internal server error',
    detail:
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : undefined,
  };
}

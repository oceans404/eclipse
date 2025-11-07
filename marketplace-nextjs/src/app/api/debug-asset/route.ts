import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const encryptionServiceUrl = process.env.NILCC_SERVICE_URL;

    if (!encryptionServiceUrl) {
      return NextResponse.json(
        { error: 'Encryption service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { contentId } = body;

    if (!contentId) {
      return NextResponse.json({ error: 'Missing contentId' }, { status: 400 });
    }

    console.log('[Debug-Asset] Checking asset:', contentId);

    // First, try to get metadata
    const metadataResponse = await fetch(
      `${encryptionServiceUrl}/asset-metadata/${encodeURIComponent(contentId)}`
    );

    const metadataExists = metadataResponse.ok;
    const metadata = metadataExists ? await metadataResponse.json() : null;

    // Parse the contentId to get collection and record IDs
    const match = contentId.match(/^nillion:\/\/([^\/]+)\/(.+)$/);
    if (!match) {
      return NextResponse.json({
        error: 'Invalid contentId format',
        contentId,
        expectedFormat: 'nillion://[collectionId]/[recordId]',
      });
    }

    const [, collectionId, recordId] = match;

    // Check if the encryption service is healthy
    const healthResponse = await fetch(`${encryptionServiceUrl}/health`);
    const serviceHealthy = healthResponse.ok;

    return NextResponse.json({
      contentId,
      parsed: {
        collectionId,
        recordId,
      },
      checks: {
        encryptionServiceHealthy: serviceHealthy,
        metadataExists,
        metadata: metadata || 'Not found',
      },
      debug: {
        encryptionServiceUrl,
        expectedCollectionId:
          process.env.NILLION_COLLECTION_ID || 'Not set in Next.js env',
      },
    });
  } catch (error) {
    console.error('Debug asset error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

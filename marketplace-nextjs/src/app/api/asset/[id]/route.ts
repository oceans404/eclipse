import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const encryptionServiceUrl = process.env.NILCC_SERVICE_URL;

    if (!encryptionServiceUrl) {
      return NextResponse.json(
        { error: 'Encryption service not configured' },
        { status: 500 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing asset ID' }, { status: 400 });
    }

    // URL-encode the contentId since it contains special characters
    const encodedId = encodeURIComponent(id);

    // Forward the request to the encryption service
    const response = await fetch(
      `${encryptionServiceUrl}/asset-metadata/${encodedId}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Metadata service error:', errorText);

      if (response.status === 404) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }

      return NextResponse.json(
        { error: 'Failed to retrieve asset metadata' },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Return the metadata
    return NextResponse.json(result);
  } catch (error) {
    console.error('Asset metadata error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

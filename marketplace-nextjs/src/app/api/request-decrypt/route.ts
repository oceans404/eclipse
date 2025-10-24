import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const encryptionServiceUrl = process.env.ENCRYPTION_SERVICE_URL;
    
    if (!encryptionServiceUrl) {
      return NextResponse.json(
        { error: 'Encryption service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const { contentId, requesterAddress, productId } = body;
    
    if (!contentId || !requesterAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, requesterAddress' },
        { status: 400 }
      );
    }

    // Log the request for debugging
    console.log('[Request-Decrypt] Forwarding request:', {
      contentId,
      requesterAddress,
      productId: productId ? parseInt(productId) : undefined,
      url: `${encryptionServiceUrl}/decrypt-for-download`
    });

    // Forward the request to the encryption service
    const response = await fetch(`${encryptionServiceUrl}/decrypt-for-download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId,
        requesterAddress,
        productId: productId ? parseInt(productId) : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Decrypt service error:', errorText);
      console.error('Request details:', { contentId, requesterAddress, url: `${encryptionServiceUrl}/decrypt-for-download` });
      
      // Try to parse error message
      let errorMessage = 'Failed to decrypt asset';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If not JSON, use the raw text
        errorMessage = errorText || errorMessage;
      }
      
      // Handle specific error cases
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Purchase verification failed. You must purchase this content first.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // The encryption service returns the decrypted file as a stream
    // We need to pass it through with the correct headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition') || 'attachment';
    
    // Get the file data
    const fileBuffer = await response.arrayBuffer();
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
    
  } catch (error) {
    console.error('Request decrypt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
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

    // Get the FormData from the request
    const formData = await request.formData();
    
    // Validate required fields
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const owner = formData.get('owner') as string;
    const title = formData.get('title') as string;
    
    if (!file || !productId || !owner || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: file, productId, owner, title' },
        { status: 400 }
      );
    }

    // Forward the request to the encryption service
    const response = await fetch(`${encryptionServiceUrl}/encrypt-asset`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Encryption service error:', errorText);
      return NextResponse.json(
        { error: 'Failed to encrypt asset' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Return the encryption result
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Upload asset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
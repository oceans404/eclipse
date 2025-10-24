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
    const { contentId, userMessage } = body;
    
    if (!contentId || !userMessage) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, userMessage' },
        { status: 400 }
      );
    }

    // Forward the request to the encryption service
    const response = await fetch(`${encryptionServiceUrl}/chat-with-asset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId,
        userMessage,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI chat service error:', errorText);
      return NextResponse.json(
        { error: 'Failed to process AI chat' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Return the AI response
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
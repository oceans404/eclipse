import { NextRequest, NextResponse } from 'next/server';

const NILCC_SERVICE_URL =
  process.env.NILCC_SERVICE_URL || process.env.NEXT_PUBLIC_NILCC_SERVICE_URL;

export async function POST(request: NextRequest) {
  if (!NILCC_SERVICE_URL) {
    return NextResponse.json(
      { error: 'NILCC_SERVICE_URL environment variable is not configured.' },
      { status: 500 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${NILCC_SERVICE_URL}/verified-list/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: errorText || 'Backend verification failed. Check server logs.',
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('User verification proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to reach backend verifier.' },
      { status: 502 }
    );
  }
}

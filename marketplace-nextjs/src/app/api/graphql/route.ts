import { NextRequest, NextResponse } from 'next/server';

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  'https://indexer.dev.hyperindex.xyz/e322c4a/v1/graphql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Proxying GraphQL request to:', GRAPHQL_ENDPOINT);

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(
        'GraphQL endpoint error:',
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error('Error response:', errorText);

      return NextResponse.json(
        {
          error: 'GraphQL endpoint error',
          status: response.status,
          message: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch from GraphQL endpoint',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GraphQL proxy endpoint',
    endpoint: GRAPHQL_ENDPOINT,
  });
}

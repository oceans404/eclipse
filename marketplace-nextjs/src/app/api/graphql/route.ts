import { NextRequest, NextResponse } from 'next/server';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 
  'https://indexer.dev.hyperindex.xyz/3d73070/v1/graphql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from GraphQL endpoint' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'GraphQL proxy endpoint' });
}
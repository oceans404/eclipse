import { NextResponse } from 'next/server';
import { gql } from '@apollo/client';
import { client } from '@/lib/apollo-client';

const GET_HIGHEST_PRODUCT_ID = gql`
  query GetHighestProductId {
    products(orderBy: { productId: desc }, limit: 1) {
      productId
    }
  }
`;

export async function GET() {
  try {
    // Query the GraphQL endpoint to get the highest product ID
    const { data } = await client.query({
      query: GET_HIGHEST_PRODUCT_ID,
      fetchPolicy: 'network-only', // Always fetch fresh data
    });

    let nextProductId = 10; // Default starting point

    if (data.products && data.products.length > 0) {
      const highestProductId = parseInt(data.products[0].productId);
      nextProductId = highestProductId + 1;
    }

    return NextResponse.json({
      nextProductId,
      message: `Next available product ID: ${nextProductId}`,
    });
  } catch (error) {
    console.error('Error fetching highest product ID:', error);

    // Return a reasonable fallback
    return NextResponse.json({
      nextProductId: Math.floor(Math.random() * 1000000),
      message: 'Using fallback product ID due to query error',
    });
  }
}

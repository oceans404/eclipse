import { NextRequest, NextResponse } from 'next/server';
import { getAllCreatorProfiles, initializeDatabase } from '@/lib/db';

// GET /api/creator - Get all creator profiles
export async function GET() {
  try {
    // Initialize database on first request
    await initializeDatabase();
    
    const profiles = await getAllCreatorProfiles();
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('GET all creator profiles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/creator - Initialize database (utility endpoint)
export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
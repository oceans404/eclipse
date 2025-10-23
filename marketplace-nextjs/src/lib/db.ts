import { sql } from '@vercel/postgres';

export interface CreatorProfile {
  address: string;
  name: string;
  description: string;
  image_url: string;
  created_at: Date;
  updated_at: Date;
}

// Initialize the creator_profiles table
export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS creator_profiles (
        address VARCHAR(42) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create an index on created_at for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_creator_profiles_created_at 
      ON creator_profiles(created_at);
    `;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Get creator profile by address
export async function getCreatorProfile(address: string): Promise<CreatorProfile | null> {
  try {
    const result = await sql`
      SELECT * FROM creator_profiles 
      WHERE address = ${address.toLowerCase()}
    `;
    
    return result.rows[0] as CreatorProfile || null;
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    throw error;
  }
}

// Create or update creator profile
export async function upsertCreatorProfile(profile: Omit<CreatorProfile, 'created_at' | 'updated_at'>): Promise<CreatorProfile> {
  try {
    const result = await sql`
      INSERT INTO creator_profiles (address, name, description, image_url, updated_at)
      VALUES (${profile.address.toLowerCase()}, ${profile.name}, ${profile.description}, ${profile.image_url}, CURRENT_TIMESTAMP)
      ON CONFLICT (address) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    return result.rows[0] as CreatorProfile;
  } catch (error) {
    console.error('Error upserting creator profile:', error);
    throw error;
  }
}

// Get all creator profiles (for creators page)
export async function getAllCreatorProfiles(): Promise<CreatorProfile[]> {
  try {
    const result = await sql`
      SELECT * FROM creator_profiles 
      ORDER BY created_at DESC
    `;
    
    return result.rows as CreatorProfile[];
  } catch (error) {
    console.error('Error fetching all creator profiles:', error);
    throw error;
  }
}

// Delete creator profile
export async function deleteCreatorProfile(address: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM creator_profiles 
      WHERE address = ${address.toLowerCase()}
    `;
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error deleting creator profile:', error);
    throw error;
  }
}
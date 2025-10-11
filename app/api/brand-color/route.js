import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const query = neon(process.env.DATABASE_URL);

// GET - Retrieve user's brand color and transparency
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await query`
      SELECT brand_color, brand_transparency FROM users WHERE id = ${userId}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { brandColor: '#667eea', brandTransparency: 0.5 }, // default values
        { status: 200 }
      );
    }

    return NextResponse.json({
      brandColor: result[0].brand_color || '#4880db',
      brandTransparency: result[0].brand_transparency !== null ? parseFloat(result[0].brand_transparency) : 0.5
    });

  } catch (error) {
    console.error('Error fetching brand color:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand color', brandColor: '#667eea', brandTransparency: 0.5 },
      { status: 500 }
    );
  }
}

// POST - Update user's brand color and transparency
export async function POST(request) {
  try {
    const { userId, brandColor, brandTransparency } = await request.json();

    if (!userId || !brandColor) {
      return NextResponse.json(
        { error: 'User ID and brand color are required' },
        { status: 400 }
      );
    }

    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(brandColor)) {
      return NextResponse.json(
        { error: 'Invalid color format. Use hex color (e.g., #667eea)' },
        { status: 400 }
      );
    }

    // Validate transparency if provided
    const transparency = brandTransparency !== undefined ? parseFloat(brandTransparency) : 0.5;
    if (transparency < 0 || transparency > 1) {
      return NextResponse.json(
        { error: 'Transparency must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await query`
      SELECT id FROM users WHERE id = ${userId}
    `;

    if (existingUser.length === 0) {
      // Create user record if doesn't exist
      await query`
        INSERT INTO users (id, email, password_hash, name, brand_color, brand_transparency)
        VALUES (${userId}, ${userId}@neon-auth.local, 'neon-auth-user', 'Neon Auth User', ${brandColor}, ${transparency})
      `;
    } else {
      // Update existing user's brand color and transparency
      await query`
        UPDATE users
        SET brand_color = ${brandColor}, brand_transparency = ${transparency}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
      `;
    }

    return NextResponse.json({
      message: 'Brand settings updated successfully',
      brandColor,
      brandTransparency: transparency
    });

  } catch (error) {
    console.error('Error updating brand settings:', error);
    return NextResponse.json(
      { error: 'Failed to update brand settings', details: error.message },
      { status: 500 }
    );
  }
}


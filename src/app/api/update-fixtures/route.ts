import { NextResponse } from 'next/server';
import { fetchFixtures } from '@/lib/api/football';
import { updateFixturesInGoogleSheets } from '@/lib/api/sheets';

export async function GET() {
  try {
    const fixtures = await fetchFixtures();
    await updateFixturesInGoogleSheets(fixtures);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${fixtures.length} fixtures` 
    });
  } catch (error) {
    console.error('Error in fixture update endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update fixtures' },
      { status: 500 }
    );
  }
} 
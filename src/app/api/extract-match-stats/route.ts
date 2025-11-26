import { NextRequest, NextResponse } from 'next/server';
import { extractMatchStatsFromImage } from '@/ai/flows/extract-match-stats-from-image';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchStatsImage } = body;

    if (!matchStatsImage) {
      return NextResponse.json(
        { error: 'Missing matchStatsImage in request body' },
        { status: 400 }
      );
    }

    const result = await extractMatchStatsFromImage({ matchStatsImage });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('=== API ROUTE: MATCH STATS EXTRACTION ERROR ===');
    console.error('Error Type:', error?.constructor?.name);
    console.error('Error Message:', error?.message);
    console.error('Error Stack:', error?.stack);
    console.error('===============================================');

    const errorMessage = error?.message || 'Unknown error occurred';
    const isApiKeyError = errorMessage.includes('API key') || 
                          errorMessage.includes('GEMINI_API_KEY') || 
                          errorMessage.includes('GOOGLE_API_KEY');

    return NextResponse.json(
      {
        error: isApiKeyError
          ? 'API key is missing or invalid. Please check your environment configuration.'
          : `Extraction failed: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

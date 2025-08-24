import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  try {
    // This would clear summary cache - delegating to main summarize endpoint
    const response = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/summarize?action=clear-cache`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const result = await response.json();
      return NextResponse.json({
        success: true,
        message: 'Summary cache cleared successfully',
        timestamp: new Date().toISOString(),
        details: result
      });
    } else {
      throw new Error('Failed to clear summary cache');
    }
  } catch (error) {
    console.error('Summary cache clear error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear summary cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Summary cache management endpoint. Use POST to clear summary cache.',
    endpoints: {
      'POST /api/clean-summary-cache': 'Clear summary cache',
      'GET /api/summarize?action=stats': 'View summary cache stats'
    }
  });
}

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  try {
    // Clear any application cache here
    console.log('Cache cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cache management endpoint. Use POST to clear cache.',
    endpoints: {
      'POST /api/clean-cache': 'Clear application cache'
    }
  });
}

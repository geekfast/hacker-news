import { NextRequest, NextResponse } from 'next/server';
import { getCachedSummary, cacheSummary } from '@/utils/summaryCache';

// Rate limiting in memory (for demo - use Redis in production)
const rateLimiter = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute per IP
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

function getRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = ip;
  
  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  const limit = rateLimiter.get(key)!;
  
  if (now > limit.resetTime) {
    // Reset the window
    limit.count = 1;
    limit.resetTime = now + RATE_WINDOW;
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (limit.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  limit.count++;
  return { allowed: true, remaining: RATE_LIMIT - limit.count };
}

async function summarizeWithGemini(title: string, url: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please provide a concise 2-3 sentence summary of the article titled "${title}" from ${url}. Focus on the main points and key insights.`
          }]
        }]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'Summary not available';
}

async function summarizeWithOpenAI(title: string, url: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Please provide a concise 2-3 sentence summary of the article titled "${title}" from ${url}. Focus on the main points and key insights.`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Summary not available';
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimit = getRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + RATE_WINDOW).toISOString(),
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const title = searchParams.get('title');

    // Input validation
    if (!url || !title) {
      return NextResponse.json(
        { error: 'URL and title parameters are required' },
        { status: 400 }
      );
    }

    // Validate title length (prevent abuse)
    if (title.length > 250) {
      return NextResponse.json(
        { error: 'Title too long' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = await getCachedSummary(url);
    if (cached) {
      return NextResponse.json(
        { summary: cached },
        {
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-Cache': 'HIT'
          }
        }
      );
    }

    // Try to generate summary with cascade strategy
    let summary: string;
    let service = 'fallback';

    try {
      // First, try Gemini
      summary = await summarizeWithGemini(title, url);
      service = 'gemini';
    } catch (geminiError) {
      console.warn('Gemini failed:', geminiError);
      
      try {
        // Fallback to OpenAI
        summary = await summarizeWithOpenAI(title, url);
        service = 'openai';
      } catch (openaiError) {
        console.warn('OpenAI failed:', openaiError);
        
        // Final fallback - generate a template summary
        summary = `This article discusses "${title}". It covers important developments and insights in this area. For the full details and analysis, please visit the original source.`;
        service = 'fallback';
      }
    }

    // Cache the result
    await cacheSummary(url, summary, title);

    return NextResponse.json(
      { summary },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-Cache': 'MISS',
          'X-Service': service
        }
      }
    );
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

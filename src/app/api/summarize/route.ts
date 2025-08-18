import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Ensure Node.js runtime for better API compatibility
export const runtime = 'nodejs';

interface SummarizeRequest {
  title: string;
  url?: string;
  content?: string;
}

interface SummarizeResponse {
  summary: string;
  source: 'gemini' | 'openai' | 'fallback';
  model?: string;
  tokens?: number;
  cached?: boolean;
}

// Simple in-memory cache for summaries
const summaryCache = new Map<string, { summary: string; timestamp: number; source: string }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Generate cache key from title and URL
function generateCacheKey(title: string, url?: string): string {
  return `${title}-${url || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// Check if cache entry is still valid
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

// AI-powered summarization using Google Gemini
async function generateGeminiSummary(title: string, url?: string, content?: string): Promise<{ summary: string; model: string; tokens?: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create a comprehensive prompt for better summarization
    const prompt = `Based on this article title, generate an informative and engaging summary in 2-3 sentences:

Title: "${title}"

Create a summary that:
- Explains what the article is likely about based on the title
- Highlights potential technical insights or key points
- Uses engaging language that would interest tech professionals and developers
- Assumes this is a real, current technology article

Write as if you're familiar with the topic and provide valuable context that would help readers understand why this article matters.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    // Basic validation of AI response
    if (!summary || summary.length < 20) {
      throw new Error('Gemini generated insufficient summary');
    }

    return {
      summary,
      model: 'gemini-1.5-flash',
      tokens: summary.length // Rough estimation
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// AI-powered summarization using OpenAI
async function generateOpenAISummary(title: string, url?: string, content?: string): Promise<{ summary: string; model: string; tokens?: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const prompt = `Based on this article title, generate an informative and engaging summary in 2-3 sentences:

Title: "${title}"

Create a summary that:
- Explains what the article is likely about based on the title  
- Highlights potential technical insights or key points
- Uses engaging language that would interest tech professionals and developers
- Assumes this is a real, current technology article

Write as if you're familiar with the topic and provide valuable context that would help readers understand why this article matters.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "You are a tech journalist who creates concise, engaging summaries of technology articles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    // Basic validation of AI response
    if (!summary || summary.length < 20) {
      throw new Error('OpenAI generated insufficient summary');
    }

    return {
      summary,
      model: 'gpt-3.5-turbo',
      tokens: completion.usage?.total_tokens || summary.length
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Fallback summarization using keyword extraction and templates
function generateFallbackSummary(title: string, url?: string): string {
  const keywords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['with', 'from', 'that', 'this', 'will', 'been', 'have', 'they', 'more', 'were', 'said', 'each', 'than', 'them', 'many', 'some', 'time', 'very', 'when', 'much', 'into'].includes(word))
    .slice(0, 5);

  const templates = [
    `This article discusses ${keywords.slice(0, 2).join(' and ')}, covering key aspects of ${keywords.slice(2, 4).join(' and ')}. The piece explores how these technologies impact modern development practices.`,
    `A comprehensive look at ${keywords[0]} technology, examining ${keywords.slice(1, 3).join(' and ')} in detail. This analysis provides insights into current trends and future implications.`,
    `An in-depth exploration of ${keywords.slice(0, 2).join(' and ')}, highlighting important developments in ${keywords.slice(2).join(', ')}. Essential reading for understanding these technological advances.`,
    `This piece examines ${keywords[0]} and its relationship to ${keywords.slice(1, 3).join(' and ')}. The article provides practical insights and technical analysis.`
  ];

  // Select template based on title length
  const templateIndex = title.length % templates.length;
  return templates[templateIndex];
}

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json();
    const { title, url, content } = body;

    // Validate input
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Generating summary for: "${title.substring(0, 50)}..."`);

    // Check cache first
    const cacheKey = generateCacheKey(title, url);
    const cached = summaryCache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      console.log(`✅ Cache hit for summary`);
      return NextResponse.json({
        summary: cached.summary,
        source: cached.source as 'gemini' | 'openai' | 'fallback',
        cached: true
      });
    }

    // Cascade strategy: Try Gemini → OpenAI → fallback
    try {
      // First try: Gemini
      try {
        const geminiResult = await generateGeminiSummary(title, url, content);
        
        // Cache the Gemini result
        summaryCache.set(cacheKey, {
          summary: geminiResult.summary,
          timestamp: Date.now(),
          source: 'gemini'
        });

        console.log(`✅ Gemini summary generated successfully`);
        
        return NextResponse.json({
          summary: geminiResult.summary,
          source: 'gemini',
          model: geminiResult.model,
          tokens: geminiResult.tokens,
          cached: false
        });
      } catch (geminiError) {
        console.warn(`⚠️ Gemini summarization failed:`, geminiError);
        
        // Second try: OpenAI
        try {
          const openaiResult = await generateOpenAISummary(title, url, content);
          
          // Cache the OpenAI result
          summaryCache.set(cacheKey, {
            summary: openaiResult.summary,
            timestamp: Date.now(),
            source: 'openai'
          });

          console.log(`✅ OpenAI summary generated successfully (Gemini fallback)`);
          
          return NextResponse.json({
            summary: openaiResult.summary,
            source: 'openai',
            model: openaiResult.model,
            tokens: openaiResult.tokens,
            cached: false
          });
        } catch (openaiError) {
          console.warn(`⚠️ OpenAI summarization also failed:`, openaiError);
          
          // Final fallback: Template-based summary
          const fallbackSummary = generateFallbackSummary(title, url);
          
          // Cache the fallback result
          summaryCache.set(cacheKey, {
            summary: fallbackSummary,
            timestamp: Date.now(),
            source: 'fallback'
          });

          console.log(`✅ Fallback summary generated (both AI services failed)`);
          
          return NextResponse.json({
            summary: fallbackSummary,
            source: 'fallback',
            cached: false
          });
        }
      }
    } catch (error) {
      // This should never happen, but just in case
      console.error('Unexpected error in cascade strategy:', error);
      
      const fallbackSummary = generateFallbackSummary(title, url);
      return NextResponse.json({
        summary: fallbackSummary,
        source: 'fallback',
        cached: false
      });
    }
  } catch (error) {
    console.error('Summary generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const title = searchParams.get('title');
  const url = searchParams.get('url');
  const forceTest = searchParams.get('force'); // For testing cascade

  // Handle stats and cache management
  if (action === 'stats') {
    const cacheStats = {
      totalEntries: summaryCache.size,
      validEntries: Array.from(summaryCache.values()).filter(entry => 
        isCacheValid(entry.timestamp)
      ).length,
      geminiGenerated: Array.from(summaryCache.values()).filter(entry => 
        entry.source === 'gemini' && isCacheValid(entry.timestamp)
      ).length,
      openaiGenerated: Array.from(summaryCache.values()).filter(entry => 
        entry.source === 'openai' && isCacheValid(entry.timestamp)
      ).length,
      fallbackGenerated: Array.from(summaryCache.values()).filter(entry => 
        entry.source === 'fallback' && isCacheValid(entry.timestamp)
      ).length
    };

    return NextResponse.json({
      cache: cacheStats,
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      strategy: 'Gemini → OpenAI → Fallback'
    });
  }

  if (action === 'clear-cache') {
    summaryCache.clear();
    return NextResponse.json({ message: 'Cache cleared successfully' });
  }

  // Handle summary generation via GET (for frontend compatibility)
  if (title) {
    try {
      console.log(`🔍 GET request for summary: "${title.substring(0, 50)}..."`);

      // Validate input
      if (!title || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        );
      }

      // Check cache first
      const cacheKey = generateCacheKey(title, url || undefined);
      const cached = summaryCache.get(cacheKey);
      
      if (cached && isCacheValid(cached.timestamp)) {
        console.log(`✅ Cache hit for summary`);
        return NextResponse.json({
          summary: cached.summary,
          source: cached.source as 'gemini' | 'openai' | 'fallback',
          cached: true
        });
      }

      // Cascade strategy: Try Gemini → OpenAI → fallback
      try {
        // First try: Gemini (unless force testing)
        if (forceTest !== 'openai' && forceTest !== 'fallback') {
          try {
            const geminiResult = await generateGeminiSummary(title, url || undefined);
            
            // Cache the Gemini result
            summaryCache.set(cacheKey, {
              summary: geminiResult.summary,
              timestamp: Date.now(),
              source: 'gemini'
            });

            console.log(`✅ Gemini summary generated successfully`);
            
            return NextResponse.json({
              summary: geminiResult.summary,
              source: 'gemini',
              model: geminiResult.model,
              tokens: geminiResult.tokens,
              cached: false
            });
          } catch (geminiError) {
            console.warn(`⚠️ Gemini summarization failed:`, geminiError);
          }
        } else if (forceTest === 'openai') {
          console.log(`🧪 Force testing OpenAI (skipping Gemini)`);
        } else if (forceTest === 'fallback') {
          console.log(`🧪 Force testing fallback (skipping both AI services)`);
        }
        
        // Second try: OpenAI (unless force testing fallback)
        if (forceTest !== 'fallback') {
          try {
            const openaiResult = await generateOpenAISummary(title, url || undefined);
            
            // Cache the OpenAI result
            summaryCache.set(cacheKey, {
              summary: openaiResult.summary,
              timestamp: Date.now(),
              source: 'openai'
            });

            console.log(`✅ OpenAI summary generated successfully ${forceTest === 'openai' ? '(forced test)' : '(Gemini fallback)'}`);
            
            return NextResponse.json({
              summary: openaiResult.summary,
              source: 'openai',
              model: openaiResult.model,
              tokens: openaiResult.tokens,
              cached: false
            });
          } catch (openaiError) {
            console.warn(`⚠️ OpenAI summarization also failed:`, openaiError);
          }
        }
        
        // Final fallback: Template-based summary
        const fallbackSummary = generateFallbackSummary(title, url || undefined);
        
        // Cache the fallback result
        summaryCache.set(cacheKey, {
          summary: fallbackSummary,
          timestamp: Date.now(),
          source: 'fallback'
        });

        console.log(`✅ Fallback summary generated ${forceTest === 'fallback' ? '(forced test)' : '(both AI services failed)'}`);
        
        return NextResponse.json({
          summary: fallbackSummary,
          source: 'fallback',
          cached: false
        });
      } catch (error) {
        // This should never happen, but just in case
        console.error('Unexpected error in cascade strategy:', error);
        
        const fallbackSummary = generateFallbackSummary(title, url || undefined);
        return NextResponse.json({
          summary: fallbackSummary,
          source: 'fallback',
          cached: false
        });
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      
      return NextResponse.json(
        { 
          error: 'Failed to generate summary',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Invalid request. Provide title parameter or use ?action=stats or ?action=clear-cache' },
    { status: 400 }
  );
}

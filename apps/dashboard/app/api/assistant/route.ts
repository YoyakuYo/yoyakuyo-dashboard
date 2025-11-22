// apps/dashboard/app/api/assistant/route.ts
// API route for AI Assistant

import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/apiClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, shopId } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;

    // Fetch shop details if shopId is provided
    let shopContext = '';
    if (shopId) {
      try {
        const shopResponse = await fetch(`${apiUrl}/shops/${shopId}`);
        if (shopResponse.ok) {
          const shop = await shopResponse.json();
          const shopName = shop?.name || 'your shop';
          const shopCategory = shop?.category || 'business';
          const shopDescription = shop?.description || '';
          const shopLocation = shop?.address || shop?.city || shop?.prefecture || '';
          
          shopContext = `\n\nSHOP CONTEXT:
- Shop Name: ${shopName}
- Category: ${shopCategory}`;
          if (shopDescription) {
            shopContext += `\n- Description: ${shopDescription}`;
          }
          if (shopLocation) {
            shopContext += `\n- Location: ${shopLocation}`;
          }
        }
      } catch (error) {
        console.error('Error fetching shop details:', error);
      }
    }

    // If no API key, return a friendly stub response
    if (!openaiApiKey) {
      return NextResponse.json({
        response: `I understand you're asking: "${prompt.trim()}"\n\nTo enable AI responses, please set the OPENAI_API_KEY environment variable in your dashboard configuration. For now, here's a helpful placeholder response:\n\nI'm here to help you with your shop! I can assist with writing descriptions, creating messages, suggesting marketing ideas, and more. Once the OpenAI API key is configured, I'll be able to provide more detailed and personalized responses.`,
        message: 'AI Assistant is running in stub mode. Set OPENAI_API_KEY to enable full functionality.',
      });
    }

    // Real OpenAI API call
    try {
      const shopName = shopContext ? shopContext.match(/Shop Name: (.+)/)?.[1] || 'your shop' : 'your shop';
      const shopCategory = shopContext ? shopContext.match(/Category: (.+)/)?.[1] || 'business' : 'business';
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a helpful AI assistant for the owner of "${shopName}"${shopCategory ? ` (a ${shopCategory})` : ''} using Yoyaku Yo, a booking management platform.${shopContext}\n\nHelp them with shop descriptions, customer messages, marketing ideas, and business advice. Be concise, friendly, and professional.`,
            },
            {
              role: 'user',
              content: prompt.trim(),
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error('OpenAI API error:', errorData);
        return NextResponse.json(
          {
            error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
            response: 'I apologize, but I encountered an error while processing your request. Please try again later.',
          },
          { status: openaiResponse.status }
        );
      }

      const data = await openaiResponse.json();
      const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        return NextResponse.json(
          {
            error: 'No response from OpenAI',
            response: 'I apologize, but I did not receive a valid response. Please try again.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        response: assistantMessage,
      });
    } catch (fetchError) {
      console.error('Error calling OpenAI API:', fetchError);
      return NextResponse.json(
        {
          error: 'Failed to connect to OpenAI API',
          response: 'I apologize, but I encountered a network error. Please check your internet connection and try again.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in assistant API route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        response: 'I apologize, but something went wrong. Please try again later.',
      },
      { status: 500 }
    );
  }
}


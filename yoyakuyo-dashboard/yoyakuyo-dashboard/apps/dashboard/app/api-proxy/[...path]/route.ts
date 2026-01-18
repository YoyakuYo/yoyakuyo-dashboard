// Proxy API requests to external API server
import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/apiClient';

// Use centralized API URL
const API_URL = apiUrl;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const path = pathSegments.join('/');
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const targetUrl = `${API_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const body = method !== 'GET' && method !== 'DELETE' 
      ? await request.text() 
      : undefined;

    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'x-user-id': request.headers.get('x-user-id') || '',
      },
      body,
    });

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error: any) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to API server' },
      { status: 500 }
    );
  }
}

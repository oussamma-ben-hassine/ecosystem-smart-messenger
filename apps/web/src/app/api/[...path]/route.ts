import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const getBackendUrl = () => {
  return process.env.API_INTERNAL_URL || 'http://messenger-api:4000';
};

async function proxyRequest(request: NextRequest, pathParts: string[]) {
  const backendBase = getBackendUrl();
  const path = pathParts.join('/');
  const searchParams = request.nextUrl.search;
  const targetUrl = `${backendBase}/api/${path}${searchParams}`;

  const headers: Record<string, string> = {};
  const auth = request.headers.get('authorization');
  if (auth) headers['authorization'] = auth;
  const contentType = request.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;
  const accept = request.headers.get('accept');
  if (accept) headers['accept'] = accept;

  const fetchOptions: any = {
    method: request.method,
    headers,
  };

  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    fetchOptions.duplex = 'half';
    try {
      const text = await request.text();
      if (text) {
        fetchOptions.body = text;
      }
    } catch {
      // Body may be empty
    }
  }

  try {
    const res = await fetch(targetUrl, fetchOptions);
    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    const responseBody = await res.arrayBuffer();
    return new NextResponse(responseBody, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[API Proxy Error] Failed to proxy ${request.method} to ${targetUrl}:`, err.message);
    return NextResponse.json(
      {
        error: 'Backend API Gateway Unavailable',
        message: err.message,
        cause: err.cause ? String(err.cause) : undefined,
        target: targetUrl,
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path);
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path);
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path);
}

import { NextRequest, NextResponse } from 'next/server';

// This allows the request to stay open for the full 72+ seconds
export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');
  
  // Call the Python backend directly from the Node.js runtime
  const backendUrl = `http://127.0.0.1:8000/api/generate-flow?topic=${topic}`;

  try {
    const response = await fetch(backendUrl, { cache: 'no-store' });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'AI Generation Timeout' }, { status: 504 });
  }
}
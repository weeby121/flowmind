import { NextRequest, NextResponse } from 'next/server'

// Use 'export default' to satisfy the Next.js 16 build engine
export default function proxy(request: NextRequest) {
  // We only want to proxy the upload and other light tasks
  // We EXCLUDE 'generate-flow' because it takes > 60 seconds
  if (request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.includes('generate-flow')) {
    const targetUrl = 'http://127.0.0.1:8000' + request.nextUrl.pathname + request.nextUrl.search;
    return NextResponse.rewrite(new URL(targetUrl, request.url));
  }
}

export const config = {
  // Ensure the matcher doesn't interfere with the Route Handler
  matcher: ['/api/:path*'],
}
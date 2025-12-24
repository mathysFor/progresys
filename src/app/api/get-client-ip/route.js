import { NextResponse } from 'next/server';

/**
 * Get client IP address from request headers
 * Handles proxies and X-Forwarded-For headers
 */
function getClientIP(request) {
  // Try various headers in order of priority
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address (may not work in all deployments)
  // In Next.js Edge/Serverless, this won't be available
  return request.ip || null;
}

export async function GET(request) {
  try {
    const clientIP = getClientIP(request);
    
    if (!clientIP) {
      return NextResponse.json(
        { error: 'Could not determine client IP address' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      ip: clientIP 
    });
  } catch (error) {
    console.error('Error getting client IP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get client IP' },
      { status: 500 }
    );
  }
}


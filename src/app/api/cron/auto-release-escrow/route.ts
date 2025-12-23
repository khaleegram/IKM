import { NextRequest, NextResponse } from 'next/server';
import { autoReleaseEscrow } from '@/lib/order-delivery-actions';

/**
 * Cron job endpoint to auto-release escrow funds
 * 
 * This should be called daily by a cron service (Vercel Cron, external service, etc.)
 * 
 * Security: Protect this endpoint with a secret token or IP whitelist
 * Example: Add ?secret=YOUR_SECRET_TOKEN to the URL
 */
export async function GET(req: NextRequest) {
  try {
    // Verify secret token (if provided)
    const secret = req.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run auto-release
    const result = await autoReleaseEscrow();

    return NextResponse.json({
      success: true,
      message: `Auto-release completed. ${result.released} orders processed.`,
      released: result.released,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Auto-release escrow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for cron services that prefer POST
export async function POST(req: NextRequest) {
  return GET(req);
}


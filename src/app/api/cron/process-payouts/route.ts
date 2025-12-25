import { processDuePayouts } from '@/lib/payout-request-actions';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron job endpoint to automatically process due payouts
 * 
 * This should be called daily by a cron service (Vercel Cron, external service, etc.)
 * Recommended: Run once per day (e.g., 9:00 AM UTC)
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

    // Process due payouts
    const result = await processDuePayouts();

    return NextResponse.json({
      success: true,
      message: `Payout processing completed. ${result.processed} processed, ${result.failed} failed.`,
      processed: result.processed,
      failed: result.failed,
      processedIds: result.processedIds,
      failedDetails: result.failedDetails,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Process payouts error:', error);
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


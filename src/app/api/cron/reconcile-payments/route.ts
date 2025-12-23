import { NextRequest, NextResponse } from 'next/server';
import { reconcilePayments } from '@/lib/payment-reconciliation';

/**
 * Cron job endpoint to reconcile payments
 * Runs daily to check for payment discrepancies
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

    // Run reconciliation
    const result = await reconcilePayments();

    return NextResponse.json({
      success: true,
      message: `Reconciliation completed. Checked ${result.checked} payments, found ${result.issuesFound} issues.`,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Payment reconciliation error:', error);
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


import { NextRequest, NextResponse } from 'next/server';
import { globalSearch } from '@/lib/search-actions';
import { getAuth } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const auth = await getAuth();
    if (!auth.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const query = body?.query as string;
    const sellerId = body?.sellerId as string | undefined || auth.uid;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: 'query must be at least 2 characters' }, { status: 400 });
    }

    const results = await globalSearch(query, sellerId);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Search failed' 
    }, { status: 500 });
  }
}


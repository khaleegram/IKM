import { verifySessionCookieInServerAction } from '@/lib/auth-utils';
import { globalSearch, searchProducts } from '@/lib/search-actions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body?.query as string;
    const sellerId = body?.sellerId as string | undefined;
    const searchType = body?.type as 'products' | 'global' | undefined || 'global';

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: 'query must be at least 2 characters' }, { status: 400 });
    }

    // For product-only search (buyer-facing), no auth required
    if (searchType === 'products') {
      const products = await searchProducts(query, sellerId, 50);
      return NextResponse.json({ 
        success: true, 
        results: { 
          products, 
          orders: [], 
          customers: [], 
          totalResults: products.length 
        } 
      });
    }

    // For global search (seller dashboard), auth required
    const auth = await verifySessionCookieInServerAction();
    if (!auth || !auth.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await globalSearch(query, sellerId || auth.uid);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Search failed' 
    }, { status: 500 });
  }
}


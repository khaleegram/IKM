'use server';

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

/**
 * Track product view
 */
export async function trackProductView(productId: string) {
    try {
        const firestore = getAdminFirestore();
        const productRef = firestore.collection('products').doc(productId);
        
        const { FieldValue } = await import('firebase-admin/firestore');
        await productRef.update({
            views: FieldValue.increment(1),
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error tracking product view:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Get product analytics
 */
export async function getProductAnalytics(productId: string, userId: string) {
    const auth = await requireAuth();
    const firestore = getAdminFirestore();
    
    const productDoc = await firestore.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
        throw new Error('Product not found');
    }
    
    const product = productDoc.data() as { sellerId: string };
    
    if (product.sellerId !== userId && !auth.isAdmin) {
        throw new Error('Unauthorized');
    }
    
    // Get orders for this product
    const ordersSnapshot = await firestore.collection('orders')
        .where('sellerId', '==', product.sellerId)
        .get();
    
    let totalSales = 0;
    let totalRevenue = 0;
    
    ordersSnapshot.forEach(doc => {
        const order = doc.data();
        order.items?.forEach((item: any) => {
            if (item.productId === productId) {
                totalSales += item.quantity || 0;
                totalRevenue += (item.price || 0) * (item.quantity || 0);
            }
        });
    });
    
    const productData = productDoc.data();
    
    return {
        views: productData?.views || 0,
        salesCount: totalSales,
        revenue: totalRevenue,
        conversionRate: (productData?.views || 0) > 0 ? (totalSales / productData.views) * 100 : 0,
    };
}


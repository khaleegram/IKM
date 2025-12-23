'use server';

import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/auth-utils";
import { FieldValue } from 'firebase-admin/firestore';

const sendEmailSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
  recipientType: z.enum(['all', 'segment', 'custom']),
  segment: z.string().optional(),
  recipientEmails: z.array(z.string().email()).optional(),
  sellerId: z.string(),
});

/**
 * Send email to customers
 * Note: This is a placeholder implementation. In production, integrate with:
 * - Resend (https://resend.com)
 * - SendGrid (https://sendgrid.com)
 * - AWS SES (https://aws.amazon.com/ses/)
 * - Mailgun (https://www.mailgun.com)
 */
export async function sendMarketingEmail(data: unknown) {
  const auth = await requireAuth();
  const validation = sendEmailSchema.safeParse(data);
  
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }

  const { sellerId, subject, message, recipientType, segment, recipientEmails } = validation.data;

  // Verify seller owns this campaign
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized: You can only send emails for your own store');
  }

  const firestore = getAdminFirestore();

  // Get recipient emails based on type
  let emails: string[] = [];

  if (recipientType === 'all') {
    // Get all customers who have ordered from this seller
    const ordersQuery = await firestore
      .collection('orders')
      .where('sellerId', '==', sellerId)
      .get();

    const customerIds = new Set<string>();
    ordersQuery.forEach(doc => {
      const order = doc.data();
      if (order.customerId) {
        customerIds.add(order.customerId);
      }
      if (order.customerInfo?.email) {
        emails.push(order.customerInfo.email);
      }
    });

    // Also get emails from user profiles
    for (const customerId of customerIds) {
      try {
        const userDoc = await firestore.collection('users').doc(customerId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData?.email) {
            emails.push(userData.email);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch user ${customerId}:`, error);
      }
    }
  } else if (recipientType === 'segment') {
    // Get customers by segment (VIP, Regular, New)
    const ordersQuery = await firestore
      .collection('orders')
      .where('sellerId', '==', sellerId)
      .get();

    // Calculate customer segments (simplified - in production, use a more sophisticated algorithm)
    const customerData = new Map<string, { totalSpent: number; orderCount: number; lastOrder: Date }>();

    ordersQuery.forEach(doc => {
      const order = doc.data();
      const customerId = order.customerId;
      if (!customerId) return;

      const existing = customerData.get(customerId) || { totalSpent: 0, orderCount: 0, lastOrder: new Date(0) };
      existing.totalSpent += order.total || 0;
      existing.orderCount += 1;
      
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
      if (orderDate > existing.lastOrder) {
        existing.lastOrder = orderDate;
      }
      
      customerData.set(customerId, existing);
    });

    // Filter by segment
    const now = new Date();
    for (const [customerId, data] of customerData.entries()) {
      let matchesSegment = false;
      
      if (segment === 'VIP') {
        matchesSegment = data.totalSpent >= 50000 || data.orderCount >= 10;
      } else if (segment === 'Regular') {
        const daysSinceFirstOrder = (now.getTime() - data.lastOrder.getTime()) / (1000 * 60 * 60 * 24);
        matchesSegment = daysSinceFirstOrder > 30 && data.orderCount >= 2;
      } else if (segment === 'New') {
        const daysSinceFirstOrder = (now.getTime() - data.lastOrder.getTime()) / (1000 * 60 * 60 * 24);
        matchesSegment = daysSinceFirstOrder <= 30;
      }

      if (matchesSegment) {
        try {
          const userDoc = await firestore.collection('users').doc(customerId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData?.email) {
              emails.push(userData.email);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch user ${customerId}:`, error);
        }
      }
    }
  } else if (recipientType === 'custom' && recipientEmails) {
    emails = recipientEmails;
  }

  // Remove duplicates
  emails = [...new Set(emails)];

  if (emails.length === 0) {
    throw new Error('No recipients found');
  }

  // Store email campaign in Firestore
  const campaignRef = await firestore.collection('email_campaigns').add({
    sellerId,
    subject,
    message,
    recipientType,
    segment: segment || null,
    recipientCount: emails.length,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  });

  // Send via Resend
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const sendResults = await Promise.allSettled(
    emails.map(email =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'no-reply@your-subdomain.com',
          to: email,
          subject,
          html: message,
        }),
      })
    )
  );

  const successCount = sendResults.filter(r => r.status === 'fulfilled').length;

  // Update campaign status
  await campaignRef.update({
    status: 'sent',
    sentAt: FieldValue.serverTimestamp(),
    deliveredCount: successCount,
  });

  return {
    success: true,
    campaignId: campaignRef.id,
    recipientCount: emails.length,
    message: `Email campaign sent to ${successCount} of ${emails.length} recipients.`,
  };
}

/**
 * Get email campaigns for a seller
 */
export async function getEmailCampaigns(sellerId: string) {
  const auth = await requireAuth();
  
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const firestore = getAdminFirestore();
  const campaignsQuery = await firestore
    .collection('email_campaigns')
    .where('sellerId', '==', sellerId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return campaignsQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}


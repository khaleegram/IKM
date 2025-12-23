'use server';

import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Email notification system
 * Note: This is a placeholder. In production, integrate with:
 * - SendGrid
 * - AWS SES
 * - Resend
 * - Nodemailer with SMTP
 */

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email notification
 * TODO: Integrate with actual email service
 */
async function sendEmail(data: EmailData): Promise<boolean> {
  // Placeholder - in production, use actual email service
  console.log('📧 Email would be sent:', {
    to: data.to,
    subject: data.subject,
  });
  
  // Store email in Firestore for logging/debugging
  const firestore = getAdminFirestore();
  await firestore.collection('email_logs').add({
    ...data,
    sent: false, // Set to true when actual email service is integrated
    createdAt: FieldValue.serverTimestamp(),
  });
  
  return true;
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(orderId: string, customerEmail: string, orderData: any) {
  const subject = `Order Confirmed - ${orderId.slice(0, 7)}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4285F4; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .item { padding: 10px; border-bottom: 1px solid #eee; }
        .total { font-size: 18px; font-weight: bold; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hello ${orderData.customerInfo?.name || 'Customer'},</p>
          <p>Thank you for your purchase! Your order has been confirmed and payment received.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${orderId.slice(0, 7)}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            
            <h4>Items:</h4>
            ${orderData.items?.map((item: any) => `
              <div class="item">
                <strong>${item.name}</strong> x ${item.quantity} - ₦${item.price.toLocaleString()}
              </div>
            `).join('')}
            
            <div class="total">
              <strong>Total: ₦${orderData.total.toLocaleString()}</strong>
            </div>
          </div>
          
          <p>Your order is now being processed. You'll receive updates as your order progresses.</p>
          <p>You can track your order in your account dashboard.</p>
        </div>
        <div class="footer">
          <p>IKM Marketplace</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({ to: customerEmail, subject, html });
}

/**
 * Send order status update email
 */
export async function sendOrderStatusUpdateEmail(orderId: string, customerEmail: string, status: string, orderData: any) {
  const statusMessages: Record<string, string> = {
    'Processing': 'Your order is being processed',
    'Shipped': 'Your order has been shipped!',
    'Delivered': 'Your order has been delivered!',
    'Cancelled': 'Your order has been cancelled',
  };
  
  const subject = `Order Update - ${orderId.slice(0, 7)}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4285F4; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .status-badge { display: inline-block; padding: 8px 16px; background: #0F9D58; color: white; border-radius: 5px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Status Update</h1>
        </div>
        <div class="content">
          <p>Hello ${orderData.customerInfo?.name || 'Customer'},</p>
          <p>${statusMessages[status] || 'Your order status has been updated'}.</p>
          
          <p><strong>Order ID:</strong> ${orderId.slice(0, 7)}</p>
          <p><strong>New Status:</strong> <span class="status-badge">${status}</span></p>
          
          ${status === 'Shipped' ? '<p>Your order is on its way! You can track it in your account dashboard.</p>' : ''}
          ${status === 'Delivered' ? '<p>We hope you enjoy your purchase! Please consider leaving a review.</p>' : ''}
        </div>
        <div class="footer">
          <p>IKM Marketplace</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({ to: customerEmail, subject, html });
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(orderId: string, customerEmail: string, paymentData: any) {
  const subject = `Payment Receipt - ${orderId.slice(0, 7)}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0F9D58; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .receipt { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Receipt</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Thank you for your payment. Here's your receipt:</p>
          
          <div class="receipt">
            <p><strong>Order ID:</strong> ${orderId.slice(0, 7)}</p>
            <p><strong>Payment Reference:</strong> ${paymentData.reference}</p>
            <p><strong>Amount:</strong> ₦${paymentData.amount.toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${paymentData.method || 'Paystack'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>This receipt can be downloaded from your account dashboard.</p>
        </div>
        <div class="footer">
          <p>IKM Marketplace</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({ to: customerEmail, subject, html });
}

/**
 * Send payout notification to seller
 */
export async function sendPayoutNotificationEmail(sellerEmail: string, payoutData: any) {
  const subject = `Payout ${payoutData.status === 'completed' ? 'Completed' : 'Update'}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4285F4; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .payout-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payout ${payoutData.status === 'completed' ? 'Completed' : 'Update'}</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your payout request has been ${payoutData.status}.</p>
          
          <div class="payout-details">
            <p><strong>Amount:</strong> ₦${payoutData.amount.toLocaleString()}</p>
            <p><strong>Account:</strong> ${payoutData.accountName} - ${payoutData.bankName}</p>
            <p><strong>Status:</strong> ${payoutData.status}</p>
            ${payoutData.transferReference ? `<p><strong>Transfer Reference:</strong> ${payoutData.transferReference}</p>` : ''}
            ${payoutData.failureReason ? `<p><strong>Reason:</strong> ${payoutData.failureReason}</p>` : ''}
          </div>
          
          ${payoutData.status === 'completed' ? '<p>The funds have been transferred to your bank account.</p>' : ''}
          ${payoutData.status === 'failed' ? '<p>Please check your account details and try again, or contact support.</p>' : ''}
        </div>
        <div class="footer">
          <p>IKM Marketplace</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({ to: sellerEmail, subject, html });
}

/**
 * Send new order notification to seller
 */
export async function sendNewOrderNotificationEmail(sellerEmail: string, orderId: string, orderData: any) {
  const subject = `New Order Received - ${orderId.slice(0, 7)}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0F9D58; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Order Received!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have received a new order!</p>
          
          <div class="order-details">
            <p><strong>Order ID:</strong> ${orderId.slice(0, 7)}</p>
            <p><strong>Customer:</strong> ${orderData.customerInfo?.name || 'N/A'}</p>
            <p><strong>Total:</strong> ₦${orderData.total.toLocaleString()}</p>
            <p><strong>Items:</strong> ${orderData.items?.length || 0} item(s)</p>
          </div>
          
          <p>Please process this order as soon as possible. You can view and manage it in your seller dashboard.</p>
        </div>
        <div class="footer">
          <p>IKM Marketplace</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({ to: sellerEmail, subject, html });
}


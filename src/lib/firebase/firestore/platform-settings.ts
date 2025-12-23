export interface PlatformSettings {
  id: string;
  // Commission & Revenue
  platformCommissionRate: number; // e.g., 0.05 for 5%
  minimumPayoutAmount: number; // e.g., 1000 for ₦1000
  
  // Revenue tracking
  totalRevenue: number; // Total platform revenue from commissions
  totalTransactions: number; // Total number of transactions
  
  // Additional settings
  platformFee: number; // Optional platform fee (separate from commission)
  currency: string; // e.g., "NGN"
  
  // Metadata
  updatedAt: any;
  updatedBy: string; // Admin user ID who last updated
  createdAt: any;
}


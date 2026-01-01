import { generateStoreMetadata, getStoreForMetadata } from '@/lib/store-metadata';
import { Metadata } from 'next';
import { SellerStoreContent } from './SellerStoreContent';

interface StorePageProps {
  params: Promise<{ sellerId: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { sellerId } = await params;
  const store = await getStoreForMetadata(sellerId);
  
  if (!store) {
    return {
      title: 'Store Not Found - IKM Marketplace',
    };
  }
  
  return generateStoreMetadata(store, sellerId);
}

export default async function SellerStorePage({ params }: StorePageProps) {
  const { sellerId } = await params;
  
  return <SellerStoreContent sellerId={sellerId} />;

}

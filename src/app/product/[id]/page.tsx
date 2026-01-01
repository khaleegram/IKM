import { generateProductMetadata, getProductForMetadata } from '@/lib/product-metadata';
import { Metadata } from 'next';
import { ProductDetailContent } from './ProductDetailContent';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id: productId } = await params;
  const product = await getProductForMetadata(productId);
  
  if (!product) {
    return {
      title: 'Product Not Found - IKM Marketplace',
    };
  }
  
  return generateProductMetadata(product);
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id: productId } = await params;
  
  return <ProductDetailContent productId={productId} />;
}

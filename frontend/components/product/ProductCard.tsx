import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images?.[0]?.url || 'https://via.placeholder.com/400x400?text=No+Image';
  const discount = product.comparePrice 
    ? Math.round(((Number(product.comparePrice) - Number(product.basePrice)) / Number(product.comparePrice)) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 transition-all duration-500 group-hover:shadow-2xl">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {discount > 0 && (
          <div className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            -{discount}%
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-12 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <button className="whitespace-nowrap rounded-full bg-white px-6 py-2 text-sm font-bold text-black shadow-xl hover:bg-black hover:text-white transition-colors duration-300">
            Xem chi tiết
          </button>
        </div>
      </div>
      
      <div className="mt-4 space-y-1">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 uppercase tracking-widest">{product.category?.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(Number(product.basePrice))}
          </span>
          {product.comparePrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(Number(product.comparePrice))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

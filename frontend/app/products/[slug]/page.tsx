import { getProductBySlug } from '@/lib/product-actions';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { ProductVariant } from '@/types';
import { Suspense } from 'react';
import Link from 'next/link';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const mainImage = product.images?.[0]?.url || 'https://via.placeholder.com/800x800?text=No+Image';

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12 lg:py-20">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-black transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-black transition-colors">Sản phẩm</Link>
          <span>/</span>
          <span className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-16">
          {/* Image Gallery */}
          <div className="flex flex-col">
            <div className="aspect-square w-full overflow-hidden rounded-3xl bg-gray-100 shadow-inner group relative">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
            
            {product.images.length > 1 && (
              <div className="mt-6 grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer border-2 border-transparent hover:border-black transition-all">
                    <Image src={img.url} alt={img.alt || product.name} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-blue-600">
                {product.category?.name}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 lg:text-5xl">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(Number(product.basePrice))}
                </span>
                {product.comparePrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(Number(product.comparePrice))}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Mô tả sản phẩm</h3>
              <div className="prose prose-sm text-gray-600 max-w-none leading-relaxed">
                {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
              </div>
            </div>

            {/* Variants (Placeholder for interactivity) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Phân loại</h3>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      className="rounded-xl border-2 border-gray-200 px-6 py-2 text-sm font-medium transition-all hover:border-black hover:bg-black hover:text-white"
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 rounded-2xl bg-black px-8 py-4 text-center font-bold text-white shadow-2xl transition-all hover:bg-gray-800 hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 active:scale-95">
                  Thêm vào giỏ hàng
                </button>
                <button className="rounded-2xl border-2 border-gray-200 bg-white px-8 py-4 font-bold text-black transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 active:scale-95">
                  Mua ngay
                </button>
              </div>
              <p className="text-center text-xs text-gray-400">Miễn phí giao hàng cho đơn hàng trên 500k</p>
            </div>
          </div>
        </div>

        {/* Featured Products section can be added here */}
      </div>
    </div>
  );
}

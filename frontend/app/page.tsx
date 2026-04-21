import { getProducts, getCategories } from '@/lib/product-actions';
import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import Image from 'next/image';

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getProducts({ limit: 4, sort: 'newest' }),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
            alt="Antigravity Header"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>
        
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="animate-fade-in-up text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl">
            Tương Lai <span className="text-blue-400">Thời Trang</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-200 sm:text-xl lg:text-2xl leading-relaxed">
            Khám phá bộ sưu tập mới nhất với phong cách độc bản và chất lượng không thỏa hiệp. Đẳng cấp đến từng đường kim mũi chỉ.
          </p>
          <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row">
            <Link
              href="/products"
              className="rounded-full bg-white px-10 py-4 text-lg font-bold text-black transition-all hover:scale-105 hover:bg-gray-100 hover:shadow-2xl shadow-white/20 active:scale-95"
            >
              Mua sắm ngay
            </Link>
            <Link
              href="/about"
              className="group flex items-center gap-2 text-lg font-semibold text-white hover:text-blue-400 transition-colors"
            >
              Tìm hiểu thêm
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="mb-12 flex items-end justify-between">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Sản phẩm nổi bật</h2>
            <div className="h-1.5 w-20 rounded-full bg-blue-600" />
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-2 font-bold text-gray-900 transition-colors hover:text-blue-600"
          >
            Xem tất cả
            <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Categories Banner */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-12">Danh mục mua sắm</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.slice(0, 3).map((cat, idx) => (
               <Link href={`/products?categoryId=${cat.id}`} key={cat.id} className="group relative h-80 overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5">
                 <Image 
                   src={cat.imageUrl || `https://images.unsplash.com/photo-${idx === 0 ? '1523381210434-271e8be1f52b' : idx === 1 ? '1606107557195-0e29a4b5b4aa' : '1549298916-b41d501d3772'}?q=80&w=2070&auto=format&fit=crop`} 
                   alt={cat.name} 
                   fill 
                   className="object-cover transition-transform duration-700 group-hover:scale-110"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:opacity-90" />
                 <div className="absolute bottom-8 left-8 text-left text-white">
                   <h3 className="text-2xl font-bold">{cat.name}</h3>
                   <p className="mt-2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">Khám phá ngay &rarr;</p>
                 </div>
               </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-[40px] bg-black px-8 py-20 text-center text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=2070&auto=format&fit=crop"
              alt="Join us"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Gia nhập cộng đồng Antigravity</h2>
            <p className="mt-6 max-w-xl text-lg text-gray-400 leading-relaxed">
              Nhận ưu đãi độc quyền, cập nhật sớm nhất về các bộ sưu tập giới hạn và quà tặng sinh nhật.
            </p>
            <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="w-full rounded-2xl bg-white/10 border border-white/20 px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500"
              />
              <button className="whitespace-nowrap rounded-2xl bg-white px-8 py-4 font-bold text-black transition-all hover:bg-gray-200 active:scale-95">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { getProducts, getCategories } from '@/lib/product-actions';
import ProductList from '@/components/product/ProductList';
import FilterBar from '@/components/product/FilterBar';
import { Suspense } from 'react';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    categoryId?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  
  const categories = await getCategories();
  const productsResponse = await getProducts({
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
    categoryId: params.categoryId,
    sort: params.sort,
  });

  return (
    <div className="container mx-auto px-4 py-12 lg:py-20">
      <div className="mb-12 flex flex-col gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 lg:text-5xl">
          Tất cả sản phẩm
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl">
          Khám phá bộ sưu tập sản phẩm cao cấp của chúng tôi với chất lượng tốt nhất và giá cả hợp lý.
        </p>
      </div>

      <div className="mb-10">
        <FilterBar categories={categories} />
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-2xl bg-gray-200" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/4 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      }>
        <ProductList products={productsResponse.data} />
      </Suspense>

      {/* Pagination (Simple) */}
      {productsResponse.meta.totalPages > 1 && (
        <div className="mt-16 flex justify-center gap-2">
           {/* Add pagination controls here if needed */}
        </div>
      )}
    </div>
  );
}

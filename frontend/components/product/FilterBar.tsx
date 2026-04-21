'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Category } from '@/types';
import { useState, useCallback, useTransition } from 'react';

interface FilterBarProps {
  categories: Category[];
}

export default function FilterBar({ categories }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get('search') || '');

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(pathname + '?' + createQueryString('search', search));
    });
  };

  const handleCategoryChange = (catId: string) => {
    startTransition(() => {
      router.push(pathname + '?' + createQueryString('categoryId', catId));
    });
  };

  const handleSortChange = (sort: string) => {
    startTransition(() => {
      router.push(pathname + '?' + createQueryString('sort', sort));
    });
  };

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm border border-gray-100 lg:flex-row lg:items-center lg:justify-between transition-all hover:shadow-md">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          className="w-full rounded-2xl bg-gray-50 px-5 py-3 pl-12 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border border-transparent focus:border-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </form>

      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <button
            onClick={() => handleCategoryChange('')}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              !searchParams.get('categoryId')
                ? 'bg-black text-white shadow-lg'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                searchParams.get('categoryId') === cat.id
                  ? 'bg-black text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="h-8 w-[1px] bg-gray-100 hidden lg:block" />

        {/* Sort */}
        <select
          onChange={(e) => handleSortChange(e.target.value)}
          value={searchParams.get('sort') || 'newest'}
          className="rounded-xl bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border border-transparent hover:bg-gray-100 cursor-pointer"
        >
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá: Thấp đến Cao</option>
          <option value="price_desc">Giá: Cao đến Thấp</option>
          <option value="best_seller">Bán chạy nhất</option>
        </select>
      </div>

      {isPending && (
        <div className="absolute right-4 top-4">
           <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}

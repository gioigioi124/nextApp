import { Product, Category, PaginatedResponse, ApiResponse } from '@/types';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

export async function getProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sort?: string;
}) {
  // Removed 'use cache' for compatibility
  
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.search) query.set('search', params.search);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.sort) query.set('sort', params.sort);

  const res = await fetch(`${API_URL}/products?${query.toString()}`, {
    next: { revalidate: 60 }, // Cache but revalidate every minute if 'use cache' isn't supported as expected
  });

  if (!res.ok) throw new Error('Failed to fetch products');
  const data: ApiResponse<PaginatedResponse<Product>> = await res.json();
  return data.data;
}

export async function getProductBySlug(slug: string) {
  // Removed 'use cache' for compatibility
  
  const res = await fetch(`${API_URL}/products/slug/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error('Failed to fetch product');
  const data: ApiResponse<Product> = await res.json();
  return data.data;
}

export async function getCategories() {
  // Removed 'use cache' for compatibility
  
  const res = await fetch(`${API_URL}/categories`, {
    next: { revalidate: 3600 }, // Cache categories longer
  });

  if (!res.ok) throw new Error('Failed to fetch categories');
  const data: ApiResponse<Category[]> = await res.json();
  return data.data;
}

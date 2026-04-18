// ─── User & Auth ─────────────────────────────────────────────

export type Role = 'CUSTOMER' | 'ADMIN'

export interface User {
  id: string
  email: string
  name?: string
  phone?: string
  avatar?: string
  role: Role
  createdAt: string
  updatedAt: string
}

// ─── Product ──────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  parentId?: string
  sortOrder: number
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  alt?: string
  sortOrder: number
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  sku?: string
  price: number
  stock: number
  attributes: Record<string, string>
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  basePrice: number
  comparePrice?: number
  sku?: string
  stock: number
  sold: number
  isPublished: boolean
  categoryId: string
  category: Category
  images: ProductImage[]
  variants: ProductVariant[]
  createdAt: string
  updatedAt: string
}

// ─── Cart ────────────────────────────────────────────────────

export interface CartItem {
  productId: string
  variantId?: string
  name: string
  image: string
  price: number
  quantity: number
  slug: string
}

// ─── Order ───────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentMethod = 'COD' | 'STRIPE' | 'VNPAY' | 'MOMO' | 'BANK_TRANSFER'
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED'

export interface OrderItem {
  id: string
  productId: string
  variantId?: string
  name: string
  image: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  note?: string
  trackingNumber?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

// ─── API Response ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  timestamp: string
}

// ─── Query Params ─────────────────────────────────────────────

export interface ProductQueryParams {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'best_seller'
}

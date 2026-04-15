# Supabase Schema — Antigravity E-commerce

## ERD tổng quan

```
users ──< orders ──< order_items >── products
                                         │
categories ──< products                  │
                   │                     │
              product_variants ──────────┘
                   │
              product_images

users ──< reviews >── products
users ──< addresses
users ──< wishlists >── products
coupons ──< orders
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── USERS ───────────────────────────────────────────────
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  phone     String?
  avatar    String?
  role      Role     @default(CUSTOMER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  addresses Address[]
  orders    Order[]
  reviews   Review[]
  wishlists Wishlist[]
  refreshTokens RefreshToken[]

  @@map("users")
}

enum Role {
  CUSTOMER
  ADMIN
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}

model Address {
  id         String  @id @default(uuid())
  userId     String
  fullName   String
  phone      String
  province   String
  district   String
  ward       String
  street     String
  isDefault  Boolean @default(false)

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders Order[]

  @@map("addresses")
}

// ─── PRODUCTS ─────────────────────────────────────────────
model Category {
  id          String  @id @default(uuid())
  name        String
  slug        String  @unique
  description String?
  imageUrl    String?
  parentId    String?
  sortOrder   Int     @default(0)

  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  products Product[]

  @@map("categories")
}

model Product {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  basePrice   Decimal  @db.Decimal(12, 0)  // VND không cần decimal
  comparePrice Decimal? @db.Decimal(12, 0)
  sku         String?  @unique
  stock       Int      @default(0)
  sold        Int      @default(0)
  isPublished Boolean  @default(false)
  categoryId  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category   Category        @relation(fields: [categoryId], references: [id])
  images     ProductImage[]
  variants   ProductVariant[]
  reviews    Review[]
  orderItems OrderItem[]
  wishlists  Wishlist[]

  @@map("products")
}

model ProductImage {
  id        String  @id @default(uuid())
  productId String
  url       String
  alt       String?
  sortOrder Int     @default(0)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}

model ProductVariant {
  id        String  @id @default(uuid())
  productId String
  name      String  // "Đỏ / XL"
  sku       String? @unique
  price     Decimal @db.Decimal(12, 0)
  stock     Int     @default(0)
  attributes Json   // { "color": "Đỏ", "size": "XL" }

  product    Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItems OrderItem[]

  @@map("product_variants")
}

// ─── ORDERS ───────────────────────────────────────────────
model Order {
  id              String      @id @default(uuid())
  orderNumber     String      @unique @default(cuid())
  userId          String
  addressId       String
  status          OrderStatus @default(PENDING)
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus @default(UNPAID)
  subtotal        Decimal     @db.Decimal(12, 0)
  shippingFee     Decimal     @db.Decimal(12, 0) @default(0)
  discount        Decimal     @db.Decimal(12, 0) @default(0)
  total           Decimal     @db.Decimal(12, 0)
  couponId        String?
  note            String?
  trackingNumber  String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user       User        @relation(fields: [userId], references: [id])
  address    Address     @relation(fields: [addressId], references: [id])
  coupon     Coupon?     @relation(fields: [couponId], references: [id])
  items      OrderItem[]

  @@map("orders")
}

enum OrderStatus {
  PENDING       // Chờ xác nhận
  CONFIRMED     // Đã xác nhận
  PROCESSING    // Đang chuẩn bị
  SHIPPING      // Đang giao
  DELIVERED     // Đã giao
  CANCELLED     // Đã hủy
  REFUNDED      // Đã hoàn tiền
}

enum PaymentMethod {
  COD
  STRIPE
  VNPAY
  MOMO
  BANK_TRANSFER
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  productId String
  variantId String?
  name      String  // snapshot tên lúc mua
  image     String  // snapshot ảnh lúc mua
  price     Decimal @db.Decimal(12, 0)
  quantity  Int

  order   Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product        @relation(fields: [productId], references: [id])
  variant ProductVariant? @relation(fields: [variantId], references: [id])

  @@map("order_items")
}

// ─── REVIEWS ──────────────────────────────────────────────
model Review {
  id        String   @id @default(uuid())
  userId    String
  productId String
  rating    Int      // 1-5
  comment   String?
  images    String[] // array URLs
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@unique([userId, productId]) // 1 review per product per user
  @@map("reviews")
}

// ─── COUPONS ──────────────────────────────────────────────
model Coupon {
  id           String      @id @default(uuid())
  code         String      @unique
  type         CouponType
  value        Decimal     @db.Decimal(12, 0) // amount or percent
  minOrder     Decimal?    @db.Decimal(12, 0)
  maxDiscount  Decimal?    @db.Decimal(12, 0) // cap for percent type
  usageLimit   Int?
  usedCount    Int         @default(0)
  expiresAt    DateTime?
  isActive     Boolean     @default(true)

  orders Order[]

  @@map("coupons")
}

enum CouponType {
  FIXED_AMOUNT
  PERCENTAGE
}

// ─── WISHLISTS ────────────────────────────────────────────
model Wishlist {
  userId    String
  productId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([userId, productId])
  @@map("wishlists")
}
```

---

## Supabase Storage buckets

```
product-images/   ← public bucket, ảnh sản phẩm
avatars/          ← public bucket, ảnh user
invoices/         ← private bucket, PDF hóa đơn
```

## Supabase Realtime

Enable realtime cho bảng `orders` để push trạng thái đơn hàng tới client.

```ts
// frontend: theo dõi đơn hàng realtime
const supabase = createClient(url, anonKey)

supabase
  .channel('order-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`,
  }, payload => {
    setOrderStatus(payload.new.status)
  })
  .subscribe()
```

## Migrations

```bash
npx prisma migrate dev --name init
npx prisma migrate deploy      # production
npx prisma studio              # GUI xem data
npx prisma generate            # regenerate client sau khi đổi schema
```

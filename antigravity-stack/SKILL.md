---
name: antigravity-stack
description: >
  Hướng dẫn chính xác cho dự án Antigravity sử dụng Next.js 16 (App Router) + NestJS + Supabase.
  Dùng skill này mỗi khi làm việc với bất kỳ phần nào của dự án Antigravity: tạo page, component,
  module NestJS, API endpoint, auth, database schema, hoặc kết nối frontend-backend.
  LUÔN dùng skill này khi user nhắc đến "antigravity", "web bán hàng", Next.js App Router, NestJS modules,
  Supabase schema, hoặc bất kỳ file nào trong cấu trúc thư mục dự án này.
---

# Antigravity Stack — Next.js 16 + NestJS + Supabase

> **Docs tham khảo chính thức:** https://nextjs.org/docs (Next.js 16)
> Khi cần tra cứu API, luôn dùng docs v16. KHÔNG dùng patterns từ Next.js 13/14/15.

## Tổng quan dự án

Web bán hàng (e-commerce) với:

- **Frontend**: Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: NestJS, Prisma ORM, JWT Auth
- **Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Cache**: Redis (sessions, cart)
- **Payment**: Stripe / VNPay / MoMo
- **Shipping**: GHN / GHTK / Viettel Post

---

## NEXT.JS 16 — Quy tắc bắt buộc

### ⚠️ Breaking changes v16 (KHÔNG dùng patterns cũ)

| Cũ (v14/v15)                           | Mới (v16)                            |
| -------------------------------------- | ------------------------------------ |
| `middleware.ts`                        | `proxy.ts` — đổi tên file + function |
| `export function middleware`           | `export default function proxy`      |
| `next: { revalidate: 60 }` trong fetch | `'use cache'` directive              |
| `--turbopack` flag                     | Turbopack mặc định, không cần flag   |
| `experimental.ppr`                     | Cache Components với `'use cache'`   |

### App Router (KHÔNG dùng Pages Router)

```
app/
├── (auth)/           ← route group, không tạo URL segment
│   ├── login/page.tsx
│   └── register/page.tsx
├── (shop)/
│   ├── page.tsx      ← trang chủ "/"
│   ├── products/
│   │   ├── page.tsx          ← /products
│   │   └── [slug]/page.tsx   ← /products/ao-thun-trang
│   ├── cart/page.tsx
│   └── checkout/page.tsx
├── (account)/
│   ├── orders/page.tsx
│   └── profile/page.tsx
├── (admin)/
│   ├── layout.tsx    ← admin layout riêng
│   ├── dashboard/page.tsx
│   ├── products/page.tsx
│   └── orders/page.tsx
├── api/              ← Next.js API routes (chỉ dùng cho webhooks, không thay NestJS)
│   └── webhooks/
│       └── stripe/route.ts
├── layout.tsx        ← root layout
└── globals.css
```

### Server vs Client Components

```tsx
// ✅ Server Component (default) — fetch data trực tiếp
// app/(shop)/products/page.tsx
export default async function ProductsPage() {
  const products = await fetch(`${process.env.API_URL}/products`).then((r) =>
    r.json(),
  );
  return <ProductList products={products} />;
}

// ✅ Client Component — cần interactivity
// components/cart/AddToCartButton.tsx
("use client");
import { useCartStore } from "@/store/cart.store";
export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  return <button onClick={() => addItem(product)}>Thêm vào giỏ</button>;
}
```

**Quy tắc:** Chỉ thêm `'use client'` khi cần useState, useEffect, event handlers, hoặc browser APIs.

### Data Fetching pattern (Next.js 16)

```tsx
// ✅ Cache với 'use cache' directive (v16) — KHÔNG dùng next: { revalidate }
import { unstable_cacheTag as cacheTag } from "next/cache";

async function getProduct(slug: string) {
  "use cache";
  cacheTag(`product-${slug}`); // revalidate theo tag

  const res = await fetch(`${process.env.API_URL}/products/${slug}`);
  if (!res.ok) notFound();
  return res.json();
}

// ✅ Dynamic (không cache) — mặc định trong v16
async function getOrders(userId: string) {
  // không có 'use cache' = luôn fetch mới tại request time
  const res = await fetch(`${process.env.API_URL}/orders?userId=${userId}`);
  return res.json();
}

// ✅ Cache cả component
async function ProductList() {
  "use cache";
  const products = await getProducts();
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}

// ✅ Client-side với TanStack Query (không đổi)
("use client");
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => api.get("/products", { params }).then((r) => r.data),
  });
}
```

### proxy.ts — Route Protection (Next.js 16)

> **v16:** `middleware.ts` đã deprecated. Dùng `proxy.ts` với `export default function proxy`.
> Runtime là Node.js (không phải Edge). Đổi tên file + function, logic giữ nguyên.

```ts
// proxy.ts (root level, KHÔNG phải middleware.ts)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAccountRoute = request.nextUrl.pathname.startsWith("/account");

  if ((isAdminRoute || isAccountRoute) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout"],
};
```

### API Client (lib/api.ts)

```ts
// lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // refresh token logic
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### Environment Variables

```bash
# .env.local (frontend)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
API_URL=http://localhost:3001/api   # server-only
```

---

## NESTJS — Quy tắc bắt buộc

### Module structure (mỗi feature = 1 module)

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   └── strategies/
│   │       ├── jwt.strategy.ts
│   │       └── jwt-refresh.strategy.ts
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── dto/
│   │   │   ├── create-product.dto.ts
│   │   │   └── query-product.dto.ts
│   │   └── entities/
│   │       └── product.entity.ts
│   └── orders/
│       ├── ...
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── transform.interceptor.ts
├── config/
│   └── configuration.ts
├── prisma/
│   └── prisma.service.ts
└── main.ts
```

### Module pattern chuẩn

```ts
// products.module.ts
import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // export nếu module khác cần dùng
})
export class ProductsModule {}
```

### Controller pattern

```ts
// products.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { QueryProductDto } from "./dto/query-product.dto";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
```

### DTO với class-validator

```ts
// dto/create-product.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsNumber()
  categoryId: number;
}
```

### JWT Auth Guards

```ts
// common/guards/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
  handleRequest(err: any, user: any) {
    if (err || !user) throw new UnauthorizedException("Token không hợp lệ");
    return user;
  }
}

// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().user,
);
```

### Response Transform Interceptor

```ts
// common/interceptors/transform.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map } from "rxjs/operators";

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler) {
    return next
      .handle()
      .pipe(
        map((data) => ({
          success: true,
          data,
          timestamp: new Date().toISOString(),
        })),
      );
  }
}
```

### main.ts chuẩn

```ts
// src/main.ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle("Antigravity API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    "api/docs",
    app,
    SwaggerModule.createDocument(app, config),
  );

  await app.listen(3001);
}
bootstrap();
```

---

## SUPABASE — Schema & Integration

Xem chi tiết: `references/supabase-schema.md`

### Prisma + Supabase connection

```bash
# .env (backend)
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
```

---

## Checklist khi tạo feature mới

- [ ] **Frontend**: Tạo page trong đúng route group `(shop)`, `(admin)`, `(account)`
- [ ] **Frontend**: Server Component mặc định, thêm `'use client'` chỉ khi cần
- [ ] **Frontend**: Dùng `'use cache'` + `cacheTag()` thay vì `next: { revalidate }` (v16)
- [ ] **Frontend**: File route guard là `proxy.ts`, KHÔNG phải `middleware.ts` (v16)
- [ ] **Backend**: Tạo module mới với đủ 4 file: `.module`, `.controller`, `.service`, `dto/`
- [ ] **Backend**: Import module mới vào `app.module.ts`
- [ ] **Backend**: DTO luôn dùng class-validator
- [ ] **Auth**: Protect routes cần auth bằng `@UseGuards(JwtAuthGuard)`
- [ ] **Types**: Khai báo interface/type trong `frontend/types/index.ts`

---

## Tham khảo thêm

- `references/supabase-schema.md` — ERD và schema đầy đủ
- `references/api-conventions.md` — API naming, pagination, error format
- `references/auth-flow.md` — JWT refresh token flow chi tiết

## Next.js 16 — Docs chính thức

Khi cần tra cứu chi tiết bất kỳ API nào, fetch docs từ các URL sau:

| Chủ đề                        | URL                                                                      |
| ----------------------------- | ------------------------------------------------------------------------ |
| App Router tổng quan          | https://nextjs.org/docs/app                                              |
| Caching & `use cache`         | https://nextjs.org/docs/app/guides/caching                               |
| `proxy.ts` (route protection) | https://nextjs.org/docs/app/api-reference/file-conventions/proxy         |
| Server Components             | https://nextjs.org/docs/app/getting-started/server-and-client-components |
| Data Fetching                 | https://nextjs.org/docs/app/getting-started/fetching-data                |
| Upgrade guide v16             | https://nextjs.org/docs/app/guides/upgrading/version-16                  |

> Nếu không chắc một pattern có còn hợp lệ trong v16 không — fetch URL docs trước, đừng đoán.

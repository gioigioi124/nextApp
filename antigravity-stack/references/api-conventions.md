# API Conventions — Antigravity

## Base URL

```
Development:  http://localhost:3001/api
Production:   https://api.antigravity.vn/api
Docs:         http://localhost:3001/api/docs
```

## URL Naming

```
GET    /api/products              ← list
GET    /api/products/:id          ← detail
POST   /api/products              ← create
PATCH  /api/products/:id          ← partial update
DELETE /api/products/:id          ← delete

GET    /api/orders/:id/items      ← nested resource
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

## Response Format (TransformInterceptor)

```json
// Success
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-15T10:00:00.000Z"
}

// Paginated list
{
  "success": true,
  "data": {
    "items": [...],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}

// Error (HttpExceptionFilter)
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["name should not be empty"],
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

## Pagination Query Pattern

```ts
// dto/query-product.dto.ts
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator'
import { Transform } from 'class-transformer'

export class QueryProductDto {
  @IsOptional()
  @IsInt() @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1

  @IsOptional()
  @IsInt() @Min(1) @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsString()
  sortBy?: 'price' | 'createdAt' | 'sold' = 'createdAt'

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc'
}
```

## HTTP Status Codes dùng

| Code | Khi nào |
|------|---------|
| 200  | GET, PATCH thành công |
| 201  | POST tạo mới thành công |
| 204  | DELETE thành công |
| 400  | Validation error, bad request |
| 401  | Chưa đăng nhập |
| 403  | Không có quyền |
| 404  | Resource không tồn tại |
| 409  | Conflict (email đã tồn tại, v.v.) |
| 500  | Server error |

## Auth Headers

```
Authorization: Bearer <access_token>
```

Access token: 15 phút
Refresh token: 7 ngày (lưu trong httpOnly cookie)

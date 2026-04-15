# Antigravity — E-commerce Platform

Web bán hàng hiện đại với Next.js 14 + NestJS + Supabase.

## Cấu trúc dự án

```
nextApp/
├── frontend/          # Next.js 14 App Router
├── backend/           # NestJS API
└── antigravity-stack/ # Skill & references
```

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14, TypeScript, Tailwind CSS|
| Backend     | NestJS, Prisma ORM, JWT Auth        |
| Database    | Supabase (PostgreSQL)               |
| Cache       | Redis                               |
| Payment     | Stripe / VNPay / MoMo               |

## Bắt đầu nhanh

### 1. Cài dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Cấu hình environment

```bash
# Frontend
cp frontend/.env.local.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env
```

> Điền các giá trị thực vào file `.env` (Supabase URL, JWT secret, v.v.)

### 3. Khởi tạo database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Chạy development

```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run start:dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

### 5. Xem API docs

Truy cập [http://localhost:3001/api/docs](http://localhost:3001/api/docs) để xem Swagger UI.

## Tài liệu

- [Supabase Schema](antigravity-stack/references/supabase-schema.md)
- [API Conventions](antigravity-stack/references/api-conventions.md)
- [Auth Flow](antigravity-stack/references/auth-flow.md)

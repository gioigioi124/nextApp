# Auth Flow — Antigravity

## JWT Refresh Token Flow

```
[Client]                    [NestJS]                  [Supabase DB]
   │                            │                           │
   │── POST /auth/login ────────▶│                           │
   │   { email, password }       │── verify password ───────▶│
   │                            │◀── user record ────────────│
   │                            │── generate tokens          │
   │                            │── save refresh_token ─────▶│
   │◀── 200 ─────────────────── │                           │
   │   access_token (body)       │                           │
   │   refresh_token (httpOnly   │                           │
   │   cookie, 7d)               │                           │
   │                            │                           │
   │── [15 min later] ──────────▶│                           │
   │── POST /auth/refresh ───────▶│                           │
   │   cookie: refresh_token     │── verify + rotate ───────▶│
   │◀── 200 new access_token ────│                           │
   │                            │                           │
   │── POST /auth/logout ────────▶│                           │
   │                            │── delete refresh_token ───▶│
   │◀── 200 ─────────────────── │                           │
```

## NestJS Auth Implementation

```ts
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Email không tồn tại')

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash)
    if (!isMatch) throw new UnauthorizedException('Mật khẩu không đúng')

    const tokens = await this.generateTokens(user)
    await this.saveRefreshToken(user.id, tokens.refreshToken)

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return { accessToken: tokens.accessToken, user: this.sanitizeUser(user) }
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role }
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET,
      }),
    }
  }
}
```

## Frontend Auth Store (Zustand)

```ts
// store/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        set({ user: data.data.user, accessToken: data.data.accessToken })
        api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`
      },

      logout: async () => {
        await api.post('/auth/logout')
        set({ user: null, accessToken: null })
        delete api.defaults.headers.common['Authorization']
      },

      refresh: async () => {
        const { data } = await api.post('/auth/refresh')
        set({ accessToken: data.data.accessToken })
        api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`
      },
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user }) }
  )
)
```

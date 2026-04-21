'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { ShoppingBag, User, Search, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const [isScrolled, setIsScrolled] = useState(false);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Sản phẩm', href: '/products' },
    { name: 'Khuyến mãi', href: '/sale' },
    { name: 'Về chúng tôi', href: '/about' },
  ];

  return (
    <nav 
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 py-4 shadow-xl backdrop-blur-xl border-b border-gray-100' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-1">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-black text-white shadow-lg transition-transform group-hover:rotate-12">
            <span className="text-xl font-black">A</span>
          </div>
          <span className={`text-2xl font-black tracking-tighter transition-colors ${
            !isScrolled && pathname === '/' ? 'text-white' : 'text-black'
          }`}>
            NTIGRAVITY
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-bold tracking-wide uppercase transition-all hover:scale-110 ${
                  isActive 
                    ? 'text-blue-600' 
                    : !isScrolled && pathname === '/' 
                      ? 'text-white/80 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
           <button className={`p-2 transition-colors ${
              !isScrolled && pathname === '/' ? 'text-white hover:text-blue-400' : 'text-gray-600 hover:text-black'
            }`}>
              <Search className="h-5 w-5" />
           </button>

           <Link href="/cart" className="relative p-2 group transition-all hover:scale-110">
              <ShoppingBag className={`h-5 w-5 ${
                !isScrolled && pathname === '/' ? 'text-white' : 'text-gray-600 group-hover:text-black'
              }`} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-lg">
                  {cartCount}
                </span>
              )}
           </Link>

           <div className="h-6 w-[1px] bg-gray-200 hidden sm:block" />

           <Link href={user ? '/account' : '/login'} className="group flex items-center gap-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all group-hover:bg-blue-600 group-hover:border-blue-600 ${
                !isScrolled && pathname === '/' 
                  ? 'border-white/30 text-white' 
                  : 'border-gray-100 text-gray-600 group-hover:text-white'
              }`}>
                <User className="h-5 w-5" />
              </div>
              <div className="hidden lg:block text-left">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  !isScrolled && pathname === '/' ? 'text-white/50' : 'text-gray-400'
                }`}>Tài khoản</p>
                <p className={`text-xs font-bold ${
                   !isScrolled && pathname === '/' ? 'text-white' : 'text-gray-900'
                }`}>
                   {user ? user.name : 'Đăng nhập'}
                </p>
              </div>
           </Link>

           <button className="md:hidden p-2 text-gray-600">
             <Menu className="h-6 w-6" />
           </button>
        </div>
      </div>
    </nav>
  );
}

'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Tài khoản của bạn</h2>
        
        {user ? (
          <div className="space-y-4">
            <div className="bg-blue-50 text-blue-900 p-4 rounded-md text-left">
              <p><strong>Tên:</strong> {user.name || 'Chưa cập nhật'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Vai trò:</strong> {user.role}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-red-700 transition"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <p className="text-gray-600">Đang tải thông tin...</p>
        )}
      </div>
    </div>
  );
}

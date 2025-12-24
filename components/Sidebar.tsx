'use client';

import { LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { label: 'Trò chuyện', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Thư viện', href: '/dashboard/documents', icon: FileText },
    { label: 'Cài đặt', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col p-4 border-r border-slate-800">
      <h1 className="text-2xl font-bold mb-8 text-blue-400">🤖 RAG System</h1>
      
      <div className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              pathname === item.href 
                ? "bg-blue-600 text-white" 
                : "hover:bg-slate-800 text-slate-300"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </div>

      <button 
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-lg mt-auto"
      >
        <LogOut size={20} />
        Đăng xuất
      </button>
    </div>
  );
}
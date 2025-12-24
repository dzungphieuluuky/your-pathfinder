'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Menu } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type PageType = 'dashboard' | 'knowledge' | 'settings';
type UserRole = 'Administrator' | 'End-User';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('End-User');

  useEffect(() => {
    // Get current user and their role
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        // Check if user is admin (you can customize this logic)
        const isAdmin = data.user.email.endsWith('@admin.com') || 
                       data.user.user_metadata?.role === 'Administrator';
        setUserRole(isAdmin ? 'Administrator' : 'End-User');
      }
    });

    // Detect current page from URL
    const path = window.location.pathname;
    if (path.includes('knowledge')) {
      setCurrentPage('knowledge');
    } else if (path.includes('settings')) {
      setCurrentPage('settings');
    } else {
      setCurrentPage('dashboard');
    }
  }, []);

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page);
    // Navigate to the page
    if (page === 'dashboard') {
      window.location.href = '/dashboard';
    } else if (page === 'knowledge') {
      window.location.href = '/dashboard/knowledge';
    } else if (page === 'settings') {
      window.location.href = '/dashboard/settings';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        userRole={userRole}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white p-4 border-b flex items-center gap-3 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">RAG Assistant</span>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
import { MessageSquare, Database, Settings } from 'lucide-react';

interface SidebarProps {
  currentPage: 'dashboard' | 'knowledge' | 'settings';
  onNavigate: (page: 'dashboard' | 'knowledge' | 'settings') => void;
  isOpen: boolean;
  onToggle: () => void;
  userRole: 'Administrator' | 'End-User';
}

export function Sidebar({ currentPage, onNavigate, isOpen, onToggle, userRole }: SidebarProps) {
  const isAdmin = userRole === 'Administrator';

  const navItems = [
    { id: 'dashboard' as const, label: 'Chat Dashboard', icon: MessageSquare, show: true },
    { id: 'knowledge' as const, label: 'Knowledge Management', icon: Database, show: isAdmin },
    { id: 'settings' as const, label: 'Settings', icon: Settings, show: true },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">RAG Assistant</h1>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map(
            (item) =>
              item.show && (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={currentPage === item.id ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )
          )}
        </nav>
      </aside>
    </>
  );
}
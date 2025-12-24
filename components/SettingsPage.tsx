import { LogOut, UserPlus, User as UserIcon, Menu } from 'lucide-react';

interface SettingsPageProps {
  user: {
    name: string;
    email: string;
    role: 'Administrator' | 'End-User';
    avatarUrl: string;
  };
  onInviteMember: () => void;
  onSignOut: () => void;
  onToggleSidebar?: () => void;
}

export function SettingsPage({ user, onInviteMember, onSignOut, onToggleSidebar }: SettingsPageProps) {
  const isAdmin = user.role === 'Administrator';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top App Bar - Fixed Height with Proper Layout */}
      <div className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          {/* Left Section: Hamburger + Title */}
          <div className="flex items-center gap-6">
            {/* Hamburger Menu Icon */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page Title */}
            <h1 className="text-xl text-gray-900">Settings</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Profile Section Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-lg text-gray-900 mb-6">Profile Information</h2>

            <div className="space-y-6">
              {/* User Avatar */}
              <div className="flex items-center gap-4">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Profile Picture</p>
                  <p className="text-xs text-gray-500">JPG or PNG, max 2MB</p>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={user.name}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Role Section Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-lg text-gray-900 mb-6">Account Role</h2>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isAdmin ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <UserIcon className={`w-6 h-6 ${isAdmin ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-900">{user.role}</p>
                <p className="text-xs text-gray-500">
                  {isAdmin
                    ? 'Full access to all features and settings'
                    : 'Access to basic features'}
                </p>
              </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-700 mb-3">Admin Actions</p>
                <button
                  onClick={onInviteMember}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite New Member
                </button>
              </div>
            )}
          </div>

          {/* Sign Out Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg text-gray-900 mb-4">Account Actions</h2>
            <button
              onClick={onSignOut}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
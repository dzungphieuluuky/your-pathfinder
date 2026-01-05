import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, WorkspaceMember, Invitation, InvitationStatus, Workspace } from '../types';
import { 
  Mail, 
  Shield, 
  User as UserIcon, 
  Lock, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  RefreshCw,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Settings as SettingsIcon,
  Key,
  Users,
  AlertCircle
} from 'lucide-react';
import { supabaseService } from '../services/supabase';
import InviteMemberModal from '../components/InviteMemberModal';

interface SettingsProps {
  user: User;
  workspace: Workspace;
}

type SortConfig = {
  key: keyof Invitation;
  direction: 'asc' | 'desc';
} | null;

const Settings: React.FC<SettingsProps> = ({ user, workspace }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const loadAdminData = async () => {
    if (user.role !== UserRole.ADMIN) return;
    setIsLoading(true);
    try {
      const [invitesData, membersData] = await Promise.all([
        supabaseService.getInvitations(workspace.id),
        supabaseService.getWorkspaceMembers(workspace.id)
      ]);
      setInvitations(invitesData);
      setMembers(membersData);
    } catch (e) {
      console.error("Failed to load admin lists", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      loadAdminData();
    }
  }, [activeTab, workspace.id]);

  const handleRevoke = async (id: string) => {
    if (!window.confirm("Revoke this invitation? The link will no longer work.")) return;
    try {
      await supabaseService.revokeInvitation(id);
      loadAdminData();
    } catch (e) {
      alert("Revoke failed");
    }
  };

  const requestSort = (key: keyof Invitation) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedInvitations = useMemo(() => {
    let sortableItems = [...invitations];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [invitations, sortConfig]);

  const getSortIcon = (key: keyof Invitation) => {
    if (!sortConfig || sortConfig.key !== key) 
      return <ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-indigo-600" /> 
      : <ChevronDown size={14} className="text-indigo-600" />;
  };

  const tabConfig = [
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
      badge: null,
      color: 'from-indigo-600 to-blue-600'
    },
    {
      id: 'security',
      label: 'Security',
      icon: Lock,
      badge: null,
      color: 'from-orange-600 to-red-600'
    },
    ...(user.role === UserRole.ADMIN ? [{
      id: 'admin',
      label: 'Admin Panel',
      icon: Shield,
      badge: members.length > 0 ? members.length : null,
      color: 'from-purple-600 to-pink-600'
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-8 py-10 sticky top-0 z-10 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">Workspace Settings</h1>
              <p className="text-indigo-300 text-sm font-bold mt-1">Manage your account and workspace access</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden sticky top-24">
              <div className="p-4 space-y-2">
                {tabConfig.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-sm font-bold transition-all duration-200 group ${
                        isActive
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-indigo-200 translate-x-1`
                          : 'text-slate-600 hover:bg-slate-100 active:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? 'group-hover:scale-110' : ''} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge && (
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                          isActive ? 'bg-white/30' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 px-10 py-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-1">👤 Profile Settings</h2>
                    <p className="text-slate-600 text-sm font-medium">View and manage your account information</p>
                  </div>

                  <div className="p-10 space-y-10">
                    {/* User Card */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-8 pb-8 border-b border-slate-100">
                      <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black border-4 border-white shadow-2xl shadow-indigo-200 flex-shrink-0">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-black text-slate-900 mb-3">
                          {user.email.split('@')[0]}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest shadow-lg">
                            <Shield size={14} /> {user.role}
                          </span>
                          <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest">
                            <CheckCircle size={14} /> Active Account
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Email Section */}
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-[0.15em] block">📧 Connected Email Address</label>
                      <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-r from-slate-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl text-slate-700 font-bold hover:border-indigo-400 transition-all">
                        <Mail size={20} className="text-indigo-600 flex-shrink-0" />
                        <span>{user.email}</span>
                      </div>
                    </div>

                    {/* Workspace Info */}
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-[0.15em] block">🏢 Workspace</label>
                      <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-r from-slate-50 to-purple-50 border-2 border-purple-200 rounded-2xl text-slate-700 font-bold">
                        <Users size={20} className="text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="text-slate-900 font-black">{workspace.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">ID: {workspace.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                      <p className="flex items-center gap-3 text-emerald-800 font-bold text-sm">
                        <CheckCircle size={18} className="text-emerald-600" />
                        Your account is fully verified and active
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 px-10 py-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-1">🔐 Security & Access</h2>
                    <p className="text-slate-600 text-sm font-medium">Manage your passwords and security settings</p>
                  </div>

                  <div className="p-10 space-y-8">
                    {/* Warning Alert */}
                    <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl flex gap-4">
                      <AlertCircle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-900 text-sm mb-1">🔒 Keep Your Password Secure</p>
                        <p className="text-[10px] text-amber-700 uppercase tracking-widest font-bold">
                          Never share your credentials. We will never ask for your password via email.
                        </p>
                      </div>
                    </div>

                    {/* Password Fields */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase text-slate-600 tracking-[0.15em] block flex items-center gap-2">
                          <Key size={14} /> Current Vault Password
                        </label>
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all font-medium text-slate-700"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase text-slate-600 tracking-[0.15em] block flex items-center gap-2">
                          <Key size={14} /> New Vault Password
                        </label>
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all font-medium text-slate-700"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase text-slate-600 tracking-[0.15em] block flex items-center gap-2">
                          <Key size={14} /> Confirm New Password
                        </label>
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all font-medium text-slate-700"
                        />
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-orange-200 active:scale-95 hover:shadow-xl">
                      ✓ Update Security Credentials
                    </button>

                    {/* Session Info */}
                    <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">🔄 Active Sessions</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-900">Current Session</p>
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-black uppercase">Active</span>
                        </div>
                        <p className="text-xs text-slate-500">Last activity: Just now</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Panel Tab */}
              {activeTab === 'admin' && user.role === UserRole.ADMIN && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-10 py-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-1">⚙️ Admin Controls</h2>
                    <p className="text-slate-600 text-sm font-medium">Manage workspace members and invitations</p>
                  </div>

                  <div className="p-10 space-y-10">
                    {/* Invite Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-100">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 mb-1">👥 Workspace Membership</h3>
                        <p className="text-sm text-slate-600 font-medium">Send invitations via secure email dispatch</p>
                      </div>
                      <button 
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-purple-200 active:scale-95 whitespace-nowrap"
                      >
                        <UserPlus size={18} /> Invite Member
                      </button>
                    </div>

                    {/* Pending Invitations */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                          <Clock size={16} className="text-orange-500" /> 
                          Pending Invitations
                          {isLoading && <RefreshCw size={14} className="animate-spin text-indigo-600" />}
                        </h4>
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-black">
                          {invitations.length}
                        </span>
                      </div>
                      
                      {invitations.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                          <Clock size={28} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500 font-bold">No pending invitations</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden border-2 border-slate-200 rounded-2xl bg-white">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                                <th 
                                  onClick={() => requestSort('email')}
                                  className="group px-6 py-4 text-[10px] font-black uppercase text-slate-600 tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    📧 Email {getSortIcon('email')}
                                  </div>
                                </th>
                                <th 
                                  onClick={() => requestSort('role')}
                                  className="group px-6 py-4 text-[10px] font-black uppercase text-slate-600 tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    👤 Role {getSortIcon('role')}
                                  </div>
                                </th>
                                <th 
                                  onClick={() => requestSort('status')}
                                  className="group px-6 py-4 text-[10px] font-black uppercase text-slate-600 tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    ⚡ Status {getSortIcon('status')}
                                  </div>
                                </th>
                                <th 
                                  onClick={() => requestSort('invited_at')}
                                  className="group px-6 py-4 text-[10px] font-black uppercase text-slate-600 tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    📅 Date {getSortIcon('invited_at')}
                                  </div>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-600 tracking-wider text-right">
                                  🎯 Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedInvitations.map((inv, idx) => (
                                <tr 
                                  key={inv.id} 
                                  className={`group hover:bg-indigo-50/50 transition-all ${idx !== sortedInvitations.length - 1 ? 'border-b border-slate-100' : ''}`}
                                >
                                  <td className="px-6 py-4 text-sm font-bold text-slate-900 truncate">
                                    {inv.email}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full uppercase tracking-widest">
                                      {inv.role}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1 ${
                                      inv.status === InvitationStatus.PENDING ? 'bg-amber-100 text-amber-700' : 
                                      inv.status === InvitationStatus.ACCEPTED ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                      {inv.status === InvitationStatus.PENDING && '⏳'}
                                      {inv.status === InvitationStatus.ACCEPTED && '✓'}
                                      {inv.status === InvitationStatus.REVOKED && '✕'}
                                      {inv.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs text-slate-500 font-bold">
                                    {new Date(inv.invited_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {inv.status === InvitationStatus.PENDING && (
                                      <button 
                                        onClick={() => handleRevoke(inv.id)}
                                        title="Revoke Invitation"
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                                      >
                                        <XCircle size={18} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Active Members */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                          <CheckCircle size={16} className="text-emerald-600" /> 
                          Workspace Members
                        </h4>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black">
                          {members.length}
                        </span>
                      </div>

                      {members.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                          <Users size={28} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500 font-bold">No active members</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {members.map(member => (
                            <div 
                              key={member.id} 
                              className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-slate-50 rounded-2xl border-2 border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:bg-gradient-to-r hover:from-white hover:to-indigo-50 transition-all group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                                  {member.email[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900">{member.email}</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {member.role} • Joined {new Date(member.joined_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                                <MoreVertical size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal 
          onClose={() => setShowInviteModal(false)} 
          onSuccess={() => loadAdminData()} 
          workspaceId={workspace.id}
        />
      )}
    </div>
  );
};

export default Settings;
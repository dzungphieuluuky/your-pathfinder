
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, WorkspaceMember, Invitation, InvitationStatus, Workspace } from '../types';
import { 
  Mail, 
  Shield, 
  User as UserIcon, 
  Lock, 
  ChevronRight, 
  Bell, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  Trash2,
  RefreshCw,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
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

  // Updated to include workspace.id for scoped data fetching
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
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-indigo-600" /> : <ChevronDown size={14} className="text-indigo-600" />;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full flex flex-col">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workspace Control</h1>
        <p className="text-slate-500">Manage account preferences and team access permissions for <span className="text-indigo-600 font-bold">{workspace.name}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'profile' ? 'bg-slate-900 text-white shadow-xl translate-x-2' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <UserIcon size={18} />
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'security' ? 'bg-slate-900 text-white shadow-xl translate-x-2' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Lock size={18} />
            Security
          </button>
          {user.role === UserRole.ADMIN && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'admin' ? 'bg-slate-900 text-white shadow-xl translate-x-2' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Shield size={18} />
              Workspace Adm.
            </button>
          )}
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 min-h-[500px]">
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 rounded-[2rem] bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-black border-4 border-white shadow-xl">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{user.email.split('@')[0]}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{user.role}</span>
                      <span className="text-emerald-500 flex items-center gap-1 text-xs font-bold">
                        <CheckCircle size={12} /> Account Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Connected Corporate Email</label>
                    <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-bold">
                      <Mail size={18} className="text-slate-400" />
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-xl font-black text-slate-900">Credential Management</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Current Vault Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">New Vault Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium" />
                  </div>
                  <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95">
                    Synchronize New Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Workspace Membership</h3>
                    <p className="text-sm text-slate-500">Managed via Secure Google Dispatch</p>
                  </div>
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <UserPlus size={18} /> Invite Member
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Pending Invitations Section - Refactored to Table */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                        <Clock size={12} /> Pending Invitations
                        {isLoading && <RefreshCw size={12} className="animate-spin ml-2" />}
                      </h4>
                    </div>
                    
                    {invitations.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center text-slate-300 font-bold text-sm">
                        No active outgoing invitations
                      </div>
                    ) : (
                      <div className="overflow-hidden border border-slate-100 rounded-2xl bg-slate-50/30">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th 
                                onClick={() => requestSort('email')}
                                className="group px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  Recipient Email {getSortIcon('email')}
                                </div>
                              </th>
                              <th 
                                onClick={() => requestSort('role')}
                                className="group px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  Role {getSortIcon('role')}
                                </div>
                              </th>
                              <th 
                                onClick={() => requestSort('status')}
                                className="group px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  Status {getSortIcon('status')}
                                </div>
                              </th>
                              <th 
                                onClick={() => requestSort('invited_at')}
                                className="group px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  Invited Date {getSortIcon('invited_at')}
                                </div>
                              </th>
                              <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedInvitations.map((inv, idx) => (
                              <tr 
                                key={inv.id} 
                                className={`group hover:bg-white transition-colors ${idx !== sortedInvitations.length - 1 ? 'border-b border-slate-100' : ''}`}
                              >
                                <td className="px-4 py-3 text-sm font-bold text-slate-900 truncate max-w-[150px]">
                                  {inv.email}
                                </td>
                                <td className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                  {inv.role}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${
                                    inv.status === InvitationStatus.PENDING ? 'bg-amber-100 text-amber-700' : 
                                    inv.status === InvitationStatus.ACCEPTED ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400 font-medium">
                                  {new Date(inv.invited_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {inv.status === InvitationStatus.PENDING && (
                                    <button 
                                      onClick={() => handleRevoke(inv.id)}
                                      title="Revoke Access"
                                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                      <XCircle size={16} />
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

                  {/* Active Members Section */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                      <CheckCircle size={12} /> Workspace Access List
                    </h4>
                    {members.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center text-slate-300 font-bold text-sm">
                        No members currently in workspace
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {members.map(member => (
                          <div key={member.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                {member.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{member.email}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role} • Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 text-slate-300 hover:text-slate-600">
                                <MoreVertical size={18} />
                              </button>
                            </div>
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
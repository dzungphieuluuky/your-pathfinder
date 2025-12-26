
import React, { useState } from 'react';
import { Layers, Plus, Trash2, ArrowRight, Loader2, Shield, Calendar, Users, Database } from 'lucide-react';
import { User, Workspace, UserRole } from '../types';
import { supabaseService } from '../services/supabase';

interface WorkspacesProps {
  user: User;
  workspaces: Workspace[];
  onRefresh: () => void;
  onSwitch: (ws: Workspace) => void;
}

const Workspaces: React.FC<WorkspacesProps> = ({ user, workspaces, onRefresh, onSwitch }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setLoading(true);
    try {
      await supabaseService.createWorkspace(newWsName, user.id);
      setNewWsName('');
      setIsCreating(false);
      onRefresh();
    } catch (e) {
      alert("Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently decommission ${name}? All documents and member links will be destroyed.`)) return;
    try {
      await supabaseService.deleteWorkspace(id);
      onRefresh();
    } catch (e) {
      alert("Delete failed");
    }
  };

  return (
    <div className="p-10 max-w-5xl mx-auto w-full flex flex-col h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workspace Hub</h1>
          <p className="text-slate-500">Manage your isolated knowledge vaults and collaborative clusters</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} /> Create New Vault
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Deploy New Vault</h2>
            <p className="text-sm text-slate-500 mb-8">Isolated storage environment for your private documents.</p>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Vault Designation</label>
                <input 
                  autoFocus
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Legal Research 2025"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={loading}
                  type="submit"
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Deploy Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {workspaces.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
          <Database size={64} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-400">No active knowledge clusters</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2">Deploy your first isolated workspace to begin indexing and querying documents.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {workspaces.map(ws => (
            <div 
              key={ws.id}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-100">
                    {ws.name[0].toUpperCase()}
                  </div>
                  {ws.owner_id === user.id && (
                    <button 
                      onClick={() => handleDelete(ws.id, ws.name)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{ws.name}</h3>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mb-8">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(ws.created_at).toLocaleDateString()}</span>
                  <span className="opacity-20">•</span>
                  <span className="flex items-center gap-1.5"><Shield size={14} /> {ws.owner_id === user.id ? 'Owner' : 'Member'}</span>
                </div>
              </div>

              <button 
                onClick={() => onSwitch(ws)}
                className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all group/btn"
              >
                Enter Vault
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workspaces;

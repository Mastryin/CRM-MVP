import React, { useState, useEffect } from 'react';
import { getUsers, inviteUser, deleteUser, resetUserPassword, toggleUserStatus } from '../services/mockDb';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Shield, User as UserIcon, RefreshCw, Key, Power } from 'lucide-react';
import clsx from 'clsx';
import { formatDate } from '../utils/helpers';

const Users: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'team_member' });

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  if (user?.role !== 'superadmin') {
      return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  const handleInvite = (e: React.FormEvent) => {
      e.preventDefault();
      try {
          inviteUser(inviteForm.email, inviteForm.full_name, inviteForm.role as any);
          setUsers(getUsers());
          setIsInviteModalOpen(false);
          setInviteForm({ email: '', full_name: '', role: 'team_member' });
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleDelete = (id: string, name: string) => {
      if (confirm(`Are you sure you want to delete ${name}? Assigned leads will be redistributed via round-robin.`)) {
          try {
              deleteUser(id);
              setUsers(getUsers());
          } catch(e: any) {
              alert(e.message);
          }
      }
  };

  const handleResetPassword = (id: string) => {
      if (confirm("Send password reset link to user?")) {
          resetUserPassword(id);
          alert("Reset link sent (simulated).");
      }
  };

  const handleToggleStatus = (id: string) => {
      toggleUserStatus(id);
      setUsers(getUsers());
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
            >
                <Plus size={20} /> Invite Member
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(u => (
                <div key={u.id} className={clsx("bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between transition-opacity", !u.is_active && "opacity-75 bg-slate-50 border-dashed")}>
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white", u.role === 'superadmin' ? 'bg-purple-600' : 'bg-blue-500')}>
                                {u.full_name.charAt(0)}
                            </div>
                            <span className={clsx("px-2 py-1 rounded-full text-xs font-semibold uppercase", u.role === 'superadmin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
                                {u.role.replace('_', ' ')}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{u.full_name}</h3>
                        <p className="text-slate-500 text-sm mb-4">{u.email}</p>
                        
                        <div className="text-xs text-slate-400 space-y-1">
                            <p>Joined: {formatDate(u.created_at)}</p>
                            <div className="flex items-center gap-2">
                                Status: 
                                <span className={clsx("font-medium", u.is_active ? "text-green-600" : "text-slate-500")}>
                                    {u.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
                        <button onClick={() => handleResetPassword(u.id)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded" title="Reset Password">
                            <Key size={16} />
                        </button>
                        {u.id !== user?.id && (
                            <>
                                <button onClick={() => handleToggleStatus(u.id)} className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded" title={u.is_active ? "Deactivate" : "Activate"}>
                                    <Power size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(u.id, u.full_name)}
                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded" 
                                    title="Delete User"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {isInviteModalOpen && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                 <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="font-bold text-lg">Invite Team Member</h3>
                         <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400">&times;</button>
                     </div>
                     <form onSubmit={handleInvite} className="space-y-4">
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                             <input required value={inviteForm.full_name} onChange={(e) => setInviteForm({...inviteForm, full_name: e.target.value})} className="w-full p-2 border rounded-lg" />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                             <input type="email" required value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} className="w-full p-2 border rounded-lg" />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                             <select value={inviteForm.role} onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})} className="w-full p-2 border rounded-lg">
                                 <option value="team_member">Team Member</option>
                                 <option value="superadmin">SuperAdmin</option>
                             </select>
                         </div>
                         <div className="pt-4 flex justify-end gap-3">
                             <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                             <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send Invitation</button>
                         </div>
                     </form>
                 </div>
             </div>
        )}
    </div>
  );
};

export default Users;

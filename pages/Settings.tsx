import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    getEmailTemplates, saveEmailTemplate, getSmtpConfig, saveSmtpConfig, 
    getWebhooks, saveWebhook, deleteWebhook, getWhatsAppTemplates, saveWhatsAppTemplate, deleteWhatsAppTemplate,
    generateBackup, getBackups, getDeletedLeads, restoreLead, deleteLeadPermanently, emptyTrash, simulateTrafftCall,
    getSystemMetrics, restoreBackup, getAllTags, mergeTags, deleteTag,
    getUsers, inviteUser, deleteUser, resetUserPassword, toggleUserStatus,
    saveIntegrationConfig, getIntegrations, fetchAisensyTemplates, renameTag, createTag,
    getApiKeys, generateApiKey, revokeApiKey
} from '../services/mockDb';
import { EmailTemplate, SmtpConfig, WebhookConfig, WhatsAppTemplate, Backup, Lead, SystemMetrics, User, IntegrationConfig, ApiKey } from '../types';
import { DEFAULT_STATUSES } from '../constants';
import { Save, Plus, Trash2, RotateCcw, Download, RefreshCw, Mail, MessageCircle, Database, Tag as TagIcon, LayoutList, Share2, Phone, Activity, Users, Key, Power, Plug, Webhook, Zap, CloudDownload, Braces, Edit2, X, Upload, AlertTriangle, Check, Search, FileSpreadsheet, Calendar, Globe, Code } from 'lucide-react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import { formatDate } from '../utils/helpers';

const AVAILABLE_VARIABLES = [
    { label: 'First Name', value: '{{first_name}}' },
    { label: 'Last Name', value: '{{last_name}}' },
    { label: 'Full Name', value: '{{full_name}}' },
    { label: 'Email', value: '{{email}}' },
    { label: 'Phone', value: '{{phone}}' },
    { label: 'Assigned Agent', value: '{{assigned_to_name}}' },
    { label: 'Payment Link', value: '{{payment_link}}' },
];

const WEBHOOK_TRIGGERS = [
    { value: 'lead_created', label: 'New Lead Created' },
    { value: 'status_changed', label: 'Lead Status Changed' },
    { value: 'lead_updated', label: 'Lead Updated' },
    { value: 'lead_deleted', label: 'Lead Deleted' }
];

// Sub-Components Definitions

const TeamSettings: React.FC = () => {
    const { user } = useAuth();
    const [usersList, setUsersList] = useState<User[]>(getUsers());
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'team_member' });

    const refresh = () => setUsersList(getUsers());

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            inviteUser(inviteForm.email, inviteForm.full_name, inviteForm.role as any);
            refresh();
            setIsInviteModalOpen(false);
            setInviteForm({ email: '', full_name: '', role: 'team_member' });
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                deleteUser(id);
                refresh();
            } catch(e: any) { alert(e.message); }
        }
    };

    const handleResetPassword = (id: string) => {
        if (confirm("Send password reset link?")) {
            resetUserPassword(id);
            alert("Reset link sent.");
        }
    };

    const handleToggleStatus = (id: string) => {
        toggleUserStatus(id);
        refresh();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Team Members</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage access and roles.</p>
                </div>
                <button onClick={() => setIsInviteModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={16} /> Invite Member
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usersList.map(u => (
                    <div key={u.id} className={clsx("p-4 border rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm", !u.is_active && "opacity-75 bg-slate-50 dark:bg-slate-900 border-dashed")}>
                         <div className="flex justify-between items-start mb-3">
                             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                                 {u.full_name.charAt(0)}
                             </div>
                             <span className={clsx("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold", u.role === 'superadmin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>{u.role.replace('_', ' ')}</span>
                         </div>
                         <h4 className="font-bold text-slate-900 dark:text-white">{u.full_name}</h4>
                         <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{u.email}</p>
                         <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                             <button onClick={() => handleResetPassword(u.id)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" title="Reset Password"><Key size={16} /></button>
                             {u.id !== user?.id && (
                                 <>
                                     <button onClick={() => handleToggleStatus(u.id)} className="p-1.5 text-slate-400 hover:text-amber-600" title={u.is_active ? "Deactivate" : "Activate"}><Power size={16} /></button>
                                     <button onClick={() => handleDelete(u.id, u.full_name)} className="p-1.5 text-slate-400 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                                 </>
                             )}
                         </div>
                    </div>
                ))}
            </div>

            {isInviteModalOpen && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                     <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
                         <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Invite Team Member</h3>
                         <form onSubmit={handleInvite} className="space-y-4">
                             <div>
                                 <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                 <input required value={inviteForm.full_name} onChange={(e) => setInviteForm({...inviteForm, full_name: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                             </div>
                             <div>
                                 <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                 <input type="email" required value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                             </div>
                             <div>
                                 <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                 <select value={inviteForm.role} onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                     <option value="team_member">Team Member</option>
                                     <option value="superadmin">SuperAdmin</option>
                                 </select>
                             </div>
                             <div className="pt-4 flex justify-end gap-3">
                                 <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Invite</button>
                             </div>
                         </form>
                     </div>
                 </div>
            )}
        </div>
    );
};

const EmailSettings: React.FC = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>(getEmailTemplates());
    const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(getSmtpConfig());
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

    const handleSmtpSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveSmtpConfig({...smtpConfig, is_configured: true});
        alert("SMTP Configuration Saved");
    };

    const handleTemplateSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTemplate) {
            saveEmailTemplate(editingTemplate);
            setTemplates(getEmailTemplates());
            setEditingTemplate(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* SMTP Config */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">SMTP Configuration</h3>
                <form onSubmit={handleSmtpSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                         <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Host</label>
                         <input required value={smtpConfig.host} onChange={e => setSmtpConfig({...smtpConfig, host: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="smtp.provider.com" />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Port</label>
                         <input required type="number" value={smtpConfig.port} onChange={e => setSmtpConfig({...smtpConfig, port: parseInt(e.target.value)})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="587" />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Encryption</label>
                         <select value={smtpConfig.encryption} onChange={e => setSmtpConfig({...smtpConfig, encryption: e.target.value as any})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                             <option value="TLS">TLS</option>
                             <option value="SSL">SSL</option>
                             <option value="NONE">None</option>
                         </select>
                    </div>
                    <div>
                         <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Username</label>
                         <input required value={smtpConfig.username} onChange={e => setSmtpConfig({...smtpConfig, username: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Password</label>
                         <input required type="password" value={smtpConfig.password_encrypted} onChange={e => setSmtpConfig({...smtpConfig, password_encrypted: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">From Email</label>
                         <input required type="email" value={smtpConfig.from_email} onChange={e => setSmtpConfig({...smtpConfig, from_email: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">From Name</label>
                         <input required value={smtpConfig.from_name} onChange={e => setSmtpConfig({...smtpConfig, from_name: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                    </div>
                    <div className="col-span-2 flex justify-end">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Save Config</button>
                    </div>
                </form>
            </div>

            {/* Templates */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Email Templates</h3>
                <div className="space-y-4">
                    {templates.map(tpl => (
                        <div key={tpl.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center group">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{tpl.name}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Trigger: {DEFAULT_STATUSES.find(s => s.slug === tpl.status_trigger)?.label || tpl.status_trigger}</p>
                            </div>
                            <button onClick={() => setEditingTemplate(tpl)} className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">Edit</button>
                        </div>
                    ))}
                </div>
            </div>

            {editingTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Edit Template: {editingTemplate.name}</h3>
                            <button onClick={() => setEditingTemplate(null)} className="text-slate-400">&times;</button>
                        </div>
                        <form onSubmit={handleTemplateSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Subject</label>
                                <input required value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Body</label>
                                <textarea required rows={10} value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm" />
                                <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-2">
                                    Variables: 
                                    {AVAILABLE_VARIABLES.map(v => (
                                        <span key={v.value} className="bg-slate-100 dark:bg-slate-700 px-1 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600" onClick={() => setEditingTemplate({...editingTemplate, body: editingTemplate.body + v.value})}>{v.value}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={editingTemplate.is_active} onChange={e => setEditingTemplate({...editingTemplate, is_active: e.target.checked})} className="rounded text-blue-600" />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Active</label>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Template</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const WhatsAppSettings: React.FC = () => {
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>(getWhatsAppTemplates());
    const [apiKey, setApiKey] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await fetchAisensyTemplates(apiKey || 'demo-key');
            setTemplates(getWhatsAppTemplates());
            alert("Templates synced successfully");
        } catch (e) {
            alert("Sync failed");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-6 rounded-xl">
                 <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">WhatsApp Business API (Aisensy)</h3>
                 <p className="text-sm text-green-800 dark:text-green-400 mb-4">Configure your provider to sync approved templates.</p>
                 <div className="flex gap-4">
                     <input 
                         value={apiKey} 
                         onChange={e => setApiKey(e.target.value)} 
                         placeholder="Paste Aisensy API Key" 
                         className="flex-1 p-2 border border-green-200 dark:border-green-800 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500"
                     />
                     <button onClick={handleSync} disabled={isSyncing} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2">
                         <RefreshCw size={16} className={clsx(isSyncing && "animate-spin")} />
                         {isSyncing ? "Syncing..." : "Sync Templates"}
                     </button>
                 </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Approved Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(tpl => (
                        <div key={tpl.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
                             <div className="flex justify-between items-start mb-2">
                                 <div>
                                     <h4 className="font-bold text-slate-900 dark:text-white">{tpl.name}</h4>
                                     <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{tpl.template_id}</div>
                                 </div>
                                 <div className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                     {DEFAULT_STATUSES.find(s => s.slug === tpl.status_trigger)?.label || tpl.status_trigger}
                                 </div>
                             </div>
                             <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
                                 {tpl.template_preview}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PipelineSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Pipeline Stages</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your lead lifecycle stages.</p>
            <div className="space-y-2">
                {DEFAULT_STATUSES.map((status) => (
                    <div key={status.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="text-slate-400 font-mono text-sm w-6">#{status.order}</div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }}></div>
                        <div className="flex-1 font-medium text-slate-900 dark:text-white">{status.label}</div>
                        <div className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{status.slug}</div>
                         {status.requires_payment && <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded border border-green-200 dark:border-green-800">Payment</span>}
                         {status.requires_rejection_reason && <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded border border-red-200 dark:border-red-800">Rejection</span>}
                    </div>
                ))}
            </div>
             <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-900 mt-4 flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>Pipeline stages are currently managed via system configuration and cannot be edited in this demo.</span>
            </div>
        </div>
    );
};

const TagsSettings: React.FC = () => {
    const { user } = useAuth();
    const [tags, setTags] = useState<{name: string, count: number}[]>(getAllTags());
    const [newTag, setNewTag] = useState('');
    const [editingTag, setEditingTag] = useState<{old: string, new: string} | null>(null);

    const refresh = () => setTags(getAllTags());

    const handleCreate = () => {
        if(newTag.trim()) {
            createTag(newTag.trim());
            setNewTag('');
            refresh();
        }
    };

    const handleDelete = (tag: string) => {
        if(confirm(`Delete tag "${tag}"? This will remove it from all leads.`)) {
            deleteTag(tag, user!.id);
            refresh();
        }
    };

    const handleRename = () => {
        if(editingTag && editingTag.new.trim()) {
            renameTag(editingTag.old, editingTag.new.trim(), user!.id);
            setEditingTag(null);
            refresh();
        }
    };
    
    const handleMerge = (oldTag: string) => {
        const target = prompt(`Merge "${oldTag}" into tag:`);
        if (target) {
             mergeTags(oldTag, target, user!.id);
             refresh();
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tag Management</h3>
            
            <div className="flex gap-2 max-w-md">
                <input 
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="New tag name"
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2">
                    <Plus size={16} /> Create
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map(tag => (
                    <div key={tag.name} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg group hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                        {editingTag?.old === tag.name ? (
                            <div className="flex items-center gap-2 flex-1">
                                <input 
                                    value={editingTag.new}
                                    onChange={e => setEditingTag({...editingTag, new: e.target.value})}
                                    className="w-full border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    autoFocus
                                />
                                <button onClick={handleRename} className="text-green-600 dark:text-green-400"><Check size={16} /></button>
                                <button onClick={() => setEditingTag(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <TagIcon size={16} className="text-slate-400" />
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{tag.name}</span>
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full min-w-[24px] text-center">{tag.count}</span>
                                </div>
                                <div className="hidden group-hover:flex items-center gap-1">
                                    <button onClick={() => setEditingTag({old: tag.name, new: tag.name})} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded" title="Rename"><Edit2 size={14} /></button>
                                    <button onClick={() => handleMerge(tag.name)} className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded" title="Merge"><RefreshCw size={14} /></button>
                                    <button onClick={() => handleDelete(tag.name)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded" title="Delete"><Trash2 size={14} /></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const WebhookSettings: React.FC = () => {
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>(getWebhooks());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHook, setEditingHook] = useState<WebhookConfig | null>(null);

    const refresh = () => setWebhooks(getWebhooks());

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingHook) {
            saveWebhook(editingHook);
            refresh();
            setIsModalOpen(false);
            setEditingHook(null);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this webhook?")) {
            deleteWebhook(id);
            refresh();
        }
    };

    const toggleTrigger = (trigger: string) => {
        if (!editingHook) return;
        const current = editingHook.triggers || [];
        const newTriggers = current.includes(trigger)
            ? current.filter(t => t !== trigger)
            : [...current, trigger];
        setEditingHook({ ...editingHook, triggers: newTriggers });
    };

    const openCreateModal = () => {
        setEditingHook({
            id: uuidv4(),
            name: '',
            webhook_url: '',
            triggers: ['lead_created'],
            is_active: true
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Webhooks</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Send real-time data to other systems.</p>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm"
                >
                    <Plus size={18} /> Add Webhook
                </button>
            </div>

            <div className="grid gap-4">
                {webhooks.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 italic border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        No webhooks configured.
                    </div>
                ) : (
                    webhooks.map(hook => (
                        <div key={hook.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white">{hook.name}</h4>
                                    <span className={clsx("w-2 h-2 rounded-full", hook.is_active ? "bg-green-500" : "bg-red-500")} title={hook.is_active ? "Active" : "Inactive"}></span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-2">{hook.webhook_url}</div>
                                <div className="flex flex-wrap gap-1">
                                    {hook.triggers.map(t => (
                                        <span key={t} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                            {WEBHOOK_TRIGGERS.find(wt => wt.value === t)?.label || t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingHook(hook); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(hook.id)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && editingHook && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{editingHook.id ? 'Edit Webhook' : 'New Webhook'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">&times;</button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                <input required value={editingHook.name} onChange={(e) => setEditingHook({...editingHook, name: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Zapier Sync" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payload URL</label>
                                <input required type="url" value={editingHook.webhook_url} onChange={(e) => setEditingHook({...editingHook, webhook_url: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Triggers</label>
                                <div className="space-y-2">
                                    {WEBHOOK_TRIGGERS.map(trigger => (
                                        <label key={trigger.value} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={editingHook.triggers.includes(trigger.value)}
                                                onChange={() => toggleTrigger(trigger.value)}
                                                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                                            />
                                            {trigger.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={editingHook.is_active} onChange={(e) => setEditingHook({...editingHook, is_active: e.target.checked})} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
                                </label>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Webhook</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const IntegrationSettings: React.FC = () => {
    // Local state to manage form data, only saving when clicked
    const [integrations, setIntegrations] = useState<IntegrationConfig[]>(getIntegrations());

    const handleChange = (provider: string, updates: Partial<IntegrationConfig>) => {
        setIntegrations(prev => prev.map(i => i.provider === provider ? { ...i, ...updates } : i));
    };

    const handleSettingsChange = (provider: string, key: string, value: any) => {
        setIntegrations(prev => prev.map(i => {
            if (i.provider === provider) {
                return { ...i, settings: { ...i.settings, [key]: value } };
            }
            return i;
        }));
    };

    const togglePabblyTrigger = (trigger: string) => {
        const current = integrations.find(i => i.provider === 'pabbly');
        if (!current) return;
        const currentTriggers = current.settings.triggers || [];
        const newTriggers = currentTriggers.includes(trigger)
            ? currentTriggers.filter((t: string) => t !== trigger)
            : [...currentTriggers, trigger];
        handleSettingsChange('pabbly', 'triggers', newTriggers);
    };

    const handleSave = (provider: string) => {
        const config = integrations.find(i => i.provider === provider);
        if (config) {
            saveIntegrationConfig(config);
            alert(`${provider.charAt(0).toUpperCase() + provider.slice(1).replace('_', ' ')} settings saved.`);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Integrations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Pabbly Connect */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"><Globe size={20} /></div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Pabbly Connect</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Webhook Integration</p>
                            </div>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={integrations.find(i => i.provider === 'pabbly')?.enabled} onChange={e => handleChange('pabbly', { enabled: e.target.checked })} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </div>
                    </div>
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Webhook URL</label>
                            <input 
                                placeholder="Paste Pabbly Webhook URL" 
                                value={integrations.find(i => i.provider === 'pabbly')?.settings.webhook_url || ''}
                                onChange={e => handleSettingsChange('pabbly', 'webhook_url', e.target.value)}
                                className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">Active Triggers</label>
                            <div className="space-y-1">
                                {WEBHOOK_TRIGGERS.map(trigger => (
                                    <label key={trigger.value} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={(integrations.find(i => i.provider === 'pabbly')?.settings.triggers || []).includes(trigger.value)}
                                            onChange={() => togglePabblyTrigger(trigger.value)}
                                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800"
                                        />
                                        {trigger.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <a href="https://apidocs.pabbly.com" target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                View Documentation <Share2 size={10} />
                            </a>
                            <button onClick={() => handleSave('pabbly')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                </div>

                {/* Google Sheets */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><FileSpreadsheet size={20} /></div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Google Sheets</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Sync Data Rows</p>
                            </div>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={integrations.find(i => i.provider === 'google_sheets')?.enabled} onChange={e => handleChange('google_sheets', { enabled: e.target.checked })} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </div>
                    </div>
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <input 
                            placeholder="Spreadsheet ID" 
                            value={integrations.find(i => i.provider === 'google_sheets')?.settings.spreadsheet_id || ''}
                            onChange={e => handleSettingsChange('google_sheets', 'spreadsheet_id', e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input 
                            placeholder="Sheet Name (e.g. Leads)" 
                            value={integrations.find(i => i.provider === 'google_sheets')?.settings.sheet_name || ''}
                            onChange={e => handleSettingsChange('google_sheets', 'sheet_name', e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end mt-2">
                            <button onClick={() => handleSave('google_sheets')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                </div>

                {/* Trafft */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Calendar size={20} /></div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Trafft</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Scheduling & Booking</p>
                            </div>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={integrations.find(i => i.provider === 'trafft')?.enabled} onChange={e => handleChange('trafft', { enabled: e.target.checked })} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </div>
                    </div>
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <input 
                            placeholder="API URL (e.g. https://your-booking.com/api/v1)" 
                            value={integrations.find(i => i.provider === 'trafft')?.settings.api_url || ''}
                            onChange={e => handleSettingsChange('trafft', 'api_url', e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input 
                            placeholder="Client ID" 
                            value={integrations.find(i => i.provider === 'trafft')?.settings.client_id || ''}
                            onChange={e => handleSettingsChange('trafft', 'client_id', e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input 
                            placeholder="Client Secret" 
                            type="password"
                            value={integrations.find(i => i.provider === 'trafft')?.settings.client_secret || ''}
                            onChange={e => handleSettingsChange('trafft', 'client_secret', e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end mt-2">
                            <button onClick={() => handleSave('trafft')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                </div>

                {/* Encharge */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400"><Zap size={20} /></div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Encharge</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Marketing Automation</p>
                            </div>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={integrations.find(i => i.provider === 'encharge')?.enabled} onChange={e => handleChange('encharge', { enabled: e.target.checked })} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </div>
                    </div>
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <input 
                            placeholder="API Key" 
                            type="password"
                            value={integrations.find(i => i.provider === 'encharge')?.settings.api_key || ''}
                            onChange={e => handleSettingsChange('encharge', 'api_key', e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input 
                            placeholder="Write Key" 
                            value={integrations.find(i => i.provider === 'encharge')?.settings.write_key || ''}
                            onChange={e => handleSettingsChange('encharge', 'write_key', e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end mt-2">
                            <button onClick={() => handleSave('encharge')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ApiSettings: React.FC = () => {
    const { user } = useAuth();
    const [keys, setKeys] = useState<ApiKey[]>(getApiKeys());
    const [newKeyName, setNewKeyName] = useState('');
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);

    const refresh = () => setKeys(getApiKeys());

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName.trim() || !user) return;
        const newKey = generateApiKey(newKeyName, user.id);
        setJustCreatedKey(newKey.key);
        setNewKeyName('');
        refresh();
    };

    const handleRevoke = (id: string) => {
        if (confirm("Revoke this API Key? Any systems using it will lose access immediately.")) {
            revokeApiKey(id);
            refresh();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">API Access</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage keys for external system access.</p>
                </div>
                <button 
                    onClick={() => setShowNewKeyModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm"
                >
                    <Plus size={18} /> Generate Key
                </button>
            </div>

            {/* Keys List */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Key Prefix</th>
                            <th className="p-4">Created</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {keys.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">No API keys generated.</td></tr>
                        ) : (
                            keys.map(k => (
                                <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-4 font-medium text-slate-800 dark:text-white">{k.name}</td>
                                    <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">mk_...{k.key.slice(-4)}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(k.created_at)}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleRevoke(k.id)} className="text-red-600 dark:text-red-400 hover:underline text-sm flex items-center gap-1 ml-auto">
                                            <Trash2 size={14} /> Revoke
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showNewKeyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 border border-slate-100 dark:border-slate-700">
                        {!justCreatedKey ? (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">New API Key</h3>
                                    <button onClick={() => setShowNewKeyModal(false)} className="text-slate-400">&times;</button>
                                </div>
                                <form onSubmit={handleGenerate} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Application Name</label>
                                        <input autoFocus required value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Zapier Integration" />
                                    </div>
                                    <div className="pt-2 flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowNewKeyModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Generate</button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 dark:text-green-400">
                                        <Check size={24} />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Key Generated</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Copy this key now. You won't see it again.</p>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 font-mono text-sm break-all text-slate-800 dark:text-slate-200">
                                    {justCreatedKey}
                                </div>
                                <button 
                                    onClick={() => { setJustCreatedKey(null); setShowNewKeyModal(false); }} 
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const SystemHealthSettings: React.FC = () => {
    const metrics = getSystemMetrics();

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Leads</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.total_leads}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">New Leads Today</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.new_leads_today}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Active Users</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.active_users}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Webhook Success Rate</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.webhook_success_rate}%</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Email Delivery Rate</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.email_delivery_rate}%</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Database Size</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{(metrics.db_size_bytes / 1024).toFixed(2)} KB</div>
                </div>
            </div>
        </div>
    );
};

const BackupSettings: React.FC = () => {
    const { user } = useAuth();
    const [backups, setBackups] = useState<Backup[]>(getBackups());
    
    const handleGenerate = () => {
        if (!user) return;
        generateBackup(user.id);
        setBackups(getBackups());
    };

    const handleRestore = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (confirm("This will overwrite current data. Continue?")) {
                    restoreBackup(json, user!.id);
                    alert("System restored successfully. Please reload.");
                    window.location.reload();
                }
            } catch (err) {
                alert("Invalid backup file.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Backups</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage system snapshots.</p>
                </div>
                <div className="flex gap-2">
                    <label className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2 text-sm shadow-sm">
                        <Upload size={16} /> Restore
                        <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && handleRestore(e.target.files[0])} />
                    </label>
                    <button onClick={handleGenerate} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm text-sm">
                        <Save size={16} /> Create Backup
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Filename</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Size</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {backups.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">No backups available.</td></tr>
                        ) : (
                            backups.map(b => (
                                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-4 font-medium text-slate-800 dark:text-white flex items-center gap-2">
                                        <Database size={16} className="text-slate-400" /> {b.filename}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(b.backup_date)}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{(b.file_size_bytes / 1024).toFixed(2)} KB</td>
                                    <td className="p-4 text-right">
                                        <a href={b.download_url} download={b.filename} className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1 ml-auto justify-end">
                                            <CloudDownload size={14} /> Download
                                        </a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TrashSettings: React.FC = () => {
    const { user } = useAuth();
    const [deletedLeads, setDeletedLeads] = useState<Lead[]>(getDeletedLeads());

    const refresh = () => setDeletedLeads(getDeletedLeads());

    const handleRestore = (id: string) => {
        if (!user) return;
        restoreLead(id, user.id);
        refresh();
    };

    const handlePermanentDelete = (id: string) => {
        if (confirm("This cannot be undone. Delete permanently?")) {
            deleteLeadPermanently(id);
            refresh();
        }
    };

    const handleEmptyTrash = () => {
        if (confirm("Are you sure you want to permanently delete all items in trash?")) {
            emptyTrash();
            refresh();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Trash</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage deleted leads.</p>
                </div>
                {deletedLeads.length > 0 && (
                    <button onClick={handleEmptyTrash} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 shadow-sm text-sm">
                        <Trash2 size={16} /> Empty Trash
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Lead Name</th>
                            <th className="p-4">Deleted On</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {deletedLeads.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">Trash is empty.</td></tr>
                        ) : (
                            deletedLeads.map(lead => (
                                <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-4">
                                        <div className="font-medium text-slate-800 dark:text-white">{lead.full_name}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{lead.email}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{lead.deleted_at ? formatDate(lead.deleted_at) : '-'}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleRestore(lead.id)} className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 p-1.5 rounded" title="Restore">
                                            <RotateCcw size={16} />
                                        </button>
                                        <button onClick={() => handlePermanentDelete(lead.id)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded" title="Delete Forever">
                                            <X size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('team');
    
    if (user?.role !== 'superadmin') return <div className="p-8 text-red-500">Access Denied</div>;

    const tabs = [
        { id: 'team', label: 'Team Members', icon: Users },
        { id: 'pipeline', label: 'Pipeline', icon: LayoutList },
        { id: 'tags', label: 'Tags', icon: TagIcon },
        { id: 'email', label: 'Email Templates', icon: Mail },
        { id: 'whatsapp', label: 'WhatsApp Templates', icon: MessageCircle },
        { id: 'integrations', label: 'Integrations', icon: Share2 },
        { id: 'api', label: 'API Access', icon: Code },
        { id: 'webhooks', label: 'Webhooks', icon: Webhook },
        { id: 'health', label: 'System Health', icon: Activity },
        { id: 'backup', label: 'Backup', icon: Database },
        { id: 'trash', label: 'Trash', icon: Trash2 },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure your CRM environment and team.</p>
            </div>
            
            <div className="flex flex-col md:flex-row flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 p-2 flex flex-row md:flex-col overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                                activeTab === tab.id 
                                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700" 
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {activeTab === 'team' && <TeamSettings />}
                    {activeTab === 'pipeline' && <PipelineSettings />}
                    {activeTab === 'tags' && <TagsSettings />}
                    {activeTab === 'email' && <EmailSettings />}
                    {activeTab === 'whatsapp' && <WhatsAppSettings />}
                    {activeTab === 'integrations' && <IntegrationSettings />}
                    {activeTab === 'api' && <ApiSettings />}
                    {activeTab === 'webhooks' && <WebhookSettings />}
                    {activeTab === 'health' && <SystemHealthSettings />}
                    {activeTab === 'backup' && <BackupSettings />}
                    {activeTab === 'trash' && <TrashSettings />}
                </div>
            </div>
        </div>
    );
};

export default Settings;
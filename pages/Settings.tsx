import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    getEmailTemplates, saveEmailTemplate, getSmtpConfig, saveSmtpConfig, 
    getWebhooks, saveWebhook, deleteWebhook, getWhatsAppTemplates, saveWhatsAppTemplate, deleteWhatsAppTemplate,
    generateBackup, getBackups, getDeletedLeads, restoreLead, deleteLeadPermanently, emptyTrash, simulateTrafftCall,
    getSystemMetrics, restoreBackup, getAllTags, mergeTags, deleteTag,
    getUsers, inviteUser, deleteUser, resetUserPassword, toggleUserStatus,
    saveIntegrationConfig, getIntegrations, fetchAisensyTemplates, renameTag, createTag
} from '../services/mockDb';
import { EmailTemplate, SmtpConfig, WebhookConfig, WhatsAppTemplate, Backup, Lead, SystemMetrics, User, IntegrationConfig } from '../types';
import { DEFAULT_STATUSES } from '../constants';
import { Save, Plus, Trash2, RotateCcw, Download, RefreshCw, Mail, MessageCircle, Database, Tag as TagIcon, LayoutList, Share2, Phone, Activity, Users, Key, Power, Plug, Webhook, Zap, CloudDownload, Braces, Edit2, X, Upload, AlertTriangle, Check, Search, FileSpreadsheet, Calendar } from 'lucide-react';
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

// Sub-Components Definitions

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

const IntegrationSettings: React.FC = () => {
    const [integrations, setIntegrations] = useState<IntegrationConfig[]>(getIntegrations());

    const updateConfig = (provider: string, updates: Partial<IntegrationConfig>) => {
        const current = integrations.find(i => i.provider === provider) || { provider: provider as any, enabled: false, settings: {} };
        const updated = { ...current, ...updates };
        saveIntegrationConfig(updated);
        setIntegrations(getIntegrations());
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Integrations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <input type="checkbox" className="sr-only peer" checked={integrations.find(i => i.provider === 'google_sheets')?.enabled} onChange={e => updateConfig('google_sheets', { enabled: e.target.checked })} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </div>
                    </div>
                    {/* Always Open Fields */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <input 
                            placeholder="Spreadsheet ID" 
                            value={integrations.find(i => i.provider === 'google_sheets')?.settings.spreadsheet_id || ''}
                            onChange={e => updateConfig('google_sheets', { settings: { ...integrations.find(i => i.provider === 'google_sheets')?.settings, spreadsheet_id: e.target.value } })}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input 
                            placeholder="Sheet Name (e.g. Leads)" 
                            value={integrations.find(i => i.provider === 'google_sheets')?.settings.sheet_name || ''}
                            onChange={e => updateConfig('google_sheets', { settings: { ...integrations.find(i => i.provider === 'google_sheets')?.settings, sheet_name: e.target.value } })}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
                            <input type="checkbox" className="sr-only peer" checked={integrations.find(i => i.provider === 'trafft')?.enabled} onChange={e => updateConfig('trafft', { enabled: e.target.checked })} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </div>
                    </div>
                    {/* Always Open Fields */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <input 
                            placeholder="API URL (e.g. https://your-booking.com/api/v1)" 
                            value={integrations.find(i => i.provider === 'trafft')?.settings.api_url || ''}
                            onChange={e => updateConfig('trafft', { settings: { ...integrations.find(i => i.provider === 'trafft')?.settings, api_url: e.target.value } })}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input 
                            placeholder="Client ID" 
                            value={integrations.find(i => i.provider === 'trafft')?.settings.client_id || ''}
                            onChange={e => updateConfig('trafft', { settings: { ...integrations.find(i => i.provider === 'trafft')?.settings, client_id: e.target.value } })}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input 
                            placeholder="Client Secret" 
                            type="password"
                            value={integrations.find(i => i.provider === 'trafft')?.settings.client_secret || ''}
                            onChange={e => updateConfig('trafft', { settings: { ...integrations.find(i => i.provider === 'trafft')?.settings, client_secret: e.target.value } })}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
                            <input type="checkbox" className="sr-only peer" checked={integrations.find(i => i.provider === 'encharge')?.enabled} onChange={e => updateConfig('encharge', { enabled: e.target.checked })} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </div>
                    </div>
                    {/* Always Open Fields */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <input 
                            placeholder="API Key" 
                            type="password"
                            value={integrations.find(i => i.provider === 'encharge')?.settings.api_key || ''}
                            onChange={e => updateConfig('encharge', { settings: { ...integrations.find(i => i.provider === 'encharge')?.settings, api_key: e.target.value } })}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input 
                            placeholder="Write Key" 
                            value={integrations.find(i => i.provider === 'encharge')?.settings.write_key || ''}
                            onChange={e => updateConfig('encharge', { settings: { ...integrations.find(i => i.provider === 'encharge')?.settings, write_key: e.target.value } })}
                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const SystemHealthSettings: React.FC = () => {
    const metrics = getSystemMetrics();
    
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">System Health</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Leads</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.total_leads}</div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">New Today</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">+{metrics.new_leads_today}</div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Active Users</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.active_users}</div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">DB Size</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{(metrics.db_size_bytes / 1024).toFixed(2)} KB</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                     <h4 className="font-bold text-slate-800 dark:text-white mb-4">Webhook Performance</h4>
                     <div className="flex items-center gap-4">
                         <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                             <div className="h-full bg-green-500" style={{ width: `${metrics.webhook_success_rate}%` }}></div>
                         </div>
                         <span className="font-mono text-sm font-semibold dark:text-slate-200">{metrics.webhook_success_rate}%</span>
                     </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Success rate over last 24h</p>
                 </div>

                 <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                     <h4 className="font-bold text-slate-800 dark:text-white mb-4">Email Delivery</h4>
                     <div className="flex items-center gap-4">
                         <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500" style={{ width: `${metrics.email_delivery_rate}%` }}></div>
                         </div>
                         <span className="font-mono text-sm font-semibold dark:text-slate-200">{metrics.email_delivery_rate}%</span>
                     </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Delivery rate over last 30 days</p>
                 </div>
            </div>
        </div>
    );
};

const BackupSettings: React.FC = () => {
    const { user } = useAuth();
    const [backups, setBackups] = useState<Backup[]>(getBackups());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCreateBackup = () => {
        generateBackup(user!.id);
        setBackups(getBackups());
    };

    const handleRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                restoreBackup(json, user!.id);
                alert("System restored successfully!");
                window.location.reload();
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
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white">Data Backup</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400">Manage snapshots of your CRM data.</p>
                </div>
                <div className="flex gap-2">
                     <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                         <Upload size={16} /> Restore from File
                     </button>
                     <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestoreUpload} />
                     
                     <button onClick={handleCreateBackup} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                         <Download size={16} /> Create Backup
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
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {backups.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">No backups available.</td></tr>
                        ) : (
                            backups.map(backup => (
                                <tr key={backup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-4 font-medium text-slate-800 dark:text-white">{backup.filename}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(backup.backup_date)}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400 font-mono">{(backup.file_size_bytes / 1024).toFixed(2)} KB</td>
                                    <td className="p-4">
                                        <a href={backup.download_url} download={backup.filename} className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1">
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
        restoreLead(id, user!.id);
        refresh();
    };

    const handleEmptyTrash = () => {
        if (confirm("Empty all items in trash?")) {
            emptyTrash();
            refresh();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white">Trash</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400">View and recover deleted leads.</p>
                </div>
                {deletedLeads.length > 0 && (
                    <button onClick={handleEmptyTrash} className="px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium flex items-center gap-2">
                         <Trash2 size={16} /> Empty Trash
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Lead Name</th>
                            <th className="p-4">Deleted Date</th>
                            <th className="p-4">Deleted By</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {deletedLeads.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">Trash is empty.</td></tr>
                        ) : (
                            deletedLeads.map(lead => (
                                <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-4 font-medium text-slate-800 dark:text-white">{lead.full_name} <span className="text-xs text-slate-400 block">{lead.email}</span></td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(lead.deleted_at || '')}</td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px]">?</div>
                                            <span>User</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleRestore(lead.id)} className="text-green-600 dark:text-green-400 hover:underline text-sm mr-4" title="Restore">Restore</button>
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

// ... Settings Component ...

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
                    {activeTab === 'health' && <SystemHealthSettings />}
                    {activeTab === 'backup' && <BackupSettings />}
                    {activeTab === 'trash' && <TrashSettings />}
                </div>
            </div>
        </div>
    );
};

// ... Reusable Variable Legend Component ...
interface VariableLegendProps {
    onInsert: (variable: string) => void;
}

const VariableLegend: React.FC<VariableLegendProps> = ({ onInsert }) => {
    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 mb-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Braces size={12} /> Available Variables (Tap to insert)
            </div>
            <div className="flex flex-wrap gap-2">
                {AVAILABLE_VARIABLES.map(v => (
                    <button
                        key={v.value}
                        type="button"
                        onClick={() => onInsert(v.value)}
                        className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
                        title={`Insert ${v.label}`}
                    >
                        {v.value}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Helper function to insert text at cursor
const insertAtCursor = (
    el: HTMLInputElement | HTMLTextAreaElement, 
    textToInsert: string, 
    setValue: (val: string) => void
) => {
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const val = el.value;
    const newVal = val.substring(0, start) + textToInsert + val.substring(end);
    
    setValue(newVal);
    
    // Restore focus and cursor position after React update
    setTimeout(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + textToInsert.length;
    }, 0);
};

const EmailSettings: React.FC = () => {
    const [smtp, setSmtp] = useState<SmtpConfig>(getSmtpConfig());
    const [templates, setTemplates] = useState<EmailTemplate[]>(getEmailTemplates());
    const [editingTpl, setEditingTpl] = useState<EmailTemplate | null>(null);
    
    // Track active field for variable insertion
    const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'body' | null>(null);
    const subjectRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    const handleSmtpSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveSmtpConfig({ ...smtp, is_configured: true });
        alert("SMTP Settings Saved");
    };

    const handleTplSave = () => {
        if(editingTpl) {
            saveEmailTemplate(editingTpl);
            setTemplates(getEmailTemplates());
            setEditingTpl(null);
        }
    };

    const handleInsertVariable = (variable: string) => {
        if (!editingTpl) return;
        
        if (lastFocusedField === 'subject' && subjectRef.current) {
            insertAtCursor(subjectRef.current, variable, (val) => setEditingTpl({...editingTpl, subject: val}));
        } else if (lastFocusedField === 'body' && bodyRef.current) {
            insertAtCursor(bodyRef.current, variable, (val) => setEditingTpl({...editingTpl, body: val}));
        } else {
            // Default to body if nothing focused recently
            if (bodyRef.current) {
                insertAtCursor(bodyRef.current, variable, (val) => setEditingTpl({...editingTpl, body: val}));
            }
        }
    };

    return (
        <div className="space-y-8">
            <section className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-2">SMTP Configuration</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Configure your email provider settings. Common providers:
                    <a href="https://support.google.com/mail/answer/7126229" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline mx-1">Gmail</a>,
                    <a href="https://docs.sendgrid.com/for-developers/sending-email/smtp-guide" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline mx-1">SendGrid</a>,
                    <a href="https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline mx-1">Outlook</a>.
                </p>
                <form onSubmit={handleSmtpSave} className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Host</label>
                        <input value={smtp.host || ''} onChange={e => setSmtp({...smtp, host: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" placeholder="smtp.gmail.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Port</label>
                        <input value={smtp.port || ''} onChange={e => setSmtp({...smtp, port: parseInt(e.target.value)})} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" placeholder="587" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Username</label>
                        <input value={smtp.username || ''} onChange={e => setSmtp({...smtp, username: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Password</label>
                        <input type="password" value={smtp.password_encrypted || ''} onChange={e => setSmtp({...smtp, password_encrypted: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">From Email</label>
                        <input value={smtp.from_email || ''} onChange={e => setSmtp({...smtp, from_email: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                         <button type="button" className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">Test Connection</button>
                         <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Config</button>
                    </div>
                </form>
            </section>

            <section>
                <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-slate-800 dark:text-white">Email Templates</h3>
                     <button onClick={() => setEditingTpl({ id: uuidv4(), name: '', status_trigger: 'new_lead', subject: '', body: '', is_active: true })} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1"><Plus size={16} /> Add Template</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(t => (
                        <div key={t.id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg hover:shadow-sm transition-shadow bg-white dark:bg-slate-800">
                             <div className="flex justify-between items-start">
                                 <div>
                                     <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{t.name}</h4>
                                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Trigger: <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">{t.status_trigger}</span></p>
                                 </div>
                                 <button onClick={() => setEditingTpl(t)} className="text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">Edit</button>
                             </div>
                        </div>
                    ))}
                </div>
            </section>

            {editingTpl && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-white">Edit Email Template</h3>
                            <button onClick={() => setEditingTpl(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">&times;</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Template Name</label>
                                    <input value={editingTpl.name} onChange={e => setEditingTpl({...editingTpl, name: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Trigger Status</label>
                                    <select value={editingTpl.status_trigger} onChange={e => setEditingTpl({...editingTpl, status_trigger: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500">
                                        {DEFAULT_STATUSES.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <VariableLegend onInsert={handleInsertVariable} />

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Subject</label>
                                <input 
                                    ref={subjectRef}
                                    value={editingTpl.subject} 
                                    onChange={e => setEditingTpl({...editingTpl, subject: e.target.value})} 
                                    onFocus={() => setLastFocusedField('subject')}
                                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Body</label>
                                <textarea 
                                    ref={bodyRef}
                                    value={editingTpl.body} 
                                    onChange={e => setEditingTpl({...editingTpl, body: e.target.value})} 
                                    onFocus={() => setLastFocusedField('body')}
                                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded h-32 outline-none focus:ring-2 focus:ring-blue-500 font-sans" 
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setEditingTpl(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300">Cancel</button>
                            <button onClick={handleTplSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const WhatsAppSettings: React.FC = () => {
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>(getWhatsAppTemplates());
    const [editingTpl, setEditingTpl] = useState<WhatsAppTemplate | null>(null);
    const [integrations, setIntegrations] = useState<IntegrationConfig[]>(getIntegrations());
    const [aisensyConfig, setAisensyConfig] = useState<IntegrationConfig>(integrations.find(i => i.provider === 'aisensy') || { provider: 'aisensy', enabled: false, settings: {} });
    const [isFetching, setIsFetching] = useState(false);
    
    // For variable insertion
    const msgBodyRef = useRef<HTMLTextAreaElement>(null);

    const handleSave = () => {
        if(editingTpl) {
            saveWhatsAppTemplate(editingTpl);
            setTemplates(getWhatsAppTemplates());
            setEditingTpl(null);
        }
    };

    const handleDelete = (id: string) => {
        if(confirm("Delete this template?")) {
            deleteWhatsAppTemplate(id);
            setTemplates(getWhatsAppTemplates());
        }
    };

    const handleSaveAisensy = () => {
        saveIntegrationConfig(aisensyConfig);
        alert("Aisensy configuration saved.");
    };

    const handleFetchTemplates = async () => {
        if (!aisensyConfig.settings.api_key) return alert("Please save API Key first.");
        setIsFetching(true);
        try {
            await fetchAisensyTemplates(aisensyConfig.settings.api_key);
            setTemplates(getWhatsAppTemplates());
            alert("Templates fetched successfully from Aisensy.");
        } catch (e) {
            alert("Failed to fetch templates.");
        } finally {
            setIsFetching(false);
        }
    };

    const handleInsertVariable = (variable: string) => {
        if (!editingTpl || !msgBodyRef.current) return;
        insertAtCursor(msgBodyRef.current, variable, (val) => setEditingTpl({...editingTpl, template_preview: val}));
    };

    return (
        <div>
            {/* Aisensy Config Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-8">
                <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                         <MessageCircle size={24} />
                     </div>
                     <div>
                         <h3 className="font-bold text-slate-900 dark:text-white">Aisensy Configuration</h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400">Connect your Aisensy account to send WhatsApp messages.</p>
                     </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">App ID</label>
                        <input 
                            value={aisensyConfig.settings.app_id || ''} 
                            onChange={e => setAisensyConfig({...aisensyConfig, settings: {...aisensyConfig.settings, app_id: e.target.value}})} 
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Your App ID"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">API Key</label>
                        <input 
                            type="password"
                            value={aisensyConfig.settings.api_key || ''} 
                            onChange={e => setAisensyConfig({...aisensyConfig, settings: {...aisensyConfig.settings, api_key: e.target.value}})} 
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Your API Key"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-between">
                    <button onClick={handleFetchTemplates} disabled={isFetching} className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-2">
                        <CloudDownload size={16} /> {isFetching ? "Fetching..." : "Fetch Templates from Aisensy"}
                    </button>
                    <button onClick={handleSaveAisensy} className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded text-sm hover:bg-slate-900 dark:hover:bg-slate-600">Save Config</button>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white">Message Templates</h3>
                <button 
                    onClick={() => setEditingTpl({ 
                        id: uuidv4(), name: '', status_trigger: 'new_lead', 
                        template_id: '', template_preview: '', variable_mapping: {}, is_active: true 
                    })} 
                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center gap-2"
                >
                    <Plus size={16} /> Manual Add
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {templates.map(t => (
                    <div key={t.id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                         <div className="flex justify-between items-start mb-2">
                             <div>
                                 <h4 className="font-semibold text-green-900 dark:text-green-400">{t.name}</h4>
                                 <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{t.status_trigger.replace('_', ' ')}</span>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => setEditingTpl(t)} className="text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">Edit</button>
                                <button onClick={() => handleDelete(t.id)} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"><Trash2 size={14} /></button>
                             </div>
                         </div>
                         <div className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700 mb-2 font-mono text-xs">
                             {t.template_preview}
                         </div>
                         <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500">
                             <span>ID: {t.template_id}</span>
                         </div>
                    </div>
                ))}
            </div>

            {editingTpl && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-white">Edit WhatsApp Template</h3>
                            <button onClick={() => setEditingTpl(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">&times;</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Template Name</label>
                                    <input value={editingTpl.name} onChange={e => setEditingTpl({...editingTpl, name: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Trigger Status</label>
                                    <select value={editingTpl.status_trigger} onChange={e => setEditingTpl({...editingTpl, status_trigger: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500">
                                        {DEFAULT_STATUSES.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Meta Template ID (Optional)</label>
                                <input value={editingTpl.template_id} onChange={e => setEditingTpl({...editingTpl, template_id: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. welcome_v2" />
                            </div>

                            <VariableLegend onInsert={handleInsertVariable} />

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Message Body</label>
                                <textarea 
                                    ref={msgBodyRef}
                                    value={editingTpl.template_preview} 
                                    onChange={e => setEditingTpl({...editingTpl, template_preview: e.target.value})} 
                                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded h-32 outline-none focus:ring-2 focus:ring-blue-500 font-sans" 
                                    placeholder="Hi {{first_name}}, welcome to..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setEditingTpl(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TeamSettings: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'team_member' });

    useEffect(() => {
        setUsers(getUsers());
    }, []);

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

    const handleResetPassword = (id: string, name: string) => {
        if (confirm(`Send password reset link to ${name}?`)) {
            resetUserPassword(id);
            alert(`Password reset link sent to ${name} (simulated).`);
        }
    };

    const handleToggleStatus = (id: string) => {
        toggleUserStatus(id);
        setUsers(getUsers());
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Team Members</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage access and roles.</p>
                </div>
                <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm"
                >
                    <Plus size={18} /> Invite Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {users.map(u => (
                    <div key={u.id} className={clsx("p-5 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md dark:hover:shadow-slate-900/20", !u.is_active ? "bg-slate-50 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700")}>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm", u.role === 'superadmin' ? 'bg-purple-600' : 'bg-blue-500')}>
                                    {u.full_name.charAt(0)}
                                </div>
                                <span className={clsx("px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide", u.role === 'superadmin' ? "bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800" : "bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800")}>
                                    {u.role.replace('_', ' ')}
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{u.full_name}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{u.email}</p>
                            
                            <div className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
                                <p>Joined: {formatDate(u.created_at)}</p>
                                <div className="flex items-center gap-2">
                                    Status: 
                                    <span className={clsx("font-medium", u.is_active ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400")}>
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-1">
                            <button onClick={() => handleResetPassword(u.id, u.full_name)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded" title="Reset Password">
                                <Key size={16} />
                            </button>
                            {u.id !== user?.id && (
                                <>
                                    <button onClick={() => handleToggleStatus(u.id)} className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded" title={u.is_active ? "Deactivate" : "Activate"}>
                                        <Power size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(u.id, u.full_name)}
                                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" 
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
                     <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700">
                         <div className="flex justify-between items-center mb-6">
                             <h3 className="font-bold text-lg text-slate-900 dark:text-white">Invite Team Member</h3>
                             <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">&times;</button>
                         </div>
                         <form onSubmit={handleInvite} className="space-y-4">
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                 <input required value={inviteForm.full_name} onChange={(e) => setInviteForm({...inviteForm, full_name: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                 <input type="email" required value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                 <select value={inviteForm.role} onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                     <option value="team_member">Team Member</option>
                                     <option value="superadmin">SuperAdmin</option>
                                 </select>
                             </div>
                             <div className="pt-4 flex justify-end gap-3">
                                 <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send Invitation</button>
                             </div>
                         </form>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default Settings;
import React, { useState, useEffect } from 'react';
import { Lead, Activity, User, CallLog } from '../types';
import { DEFAULT_STATUSES } from '../constants';
import { updateLead, logActivity, getLeadActivities, getUsers, deleteLead } from '../services/mockDb';
import { X, Mail, MessageCircle, CreditCard, StickyNote, Phone, ExternalLink, Copy, Check, User as UserIcon, Plus, Trash2, Edit2, AlertTriangle, RefreshCcw, Save, Calendar, Tag as TagIcon, Send, Activity as ActivityIcon, Link as LinkIcon, Database, IndianRupee } from 'lucide-react';
import { formatDate, generatePaymentLink } from '../utils/helpers';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import TagInput from './TagInput';

interface LeadDetailSidebarProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
  onStatusChangeRequest?: (lead: Lead, newStatus: string) => void;
  onPaymentLinkSendRequest?: (lead: Lead) => void;
}

const LeadDetailSidebar: React.FC<LeadDetailSidebarProps> = ({ lead, onClose, onUpdate, onStatusChangeRequest, onPaymentLinkSendRequest }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [calls, setCalls] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [noteText, setNoteText] = useState('');
  
  // Custom Fields Editing
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customFieldsBuffer, setCustomFieldsBuffer] = useState<Record<string, any>>({});

  // Tags Editing
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagsBuffer, setTagsBuffer] = useState<string[]>([]);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Forms
  const [paymentForm, setPaymentForm] = useState({ serviceId: '', couponCode: '' });
  const [generatedLink, setGeneratedLink] = useState('');
  
  const [callForm, setCallForm] = useState({
      duration: '',
      status: 'Completed',
      notes: ''
  });

  useEffect(() => {
    const acts = getLeadActivities(lead.id);
    setActivities(acts);
    setCalls(acts.filter(a => a.event_type === 'call_logged'));
    setUsers(getUsers());
    setCustomFieldsBuffer(lead.custom_fields || {});
    setTagsBuffer(lead.tags || []);
    
    // Auto-switch to Payment tab if Enrolled and no tab selected (or default)
    if (lead.status === 'enrolled' && activeTab === 'details' && !lead.payment_details) {
        // stay on details
    } else if (lead.status === 'enrolled' && activeTab === 'details') {
        // Optional: Auto switch to payment tab could be done here if desired, 
        // but let's stick to user manual navigation to avoid jarring UX unless requested.
        // For now, we keep it manual but ensure the tab is visible.
    }
  }, [lead.id, activeTab, lead.status]); 

  const handleUpdate = (updates: Partial<Lead>) => {
      if (!user) return;
      try {
          updateLead(lead.id, updates, user.id, false, lead.version);
          onUpdate();
      } catch (e: any) {
          if (e.message.includes('Conflict')) {
              setConflictError(e.message);
          } else {
              alert(e.message);
          }
      }
  };

  const handleDeleteLead = () => {
      if (!user) return;
      if (window.confirm(`Are you sure you want to delete ${lead.full_name}? It will be moved to Trash.`)) {
          try {
              deleteLead(lead.id, user.id);
              onUpdate(); // Trigger parent update to refresh list
              onClose(); // Close sidebar
          } catch (e: any) {
              alert("Failed to delete lead: " + e.message);
          }
      }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value;
      if (onStatusChangeRequest) {
          onStatusChangeRequest(lead, newStatus);
      } else {
          handleUpdate({ status: newStatus });
      }
  };

  const handleReassign = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (confirm(`Reassign lead to ${users.find(u => u.id === e.target.value)?.full_name}?`)) {
          handleUpdate({ assigned_to: e.target.value });
      }
  };

  const handleAddNote = () => {
      if (!noteText.trim() || !user) return;
      logActivity(lead.id, 'note_added', { text: noteText }, user.id);
      setNoteText('');
      setActivities(getLeadActivities(lead.id));
  };

  const handleGenerateLink = () => {
      if (!paymentForm.serviceId) return alert("Service ID is required");
      if (!user) return;
      const link = generatePaymentLink(paymentForm.serviceId, paymentForm.couponCode, lead);
      setGeneratedLink(link);
      logActivity(lead.id, 'payment_link_generated', { link }, user.id);
      setActivities(getLeadActivities(lead.id));
  };

  const handleSendPaymentLink = () => {
      setIsPaymentModalOpen(false);
      setGeneratedLink('');
      if (onPaymentLinkSendRequest) {
          onPaymentLinkSendRequest(lead);
      }
  };

  const handleLogCall = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      logActivity(lead.id, 'call_logged', { 
          duration: callForm.duration, 
          status: callForm.status,
          notes: callForm.notes
      }, user.id);
      setIsCallModalOpen(false);
      setActivities(getLeadActivities(lead.id));
      setCalls(getLeadActivities(lead.id).filter(a => a.event_type === 'call_logged'));
      setCallForm({ duration: '', status: 'Completed', notes: '' });
  };
  
  const saveCustomFields = () => {
      handleUpdate({ custom_fields: customFieldsBuffer });
      setIsEditingCustom(false);
  };

  const saveTags = () => {
      handleUpdate({ tags: tagsBuffer });
      setIsEditingTags(false);
  }

  const handleCopyLink = () => {
      navigator.clipboard.writeText(generatedLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
  }

  const handleWhatsApp = () => {
      // Use phone_normalized which contains country code, strip non-digits for wa.me URL
      const cleanNumber = lead.phone_normalized.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.full_name || 'System';

  const renderSourceCards = () => {
      const sources: { name: string, data: any }[] = [];
      
      // Check Source Details first
      if (lead.source_details) {
          Object.entries(lead.source_details).forEach(([key, value]) => {
              if (value && typeof value === 'object') sources.push({ name: key, data: value });
          });
      }
      
      // Fallback for flat sources or specific integrations if not present in source_details object
      if (sources.length === 0 && lead.source !== 'Manual Entry') {
          sources.push({ name: lead.source || 'Unknown Source', data: { 'Status': 'Imported', 'Date': lead.created_at } });
      }

      if (sources.length === 0) return null;

      return (
          <>
            {sources.map((source, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-4">
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2 text-sm">
                        <Database size={16} className="text-purple-500" /> {source.name} Data
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(source.data).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-sm border-b border-slate-50 dark:border-slate-700 last:border-0 pb-1.5 last:pb-0">
                                <span className="text-slate-500 dark:text-slate-400 capitalize">{k.replace(/_/g, ' ')}</span>
                                <span className="text-slate-800 dark:text-slate-200 font-medium">{String(v)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
          </>
      );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{lead.full_name}</h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 dark:text-slate-400">
             <Mail size={14} /> {lead.email}
             <span className="text-slate-300 dark:text-slate-600">|</span>
             <Phone size={14} /> {lead.phone_normalized}
          </div>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={handleDeleteLead} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Lead">
                <Trash2 size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Action Bar & Quick Actions */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Status</label>
                  <select 
                      value={lead.status} 
                      onChange={handleStatusChange} 
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                      {DEFAULT_STATUSES.map(s => <option key={s.id} value={s.slug}>{s.label}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Assignee</label>
                  <select 
                      value={lead.assigned_to || ''} 
                      onChange={handleReassign}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                      <option value="" disabled>Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
              </div>
          </div>

          {/* Persistent Quick Actions */}
          <div className="flex gap-2">
               <button onClick={() => setIsCallModalOpen(true)} className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-all text-sm font-medium">
                   <Phone size={16} className="text-blue-500" /> Log Call
               </button>
               <button onClick={handleWhatsApp} className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-all text-sm font-medium">
                   <MessageCircle size={16} className="text-green-500" /> WhatsApp
               </button>
               <button onClick={() => setIsPaymentModalOpen(true)} className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-all text-sm font-medium">
                   <CreditCard size={16} className="text-purple-500" /> Payment Link
               </button>
          </div>
      </div>

      {conflictError && (
          <div className="bg-red-50 dark:bg-red-900/30 p-4 border-b border-red-100 dark:border-red-900 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                  <AlertTriangle size={16} /> {conflictError}
              </div>
              <button onClick={() => { onUpdate(); setConflictError(null); }} className="text-xs bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 px-2 py-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <RefreshCcw size={12} className="inline mr-1" /> Reload
              </button>
          </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <button 
              onClick={() => setActiveTab('details')}
              className={clsx("px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap", activeTab === 'details' ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}
          >
              Details
          </button>
          <button 
              onClick={() => setActiveTab('activity')}
              className={clsx("px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap", activeTab === 'activity' ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}
          >
              Timeline & Notes
          </button>
          {lead.status === 'enrolled' && (
              <button 
                  onClick={() => setActiveTab('payment')}
                  className={clsx("px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap", activeTab === 'payment' ? "border-green-600 text-green-600 dark:text-green-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}
              >
                  Payment
              </button>
          )}
          {lead.status === 'rejected' && (
              <button 
                  onClick={() => setActiveTab('rejection')}
                  className={clsx("px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap", activeTab === 'rejection' ? "border-red-600 text-red-600 dark:text-red-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}
              >
                  Rejection Reason
              </button>
          )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4">
          
          {activeTab === 'details' && (
              <div className="space-y-4">
                  {/* Tags */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2"><TagIcon size={16} /> Tags</h3>
                          {!isEditingTags ? (
                              <button onClick={() => setIsEditingTags(true)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><Edit2 size={14} /></button>
                          ) : (
                              <div className="flex gap-2">
                                  <button onClick={() => setIsEditingTags(false)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                  <button onClick={saveTags} className="text-green-600 hover:text-green-700 dark:text-green-400"><Check size={14} /></button>
                              </div>
                          )}
                      </div>
                      {isEditingTags ? (
                          <TagInput selectedTags={tagsBuffer} onChange={setTagsBuffer} />
                      ) : (
                          <div className="flex flex-wrap gap-2">
                              {lead.tags.map(tag => (
                                  <span key={tag} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs border border-slate-200 dark:border-slate-600">{tag}</span>
                              ))}
                              {lead.tags.length === 0 && <span className="text-sm text-slate-400 italic">No tags</span>}
                          </div>
                      )}
                  </div>

                  {/* Custom Fields */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Lead Details</h3>
                          {!isEditingCustom ? (
                              <button onClick={() => setIsEditingCustom(true)} className="text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">Edit</button>
                          ) : (
                              <div className="flex gap-2">
                                  <button onClick={() => { setIsEditingCustom(false); setCustomFieldsBuffer(lead.custom_fields || {}); }} className="text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                                  <button onClick={saveCustomFields} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Save</button>
                              </div>
                          )}
                      </div>
                      <div className="space-y-4">
                          {Object.keys(customFieldsBuffer).length > 0 ? Object.entries(customFieldsBuffer).map(([key, value]) => (
                              <div key={key} className="border-b border-slate-50 dark:border-slate-700 pb-2 last:border-0 last:pb-0">
                                  <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">{key}</label>
                                  {isEditingCustom ? (
                                      <input 
                                        value={value} 
                                        onChange={(e) => setCustomFieldsBuffer({...customFieldsBuffer, [key]: e.target.value})}
                                        className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-1 rounded text-sm outline-none focus:border-blue-500"
                                      />
                                  ) : (
                                      <div className="text-sm text-slate-700 dark:text-slate-300">{String(value)}</div>
                                  )}
                              </div>
                          )) : (
                              <div className="text-sm text-slate-400 italic">No custom fields data.</div>
                          )}
                      </div>
                      {isEditingCustom && (
                           <button 
                                onClick={() => {
                                    const key = prompt("Enter Field Name:");
                                    if(key) setCustomFieldsBuffer({...customFieldsBuffer, [key]: ''});
                                }}
                                className="mt-4 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1"
                           >
                               <Plus size={14} /> Add Field
                           </button>
                      )}
                  </div>

                  {/* Render Source Cards Here */}
                  {renderSourceCards()}
              </div>
          )}

          {activeTab === 'activity' && (
              <div className="space-y-6">
                  {/* Note Input */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-3">Add Note</h3>
                      <div className="relative">
                          <textarea 
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Type a note..."
                              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                          />
                          <button 
                              onClick={handleAddNote}
                              disabled={!noteText.trim()}
                              className="absolute bottom-2 right-2 bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                              <Send size={16} />
                          </button>
                      </div>
                  </div>

                  {/* Activity Stream */}
                  <div className="space-y-4">
                      {activities.map(activity => (
                          <div key={activity.id} className="flex gap-3 relative">
                              {/* Line */}
                              <div className="absolute top-8 left-[19px] bottom-[-24px] w-0.5 bg-slate-200 dark:bg-slate-700 last:hidden"></div>
                              
                              <div className={clsx(
                                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-800 shadow-sm z-10",
                                  activity.event_type === 'note_added' ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                  activity.event_type === 'call_logged' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                                  activity.event_type.includes('status') ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                  "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                              )}>
                                  {activity.event_type === 'note_added' ? <StickyNote size={18} /> :
                                   activity.event_type === 'call_logged' ? <Phone size={18} /> :
                                   activity.event_type.includes('email') ? <Mail size={18} /> :
                                   <ActivityIcon size={18} />}
                              </div>
                              
                              <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                  <div className="flex justify-between items-start mb-1">
                                      <span className="font-semibold text-slate-800 dark:text-white text-sm capitalize">{activity.event_type.replace(/_/g, ' ')}</span>
                                      <span className="text-xs text-slate-400">{formatDate(activity.timestamp)}</span>
                                  </div>
                                  
                                  <div className="text-sm text-slate-600 dark:text-slate-300">
                                      {activity.event_type === 'note_added' && activity.event_data.text}
                                      {activity.event_type === 'call_logged' && (
                                          <div>
                                              <div className="flex gap-2 text-xs font-medium mb-1">
                                                  <span className={clsx("px-1.5 py-0.5 rounded", 
                                                      activity.event_data.status === 'Completed' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                  )}>{activity.event_data.status}</span>
                                                  <span className="text-slate-500 dark:text-slate-400">• {activity.event_data.duration}</span>
                                              </div>
                                              <p>{activity.event_data.notes}</p>
                                          </div>
                                      )}
                                      {activity.event_type === 'status_changed' && (
                                          <span>Changed from <strong>{activity.event_data.from?.replace('_', ' ')}</strong> to <strong>{activity.event_data.to?.replace('_', ' ')}</strong></span>
                                      )}
                                      {activity.event_type === 'payment_link_generated' && (
                                          <a href={activity.event_data.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all block">
                                              {activity.event_data.link}
                                          </a>
                                      )}
                                      {!['note_added', 'call_logged', 'status_changed', 'payment_link_generated'].includes(activity.event_type) && (
                                          <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded mt-1 overflow-x-auto text-slate-600 dark:text-slate-300">
                                              {JSON.stringify(activity.event_data, null, 2)}
                                          </pre>
                                      )}
                                  </div>
                                  <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                                      <UserIcon size={12} /> {getUserName(activity.performed_by)}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'payment' && (
              <div className="space-y-6">
                  {lead.payment_details ? (
                      <>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-sm">
                                <CreditCard size={18} className="text-green-600" /> Payment Overview
                            </h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Total Amount</div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                                        <IndianRupee size={16} /> {lead.payment_details.amount.toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Status</div>
                                    <div className="inline-flex px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
                                        COMPLETED
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Payment Mode</div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200">{lead.payment_details.mode}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Transaction ID</div>
                                    <div className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300 break-all">
                                        {lead.payment_details.transaction_id}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Date</div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200">
                                        {lead.payment_details.payment_date ? formatDate(lead.payment_details.payment_date) : '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Coupon Used</div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200">
                                        {lead.payment_details.coupon_code || <span className="text-slate-400 italic">None</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {lead.payment_details.emi_details && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-sm">
                                    <Calendar size={18} className="text-blue-600" /> EMI Schedule
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                        <span className="text-slate-500 dark:text-slate-400">Tenure</span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">{lead.payment_details.emi_details.tenure}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                        <span className="text-slate-500 dark:text-slate-400">Monthly Amount</span>
                                        <span className="font-bold text-slate-900 dark:text-white flex items-center">
                                            <IndianRupee size={14} /> {lead.payment_details.emi_details.monthly_amount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Next Due Date</span>
                                        <span className="font-medium text-red-600 dark:text-red-400">
                                            {formatDate(lead.payment_details.emi_details.next_payment_date).split(',')[0]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                      </>
                  ) : (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                          <div className="text-slate-400 dark:text-slate-500 mb-2">
                              <CreditCard size={32} className="mx-auto" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400">No payment details found for this lead.</p>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'rejection' && (
              <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-xl border border-red-100 dark:border-red-900">
                  <h3 className="font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                      <AlertTriangle size={18} /> Rejection Details
                  </h3>
                  <div className="text-sm text-red-700 dark:text-red-300">
                      <p className="font-semibold mb-1">Reason provided:</p>
                      <p className="italic">"{lead.rejection_reason || 'No reason specified'}"</p>
                  </div>
              </div>
          )}
      </div>

      {/* Payment Link Modal */}
      {isPaymentModalOpen && (
          <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl w-full max-w-sm p-6 relative flex flex-col max-h-[90vh]">
                  <button onClick={() => { setIsPaymentModalOpen(false); setGeneratedLink(''); }} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20}/></button>
                  <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Generate Payment Link</h3>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 text-xs space-y-1.5">
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Name:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{lead.full_name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Email:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{lead.email}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Phone:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{lead.phone_normalized}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">UTM Source:</span> <span className="font-mono text-blue-600 dark:text-blue-400">CRM</span></div>
                  </div>

                  {!generatedLink ? (
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Service ID</label>
                              <input 
                                  value={paymentForm.serviceId} 
                                  onChange={e => setPaymentForm({...paymentForm, serviceId: e.target.value})}
                                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="e.g. pl_12345"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Coupon Code (Optional)</label>
                              <input 
                                  value={paymentForm.couponCode} 
                                  onChange={e => setPaymentForm({...paymentForm, couponCode: e.target.value})}
                                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              />
                          </div>
                          <button onClick={handleGenerateLink} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                              Generate Link
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-4 text-center">
                          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm break-all border border-green-100 dark:border-green-800 flex items-start gap-2 text-left">
                              <LinkIcon size={16} className="shrink-0 mt-0.5" />
                              <span className="line-clamp-3">{generatedLink}</span>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={handleCopyLink} className="flex-1 border border-slate-300 dark:border-slate-600 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300">
                                  {copySuccess ? <Check size={16} className="text-green-600" /> : <Copy size={16} />} 
                                  {copySuccess ? 'Copied' : 'Copy'}
                              </button>
                              <button onClick={handleSendPaymentLink} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2">
                                  <Send size={16} /> Send to Lead
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Call Log Modal */}
      {isCallModalOpen && (
          <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl w-full max-w-sm p-6 relative">
                  <button onClick={() => setIsCallModalOpen(false)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20}/></button>
                  <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Log Call</h3>
                  <form onSubmit={handleLogCall} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Status</label>
                              <select 
                                  value={callForm.status} 
                                  onChange={e => setCallForm({...callForm, status: e.target.value})}
                                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                  <option>Completed</option>
                                  <option>No-Show</option>
                                  <option>Cancelled</option>
                                  <option>Rescheduled</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Duration</label>
                              <input 
                                  value={callForm.duration} 
                                  onChange={e => setCallForm({...callForm, duration: e.target.value})}
                                  placeholder="e.g. 15m 30s"
                                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Notes</label>
                          <textarea 
                              value={callForm.notes} 
                              onChange={e => setCallForm({...callForm, notes: e.target.value})}
                              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded text-sm h-20 outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Call summary..."
                          />
                      </div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                          Save Log
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default LeadDetailSidebar;
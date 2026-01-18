import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeads, createLead, checkDuplicateLead, updateLead, getUsers, mergeLead, bulkDeleteLeads, bulkUpdateLeads, triggerAutomation, bulkAddTags, bulkRemoveTags, getAllTags, logActivity } from '../services/mockDb';
import { Lead, User, Status, FilterState } from '../types';
import { DEFAULT_STATUSES } from '../constants';
import { Plus, Search, Filter, LayoutGrid, List, Upload, Trash2, Tag, RefreshCw, X, AlertTriangle, UserPlus, Tag as TagIcon, Check } from 'lucide-react';
import { validateEmail } from '../utils/helpers';
import LeadsTable from '../components/LeadsTable';
import KanbanBoard from '../components/KanbanBoard';
import LeadDetailSidebar from '../components/LeadDetailSidebar';
import CSVImportModal from '../components/CSVImportModal';
import StatusAutomationModal from '../components/StatusAutomationModal';
import EnrollmentModal from '../components/EnrollmentModal';
import RejectionModal from '../components/RejectionModal';
import TagInput from '../components/TagInput';
import clsx from 'clsx';

const Leads: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
      search: '',
      source: [],
      tags: [],
      status: [],
      assignee: [],
      dateRange: 'all'
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<{exists: boolean, lead?: Lead, normalizedPhone?: string} | null>(null);
  
  // Automation Modal State
  const [automationPending, setAutomationPending] = useState<{lead: Lead, newStatus: string, triggerType?: string} | null>(null);
  
  // Special Status Modals
  const [enrollmentPending, setEnrollmentPending] = useState<{lead: Lead, newStatus: string} | null>(null);
  const [rejectionPending, setRejectionPending] = useState<{lead: Lead, newStatus: string} | null>(null);
  
  // Bulk Actions State
  const [bulkStatusTarget, setBulkStatusTarget] = useState('');
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [isBulkTagMode, setIsBulkTagMode] = useState(false);
  
  // Forms
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    country_code: '+91',
    phone_raw: '',
    source: 'Manual Entry',
    tags: [] as string[],
    custom_fields: [] as { key: string; value: string }[]
  });

  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLeads(getLeads());
    setUsers(getUsers());
    setAvailableTags(getAllTags().map(t => t.name));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'email') {
        const val = validateEmail(value);
        if (val.warning) setEmailWarning(val.warning);
        else setEmailWarning(null);
    }
  };

  const handleCustomFieldChange = (index: number, field: 'key' | 'value', value: string) => {
      const newFields = [...formData.custom_fields];
      newFields[index][field] = value;
      setFormData({ ...formData, custom_fields: newFields });
  };

  const addCustomField = () => {
      setFormData({ ...formData, custom_fields: [...formData.custom_fields, { key: '', value: '' }] });
  };

  const removeCustomField = (index: number) => {
      setFormData({ ...formData, custom_fields: formData.custom_fields.filter((_, i) => i !== index) });
  };

  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const emailCheck = validateEmail(formData.email);
    if (!emailCheck.valid) {
        alert(emailCheck.error);
        return;
    }

    const result = checkDuplicateLead(formData.phone_raw);
    
    if (result.exists) {
      setDuplicateCheckResult(result);
    } else {
      try {
        const customFieldsObj = formData.custom_fields.reduce((acc, curr) => {
            if (curr.key) acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        createLead({ ...formData, custom_fields: customFieldsObj }, user.id);
        setIsAddModalOpen(false);
        resetForm();
        loadData();
      } catch (err) {
        alert(err);
      }
    }
  };

  const handleMerge = () => {
      if (!duplicateCheckResult?.lead || !user) return;
      const customFieldsObj = formData.custom_fields.reduce((acc, curr) => {
            if (curr.key) acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

      mergeLead(duplicateCheckResult.lead.id, { ...formData, custom_fields: customFieldsObj }, user.id);
      setDuplicateCheckResult(null);
      setIsAddModalOpen(false);
      resetForm();
      loadData();
  }

  const resetForm = () => {
    setFormData({ 
        first_name: '', last_name: '', email: '', country_code: '+91', phone_raw: '', 
        source: 'Manual Entry', tags: [], custom_fields: [] 
    });
    setDuplicateCheckResult(null);
    setEmailWarning(null);
  };

  // Status Change Interception Logic
  const handleStatusChangeRequest = (lead: Lead, newStatus: string) => {
      if (newStatus === 'enrolled') {
          setEnrollmentPending({ lead, newStatus });
      } else if (newStatus === 'rejected') {
          setRejectionPending({ lead, newStatus });
      } else {
          setAutomationPending({ lead, newStatus });
      }
  };

  const handleEnrollmentConfirm = (paymentDetails: any) => {
      if (!enrollmentPending || !user) return;
      const { lead, newStatus } = enrollmentPending;
      try {
          // Explicitly passing payment_details here to ensure it's saved to the lead record
          updateLead(lead.id, { status: newStatus, payment_details: paymentDetails }, user.id, false, lead.version);
          setEnrollmentPending(null);
          triggerAutomation('email', lead.id, 'Enrollment Confirmation', user.id);
          
          // Reload everything to ensure UI is in sync
          loadData();
          
          // Force refresh selected lead if it's the one being modified
          if (selectedLead && selectedLead.id === lead.id) {
             const updatedLead = getLeads().find(l => l.id === lead.id);
             if (updatedLead) setSelectedLead(updatedLead);
          }
      } catch (e: any) { alert(e.message); }
  };

  const handleRejectionConfirm = (reason: string) => {
      if (!rejectionPending || !user) return;
      const { lead, newStatus } = rejectionPending;
      try {
          updateLead(lead.id, { status: newStatus, rejection_reason: reason }, user.id, false, lead.version);
          logActivity(lead.id, 'note_added', { text: `Rejection Reason: ${reason}` }, user.id);
          setRejectionPending(null);
          loadData();
          if (selectedLead && selectedLead.id === lead.id) {
             setSelectedLead(getLeads().find(l => l.id === lead.id) || null);
          }
      } catch (e: any) { alert(e.message); }
  };

  const confirmAutomation = (sendAutomation: boolean, emailBody?: string) => {
      if (!automationPending || !user) return;
      const { lead, newStatus, triggerType } = automationPending;
      
      try {
          // If it's a payment link trigger, we don't update status, just send automation
          if (triggerType === 'payment_link') {
              if (sendAutomation) {
                  triggerAutomation('email', lead.id, emailBody || 'Payment Link', user.id);
                  triggerAutomation('whatsapp', lead.id, 'Payment Link', user.id);
              }
          } else {
              updateLead(lead.id, { status: newStatus }, user.id, false, lead.version);
              if (sendAutomation) {
                  triggerAutomation('email', lead.id, emailBody || 'Default Body', user.id);
                  triggerAutomation('whatsapp', lead.id, 'Template', user.id);
              }
          }
          
          loadData();
          setAutomationPending(null);
          if (selectedLead && selectedLead.id === lead.id) {
             setSelectedLead(getLeads().find(l => l.id === lead.id) || null);
          }
      } catch (e: any) {
          alert(e.message); 
          loadData(); 
      }
  };

  // Bulk & Filter Logic ...
  const handleBulkStatusChange = () => {
      if (!bulkStatusTarget || !user) return;
      if (confirm(`Move ${selectedIds.length} leads to ${DEFAULT_STATUSES.find(s => s.slug === bulkStatusTarget)?.label}?`)) {
          bulkUpdateLeads(selectedIds, { status: bulkStatusTarget }, user.id);
          setSelectedIds([]);
          setBulkStatusTarget('');
          loadData();
      }
  };

  const handleBulkDelete = () => {
      if (!user) return;
      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} leads?`)) {
          try {
              bulkDeleteLeads(selectedIds, user.id);
              setSelectedIds([]);
              loadData();
          } catch (e: any) {
              alert("Bulk delete failed: " + e.message);
          }
      }
  };

  const handleBulkTags = (action: 'add' | 'remove') => {
      if (!bulkTagInput || !user) return;
      const tags = bulkTagInput.split(',').map(t => t.trim()).filter(Boolean);
      if (action === 'add') bulkAddTags(selectedIds, tags, user.id);
      else bulkRemoveTags(selectedIds, tags, user.id);
      
      setBulkTagInput('');
      setIsBulkTagMode(false);
      setSelectedIds([]);
      loadData();
  }

  const handleBulkReassign = (userId: string) => {
      if (!user) return;
      if (confirm(`Reassign ${selectedIds.length} leads to ${users.find(u => u.id === userId)?.full_name}?`)) {
          bulkUpdateLeads(selectedIds, { assigned_to: userId }, user.id);
          setSelectedIds([]);
          loadData();
      }
  }

  const filteredLeads = leads.filter(lead => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = !filters.search || 
                          lead.full_name.toLowerCase().includes(searchLower) || 
                          lead.email.toLowerCase().includes(searchLower) ||
                          lead.phone_normalized.includes(filters.search);
    
    const matchesStatus = filters.status.length === 0 || filters.status.includes(lead.status);
    const matchesSource = filters.source.length === 0 || (lead.source && filters.source.includes(lead.source));
    
    // Updated filters for Tags and Assignees
    const matchesAssignee = filters.assignee.length === 0 || (lead.assigned_to && filters.assignee.includes(lead.assigned_to));
    const matchesTags = filters.tags.length === 0 || filters.tags.every(t => lead.tags.includes(t));

    return matchesSearch && matchesStatus && matchesAssignee && matchesSource && matchesTags;
  });

  return (
    <div className="relative h-full flex flex-col">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Leads</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and track your cohort applications.</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setViewMode(viewMode === 'table' ? 'kanban' : 'table')}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title="Toggle View"
            >
                {viewMode === 'table' ? <LayoutGrid size={20} /> : <List size={20} />}
            </button>
            <button 
              onClick={() => setIsCSVModalOpen(true)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm font-medium"
            >
              <Upload size={18} /> Import
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm font-medium"
            >
              <Plus size={18} /> Add Lead
            </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row gap-3 items-center shrink-0 flex-wrap transition-colors">
        <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
                type="text" 
                placeholder="Search leads..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
        </div>
        
        {/* Status Filter */}
        <select 
             className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 outline-none w-32 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
             onChange={(e) => {
                 const val = e.target.value;
                 if (val && !filters.status.includes(val)) setFilters({...filters, status: [...filters.status, val]});
             }}
             value=""
        >
             <option value="" disabled>Status</option>
             {DEFAULT_STATUSES.map(s => <option key={s.id} value={s.slug}>{s.label}</option>)}
        </select>
        
        {/* Assignee Filter */}
        <select 
             className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 outline-none w-32 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
             onChange={(e) => {
                 const val = e.target.value;
                 if (val && !filters.assignee.includes(val)) setFilters({...filters, assignee: [...filters.assignee, val]});
             }}
             value=""
        >
             <option value="" disabled>Assignee</option>
             {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>

        {/* Tags Filter */}
        <select 
             className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 outline-none w-32 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
             onChange={(e) => {
                 const val = e.target.value;
                 if (val && !filters.tags.includes(val)) setFilters({...filters, tags: [...filters.tags, val]});
             }}
             value=""
        >
             <option value="" disabled>Tags</option>
             {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Active Filters Chips */}
        {(filters.status.length > 0 || filters.source.length > 0 || filters.assignee.length > 0 || filters.tags.length > 0) && (
            <div className="flex gap-2 items-center overflow-x-auto max-w-full">
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"></div>
                {filters.status.map(s => (
                    <span key={s} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium border border-blue-100 dark:border-blue-800">
                        {DEFAULT_STATUSES.find(st => st.slug === s)?.label}
                        <button onClick={() => setFilters({...filters, status: filters.status.filter(x => x !== s)})}><X size={12} /></button>
                    </span>
                ))}
                {filters.assignee.map(id => (
                    <span key={id} className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-md text-xs font-medium border border-purple-100 dark:border-purple-800">
                        {users.find(u => u.id === id)?.full_name || 'Unknown'}
                        <button onClick={() => setFilters({...filters, assignee: filters.assignee.filter(x => x !== id)})}><X size={12} /></button>
                    </span>
                ))}
                {filters.tags.map(t => (
                    <span key={t} className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-md text-xs font-medium border border-yellow-100 dark:border-yellow-800">
                        {t}
                        <button onClick={() => setFilters({...filters, tags: filters.tags.filter(x => x !== t)})}><X size={12} /></button>
                    </span>
                ))}
                <button onClick={() => setFilters({search: '', source: [], tags: [], status: [], assignee: [], dateRange: 'all'})} className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 ml-2 whitespace-nowrap">Reset All</button>
            </div>
        )}
      </div>

      {/* Bulk Toolbar */}
      {selectedIds.length > 0 && (
          <div className="bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-lg shadow-lg mb-4 flex items-center justify-between animate-in slide-in-from-top-2 overflow-x-auto z-10 border border-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-4">
                  <span className="font-semibold whitespace-nowrap text-sm">{selectedIds.length} selected</span>
                  <div className="h-4 w-px bg-slate-700"></div>
                  
                  {/* Status */}
                  <div className="flex items-center gap-2">
                       <select 
                           value={bulkStatusTarget} 
                           onChange={(e) => setBulkStatusTarget(e.target.value)}
                           className="bg-slate-800 dark:bg-slate-900 text-white border-none text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-slate-600"
                       >
                           <option value="" className="bg-slate-800 dark:bg-slate-900">Change Status...</option>
                           {DEFAULT_STATUSES.map(s => <option key={s.id} value={s.slug} className="bg-slate-800 dark:bg-slate-900">{s.label}</option>)}
                       </select>
                       {bulkStatusTarget && (
                           <button onClick={handleBulkStatusChange} className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-500">Apply</button>
                       )}
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2">
                      {isBulkTagMode ? (
                          <div className="flex items-center gap-1">
                              <input 
                                  value={bulkTagInput}
                                  onChange={e => setBulkTagInput(e.target.value)}
                                  placeholder="Tag name"
                                  className="bg-slate-800 dark:bg-slate-900 text-white border-none text-sm rounded px-2 py-1 w-24 outline-none"
                              />
                              <button onClick={() => handleBulkTags('add')} className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-500">Add</button>
                              <button onClick={() => handleBulkTags('remove')} className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-500">Rem</button>
                              <button onClick={() => setIsBulkTagMode(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                          </div>
                      ) : (
                          <button onClick={() => setIsBulkTagMode(true)} className="flex items-center gap-1 text-sm hover:text-blue-300">
                              <TagIcon size={16} /> Tags
                          </button>
                      )}
                  </div>

                  {/* Reassign (SuperAdmin) */}
                  {user?.role === 'superadmin' && (
                      <div className="flex items-center gap-2">
                          <select 
                              onChange={(e) => { if(e.target.value) handleBulkReassign(e.target.value) }}
                              className="bg-slate-800 dark:bg-slate-900 text-white border-none text-sm rounded px-2 py-1 w-32 outline-none focus:ring-1 focus:ring-slate-600"
                              value=""
                          >
                              <option value="" className="bg-slate-800 dark:bg-slate-900">Reassign...</option>
                              {users.filter(u => u.is_active).map(u => (
                                  <option key={u.id} value={u.id} className="bg-slate-800 dark:bg-slate-900">{u.full_name}</option>
                              ))}
                          </select>
                      </div>
                  )}
              </div>
              <button onClick={handleBulkDelete} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm ml-4">
                  <Trash2 size={16} /> Delete
              </button>
          </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden min-h-0 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
          {viewMode === 'table' ? (
              <LeadsTable 
                  leads={filteredLeads}
                  users={users}
                  selectedIds={selectedIds}
                  onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                  onToggleSelectAll={() => setSelectedIds(selectedIds.length === filteredLeads.length ? [] : filteredLeads.map(l => l.id))}
                  onLeadClick={setSelectedLead}
                  onStatusChange={handleStatusChangeRequest}
              />
          ) : (
              <KanbanBoard 
                  leads={filteredLeads}
                  users={users}
                  onLeadClick={setSelectedLead}
                  onStatusChange={handleStatusChangeRequest}
              />
          )}
      </div>

      {/* Modals */}
      {selectedLead && (
          <LeadDetailSidebar 
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onUpdate={() => { loadData(); setSelectedLead(getLeads().find(l => l.id === selectedLead.id) || null); }}
              onStatusChangeRequest={handleStatusChangeRequest}
              onPaymentLinkSendRequest={(lead) => setAutomationPending({ lead, newStatus: lead.status, triggerType: 'payment_link' })}
          />
      )}
      
      {automationPending && (
          <StatusAutomationModal 
              lead={automationPending.lead}
              newStatusSlug={automationPending.newStatus}
              triggerType={automationPending.triggerType}
              onConfirm={confirmAutomation}
              onCancel={() => setAutomationPending(null)}
          />
      )}

      {enrollmentPending && (
          <EnrollmentModal
              lead={enrollmentPending.lead}
              onConfirm={handleEnrollmentConfirm}
              onCancel={() => setEnrollmentPending(null)}
          />
      )}

      {rejectionPending && (
          <RejectionModal 
              lead={rejectionPending.lead}
              onConfirm={handleRejectionConfirm}
              onCancel={() => setRejectionPending(null)}
          />
      )}

      {isCSVModalOpen && (
          <CSVImportModal 
              onClose={() => setIsCSVModalOpen(false)}
              onComplete={loadData}
          />
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Add New Lead</h3>
                    <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">&times;</button>
                </div>
                
                {!duplicateCheckResult ? (
                    <div className="overflow-y-auto p-6">
                        <form onSubmit={handleAddLeadSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                                    <input name="first_name" required value={formData.first_name} onChange={handleInputChange} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                                    <input name="last_name" required value={formData.last_name} onChange={handleInputChange} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                                <input name="email" type="email" required value={formData.email} onChange={handleInputChange} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                                {emailWarning && <p className="text-xs text-amber-600 mt-1">{emailWarning}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                                <div className="flex gap-2">
                                    <select 
                                        name="country_code"
                                        value={formData.country_code}
                                        onChange={handleInputChange}
                                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none"
                                    >
                                        <option value="+91">+91 (IN)</option>
                                        <option value="+1">+1 (US)</option>
                                        <option value="+44">+44 (UK)</option>
                                        <option value="+61">+61 (AU)</option>
                                        <option value="+65">+65 (SG)</option>
                                        <option value="+971">+971 (UAE)</option>
                                    </select>
                                    <input name="phone_raw" type="tel" required placeholder="98765 43210" value={formData.phone_raw} onChange={handleInputChange} className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source</label>
                                <select name="source" value={formData.source} onChange={handleInputChange} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                    <option>Manual Entry</option>
                                    <option>CSV upload</option>
                                    <option>Meta Form</option>
                                    <option>Deftform</option>
                                    <option>Webflow</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
                                <TagInput 
                                    selectedTags={formData.tags} 
                                    onChange={(tags) => setFormData({...formData, tags})} 
                                />
                            </div>

                            {/* Custom Fields Section */}
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Custom Fields</label>
                                <div className="space-y-3">
                                    {formData.custom_fields.map((field, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                                            <button type="button" onClick={() => removeCustomField(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                                                <X size={16} />
                                            </button>
                                            <div className="mb-2">
                                                <input 
                                                    placeholder="Question / Field Name" 
                                                    value={field.key} 
                                                    onChange={e => handleCustomFieldChange(idx, 'key', e.target.value)} 
                                                    className="w-full p-2 border-b border-slate-200 dark:border-slate-700 bg-transparent text-sm font-medium focus:border-blue-500 outline-none text-slate-900 dark:text-white" 
                                                />
                                            </div>
                                            <div>
                                                <input 
                                                    placeholder="Answer / Value" 
                                                    value={field.value} 
                                                    onChange={e => handleCustomFieldChange(idx, 'value', e.target.value)} 
                                                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm focus:border-blue-500 outline-none text-slate-900 dark:text-white" 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addCustomField} className="mt-3 text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1 hover:underline">
                                    <Plus size={16} /> Add Custom Field
                                </button>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Lead</button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                             <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                             <div>
                                 <h4 className="font-semibold text-amber-900 dark:text-amber-200">Duplicate Lead Detected</h4>
                                 <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                                     A lead with phone <strong>{duplicateCheckResult.normalizedPhone}</strong> already exists as <strong>{duplicateCheckResult.lead?.full_name}</strong>.
                                 </p>
                             </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                            Would you like to merge the new information into the existing lead?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setDuplicateCheckResult(null); setIsAddModalOpen(false); }} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                            <button onClick={handleMerge} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Update & Merge</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
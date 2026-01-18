import React, { useState } from 'react';
import { Lead, User } from '../types';
import { DEFAULT_STATUSES } from '../constants';
import { Mail, Phone, Calendar, User as UserIcon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import clsx from 'clsx';

interface LeadsTableProps {
  leads: Lead[];
  users: User[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (lead: Lead, newStatus: string) => void;
}

const LeadsTable: React.FC<LeadsTableProps> = ({ 
    leads, users, selectedIds, onToggleSelect, onToggleSelectAll, onLeadClick, onStatusChange 
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead | 'date', direction: 'asc' | 'desc' } | null>(null);

  const getStatusColor = (slug: string) => {
    const status = DEFAULT_STATUSES.find(s => s.slug === slug);
    return status ? status.color : '#ccc';
  };

  const getUserName = (id?: string) => {
      const u = users.find(user => user.id === id);
      return u ? u.full_name : 'Unassigned';
  };

  const handleSort = (key: keyof Lead | 'date') => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const sortedLeads = [...leads].sort((a, b) => {
      if (!sortConfig) return 0;
      
      const { key, direction } = sortConfig;
      
      let valA: any = a[key as keyof Lead];
      let valB: any = b[key as keyof Lead];

      if (key === 'date') {
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
      } else if (key === 'assigned_to') {
          valA = getUserName(a.assigned_to).toLowerCase();
          valB = getUserName(b.assigned_to).toLowerCase();
      } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
  });

  const SortIcon = ({ column }: { column: keyof Lead | 'date' }) => {
      if (sortConfig?.key !== column) return <ArrowUpDown size={14} className="text-slate-300 opacity-50" />;
      return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-500" /> : <ArrowDown size={14} className="text-blue-500" />;
  };

  return (
    <div className="bg-white dark:bg-slate-800 overflow-hidden h-full flex flex-col">
         <div className="overflow-auto flex-1">
             <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10 shadow-sm">
                     <tr className="text-slate-500 dark:text-slate-400 text-xs font-semibold tracking-wide border-b border-slate-200 dark:border-slate-700 select-none">
                         <th className="p-3 w-10 text-center">
                             <input 
                                type="checkbox" 
                                checked={leads.length > 0 && selectedIds.length === leads.length}
                                onChange={onToggleSelectAll}
                                className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700"
                             />
                         </th>
                         <th className="p-3 font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50" onClick={() => handleSort('full_name')}>
                             <div className="flex items-center gap-1">Lead Name <SortIcon column="full_name" /></div>
                         </th>
                         <th className="p-3 font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50" onClick={() => handleSort('status')}>
                             <div className="flex items-center gap-1">Status <SortIcon column="status" /></div>
                         </th>
                         <th className="p-3 font-medium">Contact</th>
                         <th className="p-3 font-medium">Tags</th>
                         <th className="p-3 font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50" onClick={() => handleSort('assigned_to')}>
                             <div className="flex items-center gap-1">Assignee <SortIcon column="assigned_to" /></div>
                         </th>
                         <th className="p-3 font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50" onClick={() => handleSort('date')}>
                             <div className="flex items-center gap-1">Date <SortIcon column="date" /></div>
                         </th>
                     </tr>
                 </thead>
                 <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-700">
                     {sortedLeads.length === 0 ? (
                         <tr>
                             <td colSpan={7} className="p-12 text-center text-slate-400 dark:text-slate-500">
                                 No leads match your criteria.
                             </td>
                         </tr>
                     ) : (
                         sortedLeads.map(lead => (
                             <tr 
                                key={lead.id} 
                                className={clsx("group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer", selectedIds.includes(lead.id) && "bg-blue-50/60 dark:bg-blue-900/20")}
                                onClick={() => onLeadClick(lead)}
                             >
                                 <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                     <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(lead.id)}
                                        onChange={() => onToggleSelect(lead.id)}
                                        className={clsx("rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700", !selectedIds.includes(lead.id) && "opacity-0 group-hover:opacity-100 transition-opacity")}
                                     />
                                 </td>
                                 <td className="p-3">
                                     <div className="font-medium text-slate-800 dark:text-slate-200">{lead.full_name}</div>
                                     {lead.merged_identities?.emails.length ? (
                                        <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 inline-block px-1 rounded mt-0.5">Merged</div>
                                     ) : null}
                                 </td>
                                 <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                     <div className="relative inline-block">
                                         <select 
                                            value={lead.status} 
                                            onChange={(e) => onStatusChange(lead, e.target.value)}
                                            className="appearance-none py-1 pl-2 pr-6 rounded-full text-xs font-medium border-none outline-none cursor-pointer hover:bg-opacity-30 transition-colors"
                                            style={{ backgroundColor: `${getStatusColor(lead.status)}20`, color: getStatusColor(lead.status) }}
                                         >
                                            {DEFAULT_STATUSES.map(s => (
                                                <option key={s.id} value={s.slug} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200">{s.label}</option>
                                            ))}
                                         </select>
                                         <span className="absolute right-2 top-1.5 pointer-events-none" style={{ borderTop: `4px solid ${getStatusColor(lead.status)}`, borderLeft: '3px solid transparent', borderRight: '3px solid transparent' }}></span>
                                     </div>
                                 </td>
                                 <td className="p-3">
                                     <div className="text-slate-600 dark:text-slate-400 text-xs flex flex-col gap-0.5">
                                         <span className="truncate max-w-[150px]">{lead.email}</span>
                                         <span className="text-slate-400 dark:text-slate-500">{lead.phone_normalized}</span>
                                     </div>
                                 </td>
                                 <td className="p-3">
                                      <div className="flex gap-1 flex-wrap">
                                          {lead.tags.slice(0, 2).map(tag => (
                                              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">{tag}</span>
                                          ))}
                                          {lead.tags.length > 2 && <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1">+{lead.tags.length - 2}</span>}
                                      </div>
                                 </td>
                                 <td className="p-3">
                                     <div className="flex items-center gap-2">
                                         <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-white dark:border-slate-600 shadow-sm">
                                             {getUserName(lead.assigned_to).charAt(0)}
                                         </div>
                                         <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[100px]">{getUserName(lead.assigned_to)}</span>
                                     </div>
                                 </td>
                                 <td className="p-3 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                                     {formatDate(lead.created_at).split(',')[0]}
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

export default LeadsTable;
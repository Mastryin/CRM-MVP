import React from 'react';
import { Lead, User } from '../types';
import { DEFAULT_STATUSES } from '../constants';
import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';

interface KanbanBoardProps {
  leads: Lead[];
  users: User[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (lead: Lead, newStatus: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, users, onLeadClick, onStatusChange }) => {
    
    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData("leadId", leadId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); 
    };

    const handleDrop = (e: React.DragEvent, statusSlug: string) => {
        const leadId = e.dataTransfer.getData("leadId");
        const lead = leads.find(l => l.id === leadId);
        if (lead && lead.status !== statusSlug) {
            onStatusChange(lead, statusSlug);
        }
    };

    const getUserName = (id?: string) => users.find(u => u.id === id)?.full_name || 'Unassigned';

    return (
        <div className="flex gap-4 overflow-x-auto pb-6 h-full p-1">
            {DEFAULT_STATUSES.map(status => {
                const statusLeads = leads.filter(l => l.status === status.slug);
                return (
                    <div 
                        key={status.slug} 
                        className="min-w-[280px] w-[280px] flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-xl h-full border border-slate-200/60 dark:border-slate-700/60"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status.slug)}
                    >
                        {/* Header */}
                        <div className="p-3 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ring-2 ring-opacity-20`} style={{ backgroundColor: status.color, '--tw-ring-color': status.color } as any}></span>
                                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{status.label}</h3>
                            </div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{statusLeads.length}</span>
                        </div>

                        {/* Drop Zone */}
                        <div className="p-2 flex-1 overflow-y-auto space-y-2">
                            {statusLeads.map(lead => (
                                <div 
                                    key={lead.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, lead.id)}
                                    onClick={() => onLeadClick(lead)}
                                    className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 transition-all group active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-tight">{lead.full_name}</div>
                                        {lead.rejection_reason && (
                                            <div className="text-red-500 dark:text-red-400" title="Rejected">
                                                <AlertCircle size={14} />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">{lead.email}</div>
                                    
                                    {lead.rejection_reason && (
                                        <div className="text-[10px] bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-1.5 rounded mb-2 line-clamp-2 border border-red-100 dark:border-red-800">
                                            "{lead.rejection_reason}"
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {lead.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded border border-slate-100 dark:border-slate-600">{tag}</span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 dark:border-slate-700">
                                         <div className="flex items-center gap-1.5">
                                             <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-white dark:border-slate-600">
                                                 {getUserName(lead.assigned_to).charAt(0)}
                                             </div>
                                             <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[80px]">{getUserName(lead.assigned_to).split(' ')[0]}</span>
                                         </div>
                                         <div className="text-[10px] text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors">
                                             {new Date(lead.created_at).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                         </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default KanbanBoard;
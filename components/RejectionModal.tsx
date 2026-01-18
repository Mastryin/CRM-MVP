import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Lead } from '../types';

interface RejectionModalProps {
    lead: Lead;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
}

const RejectionModal: React.FC<RejectionModalProps> = ({ lead, onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;
        onConfirm(reason);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                        <AlertTriangle size={20} />
                        <h3 className="font-bold text-lg">Reject Lead</h3>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        You are rejecting <strong>{lead.full_name}</strong>. Please provide a mandatory reason for this action. This will be saved in notes.
                    </p>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">Rejection Reason</label>
                        <textarea 
                            required 
                            rows={4} 
                            value={reason} 
                            onChange={e => setReason(e.target.value)} 
                            className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" 
                            placeholder="e.g. Budget constraints, Not interested in design..." 
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-sm font-medium">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium shadow-sm">Confirm Rejection</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RejectionModal;
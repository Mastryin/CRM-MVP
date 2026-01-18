import React, { useState, useEffect } from 'react';
import { Lead, EmailTemplate, WhatsAppTemplate } from '../types';
import { getEmailTemplates, getWhatsAppTemplates } from '../services/mockDb';
import { replaceVariables } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { Mail, MessageCircle, AlertTriangle } from 'lucide-react';

interface StatusAutomationModalProps {
    lead: Lead;
    newStatusSlug: string;
    triggerType?: string;
    onConfirm: (sendAutomation: boolean, emailBody?: string) => void;
    onCancel: () => void;
}

const StatusAutomationModal: React.FC<StatusAutomationModalProps> = ({ lead, newStatusSlug, onConfirm, onCancel }) => {
    const { user } = useAuth();
    const [emailTemplate, setEmailTemplate] = useState<EmailTemplate | null>(null);
    const [whatsappTemplate, setWhatsappTemplate] = useState<WhatsAppTemplate | null>(null);
    const [emailBody, setEmailBody] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    
    useEffect(() => {
        const eTpl = getEmailTemplates().find(t => t.status_trigger === newStatusSlug && t.is_active);
        const wTpl = getWhatsAppTemplates().find(t => t.status_trigger === newStatusSlug && t.is_active);
        
        if (eTpl) {
            setEmailTemplate(eTpl);
            setEmailSubject(replaceVariables(eTpl.subject, lead, user?.full_name || 'Team'));
            setEmailBody(replaceVariables(eTpl.body, lead, user?.full_name || 'Team'));
        }
        if (wTpl) {
            setWhatsappTemplate(wTpl);
        }
    }, [newStatusSlug, lead, user]);

    // If no automation configured, skip modal (or could show generic confirmation)
    // For now, if no templates, we auto-confirm silently or show basic move confirmation?
    // PRD says: "If no template assigned, automation modal shows 'No email configured'"
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Status Change Automation</h3>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">&times;</button>
                </div>
                
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-blue-800 dark:text-blue-200 text-sm font-medium">
                        Moving <strong>{lead.full_name}</strong> to <span className="uppercase">{newStatusSlug.replace('_', ' ')}</span>
                    </div>

                    {/* Email Preview */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-200 font-semibold">
                            <Mail size={18} /> Email Preview
                        </div>
                        {emailTemplate ? (
                            <div className="space-y-3">
                                <div className="text-sm dark:text-slate-300">
                                    <span className="text-slate-500 dark:text-slate-400">Subject:</span> <span className="font-medium">{emailSubject}</span>
                                </div>
                                <textarea 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm font-mono bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white min-h-[150px] outline-none focus:ring-2 focus:ring-blue-500"
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400">You can edit the email body before sending.</p>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic py-2">No email template configured for this status.</div>
                        )}
                    </div>

                    {/* WhatsApp Preview */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                         <div className="flex items-center gap-2 mb-3 text-green-700 dark:text-green-400 font-semibold">
                            <MessageCircle size={18} /> WhatsApp Preview (Read-Only)
                        </div>
                        {whatsappTemplate ? (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800 text-sm whitespace-pre-wrap dark:text-slate-200">
                                {replaceVariables(whatsappTemplate.template_preview, lead, user?.full_name || 'Team')}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic py-2">No WhatsApp template configured for this status.</div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <button onClick={() => onConfirm(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm font-medium px-4">
                        Move Silently (No Automation)
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                            Cancel
                        </button>
                        <button 
                            onClick={() => onConfirm(true, emailBody)} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                        >
                            Confirm & Trigger
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusAutomationModal;
import React, { useState } from 'react';
import { X, CreditCard, Calendar } from 'lucide-react';
import { Lead } from '../types';

interface EnrollmentModalProps {
    lead: Lead;
    onConfirm: (paymentDetails: any) => void;
    onCancel: () => void;
}

const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ lead, onConfirm, onCancel }) => {
    const [amount, setAmount] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [mode, setMode] = useState('UPI');
    const [transactionId, setTransactionId] = useState('');
    
    // EMI specific
    const [tenure, setTenure] = useState('3 Months');
    const [monthlyAmount, setMonthlyAmount] = useState('');
    const [nextPaymentDate, setNextPaymentDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Ensure values are parsed correctly
        const parsedAmount = parseFloat(amount);
        
        const details: any = {
            amount: isNaN(parsedAmount) ? 0 : parsedAmount,
            mode,
            transaction_id: transactionId,
            coupon_code: couponCode,
            payment_date: new Date().toISOString()
        };

        if (mode === 'EMI') {
            const parsedMonthly = parseFloat(monthlyAmount);
            details.emi_details = {
                tenure,
                monthly_amount: isNaN(parsedMonthly) ? 0 : parsedMonthly,
                next_payment_date: nextPaymentDate
            };
        }

        onConfirm(details);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
                        <CreditCard size={20} />
                        <h3 className="font-bold text-lg">Enrollment & Payment</h3>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                        Confirming enrollment for <strong>{lead.full_name}</strong>. Please enter payment details.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">Amount (₹)</label>
                            <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="e.g. 45000" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">Coupon Code</label>
                            <input value={couponCode} onChange={e => setCouponCode(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Optional" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">Payment Mode</label>
                            <select value={mode} onChange={e => setMode(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                                <option value="UPI">UPI</option>
                                <option value="Card">Credit/Debit Card</option>
                                <option value="NetBanking">NetBanking</option>
                                <option value="EMI">EMI / Installments</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase">Transaction ID</label>
                            <input required value={transactionId} onChange={e => setTransactionId(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="e.g. TXN123456" />
                        </div>
                    </div>

                    {mode === 'EMI' && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-3 mt-2">
                             <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2">EMI Details</h4>
                             <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tenure</label>
                                <select value={tenure} onChange={e => setTenure(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                    <option>3 Months</option>
                                    <option>6 Months</option>
                                    <option>9 Months</option>
                                    <option>12 Months</option>
                                </select>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                 <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Amount</label>
                                    <input required type="number" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Next Payment</label>
                                    <input required type="date" value={nextPaymentDate} onChange={e => setNextPaymentDate(e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                                 </div>
                             </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700 mt-6">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-sm font-medium">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium shadow-sm">Confirm Payment</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EnrollmentModal;
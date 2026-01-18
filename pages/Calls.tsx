
import React, { useState, useEffect } from 'react';
import { getTrafftAppointments } from '../services/mockDb';
import { TrafftAppointment } from '../types';
import { Phone, Calendar, Clock, Search, ArrowRight, MapPin, User, Video, Filter } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import CallDetailSidebar from '../components/CallDetailSidebar';
import clsx from 'clsx';

const Calls: React.FC = () => {
    const [appointments, setAppointments] = useState<TrafftAppointment[]>([]);
    const [search, setSearch] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState<TrafftAppointment | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        // Load data on mount
        setAppointments(getTrafftAppointments());
    }, []);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'canceled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    const filteredAppointments = appointments.filter(app => {
        const matchesSearch = 
            !search || 
            app.customer.firstName.toLowerCase().includes(search.toLowerCase()) || 
            app.customer.lastName.toLowerCase().includes(search.toLowerCase()) ||
            app.service.name.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || app.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Scheduled Calls</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage appointments synced from Trafft.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="canceled">Canceled</option>
                            <option value="completed">Completed</option>
                        </select>
                        <Filter className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search customer or service..." 
                            className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/50 z-10">
                            <tr className="text-slate-500 dark:text-slate-400 text-xs font-semibold tracking-wide border-b border-slate-200 dark:border-slate-700 uppercase">
                                <th className="p-4 font-medium">Date & Time</th>
                                <th className="p-4 font-medium">Customer</th>
                                <th className="p-4 font-medium">Service</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Agent</th>
                                <th className="p-4 font-medium">Location</th>
                                <th className="p-4 font-medium w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 dark:text-slate-500">
                                        No appointments found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAppointments.map(app => (
                                    <tr 
                                        key={app.id} 
                                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedAppointment(app)}
                                    >
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(app.startDateTime).split(',')[0]}</span>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <Clock size={12} />
                                                    {formatTime(app.startDateTime)} - {formatTime(app.endDateTime)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                                                    {app.customer.firstName.charAt(0)}{app.customer.lastName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">{app.customer.firstName} {app.customer.lastName}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{app.customer.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-800 dark:text-slate-200 font-medium">{app.service.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{app.duration} min</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={clsx("text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide", getStatusColor(app.status))}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <User size={14} className="text-slate-400" />
                                                {app.employee.firstName}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                {app.location.type === 'online' ? <Video size={14} className="text-blue-500" /> : <MapPin size={14} className="text-slate-400" />}
                                                {app.location.value}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                            <ArrowRight size={18} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedAppointment && (
                <CallDetailSidebar 
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                />
            )}
        </div>
    );
};

export default Calls;

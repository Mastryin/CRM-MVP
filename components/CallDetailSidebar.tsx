
import React from 'react';
import { TrafftAppointment } from '../types';
import { X, Calendar, Clock, MapPin, CreditCard, User, Mail, Phone, Video, Tag, Briefcase, FileText } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import clsx from 'clsx';

interface CallDetailSidebarProps {
  appointment: TrafftAppointment;
  onClose: () => void;
}

const CallDetailSidebar: React.FC<CallDetailSidebarProps> = ({ appointment, onClose }) => {
  const getStatusColor = (status: string) => {
    switch(status) {
        case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'canceled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const formatDateTime = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('en-US', { 
          weekday: 'short', month: 'short', day: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
      });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700 transition-colors">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Appointment Details</h2>
              <span className={clsx("px-2 py-0.5 text-xs rounded-full font-bold uppercase tracking-wide", getStatusColor(appointment.status))}>
                  {appointment.status}
              </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
             <span>ID: #{appointment.id}</span>
             <span>•</span>
             <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(appointment.startDateTime)}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
            <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                  <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Service</div>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{appointment.service.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{appointment.service.description}</div>
                  </div>
                  <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Price</div>
                      <div className="font-bold text-slate-900 dark:text-white">
                          {appointment.service.price === 0 ? 'Free' : `${appointment.service.currency} ${appointment.service.price}`}
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                          <Clock size={14} /> Duration
                      </div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{appointment.duration} min</div>
                  </div>
                  <div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                          <MapPin size={14} /> Location
                      </div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{appointment.location.value}</div>
                  </div>
              </div>

              {appointment.location.meetingUrl && (
                  <div className="pt-2">
                      <a 
                          href={appointment.location.meetingUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                      >
                          <Video size={18} /> Join Meeting
                      </a>
                  </div>
              )}
          </div>

          {/* Customer Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <User size={18} className="text-purple-500" /> Customer Details
              </h3>
              <div className="space-y-3">
                  <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Full Name</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{appointment.customer.firstName} {appointment.customer.lastName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><Mail size={14} /> Email</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{appointment.customer.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><Phone size={14} /> Phone</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{appointment.customer.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Timezone</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{appointment.customer.timeZone}</span>
                  </div>
              </div>
          </div>

          {/* Custom Fields */}
          {appointment.customFields.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <FileText size={18} className="text-blue-500" /> Additional Info
                  </h3>
                  <div className="space-y-3">
                      {appointment.customFields.map(field => (
                          <div key={field.id} className="border-b border-slate-50 dark:border-slate-700 pb-2 last:border-0 last:pb-0">
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{field.label}</div>
                              <div className="text-sm text-slate-800 dark:text-slate-200">{field.value}</div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Notes & Payment Grid */}
          <div className="grid grid-cols-1 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                      <Tag size={18} className="text-amber-500" /> Notes
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                      "{appointment.notes || 'No notes provided.'}"
                  </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <CreditCard size={18} className="text-green-500" /> Payment
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Status:</span>
                      <span className={clsx("font-medium capitalize", appointment.payment.status === 'paid' ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400")}>{appointment.payment.status}</span>
                      
                      <span className="text-slate-500 dark:text-slate-400">Amount:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{appointment.payment.currency} {appointment.payment.amount}</span>
                      
                      {appointment.payment.paymentGateway && (
                          <>
                              <span className="text-slate-500 dark:text-slate-400">Gateway:</span>
                              <span className="font-medium text-slate-900 dark:text-white">{appointment.payment.paymentGateway}</span>
                          </>
                      )}
                  </div>
              </div>
          </div>

          <div className="text-xs text-slate-400 text-center pt-4">
              Source: {appointment.source} • Created: {formatDateTime(appointment.createdAt)}
          </div>
      </div>
    </div>
  );
};

export default CallDetailSidebar;

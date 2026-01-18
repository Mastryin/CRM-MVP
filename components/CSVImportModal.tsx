import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowRight, X, Download } from 'lucide-react';
import { parseCSV, normalizePhone, sanitizeName } from '../utils/helpers';
import { checkDuplicateLead, createLead, mergeLead } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';

interface CSVImportModalProps {
  onClose: () => void;
  onComplete: () => void;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({ onClose, onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importStats, setImportStats] = useState({ created: 0, merged: 0, errors: 0, errorList: [] as string[] });
  const [processing, setProcessing] = useState(false);
  const [batchTags, setBatchTags] = useState('');

  const CRM_FIELDS = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone_raw', label: 'Phone' },
    { value: 'source', label: 'Source' }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      try {
        const rows = await parseCSV(f);
        if (rows.length > 0) {
           setHeaders(rows[0]);
           setCsvData(rows.slice(1));
           // Auto-map
           const initialMapping: Record<string, string> = {};
           rows[0].forEach((header, index) => {
               const h = header.toLowerCase();
               if (h.includes('name')) {
                   if (h.includes('first')) initialMapping[index] = 'first_name';
                   else if (h.includes('last')) initialMapping[index] = 'last_name';
                   else if (h === 'name') initialMapping[index] = 'first_name'; // Fallback
               }
               else if (h.includes('email')) initialMapping[index] = 'email';
               else if (h.includes('phone') || h.includes('mobile')) initialMapping[index] = 'phone_raw';
               else if (h.includes('source')) initialMapping[index] = 'source';
           });
           setMapping(initialMapping);
           setStep(2);
        }
      } catch (err) {
        alert("Failed to parse CSV");
      }
    }
  };

  const handleProcess = async () => {
      setProcessing(true);
      setStep(3);
      
      let created = 0;
      let merged = 0;
      let errors = 0;
      const errorList: string[] = [];
      const tags = batchTags.split(',').map(t => t.trim()).filter(t => t);

      for (let i = 0; i < csvData.length; i++) {
          const row = csvData[i];
          const leadData: any = { tags };
          
          // Apply mapping
          Object.keys(mapping).forEach(colIndex => {
              const field = mapping[colIndex];
              if (field && field !== 'ignore') {
                  leadData[field] = row[parseInt(colIndex)];
              }
          });
          
          // Sanitization
          if (leadData.first_name) leadData.first_name = sanitizeName(leadData.first_name);
          if (leadData.last_name) leadData.last_name = sanitizeName(leadData.last_name);
          
          // Validation
          if (!leadData.first_name || !leadData.phone_raw) {
              errors++;
              errorList.push(`Row ${i + 2}: Missing Name or Phone`);
              continue;
          }

          try {
              // Deduplication
              const { exists, lead: existingLead } = checkDuplicateLead(leadData.phone_raw);
              if (exists && existingLead) {
                  mergeLead(existingLead.id, { ...leadData, source: 'CSV Import' }, user!.id);
                  merged++;
              } else {
                  createLead({ ...leadData, source: 'CSV Import' }, user!.id);
                  created++;
              }
          } catch (e: any) {
              errors++;
              errorList.push(`Row ${i + 2}: ${e.message}`);
          }
      }

      setImportStats({ created, merged, errors, errorList });
      setProcessing(false);
  };

  const downloadErrorLog = () => {
      const csvContent = "data:text/csv;charset=utf-8," + importStats.errorList.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "import_errors.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  const downloadSample = () => {
      const csvContent = "data:text/csv;charset=utf-8," + "First Name,Last Name,Email,Phone,Source\nJohn,Doe,john@example.com,9876543210,Referral";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "sample_leads.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700">
           <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
               <h3 className="font-bold text-lg text-slate-800 dark:text-white">Import Leads from CSV</h3>
               <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" /></button>
           </div>
           
           <div className="p-6 flex-1 overflow-y-auto">
               {step === 1 && (
                   <div className="text-center py-10 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                       <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                       <p className="text-slate-600 dark:text-slate-300 mb-2 font-medium">Drag and drop your CSV file here</p>
                       <p className="text-slate-400 text-sm mb-6">Limit 10MB per file</p>
                       <label className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                           Browse Files
                           <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                       </label>
                       
                       <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
                           <button onClick={downloadSample} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 mx-auto">
                               <FileText size={16} /> Download Sample .csv
                           </button>
                       </div>
                   </div>
               )}

               {step === 2 && (
                   <div>
                       <div className="mb-6">
                           <h4 className="font-semibold mb-2 text-slate-800 dark:text-white">Map Columns</h4>
                           <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Match your CSV headers to CRM fields.</p>
                           <div className="grid grid-cols-2 gap-4">
                               {headers.map((header, idx) => (
                                   <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded border border-slate-100 dark:border-slate-600">
                                       <div className="flex-1 font-medium text-sm truncate dark:text-slate-200" title={header}>{header}</div>
                                       <ArrowRight size={16} className="text-slate-400" />
                                       <select 
                                           className="flex-1 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded p-1 text-sm outline-none focus:border-blue-500"
                                           value={mapping[idx] || ''}
                                           onChange={(e) => setMapping({...mapping, [idx]: e.target.value})}
                                       >
                                           <option value="ignore">Ignore</option>
                                           {CRM_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                       </select>
                                   </div>
                               ))}
                           </div>
                       </div>
                       
                       <div>
                           <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Apply Tags to All</label>
                           <input 
                              placeholder="e.g. jan-cohort, referral (comma separated)" 
                              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded outline-none focus:border-blue-500"
                              value={batchTags}
                              onChange={(e) => setBatchTags(e.target.value)}
                           />
                       </div>
                   </div>
               )}

               {step === 3 && (
                   <div className="text-center">
                       {processing ? (
                           <div className="py-10 dark:text-white">Processing...</div>
                       ) : (
                           <div className="space-y-6">
                               <div className="flex justify-center gap-8">
                                   <div className="text-center">
                                       <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importStats.created}</div>
                                       <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Created</div>
                                   </div>
                                   <div className="text-center">
                                       <div className="text-2xl font-bold text-amber-500 dark:text-amber-400">{importStats.merged}</div>
                                       <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Merged</div>
                                   </div>
                                   <div className="text-center">
                                       <div className="text-2xl font-bold text-red-500 dark:text-red-400">{importStats.errors}</div>
                                       <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Skipped</div>
                                   </div>
                               </div>

                               {importStats.errors > 0 && (
                                   <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded text-left max-h-40 overflow-y-auto">
                                       <div className="flex justify-between items-center mb-2">
                                           <h5 className="font-bold text-red-800 dark:text-red-300 text-sm">Error Log</h5>
                                           <button onClick={downloadErrorLog} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                               <Download size={12} /> Download CSV
                                           </button>
                                       </div>
                                       {importStats.errorList.map((err, i) => (
                                           <div key={i} className="text-xs text-red-600 dark:text-red-400 border-b border-red-100 dark:border-red-900 last:border-0 py-1">{err}</div>
                                       ))}
                                   </div>
                               )}
                           </div>
                       )}
                   </div>
               )}
           </div>

           <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
               {step === 1 && <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300">Cancel</button>}
               {step === 2 && (
                   <>
                       <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-600 dark:text-slate-300">Back</button>
                       <button onClick={handleProcess} className="px-4 py-2 bg-blue-600 text-white rounded">Start Import</button>
                   </>
               )}
               {step === 3 && !processing && (
                   <button onClick={() => { onComplete(); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded">Done</button>
               )}
           </div>
       </div>
    </div>
  );
};

export default CSVImportModal;
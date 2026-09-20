import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Check } from 'lucide-react';
import { api } from '../../services/api';
import { LeadImportRecord } from '../../types';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<LeadImportRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const sampleCsv = `customerName,phone,email,companyName,productInterests,priority,leadValue,location
Sunil Narang,+91 98111 22334,sunil@narangauto.com,Narang Automotive Ltd,STP 100 KLD,high,650000,Manesar Haryana
Harish Bajaj,+91 98222 33445,harish@bajajtextiles.in,Bajaj Textiles Ltd,ETP 25 KLD,medium,850000,Surat Gujarat
Meenakshi Sundaram,+91 98333 44556,m.sundaram@chennaipumps.com,Chennai Precision Fab,Industrial RO Plant,high,500000,Ambattur Chennai`;

    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'om_jyoti_leads_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length <= 1) {
          setError('CSV file appears empty or missing headers');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const rowObj: any = {};
          headers.forEach((h, idx) => {
            rowObj[h] = vals[idx] || '';
          });
          if (rowObj.customerName || rowObj.phone) {
            rows.push(rowObj);
          }
        }

        setParsedLeads(rows);
        setError(null);
      } catch (err: any) {
        setError('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(f);
  };

  const handleImportSubmit = async () => {
    if (parsedLeads.length === 0) {
      setError('Please select and parse a valid CSV file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const res = await api.importLeads({
        leads: parsedLeads,
        filename: file?.name || 'batch_import.csv',
        assignmentMethod: { team_lead_id: 'usr-lead-1' }
      });
      setImportResult(res.import_record);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Import processing error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900">Bulk Import Leads (CSV / Excel)</h2>
            <p className="text-xs text-gray-500">Import hundreds of industrial leads with automatic phone deduplication</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {importResult ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Import Completed Successfully!</h3>
              <p className="text-xs text-gray-600">
                <strong className="text-emerald-700 font-bold">{importResult.successCount} leads</strong> imported successfully to North Sales Team pipeline.
                {importResult.errorCount > 0 && (
                  <span className="text-amber-700 block mt-1">
                    {importResult.errorCount} rows skipped due to duplicate phone numbers or formatting errors.
                  </span>
                )}
              </p>

              {importResult.errorDetails.length > 0 && (
                <div className="text-left bg-gray-50 p-3 rounded-lg border border-gray-200 text-[11px] max-h-36 overflow-y-auto space-y-1">
                  <span className="font-bold text-gray-700">Skipped Entries:</span>
                  {importResult.errorDetails.map((err, i) => (
                    <div key={i} className="text-gray-600">
                      Row {err.row}: {err.phone} — {err.error}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold"
              >
                Close & View Leads
              </button>
            </div>
          ) : (
            <>
              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-gray-200 hover:border-[#00288e] rounded-2xl p-8 text-center bg-gray-50/50 transition-colors">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#00288e] flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#00288e] hover:underline">Click to upload CSV</span>
                    <span className="text-xs text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Standard CSV format with phone, name, email & company</p>
                </label>

                {file && (
                  <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-[#00288e] rounded-lg text-xs font-semibold border border-blue-200">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{file.name} ({parsedLeads.length} leads detected)</span>
                  </div>
                )}
              </div>

              {/* Sample Template Helper */}
              <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                <span className="text-gray-700">Need the standard column format?</span>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-xs font-bold text-[#00288e] hover:underline flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </button>
              </div>

              {/* Preview Table if leads parsed */}
              {parsedLeads.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>Parsed Preview ({parsedLeads.length} records)</span>
                    <span className="text-[11px] text-gray-400">Assigned to: North Sales Team</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-40">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="py-2 px-3">Customer</th>
                          <th className="py-2 px-3">Phone</th>
                          <th className="py-2 px-3">Company</th>
                          <th className="py-2 px-3">Product</th>
                          <th className="py-2 px-3">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedLeads.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-3 font-semibold">{row.customerName}</td>
                            <td className="py-1.5 px-3 text-gray-500">{row.phone}</td>
                            <td className="py-1.5 px-3 text-gray-600">{row.companyName}</td>
                            <td className="py-1.5 px-3 text-gray-600">{row.productInterests}</td>
                            <td className="py-1.5 px-3 font-bold text-gray-900">₹{row.leadValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!importResult && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              disabled={parsedLeads.length === 0 || isProcessing}
              onClick={handleImportSubmit}
              className="px-5 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isProcessing ? 'Validating & Importing...' : `Import ${parsedLeads.length} Leads`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

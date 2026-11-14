import React, { useState, useEffect } from 'react';
import { CheckCircle2, PauseCircle, XCircle, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { PipelineLeadDetailView } from './PipelineLeadDetailView';

const formatINR = (v: number) => '₹' + Number(v || 0).toLocaleString('en-IN');
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const DOC_LABELS: Record<string, string> = {
  advance_payment_proof: 'Advance Payment Proof',
  po_or_contract: 'PO / Agreed Contract',
  kyc_pan: 'KYC — PAN',
  kyc_aadhaar: 'KYC — Aadhaar',
  kyc_gst: 'KYC — GST Certificate',
  other: 'Other'
};

// Screen 14 — Approver queue & review: separates order submission from approval
// and enforces the hold/approve/reject loop (FR-O3..O5).
export const ApproverQueueView: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'punched' | 'on_hold' | 'approved' | 'rejected' | 'all'>('punched');
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [holdReasons, setHoldReasons] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getPipelineOrders(statusFilter !== 'all' ? statusFilter : undefined);
      setOrders(res.orders);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const review = async (orderId: string, decision: 'approve' | 'hold' | 'reject') => {
    if (decision !== 'approve' && !holdReasons[orderId]?.trim()) {
      alert('A reason is required');
      return;
    }
    try {
      await api.reviewOrder(orderId, decision, holdReasons[orderId]);
      setHoldReasons(prev => ({ ...prev, [orderId]: '' }));
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to record review');
    }
  };

  if (selectedLeadId) {
    return <PipelineLeadDetailView leadId={selectedLeadId} onBack={() => { setSelectedLeadId(null); load(); }} />;
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Approver Queue</h1>
        <p className="text-xs text-gray-500 mt-0.5">Review punched orders — approve, put On Hold with a reason, or reject (service orders only).</p>
      </div>

      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
        {[
          { id: 'punched', label: 'Pending Review' },
          { id: 'on_hold', label: 'On Hold' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'all', label: 'All' }
        ].map(t => (
          <button key={t.id} onClick={() => setStatusFilter(t.id as any)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${statusFilter === t.id ? 'bg-[#00288e] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}>{t.label}</button>
        ))}
      </div>

      <div className="space-y-3">
        {loading && <p className="text-xs text-gray-400 text-center py-8">Loading...</p>}
        {!loading && orders.length === 0 && <p className="text-xs text-gray-400 text-center py-10">No orders in this queue.</p>}
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="cursor-pointer" onClick={() => setSelectedLeadId(order.leadId)}>
                <p className="font-mono text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded inline-block">{order.leadNumber}</p>
                <h3 className="font-bold text-sm text-gray-900 mt-1 hover:underline">{order.customerName}</h3>
                <p className="text-xs text-gray-500">{order.division} · {order.leadType === 'service' ? 'Service Order' : 'New Sales Order'} · ETD: {fmtDate(order.etd)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${order.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : order.status === 'rejected' ? 'bg-red-100 text-red-800' : order.status === 'on_hold' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{order.status.replace('_', ' ')}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {order.documents.map((d: any) => (
                <span key={d.id} className="flex items-center space-x-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-600">
                  <FileText className="w-3 h-3" /><span>{DOC_LABELS[d.type] || d.type}</span>
                </span>
              ))}
            </div>

            {order.holdReason && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">On Hold reason: {order.holdReason}</p>}
            {order.rejectReason && <p className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg p-2">Reject reason: {order.rejectReason}</p>}
            {order.orderNumber && <p className="text-xs text-gray-600">Order Number: <strong className="font-mono">{order.orderNumber}</strong></p>}

            {order.status === 'punched' && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <input
                  value={holdReasons[order.id] || ''}
                  onChange={e => setHoldReasons(prev => ({ ...prev, [order.id]: e.target.value }))}
                  placeholder="Reason (required for On Hold / Reject)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
                <div className="flex items-center space-x-2">
                  <button onClick={() => review(order.id, 'approve')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"><CheckCircle2 className="w-3.5 h-3.5" /><span>Approve</span></button>
                  <button onClick={() => review(order.id, 'hold')} className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5"><PauseCircle className="w-3.5 h-3.5" /><span>Put On Hold</span></button>
                  {order.leadType === 'service' && <button onClick={() => review(order.id, 'reject')} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5"><XCircle className="w-3.5 h-3.5" /><span>Reject</span></button>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

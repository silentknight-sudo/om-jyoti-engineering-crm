import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Search, X, AlertCircle, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { Expense, ExpenseCategory, ExpensePaymentMode } from '../../types';

const formatINR = (val: number) => '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fuel: 'Fuel',
  travel: 'Travel',
  office_supplies: 'Office Supplies',
  salaries: 'Salaries',
  rent: 'Rent',
  utilities: 'Utilities',
  equipment_repair: 'Equipment Repair',
  chemicals: 'Chemicals & Consumables',
  transport: 'Transport',
  other: 'Other'
};

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.getExpenses({ category: categoryFilter !== 'all' ? categoryFilter : undefined, search: search || undefined });
      setExpenses(res.expenses);
      setTotalAmount(res.totalAmount);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, [search, categoryFilter]);

  const removeExpense = async (id: string) => {
    if (!confirm('Delete this expense entry?')) return;
    try {
      await api.deleteExpense(id);
      fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Expenses</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track fuel, chemicals, site travel, salaries and other operational expenses.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5">
          <Plus className="w-3.5 h-3.5" /><span>+ Add Expense</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase font-semibold">Total Expenses (filtered)</p>
            <p className="text-xl font-bold text-gray-900">{formatINR(totalAmount)}</p>
          </div>
        </div>
        <span className="text-xs text-gray-500">{expenses.length} entries</span>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 w-full sm:w-auto">
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-semibold">
            <tr>
              <th className="py-2.5 px-4">Expense #</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 px-4">Description</th>
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Mode</th>
              <th className="py-2.5 px-4 text-right">Amount</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>}
            {!loading && expenses.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-gray-400">No expenses recorded yet.</td></tr>}
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 font-mono font-bold text-gray-800">{e.expenseNumber}</td>
                <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-medium text-[11px]">{CATEGORY_LABELS[e.category]}</span></td>
                <td className="py-2.5 px-4 text-gray-700">{e.description}</td>
                <td className="py-2.5 px-4 text-gray-500">{fmtDate(e.expenseDate)}</td>
                <td className="py-2.5 px-4 capitalize text-gray-600">{e.paymentMode.replace('_', ' ')}</td>
                <td className="py-2.5 px-4 text-right font-bold text-gray-900">{formatINR(e.amount)}</td>
                <td className="py-2.5 px-4 text-right">
                  <button onClick={() => removeExpense(e.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && <AddExpenseModal onClose={() => setCreateOpen(false)} onSuccess={() => { setCreateOpen(false); fetchExpenses(); }} />}
    </div>
  );
};

const AddExpenseModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<ExpensePaymentMode>('cash');
  const [vendorName, setVendorName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!description.trim() || !amount || Number(amount) <= 0) { setError('Description and a valid amount are required'); return; }
    setSaving(true);
    try {
      await api.createExpense({ category, description, amount: Number(amount), expenseDate, paymentMode, vendorName, referenceNumber });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-base font-bold text-gray-900">Add Expense</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span></div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹) *</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Diesel for service vehicle" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
              <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Mode</label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as ExpensePaymentMode)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Vendor / Paid To</label>
              <input value={vendorName} onChange={e => setVendorName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reference Number</label>
              <input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">{saving ? 'Saving...' : 'Save Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

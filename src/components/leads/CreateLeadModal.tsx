import React, { useState } from 'react';
import { X, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { LeadPriority, LeadSource } from '../../types';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [leadValue, setLeadValue] = useState('500000');
  const [priority, setPriority] = useState<LeadPriority>('medium');
  const [leadSource, setLeadSource] = useState<LeadSource>('website');
  const [location, setLocation] = useState('Noida, UP');
  const [industryType, setIndustryType] = useState('Manufacturing & Engineering');
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['Sewage Treatment Plant (STP)']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const productOptions = [
    'Sewage Treatment Plant (STP)',
    'Industrial RO Plant',
    'Effluent Treatment Plant (ETP)',
    'High Pressure Industrial Pumps',
    'Toray RO Membranes (8040)',
    'Actuated Butterfly Valves',
    'Automatic Chemical Dosing System',
    'Spares & Filter Media'
  ];

  const toggleProduct = (prod: string) => {
    setSelectedProducts(prev =>
      prev.includes(prod) ? prev.filter(p => p !== prod) : [...prev, prod]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerName.trim() || !phone.trim()) {
      setError('Customer name and phone number are required');
      return;
    }

    setLoading(true);
    try {
      await api.createLead({
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        companyName: companyName.trim() || 'Individual Client',
        productInterests: selectedProducts.length > 0 ? selectedProducts : ['Water Treatment'],
        leadSource,
        priority,
        leadValue: Number(leadValue) || 0,
        location: location.trim(),
        industryType: industryType.trim(),
        customerNotes: customerNotes.trim()
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900">Create New Engineering Lead</h2>
            <p className="text-xs text-gray-500">Capture new client inquiry or site requirement</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Customer / Contact Person *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="rajesh@company.com"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Industries Ltd."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Estimated Lead Value (₹ INR)
              </label>
              <input
                type="number"
                value={leadValue}
                onChange={e => setLeadValue(e.target.value)}
                placeholder="500000"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as LeadPriority)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#00288e]"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Project Location
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Sector 62, Noida, UP"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Lead Source
              </label>
              <select
                value={leadSource}
                onChange={e => setLeadSource(e.target.value as LeadSource)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#00288e]"
              >
                <option value="website">Website Form</option>
                <option value="cold_call">Cold Call</option>
                <option value="referral">Referral</option>
                <option value="event">Trade Expo / Event</option>
                <option value="email">Direct Email</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Product Chips */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Products of Interest
            </label>
            <div className="flex flex-wrap gap-2">
              {productOptions.map(prod => {
                const isSelected = selectedProducts.includes(prod);
                return (
                  <button
                    key={prod}
                    type="button"
                    onClick={() => toggleProduct(prod)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-[#00288e] border-[#00288e] font-semibold'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {prod}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Customer Site / Requirement Notes
            </label>
            <textarea
              rows={3}
              value={customerNotes}
              onChange={e => setCustomerNotes(e.target.value)}
              placeholder="e.g. Requires turnkey 100 KLD MBBR STP with underground tank layout..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00288e]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

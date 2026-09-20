import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  ArrowUpDown,
  Truck,
  Layers,
  CheckCircle2,
  X,
  History,
  Boxes,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Product, LowStockAlert, Supplier, InventoryMovement, MovementType } from '../../types';

export const InventoryView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'alerts' | 'suppliers' | 'movements'>('products');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Stock Adjustment Modal State
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('purchase');
  const [quantityChange, setQuantityChange] = useState('1');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Add Product Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Water Treatment');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [newReorderLevel, setNewReorderLevel] = useState('2');
  const [newInitialStock, setNewInitialStock] = useState('2');
  const [newDescription, setNewDescription] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, alertRes, supRes, movRes] = await Promise.all([
        api.getProducts({ category: categoryFilter !== 'all' ? categoryFilter : undefined, search: search || undefined }),
        api.getLowStockAlerts(),
        api.getSuppliers(),
        api.getInventoryMovements()
      ]);
      setProducts(prodRes.products);
      setAlerts(alertRes.alerts);
      setSuppliers(supRes.suppliers);
      setMovements(movRes.movements);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter, search]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    setAdjustLoading(true);
    try {
      const qty = movementType === 'sale' || movementType === 'damage' ? -Math.abs(Number(quantityChange)) : Math.abs(Number(quantityChange));
      await api.adjustStock(adjustProduct.id, {
        movement_type: movementType,
        quantity_change: qty,
        notes: adjustNotes.trim() || `Manual stock adjustment (${movementType})`
      });
      setAdjustProduct(null);
      setQuantityChange('1');
      setAdjustNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newSku.trim() || !newName.trim() || !newCostPrice || !newSellingPrice) {
      setAddError('SKU, product name, cost price, and selling price are required');
      return;
    }

    try {
      await api.createProduct({
        sku: newSku.trim(),
        name: newName.trim(),
        category: newCategory,
        costPrice: Number(newCostPrice),
        sellingPrice: Number(newSellingPrice),
        reorderLevel: Number(newReorderLevel),
        initialStock: Number(newInitialStock),
        description: newDescription.trim()
      });
      setAddModalOpen(false);
      // Reset form
      setNewSku('');
      setNewName('');
      setNewCostPrice('');
      setNewSellingPrice('');
      fetchData();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add product');
    }
  };

  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Inventory & Engineering Spares</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track stock on hand, RO membranes, pump inventory, reorder triggers, and supplier orders.
          </p>
        </div>

        {hasPermission('inventory:all') && (
          <button
            id="add-product-btn"
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add New Product</span>
          </button>
        )}
      </div>

      {/* Low Stock Warning Banner if any */}
      {alerts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                {alerts.length} Products at or below Reorder Level
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {alerts.map(a => `${a.productName} (Qty: ${a.quantityOnHand})`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('alerts')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 ml-3"
          >
            Manage Alerts
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
        {[
          { id: 'products', label: 'All Equipment & Spares', count: products.length },
          { id: 'alerts', label: 'Low Stock Alerts', count: alerts.length, alert: alerts.length > 0 },
          { id: 'suppliers', label: 'Suppliers & OEMs', count: suppliers.length },
          { id: 'movements', label: 'Stock Movement Logs', count: movements.length }
        ].map(tab => (
          <button
            key={tab.id}
            id={`tab-inventory-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'bg-[#00288e] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === tab.id
                ? 'bg-white/20 text-white'
                : tab.alert ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-gray-200 text-gray-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 1. PRODUCTS CATALOG TAB */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Category filter */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search equipment by SKU, name, or category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 w-full sm:w-auto"
            >
              <option value="all">All Categories</option>
              <option value="Water Treatment">Water Treatment</option>
              <option value="Industrial Systems">Industrial Systems</option>
              <option value="Pumps & Motors">Pumps & Motors</option>
              <option value="Spares & Consumables">Spares & Consumables</option>
              <option value="Valves & Automation">Valves & Automation</option>
            </select>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">SKU & Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Cost / Selling</th>
                    <th className="py-3 px-4">Stock on Hand</th>
                    <th className="py-3 px-4">Available</th>
                    <th className="py-3 px-4">Reorder Level</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {products.map(prod => {
                    const isLowStock = prod.quantityOnHand <= prod.reorderLevel;
                    return (
                      <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {prod.sku}
                          </span>
                          <p className="font-bold text-gray-900 mt-1">{prod.name}</p>
                          <p className="text-[11px] text-gray-500 line-clamp-1">{prod.description}</p>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-medium text-[11px]">
                            {prod.category}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 block">{formatINR(prod.sellingPrice)}</span>
                          <span className="text-[10px] text-gray-400">Cost: {formatINR(prod.costPrice)}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`font-bold text-sm ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {prod.quantityOnHand} {prod.unitOfMeasure}
                          </span>
                          {isLowStock && (
                            <span className="block text-[10px] font-bold text-red-500 uppercase">
                              Low Stock Alert
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-semibold text-emerald-700">
                          {prod.quantityAvailable} {prod.unitOfMeasure}
                        </td>

                        <td className="py-3 px-4 text-gray-600 font-medium">
                          {prod.reorderLevel} {prod.unitOfMeasure}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            id={`adjust-stock-btn-${prod.id}`}
                            onClick={() => {
                              setAdjustProduct(prod);
                              setMovementType('purchase');
                              setQuantityChange('1');
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00288e] rounded-lg text-xs font-semibold flex items-center space-x-1 ml-auto"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span>Adjust Stock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOW STOCK ALERTS TAB */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-white p-5 rounded-xl border border-red-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold uppercase rounded">
                      {alert.severity} Severity Alert
                    </span>
                    <h3 className="font-bold text-sm text-gray-900 mt-2">{alert.productName}</h3>
                    <p className="font-mono text-xs text-gray-400">{alert.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-red-600">{alert.quantityOnHand}</span>
                    <span className="text-xs text-gray-400 block">Min Threshold: {alert.reorderLevel}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Automated OEM notification triggered</span>
                  <button
                    onClick={() => {
                      const prod = products.find(p => p.id === alert.productId);
                      if (prod) {
                        setAdjustProduct(prod);
                        setMovementType('purchase');
                        setQuantityChange('5');
                      }
                    }}
                    className="px-3 py-1.5 bg-[#00288e] text-white rounded-lg text-xs font-semibold"
                  >
                    Receive Stock (PO)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map(sup => (
            <div key={sup.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00288e] flex items-center justify-center font-bold text-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{sup.name}</h3>
                  <p className="text-xs text-gray-500">Contact: {sup.contactPerson}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                <p>Email: <a href={`mailto:${sup.email}`} className="text-[#00288e]">{sup.email}</a></p>
                <p>Phone: {sup.phone}</p>
                <p>Location: {sup.city}, {sup.state}</p>
                <p>Terms: <strong className="text-gray-800">{sup.paymentTerms}</strong> ({sup.leadTimeDays}d lead time)</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. STOCK MOVEMENTS TAB */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">Inventory Movement Audit Trail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Equipment Item</th>
                  <th className="py-2.5 px-4">Movement Type</th>
                  <th className="py-2.5 px-4">Quantity</th>
                  <th className="py-2.5 px-4">Performed By</th>
                  <th className="py-2.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 text-gray-500 font-mono">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-gray-900">{m.productName}</td>
                    <td className="py-2.5 px-4">
                      <span className="capitalize px-2 py-0.5 bg-gray-100 rounded text-[11px] font-semibold">
                        {m.movementType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold">
                      <span className={m.quantityChange > 0 ? 'text-emerald-700' : 'text-red-600'}>
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-700">{m.createdByName}</td>
                    <td className="py-2.5 px-4 text-gray-500">{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Adjust Equipment Stock</h3>
                <p className="text-xs text-gray-500">{adjustProduct.name} ({adjustProduct.sku})</p>
              </div>
              <button onClick={() => setAdjustProduct(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={movementType}
                  onChange={e => setMovementType(e.target.value as MovementType)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                >
                  <option value="purchase">Purchase Receipt (Stock In +)</option>
                  <option value="sale">Project Dispatch / Sale (Stock Out -)</option>
                  <option value="adjustment">Stock Count Audit Adjustment</option>
                  <option value="damage">Damage / Scrap Write-off</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity Units</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantityChange}
                  onChange={e => setQuantityChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reference / PO / Notes</label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Received shipment from Grundfos Chennai..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAdjustProduct(null)}
                  className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-4 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold"
                >
                  {adjustLoading ? 'Logging...' : 'Confirm Stock Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-base font-bold text-gray-900">Add Equipment / Spares Item</h2>
              <button onClick={() => setAddModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={e => setNewSku(e.target.value)}
                    placeholder="e.g. OJ-PUMP-50HP"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                  >
                    <option value="Water Treatment">Water Treatment</option>
                    <option value="Industrial Systems">Industrial Systems</option>
                    <option value="Pumps & Motors">Pumps & Motors</option>
                    <option value="Spares & Consumables">Spares & Consumables</option>
                    <option value="Valves & Automation">Valves & Automation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Chemical Dosing Pump 10 LPH"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cost Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newCostPrice}
                    onChange={e => setNewCostPrice(e.target.value)}
                    placeholder="45000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newSellingPrice}
                    onChange={e => setNewSellingPrice(e.target.value)}
                    placeholder="70000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newInitialStock}
                    onChange={e => setNewInitialStock(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    value={newReorderLevel}
                    onChange={e => setNewReorderLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

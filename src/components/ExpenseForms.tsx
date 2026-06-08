/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, ExpenseCategory, CustomCategory } from '../types';
import { 
  Plus, 
  Layers, 
  HardHat, 
  Truck, 
  Camera, 
  Calendar,
  X,
  Wrench,
  Droplet,
  Zap,
  Hammer,
  Trash2,
  FolderOpen
} from 'lucide-react';
import ReceiptCapture from './ReceiptCapture';
import CalculatorInput from './CalculatorInput';

interface ExpenseFormsProps {
  project: Project | null;
  onAddExpense: (expense: any) => void;
  onUpdateProject?: (project: Project) => void;
}

export default function ExpenseForms({ project, onAddExpense, onUpdateProject }: ExpenseFormsProps) {
  const [activeCategory, setActiveCategory] = useState<ExpenseCategory>('material');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);

  // Custom visual banner notifications to bypass blocked window.alert calls
  const [banner, setBanner] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  // Material Stock Inventory Management States
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [isRegisteringStock, setIsRegisteringStock] = useState<boolean>(false);
  const [newStockName, setNewStockName] = useState('');
  const [newStockUnit, setNewStockUnit] = useState('bags');
  const [newStockInitial, setNewStockInitial] = useState<number | ''>('');

  // Re-ordering Existing Stock states
  const [restockStockId, setRestockStockId] = useState<string | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number | ''>('');
  const [restockCostPerUnit, setRestockCostPerUnit] = useState<number | ''>('');

  // Symmetrical Inline Dynamic Stock Editing & Warning-Controlled Deletion States
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockName, setEditingStockName] = useState<string>('');
  const [editingStockUnit, setEditingStockUnit] = useState<string>('');
  const [editingStockAvailable, setEditingStockAvailable] = useState<number | ''>('');
  const [editingStockTotalOrdered, setEditingStockTotalOrdered] = useState<number | ''>('');

  const handleDeleteStock = (stockId: string) => {
    const stockItem = (project.materialStocks || []).find(s => s.id === stockId);
    const stockName = stockItem ? stockItem.name : 'this item';
    
    if (confirm(`⚠️ WARNING: Are you sure you want to permanently delete the stock balance tracker for "${stockName}"? Deleting this tracker will NOT remove previous voucher ledger logs, but current available on-site quantities will be discarded.`)) {
      const updated = (project.materialStocks || []).filter(s => s.id !== stockId);
      if (onUpdateProject) {
        onUpdateProject({
          ...project,
          materialStocks: updated
        });
      }
      triggerBanner('success', `Stock tracker "${stockName}" deleted.`);
      if (editingStockId === stockId) {
        setEditingStockId(null);
      }
    }
  };

  const handleSaveEditStock = () => {
    if (!editingStockName.trim()) {
      triggerBanner('danger', 'Stock item name cannot be empty!');
      return;
    }
    const updated = (project.materialStocks || []).map(s => {
      if (s.id === editingStockId) {
        return {
          ...s,
          name: editingStockName.trim(),
          unit: editingStockUnit.trim() || 'units',
          availableStock: Number(editingStockAvailable) || 0,
          totalOrdered: Number(editingStockTotalOrdered) || Number(editingStockAvailable) || 0
        };
      }
      return s;
    });

    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        materialStocks: updated
      });
    }

    triggerBanner('success', 'On-site stock configurations updated.');
    setEditingStockId(null);
  };

  // Custom Category Creation State
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('FolderOpen');
  const [enableStockTracking, setEnableStockTracking] = useState(false);
  const [pendingDeleteCat, setPendingDeleteCat] = useState<{ id: string, name: string } | null>(null);

  // Materials Form State
  const [materialName, setMaterialName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('bags');
  const [costPerUnit, setCostPerUnit] = useState<number | ''>('');
  const [materialSupplier, setMaterialSupplier] = useState('');
  const [materialUnitText, setMaterialUnitText] = useState('');

  // Labour Form State
  const [workerName, setWorkerName] = useState('');
  const [labourCategory, setLabourCategory] = useState('helper');
  const [numWorkers, setNumWorkers] = useState<number | ''>(1);
  const [dailyWage, setDailyWage] = useState<number | ''>('');

  // Transportation Form State
  const [vehicleType, setVehicleType] = useState('truck');
  const [transportDescription, setTransportDescription] = useState('');
  const [transportCost, setTransportCost] = useState<number | ''>('');

  // Custom Tab / Dynamic Category State
  const [customItemName, setCustomItemName] = useState('');
  const [customQuantity, setCustomQuantity] = useState<number | ''>('');
  const [customUnit, setCustomUnit] = useState('pcs');
  const [customUnitText, setCustomUnitText] = useState('');
  const [customCostPerUnit, setCustomCostPerUnit] = useState<number | ''>('');
  const [customSupplier, setCustomSupplier] = useState('');

  const triggerBanner = (type: 'success' | 'danger', message: string) => {
    setBanner({ type, message });
    setTimeout(() => {
      setBanner(null);
    }, 4500);
  };

  if (!project) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-6 rounded-3xl text-center">
        <HardHat className="w-10 h-10 text-orange-500 mx-auto mb-2 animate-bounce" />
        <h3 className="font-bold text-slate-800 dark:text-slate-100">No Active Construction Project</h3>
        <p className="text-xs text-slate-400 mt-1">Please select an active site or create a new project in the "Locations" tab first.</p>
      </div>
    );
  }

  const handleResetForm = () => {
    setNotes('');
    setReceiptImage(undefined);
    // Materials
    setMaterialName('');
    setQuantity('');
    setCostPerUnit('');
    setMaterialSupplier('');
    setMaterialUnitText('');
    setUnit('bags');
    // Labour
    setWorkerName('');
    setLabourCategory('helper');
    setNumWorkers(1);
    setDailyWage('');
    // Transport
    setVehicleType('truck');
    setTransportDescription('');
    setTransportCost('');
    // Custom
    setCustomItemName('');
    setCustomQuantity('');
    setCustomUnit('pcs');
    setCustomUnitText('');
    setCustomCostPerUnit('');
    setCustomSupplier('');
    // Stock Reset
    setSelectedStockId('');
    setIsRegisteringStock(false);
  };

  const handleCreateCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newId = `cat-${Date.now()}`;
    const newCategory: CustomCategory = {
      id: newId,
      name: newCatName.trim(),
      iconName: newCatIcon,
      enableStockTracking: enableStockTracking
    };

    const updatedProject: Project = {
      ...project,
      customCategories: [...(project.customCategories || []), newCategory]
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }

    setActiveCategory(newId);
    setNewCatName('');
    setEnableStockTracking(false);
    setShowCatModal(false);
    triggerBanner('success', `Dynamic tab "${newCategory.name}" created successfully!`);
  };

  const handleDeleteCustomCategory = (catId: string, catName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setPendingDeleteCat({ id: catId, name: catName });
  };

  // Restock handler - "If I order additional stock and add to already stock I have"
  const handleAddNewRestock = (stockId: string, addQty: number, cPerUnit: number) => {
    if (!addQty || addQty <= 0) {
      triggerBanner('danger', 'Please enter a valid stock quantity to receive.');
      return;
    }

    const matchedStock = (project.materialStocks || []).find(s => s.id === stockId);
    if (!matchedStock) return;

    // 1. Update project stocks
    const updatedStocks = (project.materialStocks || []).map(st => {
      if (st.id === stockId) {
        return {
          ...st,
          availableStock: st.availableStock + addQty,
          totalOrdered: (st.totalOrdered || 0) + addQty
        };
      }
      return st;
    });

    const updatedProj = {
      ...project,
      materialStocks: updatedStocks
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProj);
    }

    // 2. Generate a material receipt expense so they keep track of of the spend!
    const restockNotes = `Restocked additional payload: +${addQty} ${matchedStock.unit}. Stock received on site.`;
    onAddExpense({
      projectId: project.id,
      date,
      notes: restockNotes,
      category: 'material',
      materialName: `${matchedStock.name} [Order Stock Receipt]`,
      quantity: addQty,
      unit: matchedStock.unit,
      costPerUnit: cPerUnit,
      totalCost: addQty * cPerUnit,
      supplierName: 'Inventory Bulk Store / Yard',
      stockStatus: 'New Order',
      remainingStock: matchedStock.availableStock + addQty,
    });

    setRestockStockId(null);
    setRestockQuantity('');
    setRestockCostPerUnit('');
    triggerBanner('success', `Added +${addQty} to ${matchedStock.name} stock & logged PKR ${(addQty * cPerUnit).toLocaleString()} purchase!`);
  };

  // Add material to inventory database
  const handleRegisterNewMaterial = (name: string, mUnit: string, initialStock: number) => {
    if (!name.trim()) {
      triggerBanner('danger', 'Please provide a valid material name!');
      return;
    }

    const newStockItem = {
      id: `stock-${Date.now()}`,
      name: name.trim(),
      unit: mUnit,
      availableStock: initialStock || 0,
      totalOrdered: initialStock || 0
    };

    const updatedProj = {
      ...project,
      materialStocks: [...(project.materialStocks || []), newStockItem]
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProj);
    }

    setSelectedStockId(newStockItem.id);
    setMaterialName(newStockItem.name);
    setUnit(newStockItem.unit);
    setIsRegisteringStock(false);
    setNewStockName('');
    setNewStockInitial('');
    triggerBanner('success', `Registered "${newStockItem.name}" to site inventory list.`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseFields = {
      projectId: project.id,
      date,
      notes: notes.trim() || undefined,
      receiptImage,
    };

    if (activeCategory === 'material') {
      let finalMatName = materialName;
      let finalUnit = unit === 'other' ? materialUnitText.trim() : unit;
      let finalQty = Number(quantity);
      let finalPrice = Number(costPerUnit);
      let tStatus: 'Consumed' | undefined = undefined;
      let remStock: number | undefined = undefined;

      // If they selected an inventory stock
      if (selectedStockId) {
        const matched = (project.materialStocks || []).find(s => s.id === selectedStockId);
        if (matched) {
          finalMatName = matched.name;
          finalUnit = matched.unit;
          tStatus = 'Consumed';
          remStock = Math.max(0, matched.availableStock - finalQty);
          
          if (matched.availableStock < finalQty) {
            triggerBanner('danger', `Insufficient stock! ${matched.name} has only ${matched.availableStock} ${matched.unit} available but you requested ${finalQty}.`);
            return;
          }

          // Subtract from inventory stock
          const updatedStocks = (project.materialStocks || []).map(st => {
            if (st.id === selectedStockId) {
              return {
                ...st,
                availableStock: Math.max(0, st.availableStock - finalQty)
              };
            }
            return st;
          });

          if (onUpdateProject) {
            onUpdateProject({
              ...project,
              materialStocks: updatedStocks
            });
          }
        }
      }

      if (!finalMatName.trim() || !finalQty || !finalPrice) {
        triggerBanner('danger', 'Please fill out all required Material fields!');
        return;
      }

      onAddExpense({
        ...baseFields,
        category: 'material',
        materialName: finalMatName.trim(),
        quantity: finalQty,
        unit: finalUnit,
        costPerUnit: finalPrice,
        totalCost: finalQty * finalPrice,
        supplierName: materialSupplier.trim() || undefined,
        stockStatus: tStatus,
        remainingStock: remStock,
      });

    } else if (activeCategory === 'labour') {
      if (!workerName.trim() || !numWorkers || !dailyWage) {
        triggerBanner('danger', 'Please fill out all required Labour fields!');
        return;
      }
      onAddExpense({
        ...baseFields,
        category: 'labour',
        workerName: workerName.trim(),
        labourCategory,
        numWorkers: Number(numWorkers),
        dailyWage: Number(dailyWage),
        totalAmount: Number(numWorkers) * Number(dailyWage),
      });
    } else if (activeCategory === 'transport') {
      if (!vehicleType || !transportCost) {
        triggerBanner('danger', 'Please fill out transport cost!');
        return;
      }
      onAddExpense({
        ...baseFields,
        category: 'transport',
        vehicleType,
        description: transportDescription.trim() || vehicleType,
        cost: Number(transportCost),
      });
    } else {
      // Custom category expense submission
      let finalItemName = customItemName;
      let finalUnit = customUnit === 'other' ? customUnitText.trim() : customUnit;
      let finalQty = Number(customQuantity);
      let finalPrice = Number(customCostPerUnit);
      let tStatus: 'Consumed' | undefined = undefined;
      let remStock: number | undefined = undefined;

      if (activeCustomCat?.enableStockTracking && selectedStockId) {
        const matched = (project.materialStocks || []).find(s => s.id === selectedStockId);
        if (matched) {
          finalItemName = matched.name;
          finalUnit = matched.unit;
          tStatus = 'Consumed';
          remStock = Math.max(0, matched.availableStock - finalQty);

          if (matched.availableStock < finalQty) {
            triggerBanner('danger', `Insufficient stock! ${matched.name} has only ${matched.availableStock} ${matched.unit} available but you requested ${finalQty}.`);
            return;
          }

          const updatedStocks = (project.materialStocks || []).map(st => {
            if (st.id === selectedStockId) {
              return {
                ...st,
                availableStock: Math.max(0, st.availableStock - finalQty)
              };
            }
            return st;
          });

          if (onUpdateProject) {
            onUpdateProject({
              ...project,
              materialStocks: updatedStocks
            });
          }
        }
      }

      if (!finalItemName.trim() || !finalQty || !finalPrice) {
        triggerBanner('danger', 'Please fill out custom item name, quantity, and rate!');
        return;
      }

      onAddExpense({
        ...baseFields,
        category: activeCategory,
        itemName: finalItemName.trim(),
        quantity: finalQty,
        unit: finalUnit,
        costPerUnit: finalPrice,
        totalCost: finalQty * finalPrice,
        supplierName: customSupplier.trim() || undefined,
        stockStatus: tStatus,
        remainingStock: remStock,
      });
    }

    // Success reset
    handleResetForm();
    triggerBanner('success', 'Logged construction site expense successfully!');
  };

  const materialUnits = [
    'bags', 'kg', 'ton', 'brass', 'cubic meters', 'feet', 'cft', 
    'liters', 'meters', 'pieces', 'sq.ft', 'sq.m', 'trips', 'loads', 'hours', 'coils'
  ];
  const labourCategories = [
    'helper', 'mason', 'foreman', 'electrician', 'plumber', 
    'carpenter', 'painter', 'welder', 'bar bender', 'excavator operator', 'guard'
  ];
  const vehicleTypes = [
    'truck', 'tractor trolley', 'dumper', 'concrete mixer', 
    'pickup tanker', 'excavator rental', 'bike courier', 'fuel refilling', 'other transport'
  ];

  const iconOptions = [
    { name: 'Wrench', icon: Wrench },
    { name: 'Droplet', icon: Droplet },
    { name: 'Zap', icon: Zap },
    { name: 'Hammer', icon: Hammer },
    { name: 'FolderOpen', icon: FolderOpen }
  ];

  const currencySymbol = project.currency || '₹';

  // Get Custom category config if active
  const activeCustomCat = (project.customCategories || []).find(c => c.id === activeCategory);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-6">
      {banner && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition-all shadow-sm ${
          banner.type === 'success' 
            ? 'bg-emerald-55 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' 
            : 'bg-rose-55 bg-rose-500/10 text-rose-600 dark:bg-rose-950/30'
        }`}>
          <span>{banner.message}</span>
          <button type="button" onClick={() => setBanner(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-50 font-display">Log Daily Work Expenses</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Select a category below to log construction logs</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 dark:text-white rounded-xl focus:ring-orange-500 font-bold outline-none"
          />
        </div>
      </div>

      {/* Grid of buttons for Categories & Custom Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Tabs</span>
          <button
            type="button"
            onClick={() => setShowCatModal(true)}
            className="text-[11px] font-extrabold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/15 rounded-xl cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Tab
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {/* Static Tabs */}
          {[
            { id: 'material', label: 'Materials', icon: Layers, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
            { id: 'labour', label: 'Labour / Wages', icon: HardHat, color: 'text-orange-500 bg-orange-55 bg-orange-500/5' },
            { id: 'transport', label: 'Transport / Fuel', icon: Truck, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20' },
          ].map((item) => {
            const isActive = activeCategory === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveCategory(item.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-orange-550 dark:border-orange-500 bg-orange-500/5 dark:bg-slate-800 scale-[1.01] shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/40 bg-slate-50/20 dark:bg-slate-900/10'
                }`}
              >
                <span className={`p-2.5 rounded-2xl ${item.color} mb-2`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
              </button>
            );
          })}

          {/* Dynamic User-Customized Tabs */}
          {(project.customCategories || []).map((cat) => {
            const isActive = activeCategory === cat.id;
            
            // Map the saved icon name to Lucide Icon component
            const LucideIcon = iconOptions.find(i => i.name === cat.iconName)?.icon || FolderOpen;

            return (
              <div 
                key={cat.id}
                className="relative group flex"
              >
                <button
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-orange-550 dark:border-orange-500 bg-orange-500/5 dark:bg-slate-800 scale-[1.01] shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/40 bg-slate-50/20 dark:bg-slate-900/10'
                  }`}
                >
                  <span className={`p-2.5 rounded-2xl text-teal-500 bg-teal-50 dark:bg-teal-950/20 mb-2`}>
                    <LucideIcon className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full px-1">{cat.name}</span>
                </button>

                {/* Delete button option */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteCustomCategory(cat.id, cat.name, e)}
                  className="absolute top-1 right-1 p-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-500 text-slate-400 dark:bg-slate-950 dark:hover:bg-rose-950 dark:text-slate-550 rounded-lg transition-all shadow-xs cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100"
                  title="Remove customized tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* PopUp Custom Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-70 animate-fade-in">
          <form 
            onSubmit={handleCreateCustomCategory}
            className="bg-slate-950 border border-slate-800 text-white p-5 rounded-3xl w-full max-w-sm space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-extrabold text-sm tracking-wide uppercase font-display text-orange-500">
                Create Customized Tab
              </h4>
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Tab Category Name *
              </label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Plumbing, Electrical, Steel Works"
                className="w-full text-sm bg-slate-900 border border-slate-850 text-white rounded-xl p-3 focus:ring-orange-500 focus:border-orange-500 outline-none"
                required
                maxLength={20}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Choose Tab Icon Accent
              </label>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map((opt) => {
                  const OptIcon = opt.icon;
                  const isSelected = newCatIcon === opt.name;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setNewCatIcon(opt.name)}
                      className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-orange-600 border-orange-500 text-white' 
                          : 'bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <OptIcon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-850/50 p-3 rounded-2xl select-none">
              <input
                id="enable-stock-tracking-cb"
                type="checkbox"
                checked={enableStockTracking}
                onChange={(e) => setEnableStockTracking(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-orange-600 focus:ring-orange-550 focus:ring-offset-slate-950 bg-slate-950 accent-orange-600 cursor-pointer"
              />
              <label htmlFor="enable-stock-tracking-cb" className="text-[11px] font-bold text-slate-300 cursor-pointer select-none">
                Enable On-Site Stock Balance & Order Tracker
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Add Tab
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Forms switcher */}
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {activeCategory === 'material' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inventory Tracker Select */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                Choose Material Item from Site Inventory *
              </label>
              <select
                value={selectedStockId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__register__') {
                    setIsRegisteringStock(true);
                    setSelectedStockId('');
                    setMaterialName('');
                  } else {
                    setSelectedStockId(val);
                    setIsRegisteringStock(false);
                    const found = (project.materialStocks || []).find(s => s.id === val);
                    if (found) {
                      setMaterialName(found.name);
                      setUnit(found.unit);
                    } else {
                      setMaterialName('');
                    }
                  }
                }}
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-550"
              >
                <option value="" className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">-- Select Registered Material --</option>
                {(project.materialStocks || []).map(st => (
                  <option key={st.id} value={st.id} className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">
                    {st.name} ({st.availableStock} ${st.unit} available)
                  </option>
                ))}
                <option value="__register__" className="text-orange-600 font-bold bg-white dark:bg-slate-950">
                  ➕ [Register & Add New Material Item to site...]
                </option>
              </select>
            </div>

            {/* Quick stock registering block */}
            {isRegisteringStock && (
              <div className="md:col-span-2 bg-orange-500/5 border border-dashed border-orange-200 dark:border-orange-850 p-4 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest block">Register & Add New Material</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Material Name</label>
                    <input
                      type="text"
                      value={newStockName}
                      onChange={(e) => setNewStockName(e.target.value)}
                      placeholder="e.g. UltraTech OPC Cement"
                      className="w-full text-xs text-slate-905 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Stock Unit</label>
                    <select
                      value={newStockUnit}
                      onChange={(e) => setNewStockUnit(e.target.value)}
                      className="w-full text-xs text-slate-905 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-white rounded-lg p-2.5 outline-none"
                    >
                      {materialUnits.map(u => (
                        <option key={u} value={u} className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Initial On-Site Stock</label>
                    <input
                      type="number"
                      value={newStockInitial}
                      onChange={(e) => setNewStockInitial(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 500"
                      className="w-full text-xs text-slate-905 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-white rounded-lg p-2.5 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRegisterNewMaterial(newStockName, newStockUnit, Number(newStockInitial) || 0)}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                  >
                    Register and Select
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisteringStock(false);
                      setSelectedStockId('');
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* If they are NOT choosing registered stock or have free-text */}
            {!selectedStockId && !isRegisteringStock && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Or enter temporary material name *</label>
                <input
                  type="text"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  placeholder="e.g. Wood, Steel rods, Pipes"
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <CalculatorInput
                  value={quantity}
                  onChange={(val) => setQuantity(val)}
                  label="Quantity Consumed *"
                  placeholder="e.g. 50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Unit *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  disabled={!!selectedStockId}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-905 dark:text-white rounded-xl p-3 outline-none"
                >
                  {materialUnits.map(u => (
                    <option key={u} value={u} className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">{u}</option>
                  ))}
                  <option value="other" className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">Other...</option>
                </select>
                {unit === 'other' && !selectedStockId && (
                  <input
                    type="text"
                    value={materialUnitText}
                    onChange={(e) => setMaterialUnitText(e.target.value)}
                    placeholder="Enter custom unit"
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2 mt-1 focus:ring-orange-500 outline-none"
                    required
                  />
                )}
              </div>
            </div>

            <div>
              <CalculatorInput
                value={costPerUnit}
                onChange={(val) => setCostPerUnit(val)}
                label={`Cost per Unit (${currencySymbol}) *`}
                placeholder="e.g. 420"
                required
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Supplier Name / Yard</label>
                <input
                  type="text"
                  value={materialSupplier}
                  onChange={(e) => setMaterialSupplier(e.target.value)}
                  placeholder="e.g. Sai Builders & Suppliers"
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-orange-500 outline-none"
                />
              </div>

              {/* Calculated Cost Display box */}
              <div className="flex flex-col justify-center bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Total Section Cost</span>
                <span className="text-xl font-extrabold text-blue-620 dark:text-blue-400 font-mono">
                  {currencySymbol}{((Number(quantity) || 0) * (Number(costPerUnit) || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Inventory Realtime Balance List panel and Restock forms */}
            <div className="md:col-span-2 pt-2">
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-extrabold text-slate-405 dark:text-slate-500 uppercase tracking-widest block mb-2">📊 Site Stock Inventory Balance Tracker</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                        <th className="py-2">Material Item</th>
                        <th className="py-2">Available Stock</th>
                        <th className="py-2">Ordered History</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-slate-705 dark:text-slate-300">
                      {(project.materialStocks || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-3 text-center text-slate-400 italic">No registered stock items. Select "+ Register" in the dropdown above to add items.</td>
                        </tr>
                      ) : (
                      (project.materialStocks || []).map(st => {
                        const isRestockingThis = restockStockId === st.id;
                        const isEditingThis = editingStockId === st.id;
                        return (
                          <React.Fragment key={st.id}>
                            {isEditingThis ? (
                              <tr>
                                <td className="py-2.5" colSpan={4}>
                                  <div className="bg-orange-500/5 dark:bg-orange-950/10 p-3 rounded-xl border border-orange-500/20 space-y-2.5 text-left my-1">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[8px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Item Name</label>
                                        <input 
                                          type="text"
                                          value={editingStockName}
                                          onChange={(e) => setEditingStockName(e.target.value)}
                                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-lg text-xs font-sans"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[8px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Unit</label>
                                        <input 
                                          type="text"
                                          value={editingStockUnit}
                                          onChange={(e) => setEditingStockUnit(e.target.value)}
                                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-lg text-xs font-sans"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[8px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Available Stock</label>
                                        <input 
                                          type="number"
                                          value={editingStockAvailable}
                                          onChange={(e) => setEditingStockAvailable(e.target.value ? Number(e.target.value) : '')}
                                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-lg text-xs font-mono"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[8px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Total Ordered History</label>
                                        <input 
                                          type="number"
                                          value={editingStockTotalOrdered}
                                          onChange={(e) => setEditingStockTotalOrdered(e.target.value ? Number(e.target.value) : '')}
                                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-lg text-xs font-mono"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex gap-2 justify-end pt-1">
                                      <button 
                                        type="button"
                                        onClick={() => setEditingStockId(null)}
                                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-[9px] font-black rounded-lg transition cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={handleSaveEditStock}
                                        className="px-2.5 py-1 bg-orange-650 hover:bg-orange-700 text-white text-[9px] font-black rounded-lg transition cursor-pointer"
                                      >
                                        Save Changes
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              <tr className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                                <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{st.name}</td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 rounded-md font-bold ${
                                    st.availableStock <= 10 
                                      ? 'bg-rose-500/10 text-rose-500' 
                                      : 'bg-emerald-500/10 text-emerald-500'
                                  }`}>
                                    {st.availableStock} {st.unit}
                                  </span>
                                </td>
                                <td className="py-2.5 font-mono text-slate-405">{st.totalOrdered || st.availableStock} {st.unit}</td>
                                <td className="py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingStockId(st.id);
                                        setEditingStockName(st.name);
                                        setEditingStockUnit(st.unit);
                                        setEditingStockAvailable(st.availableStock);
                                        setEditingStockTotalOrdered(st.totalOrdered || st.availableStock);
                                      }}
                                      className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-2 py-1 rounded-md transition cursor-pointer"
                                      title="Edit Stock configurations"
                                    >
                                      Edit ✏️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteStock(st.id)}
                                      className="text-[9px] font-extrabold text-rose-600 hover:text-white bg-rose-500/10 hover:bg-rose-600 px-2 py-1 rounded-md transition cursor-pointer"
                                      title="Delete stock tracker with warning"
                                    >
                                      Delete 🗑️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRestockStockId(isRestockingThis ? null : st.id);
                                        setRestockQuantity('');
                                        setRestockCostPerUnit('');
                                      }}
                                      className="text-[9px] font-black text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/15 px-2 py-1 rounded-md transition cursor-pointer"
                                    >
                                      {isRestockingThis ? 'Close' : '➕ Restock'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                              {isRestockingThis && (
                                <tr>
                                  <td colSpan={4} className="py-3 px-2 bg-blue-500/5 rounded-xl border border-dashed border-blue-500/20">
                                    <div className="flex flex-col sm:flex-row items-end gap-2 text-left">
                                      <div className="flex-1">
                                        <label className="block text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">Additional Stock Received ({st.unit}) *</label>
                                        <input
                                          type="number"
                                          value={restockQuantity}
                                          onChange={(e) => setRestockQuantity(e.target.value ? Number(e.target.value) : '')}
                                          placeholder={`e.g. 150`}
                                          className="w-full p-2 bg-white dark:bg-slate-900 text-xs border border-blue-200 dark:border-blue-900 rounded-lg outline-none"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <label className="block text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">Cost per {st.unit} (PKR) *</label>
                                        <input
                                          type="number"
                                          value={restockCostPerUnit}
                                          onChange={(e) => setRestockCostPerUnit(e.target.value ? Number(e.target.value) : '')}
                                          placeholder={`e.g. 520`}
                                          className="w-full p-2 bg-white dark:bg-slate-900 text-xs border border-blue-200 dark:border-blue-900 rounded-lg outline-none"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleAddNewRestock(st.id, Number(restockQuantity), Number(restockCostPerUnit) || 0)}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition"
                                      >
                                        Receive & Log Spend
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'labour' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Contractor / Leader Name *</label>
              <input
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder="e.g. Ram Singh & Crew"
                className="w-full text-sm border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-950 dark:text-white rounded-xl p-3 focus:ring-orange-500 focus:border-orange-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Labour Type *</label>
              <select
                value={labourCategory}
                onChange={(e) => setLabourCategory(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500"
              >
                {labourCategories.map(cat => (
                  <option key={cat} value={cat} className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">{cat.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <CalculatorInput
                  value={numWorkers}
                  onChange={(val) => setNumWorkers(val)}
                  label="No. of Workers *"
                  placeholder="e.g., 8"
                  required
                />
              </div>

              <div>
                <CalculatorInput
                  value={dailyWage}
                  onChange={(val) => setDailyWage(val)}
                  label={`Daily Wage (${currencySymbol}) *`}
                  placeholder="e.g., 650"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col justify-center bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Total Wages Due</span>
              <span className="text-xl font-extrabold text-orange-500 dark:text-orange-400 font-mono">
                {currencySymbol}{((Number(numWorkers) || 0) * (Number(dailyWage) || 0)).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {activeCategory === 'transport' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Vehicle Type / Service *</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500"
              >
                {vehicleTypes.map(v => (
                  <option key={v} value={v} className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">{v.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Details / Description *</label>
              <input
                type="text"
                value={transportDescription}
                onChange={(e) => setTransportDescription(e.target.value)}
                placeholder="e.g. Fine grade construction sand (3 trolleys)"
                className="w-full text-sm border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-950 dark:text-white rounded-xl p-3 focus:ring-orange-500 outline-none"
                required
              />
            </div>

            <div>
              <CalculatorInput
                value={transportCost}
                onChange={(val) => setTransportCost(val)}
                label={`Transportation Cost (${currencySymbol}) *`}
                placeholder="e.g. 12500"
                required
              />
            </div>
          </div>
        )}

        {/* Dynamic customized tab form */}
        {!['material', 'labour', 'transport'].includes(activeCategory) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCustomCat?.enableStockTracking ? (
              <>
                {/* Inventory Tracker Select */}
                <div className="md:col-span-2 space-y-2 mb-2">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none">
                    Choose {activeCustomCat.name} Item from Site Inventory *
                  </label>
                  <select
                    value={selectedStockId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__register__') {
                        setIsRegisteringStock(true);
                        setSelectedStockId('');
                        setCustomItemName('');
                      } else {
                        setSelectedStockId(val);
                        setIsRegisteringStock(false);
                        const found = (project.materialStocks || []).find(s => s.id === val);
                        if (found) {
                          setCustomItemName(found.name);
                          setCustomUnit(found.unit);
                        } else {
                          setCustomItemName('');
                        }
                      }
                    }}
                    className="w-full text-sm border border-slate-205 dark:border-slate-805 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-555"
                  >
                    <option value="" className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">-- Select Registered {activeCustomCat.name} Item --</option>
                    {(project.materialStocks || []).filter(st => st.category === activeCategory).map(st => (
                      <option key={st.id} value={st.id} className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">
                        {st.name} ({st.availableStock} {st.unit} available)
                      </option>
                    ))}
                    <option value="__register__" className="text-orange-600 font-bold bg-white dark:bg-slate-950">
                      ➕ [Register & Add New {activeCustomCat.name} Item to site...]
                    </option>
                  </select>
                </div>

                {/* Quick stock registering block */}
                {isRegisteringStock && (
                  <div className="md:col-span-2 bg-orange-500/5 border border-dashed border-orange-200 dark:border-orange-850 p-4 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest block">Register & Add New {activeCustomCat.name}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Item Name</label>
                        <input
                          type="text"
                          value={newStockName}
                          onChange={(e) => setNewStockName(e.target.value)}
                          placeholder="e.g. 7/29 Copper Wire Coils"
                          className="w-full text-xs text-slate-905 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white rounded-lg p-2.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Stock Unit</label>
                        <select
                          value={newStockUnit}
                          onChange={(e) => setNewStockUnit(e.target.value)}
                          className="w-full text-xs text-slate-905 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 dark:border-slate-800 dark:text-white rounded-lg p-2.5 outline-none"
                        >
                          <option value="pcs" className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">pcs (pieces)</option>
                          <option value="coils" className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">coils</option>
                          <option value="meters" className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">meters</option>
                          {materialUnits.map(u => (
                            <option key={u} value={u} className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">{u}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Initial On-Site Stock</label>
                        <input
                          type="number"
                          value={newStockInitial}
                          onChange={(e) => setNewStockInitial(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g. 25"
                          className="w-full text-xs text-slate-905 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 dark:border-slate-800 dark:text-white rounded-lg p-2.5 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRegisterNewMaterial(newStockName, newStockUnit, Number(newStockInitial) || 0)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
                      >
                        Register and Select
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegisteringStock(false);
                          setSelectedStockId('');
                        }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* If they are NOT choosing registered stock or have free-text */}
                {!selectedStockId && !isRegisteringStock && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Or enter temporary material/item description *</label>
                    <input
                      type="text"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder={`e.g. PVC Fittings, Wire PVC Conduit, ${activeCustomCat?.name || 'Item'} delivery`}
                      className="w-full text-sm border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-950 dark:text-white rounded-xl p-3 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                  Logged Item / Expense / Action Name *
                </label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder={`e.g. PVC Fittings, Wire PVC Conduit, ${activeCustomCat?.name || 'Item'} delivery`}
                  className="w-full text-sm border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-950 dark:text-white rounded-xl p-3 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <CalculatorInput
                  value={customQuantity}
                  onChange={(val) => setCustomQuantity(val)}
                  label={activeCustomCat?.enableStockTracking ? "Quantity Consumed *" : "Quantity *"}
                  placeholder="e.g. 12"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Unit *</label>
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  disabled={activeCustomCat?.enableStockTracking && !!selectedStockId}
                  className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-905 dark:text-slate-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="pcs" className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">pcs (pieces)</option>
                  <option value="coils" className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">coils</option>
                  <option value="meters" className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">meters</option>
                  {materialUnits.map(u => (
                    <option key={u} value={u} className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">{u}</option>
                  ))}
                  <option value="other" className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">Other...</option>
                </select>
                {customUnit === 'other' && !selectedStockId && (
                  <input
                    type="text"
                    value={customUnitText}
                    onChange={(e) => setCustomUnitText(e.target.value)}
                    placeholder="Enter unit name"
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 dark:text-white rounded-xl p-2 mt-1 focus:ring-orange-500 outline-none"
                    required
                  />
                )}
              </div>
            </div>

            <div>
              <CalculatorInput
                value={customCostPerUnit}
                onChange={(val) => setCustomCostPerUnit(val)}
                label={`Cost per Unit (${currencySymbol}) *`}
                placeholder="e.g. 150"
                required
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Supplier / Contract Provider Name</label>
                <input
                  type="text"
                  value={customSupplier}
                  onChange={(e) => setCustomSupplier(e.target.value)}
                  placeholder="e.g. Apex Plumbing Hub"
                  className="w-full text-sm border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-950 dark:text-white rounded-xl p-3 focus:ring-orange-500 outline-none"
                />
              </div>

              {/* Real-time Dynamic calculated Cost display */}
              <div className="flex flex-col justify-center bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Calculated Section Cost</span>
                <span className="text-xl font-extrabold text-teal-610 dark:text-teal-400 font-mono">
                  {currencySymbol}{((Number(customQuantity) || 0) * (Number(customCostPerUnit) || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Inventory Realtime Balance Tracker List panel for active Custom Tab */}
            {activeCustomCat?.enableStockTracking && (
              <div className="md:col-span-2 pt-2">
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl">
                  <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">📊 {activeCustomCat.name} Site Inventory Balance Tracker</span>
                  <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                          <th className="py-2">Material Item</th>
                          <th className="py-2">Available Stock</th>
                          <th className="py-2">Ordered History</th>
                          <th className="py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {(project.materialStocks || []).filter(st => st.category === activeCategory).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-3 text-center text-slate-400 italic">No registered stock items. Select "+ Register" in the dropdown above to add items.</td>
                          </tr>
                        ) : (
                          (project.materialStocks || []).filter(st => st.category === activeCategory).map(st => {
                            const isRestockingThis = restockStockId === st.id;
                            const isEditingThis = editingStockId === st.id;
                            return (
                              <React.Fragment key={st.id}>
                                {isEditingThis ? (
                                  <tr>
                                    <td className="py-2.5" colSpan={4}>
                                      <div className="bg-orange-500/5 dark:bg-orange-950/10 p-3 rounded-xl border border-orange-500/20 space-y-2.5 text-left my-1">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Item Name *</label>
                                            <input 
                                              type="text"
                                              value={editingStockName}
                                              onChange={(e) => setEditingStockName(e.target.value)}
                                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-lg text-xs"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Unit</label>
                                            <input 
                                              type="text"
                                              value={editingStockUnit}
                                              onChange={(e) => setEditingStockUnit(e.target.value)}
                                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-lg text-xs"
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Available Stock</label>
                                            <input 
                                              type="number"
                                              value={editingStockAvailable}
                                              onChange={(e) => setEditingStockAvailable(e.target.value ? Number(e.target.value) : '')}
                                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-lg text-xs font-mono"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Total Ordered History</label>
                                            <input 
                                              type="number"
                                              value={editingStockTotalOrdered}
                                              onChange={(e) => setEditingStockTotalOrdered(e.target.value ? Number(e.target.value) : '')}
                                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-lg text-xs font-mono"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex gap-2 justify-end pt-1">
                                          <button 
                                            type="button"
                                            onClick={() => setEditingStockId(null)}
                                            className="px-2.5 py-1 bg-slate-250 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-[9px] font-black rounded-lg transition cursor-pointer border-0"
                                          >
                                            Cancel
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={handleSaveEditStock}
                                            className="px-2.5 py-1 bg-orange-650 hover:bg-orange-700 text-white text-[9px] font-black rounded-lg transition cursor-pointer border-0"
                                          >
                                            Save Changes
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                                    <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{st.name}</td>
                                    <td className="py-2.5">
                                      <span className={`px-2 py-0.5 rounded-md font-bold ${
                                        st.availableStock <= 5 
                                          ? 'bg-rose-500/10 text-rose-500' 
                                          : 'bg-emerald-500/10 text-emerald-500'
                                      }`}>
                                        {st.availableStock} {st.unit}
                                      </span>
                                    </td>
                                    <td className="py-2.5 font-mono text-slate-450">{st.totalOrdered || st.availableStock} {st.unit}</td>
                                    <td className="py-2.5 text-right font-sans">
                                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingStockId(st.id);
                                            setEditingStockName(st.name);
                                            setEditingStockUnit(st.unit);
                                            setEditingStockAvailable(st.availableStock);
                                            setEditingStockTotalOrdered(st.totalOrdered || st.availableStock);
                                          }}
                                          className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 px-2 py-1 rounded-md transition cursor-pointer border-0"
                                          title="Edit stock config"
                                        >
                                          Edit ✏️
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteStock(st.id)}
                                          className="text-[9px] font-extrabold text-rose-600 hover:text-white bg-rose-500/10 hover:bg-rose-600 px-2 py-1 rounded-md transition cursor-pointer border-0"
                                          title="Delete stock tracker with warning"
                                        >
                                          Delete 🗑️
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setRestockStockId(isRestockingThis ? null : st.id);
                                            setRestockQuantity('');
                                            setRestockCostPerUnit('');
                                          }}
                                          className="text-[9px] font-black text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/15 px-2.5 py-1 rounded-lg transition cursor-pointer border-0"
                                        >
                                          {isRestockingThis ? 'Close' : '➕ Restock'}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                                {isRestockingThis && (
                                  <tr>
                                    <td colSpan={4} className="py-3 px-2 bg-blue-500/5 rounded-xl border border-dashed border-blue-500/20">
                                      <div className="flex flex-col sm:flex-row items-end gap-2 text-left">
                                        <div className="flex-1">
                                          <label className="block text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-0.5 font-sans">Additional Stock Received ({st.unit}) *</label>
                                          <input
                                            type="number"
                                            value={restockQuantity}
                                            onChange={(e) => setRestockQuantity(e.target.value ? Number(e.target.value) : '')}
                                            placeholder={`e.g. 100`}
                                            className="w-full p-2 bg-white dark:bg-slate-900 text-xs border border-blue-200 dark:border-blue-900 rounded-lg outline-none"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <label className="block text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-0.5 font-sans">Cost per {st.unit} ({currencySymbol}) *</label>
                                          <input
                                            type="number"
                                            value={restockCostPerUnit}
                                            onChange={(e) => setRestockCostPerUnit(e.target.value ? Number(e.target.value) : '')}
                                            placeholder={`e.g. 450`}
                                            className="w-full p-2 bg-white dark:bg-slate-900 text-xs border border-blue-200 dark:border-blue-900 rounded-lg outline-none"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleAddNewRestock(st.id, Number(restockQuantity), Number(restockCostPerUnit) || 0)}
                                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition font-sans"
                                        >
                                          Receive & Log Spend
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* General Notes, Attachment Snapshot Section */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Notes / Work Order Description</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Include details like challan receipt numbers, voucher logs, or quality notes..."
              rows={3}
              className="w-full text-sm border-slate-202 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-950 dark:text-white rounded-xl p-3 focus:ring-orange-500 outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Attach Receipt / Invoice Snapshot</label>
            <div className="mt-1 flex gap-3 h-24">
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="w-24 h-24 border-2 border-dashed border-slate-200 dark:border-slate-705 hover:border-orange-550 rounded-2xl flex flex-col items-center justify-center p-2 text-slate-450 hover:text-orange-500 transition-colors cursor-pointer"
                id="btn-take-receipt-photo"
              >
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold text-center leading-tight">Camera / Upload</span>
              </button>

              {receiptImage ? (
                <div className="relative w-24 h-24 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 font-sans">
                  <img referrerPolicy="no-referrer" src={receiptImage} alt="Receipt preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setReceiptImage(undefined)}
                    className="absolute top-1 right-1 bg-rose-550 text-white text-[9px] font-bold p-1 rounded-full aspect-square flex items-center justify-center hover:bg-rose-600 active:scale-95 leading-none shadow-sm cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex-1 border border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 p-3 rounded-2xl flex flex-col justify-center text-xs text-slate-400">
                  <p className="font-semibold text-slate-550 dark:text-slate-450">No snapshot attached</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5 leading-normal">
                    Capturing receipts allows supervisors to cross-reference logs offline anytime.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit action panel */}
        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-orange-555/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Save Expense Log Record
          </button>
        </div>
      </form>

      {/* HTML Camera Component Trigger */}
      {showCamera && (
        <ReceiptCapture
          onCapture={(imgData) => {
            setReceiptImage(imgData);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Warning modal validation prior to custom category tab deletion */}
      {pendingDeleteCat && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xl max-w-sm w-full space-y-4">
            <h3 className="font-extrabold text-base text-rose-600 dark:text-rose-500 uppercase tracking-wider font-display flex items-center gap-2">
              ⚠️ Warning: Delete Tab?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete the custom category tab <strong>"{pendingDeleteCat.name}"</strong>?<br/><br/>
              This will remove the input tab itself. Any expenses registered under this category will remain securely conserved inside your historic index ledger, but you won't be able to log new ones easily.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPendingDeleteCat(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-2xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const catId = pendingDeleteCat.id;
                  const catName = pendingDeleteCat.name;
                  const updatedProject: Project = {
                    ...project,
                    customCategories: (project.customCategories || []).filter(c => c.id !== catId)
                  };

                  if (onUpdateProject) {
                    onUpdateProject(updatedProject);
                  }

                  if (activeCategory === catId) {
                    setActiveCategory('material');
                  }
                  setPendingDeleteCat(null);
                  triggerBanner('success', `Removed tab "${catName}". Logs remain in database ledger.`);
                }}
                className="px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl cursor-pointer"
              >
                Yes, Delete Tab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

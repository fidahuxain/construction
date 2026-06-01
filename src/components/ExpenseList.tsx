/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Project, Expense, ExpenseCategory } from '../types';
import { convertExpensesToCSV, downloadFile } from '../db';
import { 
  Search, 
  Trash2, 
  Download, 
  Printer, 
  Layers, 
  HardHat, 
  Truck, 
  FileText, 
  CheckCircle2, 
  Eye,
  CalendarDays,
  X,
  Edit,
  Save
} from 'lucide-react';

interface ExpenseListProps {
  project: Project | null;
  expenses: { [id: string]: Expense };
  onDeleteExpense: (id: string) => void;
  onUpdateExpense: (updated: Expense) => void;
}

export default function ExpenseList({ 
  project, 
  expenses, 
  onDeleteExpense, 
  onUpdateExpense 
}: ExpenseListProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [syncFilter, setSyncFilter] = useState<'all' | 'synced' | 'pending'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [selectedEditExpense, setSelectedEditExpense] = useState<Expense | null>(null);

  if (!project) return null;

  // Filter project expenses
  const projectExpenses = Object.values(expenses)
    .filter(e => e.projectId === project.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newer first

  // Advanced filters calculation
  const filteredExpenses = projectExpenses.filter(exp => {
    // 1. Category
    if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;

    // 2. Sync Status
    if (syncFilter === 'synced' && !exp.synced) return false;
    if (syncFilter === 'pending' && exp.synced) return false;

    // 3. Search text
    const query = search.toLowerCase();
    let textMatches = false;
    const rawExp = exp as any;

    if (exp.category === 'material') {
      textMatches = (rawExp.materialName || '').toLowerCase().includes(query) || 
                    (rawExp.supplierName || '').toLowerCase().includes(query);
    } else if (exp.category === 'labour') {
      textMatches = (rawExp.workerName || '').toLowerCase().includes(query) || 
                    (rawExp.labourCategory || '').toLowerCase().includes(query);
    } else if (exp.category === 'transport') {
      textMatches = (rawExp.vehicleType || '').toLowerCase().includes(query) || 
                    (rawExp.description || '').toLowerCase().includes(query);
    } else {
      // Custom categories tabs search
      textMatches = (rawExp.itemName || '').toLowerCase().includes(query) ||
                    (rawExp.supplierName || '').toLowerCase().includes(query);
    }
    if (exp.notes && exp.notes.toLowerCase().includes(query)) textMatches = true;

    if (search && !textMatches) return false;

    // 4. Date ranges
    if (startDate && exp.date < startDate) return false;
    if (endDate && exp.date > endDate) return false;

    return true;
  });

  // Totals for filtered list
  const filteredTotal = filteredExpenses.reduce((sum, exp) => {
    const rawExp = exp as any;
    if (exp.category === 'material') return sum + (rawExp.totalCost || 0);
    if (exp.category === 'labour') return sum + (rawExp.totalAmount || 0);
    if (exp.category === 'transport') return sum + (rawExp.cost || 0);
    // Custom category
    return sum + (rawExp.totalCost || 0);
  }, 0);

  const currencySymbol = project.currency || 'Rs.';

  const handleExportCSV = () => {
    const csvContent = convertExpensesToCSV(filteredExpenses, project.name);
    const fileName = `${project.name.replace(/\s+/g, '_')}_expenses.csv`;
    downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
    alert('Spreadsheet report generated successfully and downloaded in CSV format.');
  };

  const handlePrintPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const projectName = project.name;
      const location = project.location || 'N/A';
      const client = project.clientName || 'N/A';
      const constructor = project.constructorName || 'N/A';
      const cur = project.currency || 'Rs.';

      // Title & Header Pane
      doc.setFillColor(30, 41, 59); // deep slate (#1e293b)
      doc.rect(0, 0, 210, 42, 'F');

      doc.setTextColor(249, 115, 22); // orange accent (#f97316)
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text("CONSTRUCTION SITE EXPENSE REPORT", 15, 18);

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Project Location: ${location} | Issued: ${new Date().toLocaleDateString()}`, 15, 25);
      doc.text(`Supervisor Lead: ${constructor} | Client Name: ${client}`, 15, 31);

      // We'll calculate totals for materials, labour, transport, and each custom category
      const customCats = project.customCategories || [];
      
      let matSum = 0;
      let labSum = 0;
      let traSum = 0;
      const customSums: { [key: string]: number } = {};
      customCats.forEach(c => { customSums[c.id] = 0; });

      filteredExpenses.forEach(e => {
        const raw = e as any;
        if (e.category === 'material') matSum += raw.totalCost || 0;
        else if (e.category === 'labour') labSum += raw.totalAmount || 0;
        else if (e.category === 'transport') traSum += raw.cost || 0;
        else {
          if (customSums[e.category] !== undefined) customSums[e.category] += raw.totalCost || raw.cost || 0;
        }
      });

      const totalCalculated = matSum + labSum + traSum + Object.values(customSums).reduce((a, b) => a + b, 0);

      let y = 52;

      // Section: KPI Summary Dashboard Box
      doc.setDrawColor(226, 232, 240); // slate-200 border
      doc.setFillColor(248, 250, 252); // slate-50 light gray
      doc.rect(15, y, 180, 32, 'FD');

      doc.setTextColor(51, 65, 85);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("ACCUMULATED SPENDING SUMMARY", 20, y + 8);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Materials Log Total: ${cur} ${matSum.toLocaleString()}`, 20, y + 17);
      doc.text(`Labour Wages Total: ${cur} ${labSum.toLocaleString()}`, 20, y + 24);
      doc.text(`Transportation Total: ${cur} ${traSum.toLocaleString()}`, 105, y + 17);
      
      let customLineText = '';
      customCats.forEach(c => {
        customLineText += `${c.name}: ${cur} ${(customSums[c.id] || 0).toLocaleString()} | `;
      });
      if (customLineText.length > 55) {
        customLineText = customLineText.substring(0, 52) + '...';
      }
      doc.text(customLineText || 'No custom categories active.', 105, y + 24);

      // Draw horizontal dividing line
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.line(15, y + 27, 195, y + 27);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`TOTAL SITE PROJECT COSTS:  ${cur} ${totalCalculated.toLocaleString()}`, 20, y + 31);

      y += 42;

      // Section Header: Detailed ledger records
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("DETAILED SITE LEDGER LOGS", 15, y);
      y += 6;

      // Ledger Table Header
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(15, y, 180, 8, 'F');
      
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('Helvetica', 'bold');
      doc.text("DATE", 17, y + 5.5);
      doc.text("CATEGORY", 38, y + 5.5);
      doc.text("DESCRIPTION SUMMARY", 72, y + 5.5);
      doc.text("TOTAL AMOUNT", 168, y + 5.5);

      y += 8;

      // Render rows
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      filteredExpenses.forEach((exp, idx) => {
        const detail = getCategoryDetails(exp);
        const amountText = `${cur} ${(detail.total || 0).toLocaleString()}`;
        const catLabel = exp.category === 'material' ? 'Materials Log' :
                         exp.category === 'labour' ? 'Labour wages' :
                         exp.category === 'transport' ? 'Transportation' :
                         (customCats.find(c => c.id === exp.category)?.name || 'Custom Log');

        let description = `${detail.title} - ${detail.subtitle || ''} | ${detail.desc || ''}`;
        if (description.length > 52) {
          description = description.substring(0, 49) + '...';
        }

        // Draw light zebra rows
        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, y, 180, 7.5, 'F');
        }

        doc.text(exp.date, 17, y + 5);
        doc.text(catLabel.substring(0, 18), 38, y + 5);
        doc.text(description, 72, y + 5);
        doc.text(amountText, 168, y + 5);

        y += 7.5;

        // Pagination check
        if (y > 270 && idx < filteredExpenses.length - 1) {
          doc.addPage();
          y = 20;

          doc.setFillColor(241, 245, 249);
          doc.rect(15, y, 180, 8, 'F');
          doc.setFont('Helvetica', 'bold');
          doc.text("DATE", 17, y + 5.5);
          doc.text("CATEGORY", 38, y + 5.5);
          doc.text("DESCRIPTION SUMMARY", 72, y + 5.5);
          doc.text("TOTAL AMOUNT", 168, y + 5.5);
          y += 8;
          doc.setFont('Helvetica', 'normal');
        }
      });

      // Footer disclaimer & signature
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(15, 275, 195, 275);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated by AI Site supervisor offline backup tool. Registered: ${filteredExpenses.length} lines. Project: ${projectName}`, 15, 281);
      doc.text("Page 1 of 1 (Standalone Document)", 165, 281);

      doc.save(`voucher_report_${projectName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Encountered unexpected error during local PDF compilation. Exporting CSV is recommended instead.");
    }
  };

  const getCategoryDetails = (exp: Expense) => {
    const rawExp = exp as any;
    if (exp.category === 'material') {
      return {
        icon: Layers,
        color: 'text-blue-500 bg-blue-50/60 dark:bg-blue-950/20',
        title: rawExp.materialName || 'Material Entry',
        subtitle: `Supplier: ${rawExp.supplierName || 'Self-brought/Direct'}`,
        desc: `${rawExp.quantity} ${rawExp.unit} @ ${currencySymbol}${rawExp.costPerUnit}`,
        total: rawExp.totalCost || 0
      };
    } else if (exp.category === 'labour') {
      return {
        icon: HardHat,
        color: 'text-orange-500 bg-orange-50/60 dark:bg-orange-950/10',
        title: `${(rawExp.labourCategory || 'Labour').toUpperCase()} Wage`,
        subtitle: `Supervisor: ${rawExp.workerName || 'Staff'}`,
        desc: `${rawExp.numWorkers} workers × ${currencySymbol}${rawExp.dailyWage}/day`,
        total: rawExp.totalAmount || 0
      };
    } else if (exp.category === 'transport') {
      return {
        icon: Truck,
        color: 'text-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/20',
        title: `Transport: ${rawExp.vehicleType || 'Truck'}`,
        subtitle: rawExp.description || 'Freight Delivery',
        desc: 'Trip freight payload',
        total: rawExp.cost || 0
      };
    } else {
      // User-Defined Dynamic Categories
      const customConfig = (project.customCategories || []).find(c => c.id === exp.category);
      return {
        icon: FileText,
        color: 'text-teal-500 bg-teal-50/60 dark:bg-teal-950/20',
        title: customConfig ? customConfig.name : 'Custom Roster Log',
        subtitle: rawExp.itemName || 'Custom category expense',
        desc: `${rawExp.quantity || 1} ${rawExp.unit || 'pcs'} @ ${currencySymbol}${rawExp.costPerUnit || 0}`,
        total: rawExp.totalCost || 0
      };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-6">
      
      {/* Search Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-550 flex items-center gap-2 font-display">
            <FileText className="text-orange-500 w-5 h-5" />
            Vouchers & Daily Reports
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs text-slate-550 mt-0.5">Search, filter, check details and download physical CSV vouchers</p>
        </div>

        {/* Action sheets download */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={handleExportCSV}
            disabled={filteredExpenses.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-2xl text-xs font-bold text-slate-705 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 select-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-bold select-none active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-orange-500/10"
          >
            <Printer className="w-4 h-4" />
            PDF Report
          </button>
        </div>
      </div>

      {/* Filters Form Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-3xl border border-slate-100 dark:border-slate-850">
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search material description, yard, crew name..."
            className="w-full text-xs pl-10 pr-4 py-3 bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-orange-500 outline-none"
          />
        </div>

        {/* Category filtering */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full text-xs p-3 bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-orange-500 outline-none font-bold"
          >
            <option value="all">📁 All Categories</option>
            <option value="material">🧱 Materials Log</option>
            <option value="labour">👷 Labour Wages</option>
            <option value="transport">🚚 Transport/Fuel</option>
            {(project.customCategories || []).map(cat => (
              <option key={cat.id} value={cat.id}>📂 {cat.name}</option>
            ))}
          </select>
        </div>

        {/* Sync Status Filter */}
        <div>
          <select
            value={syncFilter}
            onChange={(e) => setSyncFilter(e.target.value as any)}
            className="w-full text-xs p-3 bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-orange-500 outline-none font-bold"
          >
            <option value="all">⚡ All Sync Logs</option>
            <option value="synced">✅ Synced to Spreadsheet</option>
            <option value="pending">⏳ Local Only (Pending)</option>
          </select>
        </div>

        {/* Custom Start/End Date Range */}
        <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-850 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">From date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white text-xs rounded-xl outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">To date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white text-xs rounded-xl outline-none"
            />
          </div>
        </div>
      </div>

      {/* Filtered Total Display */}
      <div className="flex justify-between items-center p-4 bg-slate-950 dark:bg-slate-950 border border-slate-800 rounded-2xl text-white">
        <div>
          <span className="text-[10px] text-slate-450 uppercase font-bold">Filtered List Total</span>
          <p className="text-xs text-slate-320 mt-0.5 font-medium">{filteredExpenses.length} vouchers calculated</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-extrabold text-orange-550 font-mono">{currencySymbol}{filteredTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Expense Entries Table/List cards */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 animate-fade-in">
            <CalendarDays className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-750 mb-2" />
            <p className="text-xs font-semibold">No records matched active filters.</p>
            <p className="text-[10px] mt-1 text-slate-450">Clear dates or search queries to restore expense rows.</p>
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const det = getCategoryDetails(exp);
            const Icon = det.icon;

            return (
              <div 
                key={exp.id} 
                className="p-4 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-orange-500/10 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  {/* Category icon container */}
                  <span className={`p-2.5 rounded-2xl ${det.color} shrink-0`}>
                    <Icon className="w-4.5 h-4.5" />
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                       <h4 className="font-bold text-xs text-slate-900 dark:text-slate-50">{det.title}</h4>
                      <span className="font-mono text-[9px] text-slate-450 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                        {exp.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">{det.desc}</p>
                    <p className="text-[10px] italic text-slate-400 mt-0.5">{det.subtitle}</p>
                    {exp.notes && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 p-1.5 px-2 rounded-lg mt-1.5 border border-slate-150/50 dark:border-slate-850 max-w-sm truncate" title={exp.notes}>
                        <span className="font-semibold">Note:</span> {exp.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side data parameters */}
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-2 sm:pt-0">
                  <div className="flex items-center gap-2">
                    {/* Receipt Attachment view */}
                    {exp.receiptImage && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(exp.receiptImage || null)}
                        className="flex items-center gap-1 p-1 px-2.5 bg-orange-500/15 border border-orange-200 text-orange-650 dark:text-orange-400 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-orange-500/25 select-none cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    )}

                    {/* Sync Status Badge */}
                    <span 
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        exp.synced 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                      title={exp.synced ? 'Synced on Google Sheets active spreadsheet' : 'Saved locally in offline cache'}
                    >
                      <CheckCircle2 className={`w-3 h-3 ${exp.synced ? 'text-emerald-500 font-bold' : 'text-slate-500'}`} />
                      {exp.synced ? 'SYNCED' : 'LOCAL'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-slate-50 font-mono mr-1">
                      {currencySymbol}{det.total.toLocaleString()}
                    </span>

                    <button
                      onClick={() => setSelectedEditExpense(exp)}
                      className="p-1.5 hover:bg-orange-50 hover:text-orange-500 text-slate-400 dark:text-slate-500 rounded-lg transition-colors select-none cursor-pointer"
                      title="Edit expense voucher properties"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`⚠️ Warning: Are you sure you want to permanently delete this voucher entry of ${currencySymbol}${det.total}? This action cannot be reverted.`)) {
                          onDeleteExpense(exp.id);
                        }
                      }}
                      className="p-1.5 hover:bg-rose-50 hover:text-rose-500 text-slate-400 dark:text-slate-500 rounded-lg transition-colors select-none cursor-pointer"
                      title="Delete expense voucher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Receipt View Overlay Drawers */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/8 w-full h-full backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-150 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attached Scaffold Invoice</span>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center">
              <img referrerPolicy="no-referrer" src={selectedReceipt} alt="Full invoice scan" className="max-w-full max-h-[400px] object-contain rounded-xl" />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 text-center text-[10px] text-slate-400 italic">
              Use standard mobile screen layouts to screenshot or zoom.
            </div>
          </div>
        </div>
      )}

      {/* Styled Hidden Printable Page specifically structured for window.print() */}
      <div className="hidden print:block absolute inset-0 bg-white text-zinc-900 p-8 z-99 border-0 max-w-full">
        <div className="text-center border-b-2 border-zinc-900 pb-5 mb-5">
          <h1 className="text-2xl font-black uppercase tracking-widest">CONSTRUCTION PROJECT EXPENSE REPORT</h1>
          <h2 className="text-lg font-bold mt-2">{project.name}</h2>
          <p className="text-xs text-zinc-650 mt-1">Location: {project.location} • Start Date: {project.startDate}</p>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-500 bg-zinc-105 font-bold uppercase text-[10px]">
              <th className="py-2 px-1">Date</th>
              <th className="py-2 px-1">Category</th>
              <th className="py-2 px-1">Voucher Description</th>
              <th className="py-2 px-1 text-right">Amount ({currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((exp, idx) => {
              const det = getCategoryDetails(exp);
              return (
                <tr key={idx} className="border-b border-zinc-200 py-2">
                  <td className="py-2 px-1 font-mono">{exp.date}</td>
                  <td className="py-2 px-1 uppercase font-bold text-[9px]">{exp.category}</td>
                  <td className="py-2 px-1">
                    <p className="font-bold">{det.title}</p>
                    <p className="text-[10px] text-zinc-500">{det.desc} • {det.subtitle}</p>
                    {exp.notes && <p className="text-[9px] italic text-zinc-400 mt-0.5">Note: {exp.notes}</p>}
                  </td>
                  <td className="py-2 px-1 text-right font-mono font-bold">{det.total.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-between items-center mt-8 border-t-2 border-zinc-900 pt-4">
          <span className="font-bold text-sm">TOTAL ACCUMULATED COST:</span>
          <span className="font-extrabold text-lg">{currencySymbol}{filteredTotal.toLocaleString()}</span>
        </div>

        <div className="mt-12 text-center text-[9px] text-zinc-400 border-t border-zinc-200 pt-3">
          Generated automatically via ConstructSync on {new Date().toLocaleString()}.
        </div>
      </div>

      {/* Edit Voucher Overlay Modal */}
      {selectedEditExpense && (
        <EditExpenseModal
          expense={selectedEditExpense}
          onClose={() => setSelectedEditExpense(null)}
          onSave={onUpdateExpense}
          currencySymbol={currencySymbol}
          project={project}
        />
      )}
    </div>
  );
}

interface EditExpenseModalProps {
  expense: Expense;
  onClose: () => void;
  onSave: (updated: Expense) => void;
  currencySymbol: string;
  project: Project;
}

function EditExpenseModal({ expense, onClose, onSave, currencySymbol, project }: EditExpenseModalProps) {
  const [date, setDate] = useState(expense.date);
  const [notes, setNotes] = useState(expense.notes || '');

  // Category-specific inputs
  const [materialName, setMaterialName] = useState((expense as any).materialName || '');
  const [quantity, setQuantity] = useState((expense as any).quantity || 0);
  const [costPerUnit, setCostPerUnit] = useState((expense as any).costPerUnit || 0);
  const [supplierName, setSupplierName] = useState((expense as any).supplierName || '');

  const [labourCategory, setLabourCategory] = useState((expense as any).labourCategory || '');
  const [workerName, setWorkerName] = useState((expense as any).workerName || '');
  const [numWorkers, setNumWorkers] = useState((expense as any).numWorkers || 0);
  const [dailyWage, setDailyWage] = useState((expense as any).dailyWage || 0);

  const [vehicleType, setVehicleType] = useState((expense as any).vehicleType || '');
  const [description, setDescription] = useState((expense as any).description || '');
  const [cost, setCost] = useState((expense as any).cost || 0);

  const [itemName, setItemName] = useState((expense as any).itemName || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedExpense: any = {
      ...expense,
      date,
      notes,
    };

    if (expense.category === 'material') {
      updatedExpense.materialName = materialName;
      updatedExpense.quantity = Number(quantity);
      updatedExpense.costPerUnit = Number(costPerUnit);
      updatedExpense.totalCost = Number(quantity) * Number(costPerUnit);
      updatedExpense.supplierName = supplierName;
    } else if (expense.category === 'labour') {
      updatedExpense.labourCategory = labourCategory;
      updatedExpense.workerName = workerName;
      updatedExpense.numWorkers = Number(numWorkers);
      updatedExpense.dailyWage = Number(dailyWage);
      updatedExpense.totalAmount = Number(numWorkers) * Number(dailyWage);
    } else if (expense.category === 'transport') {
      updatedExpense.vehicleType = vehicleType;
      updatedExpense.description = description;
      updatedExpense.cost = Number(cost);
    } else {
      // Custom category
      updatedExpense.itemName = itemName;
      updatedExpense.quantity = Number(quantity);
      updatedExpense.costPerUnit = Number(costPerUnit);
      updatedExpense.totalCost = Number(quantity) * Number(costPerUnit);
      updatedExpense.supplierName = supplierName;
    }

    // Reset synced state as parameters got modified
    updatedExpense.synced = false;

    onSave(updatedExpense);
    onClose();
    alert('Voucher updated successfully! Sync Sheets to persist changes to Google Drive.');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs text-slate-800 dark:text-slate-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-150 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-orange-500/10 text-orange-655 rounded-lg">
              <Edit className="w-4 h-4" />
            </span>
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white font-display">Edit Voucher Entry</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Voucher ID</label>
              <input
                type="text"
                value={expense.id}
                disabled
                className="w-full text-xs p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 text-slate-400 dark:text-slate-500 rounded-xl outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Dynamic category-specific fields */}
          {expense.category === 'material' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Material Name</label>
                <input
                  type="text"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Rate per Unit ({currencySymbol})</label>
                  <input
                    type="number"
                    step="any"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Supplier Name</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {expense.category === 'labour' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Labour Type</label>
                  <input
                    type="text"
                    value={labourCategory}
                    onChange={(e) => setLabourCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Worker/Supervisor</label>
                  <input
                    type="text"
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">No. of Workers</label>
                  <input
                    type="number"
                    value={numWorkers}
                    onChange={(e) => setNumWorkers(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Daily Wage / Cost ({currencySymbol})</label>
                  <input
                    type="number"
                    step="any"
                    value={dailyWage}
                    onChange={(e) => setDailyWage(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {expense.category === 'transport' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Description / Route</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-550 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Freight / Fuel Cost ({currencySymbol})</label>
                <input
                  type="number"
                  step="any"
                  value={cost}
                  onChange={(e) => setCost(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-855 rounded-xl outline-none focus:ring-1 focus:ring-orange-550 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>
            </div>
          )}

          {expense.category !== 'material' && expense.category !== 'labour' && expense.category !== 'transport' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Item Title</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-550 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-550 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Rate per Unit ({currencySymbol})</label>
                  <input
                    type="number"
                    step="any"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-550 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Supplier / Provider</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-550 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Memo Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white resize-none"
              placeholder="Enter supervisor notes..."
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-2xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

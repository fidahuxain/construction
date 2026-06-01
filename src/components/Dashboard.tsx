/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Expense } from '../types';
import { 
  HardHat, 
  Truck, 
  FolderOpen, 
  Layers, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface DashboardProps {
  project: Project | null;
  expenses: { [id: string]: Expense };
}

export default function Dashboard({ project, expenses }: DashboardProps) {
  const [timeframe, setTimeframe] = useState<'all' | 'weekly' | 'monthly'>('all');

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-3xl dark:bg-slate-900 dark:border-slate-800">
        <HardHat className="w-12 h-12 text-slate-400 mb-4 animate-bounce" />
        <p className="text-slate-700 dark:text-slate-300 font-semibold font-display">No construction project selected.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create or select a project to open the dashboard view.</p>
      </div>
    );
  }

  // Filter project expenses
  const projectExpenses = Object.values(expenses).filter(e => e.projectId === project.id);

  // Time filtering
  const now = new Date();
  const filteredExpenses = projectExpenses.filter(exp => {
    if (timeframe === 'all') return true;
    const expDate = new Date(exp.date);
    const diffTime = Math.abs(now.getTime() - expDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (timeframe === 'weekly') return diffDays <= 7;
    if (timeframe === 'monthly') return diffDays <= 30;
    return true;
  });

  // Calculate numbers
  let materialTotal = 0;
  let labourTotal = 0;
  let transportTotal = 0;
  let customTotal = 0; // fallback for unlinked/deleted categories

  // Keep track of totals for each active custom category
  const customCategories = project.customCategories || [];
  const customTotals: { [catId: string]: number } = {};
  customCategories.forEach(cat => {
    customTotals[cat.id] = 0;
  });

  filteredExpenses.forEach(exp => {
    if (exp.category === 'material') {
      materialTotal += (exp as any).totalCost || 0;
    } else if (exp.category === 'labour') {
      labourTotal += (exp as any).totalAmount || 0;
    } else if (exp.category === 'transport') {
      transportTotal += (exp as any).cost || 0;
    } else {
      // Custom category total
      if (customTotals[exp.category] !== undefined) {
        customTotals[exp.category] += (exp as any).totalCost || (exp as any).cost || 0;
      } else {
        customTotal += (exp as any).totalCost || (exp as any).cost || 0;
      }
    }
  });

  const activeCustomTotal = Object.values(customTotals).reduce((a, b) => a + b, 0) + customTotal;
  const grandTotal = materialTotal + labourTotal + transportTotal + activeCustomTotal;
  const currencySymbol = project.currency || 'Rs.';

  // Format currency helper
  const formatValue = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Percentages
  const materialPct = grandTotal > 0 ? (materialTotal / grandTotal) * 100 : 0;
  const labourPct = grandTotal > 0 ? (labourTotal / grandTotal) * 100 : 0;
  const transportPct = grandTotal > 0 ? (transportTotal / grandTotal) * 100 : 0;
  const customPct = grandTotal > 0 ? (customTotal / grandTotal) * 100 : 0;

  // Sync statuses
  const syncedCount = filteredExpenses.filter(e => e.synced).length;
  const pendingCount = filteredExpenses.length - syncedCount;

  // Find daily trend (last 7 days of expenses)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const dailyTrendData = last7Days.map(dateStr => {
    const totalForDay = filteredExpenses
      .filter(e => e.date === dateStr)
      .reduce((sum, e) => {
        if (e.category === 'material') return sum + ((e as any).totalCost || 0);
        if (e.category === 'labour') return sum + ((e as any).totalAmount || 0);
        if (e.category === 'transport') return sum + ((e as any).cost || 0);
        // Custom or others
        return sum + ((e as any).totalCost || (e as any).cost || 0);
      }, 0);

    const label = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    return { dateLabel: label, amount: totalForDay, dateString: dateStr };
  });

  const maxDailyAmount = Math.max(...dailyTrendData.map(d => d.amount), 1000);

  return (
    <div className="space-y-6">
      {/* Overview Head & Site Details */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active construction site
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-display">{project.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            {project.location} {project.clientName ? `• Client: ${project.clientName}` : ''}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 mt-2.5">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Started: {project.startDate}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Logged Records: {projectExpenses.length} entries</span>
          </div>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl self-start md:self-center">
          {(['all', 'weekly', 'monthly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                timeframe === t
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t === 'all' ? 'All Time' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Cost Board Card */}
        <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-sm flex flex-col justify-between border border-slate-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accumulated Construction Cost</span>
            <div className="text-4xl font-black tracking-tight mt-1 text-orange-500 font-display">
              {formatValue(grandTotal)}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 mt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">{syncedCount} Synced to Sheets</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pendingCount} Pending Sync</span>
              </div>
            )}
          </div>
        </div>

        {/* Categories Breakdown Dashboard Widget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-450 tracking-wider dark:text-slate-500">Breakdown</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Expenses by Log type</p>
          </div>
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-blue-500" /> Materials</div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatValue(materialTotal)} ({materialPct.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5"><HardHat className="w-3.5 h-3.5 text-orange-550" /> Labour</div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatValue(labourTotal)} ({labourPct.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-cyan-500" /> Transport</div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatValue(transportTotal)} ({transportPct.toFixed(0)}%)</span>
            </div>
            {customCategories.map(cat => {
              const total = customTotals[cat.id] || 0;
              const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              return (
                <div key={cat.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5 text-teal-500" /> {cat.name}</div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatValue(total)} ({pct.toFixed(0)}%)</span>
                </div>
              );
            })}
            {customTotal > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5 text-slate-400" /> Other Custom</div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatValue(customTotal)} ({customPct.toFixed(0)}%)</span>
              </div>
            )}
          </div>
        </div>

        {/* Pacing Speedometer Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-450 tracking-wider dark:text-slate-500">Daily Average</span>
            <div className="text-2xl font-extrabold text-slate-905 dark:text-slate-100 mt-1 font-display">
              {formatValue(grandTotal / (filteredExpenses.length || 1))}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Normalized over current logged records</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-orange-500" />
            <span>Updated: {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Visual Charts: Vector Graphs and Proportional Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown Progress Bars */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 font-display">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            Category Share Value
          </h3>
          <div className="space-y-4">
            {/* Materials progress bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Materials & Concrete</span>
                <span className="font-semibold text-slate-950 dark:text-slate-50">{formatValue(materialTotal)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${materialPct}%` }}
                ></div>
              </div>
            </div>

            {/* Labour wage progress bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Labour & Contractors</span>
                <span className="font-semibold text-slate-950 dark:text-slate-50">{formatValue(labourTotal)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                  style={{ width: `${labourPct}%` }}
                ></div>
              </div>
            </div>

            {/* Transportation progress bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Fuel & Machinery Freight</span>
                <span className="font-semibold text-slate-950 dark:text-slate-50">{formatValue(transportTotal)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
                  style={{ width: `${transportPct}%` }}
                ></div>
              </div>
            </div>

            {customCategories.map(cat => {
              const total = customTotals[cat.id] || 0;
              const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              return (
                <div key={cat.id}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name} Log</span>
                    <span className="font-semibold text-slate-950 dark:text-slate-50">{formatValue(total)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {customTotal > 0 && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Other Custom Logs</span>
                  <span className="font-semibold text-slate-950 dark:text-slate-50">{formatValue(customTotal)}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-400 rounded-full transition-all duration-500" 
                    style={{ width: `${customPct}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Expense Burn-Down Bar Chart (SVG-based) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 font-display">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              Site Pacing - Daily Pours (Last 7 Days)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Max limit: {formatValue(maxDailyAmount)}</span>
          </div>

          {/* SVG Pacing Columns */}
          <div className="flex items-end justify-between h-56 pt-6 pb-2 border-b border-slate-150 dark:border-slate-800">
            {dailyTrendData.map((d, i) => {
              const heightPct = (d.amount / maxDailyAmount) * 100;
              const barHeight = Math.max(heightPct, d.amount > 0 ? 3 : 1); // minimum 3% height if greater than 0

              return (
                <div key={i} className="flex flex-col items-center flex-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-orange-400 text-xs px-2.5 py-1 rounded-lg pointer-events-none z-10 font-mono whitespace-nowrap shadow-md">
                    {formatValue(d.amount)}
                  </div>

                  {/* Bar Column */}
                  <div className="w-8 sm:w-10 rounded-t-xl overflow-hidden bg-slate-50 dark:bg-slate-800/40 flex items-end h-40">
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-700 origin-bottom ${
                        d.amount === 0 
                          ? 'bg-slate-100 dark:bg-slate-800' 
                          : 'bg-orange-500 group-hover:bg-orange-600 dark:bg-orange-600 dark:group-hover:bg-orange-500'
                      }`}
                      style={{ height: `${barHeight}%` }}
                    ></div>
                  </div>

                  {/* Date Caption */}
                  <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 text-center mt-2.5 font-medium truncate max-w-full">
                    {d.dateLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center italic">
            Hourly inputs sync to current dates. Hover above columns to view details.
          </p>
        </div>
      </div>
    </div>
  );
}

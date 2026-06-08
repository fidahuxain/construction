/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Expense, AppState } from './types';

const STORAGE_KEY = 'construction_expense_tracker_state';

const defaultProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Greenwood Heights Apartment',
    location: '45 Sector G, North Block',
    startDate: '2026-03-01',
    clientName: 'Greenwood Realty Corp',
    createdAt: new Date().toISOString(),
    currency: 'Rs.',
    materialStocks: [
      { id: 'stock-1', name: 'UltraTech Cement', unit: 'bags', availableStock: 350, totalOrdered: 500 },
      { id: 'stock-2', name: 'River Sand', unit: 'ton', availableStock: 45, totalOrdered: 80 },
      { id: 'stock-3', name: 'Red Bricks', unit: 'pieces', availableStock: 8000, totalOrdered: 10000 },
      { id: 'stock-4', name: 'Structural Steel Rods', unit: 'ton', availableStock: 12, totalOrdered: 20 },
    ]
  },
  {
    id: 'proj-2',
    name: 'DownTown Commercial Hub',
    location: 'Downtown Commercial Wing, Block 3CA',
    startDate: '2026-05-10',
    clientName: 'Apex Developments',
    createdAt: new Date().toISOString(),
    currency: 'Rs.',
    materialStocks: [
      { id: 'stock-5', name: 'Structural Mild Steel Rods (12mm)', unit: 'ton', availableStock: 15, totalOrdered: 20 },
      { id: 'stock-6', name: 'OPC Cement', unit: 'bags', availableStock: 200, totalOrdered: 300 },
    ]
  }
];

const defaultExpenses: { [id: string]: Expense } = {
  'exp-1': {
    id: 'exp-1',
    projectId: 'proj-1',
    category: 'material',
    date: '2026-05-25',
    createdAt: new Date().toISOString(),
    synced: false,
    materialName: 'UltraTech Cement',
    quantity: 150,
    unit: 'bags',
    costPerUnit: 420,
    totalCost: 63000,
    supplierName: 'Sai Builders & Suppliers',
    notes: 'Base foundation footing pour material.'
  },
  'exp-2': {
    id: 'exp-2',
    projectId: 'proj-1',
    category: 'labour',
    date: '2026-05-26',
    createdAt: new Date().toISOString(),
    synced: false,
    workerName: 'Ram Singh & Crew',
    labourCategory: 'mason',
    numWorkers: 8,
    dailyWage: 650,
    totalAmount: 5200,
    notes: 'Plinth level construction laying brick layers.'
  },
  'exp-3': {
    id: 'exp-3',
    projectId: 'proj-1',
    category: 'transport',
    date: '2026-05-27',
    createdAt: new Date().toISOString(),
    synced: false,
    vehicleType: 'Tractor Trolley',
    description: 'River sand delivery (3 trolleys)',
    cost: 12500,
    notes: 'Fine grade construction sand for plastering.'
  },
  'exp-5': {
    id: 'exp-5',
    projectId: 'proj-2',
    category: 'material',
    date: '2026-05-28',
    createdAt: new Date().toISOString(),
    synced: false,
    materialName: 'Structural Mild Steel Rods (12mm)',
    quantity: 2.5,
    unit: 'ton',
    costPerUnit: 650,
    totalCost: 1625,
    supplierName: 'Titanium Steel Depot',
    notes: 'Pillar reinforcement works.'
  },
  'exp-6': {
    id: 'exp-6',
    projectId: 'proj-2',
    category: 'labour',
    date: '2026-05-29',
    createdAt: new Date().toISOString(),
    synced: false,
    workerName: 'John Doe Contracting',
    labourCategory: 'foreman',
    numWorkers: 1,
    dailyWage: 300,
    totalAmount: 300,
    notes: 'Supervision & marking work.'
  }
};

export const getInitialState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean google login info on fresh startup to keep it in-memory as instructed
      if (parsed.googleUser) {
        parsed.googleUser.accessToken = null;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse state from localStorage, resetting...', e);
  }

  return {
    projects: defaultProjects,
    expenses: defaultExpenses,
    activeProjectId: 'proj-1',
    theme: 'light',
    currency: 'Rs.',
    googleUser: null,
    syncQueue: [],
    companyDetails: {
      name: 'ConstructSync Corporate Ltd',
      phone: '+92 300 8765432',
      email: 'logistics@constructsync.pk',
      address: 'Suite 101, Core Engineers Heights, Lahore',
      gstNum: 'NTN-8765432-1'
    },
    backupInterval: 15,
    autoBackupEnabled: false,
    authorized: false,
  };
};

export const saveState = (state: AppState) => {
  try {
    // We shouldn't store actual Google user access tokens in localStorage for security
    const stateToSave = {
      ...state,
      googleUser: state.googleUser ? { ...state.googleUser, accessToken: null } : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
};

// CSV Export and Parsing Utility
export const convertExpensesToCSV = (expensesList: Expense[], projectName: string): string => {
  const headers = [
    'Date',
    'Category',
    'Item/Description',
    'Supplier/Worker',
    'Quantity',
    'Unit',
    'Daily Wage/Cost per Unit',
    'Total Cost',
    'Notes',
    'Synced'
  ];

  const rows = expensesList.map(exp => {
    let itemDescription = '';
    let supplierWorker = '';
    let qty = '';
    let unit = '';
    let rate = '';
    let total = '';

    const rawExp = exp as any;

    if (exp.category === 'material') {
      itemDescription = rawExp.materialName || '';
      supplierWorker = rawExp.supplierName || '';
      qty = String(rawExp.quantity || '');
      unit = rawExp.unit || '';
      rate = String(rawExp.costPerUnit || '');
      total = String(rawExp.totalCost || '');
    } else if (exp.category === 'labour') {
      itemDescription = `Labour - ${rawExp.labourCategory || ''}`;
      supplierWorker = rawExp.workerName || '';
      qty = String(rawExp.numWorkers || '');
      unit = 'workers';
      rate = String(rawExp.dailyWage || '');
      total = String(rawExp.totalAmount || '');
    } else if (exp.category === 'transport') {
      itemDescription = `${rawExp.vehicleType || ''} - ${rawExp.description || ''}`;
      total = String(rawExp.cost || '');
    } else {
      // Custom tab item
      itemDescription = rawExp.itemName || 'Custom Item Log';
      supplierWorker = rawExp.supplierName || '';
      qty = String(rawExp.quantity || '1');
      unit = rawExp.unit || 'pcs';
      rate = String(rawExp.costPerUnit || '0');
      total = String(rawExp.totalCost || '0');
    }

    return [
      exp.date,
      exp.category.toUpperCase(),
      `"${itemDescription.replace(/"/g, '""')}"`,
      `"${supplierWorker.replace(/"/g, '""')}"`,
      qty,
      unit,
      rate,
      total,
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
      exp.synced ? 'YES' : 'NO'
    ];
  });

  return [
    `"Project Report: ${projectName.replace(/"/g, '""')}"`,
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');
};

// Download File helper for Browser
export const downloadFile = (content: string, fileName: string, contentType: string) => {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CustomCategory {
  id: string;
  name: string;
  iconName?: string;
  enableStockTracking?: boolean;
}

export interface MaterialStock {
  id: string;
  name: string;
  unit: string;
  availableStock: number;
  totalOrdered: number;
  lastOrderedDate?: string;
  category?: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  startDate: string;
  clientName?: string;
  constructorName?: string;
  notes?: string;
  createdAt: string;
  currency: string;
  googleSheetId?: string;
  lastSyncedAt?: string;
  customCategories?: CustomCategory[];
  materialStocks?: MaterialStock[];
}

export type ExpenseCategory = 'material' | 'labour' | 'transport' | string;

export interface BaseExpense {
  id: string;
  projectId: string;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  receiptImage?: string; // Base64 or Blob URL
  createdAt: string;
  synced: boolean;
  stockStatus?: 'Consumed' | 'New Order';
  remainingStock?: number;
}

export interface MaterialExpense extends BaseExpense {
  category: 'material';
  materialName: string;
  quantity: number;
  unit: string; // bags, kg, ton, ft, cubic meters, etc.
  costPerUnit: number;
  totalCost: number;
  supplierName?: string;
}

export interface LabourExpense extends BaseExpense {
  category: 'labour';
  workerName: string;
  labourCategory: string; // mason, electrician, helper, plumber, foreman, etc.
  numWorkers: number;
  dailyWage: number;
  totalAmount: number;
}

export interface TransportExpense extends BaseExpense {
  category: 'transport';
  vehicleType: string; // dumper, truck, tractor, pickup, bike, fuel, etc.
  description: string;
  cost: number;
}

export interface CustomExpense extends BaseExpense {
  itemName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  supplierName?: string;
}

export type Expense = MaterialExpense | LabourExpense | TransportExpense | CustomExpense;

export interface AppState {
  projects: Project[];
  expenses: { [id: string]: Expense };
  activeProjectId: string | null;
  theme: 'light' | 'dark';
  currency: string; // Default currency, e.g., ₹, $, €, £
  googleUser: {
    accessToken: string | null;
    email: string | null;
    name: string | null;
  } | null;
  syncQueue: {
    expenseId: string;
    action: 'create' | 'update' | 'delete';
  }[];
}

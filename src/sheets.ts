/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Expense } from './types';

// Google Sheets API Integration
export interface SyncResult {
  success: boolean;
  message: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
}

/**
 * Creates a new Google Spreadsheet for a Project and initializes tabs
 */
export async function createProjectSpreadsheet(
  project: Project,
  accessToken: string
): Promise<SyncResult> {
  try {
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `🚧 ${project.name} - Expense Sheet`,
        },
        sheets: [
          { properties: { title: 'Dashboard Summary' } },
          { properties: { title: 'Materials Log' } },
          { properties: { title: 'Labour Log' } },
          { properties: { title: 'Transportation Log' } },
          ...(project.customCategories || []).map(cat => ({
            properties: { title: `${cat.name} Log` }
          }))
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'Failed to create spreadsheet');
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl;

    // Now, format the header columns for each sheet/tab
    await initializeSheetHeaders(spreadsheetId, project, accessToken);

    return {
      success: true,
      message: 'Created spreadsheet successfully!',
      spreadsheetId,
      spreadsheetUrl,
    };
  } catch (error: any) {
    console.error('Error creating spreadsheet:', error);
    return {
      success: false,
      message: error.message || 'Error occurred while creating spreadsheet.',
    };
  }
}

/**
 * Initializes Headers in each project sheet tab
 */
async function initializeSheetHeaders(spreadsheetId: string, project: Project, accessToken: string) {
  const headersMap: { [key: string]: any[][] } = {
    'Dashboard Summary!A1:D1': [['Category', 'Description/KPI', 'Total Cost', 'Last Updated At']],
    'Materials Log!A1:J1': [['Date', 'Material Name', 'Supplier Name', 'Quantity', 'Unit', 'Rate per Unit', 'Total Cost', 'Stock Status', 'Remaining Stock', 'Notes']],
    'Labour Log!A1:G1': [['Date', 'Worker Name', 'Labour Category', 'No. of Workers', 'Daily Wage', 'Total Amount', 'Notes']],
    'Transportation Log!A1:E1': [['Date', 'Vehicle Type', 'Description', 'Fuel/Transport Cost', 'Notes']],
  };

  if (project.customCategories) {
    project.customCategories.forEach(cat => {
      headersMap[`${cat.name} Log!A1:J1`] = [['Date', 'Item Name', 'Supplier/Provider', 'Quantity', 'Unit', 'Rate per Unit', 'Total Cost', 'Stock Status', 'Remaining Stock', 'Notes']];
    });
  }

  for (const [range, values] of Object.entries(headersMap)) {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        }
      );
    } catch (e) {
      console.error(`Failed to initialize headers for range ${range}`, e);
    }
  }
}

/**
 * Syncs multiple expenses to a specific Google Spreadsheet
 */
export async function syncExpensesToSpreadsheet(
  spreadsheetId: string,
  project: Project,
  expenses: Expense[],
  accessToken: string
): Promise<{ success: boolean; message: string; rowsSynced: number }> {
  try {
    let rowsSynced = 0;

    // Auto-create missing tabs on active Google spreadsheets dynamically
    if (!spreadsheetId.startsWith('mock_') && !spreadsheetId.startsWith('1Mock')) {
      try {
        const metaResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        });
        if (metaResponse.ok) {
          const metaData = await metaResponse.json();
          const existingTitles: string[] = (metaData.sheets || []).map((s: any) => s.properties.title);
          
          const neededTabs = [
            'Dashboard Summary',
            'Materials Log',
            'Labour Log',
            'Transportation Log',
            ...(project.customCategories || []).map(cat => `${cat.name} Log`)
          ];
          
          const missingTabs = neededTabs.filter(title => !existingTitles.includes(title));
          
          if (missingTabs.length > 0) {
            // Batch create the missing sheet tabs in Google Sheets
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                requests: missingTabs.map(title => ({
                  addSheet: {
                    properties: { title }
                  }
                }))
              }),
            });
            
            // Populate headers on newly created sheet tabs
            const newHeadersMap: { [key: string]: any[][] } = {};
            missingTabs.forEach(title => {
              if (title === 'Dashboard Summary') {
                newHeadersMap['Dashboard Summary!A1:D1'] = [['Category', 'Description/KPI', 'Total Cost', 'Last Updated At']];
              } else if (title === 'Materials Log') {
                newHeadersMap['Materials Log!A1:J1'] = [['Date', 'Material Name', 'Supplier Name', 'Quantity', 'Unit', 'Rate per Unit', 'Total Cost', 'Stock Status', 'Remaining Stock', 'Notes']];
              } else if (title === 'Labour Log') {
                newHeadersMap['Labour Log!A1:G1'] = [['Date', 'Worker Name', 'Labour Category', 'No. of Workers', 'Daily Wage', 'Total Amount', 'Notes']];
              } else if (title === 'Transportation Log') {
                newHeadersMap['Transportation Log!A1:E1'] = [['Date', 'Vehicle Type', 'Description', 'Fuel/Transport Cost', 'Notes']];
              } else {
                newHeadersMap[`${title}!A1:J1`] = [['Date', 'Item Name', 'Supplier/Provider', 'Quantity', 'Unit', 'Rate per Unit', 'Total Cost', 'Stock Status', 'Remaining Stock', 'Notes']];
              }
            });
            
            for (const [range, values] of Object.entries(newHeadersMap)) {
              await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
                {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ values }),
                }
              );
            }
          }
        }
      } catch (err) {
        console.warn('Could not verify/create missing spreadsheet tabs dynamically:', err);
      }
    }

    // Clear existing values in logs before re-syncing to avoid duplication
    const materials = expenses.filter(e => e.category === 'material');
    const labours = expenses.filter(e => e.category === 'labour');
    const transports = expenses.filter(e => e.category === 'transport');

    // Sync Materials
    if (materials.length > 0) {
      const values = materials.map(e => {
        const m = e as any;
        return [
          m.date,
          m.materialName,
          m.supplierName || '',
          m.quantity,
          m.unit,
          m.costPerUnit,
          m.totalCost,
          m.stockStatus || '',
          m.remainingStock !== undefined ? m.remainingStock : '',
          m.notes || ''
        ];
      });
      await overwriteSheetTab(spreadsheetId, 'Materials Log!A2:J', values, accessToken);
      rowsSynced += materials.length;
    }

    // Sync Labour
    if (labours.length > 0) {
      const values = labours.map(e => {
        const l = e as any;
        return [l.date, l.workerName, l.labourCategory, l.numWorkers, l.dailyWage, l.totalAmount, l.notes || ''];
      });
      await overwriteSheetTab(spreadsheetId, 'Labour Log!A2:G', values, accessToken);
      rowsSynced += labours.length;
    }

    // Sync Transportation
    if (transports.length > 0) {
      const values = transports.map(e => {
        const t = e as any;
        return [t.date, t.vehicleType, t.description, t.cost, t.notes || ''];
      });
      await overwriteSheetTab(spreadsheetId, 'Transportation Log!A2:E', values, accessToken);
      rowsSynced += transports.length;
    }

    // Sync Custom Categories
    let totalCustom = 0;
    const customSummaryRows: any[][] = [];
    if (project.customCategories) {
      for (const cat of project.customCategories) {
        const catExpenses = expenses.filter(e => e.category === cat.id);
        const catTotal = catExpenses.reduce((sum, e: any) => sum + (e.totalCost || 0), 0);
        totalCustom += catTotal;

        if (catExpenses.length > 0) {
          const values = catExpenses.map((e: any) => [
            e.date,
            e.itemName || '',
            e.supplierName || e.supplierOrProvider || '',
            e.quantity || '',
            e.unit || '',
            e.costPerUnit || '',
            e.totalCost || '',
            e.stockStatus || '',
            e.remainingStock !== undefined ? e.remainingStock : '',
            e.notes || ''
          ]);
          await overwriteSheetTab(spreadsheetId, `${cat.name} Log!A2:J`, values, accessToken);
          rowsSynced += catExpenses.length;
        }

        customSummaryRows.push([
          `${cat.name} Expense`,
          `Custom Tab: ${cat.name} entries`,
          catTotal,
          new Date().toLocaleString()
        ]);
      }
    }

    // Calculate details for Dashboard Summary tab
    const totalMaterials = materials.reduce((sum, e: any) => sum + e.totalCost, 0);
    const totalLabour = labours.reduce((sum, e: any) => sum + e.totalAmount, 0);
    const totalTransport = transports.reduce((sum, e: any) => sum + e.cost, 0);
    const totalConsumed = expenses.filter(e => e.stockStatus === 'Consumed').reduce((sum, e: any) => sum + (e.totalCost || e.totalAmount || e.cost || 0), 0);
    const totalCost = totalMaterials + totalLabour + totalTransport + totalCustom;

    const summaryValues = [
      ['Materials Expense', 'Total steel, cement, brick, etc. cost', totalMaterials, new Date().toLocaleString()],
      ['Labour Expense', 'Total wages for masons, helpers, electricians', totalLabour, new Date().toLocaleString()],
      ['Transportation Expense', 'Fuel deliveries, tractor/truck rental cost', totalTransport, new Date().toLocaleString()],
      ...customSummaryRows,
      ['TOTAL CONSUMED STOCK VALUE', 'Separate Ledger: Accumulation of active stocks consumed on site', totalConsumed, new Date().toLocaleString()],
      ['GRAND TOTAL PROJECT COST', 'Total accumulated construction costs', totalCost, new Date().toLocaleString()],
    ];

    const rangeEndLine = 4 + customSummaryRows.length + 2; // Default lines + custom categories + TOTAL CONSUMED + GRAND TOTAL
    await overwriteSheetTab(spreadsheetId, `Dashboard Summary!A2:D${rangeEndLine}`, summaryValues, accessToken);

    return {
      success: true,
      message: `Synced ${rowsSynced} records successfully to Google Sheets!`,
      rowsSynced,
    };
  } catch (error: any) {
    console.error('Error syncing expenses:', error);
    return {
      success: false,
      message: error.message || 'Error occurred while syncing with Google Sheets.',
      rowsSynced: 0,
    };
  }
}

/**
 * Helper to overwrite a specific sheet tab range with values
 */
async function overwriteSheetTab(
  spreadsheetId: string,
  range: string,
  values: any[][],
  accessToken: string
) {
  // First clear the range to make sure older rows don't linger if there are fewer rows now
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.warn('Failed to clear sheet range before writing', err);
  }

  // Write new values
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || `Failed to update range ${range}`);
  }
}

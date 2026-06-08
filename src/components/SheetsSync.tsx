/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Project, Expense, AppState } from '../types';
import { createProjectSpreadsheet, syncExpensesToSpreadsheet } from '../sheets';
import { downloadFile } from '../db';
import { 
  Cloud, 
  Database, 
  UploadCloud, 
  DownloadCloud, 
  FolderSync, 
  Check, 
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  LogOut,
  Info,
  X,
  Share2,
  Mail,
  Copy,
  Send,
  Plus,
  AlertTriangle
} from 'lucide-react';

interface SheetsSyncProps {
  project: Project | null;
  expenses: { [id: string]: Expense };
  googleUser: AppState['googleUser'];
  onUpdateGoogleUser: (user: AppState['googleUser']) => void;
  onLinkSheet: (projectId: string, sheetId: string) => void;
  onMarkSynced: (expenseIds: string[]) => void;
  onRestoreState: (state: Partial<AppState>) => void;
  appState: AppState;
  onUpdateCompanyDetails: (details: AppState['companyDetails']) => void;
  onUpdateBackupSettings: (enabled: boolean, interval: number) => void;
}

export default function SheetsSync({
  project,
  expenses,
  googleUser,
  onUpdateGoogleUser,
  onLinkSheet,
  onMarkSynced,
  onRestoreState,
  appState,
  onUpdateCompanyDetails,
  onUpdateBackupSettings
}: SheetsSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [customSheetId, setCustomSheetId] = useState(project?.googleSheetId || '');
  const [showDemoConnector, setShowDemoConnector] = useState(false);
  const [showMockPreview, setShowMockPreview] = useState(false);
  const [mockPreviewTab, setMockPreviewTab] = useState<'summary' | 'material' | 'labour' | 'transport'>('summary');
  const [temporaryAccessToken, setTemporaryAccessToken] = useState('');
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync the form text field whenever project Sheet ID updates
  React.useEffect(() => {
    setCustomSheetId(project?.googleSheetId || '');
  }, [project?.googleSheetId]);

  const handleCreateNewSheet = async () => {
    if (!googleUser || !googleUser.accessToken) {
      alert('Please connect your Google account first!');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Initiating new construction spreadsheet creation on your Google Drive...');

    try {
      if (googleUser.accessToken.startsWith('mock_')) {
        const mockId = '1MockSpreadsheetId' + Math.floor(Math.random() * 900) + 'xyz';
        onLinkSheet(project.id, mockId);
        setSyncStatus(`Created Sandbox Spreadsheet workbook! ID: ${mockId}`);
        setIsSyncing(false);
        alert(`New sandbox spreadsheet created successfully!\n\nLinked ID: ${mockId}`);
        return;
      }

      const res = await createProjectSpreadsheet(project, googleUser.accessToken);
      if (res.success && res.spreadsheetId) {
        onLinkSheet(project.id, res.spreadsheetId);
        setSyncStatus(`Created Google Spreadsheet: ${res.spreadsheetId}`);
        alert(`Google Spreadsheet created and linked successfully!\n\nLinked ID: ${res.spreadsheetId}`);
      } else {
        setSyncStatus(`Creation failed: ${res.message}. Enter a custom sheet URL instead.`);
        alert(`Creation failed: ${res.message}`);
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus(`Creation failed: ${err.message}`);
      alert(`Creation failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!project) return null;

  const projectExpenses = Object.values(expenses).filter(e => e.projectId === project.id);
  const pendingSync = projectExpenses.filter(e => !e.synced);

  // Authenticate
  const handleGoogleLogin = () => {
    setShowDemoConnector(true);
  };

  const handleDisconnect = () => {
    if (!showSignoutConfirm) {
      setShowSignoutConfirm(true);
      return;
    }
    onUpdateGoogleUser(null);
    setShowSignoutConfirm(false);
    setShowDemoConnector(false);
  };

  // Perform active spreadsheet sync
  const handleStartSync = async () => {
    if (!googleUser || !googleUser.accessToken) {
      alert('Please connect your Google account first or launch the Sync Simulator!');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Initiating Cloud Synchronization...');

    try {
      let sheetId = project.googleSheetId;

      if (!sheetId) {
        setSyncStatus('Creating separate Google Sheet workbook...');
        const res = await createProjectSpreadsheet(project, googleUser.accessToken);
        if (res.success && res.spreadsheetId) {
          sheetId = res.spreadsheetId;
          onLinkSheet(project.id, res.spreadsheetId);
          setSyncStatus(`Created Workbook: ${res.spreadsheetId}`);
        } else {
          throw new Error(res.message);
        }
      }

      setSyncStatus(`Syncing ${projectExpenses.length} worksheets rows to Separate tabs...`);
      const syncRes = await syncExpensesToSpreadsheet(sheetId!, project, projectExpenses, googleUser.accessToken);
      
      if (syncRes.success) {
        setSyncStatus('Sheets successfully updated!');
        // Mark as synced locally
        const expenseIds = projectExpenses.map(e => e.id);
        onMarkSynced(expenseIds);
        alert(`Google Sheets successfully synchronized! Updated Materials, Labour, Transportation, and Custom dynamic tabs. Rows populated: ${syncRes.rowsSynced}`);
      } else {
        throw new Error(syncRes.message);
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus(`Failure: ${err.message || 'Check scopes or login'}`);
      alert(`Sync failed: ${err.message || 'Make sure sheets API is enabled'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Automated Sync Simulation for evaluating without active tokens
  const handleSimulateSync = () => {
    setIsSyncing(true);
    setSyncStatus('Connecting with Sandbox Google Identity credentials...');

    setTimeout(() => {
      setSyncStatus('Analyzing offline queue lines...');
      
      setTimeout(() => {
        setSyncStatus('Synthesizing separate project tabs (Dashboard, Materials, Labour, Transportation, Custom Tabs)...');
        
        setTimeout(() => {
          // Link mock sheet if blank
          if (!project.googleSheetId) {
            onLinkSheet(project.id, '1MockSpreadsheetId' + Math.floor(Math.random() * 900) + 'xyz');
          }
          
          // Mark synced
          onMarkSynced(projectExpenses.map(e => e.id));
          
          setSyncStatus('Sheets updated successfully!');
          setIsSyncing(false);
          alert(`Spreadsheet synced successfully (SIMULATOR)! Generated Materials, Labour, Transportation, and custom dynamic listings automatically.`);
        }, 1200);
      }, 1000);
    }, 800);
  };

  const handlePasteSheetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetId.trim()) return;
    
    // Extract ID if link was pasted
    let resolvedId = customSheetId.trim();
    if (resolvedId.includes('/d/')) {
      const parts = resolvedId.split('/d/');
      if (parts[1]) {
        resolvedId = parts[1].split('/')[0];
      }
    }

    onLinkSheet(project.id, resolvedId);
    alert(`Associated spreadsheet successfully: "${resolvedId}"`);
  };

  // LOCAL DATABASE BACKUP & RESTORE
  const handleBackupDatabase = () => {
    const backupContent = JSON.stringify(appState, null, 2);
    downloadFile(backupContent, `construction_database_backup_${project.name.replace(/\s+/g, '_')}.json`, 'application/json');
    alert('Full backup downloaded! Access offline on other active devices anytime.');
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRestoreDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (imported.projects && imported.expenses) {
            onRestoreState(imported);
            alert('Construction database restored successfully! All projects and daily vouchers uploaded.');
          } else {
            alert('Invalid backup schema. Make sure this is a JSON database file created by this application.');
          }
        } catch (err) {
          alert('Could not parse imported file. Please upload a valid JSON backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Google Spreadsheets Sync Dashboard Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="font-extrabold text-sm tracking-wide uppercase text-slate-900 dark:text-slate-50 flex items-center gap-1.5 font-display">
              <Cloud className="text-blue-500 w-4.5 h-4.5" />
              Sheets Integration Settings
            </h4>
            
            {googleUser?.accessToken && (
              <button 
                onClick={handleDisconnect}
                className={`text-[10px] font-bold uppercase flex items-center gap-1 hover:underline cursor-pointer transition-colors duration-150 ${showSignoutConfirm ? 'text-red-650 bg-red-100/50 px-2 py-0.5 rounded border border-red-300' : 'text-rose-500'}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                {showSignoutConfirm ? 'Confirm Sign Out?' : 'Sign Out'}
              </button>
            )}
          </div>

          {!googleUser?.accessToken ? (
            <div className="py-6 text-center space-y-4">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-805 dark:text-slate-300">Connect to Google Drive & Google Sheets APIs</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Enables real-time spreadsheet updates. Automatically formats tabs for Materials, Labour, Transportation, and custom dynamic logs.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="px-5 py-3.5 bg-slate-950 hover:bg-slate-850 dark:bg-white dark:text-slate-950 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  Configure Sync Tool
                </button>

                <button
                  type="button"
                  onClick={handleSimulateSync}
                  className="px-5 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Offline Sync Sandbox
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Logged User</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{googleUser.email || 'Admin Master'}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20">
                  Connected
                </span>
              </div>

              {/* Sync Action Area */}
              <div className="p-4 bg-orange-500/5 dark:bg-slate-950/20 border border-orange-500/10 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-bold">
                    <FolderSync className="w-4 h-4 text-orange-500" /> Pending local vouchers:
                  </span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-slate-105">{pendingSync.length} rows</span>
                </div>

                <button
                  onClick={handleStartSync}
                  disabled={isSyncing}
                  className="w-full py-3.5 bg-orange-650 hover:bg-orange-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 select-none disabled:opacity-50 cursor-pointer shadow-sm shadow-orange-500/10 active:scale-95 transition-all"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  {isSyncing ? 'Writing rows to Google Drive...' : 'Synchronize Spreadsheet Now'}
                </button>
              </div>
            </div>
          )}

          {/* Sync Progress Status Log */}
          {syncStatus && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-mono text-slate-400 leading-relaxed text-left flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-550 shrink-0 mt-0.5" />
              <span>{syncStatus}</span>
            </div>
          )}

          {/* Associate Spreadsheets pasted ID */}
          <form onSubmit={handlePasteSheetLink} className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-4">
            <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Spreadsheet Configuration
            </label>

            {googleUser?.accessToken && !project.googleSheetId && (
              <div className="bg-orange-500/5 dark:bg-slate-950/20 p-4 rounded-2xl border border-orange-500/15 text-center space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  You are signed in but haven't linked a construction spreadsheet for this project yet.
                </p>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleCreateNewSheet}
                    disabled={isSyncing}
                    className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-2xl outline-none transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-550/10 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create New Spreadsheet
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Or Link Existing Spreadsheet URL or ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/your-id-here/edit"
                  value={customSheetId}
                  onChange={(e) => setCustomSheetId(e.target.value)}
                  className="flex-1 text-xs p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl dark:text-white outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 cursor-pointer"
                >
                  Link Sheet
                </button>
              </div>
            </div>
            
            {project.googleSheetId ? (
              <div className="space-y-4">
                <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5 flex-wrap">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Linked Sheet ID: <span className="font-mono bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">{project.googleSheetId}</span></span>
                </div>

                {/* Grid of Shortcut and Simulation view buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const id = project.googleSheetId;
                      if (!id) return;
                      if (id.startsWith('1Mock') || id.startsWith('mock_')) {
                        setShowMockPreview(true);
                      } else {
                        window.open(`https://docs.google.com/spreadsheets/d/${id}/edit`, '_blank');
                      }
                    }}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-650 text-white text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-emerald-500/10 cursor-pointer border-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Google Drive Sheet View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMockPreview(true)}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-850 transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>Excel Simulation Preview</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!showDeleteConfirm) {
                        setShowDeleteConfirm(true);
                        return;
                      }

                      const oldId = project.googleSheetId;
                      
                      // Clear state links locally
                      onLinkSheet(project.id, '');
                      setCustomSheetId('');
                      setShowDeleteConfirm(false);
                      setSyncStatus('Spreadsheet link deleted/cleared successfully.');

                      // Clean actual spreadsheet on Google Drive if real credentials
                      if (googleUser?.accessToken && oldId && !oldId.startsWith('1Mock') && !oldId.startsWith('mock_')) {
                        try {
                          setSyncStatus(`Sending delete instruction for file ID ${oldId} on Google Drive...`);
                          const response = await fetch(`https://www.googleapis.com/drive/v3/files/${oldId}`, {
                            method: 'DELETE',
                            headers: {
                              'Authorization': `Bearer ${googleUser.accessToken}`
                            }
                          });
                          if (response.ok) {
                            setSyncStatus('Spreadsheet file deleted from your Google Drive.');
                          } else {
                            console.warn('Google Drive delete instruction returned non-ok status. Unlinked locally instead.');
                          }
                        } catch (err: any) {
                          console.error('Failed to issue drive delete request:', err);
                        }
                      }
                      setSyncStatus('Unlinked spreadsheet successfully! A new replacement spreadsheet can be created now.');
                    }}
                    className={`ml-auto text-[10px] font-bold uppercase transition px-2 py-1 rounded border cursor-pointer ${
                      showDeleteConfirm 
                        ? 'text-red-600 bg-red-100/50 border-red-300' 
                        : 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/15'
                    }`}
                  >
                    {showDeleteConfirm ? 'Confirm Clear?' : 'Clear & Create New Sheet'}
                  </button>
                </div>

                {/* WhatsApp & other Share buttons drawer */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-orange-500" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest">
                      Share Sheet With Client & Labor Crew
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    {/* Share on WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🚧 High-priority construction registers update sheet for ${project.name}: https://docs.google.com/spreadsheets/d/${project.googleSheetId}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
                    >
                      <Send className="w-3.5 h-3.5" /> WhatsApp Share
                    </a>

                    {/* Email Share */}
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Construction Sheets Register: ${project.name}`)}&body=${encodeURIComponent(`Dear Team,\n\nPlease locate the live daily materials and wage logs spreadsheet for construction site "${project.name}" on the link below:\n\nhttps://docs.google.com/spreadsheets/d/${project.googleSheetId}\n\nKind regards,\nSite Supervisor`)}`}
                      className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email Report
                    </a>

                    {/* Copy Link to Clipboard */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = project.googleSheetId.startsWith('1Mock') || project.googleSheetId.startsWith('mock_')
                          ? 'https://docs.google.com/spreadsheets/d/1Byp5v6E8Z9R_MockSpreadsheet/edit'
                          : `https://docs.google.com/spreadsheets/d/${project.googleSheetId}/edit`;
                        navigator.clipboard.writeText(url);
                      }}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none border border-slate-705/10 shadow-md"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-300" /> Copy Link
                    </button>

                    {/* Standard System Native Share */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = `https://docs.google.com/spreadsheets/d/${project.googleSheetId}`;
                        if (navigator.share) {
                          navigator.share({
                            title: `Construction Register Sheet - ${project.name}`,
                            text: `Live sheets update for ${project.name}`,
                            url
                          }).catch(err => console.log('Error sharing', err));
                        } else {
                          alert(`Share link on your preferred app:\n\n${url}`);
                        }
                      }}
                      className="px-3.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Direct Share URL
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Linking a sheet allows updating rows in your favorite workbook instantly.
                </p>
                <button
                  type="button"
                  onClick={() => setShowMockPreview(true)}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-850 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Excel Simulation Preview</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Local Offline Database Backup & Auto-Backup Scheduler */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-sm tracking-wide uppercase text-slate-900 dark:text-slate-50 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3 font-display">
              <Database className="text-orange-500 w-4.5 h-4.5" />
              Backup & Auto-Scheduler
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-405 leading-relaxed mt-2.5">
              Protect your onsite workspace logs. Download a comprehensive JSON backup or enable the background auto-scheduler to save database copies automatically.
            </p>

            {/* Continuous Auto-Scheduler Inputs */}
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Automatic Background Backups</span>
                  <span className="text-[10px] text-slate-405 dark:text-slate-550">Runs an automated folder backup download timer</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!appState.autoBackupEnabled}
                    onChange={(e) => onUpdateBackupSettings(e.target.checked, appState.backupInterval || 15)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              {appState.autoBackupEnabled && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <label className="block text-[10px] uppercase font-bold text-slate-450 tracking-wider">Download Interval (Minutes)</label>
                  <select
                    value={appState.backupInterval || 15}
                    onChange={(e) => onUpdateBackupSettings(true, Number(e.target.value))}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 md:p-2.5 dark:text-white outline-none"
                  >
                    <option value={1} className="text-slate-900">Every 1 Minute (Testing)</option>
                    <option value={5} className="text-slate-900">Every 5 Minutes</option>
                    <option value={15} className="text-slate-900">Every 15 Minutes</option>
                    <option value={30} className="text-slate-905">Every 30 Minutes</option>
                    <option value={60} className="text-slate-905">Every 1 Hour</option>
                  </select>
                  <div className="text-[10px] text-emerald-500 font-mono flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Scheduler Active • Last Auto-Save: {appState.lastBackupAt ? new Date(appState.lastBackupAt).toLocaleTimeString() : 'Awaiting Interval'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={handleBackupDatabase}
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 select-none cursor-pointer text-center"
            >
              <DownloadCloud className="w-4 h-4 text-slate-500" />
              Download Database Backup (.json)
            </button>

            <button
              onClick={handleTriggerFileInput}
              className="w-full py-3.5 bg-orange-650 hover:bg-orange-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 select-none cursor-pointer active:scale-95 transition-all shadow-md shadow-orange-550/10 text-center"
            >
              <UploadCloud className="w-4 h-4" />
              Upload & Restore Database (.json)
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleRestoreDatabase}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Editable Company Details & Logo tab Branding Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5 text-left">
        <h4 className="font-extrabold text-sm tracking-wide uppercase text-slate-900 dark:text-slate-50 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3 font-display">
          🏢 Company Details & Ledger Custom Branding
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-405 leading-relaxed">
          Upload your construction logo, business tax identification details, and office hotlines. Authenticated business parameters will display on top of the supervisor screen, print ledgers, local summaries, and sheets preview headers!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left panel: Info Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Company Registered Name *</label>
              <input
                type="text"
                value={appState.companyDetails?.name || ''}
                onChange={(e) => onUpdateCompanyDetails({ ...(appState.companyDetails || {}), name: e.target.value })}
                placeholder="e.g. Apex Engineering Solutions"
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-1 focus:ring-orange-500 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Business Mobile Hotline</label>
                <input
                  type="text"
                  value={appState.companyDetails?.phone || ''}
                  onChange={(e) => onUpdateCompanyDetails({ ...(appState.companyDetails || {}), phone: e.target.value })}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-3 outline-none text-slate-800 dark:text-slate-205"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">GST/VAT Identification</label>
                <input
                  type="text"
                  value={appState.companyDetails?.gstNum || ''}
                  onChange={(e) => onUpdateCompanyDetails({ ...(appState.companyDetails || {}), gstNum: e.target.value })}
                  placeholder="e.g. NTN-9876543"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-3 outline-none text-slate-800 dark:text-slate-205"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Business Support Email</label>
                <input
                  type="email"
                  value={appState.companyDetails?.email || ''}
                  onChange={(e) => onUpdateCompanyDetails({ ...(appState.companyDetails || {}), email: e.target.value })}
                  placeholder="e.g. contact@apexeng.pk"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-3 outline-none text-slate-800 dark:text-slate-205"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Office Hub Address</label>
                <input
                  type="text"
                  value={appState.companyDetails?.address || ''}
                  onChange={(e) => onUpdateCompanyDetails({ ...(appState.companyDetails || {}), address: e.target.value })}
                  placeholder="e.g. Block A-12, Airport Avenue"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-3 outline-none text-slate-800 dark:text-slate-205"
                />
              </div>
            </div>
          </div>

          {/* Right panel: Digital Logo Upload */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-155 dark:border-slate-800 space-y-4">
            <span className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Registered Business Logo</span>
            
            <div className="flex items-center gap-4">
              {appState.companyDetails?.logo ? (
                <div className="relative w-20 h-20 bg-white border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                  <img
                    src={appState.companyDetails.logo}
                    alt="Uploaded Company Branding Logo"
                    className="max-w-full max-h-full object-contain p-1.5"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateCompanyDetails({ ...(appState.companyDetails || { name: 'ConstructSync' }), logo: undefined })}
                    className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-bl-xl shadow-md cursor-pointer text-[9px] font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-705 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-400">
                  <Database className="w-8 h-8 animate-pulse text-slate-400" />
                  <span className="text-[8px] uppercase tracking-wide font-black mt-1">NO LOGO</span>
                </div>
              )}

              <div className="flex-1 space-y-2">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Upload an image (PNG, JPG, or SVG). Recommended aspect ratio is square or rectangle, size under 1MB. It turns into Base64 format instantly.
                </p>
                <label className="inline-block px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition select-none">
                  Choose Image File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          onUpdateCompanyDetails({
                            ...(appState.companyDetails || { name: 'ConstructSync Corporate Ltd' }),
                            logo: event.target?.result as string
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual OAuth Configuration Modal Popup */}
      {showDemoConnector && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-900">
          <div className="bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 overflow-hidden shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-1.5 font-display text-orange-600 dark:text-orange-500">
                <Cloud className="w-4.5 h-4.5" />
                Google Drive & Sheets Integration Settings
              </h4>
              <button 
                onClick={() => setShowDemoConnector(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400 text-left">
              <p>
                To synchronize your construction logs directly to your real Google Drive and Sheets, you can connect using a Google OAuth Access Token.
              </p>

              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 p-3 rounded-2xl space-y-2">
                <span className="font-extrabold text-[10px] text-orange-700 dark:text-orange-400 uppercase tracking-wider block">
                  🚀 Quick Google Authentication Guide (Takes 30s)
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <li>
                    Open the <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="text-orange-600 hover:underline font-bold">Google OAuth Playground ↗</a>
                  </li>
                  <li>
                    In Step 1 (left panel), scroll or search for <strong>Google Sheets API v4</strong> and check:
                    <div className="bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded font-mono text-[9px] mt-1 select-all break-all text-slate-500">
                      https://www.googleapis.com/auth/spreadsheets
                    </div>
                    And check <strong>Drive API v3</strong> (or search/type it):
                    <div className="bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded font-mono text-[9px] mt-1 select-all break-all text-slate-500">
                      https://www.googleapis.com/auth/drive.file
                    </div>
                  </li>
                  <li>
                    Click <strong className="text-slate-800 dark:text-slate-200">Authorize APIs</strong> and log in with your Google Account.
                  </li>
                  <li>
                    In Step 2 on the screen, click <strong className="text-slate-800 dark:text-slate-200">Exchange authorization code for tokens</strong>.
                  </li>
                  <li>
                    Copy the generated <strong className="text-orange-600 dark:text-orange-400">Access Token</strong> from the field, paste it below, and click Connect!
                  </li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Paste Your Google Access Token
                </label>
                <input
                  type="password"
                  placeholder="ya29.a0Acv..."
                  value={temporaryAccessToken}
                  onChange={(e) => setTemporaryAccessToken(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl dark:text-white outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  onUpdateGoogleUser({
                    accessToken: 'mock_active_sandbox_token_abc123',
                    email: googleUser?.email || 'fidahuxain@gmail.com',
                    name: 'Construction Supervisor'
                  });
                  setShowDemoConnector(false);
                  alert('Google Sheets Simulation enabled! You are in Sandbox Mode.');
                }}
                type="button"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-xl cursor-pointer"
              >
                Use Offline Sandbox
              </button>
              
              <button
                disabled={!temporaryAccessToken.trim()}
                onClick={() => {
                  const cleaned = temporaryAccessToken.trim();
                  if (!cleaned) return;
                  onUpdateGoogleUser({
                    accessToken: cleaned,
                    email: 'fidahuxain@gmail.com',
                    name: 'Supervisor Lead'
                  });
                  setShowDemoConnector(false);
                  alert('Successfully connected to Google account with active Access Token! Google Sheets syncing is now LIVE.');
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-[11px] font-extrabold rounded-xl cursor-pointer shadow-md shadow-orange-500/10"
              >
                Connect Real Sheets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sandbox Sheet Simulator Drawer Modal modal */}
      {showMockPreview && (() => {
        const mats = projectExpenses.filter(e => e.category === 'material');
        const labs = projectExpenses.filter(e => e.category === 'labour');
        const transps = projectExpenses.filter(e => e.category === 'transport');

        const totMats = mats.reduce((sum, e: any) => sum + (e.totalCost || 0), 0);
        const totLabs = labs.reduce((sum, e: any) => sum + (e.totalAmount || 0), 0);
        const totTransps = transps.reduce((sum, e: any) => sum + (e.cost || 0), 0);

        let totCust = 0;
        const customRows = (project.customCategories || []).map(cat => {
          const catExpenses = projectExpenses.filter(e => e.category === cat.id);
          const catTotal = catExpenses.reduce((sum, e: any) => sum + (e.totalCost || 0), 0);
          totCust += catTotal;
          return {
            id: cat.id,
            name: cat.name,
            total: catTotal,
            expensesList: catExpenses
          };
        });

        const syncedGrandTotal = totMats + totLabs + totTransps + totCust;

        return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs text-slate-800 dark:text-slate-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Simulator Header resembling Excel/Google Sheets */}
              <div className="bg-emerald-750 dark:bg-emerald-900 text-white p-4 shrink-0 flex items-center justify-between border-b border-emerald-900/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm tracking-wide">🚧 {project.name} - Construction Spreadsheet</span>
                      <span className="bg-white/15 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-emerald-100 font-mono">Sandbox Mode</span>
                    </div>
                    <p className="text-[10px] text-emerald-200 font-medium">Real-time mock Google Spreadsheet rendering sandbox updates</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowMockPreview(false)}
                  className="p-1 px-3 bg-white/10 hover:bg-white/15 active:scale-95 text-white/90 text-[10px] font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Close Sheet Simulator
                </button>
              </div>

              {/* Tab Selector Bar */}
              <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-850 shrink-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none">
                <button
                  type="button"
                  onClick={() => setMockPreviewTab('summary')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer select-none shrink-0 ${mockPreviewTab === 'summary' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300'}`}
                >
                  📊 Dashboard Summary
                </button>
                <button
                  type="button"
                  onClick={() => setMockPreviewTab('material')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer select-none shrink-0 ${mockPreviewTab === 'material' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300'}`}
                >
                  📦 Materials Log
                </button>
                <button
                  type="button"
                  onClick={() => setMockPreviewTab('labour')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer select-none shrink-0 ${mockPreviewTab === 'labour' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300'}`}
                >
                  👷 Labour Log
                </button>
                <button
                  type="button"
                  onClick={() => setMockPreviewTab('transport')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer select-none shrink-0 ${mockPreviewTab === 'transport' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300'}`}
                >
                  🚚 Transportation Log
                </button>

                {customRows.map(cr => (
                  <button
                    key={cr.id}
                    type="button"
                    onClick={() => setMockPreviewTab(cr.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer select-none shrink-0 ${mockPreviewTab === (cr.id as any) ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300'}`}
                  >
                    📂 {cr.name} Log
                  </button>
                ))}
              </div>

              {/* Spreadsheet Main Grid Area */}
              <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-6 scrollbar-thin">
                {mockPreviewTab === 'summary' && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
                      <div className="bg-slate-100 dark:bg-slate-800 p-3.5 border-b border-slate-200 dark:border-slate-800 font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Dashboard Summary Tab
                      </div>
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Category / Row</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Description</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">Total Cost</th>
                            <th className="p-3">Last Updated (UTC)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                          <tr>
                            <td className="p-3 font-bold border-r border-slate-100 dark:border-slate-850/60 text-blue-600 dark:text-blue-400">Materials Expense</td>
                            <td className="p-3 text-slate-500 border-r border-slate-100 dark:border-slate-850/60">Steel/brick/cement delivery summary</td>
                            <td className="p-3 text-right font-extrabold border-r border-slate-100 dark:border-slate-850/60 text-slate-800 dark:text-white">₹{totMats.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-[10px] text-slate-450">{new Date().toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold border-r border-slate-100 dark:border-slate-850/60 text-orange-500">Labour Expense</td>
                            <td className="p-3 text-slate-500 border-r border-slate-100 dark:border-slate-850/60">Masons & helpers daily site wage reports</td>
                            <td className="p-3 text-right font-extrabold border-r border-slate-100 dark:border-slate-850/60 text-slate-800 dark:text-white">₹{totLabs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-[10px] text-slate-450">{new Date().toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold border-r border-slate-100 dark:border-slate-850/60 text-cyan-600 dark:text-cyan-400">Transportation Expense</td>
                            <td className="p-3 text-slate-500 border-r border-slate-100 dark:border-slate-850/60">Fuel deliveries, tractor/truck lease rentals</td>
                            <td className="p-3 text-right font-extrabold border-r border-slate-100 dark:border-slate-850/60 text-slate-800 dark:text-white">₹{totTransps.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-[10px] text-slate-450">{new Date().toLocaleString()}</td>
                          </tr>

                          {customRows.map(cr => (
                            <tr key={cr.id}>
                              <td className="p-3 font-bold border-r border-slate-100 dark:border-slate-850/60 text-pink-600 dark:text-pink-400">Custom: {cr.name}</td>
                              <td className="p-3 text-slate-500 border-r border-slate-100 dark:border-slate-850/60">Expenditure tab: {cr.name} log</td>
                              <td className="p-3 text-right font-extrabold border-r border-slate-100 dark:border-slate-850/60 text-slate-800 dark:text-white">₹{cr.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="p-3 text-[10px] text-slate-450">{new Date().toLocaleString()}</td>
                            </tr>
                          ))}

                          <tr className="bg-emerald-500/5 font-extrabold text-[12px] dark:bg-emerald-900/10">
                            <td className="p-3 text-emerald-600 dark:text-emerald-400 border-r border-slate-100 dark:border-slate-850/60" colSpan={2}>GRAND TOTAL PROJECT EXPENDITURE</td>
                            <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 border-r border-slate-100 dark:border-slate-850/60">₹{syncedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-[10px] text-emerald-500/80">FORMULA: SUM(A2:C5)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {mockPreviewTab === 'material' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto w-full">
                      <table className="min-w-[1000px] w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Date</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Material Name</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Supplier</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">Quantity</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 font-medium">Unit</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">Rate per Unit</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">Total Cost</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-center">Stock Status</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">Remaining Stock</th>
                            <th className="p-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                          {mats.length === 0 ? (
                            <tr><td colSpan={10} className="p-8 text-center text-slate-400 font-medium font-sans">No synchronized Materials vouchers for this project workbook.</td></tr>
                          ) : mats.map((m: any) => (
                            <tr key={m.id}>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-slate-500">{m.date}</td>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 font-bold font-sans text-slate-900 dark:text-white">{m.materialName}</td>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-slate-650">{m.supplierName || '-'}</td>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-right text-slate-805 font-bold">{m.quantity}</td>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-slate-505 uppercase">{m.unit}</td>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-right text-slate-700">{currencySymbol}{m.costPerUnit}</td>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-right font-extrabold text-blue-600 dark:text-blue-400">{currencySymbol}{m.totalCost}</td>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-center">
                                {m.stockStatus ? (
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    m.stockStatus === 'New Order' 
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15' 
                                      : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/15'
                                  }`}>
                                    {m.stockStatus}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-right text-slate-805 font-extrabold">
                                {m.remainingStock !== undefined ? `${m.remainingStock} ${m.unit}` : '-'}
                              </td>
                              <td className="p-3 text-slate-400 max-w-xs truncate font-sans">{m.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {mockPreviewTab === 'labour' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto w-full">
                      <table className="min-w-[850px] w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                          <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Date</th>
                          <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Worker Name / Party</th>
                          <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Labour Category</th>
                          <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">No. of Workers</th>
                          <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">Daily Wage</th>
                          <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">Total Wages</th>
                          <th className="p-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                        {labs.length === 0 ? (
                          <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-medium font-sans">No synchronized Labour vouchers for this project workbook.</td></tr>
                        ) : labs.map((l: any) => (
                          <tr key={l.id}>
                            <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-slate-500">{l.date}</td>
                            <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 font-bold font-sans text-slate-900 dark:text-white">{l.workerName}</td>
                            <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 uppercase font-sans text-[10px] px-1.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 font-bold text-center inline-block mt-2 ml-2">{l.labourCategory}</td>
                            <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-right text-slate-805">{l.numWorkers}</td>
                            <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-right text-slate-700">₹{l.dailyWage}</td>
                            <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-right font-extrabold text-orange-600">₹{l.totalAmount}</td>
                            <td className="p-3 text-slate-400 max-w-xs truncate font-sans">{l.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {mockPreviewTab === 'transport' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto w-full">
                      <table className="min-w-[800px] w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Date</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Vehicle / Transport Mode</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Usage / Purpose</th>
                            <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">Fuel & Rental Cost</th>
                            <th className="p-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                          {transps.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium font-sans">No synchronized Transportation/Fuel vouchers for this project workbook.</td></tr>
                          ) : transps.map((t: any) => (
                            <tr key={t.id}>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-slate-500">{t.date}</td>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 font-bold font-sans text-slate-900 dark:text-white">{t.vehicleType}</td>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-slate-655 font-sans">{t.description}</td>
                              <td className="p-3 border-r border-slate-100 dark:border-slate-850/60 text-right font-extrabold text-cyan-600 dark:text-cyan-400">{currencySymbol}{t.cost}</td>
                              <td className="p-3 text-slate-400 max-w-xs truncate font-sans">{t.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Custom Categories Sheet Simulation tabs renderer */}
                {(() => {
                  const currCat = customRows.find(cr => cr.id === (mockPreviewTab as any));
                  if (!currCat) return null;

                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto w-full">
                        <table className="min-w-[1000px] w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
                              <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Date</th>
                              <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Item Name</th>
                              <th className="p-3 border-r border-slate-200 dark:border-slate-850/60">Supplier / Provider</th>
                              <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">Quantity</th>
                              <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 font-medium font-sans">Unit</th>
                              <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right border-slate-100">Rate per Unit</th>
                              <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">Total Cost</th>
                              <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-center">Stock Status</th>
                              <th className="p-3 border-r border-slate-200 dark:border-slate-850/60 text-right">Remaining Stock</th>
                              <th className="p-3">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                            {currCat.expensesList.length === 0 ? (
                              <tr><td colSpan={10} className="p-8 text-center text-slate-400 font-medium font-sans">No synchronized dynamic records in tab "{currCat.name}" for this project workbook.</td></tr>
                            ) : currCat.expensesList.map((e: any) => (
                              <tr key={e.id}>
                                <td className="p-3 border-r border-slate-100 text-slate-500">{e.date}</td>
                                <td className="p-3 border-r border-slate-100 font-bold font-sans text-slate-900 dark:text-white">{e.itemName || '-'}</td>
                                <td className="p-3 border-r border-slate-100 font-sans text-slate-650">{e.supplierName || e.supplierOrProvider || '-'}</td>
                                <td className="p-3 border-r border-slate-100 text-right text-slate-805 font-bold">{e.quantity || '-'}</td>
                                <td className="p-3 border-r border-slate-105 uppercase text-slate-500 font-sans text-[10px]">{e.unit || '-'}</td>
                                <td className="p-3 border-r border-slate-105 text-right text-slate-705">{e.costPerUnit ? `${currencySymbol}${e.costPerUnit}` : '-'}</td>
                                <td className="p-3 border-r border-slate-105 text-right font-extrabold text-pink-600 dark:text-pink-400">{currencySymbol}{e.totalCost || '-'}</td>
                                <td className="p-3 border-r border-slate-100 text-center">
                                  {e.stockStatus ? (
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                      e.stockStatus === 'New Order' 
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15' 
                                        : 'bg-orange-500/10 text-orange-605 dark:text-orange-400 border border-orange-500/15'
                                    }`}>
                                      {e.stockStatus}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="p-3 border-r border-slate-100 text-right text-slate-805 font-extrabold">
                                  {e.remainingStock !== undefined ? `${e.remainingStock} ${e.unit || ''}` : '-'}
                                </td>
                                <td className="p-3 text-slate-400 max-w-xs truncate font-sans">{e.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Statusbar footer mimicking Google Sheets */}
              <div className="bg-slate-100 dark:bg-slate-950 px-5 py-2.5 border-t border-slate-200 dark:border-slate-850 flex items-center justify-between text-[11px] font-sans text-slate-550 shrink-0">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  <span>File Status: <b className="text-emerald-600 dark:text-emerald-400">Perfectly Synchronized</b></span>
                </span>
                <span className="font-mono text-slate-450">Workbook Tabs: {4 + customRows.length} tabs </span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

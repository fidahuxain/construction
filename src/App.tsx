/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Project, Expense, AppState } from './types';
import { getInitialState, saveState } from './db';
import Dashboard from './components/Dashboard';
import ProjectForm from './components/ProjectForm';
import ExpenseForms from './components/ExpenseForms';
import ExpenseList from './components/ExpenseList';
import SheetsSync from './components/SheetsSync';
import { 
  HardHat, 
  Layers, 
  CreditCard, 
  Settings2, 
  Compass, 
  Sun, 
  Moon, 
  Wifi, 
  Battery, 
  UserCircle 
} from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AppState>(() => getInitialState());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'vouchers' | 'sync' | 'projects'>('dashboard');

  // Load and apply themes on load
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    if (state.theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [state.theme]);

  // Synchronise database on state edits
  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeProject = state.projects.find(p => p.id === state.activeProjectId) || null;

  const handleSelectProject = (id: string) => {
    setState(prev => ({
      ...prev,
      activeProjectId: id,
    }));
    setActiveTab('dashboard');
  };

  const handleAddProject = (newProject: Omit<Project, 'id' | 'createdAt'>) => {
    const project: Project = {
      ...newProject,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      projects: [...prev.projects, project],
      activeProjectId: project.id,
    }));
    setActiveTab('dashboard');
  };

  const handleDeleteProject = (id: string) => {
    setState(prev => {
      // Filter out deleted project's expenses too
      const updatedExpenses = { ...prev.expenses };
      Object.keys(updatedExpenses).forEach(key => {
        if (updatedExpenses[key].projectId === id) {
          delete updatedExpenses[key];
        }
      });

      const updatedProjects = prev.projects.filter(p => p.id !== id);
      const nextActiveId = updatedProjects[0]?.id || null;

      return {
        ...prev,
        projects: updatedProjects,
        expenses: updatedExpenses,
        activeProjectId: nextActiveId,
      };
    });
  };

  const handleAddExpense = (newExpense: Omit<Expense, 'id' | 'createdAt' | 'synced'>) => {
    const expense: Expense = {
      ...newExpense,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      synced: false,
    } as Expense;

    setState(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        [expense.id]: expense,
      },
    }));
  };

  const handleDeleteExpense = (id: string) => {
    setState(prev => {
      const updatedExpenses = { ...prev.expenses };
      delete updatedExpenses[id];
      return {
        ...prev,
        expenses: updatedExpenses,
      };
    });
  };

  const handleUpdateGoogleUser = (user: AppState['googleUser']) => {
    setState(prev => ({
      ...prev,
      googleUser: user,
    }));
  };

  const handleLinkSheet = (projectId: string, sheetId: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, googleSheetId: sheetId } : p),
    }));
  };

  const handleMarkSynced = (expenseIds: string[]) => {
    setState(prev => {
      const updatedExpenses = { ...prev.expenses };
      expenseIds.forEach(id => {
        if (updatedExpenses[id]) {
          updatedExpenses[id] = { ...updatedExpenses[id], synced: true } as any;
        }
      });
      return {
        ...prev,
        expenses: updatedExpenses,
      };
    });
  };

  const handleRestoreState = (importedState: Partial<AppState>) => {
    setState(prev => ({
      ...prev,
      ...importedState,
      // Enforce in-memory google user restriction
      googleUser: null,
    }));
  };

  const toggleTheme = () => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-350">
      
      {/* Outer framing centered for beautiful visual balance */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        
        {/* Navigation Top Bar */}
        <header className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <HardHat className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                Construct<span className="text-orange-500 font-black">Sync</span>
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                Heavy Duty Supervisor Tools • Offline Ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode Switcher Indicator */}
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer"
              title="Toggle Light/Dark layout theme"
            >
              {state.theme === 'light' ? (
                <Moon className="w-5 h-5 text-slate-600" />
              ) : (
                <Sun className="w-5 h-5 text-orange-400" />
              )}
            </button>

            {/* Email Profile view */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 font-medium">
              <UserCircle className="w-4 h-4 text-slate-400" />
              fidahuxain@gmail.com
            </span>
          </div>
        </header>

        {/* Android Device Simulator Wrap side-by-side with secondary helper panel / fullscreen */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start print:block">
          
          {/* Main Simulated Super-Target Mobile Layout View */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 w-full rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md flex flex-col justify-between min-h-[750px] print:block print:border-0 print:shadow-none print:min-h-0">
            
            {/* Simulated Android Status Bar (Interactive HUD) */}
            <div className="bg-slate-100 dark:bg-slate-950/60 px-6 py-2 flex items-center justify-between text-[11px] text-slate-450 dark:text-slate-500 font-mono font-medium border-b border-slate-200/50 dark:border-slate-850 print:hidden">
              <span className="flex items-center gap-1.5 font-bold">
                {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })} UTC
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-500">
                  <Wifi className="w-3.5 h-3.5" /> Site Coverage
                </span>
                <span className="flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5" /> 98%🔋
                </span>
              </div>
            </div>

            {/* Inside Simulator Content Drawer */}
            <div className="p-6 flex-1 print:p-0">
              
              {/* Conditional viewport render */}
              {activeTab === 'dashboard' && (
                <Dashboard project={activeProject} expenses={state.expenses} />
              )}
              {activeTab === 'add' && (
                <ExpenseForms 
                  project={activeProject} 
                  onAddExpense={handleAddExpense} 
                  onUpdateProject={(updated) => {
                    setState(prev => ({
                      ...prev,
                      projects: prev.projects.map(p => p.id === updated.id ? updated : p)
                    }));
                  }}
                />
              )}
              {activeTab === 'vouchers' && (
                <ExpenseList 
                  project={activeProject} 
                  expenses={state.expenses} 
                  onDeleteExpense={handleDeleteExpense} 
                  onUpdateExpense={(updated) => {
                    setState(prev => ({
                      ...prev,
                      expenses: {
                        ...prev.expenses,
                        [updated.id]: updated
                      }
                    }));
                  }}
                />
              )}
              {activeTab === 'sync' && (
                <SheetsSync 
                  project={activeProject} 
                  expenses={state.expenses} 
                  googleUser={state.googleUser}
                  onUpdateGoogleUser={handleUpdateGoogleUser}
                  onLinkSheet={handleLinkSheet}
                  onMarkSynced={handleMarkSynced}
                  onRestoreState={handleRestoreState}
                  appState={state}
                />
              )}
              {activeTab === 'projects' && (
                <ProjectForm
                  projects={state.projects}
                  activeProjectId={state.activeProjectId}
                  onSelectProject={handleSelectProject}
                  onAddProject={handleAddProject}
                  onDeleteProject={handleDeleteProject}
                  onUpdateProject={(updated) => {
                    setState(prev => ({
                      ...prev,
                      projects: prev.projects.map(p => p.id === updated.id ? updated : p)
                    }));
                  }}
                />
              )}
            </div>

            {/* Simulated Bottom App Navigation Bar (Android Tab-Bar Style) */}
            <nav className="bg-slate-55 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850 py-3 px-6 flex items-center justify-around print:hidden rounded-b-[2.5rem]">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Compass },
                { id: 'add', label: 'Add Expense', icon: CreditCard },
                { id: 'vouchers', label: 'Vouchers', icon: Layers },
                { id: 'sync', label: 'Sync / Backup', icon: Settings2 },
                { id: 'projects', label: 'Locations', icon: HardHat },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className="flex flex-col items-center justify-center relative py-1 hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer"
                    id={`tab-target-${tab.id}`}
                  >
                    <span className={`p-1.5 rounded-full transition-colors ${
                      isSelected 
                        ? 'text-orange-500 bg-orange-550/10' 
                        : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                    }`}>
                      <TabIcon className="w-5.5 h-5.5" />
                    </span>
                    <span className={`text-[9px] font-bold mt-1 tracking-tight transition-colors ${
                      isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Active Status Side panel on Widescreen */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 print:hidden shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">Supervisor Hub</h3>
            <div>
              <span className="text-[10px] text-slate-450 uppercase font-semibold">Current Project Location</span>
              <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mt-0.5">{activeProject ? activeProject.name : 'No Active Site'}</p>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3.5 space-y-1">
              <span className="text-[10px] text-slate-450 block pb-1 uppercase font-semibold">Database Quick Counts</span>
              <div className="flex justify-between text-xs text-slate-550">
                <span>Total active sites:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{state.projects.length} registers</span>
              </div>
              <div className="flex justify-between text-xs text-slate-550">
                <span>Total expense vouchers:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{Object.keys(state.expenses).length} items</span>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-450 dark:text-slate-500">
              ConstructSync operates fully offline. Your logs are safely cached inside your personal browser database, ideal for environments like deep tunnels, basements, and remote highway sites.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

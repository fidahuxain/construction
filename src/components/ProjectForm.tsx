/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { Project } from '../types';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  HardHat, 
  Briefcase, 
  Check, 
  Trash2, 
  Pencil, 
  Edit3,
  User,
  FileText,
  X
} from 'lucide-react';

interface ProjectFormProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (project: Project) => void;
}

export default function ProjectForm({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  onUpdateProject,
}: ProjectFormProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Custom Alert Banners to avoid blocked window.alert/window.confirm
  const [banner, setBanner] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add Project Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [constructorName, setConstructorName] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('Rs.');

  // Edit Project Form State
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editConstructorName, setEditConstructorName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCurrency, setEditCurrency] = useState('Rs.');

  const currencies = [
    { label: 'PKR (Rs.)', value: 'Rs.' }
  ];

  const triggerBanner = (type: 'success' | 'danger', message: string) => {
    setBanner({ type, message });
    setTimeout(() => {
      setBanner(null);
    }, 4000);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) {
      triggerBanner('danger', 'Project Name and Location are required!');
      return;
    }
    onAddProject({
      name: name.trim(),
      location: location.trim(),
      startDate,
      clientName: clientName.trim() || undefined,
      constructorName: constructorName.trim() || undefined,
      notes: notes.trim() || undefined,
      currency,
    });
    // Reset Add Form
    setName('');
    setLocation('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setClientName('');
    setConstructorName('');
    setNotes('');
    setShowAddForm(false);
    triggerBanner('success', 'New site register successfully configured!');
  };

  const handleStartEdit = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting project when clicking Edit
    setEditingProject(p);
    setEditName(p.name);
    setEditLocation(p.location);
    setEditStartDate(p.startDate);
    setEditClientName(p.clientName || '');
    setEditConstructorName(p.constructorName || '');
    setEditNotes(p.notes || '');
    setEditCurrency(p.currency);
    setShowAddForm(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editName.trim() || !editLocation.trim()) {
      triggerBanner('danger', 'Project Name and Location are required!');
      return;
    }

    const updated: Project = {
      ...editingProject,
      name: editName.trim(),
      location: editLocation.trim(),
      startDate: editStartDate,
      clientName: editClientName.trim() || undefined,
      constructorName: editConstructorName.trim() || undefined,
      notes: editNotes.trim() || undefined,
      currency: editCurrency,
    };

    onUpdateProject(updated);
    setEditingProject(null);
    triggerBanner('success', 'Project details successfully saved! Register updated.');
  };

  const handleDeleteTrigger = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering selection
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteProject(id);
    setDeleteConfirmId(null);
    if (editingProject?.id === id) {
      setEditingProject(null);
    }
    triggerBanner('success', 'Site register has been completely removed.');
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Toast/Banner notifications for standard feedback bypassing window.alerts */}
      {banner && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-bounce shadow-md ${
          banner.type === 'success' 
            ? 'bg-emerald-500 text-white border border-emerald-600' 
            : 'bg-rose-600 text-white border border-rose-700'
        }`}>
          <span>{banner.message}</span>
          <button 
            type="button" 
            onClick={() => setBanner(null)} 
            className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px]"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-50 flex items-center gap-2 font-display">
            <HardHat className="text-orange-550 w-5 h-5" />
            Active Sites & Registers
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Tap on any construction site to change dashboard contexts, edit details, or remove projects.
          </p>
        </div>

        {!showAddForm && !editingProject && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md shadow-orange-505/10 active:scale-95 cursor-pointer"
            id="btn-add-site-initiator"
          >
            <Plus className="w-4 h-4" />
            Add New Site
          </button>
        )}
      </div>

      {/* CREATE NEW SITE FORM */}
      {showAddForm && (
        <form onSubmit={handleSubmitAdd} className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-50 uppercase tracking-wide font-display flex items-center gap-1.5">
              <Plus className="w-4.5 h-4.5 text-orange-550" /> Register Construction Site
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1 text-slate-400 hover:text-slate-500 rounded-lg"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Project Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Greenwood Heights Mall"
                className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-2xl p-3 focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Site Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Plot No 42, North Wing Sector 5"
                className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-2xl p-3 focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Client Name (Optional)</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Apex Housing Developers Ltd"
                className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-2xl p-3 focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Constructor / Supervisor Name</label>
              <input
                type="text"
                value={constructorName}
                onChange={(e) => setConstructorName(e.target.value)}
                placeholder="e.g. Fidahuxain Contracting Corp"
                className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-2xl p-3 focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-2xl p-3 focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Currency *</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-2xl p-3 focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 outline-none"
                >
                  {currencies.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Notes / Extra Information</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include other extra specifications, supervisors roster, licensing numbers, or special budget constraints..."
                rows={3}
                className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-2xl p-3 focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-md"
            >
              Create Project
            </button>
          </div>
        </form>
      )}

      {/* EDIT THE CHOSEN SITE FORM */}
      {editingProject && (
        <form onSubmit={handleSubmitEdit} className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-500/30 p-6 rounded-3xl shadow-md space-y-4 animate-fade-in ring-2 ring-orange-500/10">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-50 uppercase tracking-wide font-display flex items-center gap-1.5">
              <Edit3 className="w-4.5 h-4.5 text-orange-550" /> Edit Project Main Info
            </h4>
            <button
              type="button"
              onClick={() => setEditingProject(null)}
              className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-500 dark:text-slate-300 rounded-lg text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Project Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name"
                className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-2xl p-3 focus:ring-orange-505 bg-slate-50/50 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Location *</label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Location"
                className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-2xl p-3 focus:ring-orange-505 bg-slate-50/50 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Client Name</label>
              <input
                type="text"
                value={editClientName}
                onChange={(e) => setEditClientName(e.target.value)}
                placeholder="Client"
                className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-2xl p-3 focus:ring-orange-505 bg-slate-50/50 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Constructor / Contractor Name</label>
              <input
                type="text"
                value={editConstructorName}
                onChange={(e) => setEditConstructorName(e.target.value)}
                placeholder="Constructor Name"
                className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-2xl p-3 focus:ring-orange-505 bg-slate-50/50 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-2xl p-3 focus:ring-orange-505 bg-slate-50/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Currency</label>
                <select
                  value={editCurrency}
                  onChange={(e) => setEditCurrency(e.target.value)}
                  className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-2xl p-3 focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 outline-none"
                >
                  {currencies.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Extra Site Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Extra Info notes box"
                rows={3}
                className="w-full text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-2xl p-3 focus:ring-orange-505 bg-slate-50/50 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingProject(null)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold cursor-pointer transition-all"
            >
              Cancel Edit
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-md"
            >
              Save Project Changes
            </button>
          </div>
        </form>
      )}

      {/* GRID LIST OF ALL PROJECTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => {
          const isActive = activeProjectId === p.id;
          const isConfirmingDelete = deleteConfirmId === p.id;

          return (
            <div
              key={p.id}
              onClick={() => {
                if (!isConfirmingDelete) {
                  onSelectProject(p.id);
                }
              }}
              className={`rounded-3xl border text-left cursor-pointer transition-all flex flex-col justify-between group relative min-h-[220px] overflow-hidden ${
                isActive
                  ? 'bg-orange-50/60 dark:bg-slate-900 border-orange-550 dark:border-orange-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-850 hover:bg-slate-55 dark:hover:bg-slate-900'
              }`}
            >
              {isConfirmingDelete ? (
                /* Beautiful Inline Security Overlay */
                <div 
                  className="absolute inset-0 bg-rose-600 text-white p-6 flex flex-col justify-between z-10 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <h5 className="font-extrabold text-base flex items-center gap-2">
                      <Trash2 className="w-5 h-5 animate-bounce" /> Delete registers?
                    </h5>
                    <p className="text-xs text-rose-100 mt-2 font-medium leading-relaxed">
                      Are you sure you want to completely remove <strong>{p.name}</strong>? This will instantly delete all site vouchers and registers stored locally.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={(e) => handleConfirmDelete(p.id, e)}
                      className="flex-1 bg-white hover:bg-rose-50 text-rose-750 py-2.5 rounded-xl text-xs font-black cursor-pointer text-center"
                    >
                      Yes, Delete Site
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelDelete}
                      className="flex-1 bg-rose-700 hover:bg-rose-800 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer text-center border border-rose-500"
                    >
                      Nevermind
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className={`p-2.5 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-orange-500/15 text-orange-600' : 'bg-slate-100 text-slate-400 dark:bg-slate-850 dark:text-slate-500'
                    }`}>
                      <Briefcase className="w-5 h-5" />
                    </span>

                    <div className="flex items-center gap-1.5 ml-auto">
                      {/* EDIT PENCIL BUTTON (Always clickable, stops card select triggers) */}
                      <button
                        onClick={(e) => handleStartEdit(p, e)}
                        className="p-2 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl transition-all cursor-pointer hover:text-slate-800 dark:hover:text-amber-400"
                        title="Edit main project details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* DELETE TRASH BUTTON - ALWAYS VISIBLE TO BE COMPLIANT WITH DIRECTIVES */}
                      <button
                        onClick={(e) => handleDeleteTrigger(p.id, e)}
                        className="p-2 hover:bg-rose-50 hover:text-rose-600 text-slate-300 dark:text-slate-600 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                        title="Delete construction site and associated logs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-50 font-display flex items-center gap-2">
                      {p.name}
                    </h4>
                    
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 mt-1">
                        <Check className="w-3 h-3" /> Active Site
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    <p className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {p.location}
                    </p>
                    
                    {p.clientName && (
                      <p className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Client:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{p.clientName}</span>
                      </p>
                    )}

                    {p.constructorName && (
                      <p className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Constructor:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold text-orange-600 dark:text-orange-400">{p.constructorName}</span>
                      </p>
                    )}

                    {p.notes && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 mt-2 text-[11px] leading-relaxed text-slate-500 italic max-h-16 overflow-y-auto">
                        <p className="font-bold text-[9px] text-slate-400 not-italic uppercase tracking-widest mb-0.5">Extra Info Notes</p>
                        {p.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-3.5 text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Started: {p.startDate}</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                    Currency: {p.currency}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

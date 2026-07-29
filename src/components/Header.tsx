import React from 'react';
import { ViewTab, GoogleSheetsConfig } from '../types';
import { Menu, RefreshCw, Calendar, Trash2, Sliders, ShieldCheck } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: ViewTab;
  onToggleSidebar: () => void;
  sheetsConfig: GoogleSheetsConfig;
  user?: User | null;
  onSync: () => void;
  isSyncing: boolean;
  onReset: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onToggleSidebar,
  sheetsConfig,
  user,
  onSync,
  isSyncing,
  onReset,
  onOpenSettings
}) => {
  const pageTitles: Record<ViewTab, string> = {
    dashboard: 'Dashboard Analitik',
    produk: 'Katalog Produk Toko',
    stok: 'Mutasi & Riwayat Stok',
    keuangan: 'Buku Kas & Keuangan',
    laporan: 'Laporan & Export Data'
  };

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-4 md:px-8 z-20 flex-shrink-0 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden text-slate-600 hover:text-slate-900 p-1 rounded-lg focus:outline-none"
          onClick={onToggleSidebar}
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-display font-bold text-slate-800 tracking-tight">
          {pageTitles[activeTab]}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Direct Google Sheets Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className={`flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-xl border transition-all ${
            user
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 font-semibold shadow-xs'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/80 font-medium'
          }`}
          title={user ? 'Rekap langsung ke Google Spreadsheet' : 'Login Google & Rekap ke Sheet'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="hidden sm:inline flex items-center gap-1">
            {isSyncing ? 'Rekap Data...' : 'Rekap Ke Sheet'}
            {user && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />}
          </span>
        </button>

        {/* Date Display */}
        <div className="hidden md:flex items-center text-xs font-medium text-slate-500 bg-slate-100/80 px-3.5 py-1.5 rounded-xl border border-slate-200/70">
          <Calendar className="w-3.5 h-3.5 mr-2 text-indigo-500" />
          <span>{currentDateFormatted}</span>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="text-xs p-2 rounded-xl border border-slate-200/80 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-xs"
          title="Pengaturan Integrasi Google Sheet"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Reset Data Button */}
        <button
          onClick={onReset}
          className="text-xs p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors shadow-xs"
          title="Reset semua data ke awal"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};


import React from 'react';
import { ViewTab } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  Wallet, 
  FileText, 
  X, 
  Layers, 
  Sliders
} from 'lucide-react';

interface SidebarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  onOpenSettings
}) => {
  const menuItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard Analitik', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'produk', label: 'Katalog Produk', icon: <Package className="w-5 h-5" /> },
    { id: 'stok', label: 'Mutasi Stok', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { id: 'keuangan', label: 'Kas & Keuangan', icon: <Wallet className="w-5 h-5" /> },
    { id: 'laporan', label: 'Laporan & Export', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col transition-transform duration-300 fixed md:relative z-50 h-full ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-white tracking-wide flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-400" /> TOKO VIDICA
            </h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest mt-1 uppercase font-semibold">
              Sistem Dewata
            </p>
          </div>
          <button
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            onClick={() => setIsOpenMobile(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto hide-scroll">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white bg-slate-800 border border-slate-700/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-indigo-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Admin Status & Settings button */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all shadow-sm"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Pengaturan & Sync</span>
          </button>

          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">Admin Toko</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>{' '}
                Online
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

import React, { useState } from 'react';
import { GoogleSheetsConfig } from '../types';
import { X, Sliders, RefreshCw, Database, FileSpreadsheet, Check, ExternalLink, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { User } from 'firebase/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  user: User | null;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
  onSaveConfig: (cfg: GoogleSheetsConfig) => void;
  onSyncNow: () => void;
  isSyncing: boolean;
}

const TARGET_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1nCS_IWOeTlxxaUHKG3n6GnfHQrv7hXrzO6ErK72qMBY/edit?gid=0#gid=0';

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyQ3JzxhhWCpOgk0R2mvYjilDmN5-GEyUH0yXC86G_PpN-PU6WtYo05GvvWlTi438touA/exec';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  user,
  onLoginGoogle,
  onLogoutGoogle,
  onSaveConfig,
  onSyncNow,
  isSyncing
}) => {
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || DEFAULT_APPS_SCRIPT_URL);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(config.spreadsheetUrl || TARGET_SPREADSHEET_URL);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      webAppUrl: webAppUrl.trim(),
      spreadsheetUrl: spreadsheetUrl.trim() || TARGET_SPREADSHEET_URL,
      autoSync,
      lastSyncedAt: config.lastSyncedAt
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/80 flex-shrink-0">
          <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" /> Integrasi Langsung Google Sheets API
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Google Auth Connection Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Autentikasi Google Account
              </span>
              {user ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  <Check className="w-3 h-3 text-emerald-600" /> Terhubung
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                  Belum Otorisasi
                </span>
              )}
            </div>

            {user ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-300" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">{user.displayName || 'Pengguna Google'}</p>
                    <p className="text-slate-500 font-mono">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogoutGoogle}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Otorisasikan akun Google Anda agar aplikasi dapat menulis data rekap langsung ke Google Spreadsheet tanpa perantara Apps Script.
                </p>
                <button
                  type="button"
                  onClick={onLoginGoogle}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>Login / Otorisasi Google Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Target Spreadsheet Input */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Spreadsheet Rekap Target
              </span>
              <a
                href={spreadsheetUrl || TARGET_SPREADSHEET_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                <span>Buka Google Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-1">
                URL atau ID Google Spreadsheet
              </label>
              <input
                type="text"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1nCS_IWOeTlxxaUHKG3n6GnfHQrv7hXrzO6ErK72qMBY/edit"
                className="input-futuristic text-xs font-mono bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-1">
                URL Deployment Apps Script Web App
              </label>
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="input-futuristic text-xs font-mono bg-white"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white cursor-pointer"
              />
              <span className="text-xs font-medium text-indigo-900">
                Otomatis rekap ke Google Sheets setiap kali ada transaksi / mutasi baru
              </span>
            </label>
          </div>

          {/* Direct Sync Trigger Action */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-500">
              Status Last Sync:{' '}
              <span className="text-slate-800 font-bold font-mono">
                {config.lastSyncedAt
                  ? new Date(config.lastSyncedAt).toLocaleString('id-ID')
                  : 'Belum pernah'}
              </span>
            </div>
            <button
              type="button"
              onClick={onSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Mengirim Data...' : 'Rekap Langsung Sekarang'}</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" /> Pengaturan berhasil disimpan!
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="btn-neon px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4" /> Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


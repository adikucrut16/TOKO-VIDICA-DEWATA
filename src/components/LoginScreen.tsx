import React, { useState } from 'react';
import { Layers, ShieldCheck, FileSpreadsheet, ArrowRight, Package, Wallet, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLoginGoogle: () => Promise<void>;
  onContinueAsGuest?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginGoogle, onContinueAsGuest }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await onLoginGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login dengan akun Google. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Radial Gradient Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-6 max-w-7xl mx-auto w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white tracking-wide">TOKO VIDICA DEWATA</h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">System Manajemen Store</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Google Sheets API Integrated</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        {/* Left Column: Value Proposition */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>Versi Terintegrasi Cloud & Realtime Google Spreadsheet</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white leading-tight">
              Akses Portal & Manajemen Toko <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">Vidica Dewata</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
              Kelola katalog produk, mutasi stok barang, buku kas keuangan, dan rekapitulasi data otomatis yang terhubung langsung ke Google Spreadsheet target.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Stok & Mutasi Realtime</h3>
              <p className="text-xs text-slate-400">Pencatatan barang masuk & keluar dengan kalkulasi stok otomatis.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Buku Kas Keuangan</h3>
              <p className="text-xs text-slate-400">Pencatatan debit & kredit dengan laporan saldo bersih otomatis.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Direct Google Sheets API</h3>
              <p className="text-xs text-slate-400">Data otomatis ter-ekspor ke Google Spreadsheet tanpa perantara.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Otorisasi Aman</h3>
              <p className="text-xs text-slate-400">Menggunakan OAuth 2.0 resmi Google untuk akses write spreadsheet.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Google Login Box */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6 relative">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-indigo-400 mb-4">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white font-display">Login Aplikasi</h3>
              <p className="text-xs text-slate-400">
                Masuk dengan Akun Google untuk mengakses dashboard dan mengizinkan integrasi Google Sheets.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}

            {/* Google Sign-in Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-all shadow-xl hover:shadow-2xl active:scale-[0.99] cursor-pointer disabled:opacity-60 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{loading ? 'Menghubungkan ke Google...' : 'Masuk Dengan Google Account'}</span>
            </button>

            {onContinueAsGuest && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="text-xs font-medium text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Masuk sebagai Mode Tamu (Tanpa Login)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center leading-relaxed">
              Target Spreadsheet: <br />
              <span className="font-mono text-slate-400 text-[10px]">1nCS_IWOeTlxxaUHKG3n6GnfHQrv7hXrzO6ErK72qMBY</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 max-w-7xl mx-auto w-full text-center text-xs text-slate-600 border-t border-slate-900/80 z-10">
        © {new Date().getFullYear()} Toko Vidica Dewata. Sistem Operasional & Integrasi Cloud.
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { AppDatabase } from '../types';
import { Wallet, PlusCircle, MinusCircle, Search, ArrowDownLeft, ArrowUpRight, Trash2, Banknote, CreditCard } from 'lucide-react';

interface KeuanganViewProps {
  db: AppDatabase;
  onOpenModalKeuangan: (tipe: 'MASUK' | 'KELUAR') => void;
  onDeleteKeuangan?: (id: string) => void;
}

export const KeuanganView: React.FC<KeuanganViewProps> = ({ db, onOpenModalKeuangan, onDeleteKeuangan }) => {
  const [search, setSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState<'ALL' | 'MASUK' | 'KELUAR'>('ALL');
  const [filterMetode, setFilterMetode] = useState<'ALL' | 'CASH' | 'TRANSFER' | 'KREDIT'>('ALL');

  const totalSaldo = db.keuangan.reduce(
    (acc, curr) => (curr.tipe === 'MASUK' ? acc + curr.nominal : acc - curr.nominal),
    0
  );

  const filteredLogs = db.keuangan
    .filter((k) => {
      const matchSearch = k.keterangan.toLowerCase().includes(search.toLowerCase()) ||
                          (k.namaBank && k.namaBank.toLowerCase().includes(search.toLowerCase()));
      const matchTipe = filterTipe === 'ALL' || k.tipe === filterTipe;
      const matchMetode = filterMetode === 'ALL' || 
                          (filterMetode === 'CASH' && (k.metodePembayaran === 'CASH' || !k.metodePembayaran)) ||
                          (filterMetode === 'TRANSFER' && k.metodePembayaran === 'TRANSFER') ||
                          (filterMetode === 'KREDIT' && (k.metodePembayaran === 'KREDIT' || k.kategori === 'Piutang'));
      return matchSearch && matchTipe && matchMetode;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <h3 className="font-display font-bold text-slate-800 text-lg">Pemasukan Kas</h3>
            <p className="text-xs text-slate-500 mt-1">Catat uang masuk (Penjualan, Modal, Dll)</p>
          </div>
          <button
            onClick={() => onOpenModalKeuangan('MASUK')}
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Uang Masuk
          </button>
        </div>

        <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <h3 className="font-display font-bold text-slate-800 text-lg">Pengeluaran Kas</h3>
            <p className="text-xs text-slate-500 mt-1">Catat uang keluar (Beli barang, Biaya operasional)</p>
          </div>
          <button
            onClick={() => onOpenModalKeuangan('KELUAR')}
            className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MinusCircle className="w-4 h-4" /> Uang Keluar
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan rincian keterangan / nama bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-futuristic pl-10 text-sm"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={filterTipe}
            onChange={(e) => setFilterTipe(e.target.value as any)}
            className="input-futuristic text-sm cursor-pointer"
          >
            <option value="ALL" className="bg-white text-slate-800">
              Semua Tipe ({db.keuangan.length})
            </option>
            <option value="MASUK" className="bg-white text-slate-800">
              Pemasukan (Debit)
            </option>
            <option value="KELUAR" className="bg-white text-slate-800">
              Pengeluaran (Kredit)
            </option>
          </select>
        </div>

        <div className="w-full sm:w-44">
          <select
            value={filterMetode}
            onChange={(e) => setFilterMetode(e.target.value as any)}
            className="input-futuristic text-sm cursor-pointer"
          >
            <option value="ALL" className="bg-white text-slate-800">
              Semua Metode
            </option>
            <option value="CASH" className="bg-white text-slate-800">
              💵 Cash (Tunai)
            </option>
            <option value="TRANSFER" className="bg-white text-slate-800">
              💳 Transfer Bank
            </option>
            <option value="KREDIT" className="bg-white text-slate-800">
              📄 Kredit (Piutang)
            </option>
          </select>
        </div>
      </div>

      {/* Main Cashbook Section */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50">
          <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600 shrink-0" /> Buku Kas Utama
          </h3>
          <div className="text-xs sm:text-sm bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
            <span className="text-slate-500 font-medium">Total Saldo:</span>
            <span className="font-bold text-emerald-600 font-mono text-sm sm:text-base">
              {formatRupiah(totalSaldo)}
            </span>
          </div>
        </div>

        {/* Mobile Cards View (Visible on screens < md) */}
        <div className="block md:hidden p-3 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Belum ada pencatatan kas/keuangan.
            </div>
          ) : (
            filteredLogs.map((k) => {
              const isMasuk = k.tipe === 'MASUK';
              const badgeClass = isMasuk
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                : 'bg-rose-50 text-rose-700 border-rose-200/80';

              return (
                <div key={k.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeClass}`}>
                        {isMasuk ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {isMasuk ? 'PEMASUKAN' : 'PENGELUARAN'}
                      </span>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">{formatDate(k.date)}</p>
                    </div>

                    <div className="text-right">
                      <p className={`font-bold font-mono text-sm ${isMasuk ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isMasuk ? '+' : '-'}{formatRupiah(k.nominal)}
                      </p>
                      {k.metodePembayaran === 'KREDIT' || k.kategori === 'Piutang' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5">
                          <CreditCard className="w-3 h-3 text-amber-600" /> Kredit (Piutang)
                        </span>
                      ) : k.metodePembayaran === 'TRANSFER' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 mt-0.5">
                          <CreditCard className="w-3 h-3 text-indigo-500" /> {k.namaBank || 'Transfer'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-0.5">
                          <Banknote className="w-3 h-3 text-emerald-600" /> Cash
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-800 text-xs">{k.keterangan || '-'}</p>
                  </div>

                  {onDeleteKeuangan && (
                    <div className="flex justify-end pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          if (window.confirm('Hapus transaksi kas ini?')) {
                            onDeleteKeuangan(k.id);
                          }
                        }}
                        className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded border border-rose-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Transaksi
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table (Visible on screens >= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4">Metode Bayar</th>
                <th className="px-6 py-4">Keterangan / Rincian</th>
                <th className="px-6 py-4 text-right text-emerald-700">Pemasukan (Debit)</th>
                <th className="px-6 py-4 text-right text-rose-700">Pengeluaran (Kredit)</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Buku kas masih kosong atau tidak ada transaksi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((k) => {
                  const isMasuk = k.tipe === 'MASUK';
                  const isTransfer = k.metodePembayaran === 'TRANSFER';

                  return (
                    <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-slate-500 text-xs font-medium">{formatDate(k.date)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border inline-flex items-center gap-1 ${
                            isMasuk
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-rose-50 text-rose-700 border-rose-200/80'
                          }`}
                        >
                          {isMasuk ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {k.tipe}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {k.metodePembayaran === 'KREDIT' || k.kategori === 'Piutang' ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-amber-600" />
                            Kredit (Piutang)
                          </span>
                        ) : isTransfer ? (
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-indigo-600" />
                            Transfer ({k.namaBank || 'BANK'})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[11px] font-semibold inline-flex items-center gap-1">
                            <Banknote className="w-3 h-3 text-emerald-600" />
                            Cash
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-800 text-sm font-medium whitespace-normal break-words max-w-sm">
                        {k.keterangan}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                        {isMasuk ? formatRupiah(k.nominal) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                        {!isMasuk ? formatRupiah(k.nominal) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {onDeleteKeuangan && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus transaksi kas "${k.keterangan}"?`)) {
                                onDeleteKeuangan(k.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Transaksi Kas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

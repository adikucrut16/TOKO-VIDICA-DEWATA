import React, { useState } from 'react';
import { AppDatabase } from '../types';
import { ArrowDownLeft, ArrowUpRight, Search, ArrowLeftRight } from 'lucide-react';

interface StokViewProps {
  db: AppDatabase;
  onOpenModalStok: (tipe: 'MASUK' | 'KELUAR') => void;
}

export const StokView: React.FC<StokViewProps> = ({ db, onOpenModalStok }) => {
  const [search, setSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState<'ALL' | 'MASUK' | 'KELUAR'>('ALL');

  const filteredLogs = db.stok
    .filter((s) => {
      const prod = db.produk.find((p) => p.id === s.idProduk);
      const prodName = prod?.nama || '';
      const prodSku = prod?.sku || '';

      const matchSearch =
        prodName.toLowerCase().includes(search.toLowerCase()) ||
        prodSku.toLowerCase().includes(search.toLowerCase()) ||
        s.keterangan.toLowerCase().includes(search.toLowerCase());

      const matchTipe = filterTipe === 'ALL' || s.tipe === filterTipe;

      return matchSearch && matchTipe;
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
      {/* Action Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-indigo-600">
          <div>
            <h3 className="font-display font-bold text-slate-800 text-lg">Barang Masuk</h3>
            <p className="text-xs text-slate-500 mt-1">Catat penambahan stok (Restock/Beli Supplier)</p>
          </div>
          <button
            onClick={() => onOpenModalStok('MASUK')}
            className="bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" /> Catat Masuk
          </button>
        </div>

        <div className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <h3 className="font-display font-bold text-slate-800 text-lg">Barang Keluar</h3>
            <p className="text-xs text-slate-500 mt-1">Catat pengurangan stok (Terjual/Rusak)</p>
          </div>
          <button
            onClick={() => onOpenModalStok('KELUAR')}
            className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" /> Catat Keluar
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama barang, SKU, atau keterangan mutasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-futuristic pl-10 text-sm"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={filterTipe}
            onChange={(e) => setFilterTipe(e.target.value as any)}
            className="input-futuristic text-sm cursor-pointer"
          >
            <option value="ALL" className="bg-white text-slate-800">
              Semua Mutasi ({db.stok.length})
            </option>
            <option value="MASUK" className="bg-white text-slate-800">
              Barang Masuk
            </option>
            <option value="KELUAR" className="bg-white text-slate-800">
              Barang Keluar
            </option>
          </select>
        </div>
      </div>

      {/* Mutations Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-display font-bold text-slate-800 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-600" /> Log Riwayat Mutasi Stok
          </h3>
          <span className="text-xs font-medium text-slate-500">Total {filteredLogs.length} Entri</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4">Produk & Detail</th>
                <th className="px-6 py-4 text-center">Jumlah</th>
                <th className="px-6 py-4 text-right">Harga Satuan</th>
                <th className="px-6 py-4 text-right">Total Nilai</th>
                <th className="px-6 py-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Belum ada riwayat mutasi stok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((s) => {
                  const prod = db.produk.find((p) => p.id === s.idProduk) || {
                    nama: '[Produk Dihapus]',
                    kategori: '-',
                    satuan: '-',
                    isiKarton: '-'
                  };
                  const isMasuk = s.tipe === 'MASUK';
                  const badgeClass = isMasuk
                    ? 'bg-sky-50 text-sky-700 border-sky-200/80'
                    : 'bg-amber-50 text-amber-700 border-amber-200/80';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-slate-500 text-xs font-medium">{formatDate(s.date)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border inline-flex items-center gap-1 ${badgeClass}`}
                        >
                          {isMasuk ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {s.tipe}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{prod.nama}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          {prod.kategori} &bull; {prod.satuan} (Isi: {prod.isiKarton})
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">{s.jumlah}</td>
                      <td className="px-6 py-4 text-right text-slate-600 font-mono font-medium">
                        {formatRupiah(s.harga || 0)}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold font-mono ${
                          isMasuk ? 'text-indigo-600' : 'text-amber-600'
                        }`}
                      >
                        {formatRupiah((s.harga || 0) * s.jumlah)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs truncate max-w-xs">
                        {s.keterangan || '-'}
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

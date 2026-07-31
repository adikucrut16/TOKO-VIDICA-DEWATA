import React, { useState } from 'react';
import { AppDatabase, Produk } from '../types';
import { Search, Plus, Trash2, Edit, Package, Layers } from 'lucide-react';

interface ProdukViewProps {
  db: AppDatabase;
  onOpenAddModal: () => void;
  onOpenEditModal: (p: Produk) => void;
  onDeleteProduk: (id: string) => void;
  onQuickStok: (p: Produk, tipe: 'MASUK' | 'KELUAR') => void;
}

export const ProdukView: React.FC<ProdukViewProps> = ({
  db,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteProduk,
  onQuickStok
}) => {
  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('ALL');

  // Categories list
  const categories = Array.from(new Set(db.produk.map((p) => p.kategori).filter(Boolean)));

  // Compute stock levels per product
  const getSisaStok = (prodId: string) => {
    const masuk = db.stok
      .filter((s) => s.idProduk === prodId && s.tipe === 'MASUK')
      .reduce((a, b) => a + b.jumlah, 0);
    const keluar = db.stok
      .filter((s) => s.idProduk === prodId && s.tipe === 'KELUAR')
      .reduce((a, b) => a + b.jumlah, 0);
    return masuk - keluar;
  };

  // Filtered products
  const filteredProducts = db.produk.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.kategori.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedKategori === 'ALL' || p.kategori === selectedKategori;
    return matchSearch && matchCat;
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" /> Katalog Produk
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Kelola daftar barang, SKU, harga, satuan, serta pantau sisa stok otomatis.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="btn-neon px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Produk Baru</span>
        </button>
      </div>

      {/* Search & Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan SKU, Nama Produk, Kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-futuristic pl-10 text-sm"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="input-futuristic text-sm cursor-pointer"
          >
            <option value="ALL" className="bg-white text-slate-800">
              Semua Kategori ({db.produk.length})
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-white text-slate-800">
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Catalog Cards (Visible on screens < md) */}
      <div className="block md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-6 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2 animate-pulse" />
            Tidak ada produk yang cocok dengan pencarian.
          </div>
        ) : (
          filteredProducts.map((p) => {
            const sisa = getSisaStok(p.id);
            const minStok = p.minStok ?? 5;

            let stokBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
            if (sisa <= 0) {
              stokBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200/80 animate-pulse';
            } else if (sisa <= minStok) {
              stokBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200/80';
            }

            return (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-mono text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block mb-1">
                      {p.sku}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{p.nama}</h4>
                  </div>

                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${stokBadgeColor}`}>
                    {sisa} Unit
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Kategori</span>
                    <span className="font-semibold text-slate-700">{p.kategori || 'Umum'}</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Satuan / Isi</span>
                    <span className="font-semibold text-slate-700">{p.satuan || 'Pcs'} (Isi: {p.isiKarton || '1'})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Harga Dasar</span>
                    <span className="font-bold font-mono text-slate-900 text-sm">{formatRupiah(p.harga)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuickStok(p, 'MASUK')}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer active:scale-98"
                    >
                      + Stok
                    </button>
                    <button
                      onClick={() => onOpenEditModal(p)}
                      className="p-1.5 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Edit Produk"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteProduk(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Catalog Table (Visible on screens >= md) */}
      <div className="hidden md:block glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Kode SKU</th>
                <th className="px-6 py-4">Nama Produk</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 text-center">Satuan & Isi</th>
                <th className="px-6 py-4 text-right">Harga Dasar (Rp)</th>
                <th className="px-6 py-4 text-center">Sisa Stok</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-400 animate-pulse" />
                    Tidak ada produk yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const sisa = getSisaStok(p.id);
                  const minStok = p.minStok ?? 5;

                  let stokBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
                  if (sisa <= 0) {
                    stokBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200/80 animate-pulse';
                  } else if (sisa <= minStok) {
                    stokBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200/80';
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">
                        {p.sku}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{p.nama}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium border border-slate-200 text-slate-600">
                          {p.kategori || 'Umum'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">
                        {p.satuan || 'Pcs'}{' '}
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Isi: {p.isiKarton || '1'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-800 font-mono font-medium">
                        {formatRupiah(p.harga)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${stokBadgeColor}`}
                        >
                          {sisa} Unit
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onQuickStok(p, 'MASUK')}
                            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                            title="Tambah Stok"
                          >
                            + Stok
                          </button>
                          <button
                            onClick={() => onOpenEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Produk"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProduk(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

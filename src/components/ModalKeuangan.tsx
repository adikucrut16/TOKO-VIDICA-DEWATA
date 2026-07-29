import React, { useState, useEffect } from 'react';
import { TipeMutasi } from '../types';
import { X, Wallet, PlusCircle, MinusCircle, CheckCircle2 } from 'lucide-react';

interface ModalKeuanganProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    tipe: TipeMutasi;
    nominal: number;
    keterangan: string;
    kategori?: string;
  }) => void;
  tipe: TipeMutasi;
}

export const ModalKeuangan: React.FC<ModalKeuanganProps> = ({
  isOpen,
  onClose,
  onSave,
  tipe
}) => {
  const [nominal, setNominal] = useState<number | ''>('');
  const [keterangan, setKeterangan] = useState('');
  const [kategori, setKategori] = useState('Penjualan');

  useEffect(() => {
    setNominal('');
    setKeterangan('');
    setKategori(tipe === 'MASUK' ? 'Penjualan' : 'Operasional');
  }, [isOpen, tipe]);

  if (!isOpen) return null;

  const isMasuk = tipe === 'MASUK';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numNominal = Number(nominal);
    if (!numNominal || numNominal <= 0 || !keterangan.trim()) return;

    onSave({
      tipe,
      nominal: numNominal,
      keterangan: keterangan.trim(),
      kategori
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/80">
          <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
            {isMasuk ? (
              <PlusCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <MinusCircle className="w-5 h-5 text-rose-600" />
            )}
            {isMasuk ? 'Terima Pemasukan Kas (Debit)' : 'Catat Pengeluaran Kas (Kredit)'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Nominal Transaksi (Rp)
            </label>
            <input
              type="number"
              required
              min={1}
              value={nominal}
              onChange={(e) => setNominal(e.target.value ? Number(e.target.value) : '')}
              placeholder="0"
              className={`input-futuristic text-xl font-bold font-mono ${
                isMasuk ? 'text-emerald-600' : 'text-rose-600'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Kategori Transaksi
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="input-futuristic text-sm cursor-pointer"
            >
              {isMasuk ? (
                <>
                  <option value="Penjualan" className="bg-white text-slate-800">Penjualan Harian</option>
                  <option value="Modal" className="bg-white text-slate-800">Tambahan Modal</option>
                  <option value="Piutang" className="bg-white text-slate-800">Pembayaran Piutang</option>
                  <option value="Lainnya" className="bg-white text-slate-800">Lain-lain</option>
                </>
              ) : (
                <>
                  <option value="Operasional" className="bg-white text-slate-800">Biaya Operasional (Listrik/Air/Internet)</option>
                  <option value="Pembelian Stok" className="bg-white text-slate-800">Pembelian Stok Supplier</option>
                  <option value="Gaji" className="bg-white text-slate-800">Gaji / Honor Karyawan</option>
                  <option value="Sewa" className="bg-white text-slate-800">Sewa Tempat</option>
                  <option value="Lainnya" className="bg-white text-slate-800">Lain-lain</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Keterangan / Rincian
            </label>
            <textarea
              required
              rows={3}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder={
                isMasuk
                  ? 'Contoh: Hasil penjualan kasir Shift 1 Toko Vidica'
                  : 'Contoh: Pembayaran listrik dan air bulan ini'
              }
              className="input-futuristic text-sm resize-none"
            />
          </div>

          <div className="mt-6 pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-neon px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Simpan Entri Kas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

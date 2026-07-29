import React, { useState, useEffect } from 'react';
import { Produk, TipeMutasi } from '../types';
import { X, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface ModalStokProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    idProduk: string;
    tipe: TipeMutasi;
    jumlah: number;
    harga: number;
    keterangan: string;
    autoRecordCash: boolean;
  }) => void;
  tipe: TipeMutasi;
  produkList: Produk[];
  preselectedProduct?: Produk | null;
}

export const ModalStok: React.FC<ModalStokProps> = ({
  isOpen,
  onClose,
  onSave,
  tipe,
  produkList,
  preselectedProduct
}) => {
  const [selectedProdId, setSelectedProdId] = useState('');
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [harga, setHarga] = useState<number | ''>('');
  const [jenisMasuk, setJenisMasuk] = useState<'PEMBELIAN' | 'STOK_AWAL'>('PEMBELIAN');
  const [keterangan, setKeterangan] = useState('');
  const [autoRecordCash, setAutoRecordCash] = useState(true);

  const selectedProd = produkList.find((p) => p.id === selectedProdId);

  useEffect(() => {
    if (preselectedProduct) {
      setSelectedProdId(preselectedProduct.id);
      setHarga(preselectedProduct.harga);
    } else if (produkList.length > 0 && !selectedProdId) {
      setSelectedProdId(produkList[0].id);
      setHarga(produkList[0].harga);
    }
    setJumlah('');
    setJenisMasuk('PEMBELIAN');
    setKeterangan('');
    setAutoRecordCash(true);
  }, [isOpen, preselectedProduct, produkList]);

  // Handle change of Jenis Masuk
  const handleJenisMasukChange = (val: 'PEMBELIAN' | 'STOK_AWAL') => {
    setJenisMasuk(val);
    if (val === 'PEMBELIAN') {
      setAutoRecordCash(true);
    } else {
      setAutoRecordCash(false);
    }
  };

  // Update default price on product change
  const handleProductChange = (id: string) => {
    setSelectedProdId(id);
    const prod = produkList.find((p) => p.id === id);
    if (prod) {
      setHarga(prod.harga);
    }
  };

  if (!isOpen) return null;

  const numJumlah = Number(jumlah) || 0;
  const numHarga = Number(harga) || 0;
  const totalNilai = numJumlah * numHarga;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdId || numJumlah <= 0) return;

    let finalKeterangan = keterangan.trim();
    if (isMasuk) {
      const labelJenis = jenisMasuk === 'PEMBELIAN' ? 'Pembelian Barang' : 'Stok Awal';
      finalKeterangan = finalKeterangan ? `[${labelJenis}] ${finalKeterangan}` : labelJenis;
    } else {
      finalKeterangan = finalKeterangan || 'Penjualan Barang';
    }

    onSave({
      idProduk: selectedProdId,
      tipe,
      jumlah: numJumlah,
      harga: numHarga,
      keterangan: finalKeterangan,
      autoRecordCash: isMasuk ? (jenisMasuk === 'PEMBELIAN') : autoRecordCash
    });
    onClose();
  };

  const isMasuk = tipe === 'MASUK';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/80">
          <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
            {isMasuk ? (
              <ArrowDownLeft className="w-5 h-5 text-indigo-600" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-amber-600" />
            )}
            {isMasuk ? 'Catat Barang Masuk (Restock)' : 'Catat Barang Keluar (Terjual/Rusak)'}
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
              Pilih Produk
            </label>
            <select
              value={selectedProdId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="input-futuristic text-sm cursor-pointer"
              required
            >
              <option value="" disabled className="bg-white text-slate-400">
                -- Pilih Produk --
              </option>
              {produkList.map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-slate-800">
                  {p.sku} - {p.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Product Quick Info Card */}
          {selectedProd && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Kategori</div>
                <div className="text-xs font-bold text-indigo-600 mt-0.5">
                  {selectedProd.kategori}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Satuan</div>
                <div className="text-xs font-bold text-indigo-600 mt-0.5">
                  {selectedProd.satuan}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Isi Kemasan</div>
                <div className="text-xs font-bold text-indigo-600 mt-0.5">
                  {selectedProd.isiKarton}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Jumlah Unit
              </label>
              <input
                type="number"
                required
                min={1}
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="input-futuristic text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Harga Satuan (Rp)
              </label>
              <input
                type="number"
                required
                min={0}
                value={harga}
                onChange={(e) => setHarga(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="input-futuristic text-sm font-mono"
              />
            </div>
          </div>

          {/* Calculated Total Display */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center shadow-2xs">
            <span className="text-xs text-slate-500 font-bold">Total Nilai Transaksi:</span>
            <span className="font-mono font-bold text-indigo-600 text-base">
              Rp {totalNilai.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Keterangan / Jenis Barang Masuk */}
          {isMasuk && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Keterangan / Jenis Restock *
              </label>
              <select
                value={jenisMasuk}
                onChange={(e) => handleJenisMasukChange(e.target.value as 'PEMBELIAN' | 'STOK_AWAL')}
                className="input-futuristic text-sm cursor-pointer font-semibold text-slate-800"
              >
                <option value="PEMBELIAN" className="bg-white text-slate-800 font-medium">
                  Pembelian Barang (Tercatat di Pembukuan Kas)
                </option>
                <option value="STOK_AWAL" className="bg-white text-slate-800 font-medium">
                  Stok Awal (TIDAK Tercatat di Pembukuan Kas)
                </option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder={isMasuk ? 'Cth: Restock dari Distributor A / Inv #123' : 'Cth: Penjualan Grosir'}
              className="input-futuristic text-sm"
            />
          </div>

          {/* Bookkeeping Notice / Checkbox */}
          {isMasuk ? (
            <div className={`p-3 rounded-xl border text-xs font-medium transition-all ${
              jenisMasuk === 'PEMBELIAN' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {jenisMasuk === 'PEMBELIAN' ? (
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pilihan <strong>Pembelian Barang</strong> akan otomatis dicatat ke <strong>Pembukuan Kas (Pengeluaran)</strong>.</span>
                </p>
              ) : (
                <p className="flex items-center gap-2">
                  <span className="font-bold text-amber-600 shrink-0 text-sm">ℹ</span>
                  <span>Pilihan <strong>Stok Awal</strong> <u>TIDAK dicatat</u> ke Pembukuan Kas (Hanya menambah jumlah stok barang).</span>
                </p>
              )}
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoRecordCash}
                onChange={(e) => setAutoRecordCash(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">
                Sinkronkan otomatis ke Buku Kas (Pemasukan Uang)
              </span>
            </label>
          )}

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
              <CheckCircle2 className="w-4 h-4" /> Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { PurchaseOrder, ItemPO, Produk } from '../types';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  X, 
  PlusCircle, 
  MinusCircle, 
  Printer, 
  FileDown, 
  Building2, 
  Receipt
} from 'lucide-react';

interface PurchaseOrderViewProps {
  poList: PurchaseOrder[];
  produkList: Produk[];
  onSavePO: (po: Omit<PurchaseOrder, 'id'> & { id?: string }, recordStock?: boolean) => PurchaseOrder;
  onDeletePO: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: 'DRAFT' | 'DIPESAN' | 'DITERIMA' | 'BATAL') => void;
}

export const PurchaseOrderView: React.FC<PurchaseOrderViewProps> = ({
  poList,
  produkList,
  onSavePO,
  onDeletePO,
  onUpdateStatus
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePO, setActivePO] = useState<PurchaseOrder | null>(null);

  // Form State for New PO
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [namaSupplier, setNamaSupplier] = useState('');
  const [noTelpSupplier, setNoTelpSupplier] = useState('');
  const [alamatSupplier, setAlamatSupplier] = useState('');
  const [catatan, setCatatan] = useState('');
  const [recordStock, setRecordStock] = useState(false);

  // Items list in form
  const [items, setItems] = useState<ItemPO[]>([
    { 
      idProduk: produkList[0]?.id || '', 
      namaProduk: produkList[0]?.nama || '', 
      quantity: 1, 
      satuan: produkList[0]?.satuan || 'Pcs',
      harga: 0
    }
  ]);

  const openModal = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    setNamaSupplier('');
    setNoTelpSupplier('');
    setAlamatSupplier('');
    setCatatan('');
    setRecordStock(false);

    if (produkList.length > 0) {
      setItems([{
        idProduk: produkList[0].id,
        namaProduk: produkList[0].nama,
        quantity: 1,
        satuan: produkList[0].satuan || 'Pcs',
        harga: 0
      }]);
    } else {
      setItems([{ idProduk: '', namaProduk: '', quantity: 1, satuan: 'Pcs', harga: 0 }]);
    }

    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    const defaultProd = produkList[0];
    setItems([
      ...items,
      {
        idProduk: defaultProd ? defaultProd.id : '',
        namaProduk: defaultProd ? defaultProd.nama : '',
        quantity: 1,
        satuan: defaultProd ? defaultProd.satuan : 'Pcs',
        harga: 0
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemPO, value: any) => {
    const newItems = [...items];
    if (field === 'idProduk') {
      const prod = produkList.find((p) => p.id === value);
      if (prod) {
        newItems[index].idProduk = prod.id;
        newItems[index].namaProduk = prod.nama;
        newItems[index].satuan = prod.satuan;
        newItems[index].harga = 0;
      } else {
        newItems[index].idProduk = value;
      }
    } else {
      (newItems[index] as any)[field] = value;
    }
    setItems(newItems);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSupplier.trim()) {
      alert('Silakan masukkan nama supplier.');
      return;
    }

    const validItems = items.filter((it) => it.namaProduk.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Masukkan minimal 1 barang dengan quantity yang valid.');
      return;
    }

    let nextNum = poList.length + 1;
    poList.forEach((p) => {
      if (p.noPO) {
        const match = p.noPO.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= nextNum) nextNum = num + 1;
        }
      }
    });
    const seqFormatted = String(nextNum).padStart(4, '0');
    const generatedNoPO = `PO-${seqFormatted}`;

    const createdPO = onSavePO(
      {
        noPO: generatedNoPO,
        tanggal,
        namaSupplier: namaSupplier.trim(),
        noTelpSupplier,
        alamatSupplier,
        items: validItems,
        totalHarga: 0,
        catatan,
        status: 'DIPESAN'
      },
      recordStock
    );

    setIsModalOpen(false);
    if (createdPO) {
      setActivePO(createdPO);
    }
  };

  const handlePrintPO = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-po-modal');
    if (!element) {
      alert('Elemen Nota Purchase Order tidak ditemukan.');
      return;
    }

    try {
      const html2pdfModule = typeof html2pdf === 'function' ? html2pdf : (html2pdf as any).default;
      if (!html2pdfModule) {
        throw new Error('Library html2pdf tidak tersedia');
      }

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.width = '750px';
      clone.style.padding = '24px';
      clone.style.background = '#ffffff';
      clone.style.color = '#0f172a';

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.appendChild(clone);
      document.body.appendChild(container);

      const filename = `Nota_Purchase_Order_${activePO?.noPO || activePO?.id || 'Vidica'}.pdf`;
      const opt = {
        margin:       6,
        filename:     filename,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdfModule().set(opt).from(clone).save();
      document.body.removeChild(container);
    } catch (err) {
      console.error('Download PDF error:', err);
      alert('Sistem akan membuka menu Cetak Browser. Pilih "Simpan sebagai PDF" / "Save as PDF" pada tujuan printer Anda.');
      window.print();
    }
  };

  const filteredPO = poList.filter(
    (p) =>
      p.namaSupplier.toLowerCase().includes(search.toLowerCase()) ||
      p.tanggal.includes(search) ||
      (p.noPO && p.noPO.toLowerCase().includes(search.toLowerCase())) ||
      p.items.some((it) => it.namaProduk.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-600" /> Purchase Order (PO) Supplier
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan pemesanan barang ke supplier/distributor (Nama Supplier, List Barang, dan Qty) lengkap dengan cetak nota & simpan PDF resmi.
          </p>
        </div>

        <button
          onClick={openModal}
          className="btn-neon px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Buat Purchase Order (PO)
        </button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No. PO, nama supplier, tanggal, atau nama barang..."
            className="w-full text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600">
              Clear
            </button>
          )}
        </div>

        <div className="md:col-span-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Total Purchase Order</p>
            <p className="text-2xl font-bold font-mono mt-0.5">{poList.length} Pemesanan</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">No. PO & Status</th>
                <th className="px-6 py-4">Nama Supplier</th>
                <th className="px-6 py-4">List Barang & Qty</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPO.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Belum ada dokumen Purchase Order. Klik "Buat Purchase Order (PO)" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                filteredPO.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block mb-1">
                        {p.noPO || p.id}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {p.tanggal}
                      </div>
                      {p.status === 'DITERIMA' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3" /> DITERIMA
                        </span>
                      ) : p.status === 'BATAL' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          <X className="w-3 h-3" /> BATAL
                        </span>
                      ) : p.status === 'DIPESAN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> DIPESAN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> DRAFT
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {p.namaSupplier}
                      </div>
                      {p.noTelpSupplier && <p className="text-xs text-slate-500 font-mono mt-0.5">Telp: {p.noTelpSupplier}</p>}
                      {p.alamatSupplier && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{p.alamatSupplier}</p>}
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="space-y-1">
                        {p.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 text-xs bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                            <span className="font-medium text-slate-700 truncate">{it.namaProduk}</span>
                            <span className="font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                              {it.quantity} {it.satuan}
                            </span>
                          </div>
                        ))}
                      </div>
                      {p.catatan && (
                        <p className="text-xs text-slate-500 italic mt-2">Ket: {p.catatan}</p>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActivePO(p)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                          title="Lihat / Cetak PO"
                        >
                          <Printer className="w-3.5 h-3.5" /> Nota PO
                        </button>

                        {p.status !== 'DITERIMA' && (
                          <button
                            onClick={() => onUpdateStatus(p.id, 'DITERIMA')}
                            className="px-2 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                            title="Tandai Diterima"
                          >
                            Selesai
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm('Hapus dokumen Purchase Order ini?')) {
                              onDeletePO(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus PO"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Purchase Order Baru */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base font-display">Buat Purchase Order (PO) Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Tanggal Order *
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="input-futuristic text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Nama Supplier / Distributor *
                  </label>
                  <input
                    type="text"
                    required
                    value={namaSupplier}
                    onChange={(e) => setNamaSupplier(e.target.value)}
                    placeholder="Contoh: PT. Sumber Makmur Utama"
                    className="input-futuristic text-sm"
                  />
                </div>
              </div>

              {/* Supplier Details Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Detail Supplier & Kontak
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={noTelpSupplier}
                    onChange={(e) => setNoTelpSupplier(e.target.value)}
                    placeholder="No. Telepon / WhatsApp Supplier"
                    className="input-futuristic text-sm bg-white font-mono"
                  />
                  <input
                    type="text"
                    value={alamatSupplier}
                    onChange={(e) => setAlamatSupplier(e.target.value)}
                    placeholder="Alamat Supplier"
                    className="input-futuristic text-sm bg-white"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    List Barang Yang Dipesan (PO) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> Tambah Barang
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Item #{idx + 1}</span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <MinusCircle className="w-3.5 h-3.5" /> Hapus
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        {/* Produk dropdown / name */}
                        <div className="sm:col-span-7">
                          {produkList.length > 0 ? (
                            <select
                              value={item.idProduk}
                              onChange={(e) => handleItemChange(idx, 'idProduk', e.target.value)}
                              className="input-futuristic text-xs bg-white cursor-pointer"
                            >
                              {produkList.map((p) => (
                                <option key={p.id} value={p.id} className="bg-white text-slate-800">
                                  {p.nama}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              required
                              value={item.namaProduk}
                              onChange={(e) => handleItemChange(idx, 'namaProduk', e.target.value)}
                              placeholder="Nama Produk / Barang"
                              className="input-futuristic text-xs bg-white"
                            />
                          )}
                        </div>

                        {/* Qty & Satuan */}
                        <div className="sm:col-span-5 flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            placeholder="Qty"
                            className="input-futuristic text-xs bg-white font-mono flex-1"
                          />
                          <input
                            type="text"
                            value={item.satuan}
                            onChange={(e) => handleItemChange(idx, 'satuan', e.target.value)}
                            placeholder="Satuan"
                            className="input-futuristic text-xs bg-white flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Catatan / Syarat Ketentuan Pemesanan
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Kirim sebelum tanggal 10 / Konfirmasi tanggal kirim"
                  className="input-futuristic text-sm"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recordStock"
                  checked={recordStock}
                  onChange={(e) => setRecordStock(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="recordStock" className="text-xs font-semibold text-indigo-950 cursor-pointer">
                  Otomatis catat penambahan stok barang masuk di log mutasi
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-neon px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" /> Simpan Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Purchase Order & Cetak / Simpan PDF */}
      {activePO && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActivePO(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in duration-200 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Controls (Hidden during print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm font-display">Pratinjau Purchase Order (PO)</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPO}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Cetak (Print)
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <FileDown className="w-4 h-4" /> Simpan PDF
                </button>

                <button
                  type="button"
                  onClick={() => setActivePO(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area Document */}
            <div id="printable-po-modal" className="p-8 bg-white text-slate-900 space-y-6">
              {/* Header Toko Vidica Dewata */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-900 font-display">
                    TOKO VIDICA DEWATA
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">Jl. Gunung Seraya No. 28, Denpasar, Bali</p>
                  <p className="text-xs text-slate-500">Telp: 08125921720 / 081283364685</p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">
                    PURCHASE ORDER
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-2">
                    No. PO: <span className="text-indigo-900">{activePO.noPO || activePO.id}</span>
                  </p>
                  <p className="text-xs font-mono text-slate-600">Tanggal: {activePO.tanggal}</p>
                </div>
              </div>

              {/* Detail Supplier */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold uppercase tracking-wider text-slate-500 text-[10px] mb-1">
                  KEPADA YTH. (SUPPLIER / DISTRIBUTOR)
                </p>
                <p className="font-bold text-sm text-slate-900">{activePO.namaSupplier}</p>
                {activePO.noTelpSupplier && <p className="text-slate-700 mt-0.5"><span className="font-semibold">Telp:</span> {activePO.noTelpSupplier}</p>}
                {activePO.alamatSupplier && <p className="text-slate-700 mt-0.5"><span className="font-semibold">Alamat:</span> {activePO.alamatSupplier}</p>}
              </div>

              {/* Tabel Items PO (No price columns) */}
              <div className="overflow-hidden border border-slate-300 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      <th className="p-3 text-center border-r border-slate-300 w-12">No</th>
                      <th className="p-3 border-r border-slate-300">Deskripsi Barang / Produk</th>
                      <th className="p-3 text-center w-36">Qty & Satuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activePO.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-800 border-r border-slate-200">{it.namaProduk}</td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-950">
                          {it.quantity} {it.satuan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Catatan & Pengesahan */}
              <div className="pt-2 grid grid-cols-2 gap-6 items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">CATATAN PEMESANAN:</p>
                  <p className="text-xs bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700 italic min-h-[48px]">
                    {activePO.catatan || 'Mohon konfirmasi kesiapan barang dan tanggal estimasi pengiriman.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center text-xs">
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-12">Hormat Kami</p>
                    <p className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                      ( Toko Vidica Dewata )
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-12">Disetujui Supplier</p>
                    <p className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                      ( {activePO.namaSupplier} )
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions (Hidden during print) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
              <button
                type="button"
                onClick={() => setActivePO(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer shadow-2xs"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrintPO}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
                >
                  <Printer className="w-4 h-4 text-indigo-600" /> Cetak (Print)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="btn-neon px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" /> Simpan File PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

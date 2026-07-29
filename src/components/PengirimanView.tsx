import React, { useState } from 'react';
import { Customer, Pengiriman, ItemPengiriman, Produk } from '../types';
import { Truck, Plus, Search, Trash2, Calendar, PackageCheck, User, CheckCircle, Clock, X, PlusCircle, MinusCircle, FileText } from 'lucide-react';

interface PengirimanViewProps {
  pengirimanList: Pengiriman[];
  customers: Customer[];
  produkList: Produk[];
  onSavePengiriman: (pengiriman: Omit<Pengiriman, 'id'> & { id?: string }, deductStock?: boolean) => void;
  onDeletePengiriman: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: 'PROSES' | 'TERKIRIM' | 'BATAL') => void;
}

export const PengirimanView: React.FC<PengirimanViewProps> = ({
  pengirimanList,
  customers,
  produkList,
  onSavePengiriman,
  onDeletePengiriman,
  onUpdateStatus
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for New Pengiriman
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [namaCustomerManual, setNamaCustomerManual] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [catatan, setCatatan] = useState('');
  const [deductStock, setDeductStock] = useState(true);

  // Items list in form
  const [items, setItems] = useState<ItemPengiriman[]>([
    { idProduk: produkList[0]?.id || '', namaProduk: produkList[0]?.nama || '', quantity: 1, satuan: produkList[0]?.satuan || 'Pcs' }
  ]);

  const openModal = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    if (customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
      setNamaCustomerManual(customers[0].namaCustomer);
      setAlamat(customers[0].alamat);
      setNoTelp(customers[0].noTelp);
    } else {
      setSelectedCustomerId('');
      setNamaCustomerManual('');
      setAlamat('');
      setNoTelp('');
    }
    setCatatan('');
    setDeductStock(true);

    if (produkList.length > 0) {
      setItems([{
        idProduk: produkList[0].id,
        namaProduk: produkList[0].nama,
        quantity: 1,
        satuan: produkList[0].satuan || 'Pcs'
      }]);
    } else {
      setItems([{ idProduk: '', namaProduk: '', quantity: 1, satuan: 'Pcs' }]);
    }

    setIsModalOpen(true);
  };

  const handleSelectCustomerChange = (custID: string) => {
    setSelectedCustomerId(custID);
    if (custID === 'MANUAL') {
      setNamaCustomerManual('');
      setAlamat('');
      setNoTelp('');
    } else {
      const found = customers.find((c) => c.id === custID);
      if (found) {
        setNamaCustomerManual(found.namaCustomer);
        setAlamat(found.alamat);
        setNoTelp(found.noTelp);
      }
    }
  };

  const handleAddItemRow = () => {
    const defaultProd = produkList[0];
    setItems([
      ...items,
      {
        idProduk: defaultProd ? defaultProd.id : '',
        namaProduk: defaultProd ? defaultProd.nama : '',
        quantity: 1,
        satuan: defaultProd ? defaultProd.satuan : 'Pcs'
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemPengiriman, value: any) => {
    const newItems = [...items];
    if (field === 'idProduk') {
      const prod = produkList.find((p) => p.id === value);
      if (prod) {
        newItems[index].idProduk = prod.id;
        newItems[index].namaProduk = prod.nama;
        newItems[index].satuan = prod.satuan;
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
    const finalCustomerName = selectedCustomerId === 'MANUAL' || !selectedCustomerId ? namaCustomerManual.trim() : (customers.find(c => c.id === selectedCustomerId)?.namaCustomer || namaCustomerManual.trim());
    
    if (!finalCustomerName) {
      alert('Silakan masukkan atau pilih nama customer.');
      return;
    }

    const validItems = items.filter((it) => it.namaProduk.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Masukkan minimal 1 barang dengan quantity yang valid.');
      return;
    }

    onSavePengiriman(
      {
        tanggal,
        idCustomer: selectedCustomerId !== 'MANUAL' ? selectedCustomerId : undefined,
        namaCustomer: finalCustomerName,
        alamat,
        noTelp,
        items: validItems,
        catatan,
        status: 'PROSES'
      },
      deductStock
    );

    setIsModalOpen(false);
  };

  const filteredPengiriman = pengirimanList.filter(
    (p) =>
      p.namaCustomer.toLowerCase().includes(search.toLowerCase()) ||
      p.tanggal.includes(search) ||
      p.items.some((it) => it.namaProduk.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" /> Menu Pengiriman & Surat Jalan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan daftar pengiriman barang ke customer lengkap dengan rincian item, kuantitas, dan status pengiriman.
          </p>
        </div>

        <button
          onClick={openModal}
          className="btn-neon px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Buat Surat Pengiriman
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
            placeholder="Cari nama customer, tanggal pengiriman, atau nama barang..."
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
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Total Pengiriman</p>
            <p className="text-2xl font-bold font-mono mt-0.5">{pengirimanList.length} Transaksi</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pengiriman List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Tanggal & Status</th>
                <th className="px-6 py-4">Nama Customer</th>
                <th className="px-6 py-4">List Barang Dibeli (Qty & Satuan)</th>
                <th className="px-6 py-4">Catatan</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPengiriman.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Belum ada riwayat pengiriman. Klik "Buat Surat Pengiriman" untuk mencatat.
                  </td>
                </tr>
              ) : (
                filteredPengiriman.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-700 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {p.tanggal}
                      </div>
                      {p.status === 'TERKIRIM' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3" /> TERKIRIM
                        </span>
                      ) : p.status === 'BATAL' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          <X className="w-3 h-3" /> BATAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> PROSES
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400" />
                        {p.namaCustomer}
                      </div>
                      {p.noTelp && <p className="text-xs text-slate-500 font-mono mt-0.5">Telp: {p.noTelp}</p>}
                      {p.alamat && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{p.alamat}</p>}
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
                    </td>

                    <td className="px-6 py-4 align-top text-xs text-slate-600">
                      {p.catatan || '-'}
                    </td>

                    <td className="px-6 py-4 align-top text-center">
                      <div className="flex items-center justify-center gap-2">
                        {p.status !== 'TERKIRIM' && (
                          <button
                            onClick={() => onUpdateStatus(p.id, 'TERKIRIM')}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                            title="Tandai Terkirim"
                          >
                            Set Terkirim
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('Hapus riwayat pengiriman ini?')) {
                              onDeletePengiriman(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Pengiriman"
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

      {/* Modal Input Pengiriman */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base font-display">Buat Surat Pengiriman Baru</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Tanggal Pengiriman *
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
                    Pilih Customer *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomerChange(e.target.value)}
                    className="input-futuristic text-sm cursor-pointer"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white text-slate-800">
                        {c.namaCustomer} ({c.pic || 'No PIC'})
                      </option>
                    ))}
                    <option value="MANUAL" className="bg-white text-indigo-600 font-bold">
                      + Input Customer Manual Baru...
                    </option>
                  </select>
                </div>
              </div>

              {(selectedCustomerId === 'MANUAL' || customers.length === 0) && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Data Customer Manual
                  </p>
                  <div>
                    <input
                      type="text"
                      required
                      value={namaCustomerManual}
                      onChange={(e) => setNamaCustomerManual(e.target.value)}
                      placeholder="Nama Customer / Toko"
                      className="input-futuristic text-sm bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={noTelp}
                      onChange={(e) => setNoTelp(e.target.value)}
                      placeholder="No. Telp / WhatsApp"
                      className="input-futuristic text-sm bg-white font-mono"
                    />
                    <input
                      type="text"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      placeholder="Alamat Pengiriman"
                      className="input-futuristic text-sm bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Items Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    List Barang Yang Dibeli *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> Tambah Barang
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex-1 w-full">
                        {produkList.length > 0 ? (
                          <select
                            value={item.idProduk}
                            onChange={(e) => handleItemChange(idx, 'idProduk', e.target.value)}
                            className="input-futuristic text-xs bg-white cursor-pointer"
                          >
                            {produkList.map((p) => (
                              <option key={p.id} value={p.id} className="bg-white text-slate-800">
                                {p.nama} ({p.sku})
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

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="w-24">
                          <input
                            type="number"
                            min={1}
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            placeholder="Qty"
                            className="input-futuristic text-xs bg-white font-mono"
                          />
                        </div>

                        <div className="w-28">
                          <input
                            type="text"
                            value={item.satuan}
                            onChange={(e) => handleItemChange(idx, 'satuan', e.target.value)}
                            placeholder="Satuan"
                            className="input-futuristic text-xs bg-white"
                          />
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Hapus Baris"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Catatan / Keterangan Pengiriman
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Titip di kasir / Kirim sore hari"
                  className="input-futuristic text-sm"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deductStock"
                  checked={deductStock}
                  onChange={(e) => setDeductStock(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="deductStock" className="text-xs font-semibold text-indigo-950 cursor-pointer">
                  Otomatis potong stok barang keluar di sistem mutasi stok
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
                  <FileText className="w-4 h-4" /> Simpan Pengiriman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

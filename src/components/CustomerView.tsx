import React, { useState } from 'react';
import { Customer } from '../types';
import { Users, Plus, Search, Edit, Trash2, MapPin, Phone, UserCheck, X, Save } from 'lucide-react';

interface CustomerViewProps {
  customers: Customer[];
  onSaveCustomer: (customer: Omit<Customer, 'id'> & { id?: string }) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  customers,
  onSaveCustomer,
  onDeleteCustomer
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [namaCustomer, setNamaCustomer] = useState('');
  const [alamat, setAlamat] = useState('');
  const [pic, setPic] = useState('');
  const [noTelp, setNoTelp] = useState('');

  const openCreateModal = () => {
    setEditingCustomer(null);
    setNamaCustomer('');
    setAlamat('');
    setPic('');
    setNoTelp('');
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setNamaCustomer(cust.namaCustomer);
    setAlamat(cust.alamat);
    setPic(cust.pic);
    setNoTelp(cust.noTelp);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaCustomer.trim()) return;

    onSaveCustomer({
      id: editingCustomer?.id,
      namaCustomer: namaCustomer.trim(),
      alamat: alamat.trim(),
      pic: pic.trim(),
      noTelp: noTelp.trim()
    });

    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.namaCustomer.toLowerCase().includes(search.toLowerCase()) ||
      c.pic.toLowerCase().includes(search.toLowerCase()) ||
      c.noTelp.toLowerCase().includes(search.toLowerCase()) ||
      c.alamat.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> Daftar Customer & Pelanggan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen database pelanggan toko, alamat pengiriman, dan kontak PIC.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-neon px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Tambah Customer Baru
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama customer, PIC, no. telp, atau alamat..."
            className="w-full text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600">
              Clear
            </button>
          )}
        </div>

        <div className="md:col-span-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Total Customer</p>
            <p className="text-2xl font-bold font-mono mt-0.5">{customers.length} Pelanggan</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Customer List Cards/Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Nama Customer</th>
                <th className="px-6 py-4">PIC / Penanggung Jawab</th>
                <th className="px-6 py-4">No. Telp / WA</th>
                <th className="px-6 py-4">Alamat Lengkap</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Belum ada data customer tersimpan.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{c.namaCustomer}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        {c.pic || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        {c.noTelp || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 max-w-sm">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{c.alamat || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus customer "${c.namaCustomer}"?`)) {
                              onDeleteCustomer(c.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Customer"
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

      {/* Modal Add/Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base font-display">
                  {editingCustomer ? 'Edit Data Customer' : 'Tambah Customer Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Nama Customer / Toko *
                </label>
                <input
                  type="text"
                  required
                  value={namaCustomer}
                  onChange={(e) => setNamaCustomer(e.target.value)}
                  placeholder="Contoh: Toko Berkah Dewata"
                  className="input-futuristic text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    PIC (Person in Charge)
                  </label>
                  <input
                    type="text"
                    value={pic}
                    onChange={(e) => setPic(e.target.value)}
                    placeholder="Contoh: Pak Budi"
                    className="input-futuristic text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    No. Telp / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={noTelp}
                    onChange={(e) => setNoTelp(e.target.value)}
                    placeholder="081234567890"
                    className="input-futuristic text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Alamat Lengkap Pengiriman
                </label>
                <textarea
                  rows={3}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jalan, No, RT/RW, Kecamatan, Kota/Kabupaten..."
                  className="input-futuristic text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
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
                  <Save className="w-4 h-4" /> Simpan Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

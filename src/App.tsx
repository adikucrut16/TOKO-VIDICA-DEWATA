import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  AppDatabase, 
  ViewTab, 
  Produk, 
  TipeMutasi, 
  GoogleSheetsConfig,
  Customer,
  Pengiriman,
  TransaksiKeuangan 
} from './types';
import { INITIAL_DATABASE } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProdukView } from './components/ProdukView';
import { StokView } from './components/StokView';
import { KeuanganView } from './components/KeuanganView';
import { CustomerView } from './components/CustomerView';
import { PengirimanView } from './components/PengirimanView';
import { LaporanView } from './components/LaporanView';
import { ModalProduk } from './components/ModalProduk';

import { ModalStok } from './components/ModalStok';
import { ModalKeuangan } from './components/ModalKeuangan';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { initAuthListener, googleSignIn, googleSignOut } from './lib/firebaseAuth';
import { 
  syncDatabaseDirectToSheets, 
  syncToWebApp, 
  TARGET_SPREADSHEET_ID, 
  TARGET_SPREADSHEET_URL, 
  DEFAULT_WEB_APP_URL 
} from './lib/googleSheets';

const LOCAL_STORAGE_KEY = 'vidicaDataFuturistic';
const CONFIG_STORAGE_KEY = 'vidicaSheetsConfig';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);

  // Database State
  const [db, setDb] = useState<AppDatabase>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.produk)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse local database:', e);
    }
    return INITIAL_DATABASE;
  });

  // Google Sheets Config State
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          webAppUrl: parsed.webAppUrl || DEFAULT_WEB_APP_URL,
          spreadsheetUrl: parsed.spreadsheetUrl || TARGET_SPREADSHEET_URL
        };
      }
    } catch (e) {
      console.error('Failed to parse sheets config:', e);
    }
    return { webAppUrl: DEFAULT_WEB_APP_URL, spreadsheetUrl: TARGET_SPREADSHEET_URL, autoSync: true };
  });

  // UI Navigation State
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Control States
  const [isModalProdukOpen, setIsModalProdukOpen] = useState(false);
  const [editingProduk, setEditingProduk] = useState<Produk | null>(null);

  const [isModalStokOpen, setIsModalStokOpen] = useState(false);
  const [stokModalTipe, setStokModalTipe] = useState<TipeMutasi>('MASUK');
  const [stokPreselectedProd, setStokPreselectedProd] = useState<Produk | null>(null);

  const [isModalKeuanganOpen, setIsModalKeuanganOpen] = useState(false);
  const [keuanganModalTipe, setKeuanganModalTipe] = useState<TipeMutasi>('MASUK');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auth Listener Initialization
  useEffect(() => {
    const unsubscribe = initAuthListener(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Show Toast Message helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Google Login / Logout handlers
  const handleLoginGoogle = async () => {
    try {
      const res = await googleSignIn();
      setUser(res.user);
      setAccessToken(res.accessToken);
      setIsGuestMode(false);
      showToast(`Login Google berhasil! Terhubung sebagai ${res.user.email}`);
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      showToast(err.message || 'Gagal login dengan Google.');
    }
  };

  const handleLogoutGoogle = async () => {
    await googleSignOut();
    setUser(null);
    setAccessToken(null);
    setIsGuestMode(false);
    showToast('Berhasil keluar dari akun Google.');
  };

  // Google Sheets Synchronization (Direct API + Apps Script Web App Endpoint)
  const syncToSheets = async (targetDb = db) => {
    const confirmed = window.confirm(
      'Apakah Anda ingin menyinkronkan dan memperbarui data di Google Spreadsheet?'
    );
    if (!confirmed) return;

    setIsSyncing(true);
    let successCount = 0;
    let messages: string[] = [];

    // 1. Sync via Apps Script Web App endpoint if available
    const targetWebAppUrl = sheetsConfig.webAppUrl || DEFAULT_WEB_APP_URL;
    if (targetWebAppUrl) {
      const webAppRes = await syncToWebApp(targetDb, targetWebAppUrl);
      if (webAppRes.success) {
        successCount++;
        messages.push('Kirim ke Apps Script berhasil');
      }
    }

    // 2. Sync via Direct Google Sheets API if logged in
    if (accessToken) {
      const directRes = await syncDatabaseDirectToSheets(
        targetDb,
        accessToken,
        sheetsConfig.spreadsheetUrl || TARGET_SPREADSHEET_ID
      );
      if (directRes.success) {
        successCount++;
        messages.push('Direct Sheets API berhasil');
      }
    }

    setIsSyncing(false);

    if (successCount > 0) {
      const nowStr = new Date().toISOString();
      setSheetsConfig((prev) => {
        const updated = { ...prev, lastSyncedAt: nowStr };
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      showToast(`Rekap ke Google Sheets Berhasil! (${messages.join(', ')})`);
    } else {
      showToast('Gagal merekap ke Google Sheets. Periksa koneksi atau otorisasi.');
    }
  };

  // Save to LocalStorage & Optional Direct Auto Sync
  const saveDatabase = (newDb: AppDatabase) => {
    setDb(newDb);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDb));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }

    if (sheetsConfig.autoSync) {
      const targetWebAppUrl = sheetsConfig.webAppUrl || DEFAULT_WEB_APP_URL;
      if (targetWebAppUrl) {
        syncToWebApp(newDb, targetWebAppUrl);
      }
      if (accessToken) {
        syncDatabaseDirectToSheets(
          newDb,
          accessToken,
          sheetsConfig.spreadsheetUrl || TARGET_SPREADSHEET_ID
        ).then((res) => {
          if (res.success) {
            const nowStr = new Date().toISOString();
            setSheetsConfig((prev) => {
              const updated = { ...prev, lastSyncedAt: nowStr };
              localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          }
        });
      }
    }
  };

  // Save Config handler
  const handleSaveConfig = (cfg: GoogleSheetsConfig) => {
    setSheetsConfig(cfg);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(cfg));
    showToast('Pengaturan Google Sheets disimpan.');
  };

  // Reset Data handler
  const handleResetData = () => {
    if (
      window.confirm(
        'PERINGATAN: Apakah Anda yakin ingin menghapus SELUA data dan mengembalikan ke data sampel Toko Vidica Dewata?'
      )
    ) {
      setDb(INITIAL_DATABASE);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DATABASE));
      showToast('Database berhasil di-reset ke data awal.');
    }
  };

  // --- CRUD: PRODUK ---
  const handleSaveProduk = (prodData: Omit<Produk, 'id'> & { id?: string }) => {
    let updatedProducts: Produk[];

    if (prodData.id) {
      // Edit
      updatedProducts = db.produk.map((p) =>
        p.id === prodData.id ? ({ ...p, ...prodData } as Produk) : p
      );
      showToast(`Produk "${prodData.nama}" berhasil diperbarui.`);
    } else {
      // Create
      const newProd: Produk = {
        ...prodData,
        id: `PROD-${Date.now()}`
      };
      updatedProducts = [...db.produk, newProd];
      showToast(`Produk "${prodData.nama}" berhasil ditambahkan.`);
    }

    saveDatabase({
      ...db,
      produk: updatedProducts
    });
  };

  const handleDeleteProduk = (id: string) => {
    const prod = db.produk.find((p) => p.id === id);
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus produk "${prod?.nama || 'ini'}" dari katalog?`
      )
    ) {
      const updated = db.produk.filter((p) => p.id !== id);
      saveDatabase({
        ...db,
        produk: updated
      });
      showToast('Produk berhasil dihapus.');
    }
  };

  // --- CRUD: STOK MUTASI ---
  const handleSaveStok = (data: {
    idProduk: string;
    tipe: TipeMutasi;
    jumlah: number;
    harga: number;
    keterangan: string;
    autoRecordCash: boolean;
  }) => {
    const newMutasi = {
      id: `STK-${Date.now()}`,
      date: new Date().toISOString(),
      idProduk: data.idProduk,
      tipe: data.tipe,
      jumlah: data.jumlah,
      harga: data.harga,
      keterangan: data.keterangan
    };

    let updatedKeuangan = [...db.keuangan];

    if (data.autoRecordCash) {
      const prod = db.produk.find((p) => p.id === data.idProduk);
      const totalNilai = data.jumlah * data.harga;
      const isMasukStok = data.tipe === 'MASUK';

      updatedKeuangan.unshift({
        id: `KEU-AUTO-${Date.now()}`,
        date: new Date().toISOString(),
        tipe: isMasukStok ? 'KELUAR' : 'MASUK', // Buying stock = Cash Out; Selling stock = Cash In
        nominal: totalNilai,
        keterangan: `[AUTO] ${isMasukStok ? 'Pembelian' : 'Penjualan'} Stok: ${
          data.jumlah
        } unit ${prod?.nama || 'Barang'}`,
        kategori: isMasukStok ? 'Pembelian Stok' : 'Penjualan'
      });
    }

    saveDatabase({
      ...db,
      stok: [newMutasi, ...db.stok],
      keuangan: updatedKeuangan
    });

    showToast(`Mutasi stok ${data.tipe} berhasil dicatat.`);
  };

  const handleDeleteStok = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus entri mutasi stok ini?')) {
      saveDatabase({
        ...db,
        stok: db.stok.filter((s) => s.id !== id)
      });
      showToast('Entri mutasi stok berhasil dihapus.');
    }
  };

  // --- CRUD: KEUANGAN ---
  const handleSaveKeuangan = (data: {
    tipe: TipeMutasi;
    nominal: number;
    keterangan: string;
    kategori?: string;
    metodePembayaran?: 'CASH' | 'TRANSFER';
    namaBank?: string;
  }) => {
    const newTrans: TransaksiKeuangan = {
      id: `KEU-${Date.now()}`,
      date: new Date().toISOString(),
      tipe: data.tipe,
      nominal: data.nominal,
      keterangan: data.keterangan,
      kategori: data.kategori || (data.tipe === 'MASUK' ? 'Penjualan' : 'Operasional'),
      metodePembayaran: data.metodePembayaran || 'CASH',
      namaBank: data.namaBank
    };

    saveDatabase({
      ...db,
      keuangan: [newTrans, ...db.keuangan]
    });

    const methodDesc = data.metodePembayaran === 'TRANSFER' ? ` (Transfer ${data.namaBank || ''})` : ' (Cash)';
    showToast(`Entri Kas (${data.tipe})${methodDesc} sebesar Rp ${data.nominal.toLocaleString('id-ID')} berhasil dicatat.`);
  };

  const handleDeleteKeuangan = (id: string) => {
    const target = db.keuangan.find((k) => k.id === id);
    if (target) {
      saveDatabase({
        ...db,
        keuangan: db.keuangan.filter((k) => k.id !== id)
      });
      showToast(`Transaksi kas "${target.keterangan}" berhasil dihapus.`);
    }
  };

  // --- CRUD: KATEGORI ---
  const handleDeleteCategory = (categoryName: string) => {
    const updatedCustom = (db.customKategori || []).filter(
      (c) => c.toLowerCase() !== categoryName.toLowerCase()
    );
    saveDatabase({
      ...db,
      customKategori: updatedCustom
    });
    showToast(`Kategori "${categoryName}" berhasil dihapus.`);
  };

  // --- CRUD: CUSTOMER ---
  const handleSaveCustomer = (custData: Omit<Customer, 'id'> & { id?: string }) => {
    const currentList = db.customer || [];
    let updatedList: Customer[];

    if (custData.id) {
      updatedList = currentList.map((c) =>
        c.id === custData.id ? ({ ...c, ...custData } as Customer) : c
      );
      showToast(`Data customer "${custData.namaCustomer}" berhasil diperbarui.`);
    } else {
      const newCust: Customer = {
        ...custData,
        id: `CUST-${Date.now()}`
      };
      updatedList = [newCust, ...currentList];
      showToast(`Customer "${custData.namaCustomer}" berhasil ditambahkan.`);
    }

    saveDatabase({
      ...db,
      customer: updatedList
    });
  };

  const handleDeleteCustomer = (id: string) => {
    const currentList = db.customer || [];
    const target = currentList.find((c) => c.id === id);
    const updated = currentList.filter((c) => c.id !== id);
    saveDatabase({
      ...db,
      customer: updated
    });
    showToast(`Customer "${target?.namaCustomer || ''}" berhasil dihapus.`);
  };

  // --- CRUD: PENGIRIMAN ---
  const handleSavePengiriman = (
    pengirimanData: Omit<Pengiriman, 'id'> & { id?: string },
    deductStock: boolean = true
  ): Pengiriman => {
    const currentList = db.pengiriman || [];
    const newPengiriman: Pengiriman = {
      ...pengirimanData,
      id: `KRM-${Date.now()}`
    };

    let updatedStok = [...db.stok];

    if (deductStock) {
      pengirimanData.items.forEach((item, index) => {
        if (item.idProduk) {
          const prod = db.produk.find((p) => p.id === item.idProduk);
          updatedStok.unshift({
            id: `STK-KRM-${Date.now()}-${index}`,
            date: new Date().toISOString(),
            idProduk: item.idProduk,
            tipe: 'KELUAR',
            jumlah: item.quantity,
            harga: item.harga || prod?.harga || 0,
            keterangan: `[PENGIRIMAN] Kepada ${pengirimanData.namaCustomer} (${pengirimanData.noNota || 'Nota Baru'})`
          });
        }
      });
    }

    saveDatabase({
      ...db,
      pengiriman: [newPengiriman, ...currentList],
      stok: updatedStok
    });

    showToast(`Nota pengiriman untuk "${pengirimanData.namaCustomer}" berhasil dibuat.`);
    return newPengiriman;
  };

  const handleDeletePengiriman = (id: string) => {
    const currentList = db.pengiriman || [];
    const updated = currentList.filter((p) => p.id !== id);
    saveDatabase({
      ...db,
      pengiriman: updated
    });
    showToast('Surat pengiriman berhasil dihapus.');
  };

  const handleUpdateStatusPengiriman = (id: string, newStatus: 'PROSES' | 'TERKIRIM' | 'BATAL') => {
    const currentList = db.pengiriman || [];
    const updated = currentList.map((p) =>
      p.id === id ? { ...p, status: newStatus } : p
    );
    saveDatabase({
      ...db,
      pengiriman: updated
    });
    showToast(`Status pengiriman diubah menjadi ${newStatus}.`);
  };


  // Quick Stock Helper
  const handleQuickStok = (p: Produk, tipe: TipeMutasi) => {
    setStokPreselectedProd(p);
    setStokModalTipe(tipe);
    setIsModalStokOpen(true);
  };

  if (!user && !isGuestMode) {
    return (
      <LoginScreen
        onLoginGoogle={handleLoginGoogle}
        onContinueAsGuest={() => setIsGuestMode(true)}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#050b14]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 glass-panel border-sky-500/40 text-sky-400 text-xs font-semibold px-4 py-3 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          {toastMessage}
        </div>
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isOpenMobileSidebar}
        setIsOpenMobile={setIsOpenMobileSidebar}
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
        onLogoutGoogle={handleLogoutGoogle}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onToggleSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
          sheetsConfig={sheetsConfig}
          user={user}
          onSync={() => syncToSheets()}
          isSyncing={isSyncing}
          onReset={handleResetData}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLoginGoogle={handleLoginGoogle}
          onLogoutGoogle={handleLogoutGoogle}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 hide-scroll">
          {activeTab === 'dashboard' && (
            <DashboardView
              db={db}
              onNavigate={setActiveTab}
              onOpenModalStok={(tipe) => {
                setStokPreselectedProd(null);
                setStokModalTipe(tipe);
                setIsModalStokOpen(true);
              }}
              onOpenModalKeuangan={(tipe) => {
                setKeuanganModalTipe(tipe);
                setIsModalKeuanganOpen(true);
              }}
              onOpenModalProduk={() => {
                setEditingProduk(null);
                setIsModalProdukOpen(true);
              }}
            />
          )}

          {activeTab === 'produk' && (
            <ProdukView
              db={db}
              onOpenAddModal={() => {
                setEditingProduk(null);
                setIsModalProdukOpen(true);
              }}
              onOpenEditModal={(p) => {
                setEditingProduk(p);
                setIsModalProdukOpen(true);
              }}
              onDeleteProduk={handleDeleteProduk}
              onQuickStok={handleQuickStok}
            />
          )}

          {activeTab === 'stok' && (
            <StokView
              db={db}
              onOpenModalStok={(tipe) => {
                setStokPreselectedProd(null);
                setStokModalTipe(tipe);
                setIsModalStokOpen(true);
              }}
              onDeleteStok={handleDeleteStok}
            />
          )}

          {activeTab === 'keuangan' && (
            <KeuanganView
              db={db}
              onOpenModalKeuangan={(tipe) => {
                setKeuanganModalTipe(tipe);
                setIsModalKeuanganOpen(true);
              }}
              onDeleteKeuangan={handleDeleteKeuangan}
            />
          )}

          {activeTab === 'customer' && (
            <CustomerView
              customers={db.customer || []}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activeTab === 'pengiriman' && (
            <PengirimanView
              pengirimanList={db.pengiriman || []}
              customers={db.customer || []}
              produkList={db.produk}
              onSavePengiriman={handleSavePengiriman}
              onDeletePengiriman={handleDeletePengiriman}
              onUpdateStatus={handleUpdateStatusPengiriman}
            />
          )}

          {activeTab === 'laporan' && (
            <LaporanView
              db={db}
              sheetsConfig={sheetsConfig}
              onSync={() => syncToSheets()}
              isSyncing={isSyncing}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onImportJson={(newDb) => {
                saveDatabase(newDb);
                showToast('Import database JSON berhasil.');
              }}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ModalProduk
        isOpen={isModalProdukOpen}
        onClose={() => setIsModalProdukOpen(false)}
        onSave={handleSaveProduk}
        initialData={editingProduk}
        existingCategories={[...(db.customKategori || []), ...db.produk.map((p) => p.kategori)]}
        onDeleteCategory={handleDeleteCategory}
      />


      <ModalStok
        isOpen={isModalStokOpen}
        onClose={() => setIsModalStokOpen(false)}
        onSave={handleSaveStok}
        tipe={stokModalTipe}
        produkList={db.produk}
        preselectedProduct={stokPreselectedProd}
      />

      <ModalKeuangan
        isOpen={isModalKeuanganOpen}
        onClose={() => setIsModalKeuanganOpen(false)}
        onSave={handleSaveKeuangan}
        tipe={keuanganModalTipe}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={sheetsConfig}
        user={user}
        onLoginGoogle={handleLoginGoogle}
        onLogoutGoogle={handleLogoutGoogle}
        onSaveConfig={handleSaveConfig}
        onSyncNow={() => syncToSheets()}
        isSyncing={isSyncing}
      />
    </div>
  );
}

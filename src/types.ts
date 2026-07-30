export type TipeMutasi = 'MASUK' | 'KELUAR';

export interface Produk {
  id: string;
  sku: string;
  nama: string;
  kategori: string;
  harga: number;
  satuan: string;
  isiKarton: string | number;
  minStok?: number;
}

export interface MutasiStok {
  id: string;
  date: string;
  idProduk: string;
  tipe: TipeMutasi;
  jumlah: number;
  harga: number;
  keterangan: string;
}

export interface TransaksiKeuangan {
  id: string;
  date: string;
  tipe: TipeMutasi;
  nominal: number;
  keterangan: string;
  kategori?: string;
  metodePembayaran?: 'CASH' | 'TRANSFER';
  namaBank?: string;
}

export interface Customer {
  id: string;
  namaCustomer: string;
  alamat: string;
  pic: string;
  noTelp: string;
}

export interface ItemPengiriman {
  idProduk: string;
  namaProduk: string;
  quantity: number;
  satuan: string;
  harga: number;
}

export interface ItemPO {
  idProduk: string;
  namaProduk: string;
  quantity: number;
  satuan: string;
  harga: number;
}

export interface PurchaseOrder {
  id: string;
  noPO?: string;
  tanggal: string;
  namaSupplier: string;
  noTelpSupplier?: string;
  alamatSupplier?: string;
  items: ItemPO[];
  totalHarga?: number;
  catatan?: string;
  status?: 'DRAFT' | 'DIPESAN' | 'DITERIMA' | 'BATAL';
}

export interface Pengiriman {
  id: string;
  noNota?: string;
  tanggal: string;
  idCustomer?: string;
  namaCustomer: string;
  alamat?: string;
  noTelp?: string;
  pic?: string;
  items: ItemPengiriman[];
  totalHarga?: number;
  catatan?: string;
  status?: 'PROSES' | 'TERKIRIM' | 'BATAL';
}

export interface AppDatabase {
  produk: Produk[];
  stok: MutasiStok[];
  keuangan: TransaksiKeuangan[];
  customer?: Customer[];
  pengiriman?: Pengiriman[];
  purchaseOrder?: PurchaseOrder[];
  customKategori?: string[];
}

export type ViewTab = 'dashboard' | 'produk' | 'stok' | 'keuangan' | 'customer' | 'pengiriman' | 'purchase_order' | 'laporan';

export interface GoogleSheetsConfig {
  webAppUrl: string;
  spreadsheetUrl?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}


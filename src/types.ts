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
}

export interface Pengiriman {
  id: string;
  tanggal: string;
  idCustomer?: string;
  namaCustomer: string;
  alamat?: string;
  noTelp?: string;
  items: ItemPengiriman[];
  catatan?: string;
  status?: 'PROSES' | 'TERKIRIM' | 'BATAL';
}

export interface AppDatabase {
  produk: Produk[];
  stok: MutasiStok[];
  keuangan: TransaksiKeuangan[];
  customer?: Customer[];
  pengiriman?: Pengiriman[];
  customKategori?: string[];
}

export type ViewTab = 'dashboard' | 'produk' | 'stok' | 'keuangan' | 'customer' | 'pengiriman' | 'laporan';

export interface GoogleSheetsConfig {
  webAppUrl: string;
  spreadsheetUrl?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}


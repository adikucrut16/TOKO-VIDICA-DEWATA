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

export interface AppDatabase {
  produk: Produk[];
  stok: MutasiStok[];
  keuangan: TransaksiKeuangan[];
}

export type ViewTab = 'dashboard' | 'produk' | 'stok' | 'keuangan' | 'laporan';

export interface GoogleSheetsConfig {
  webAppUrl: string;
  spreadsheetUrl?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

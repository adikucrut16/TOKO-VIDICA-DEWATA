import { AppDatabase } from '../types';

export const INITIAL_DATABASE: AppDatabase = {
  produk: [
    {
      id: 'PROD-101',
      sku: 'BRG-001',
      nama: 'Teh Botol Sosro 450ml',
      kategori: 'Minuman',
      harga: 4500,
      satuan: 'Karton',
      isiKarton: '24',
      minStok: 5
    },
    {
      id: 'PROD-102',
      sku: 'BRG-002',
      nama: 'Indomie Goreng Original 85g',
      kategori: 'Makanan',
      harga: 3100,
      satuan: 'Karton',
      isiKarton: '40',
      minStok: 10
    },
    {
      id: 'PROD-103',
      sku: 'BRG-003',
      nama: 'Rokok Sampoerna Mild 16',
      kategori: 'Rokok',
      harga: 33500,
      satuan: 'Pak',
      isiKarton: '10',
      minStok: 8
    },
    {
      id: 'PROD-104',
      sku: 'BRG-004',
      nama: 'Minyak Goreng Bimoli 2L',
      kategori: 'Sembako',
      harga: 38000,
      satuan: 'Pcs',
      isiKarton: '6',
      minStok: 5
    },
    {
      id: 'PROD-105',
      sku: 'BRG-005',
      nama: 'Air Mineral Aqua 600ml',
      kategori: 'Minuman',
      harga: 3500,
      satuan: 'Karton',
      isiKarton: '24',
      minStok: 10
    },
    {
      id: 'PROD-106',
      sku: 'BRG-006',
      nama: 'Beras C4 Super 5kg',
      kategori: 'Sembako',
      harga: 72000,
      satuan: 'Pcs',
      isiKarton: '1',
      minStok: 3
    }
  ],
  stok: [
    {
      id: 'STK-001',
      date: new Date(Date.now() - 6 * 86400000).toISOString(),
      idProduk: 'PROD-101',
      tipe: 'MASUK',
      jumlah: 20,
      harga: 4000,
      keterangan: 'Restock Awal dari Distributor'
    },
    {
      id: 'STK-002',
      date: new Date(Date.now() - 5 * 86400000).toISOString(),
      idProduk: 'PROD-102',
      tipe: 'MASUK',
      jumlah: 35,
      harga: 2800,
      keterangan: 'Pembelian Karton Indomie'
    },
    {
      id: 'STK-003',
      date: new Date(Date.now() - 4 * 86400000).toISOString(),
      idProduk: 'PROD-103',
      tipe: 'MASUK',
      jumlah: 15,
      harga: 31000,
      keterangan: 'Restock Rokok Sampoerna'
    },
    {
      id: 'STK-004',
      date: new Date(Date.now() - 3 * 86400000).toISOString(),
      idProduk: 'PROD-101',
      tipe: 'KELUAR',
      jumlah: 5,
      harga: 4500,
      keterangan: 'Penjualan Toko'
    },
    {
      id: 'STK-005',
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      idProduk: 'PROD-104',
      tipe: 'MASUK',
      jumlah: 12,
      harga: 35000,
      keterangan: 'Pembelian Minyak Bimoli'
    },
    {
      id: 'STK-006',
      date: new Date(Date.now() - 1 * 86400000).toISOString(),
      idProduk: 'PROD-105',
      tipe: 'MASUK',
      jumlah: 25,
      harga: 3000,
      keterangan: 'Restock Aqua'
    },
    {
      id: 'STK-007',
      date: new Date().toISOString(),
      idProduk: 'PROD-102',
      tipe: 'KELUAR',
      jumlah: 8,
      harga: 3100,
      keterangan: 'Penjualan Grosir Kecil'
    }
  ],
  keuangan: [
    {
      id: 'KEU-001',
      date: new Date(Date.now() - 7 * 86400000).toISOString(),
      tipe: 'MASUK',
      nominal: 10000000,
      keterangan: 'Modal Awal Kas Toko Vidica Dewata',
      kategori: 'Modal'
    },
    {
      id: 'KEU-002',
      date: new Date(Date.now() - 6 * 86400000).toISOString(),
      tipe: 'KELUAR',
      nominal: 1920000,
      keterangan: 'Pembelian Stok Teh Botol Sosro (20 Dus)',
      kategori: 'Pembelian Stok'
    },
    {
      id: 'KEU-003',
      date: new Date(Date.now() - 5 * 86400000).toISOString(),
      tipe: 'KELUAR',
      nominal: 3920000,
      keterangan: 'Pembelian Stok Indomie Goreng (35 Karton)',
      kategori: 'Pembelian Stok'
    },
    {
      id: 'KEU-004',
      date: new Date(Date.now() - 3 * 86400000).toISOString(),
      tipe: 'MASUK',
      nominal: 540000,
      keterangan: 'Hasil Penjualan Harian Toko',
      kategori: 'Penjualan'
    },
    {
      id: 'KEU-005',
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      tipe: 'KELUAR',
      nominal: 420000,
      keterangan: 'Pembelian Minyak Goreng Bimoli',
      kategori: 'Pembelian Stok'
    },
    {
      id: 'KEU-006',
      date: new Date(Date.now() - 1 * 86400000).toISOString(),
      tipe: 'MASUK',
      nominal: 1250000,
      keterangan: 'Penjualan Sembako & Minuman',
      kategori: 'Penjualan'
    },
    {
      id: 'KEU-007',
      date: new Date().toISOString(),
      tipe: 'MASUK',
      nominal: 980000,
      keterangan: 'Penjualan Kasir Hari Ini',
      kategori: 'Penjualan'
    }
  ],
  customer: [
    {
      id: 'CUST-001',
      namaCustomer: 'Toko Berkah Utama',
      alamat: 'Jl. Raya Denpasar No. 45, Denpasar Barat',
      pic: 'Pak Made',
      noTelp: '081234567890'
    },
    {
      id: 'CUST-002',
      namaCustomer: 'Warung Bu Sri',
      alamat: 'Jl. Sunset Road No. 88, Kuta',
      pic: 'Ibu Sri',
      noTelp: '081987654321'
    }
  ],
  pengiriman: [
    {
      id: 'KRM-001',
      noNota: 'NOTA-2026-001',
      tanggal: new Date().toISOString().split('T')[0],
      idCustomer: 'CUST-001',
      namaCustomer: 'Toko Berkah Utama',
      alamat: 'Jl. Raya Denpasar No. 45, Denpasar Barat',
      noTelp: '081234567890',
      pic: 'Pak Made',
      items: [
        {
          idProduk: 'PROD-101',
          namaProduk: 'Teh Botol Sosro 450ml',
          quantity: 2,
          satuan: 'Karton',
          harga: 145000
        },
        {
          idProduk: 'PROD-102',
          namaProduk: 'Indomie Goreng Original 85g',
          quantity: 5,
          satuan: 'Karton',
          harga: 112000
        }
      ],
      totalHarga: 850000,
      catatan: 'Kirim sebelum jam 3 sore',
      status: 'PROSES'
    }
  ],
  customKategori: ['Makanan', 'Minuman', 'Rokok', 'Sembako', 'Elektronik', 'Lainnya']
};


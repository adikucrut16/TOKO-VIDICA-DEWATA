import { AppDatabase, Produk, MutasiStok, TransaksiKeuangan, Customer, Pengiriman, ItemPengiriman, PurchaseOrder, ItemPO } from '../types';

export const TARGET_SPREADSHEET_ID = '1nCS_IWOeTlxxaUHKG3n6GnfHQrv7hXrzO6ErK72qMBY';
export const TARGET_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?gid=0#gid=0`;
export const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyQ3JzxhhWCpOgk0R2mvYjilDmN5-GEyUH0yXC86G_PpN-PU6WtYo05GvvWlTi438touA/exec';

const parseNum = (val: any, fallback = 0): number => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
};

export async function syncToWebApp(db: AppDatabase, webAppUrl = DEFAULT_WEB_APP_URL): Promise<{ success: boolean; message: string }> {
  try {
    const url = webAppUrl.trim() || DEFAULT_WEB_APP_URL;
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(db)
    });
    return {
      success: true,
      message: 'Data berhasil dikirim ke Google Apps Script Web App!'
    };
  } catch (err: any) {
    console.error('Web App sync error:', err);
    return {
      success: false,
      message: err.message || 'Gagal mengirim data ke Apps Script Web App.'
    };
  }
}

export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return TARGET_SPREADSHEET_ID;
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9-_]{20,}$/.test(urlOrId.trim())) {
    return urlOrId.trim();
  }
  return TARGET_SPREADSHEET_ID;
}

const formatDate = (isoStr?: string) => {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleString('id-ID');
  } catch (e) {
    return isoStr;
  }
};

export async function syncDatabaseDirectToSheets(
  db: AppDatabase,
  accessToken: string,
  spreadsheetId = TARGET_SPREADSHEET_ID
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanId = extractSpreadsheetId(spreadsheetId);

    // 1. Check existing sheets
    const getRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=sheets.properties.title`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!getRes.ok) {
      const errJson = await getRes.json().catch(() => ({}));
      if (getRes.status === 401) {
        throw new Error('Sesi login Google telah kadaluarsa. Silakan login kembali.');
      }
      if (getRes.status === 403) {
        throw new Error('Izin ditolak. Pastikan akun Google Anda memiliki akses edit ke spreadsheet ini.');
      }
      if (getRes.status === 404) {
        throw new Error('Spreadsheet tidak ditemukan. Periksa kembali ID atau URL spreadsheet.');
      }
      throw new Error(errJson.error?.message || `Gagal mengakses Google Sheets (Status ${getRes.status}).`);
    }

    const spreadsheetInfo = await getRes.json();
    const existingTitles: string[] = (spreadsheetInfo.sheets || []).map(
      (s: any) => s.properties?.title
    );

    const requiredSheets = [
      'Katalog Produk',
      'Mutasi Stok',
      'Buku Kas Keuangan',
      'Daftar Customer',
      'Data Pengiriman',
      'Purchase Order',
      'Ringkasan Dashboard'
    ];

    // 2. Add missing sheets if needed
    const addSheetRequests = requiredSheets
      .filter((title) => !existingTitles.includes(title))
      .map((title) => ({
        addSheet: {
          properties: { title }
        }
      }));

    if (addSheetRequests.length > 0) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests: addSheetRequests })
        }
      );
    }

    // 3. Clear existing values across all 4 sheets
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values:batchClear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ranges: requiredSheets.map((title) => `'${title}'!A1:Z10000`)
        })
      }
    );

    // 4. Prepare data for sheets
    // Katalog Produk
    const rowsProduk = [
      ['ID Produk', 'SKU', 'Nama Produk', 'Kategori', 'Harga Dasar (Rp)', 'Satuan', 'Isi per Kemasan', 'Min. Stok'],
      ...db.produk.map((p) => [
        p.id,
        p.sku,
        p.nama,
        p.kategori,
        p.harga,
        p.satuan,
        p.isiKarton,
        p.minStok || 0
      ])
    ];

    // Mutasi Stok
    const prodMap = new Map(db.produk.map((p) => [p.id, p.nama]));
    const rowsStok = [
      ['ID Mutasi', 'Waktu', 'ID Produk', 'Nama Produk', 'Tipe', 'Jumlah Unit', 'Harga Satuan (Rp)', 'Total Nilai (Rp)', 'Keterangan'],
      ...db.stok.map((s) => [
        s.id,
        formatDate(s.date),
        s.idProduk,
        prodMap.get(s.idProduk) || s.idProduk,
        s.tipe,
        s.jumlah,
        s.harga,
        s.harga * s.jumlah,
        s.keterangan || ''
      ])
    ];

    // Buku Kas Keuangan
    const rowsKeuangan = [
      ['ID Transaksi', 'Waktu', 'Tipe', 'Kategori', 'Keterangan', 'Pemasukan / Debit (Rp)', 'Pengeluaran / Kredit (Rp)'],
      ...db.keuangan.map((k) => [
        k.id,
        formatDate(k.date),
        k.tipe,
        k.kategori || '-',
        k.keterangan,
        k.tipe === 'MASUK' ? k.nominal : 0,
        k.tipe === 'KELUAR' ? k.nominal : 0
      ])
    ];

    // Daftar Customer
    const rowsCustomer = [
      ['ID Customer', 'Nama Customer', 'Alamat', 'PIC / Kontak', 'No. Telepon'],
      ...(db.customer || []).map((c) => [
        c.id,
        c.namaCustomer,
        c.alamat,
        c.pic,
        c.noTelp
      ])
    ];

    // Data Pengiriman
    const rowsPengiriman = [
      ['ID Pengiriman', 'No Nota', 'Tanggal', 'Nama Customer', 'Item & Qty', 'Total Nilai (Rp)', 'Status', 'Catatan'],
      ...(db.pengiriman || []).map((p) => [
        p.id,
        p.noNota || '-',
        formatDate(p.tanggal),
        p.namaCustomer,
        (p.items || []).map((i) => `${i.namaProduk} (${i.quantity} ${i.satuan})`).join('; '),
        p.totalHarga || (p.items || []).reduce((acc, i) => acc + (i.harga * i.quantity), 0),
        p.status || 'PROSES',
        p.catatan || ''
      ])
    ];

    // Purchase Order
    const rowsPO = [
      ['ID PO', 'No PO', 'Tanggal', 'Nama Supplier', 'Item & Qty', 'Status', 'Catatan'],
      ...(db.purchaseOrder || []).map((p) => [
        p.id,
        p.noPO || '-',
        formatDate(p.tanggal),
        p.namaSupplier,
        (p.items || []).map((i) => `${i.namaProduk} (${i.quantity} ${i.satuan})`).join('; '),
        p.status || 'DIPESAN',
        p.catatan || ''
      ])
    ];

    // Ringkasan Dashboard
    const totalPemasukan = db.keuangan
      .filter((k) => k.tipe === 'MASUK')
      .reduce((a, b) => a + (b.nominal || 0), 0);
    const totalPengeluaran = db.keuangan
      .filter((k) => k.tipe === 'KELUAR')
      .reduce((a, b) => a + (b.nominal || 0), 0);
    const saldoNet = totalPemasukan - totalPengeluaran;

    const rowsSummary = [
      ['INDIKATOR REKAPITULASI', 'NILAI / JUMLAH'],
      ['Waktu Terakhir Rekap', new Date().toLocaleString('id-ID')],
      ['Total Jenis Produk', db.produk.length],
      ['Total Log Mutasi Stok', db.stok.length],
      ['Total Transaksi Kas', db.keuangan.length],
      ['Total Pelanggan Registered', (db.customer || []).length],
      ['Total Surat Pengiriman', (db.pengiriman || []).length],
      ['Total Purchase Order', (db.purchaseOrder || []).length],
      ['Total Akumulasi Pemasukan (Rp)', totalPemasukan],
      ['Total Akumulasi Pengeluaran (Rp)', totalPengeluaran],
      ['Saldo Bersih Kas (Rp)', saldoNet]
    ];

    // 5. Batch update all ranges
    const batchUpdateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: "'Katalog Produk'!A1", values: rowsProduk },
            { range: "'Mutasi Stok'!A1", values: rowsStok },
            { range: "'Buku Kas Keuangan'!A1", values: rowsKeuangan },
            { range: "'Daftar Customer'!A1", values: rowsCustomer },
            { range: "'Data Pengiriman'!A1", values: rowsPengiriman },
            { range: "'Purchase Order'!A1", values: rowsPO },
            { range: "'Ringkasan Dashboard'!A1", values: rowsSummary }
          ]
        })
      }
    );

    if (!batchUpdateRes.ok) {
      const errData = await batchUpdateRes.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Gagal menulis data ke Google Sheets.');
    }

    return {
      success: true,
      message: 'Database berhasil direkap langsung ke Google Spreadsheet!'
    };
  } catch (err: any) {
    console.error('Direct Google Sheets sync error:', err);
    return {
      success: false,
      message: err.message || 'Gagal menyinkronkan data ke Google Sheets.'
    };
  }
}

export async function fetchDatabaseFromSheets(
  accessToken: string,
  spreadsheetId = TARGET_SPREADSHEET_ID
): Promise<{ success: boolean; data?: AppDatabase; message?: string }> {
  try {
    const cleanId = extractSpreadsheetId(spreadsheetId);

    const ranges = [
      "'Katalog Produk'!A2:H1000",
      "'Mutasi Stok'!A2:I1000",
      "'Buku Kas Keuangan'!A2:G1000",
      "'Daftar Customer'!A2:E1000",
      "'Data Pengiriman'!A2:H1000",
      "'Purchase Order'!A2:H1000"
    ];

    const rangeParams = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values:batchGet?${rangeParams}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Sesi login Google telah kadaluarsa. Silakan login kembali.');
      }
      if (res.status === 403) {
        throw new Error('Izin ditolak. Pastikan akun Google Anda memiliki akses ke spreadsheet ini.');
      }
      if (res.status === 404) {
        throw new Error('Spreadsheet tidak ditemukan. Periksa ID atau URL spreadsheet.');
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal mengakses Google Sheets (Status ${res.status}).`);
    }

    const json = await res.json();
    const valueRanges = json.valueRanges || [];

    const produkRows: any[][] = valueRanges[0]?.values || [];
    const stokRows: any[][] = valueRanges[1]?.values || [];
    const keuanganRows: any[][] = valueRanges[2]?.values || [];
    const customerRows: any[][] = valueRanges[3]?.values || [];
    const pengirimanRows: any[][] = valueRanges[4]?.values || [];
    const poRows: any[][] = valueRanges[5]?.values || [];

    // 1. Parse Produk
    const produk: Produk[] = produkRows.map((r, idx) => ({
      id: String(r[0] || `BRG-${idx + 1}`),
      sku: String(r[1] || ''),
      nama: String(r[2] || ''),
      kategori: String(r[3] || 'HANDTOWEL'),
      harga: parseNum(r[4], 0),
      satuan: String(r[5] || 'Pcs'),
      isiKarton: r[6] !== undefined ? r[6] : 1,
      minStok: parseNum(r[7], 5)
    }));

    // 2. Parse Mutasi Stok
    const stok: MutasiStok[] = stokRows.map((r, idx) => ({
      id: String(r[0] || `MUT-${idx + 1}`),
      date: String(r[1] || new Date().toISOString()),
      idProduk: String(r[2] || ''),
      tipe: r[4] === 'KELUAR' ? 'KELUAR' : 'MASUK',
      jumlah: parseNum(r[5], 0),
      harga: parseNum(r[6], 0),
      keterangan: String(r[8] || r[7] || '')
    }));

    // 3. Parse Keuangan
    const keuangan: TransaksiKeuangan[] = keuanganRows.map((r, idx) => {
      const tipe = r[2] === 'KELUAR' ? 'KELUAR' : 'MASUK';
      const debit = parseNum(r[5], 0);
      const kredit = parseNum(r[6], 0);
      const nominal = tipe === 'MASUK' ? (debit || parseNum(r[4], 0)) : (kredit || parseNum(r[4], 0));

      return {
        id: String(r[0] || `KAS-${idx + 1}`),
        date: String(r[1] || new Date().toISOString()),
        tipe,
        kategori: String(r[3] || 'Umum'),
        keterangan: String(r[4] || ''),
        nominal
      };
    });

    // 4. Parse Customer
    const customer: Customer[] = customerRows.map((r, idx) => ({
      id: String(r[0] || `CUST-${idx + 1}`),
      namaCustomer: String(r[1] || ''),
      alamat: String(r[2] || ''),
      pic: String(r[3] || ''),
      noTelp: String(r[4] || '')
    }));

    // 5. Parse Pengiriman
    const pengiriman: Pengiriman[] = pengirimanRows.map((r, idx) => {
      const itemStr = String(r[4] || '');
      const items: ItemPengiriman[] = itemStr
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((itemPiece) => {
          const match = itemPiece.match(/^(.*?)\s*\((?:(\d+)\s*)?(.*?)\)$/);
          if (match) {
            return {
              idProduk: '',
              namaProduk: match[1]?.trim() || itemPiece,
              quantity: parseInt(match[2] || '1', 10) || 1,
              satuan: match[3]?.trim() || 'Pcs',
              harga: 0
            };
          }
          return {
            idProduk: '',
            namaProduk: itemPiece,
            quantity: 1,
            satuan: 'Pcs',
            harga: 0
          };
        });

      let statusVal: 'PROSES' | 'TERKIRIM' | 'BATAL' = 'PROSES';
      if (r[6] === 'TERKIRIM' || r[6] === 'SELESAI' || r[6] === 'KIRIM') statusVal = 'TERKIRIM';
      if (r[6] === 'BATAL') statusVal = 'BATAL';

      return {
        id: String(r[0] || `PENG-${idx + 1}`),
        noNota: String(r[1] || ''),
        tanggal: String(r[2] || new Date().toISOString()),
        namaCustomer: String(r[3] || ''),
        items,
        totalHarga: parseNum(r[5], 0),
        status: statusVal,
        catatan: String(r[7] || '')
      };
    });

    // 6. Parse Purchase Order
    const purchaseOrder: PurchaseOrder[] = poRows.map((r, idx) => {
      const itemStr = String(r[4] || '');
      const items: ItemPO[] = itemStr
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((itemPiece) => {
          const match = itemPiece.match(/^(.*?)\s*\((?:(\d+)\s*)?(.*?)\)$/);
          if (match) {
            return {
              idProduk: '',
              namaProduk: match[1]?.trim() || itemPiece,
              quantity: parseInt(match[2] || '1', 10) || 1,
              satuan: match[3]?.trim() || 'Pcs',
              harga: 0
            };
          }
          return {
            idProduk: '',
            namaProduk: itemPiece,
            quantity: 1,
            satuan: 'Pcs',
            harga: 0
          };
        });

      let statusVal: 'DRAFT' | 'DIPESAN' | 'DITERIMA' | 'BATAL' = 'DIPESAN';
      const rawStatus = String(r[5] || r[6] || '').toUpperCase();
      if (rawStatus === 'DITERIMA' || rawStatus === 'SELESAI') statusVal = 'DITERIMA';
      if (rawStatus === 'BATAL') statusVal = 'BATAL';
      if (rawStatus === 'DRAFT') statusVal = 'DRAFT';

      return {
        id: String(r[0] || `PO-${idx + 1}`),
        noPO: String(r[1] || ''),
        tanggal: String(r[2] || new Date().toISOString()),
        namaSupplier: String(r[3] || ''),
        items,
        totalHarga: 0,
        status: statusVal,
        catatan: String(r[6] || r[7] || '')
      };
    });

    const excludedCategories = ['makanan', 'minuman', 'rokok', 'sembako'];
    const customKategori = Array.from(
      new Set(
        produk
          .map((p) => p.kategori)
          .filter((cat) => cat && !excludedCategories.includes(cat.toLowerCase()))
      )
    );

    const parsedDb: AppDatabase = {
      produk,
      stok,
      keuangan,
      customer,
      pengiriman,
      purchaseOrder,
      customKategori
    };

    return {
      success: true,
      data: parsedDb,
      message: 'Berhasil menarik data dari Google Spreadsheet!'
    };
  } catch (err: any) {
    console.error('fetchDatabaseFromSheets error:', err);
    return {
      success: false,
      message: err.message || 'Gagal mengambil data dari Google Spreadsheet.'
    };
  }
}

import { AppDatabase } from '../types';

export const TARGET_SPREADSHEET_ID = '1nCS_IWOeTlxxaUHKG3n6GnfHQrv7hXrzO6ErK72qMBY';
export const TARGET_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit?gid=0#gid=0`;
export const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyQ3JzxhhWCpOgk0R2mvYjilDmN5-GEyUH0yXC86G_PpN-PU6WtYo05GvvWlTi438touA/exec';

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
      ['Total Akumulasi Pemasukan (Rp)', totalPemasukan],
      ['Total Akumulasi Pengeluaran (Rp)', totalPengeluaran],
      ['Saldo Bersih Kas (Rp)', saldoNet]
    ];

    // 5. Batch update all 4 ranges
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

import React, { useState } from 'react';
import { GoogleSheetsConfig } from '../types';
import { X, Sliders, RefreshCw, Database, FileSpreadsheet, Check, ExternalLink, Copy, Code, ChevronDown, ChevronUp } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (cfg: GoogleSheetsConfig) => void;
  onSyncNow: () => void;
  isSyncing: boolean;
}

const TARGET_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1nCS_IWOeTlxxaUHKG3n6GnfHQrv7hXrzO6ErK72qMBY/edit?gid=0#gid=0';

const APPS_SCRIPT_CODE = `/**
 * TOKO VIDICA DEWATA - GOOGLE APPS SCRIPT SYNC REKAP
 * Spreadsheet URL: https://docs.google.com/spreadsheets/d/1nCS_IWOeTlxxaUHKG3n6GnfHQrv7hXrzO6ErK72qMBY/edit
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. REKAP KATALOG PRODUK
    var sheetProduk = getOrCreateSheet(ss, "Katalog Produk");
    sheetProduk.clear();
    sheetProduk.appendRow(["ID Produk", "SKU", "Nama Produk", "Kategori", "Harga Dasar (Rp)", "Satuan", "Isi per Kemasan", "Min. Stok"]);
    formatHeader(sheetProduk, 8);
    
    if (data.produk && data.produk.length > 0) {
      var rowsProduk = data.produk.map(function(p) {
        return [p.id, p.sku, p.nama, p.kategori, p.harga, p.satuan, p.isiKarton, p.minStok || 0];
      });
      sheetProduk.getRange(2, 1, rowsProduk.length, 8).setValues(rowsProduk);
      sheetProduk.getRange(2, 5, rowsProduk.length, 1).setNumberFormat("#,##0");
    }

    // 2. REKAP MUTASI STOK
    var sheetStok = getOrCreateSheet(ss, "Mutasi Stok");
    sheetStok.clear();
    sheetStok.appendRow(["ID Mutasi", "Waktu", "ID Produk", "Nama Produk", "Tipe", "Jumlah Unit", "Harga Satuan (Rp)", "Total Nilai (Rp)", "Keterangan"]);
    formatHeader(sheetStok, 9);
    
    if (data.stok && data.stok.length > 0) {
      var prodMap = {};
      (data.produk || []).forEach(function(p) { prodMap[p.id] = p.nama; });

      var rowsStok = data.stok.map(function(s) {
        var namaProd = prodMap[s.idProduk] || s.idProduk;
        var totalNilai = (s.harga || 0) * (s.jumlah || 0);
        return [s.id, formatDate(s.date), s.idProduk, namaProd, s.tipe, s.jumlah, s.harga, totalNilai, s.keterangan || ""];
      });
      sheetStok.getRange(2, 1, rowsStok.length, 9).setValues(rowsStok);
      sheetStok.getRange(2, 7, rowsStok.length, 2).setNumberFormat("#,##0");
    }

    // 3. REKAP BUKU KAS KEUANGAN
    var sheetKeuangan = getOrCreateSheet(ss, "Buku Kas Keuangan");
    sheetKeuangan.clear();
    sheetKeuangan.appendRow(["ID Transaksi", "Waktu", "Tipe", "Kategori", "Keterangan", "Pemasukan / Debit (Rp)", "Pengeluaran / Kredit (Rp)"]);
    formatHeader(sheetKeuangan, 7);

    if (data.keuangan && data.keuangan.length > 0) {
      var rowsKeuangan = data.keuangan.map(function(k) {
        var debit = k.tipe === "MASUK" ? k.nominal : 0;
        var kredit = k.tipe === "KELUAR" ? k.nominal : 0;
        return [k.id, formatDate(k.date), k.tipe, k.kategori || "-", k.keterangan, debit, kredit];
      });
      sheetKeuangan.getRange(2, 1, rowsKeuangan.length, 7).setValues(rowsKeuangan);
      sheetKeuangan.getRange(2, 6, rowsKeuangan.length, 2).setNumberFormat("#,##0");
    }

    // 4. RINGKASAN DASHBOARD
    var sheetSummary = getOrCreateSheet(ss, "Ringkasan Dashboard");
    sheetSummary.clear();
    sheetSummary.appendRow(["INDIKATOR REKAPITULASI", "NILAI / JUMLAH"]);
    formatHeader(sheetSummary, 2);

    var totalPemasukan = (data.keuangan || []).filter(function(k){ return k.tipe === 'MASUK'; }).reduce(function(a,b){ return a + (b.nominal||0); }, 0);
    var totalPengeluaran = (data.keuangan || []).filter(function(k){ return k.tipe === 'KELUAR'; }).reduce(function(a,b){ return a + (b.nominal||0); }, 0);
    var saldoNet = totalPemasukan - totalPengeluaran;

    var summaryRows = [
      ["Waktu Terakhir Rekap", new Date().toLocaleString("id-ID")],
      ["Total Jenis Produk", (data.produk || []).length],
      ["Total Log Mutasi Stok", (data.stok || []).length],
      ["Total Transaksi Kas", (data.keuangan || []).length],
      ["Total Akumulasi Pemasukan (Rp)", totalPemasukan],
      ["Total Akumulasi Pengeluaran (Rp)", totalPengeluaran],
      ["Saldo Bersih Kas (Rp)", saldoNet]
    ];
    sheetSummary.getRange(2, 1, summaryRows.length, 2).setValues(summaryRows);
    sheetSummary.getRange(6, 2, 3, 1).setNumberFormat("#,##0");

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Rekap database berhasil diperbarui!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Webhook Rekap Database Toko Vidica Dewata Siap Digunakan!");
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); }
  return sheet;
}

function formatHeader(sheet, numCols) {
  var range = sheet.getRange(1, 1, 1, numCols);
  range.setBackground("#1e293b")
       .setFontColor("#ffffff")
       .setFontWeight("bold")
       .setHorizontalAlignment("center");
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  try {
    var d = new Date(isoStr);
    return d.toLocaleString("id-ID");
  } catch(e) {
    return isoStr;
  }
}`;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSyncNow,
  isSyncing
}) => {
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      webAppUrl: webAppUrl.trim(),
      spreadsheetUrl: TARGET_SPREADSHEET_URL,
      autoSync,
      lastSyncedAt: new Date().toISOString()
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/80 flex-shrink-0">
          <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" /> Pengaturan & Integrasi Cloud
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Target Spreadsheet Info Box */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Spreadsheet Rekap Target
              </span>
              <a
                href={TARGET_SPREADSHEET_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                <span>Buka Google Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-indigo-700 font-mono break-all bg-white/80 p-2 rounded-lg border border-indigo-100">
              {TARGET_SPREADSHEET_URL}
            </p>
          </div>

          {/* Google Sheets Integration Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <FileSpreadsheet className="w-4 h-4" /> Integrasi Web App Google Apps Script
            </div>
            <p className="text-xs text-slate-500">
              Masukkan URL Deployment Web App Apps Script dari spreadsheet di atas untuk melakukan rekap otomatis.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                URL Deployment Web App
              </label>
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="input-futuristic text-xs font-mono"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">
                Otomatis rekap ke Google Sheets tiap ada perubahan data
              </span>
            </label>
          </div>

          {/* Apps Script Guide Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Code className="w-4 h-4 text-indigo-600" /> Panduan & Kode Google Apps Script
              </span>
              {showCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCode && (
              <div className="p-4 bg-slate-900 text-slate-200 text-xs space-y-3 border-t border-slate-800">
                <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                  <li>Buka spreadsheet target di Google Sheets.</li>
                  <li>Klik menu <strong className="text-white">Ekstensi &gt; Apps Script</strong>.</li>
                  <li>Hapus isi bawaan, lalu tempel kode di bawah ini.</li>
                  <li>Klik <strong className="text-white">Terapkan (Deploy) &gt; Pembuatan Deployment Baru</strong>.</li>
                  <li>Pilih jenis <strong className="text-white">Aplikasi Web</strong>, set akses ke <strong className="text-emerald-400">"Siapa Saja" (Anyone)</strong>.</li>
                  <li>Salin URL Web App hasil deploy dan tempel di form Pengaturan di atas.</li>
                </ol>

                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Code Script:</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto max-h-48 border border-slate-800 select-all leading-relaxed">
                    {APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Sync Trigger Action */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-500">
              Status Sync:{' '}
              <span className="text-slate-800 font-bold font-mono">
                {config.lastSyncedAt
                  ? new Date(config.lastSyncedAt).toLocaleTimeString('id-ID')
                  : 'Belum pernah'}
              </span>
            </div>
            <button
              type="button"
              onClick={onSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Mengirim Rekap...' : 'Rekap Sekarang'}</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" /> Pengaturan berhasil disimpan!
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="btn-neon px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4" /> Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

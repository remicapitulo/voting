import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { GAS_SCRIPT_CODE } from '../services/gasScriptCode';
import {
  FileSpreadsheet,
  X,
  Copy,
  Check,
  ExternalLink,
  Zap,
  ShieldCheck,
  AlertCircle,
  Database,
  Lock
} from 'lucide-react';
import { User } from '../types';

interface GasIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUrlUpdated: () => void;
  currentUser?: User | null;
}

export const GasIntegrationModal: React.FC<GasIntegrationModalProps> = ({
  isOpen,
  onClose,
  onUrlUpdated,
  currentUser
}) => {
  const [gasUrl, setGasUrl] = useState<string>(apiService.getGasUrl());
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'guide' | 'code' | 'schema'>('guide');

  if (!isOpen) return null;

  // Strict Admin Only Access Protection
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Akses Dibatasi</h3>
            <p className="text-xs text-slate-500 mt-1">
              Menu konfigurasi Google Sheets API hanya dapat diakses oleh Administrator resmi SMPIT Pondok Duta.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveAndTest = async () => {
    setTesting(true);
    setTestResult(null);

    const cleanUrl = gasUrl.trim();
    apiService.setGasUrl(cleanUrl);
    onUrlUpdated();

    if (!cleanUrl) {
      setTestResult({
        success: true,
        message: 'Mode Database Lokal (Offline / Standalone) aktif.'
      });
      setTesting(false);
      return;
    }

    const res = await apiService.testGasConnection(cleanUrl);
    setTestResult(res);
    setTesting(false);
  };

  const schemas = [
    { name: 'Users', columns: ['id', 'username', 'password', 'nama', 'role', 'emailOrWa', 'jurySpecialty', 'created_at'] },
    { name: 'Events', columns: ['id_event', 'kode_event', 'nama_event', 'tahun', 'status_aktif', 'batas_waktu', 'deskripsi'] },
    { name: 'Categories', columns: ['id_kategori', 'id_event', 'nama_kategori', 'tipe', 'assessment_type', 'tipe_peserta', 'votes_required', 'kriteria', 'deskripsi'] },
    { name: 'Teams', columns: ['id_team', 'id_event', 'nama_regu', 'kelas_pangkalan', 'kategori_regu', 'foto_url', 'anggota'] },
    { name: 'Jury_Scores', columns: ['id_score', 'id_jury', 'jury_name', 'id_team', 'id_kategori', 'skor_1_to_5', 'catatan', 'kriteria_scores', 'is_final', 'timestamp'] },
    { name: 'Public_Votes', columns: ['id_vote', 'id_voter', 'voter_name', 'id_team', 'id_kategori', 'timestamp'] },
    { name: 'Config', columns: ['key', 'value', 'updated_at'] }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky Header with Prominent Close Button */}
        <div className="px-4 sm:px-6 py-3.5 bg-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-amber-300 shrink-0 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold leading-tight">Google Sheets API & Database</h3>
                <span className="text-[10px] font-bold bg-amber-400 text-emerald-950 px-1.5 py-0.5 rounded shadow-xs">
                  Admin Khusus
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 leading-tight mt-0.5">
                Integrasi REST Endpoint Google Apps Script SMPIT Pondok Duta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-800 active:bg-emerald-950 transition-colors cursor-pointer"
            title="Tutup Menu (Esc)"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Configuration Section */}
        <div className="p-3.5 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2.5">
          <label className="block text-xs font-bold text-slate-800">
            Web App URL Google Apps Script:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-mono shadow-xs text-slate-800"
            />
            <button
              onClick={handleSaveAndTest}
              disabled={testing}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{testing ? 'Menguji...' : 'Simpan & Uji Koneksi'}</span>
            </button>
          </div>

          {testResult && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.success ? (
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-0.5 gap-1">
            <span>
              Status Database:{' '}
              {gasUrl ? (
                <strong className="text-emerald-700 font-bold">Terkonfigurasi (Cloud GAS)</strong>
              ) : (
                <strong className="text-amber-700 font-bold">Lokal Standalone (Offline Aman)</strong>
              )}
            </span>
            <span className="text-slate-400">Data tersinkron otomatis saat online</span>
          </div>
        </div>

        {/* Tab Selector Controls */}
        <div className="px-4 sm:px-6 pt-2.5 border-b border-slate-200 flex items-center gap-4 text-xs font-semibold shrink-0 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'guide'
                ? 'border-emerald-800 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Petunjuk Deploy
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'code'
                ? 'border-emerald-800 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Kode Script (Code.gs)
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'schema'
                ? 'border-emerald-800 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Skema Tabel Sheets
          </button>
        </div>

        {/* Scrollable Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <strong>Arsitektur Database Google Sheets:</strong> Sistem ini menggunakan Google Apps Script sebagai REST API JSON untuk menyimpan rekap voting publik dan skor juri secara real-time ke akun spreadsheet sekolah.
              </div>

              <ol className="space-y-2.5 list-decimal list-inside font-medium text-slate-800">
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <strong>Buka Google Spreadsheet baru:</strong> Kunjungi{' '}
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 underline inline-flex items-center gap-1 font-semibold"
                  >
                    sheets.new <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  dan beri judul <em>"Database E-Voting SMPIT Pondok Duta"</em>.
                </li>
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <strong>Buka Script Editor:</strong> Klik menu <code>Ekstensi (Extensions)</code> &gt; <code>Apps Script</code>.
                </li>
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <strong>Salin Script:</strong> Buka tab <strong>"Kode Script (Code.gs)"</strong> di atas, klik tombol <strong>"Salin Kode"</strong>, lalu tempel di editor Apps Script.
                </li>
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <strong>Deploy sebagai Aplikasi Web (Penting):</strong>
                  <ul className="list-disc list-inside mt-1 ml-3 space-y-1 font-normal text-slate-600">
                    <li>Klik <strong>Deploy (Terapkan)</strong> &gt; <strong>Penerapan baru (New deployment)</strong></li>
                    <li>Pilih jenis (ikon roda gigi): <strong>Aplikasi web (Web app)</strong></li>
                    <li>Jalankan sebagai: <strong>Saya (Me)</strong></li>
                    <li>Akses: <strong>Siapa saja (Anyone)</strong> (wajib agar aplikasi dapat memanggil API)</li>
                  </ul>
                </li>
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <strong>Hubungkan URL:</strong> Salin Web App URL (berakhiran <code>/exec</code>), tempel di kolom atas, lalu klik <strong>"Simpan & Uji Koneksi"</strong>.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">gas/Code.gs (Siap pakai)</span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Kode'}</span>
                </button>
              </div>

              <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-64 overflow-y-auto leading-relaxed border border-slate-800 select-all">
                {GAS_SCRIPT_CODE}
              </pre>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Fungsi <code>setupDatabaseSheets()</code> pada script akan membuat 6 lembar kerja ini secara otomatis:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {schemas.map(s => (
                  <div key={s.name} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                      <Database className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Sheet: {s.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.columns.map(c => (
                        <span key={c} className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Duta Evoting · SMPIT Pondok Duta
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

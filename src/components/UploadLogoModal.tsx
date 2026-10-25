import React, { useState, useEffect } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Cloud,
  FileCheck,
  FolderOpen
} from 'lucide-react';
import { apiService, DRIVE_LOGO_FOLDER_ID } from '../services/apiService';
import { UploadedLogo } from '../types';

interface UploadLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogoUploaded: (logo: UploadedLogo, targetPosition: 'kiri_sekolah' | 'kanan_kegiatan', setAsHeader?: boolean) => void;
  defaultPosition?: 'kiri_sekolah' | 'kanan_kegiatan';
  suggestedName?: string;
}

export const UploadLogoModal: React.FC<UploadLogoModalProps> = ({
  isOpen,
  onClose,
  onLogoUploaded,
  defaultPosition = 'kanan_kegiatan',
  suggestedName = ''
}) => {
  const [logoName, setLogoName] = useState(suggestedName);
  const [targetPosition, setTargetPosition] = useState<'kiri_sekolah' | 'kanan_kegiatan'>(defaultPosition);
  const [applyToHeader, setApplyToHeader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLogoName(suggestedName);
      setTargetPosition(defaultPosition);
      setApplyToHeader(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setStatusMsg(null);
    }
  }, [isOpen, suggestedName, defaultPosition]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setStatusMsg(null);

    // Auto-populate nama logo jika masih kosong
    if (!logoName.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      setLogoName(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !previewUrl) {
      setStatusMsg({ type: 'error', text: 'Silakan pilih berkas gambar logo terlebih dahulu.' });
      return;
    }

    const cleanTitle = logoName.trim();
    if (!cleanTitle) {
      setStatusMsg({ type: 'error', text: 'Nama Logo wajib diisi agar mudah dipilih kembali nanti.' });
      return;
    }

    setIsUploading(true);
    setStatusMsg(null);

    try {
      const typeCategory = targetPosition === 'kiri_sekolah' ? 'sekolah' : 'olahraga';
      const res = await apiService.uploadLogoToDrive(
        previewUrl,
        cleanTitle,
        selectedFile.type || 'image/png',
        typeCategory
      );

      if (res.success && res.logoEntry) {
        setStatusMsg({
          type: 'success',
          text: res.message || `Alhamdulillah! Logo "${cleanTitle}" berhasil disimpan ke pustaka!`
        });
        onLogoUploaded(res.logoEntry, targetPosition, applyToHeader);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        if (res.logoEntry) {
          onLogoUploaded(res.logoEntry, targetPosition, applyToHeader);
        }
        setStatusMsg({
          type: res.success ? 'success' : 'error',
          text: res.message || 'Logo disimpan secara lokal.'
        });
        if (res.success) {
          setTimeout(() => onClose(), 1600);
        }
      }
    } catch (err: any) {
      let errMsg = err.message || 'Kendala jaringan';
      if (errMsg.includes('DriveApp') || errMsg.includes('permission')) {
        errMsg = 'Otorisasi Google Drive perlu diterapkan ke Web App: Pada tab Apps Script Anda, klik tombol biru "Terapkan" di pojok kanan atas -> "Kelola penerapan" -> Edit (ikon pensil) -> pilih "Versi Baru" -> klik "Terapkan".';
      }
      setStatusMsg({
        type: 'error',
        text: `Gagal mengunggah logo: ${errMsg}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Fixed & Compact */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  Unggah Logo ke Google Drive
                </h3>
                <span className="hidden sm:inline-block text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                  Cloud Drive
                </span>
              </div>
              <p className="text-[10.5px] text-emerald-200/80 truncate">
                Simpan logo resmi agar otomatis tersedia di lembar rekapitulasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors cursor-pointer shrink-0 ml-2"
            title="Tutup Modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleUploadSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Status Alert Banner */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-[11px] leading-relaxed">
                {statusMsg.text}
              </div>
            </div>
          )}

          {/* 1. Input Nama Logo */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center justify-between">
              <span>Nama Logo <span className="text-rose-500">*</span></span>
              <span className="text-[10px] font-normal text-slate-500">Contoh: Futsal Putra, Basket, Seni Tari</span>
            </label>
            <input
              type="text"
              required
              value={logoName}
              onChange={(e) => setLogoName(e.target.value)}
              placeholder="Masukkan nama logo (misal: Logo Cabang Futsal)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 bg-white font-medium shadow-xs"
            />
            <p className="text-[10px] text-slate-500">
              Logo akan disimpan dengan nama ini di Pustaka Logo sehingga mudah dipilih untuk Cabang Olahraga / Seni.
            </p>
          </div>

          {/* 2. Pilihan Peruntukan & Posisi Logo */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">
              Peruntukan &amp; Tata Letak Kop Surat:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Kanan Kop: Logo Kegiatan/Olahraga */}
              <label
                className={`p-3 rounded-xl border-2 flex flex-col gap-1 cursor-pointer transition-all ${
                  targetPosition === 'kanan_kegiatan'
                    ? 'border-emerald-700 bg-emerald-50/70 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    Logo Kegiatan / Lomba
                  </span>
                  <input
                    type="radio"
                    name="targetPosition"
                    value="kanan_kegiatan"
                    checked={targetPosition === 'kanan_kegiatan'}
                    onChange={() => setTargetPosition('kanan_kegiatan')}
                    className="text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                  />
                </div>
                <span className="text-[10.5px] font-semibold text-emerald-800">
                  Posisi: Kanan Kop Surat
                </span>
                <span className="text-[9.5px] text-slate-500">
                  Untuk Cabang Olahraga, Lomba Pramuka, OSIS, PHBI, dsb.
                </span>
              </label>

              {/* Kiri Kop: Logo Sekolah */}
              <label
                className={`p-3 rounded-xl border-2 flex flex-col gap-1 cursor-pointer transition-all ${
                  targetPosition === 'kiri_sekolah'
                    ? 'border-emerald-700 bg-emerald-50/70 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Logo Sekolah
                  </span>
                  <input
                    type="radio"
                    name="targetPosition"
                    value="kiri_sekolah"
                    checked={targetPosition === 'kiri_sekolah'}
                    onChange={() => setTargetPosition('kiri_sekolah')}
                    className="text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                  />
                </div>
                <span className="text-[10.5px] font-semibold text-amber-800">
                  Posisi: Kiri Kop Surat
                </span>
                <span className="text-[9.5px] text-slate-500">
                  Untuk Logo SMPIT Pondok Duta / Yayasan / Instansi.
                </span>
              </label>
            </div>

            {/* Opsi Tambahan: Terapkan juga sebagai Logo Header Website */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-50 cursor-pointer transition-all mt-2">
              <input
                type="checkbox"
                checked={applyToHeader}
                onChange={(e) => setApplyToHeader(e.target.checked)}
                className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600 cursor-pointer shrink-0"
              />
              <div className="min-w-0">
                <span className="font-bold text-teal-950 text-xs block">
                  Terapkan juga sebagai Logo Aplikasi di Header Website
                </span>
                <span className="text-[10px] text-teal-800 block">
                  Menampilkan logo ini pada bilah navigasi atas (Navbar website)
                </span>
              </div>
            </label>
          </div>

          {/* 3. File Picker & Preview */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">
              Pilih Berkas Logo (PNG, JPG, SVG, WebP):
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 hover:bg-slate-100/70 transition-colors flex items-center gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white border border-slate-300 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5 text-amber-300" />
                  <span>{selectedFile ? 'Ganti Berkas' : 'Pilih Berkas'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {selectedFile ? (
                  <div className="text-[10px] text-emerald-800 font-semibold truncate flex items-center gap-1">
                    <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Format PNG transparan sangat dianjurkan agar kop terlihat rapi.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cloud Google Drive Target Notice */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-2.5 text-emerald-950">
            <FolderOpen className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="min-w-0 text-[10.5px] leading-tight">
              <div>Folder Target: <strong>"Logo dan Laporan"</strong></div>
              <div className="font-mono text-[9px] text-emerald-800 truncate mt-0.5">
                ID: {DRIVE_LOGO_FOLDER_ID}
              </div>
            </div>
          </div>

          {/* Footer - Fixed inside form */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-3.5 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile || !logoName.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-amber-300" />
                  <span>Unggah &amp; Simpan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

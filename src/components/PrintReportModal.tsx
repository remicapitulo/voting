import React, { useState } from 'react';
import { ScoreRecapItem, CategoryModel, EventModel, ReportConfig } from '../types';
import { FileDown, Printer, X, CheckCircle, Sliders, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { generateRecapPDF } from '../utils/pdfReportGenerator';
import { LogoRenderer } from './LogoRenderer';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventModel;
  category: CategoryModel;
  recapData: ScoreRecapItem[];
  weights: { jury: number; public: number };
  reportConfig: ReportConfig;
  onUpdateReportConfig?: (newConfig: ReportConfig) => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  event,
  category,
  recapData,
  weights,
  reportConfig,
  onUpdateReportConfig
}) => {
  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  // Local state initialized from reportConfig
  const [localConfig, setLocalConfig] = useState<ReportConfig>(reportConfig);

  // Sync if prop updates
  React.useEffect(() => {
    setLocalConfig(reportConfig);
  }, [reportConfig]);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      await generateRecapPDF(event, category, recapData, weights, localConfig);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Gagal mengunduh PDF:', err);
      alert('Terjadi kendala saat menghasilkan PDF. Silakan coba kembali.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDirectPrint = () => {
    window.print();
  };

  const handleSaveQuickSettings = () => {
    if (onUpdateReportConfig) {
      onUpdateReportConfig(localConfig);
    }
    setShowQuickSettings(false);
  };

  const formulaDescription =
    category.assessment_type === 'public_only'
      ? '100% Voting Publik (Vote Saja)'
      : category.assessment_type === 'jury_only'
      ? '100% Penilaian Dewan Juri (Juri Saja)'
      : `Dewan Juri (${weights.jury}%) + Voting Publik (${weights.public}%)`;

  const isPramuka = event.nama_event?.toLowerCase().includes('camp') ||
                    event.nama_event?.toLowerCase().includes('pramuka') ||
                    category.nama_kategori?.toLowerCase().includes('pramuka');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-300 my-6 flex flex-col max-h-[92vh]">
        {/* Top Control Bar (Hidden when printing physically) */}
        <div className="no-print p-4 bg-slate-900 text-white rounded-t-2xl flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
              <FileDown className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Unduh Lembar Rekap PDF</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Resmi & Terverifikasi
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {category.nama_kategori} · Sub-Event {event.nama_event}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuickSettings(!showQuickSettings)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showQuickSettings
                  ? 'bg-slate-800 border-slate-600 text-amber-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Sesuaikan Pejabat Penandatangan & Titimangsa"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ubah Penandatangan</span>
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Cetak via dialog printer browser"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Cetak Fisik</span>
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPDF}
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-amber-400/20 disabled:opacity-60 cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-800" />
                  <span>PDF Berhasil Diunduh!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-slate-950" />
                  <span>{isDownloading ? 'Menghasilkan PDF...' : 'Unduh Lembar Rekap PDF'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1 cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Signatory Settings Drawer */}
        {showQuickSettings && (
          <div className="no-print bg-slate-100 border-b border-slate-300 p-4 text-xs">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
                  Sesuaikan Data Penandatangan untuk Unduhan PDF Ini
                </span>
                <span className="text-[11px] text-slate-500">
                  Data ini disematkan langsung pada unduhan PDF
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left Signatory */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-semibold text-slate-700 block">Pihak Kiri (Ketua Panitia)</span>
                  <input
                    type="text"
                    value={localConfig.ketuaPanitia.jabatan}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      ketuaPanitia: { ...localConfig.ketuaPanitia, jabatan: e.target.value }
                    })}
                    placeholder="Jabatan (e.g. Ketua Panitia Pelaksana)"
                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-slate-50"
                  />
                  <input
                    type="text"
                    value={localConfig.ketuaPanitia.nama}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      ketuaPanitia: { ...localConfig.ketuaPanitia, nama: e.target.value }
                    })}
                    placeholder="Nama Lengkap & Gelar"
                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-slate-50 font-medium"
                  />
                  <input
                    type="text"
                    value={localConfig.ketuaPanitia.nip}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      ketuaPanitia: { ...localConfig.ketuaPanitia, nip: e.target.value }
                    })}
                    placeholder="NIP / NRP"
                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-slate-50"
                  />
                </div>

                {/* Right Signatory */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-semibold text-slate-700 block">Pihak Kanan (Kepala Sekolah)</span>
                  <input
                    type="text"
                    value={localConfig.kepalaSekolah.jabatan}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      kepalaSekolah: { ...localConfig.kepalaSekolah, jabatan: e.target.value }
                    })}
                    placeholder="Jabatan (e.g. Kepala SMPIT Pondok Duta / Ka. Mabigus)"
                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-slate-50"
                  />
                  <input
                    type="text"
                    value={localConfig.kepalaSekolah.nama}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      kepalaSekolah: { ...localConfig.kepalaSekolah, nama: e.target.value }
                    })}
                    placeholder="Nama Lengkap & Gelar"
                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-slate-50 font-medium"
                  />
                  <input
                    type="text"
                    value={localConfig.kepalaSekolah.nip}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      kepalaSekolah: { ...localConfig.kepalaSekolah, nip: e.target.value }
                    })}
                    placeholder="NIP / NRP"
                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium">Kota Titimangsa:</span>
                  <input
                    type="text"
                    value={localConfig.titimangsaKota}
                    onChange={(e) => setLocalConfig({ ...localConfig, titimangsaKota: e.target.value })}
                    className="p-1 text-xs border border-slate-300 rounded w-28 bg-white font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveQuickSettings}
                  className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded text-xs cursor-pointer"
                >
                  Terapkan & Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Preview Canvas (Scrollable) */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
          <div className="w-full max-w-3xl bg-white p-8 sm:p-12 shadow-md border border-slate-300 text-slate-900 rounded-sm">
            {/* Official Letterhead (Kop Surat Resmi Berita Acara) */}
            {/* Format: Kiri = Logo Kegiatan, Tengah = Teks Kop Surat, Kanan = Logo Sekolah */}
            <div className="pb-2 mb-4">
              <div className="flex items-center justify-between gap-4">
                {/* Kiri: Logo Kegiatan */}
                <div className="w-16 h-16 shrink-0 flex items-center justify-center p-0.5 bg-slate-50 border border-slate-200/60 rounded">
                  <LogoRenderer
                    logo={localConfig.logoKegiatan}
                    alt="Logo Kegiatan"
                    className="w-14 h-14 object-contain"
                  />
                </div>

                {/* Tengah: Teks Kop Surat */}
                <div className="flex-1 text-center">
                  <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-600 mb-0.5">
                    YAYASAN PONDOK DUTA
                  </div>
                  <h1 className="text-base sm:text-xl font-extrabold tracking-tight uppercase text-emerald-950">
                    SMP ISLAM TERPADU PONDOK DUTA
                  </h1>
                  <div className="text-xs font-bold uppercase text-slate-800 tracking-wide mt-0.5">
                    {isPramuka ? 'GUGUS DEPAN GERAKAN PRAMUKA 04.087 - 04.088' : 'PANITIA PELAKSANA KEGIATAN KESISWAAN'}
                  </div>
                  <p className="text-[9.5px] sm:text-[10px] text-slate-500 mt-1 leading-normal">
                    Jl. Duta Indah No. 1, Cisalak Pasar, Cimanggis, Kota Depok, Jawa Barat 16452 | Telp. (021) 8711466 | Web: pondokduta.sch.id
                  </p>
                </div>

                {/* Kanan: Logo Sekolah */}
                <div className="w-16 h-16 shrink-0 flex items-center justify-center p-0.5 bg-slate-50 border border-slate-200/60 rounded">
                  <LogoRenderer
                    logo={localConfig.logoSekolah}
                    alt="Logo Sekolah"
                    className="w-14 h-14 object-contain"
                  />
                </div>
              </div>

              {/* Garis Ganda Kop Surat Resmi Kedinasan */}
              <div className="mt-3">
                <div className="h-[2.5px] bg-emerald-950 w-full mb-[1.5px]"></div>
                <div className="h-[0.75px] bg-emerald-950 w-full"></div>
              </div>
            </div>

            {/* Title of Document */}
            <div className="text-center mb-5">
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide underline text-slate-950">
                BERITA ACARA REKAPITULASI HASIL PENILAIAN & E-VOTING
              </h2>
              <p className="text-[11px] font-medium text-slate-600 mt-1 uppercase">
                SUB-EVENT: {event.nama_event} · TAHUN AJARAN {event.tahun || '2026/2027'}
              </p>
            </div>

            {/* Metadata Box - Clean, Well-Aligned */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="flex items-baseline">
                  <span className="w-32 text-slate-500 shrink-0">Cabang Perlombaan</span>
                  <span className="text-slate-400 mr-2">:</span>
                  <span className="font-bold text-slate-900">{category.nama_kategori}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-32 text-slate-500 shrink-0">Formula Penilaian</span>
                  <span className="text-slate-400 mr-2">:</span>
                  <span className="font-semibold text-emerald-900">{formulaDescription}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-32 text-slate-500 shrink-0">Kategori / Tipe</span>
                  <span className="text-slate-400 mr-2">:</span>
                  <span className="text-slate-800 font-medium">
                    {category.tipe || 'Lomba'} ({category.tipe_peserta || 'Group'})
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-32 text-slate-500 shrink-0">Tanggal Rekap</span>
                  <span className="text-slate-400 mr-2">:</span>
                  <span className="text-slate-800">{currentDateStr}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-32 text-slate-500 shrink-0">Dewan Juri Bertugas</span>
                  <span className="text-slate-400 mr-2">:</span>
                  <span className="text-slate-800">
                    {(!category.assigned_juries || category.assigned_juries.length === 0)
                      ? 'Seluruh Dewan Juri Resmi'
                      : `${category.assigned_juries.length} Dewan Juri yang Ditugaskan`}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-32 text-slate-500 shrink-0">Total Peserta / Regu</span>
                  <span className="text-slate-400 mr-2">:</span>
                  <span className="font-semibold text-slate-900">{recapData.length} Regu</span>
                </div>
              </div>
            </div>

            {/* Official Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-emerald-900 text-white font-bold text-[11px]">
                    <th className="py-2.5 px-2 border border-emerald-950 text-center w-12">Rank</th>
                    <th className="py-2.5 px-3 border border-emerald-950">Nama Peserta / Regu</th>
                    <th className="py-2.5 px-3 border border-emerald-950">Pangkalan / Kelas</th>
                    <th className="py-2.5 px-2 border border-emerald-950 text-right">Rata Juri<br/><span className="text-[9px] font-normal opacity-90">(1 - 5)</span></th>
                    <th className="py-2.5 px-2 border border-emerald-950 text-right">Juri<br/><span className="text-[9px] font-normal opacity-90">(100)</span></th>
                    <th className="py-2.5 px-2 border border-emerald-950 text-right">Vote Publik<br/><span className="text-[9px] font-normal opacity-90">(Suara)</span></th>
                    <th className="py-2.5 px-2.5 border border-emerald-950 text-right">Nilai Akhir<br/><span className="text-[9px] font-normal opacity-90">(Skor)</span></th>
                    <th className="py-2.5 px-2 border border-emerald-950 text-center">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recapData.map((row) => (
                    <tr
                      key={row.team.id_team}
                      className={
                        row.rank === 1
                          ? 'bg-amber-50/70 font-semibold text-slate-900'
                          : row.rank <= 3
                          ? 'bg-slate-50/70 text-slate-900'
                          : 'hover:bg-slate-50/40 text-slate-800'
                      }
                    >
                      <td className="py-2 px-2 border border-slate-300 text-center font-mono font-bold text-slate-900">
                        #{row.rank}
                      </td>
                      <td className="py-2 px-3 border border-slate-300 font-bold text-slate-900">
                        {row.team.nama_regu}
                        <span className="text-[10px] text-slate-500 block font-normal">
                          {row.team.tipe_partisipasi === 'Individu' ? 'Individu' : 'Regu'} {row.team.kategori_regu}
                        </span>
                      </td>
                      <td className="py-2 px-3 border border-slate-300 text-slate-700">
                        {row.team.kelas_pangkalan}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-right font-mono text-slate-800">
                        {row.averageJuryScore1to5.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-right font-mono text-slate-800">
                        {row.convertedJuryScore100.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-right font-mono text-slate-800">
                        {row.publicVoteCount}{' '}
                        <span className="text-[10px] text-slate-500">({row.publicVotePercentage}%)</span>
                      </td>
                      <td className="py-2 px-2.5 border border-slate-300 text-right font-mono font-extrabold text-emerald-900">
                        {row.finalWeightedScore.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center font-bold text-[11px]">
                        {row.rank === 1 ? (
                          <span className="text-amber-800 font-extrabold">JUARA 1</span>
                        ) : row.rank === 2 ? (
                          <span className="text-slate-700 font-bold">JUARA 2</span>
                        ) : row.rank === 3 ? (
                          <span className="text-amber-900 font-bold">JUARA 3</span>
                        ) : row.isFavorit ? (
                          <span className="text-rose-700 font-bold">FAVORIT</span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures Area */}
            <div className="grid grid-cols-2 gap-8 text-xs pt-4 mt-6">
              <div className="text-center">
                <p className="text-slate-600">Mengetahui,</p>
                <p className="font-bold text-slate-900 mt-0.5">{localConfig.ketuaPanitia.jabatan}</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-slate-300 italic">(Tanda Tangan & Stempel)</span>
                </div>
                <p className="font-bold underline text-slate-950">{localConfig.ketuaPanitia.nama}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{localConfig.ketuaPanitia.nip}</p>
              </div>

              <div className="text-center">
                <p className="text-slate-600">{localConfig.titimangsaKota || 'Depok'}, {currentDateStr}</p>
                <p className="font-bold text-slate-900 mt-0.5">{localConfig.kepalaSekolah.jabatan}</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-slate-300 italic">(Tanda Tangan & Stempel)</span>
                </div>
                <p className="font-bold underline text-slate-950">{localConfig.kepalaSekolah.nama}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{localConfig.kepalaSekolah.nip}</p>
              </div>
            </div>

            {/* Digital Verification Footer */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
              Dokumen Resmi Hasil Rekapitulasi Digital Duta Evoting · SMPIT Pondok Duta · {currentDateStr}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Kop Rekapitulasi: Kiri = Logo Kegiatan · Kanan = Logo Sekolah
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPDF}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-amber-400/25 disabled:opacity-60 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-slate-950" />
              <span>{isDownloading ? 'Menghasilkan PDF...' : 'Unduh Lembar Rekap PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

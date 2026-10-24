import React from 'react';
import { ScoreRecapItem, CategoryModel, EventModel } from '../types';
import { Printer, X, Award, CheckCircle } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventModel;
  category: CategoryModel;
  recapData: ScoreRecapItem[];
  weights: { jury: number; public: number };
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  event,
  category,
  recapData,
  weights
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-300 my-8">
        {/* Floating toolbar (hidden in print) */}
        <div className="no-print p-4 bg-slate-900 text-white rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Pratinjau Lembar Rekap Resmi (Siap Cetak / PDF)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="p-8 sm:p-12 text-slate-900 bg-white">
          {/* Official Letterhead (Kop Surat) */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <div className="text-xs tracking-widest font-bold uppercase text-slate-600 mb-0.5">
              YAYASAN PONDOK DUTA · SMP ISLAM TERPADU PONDOK DUTA
            </div>
            <h1 className="text-xl font-extrabold tracking-tight uppercase text-slate-950">
              GUGUS DEPAN GERAKAN PRAMUKA SMPIT PONDOK DUTA
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Jl. Duta Indah No. 1, Cisalak Pasar, Cimanggis, Kota Depok, Jawa Barat | Website: pondokduta.sch.id
            </p>
          </div>

          {/* Title of Document */}
          <div className="text-center mb-6">
            <h2 className="text-base font-bold uppercase tracking-wider underline">
              BERITA ACARA REKAPITULASI HASIL PENILAIAN & E-VOTING
            </h2>
            <p className="text-xs font-medium text-slate-700 mt-1">
              SUB-EVENT: {event.nama_event.toUpperCase()} · TAHUN AJARAN {event.tahun}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 p-3 bg-slate-50 border border-slate-200 rounded">
            <div>
              <div className="flex gap-2 py-0.5">
                <span className="w-28 text-slate-500">Cabang Perlombaan</span>
                <span className="font-bold">: {category.nama_kategori}</span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="w-28 text-slate-500">Deskripsi / Tipe</span>
                <span>: {category.tipe}</span>
              </div>
            </div>
            <div>
              <div className="flex gap-2 py-0.5">
                <span className="w-28 text-slate-500">Formula Agregasi</span>
                <span className="font-bold">
                  : {category.assessment_type === 'public_only'
                    ? '100% Voting Publik (Vote Bebas Saja)'
                    : category.assessment_type === 'jury_only'
                    ? '100% Penilaian Dewan Juri (Juri Saja)'
                    : `Juri (${weights.jury}%) + Publik (${weights.public}%)`}
                </span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="w-28 text-slate-500">Tanggal Rekap</span>
                <span>: {currentDate}</span>
              </div>
            </div>
          </div>

          {/* Official Table */}
          <table className="w-full text-left text-xs border border-slate-400 border-collapse mb-8">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold">
                <th className="p-2 border-r border-slate-400 text-center w-12">Peringkat</th>
                <th className="p-2 border-r border-slate-400">Nama Regu</th>
                <th className="p-2 border-r border-slate-400">Pangkalan / Kelas</th>
                <th className="p-2 border-r border-slate-400 text-right">Rata Juri (1-5)</th>
                <th className="p-2 border-r border-slate-400 text-right">Juri (100)</th>
                <th className="p-2 border-r border-slate-400 text-right">Vote Publik</th>
                <th className="p-2 border-r border-slate-400 text-right font-bold">Nilai Akhir</th>
                <th className="p-2 text-center">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {recapData.map((row) => (
                <tr key={row.team.id_team} className={row.rank <= 3 ? 'bg-slate-50/50 font-medium' : ''}>
                  <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">
                    #{row.rank}
                  </td>
                  <td className="p-2 border-r border-slate-300 font-bold">
                    {row.team.nama_regu}
                    <span className="text-[10px] text-slate-500 block font-normal">
                      Regu {row.team.kategori_regu}
                    </span>
                  </td>
                  <td className="p-2 border-r border-slate-300">{row.team.kelas_pangkalan}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">
                    {row.averageJuryScore1to5.toFixed(2)}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">
                    {row.convertedJuryScore100.toFixed(2)}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">
                    {row.publicVoteCount} ({row.publicVotePercentage}%)
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono font-bold text-slate-950">
                    {row.finalWeightedScore.toFixed(2)}
                  </td>
                  <td className="p-2 text-center font-bold text-[11px]">
                    {row.rank === 1 ? 'JUARA 1' : row.rank === 2 ? 'JUARA 2' : row.rank === 3 ? 'JUARA 3' : row.isFavorit ? 'JUARA FAVORIT' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signatures Area */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-4 mt-6">
            <div className="text-center">
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900 mt-0.5">Ketua Panitia Duta Camp</p>
              <div className="h-20"></div>
              <p className="font-bold underline text-slate-950">Kak Muhammad Ilham, S.Pd</p>
              <p className="text-[11px] text-slate-500">NIP. 19850412 201101 1 003</p>
            </div>

            <div className="text-center">
              <p className="text-slate-600">Depok, {currentDate}</p>
              <p className="font-bold text-slate-900 mt-0.5">Kepala SMPIT Pondok Duta / Ka. Mabigus</p>
              <div className="h-20"></div>
              <p className="font-bold underline text-slate-950">Drs. H. Ahmad Syafi'i, M.Pd</p>
              <p className="text-[11px] text-slate-500">NIP. 19720815 199802 1 001</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

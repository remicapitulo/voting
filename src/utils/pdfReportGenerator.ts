import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScoreRecapItem, CategoryModel, EventModel, ReportConfig } from '../types';
import { rasterizeToPngDataUrl } from './reportLogos';

export interface SignatoryInfo {
  leftTitle: string;
  leftName: string;
  leftId: string;
  rightCityDate: string;
  rightTitle: string;
  rightName: string;
  rightId: string;
}

export async function generateRecapPDF(
  event: EventModel,
  category: CategoryModel,
  recapData: ScoreRecapItem[],
  weights: { jury: number; public: number },
  reportConfig?: Partial<ReportConfig>
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const kotaStr = reportConfig?.titimangsaKota?.trim() || 'Depok';

  const signInfo: SignatoryInfo = {
    leftTitle: reportConfig?.ketuaPanitia?.jabatan || 'Ketua Panitia Pelaksana',
    leftName: reportConfig?.ketuaPanitia?.nama || 'Kak Muhammad Ilham, S.Pd',
    leftId: reportConfig?.ketuaPanitia?.nip || 'NIP. 19850412 201101 1 003',
    rightCityDate: `${kotaStr}, ${currentDateStr}`,
    rightTitle: reportConfig?.kepalaSekolah?.jabatan || 'Kepala SMPIT Pondok Duta / Ka. Mabigus',
    rightName: reportConfig?.kepalaSekolah?.nama || "Drs. H. Ahmad Syafi'i, M.Pd",
    rightId: reportConfig?.kepalaSekolah?.nip || 'NIP. 19720815 199802 1 001'
  };

  // Convert logos to PNG data URLs in parallel for maximum speed and crispness
  const [logoKegiatanPng, logoSekolahPng] = await Promise.all([
    reportConfig?.logoKegiatan ? rasterizeToPngDataUrl(reportConfig.logoKegiatan, 200, 200) : Promise.resolve(''),
    reportConfig?.logoSekolah ? rasterizeToPngDataUrl(reportConfig.logoSekolah, 200, 200) : Promise.resolve('')
  ]);

  // 1. KOP REKAPITULASI RESMI
  // Layout Kop Resmi: Kiri = Logo Sekolah, Tengah = Teks Kop Surat, Kanan = Logo Kegiatan
  const logoSize = 17; // 17mm x 17mm
  const logoY = 9.5;

  // Render Kiri: Logo Sekolah (SMPIT Pondok Duta / Tut Wuri / Custom)
  if (logoSekolahPng) {
    try {
      doc.addImage(logoSekolahPng, 'PNG', margin + 1, logoY, logoSize, logoSize);
    } catch (e) {
      console.warn('Gagal menambahkan Logo Sekolah ke PDF:', e);
    }
  }

  // Render Kanan: Logo Kegiatan (Pramuka / OSIS / Camp / Cabang Olahraga / Custom)
  if (logoKegiatanPng) {
    try {
      doc.addImage(logoKegiatanPng, 'PNG', pageWidth - margin - logoSize - 1, logoY, logoSize, logoSize);
    } catch (e) {
      console.warn('Gagal menambahkan Logo Kegiatan ke PDF:', e);
    }
  }

  // Teks Kop Surat (Center)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text('YAYASAN PONDOK DUTA', pageWidth / 2, 11.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(6, 78, 59); // Emerald-900
  doc.text('SMP ISLAM TERPADU PONDOK DUTA', pageWidth / 2, 16.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  const isPramuka = event.nama_event?.toLowerCase().includes('camp') ||
                    event.nama_event?.toLowerCase().includes('pramuka') ||
                    category.nama_kategori?.toLowerCase().includes('pramuka');
  const orgSub = isPramuka
    ? 'GUGUS DEPAN GERAKAN PRAMUKA 04.087 - 04.088'
    : 'PANITIA PELAKSANA KEGIATAN KESISWAAN';
  doc.text(orgSub, pageWidth / 2, 21.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text(
    'Jl. Duta Indah No. 1, Cisalak Pasar, Cimanggis, Kota Depok, Jawa Barat 16452 | Telp: (021) 8711466 | Web: pondokduta.sch.id',
    pageWidth / 2,
    25.5,
    { align: 'center' }
  );

  // Double horizontal rule (Kop surat garis ganda: tebal atas, tipis bawah)
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(0.8);
  doc.line(margin, 28.5, pageWidth - margin, 28.5);
  doc.setLineWidth(0.2);
  doc.line(margin, 29.7, pageWidth - margin, 29.7);

  // 2. JUDUL BERITA ACARA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('BERITA ACARA REKAPITULASI HASIL PENILAIAN & E-VOTING', pageWidth / 2, 35.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `SUB-EVENT: ${event.nama_event.toUpperCase()} · TAHUN AJARAN ${event.tahun || '2026/2027'}`,
    pageWidth / 2,
    40,
    { align: 'center' }
  );

  // 3. METADATA BOX
  const metaTop = 43.5;
  const metaHeight = 22;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, metaTop, pageWidth - (margin * 2), metaHeight, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const col1X = margin + 4;
  const col2X = margin + 98;
  const lineSpacing = 4.6;

  // Formula label
  let formulaStr = `Dewan Juri (${weights.jury}%) + Publik (${weights.public}%)`;
  if (category.assessment_type === 'public_only') {
    formulaStr = '100% Voting Publik (Vote Saja)';
  } else if (category.assessment_type === 'jury_only') {
    formulaStr = '100% Penilaian Dewan Juri (Juri Saja)';
  }

  // Row 1
  doc.setFont('helvetica', 'normal');
  doc.text('Cabang Perlombaan', col1X, metaTop + 5);
  doc.text(':', col1X + 32, metaTop + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(category.nama_kategori, col1X + 35, metaTop + 5);

  doc.setFont('helvetica', 'normal');
  doc.text('Formula Penilaian', col2X, metaTop + 5);
  doc.text(':', col2X + 28, metaTop + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(formulaStr, col2X + 31, metaTop + 5);

  // Row 2
  doc.setFont('helvetica', 'normal');
  doc.text('Kategori / Tipe', col1X, metaTop + 5 + lineSpacing);
  doc.text(':', col1X + 32, metaTop + 5 + lineSpacing);
  doc.text(`${category.tipe || 'Lomba'} (${category.tipe_peserta || 'Group'})`, col1X + 35, metaTop + 5 + lineSpacing);

  doc.text('Tanggal Rekap', col2X, metaTop + 5 + lineSpacing);
  doc.text(':', col2X + 28, metaTop + 5 + lineSpacing);
  doc.text(currentDateStr, col2X + 31, metaTop + 5 + lineSpacing);

  // Row 3
  const juryCountDesc = (!category.assigned_juries || category.assigned_juries.length === 0)
    ? 'Seluruh Dewan Juri Resmi'
    : `${category.assigned_juries.length} Juri Ditugaskan`;
  doc.text('Dewan Juri', col1X, metaTop + 5 + (lineSpacing * 2));
  doc.text(':', col1X + 32, metaTop + 5 + (lineSpacing * 2));
  doc.text(juryCountDesc, col1X + 35, metaTop + 5 + (lineSpacing * 2));

  doc.text('Total Peserta', col2X, metaTop + 5 + (lineSpacing * 2));
  doc.text(':', col2X + 28, metaTop + 5 + (lineSpacing * 2));
  doc.text(`${recapData.length} Regu / Peserta`, col2X + 31, metaTop + 5 + (lineSpacing * 2));

  // 4. DATA TABLE (autoTable)
  const tableData = recapData.map((row) => {
    let ket = '-';
    if (row.rank === 1) ket = 'JUARA 1';
    else if (row.rank === 2) ket = 'JUARA 2';
    else if (row.rank === 3) ket = 'JUARA 3';
    else if (row.isFavorit) ket = 'JUARA FAVORIT';

    return [
      `#${row.rank}`,
      `${row.team.nama_regu}\n(${row.team.kategori_regu || 'Umum'})`,
      row.team.kelas_pangkalan,
      row.averageJuryScore1to5.toFixed(2),
      row.convertedJuryScore100.toFixed(2),
      `${row.publicVoteCount} (${row.publicVotePercentage}%)`,
      row.finalWeightedScore.toFixed(2),
      ket
    ];
  });

  autoTable(doc, {
    startY: metaTop + metaHeight + 4,
    margin: { left: margin, right: margin },
    head: [[
      'Rank',
      'Nama Peserta / Regu',
      'Pangkalan / Kelas',
      'Rata Juri\n(1 - 5)',
      'Juri\n(100)',
      'Vote Publik\n(Suara)',
      'Nilai Akhir\n(Skor)',
      'Keterangan'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [6, 78, 59], // #064e3b Emerald
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 8,
      cellPadding: 2.2
    },
    styles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
      overflow: 'linebreak',
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { halign: 'right', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 18, fontStyle: 'bold', textColor: [6, 78, 59] },
      7: { halign: 'center', cellWidth: 16, fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    didParseCell: (data) => {
      // Highlight row for Top 3
      if (data.section === 'body') {
        const rowIdx = data.row.index;
        const item = recapData[rowIdx];
        if (item && item.rank === 1) {
          if (data.column.index === 0 || data.column.index === 7) {
            data.cell.styles.fillColor = [254, 243, 199]; // amber-100
            data.cell.styles.textColor = [146, 64, 14];
          }
        }
      }
    }
  });

  // Get position where table ended
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastTableY = (doc as any).lastAutoTable?.finalY || 160;

  // Check if signatures fit on current page or if new page is needed
  let sigY = lastTableY + 8;
  if (sigY + 45 > pageHeight - margin) {
    doc.addPage();
    sigY = margin + 10;
  }

  // 5. SIGNATURES (Tanda Tangan Pengesahan)
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  // Left Signatory (Ketua Panitia)
  const leftX = margin + 25;
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', leftX, sigY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(signInfo.leftTitle, leftX, sigY + 4, { align: 'center' });

  // Right Signatory (Kepala Sekolah / Ka Mabigus)
  const rightX = pageWidth - margin - 25;
  doc.setFont('helvetica', 'normal');
  doc.text(signInfo.rightCityDate, rightX, sigY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(signInfo.rightTitle, rightX, sigY + 4, { align: 'center' });

  // Signature lines after space
  const nameY = sigY + 26;
  doc.setFont('helvetica', 'bold');
  doc.text(signInfo.leftName, leftX, nameY, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.setDrawColor(30, 41, 59);
  const leftNameWidth = doc.getTextWidth(signInfo.leftName);
  doc.line(leftX - (leftNameWidth / 2), nameY + 0.8, leftX + (leftNameWidth / 2), nameY + 0.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(signInfo.leftId, leftX, nameY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(signInfo.rightName, rightX, nameY, { align: 'center' });
  const rightNameWidth = doc.getTextWidth(signInfo.rightName);
  doc.line(rightX - (rightNameWidth / 2), nameY + 0.8, rightX + (rightNameWidth / 2), nameY + 0.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(signInfo.rightId, rightX, nameY + 4.5, { align: 'center' });

  // 6. OFFICIAL FOOTER NOTE
  const footerY = pageHeight - 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Dokumen resmi Berita Acara Rekapitulasi Duta Evoting · SMPIT Pondok Duta · Dicetak otomatis secara digital pada ${currentDateStr}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // Clean filename
  const cleanEvent = (event.nama_event || 'Event').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanCategory = (category.nama_kategori || 'Kategori').replace(/[^a-zA-Z0-9]/g, '_');
  const dateFormatted = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `Rekap_Nilai_${cleanEvent}_${cleanCategory}_${dateFormatted}.pdf`;

  // Trigger download
  doc.save(fileName);
}

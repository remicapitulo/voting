/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (GAS) - DATABASE ENGINE E-VOTING & SCORING SYSTEM
 * SMPIT PONDOK DUTA - DATABASE RESMI (CLOUD SPREADSHEET)
 * =========================================================================
 * File ini bertindak sebagai Database Backend Utama yang melayani:
 * - Autentikasi Pengguna & Hak Akses (Admin, Dewan Juri, Pemilih Bebas)
 * - Penyimpanan Sub-Event, Cabang Lomba, Peserta/Regu
 * - Penyimpanan Nilai Real-time Dewan Juri & Hak Suara Voting Publik
 * =========================================================================
 */

var SHEETS = {
  USERS: 'Users',
  EVENTS: 'Events',
  CATEGORIES: 'Categories',
  TEAMS: 'Teams',
  JURY_SCORES: 'Jury_Scores',
  PUBLIC_VOTES: 'Public_Votes',
  CONFIG: 'Config'
};

// ID Google Drive Folder Resmi Penyimpanan Aset & Logo (SMPIT Pondok Duta - Logo dan Laporan)
var DRIVE_FOLDER_ID = '1NYeRMDn9xWTihaDK6LvHy97KoOTleqK7';

var SCHEMAS = [
  {
    name: SHEETS.USERS,
    headers: ['id', 'username', 'password', 'nama', 'role', 'emailOrWa', 'jurySpecialty', 'created_at']
  },
  {
    name: SHEETS.EVENTS,
    headers: ['id_event', 'kode_event', 'nama_event', 'tahun', 'status_aktif', 'batas_waktu', 'deskripsi']
  },
  {
    name: SHEETS.CATEGORIES,
    headers: ['id_kategori', 'id_event', 'nama_kategori', 'tipe', 'assessment_type', 'tipe_peserta', 'votes_required', 'kriteria', 'deskripsi', 'assigned_juries']
  },
  {
    name: SHEETS.TEAMS,
    headers: ['id_team', 'id_event', 'nama_regu', 'kelas_pangkalan', 'kategori_regu', 'foto_url', 'anggota', 'ketua_regu', 'motto', 'tipe_partisipasi']
  },
  {
    name: SHEETS.JURY_SCORES,
    headers: ['id_score', 'id_jury', 'jury_name', 'id_team', 'id_kategori', 'skor_1_to_5', 'catatan', 'kriteria_scores', 'is_final', 'timestamp']
  },
  {
    name: SHEETS.PUBLIC_VOTES,
    headers: ['id_vote', 'id_voter', 'voter_name', 'id_team', 'id_kategori', 'timestamp']
  },
  {
    name: SHEETS.CONFIG,
    headers: ['key', 'value', 'updated_at']
  }
];

// DATA AWAL DATABASE (SEEDED DI DATABASE GOOGLE SHEETS)
var INITIAL_DATA = {
  users: [
    ['user-admin', 'admin', 'admin123', 'Kak Pembina Utama (Admin Duta Evoting)', 'admin', 'admin@pondokduta.sch.id', 'Administrator Utama', '2026-10-01T08:00:00Z'],
    ['user-juri1', 'juri1', 'juri123', 'Kak Fajar Hidayat, S.Pd', 'juri', '081234567891', 'Dewan Juri Seni & Budaya', '2026-10-02T09:00:00Z'],
    ['user-juri2', 'juri2', 'juri123', 'Kak Aisyah Wardani, M.Pd', 'juri', '081234567892', 'Dewan Juri Tata Boga & Kerapian', '2026-10-02T09:15:00Z'],
    ['user-juri3', 'juri3', 'juri123', 'Kak Zulkifli Pratama, S.Kom', 'juri', '081234567893', 'Dewan Juri Ketangkasan & Orasi', '2026-10-02T09:30:00Z'],
    ['user-voter1', 'voter1', 'voter123', 'Ahmad Fauzi (Alumni)', 'voter', '085712345678', '', '2026-10-10T10:00:00Z'],
    ['user-voter2', 'voter2', 'voter123', 'Bunda Lilis (Orang Tua Murid)', 'voter', '081398765432', '', '2026-10-10T10:30:00Z']
  ],
  events: [
    [
      'duta-camp-2026',
      'Duta Camp',
      'Duta Camp - Perkemahan Pramuka Penggalang',
      '2026',
      true,
      '2026-10-31T23:59:00',
      'Perkemahan Akbar Penggalang SMPIT Pondok Duta - Membentuk Generasi Mandiri, Tangguh, & Berkarakter'
    ],
    [
      'phbi-2026',
      'PHBI',
      'PHBI - Peringatan Hari Besar Islam 1448 H',
      '2026',
      true,
      '2026-11-15T21:00:00',
      'Peringatan Hari Besar Islam SMPIT Pondok Duta - Mengukir Prestasi Islami, Meneladani Akhlak Nabi'
    ],
    [
      'phbn-2026',
      'PHBN',
      'PHBN - Peringatan Hari Besar Nasional & Kemerdekaan',
      '2026',
      true,
      '2026-12-01T20:00:00',
      'Gebyar Semarak Kemerdekaan & Hari Pahlawan SMPIT Pondok Duta - Jiwa Nasionalis, Berprestasi untuk Negeri'
    ]
  ],
  categories: [
    [
      'cat-campfire',
      'duta-camp-2026',
      'Campfire Symphony',
      'Pentas Seni Malam Api Unggun',
      'all',
      'Group',
      1,
      JSON.stringify([
        'Kreativitas & Orisinalitas Konsep',
        'Kekompakan & Harmonisasi Regu',
        'Penjiwaan & Pembawaan Pesan Moral/Islami',
        'Kerapian Seragam & Tata Panggung'
      ]),
      'Pentas Seni Malam Api Unggun (Acoustic, Teatrikal, Puisi Rimba & Paduan Suara)'
    ],
    [
      'cat-chef',
      'duta-camp-2026',
      'Master Camp Chef',
      'Lomba Memasak Rimba',
      'all',
      'Group',
      1,
      JSON.stringify([
        'Cita Rasa & Kelezatan Masakan Rimba',
        'Penyajian & Kebersihan Area Memasak',
        'Efisiensi Bahan & Kandungan Gizi',
        'Kerjasama Tim & Ketepatan Waktu (Manajemen Waktu)'
      ]),
      'Lomba Memasak Rimba (Menu Bergizi Penggalang Menggunakan Peralatan Masak Lapangan)'
    ],
    [
      'cat-rover',
      'duta-camp-2026',
      'Duta Rover Challenge',
      'Ketangkasan & Penjelajahan Per Pos',
      'all',
      'Group',
      1,
      JSON.stringify([
        'Ketepatan & Kecepatan Sandi / Morse / Semaphore',
        'Kekuatan & Kerapian Simpul / Ikatan Pionering',
        'Kesiapsiagaan Pos P3K & Navigasi Kompas',
        'Disiplin, Yel-Yel & Semangat Kebersamaan Regu'
      ]),
      'Ketangkasan & Penjelajahan Rimba (Pionering, Semaphore, Morse, Menaksir & P3K)'
    ],
    [
      'cat-phbi-pildacil',
      'phbi-2026',
      "Musabaqah Da'i Muda (Pidato Islami)",
      'Pidato & Dakwah Islami',
      'all',
      'Individu',
      1,
      JSON.stringify([
        "Kesesuaian Tema & Kedalaman Dalil Al-Qur'an/Hadits",
        'Retorika, Artikulasi & Intonasi Vokal',
        'Adab, Sikap & Kerapian Busana Muslim',
        'Ketepatan Alokasi Waktu (Max 7 Menit)'
      ]),
      'Lomba Syiar Dakwah Islam dan Retorika Ceramah Generasi Muda Qurani'
    ],
    [
      'cat-phbi-tahfidz',
      'phbi-2026',
      "Musabaqah Hifdzil Qur'an (MHQ)",
      "Hafalan Al-Qur'an",
      'all',
      'Individu',
      1,
      JSON.stringify([
        'Kelancaran & Ketepatan Hafalan (Tahfidz)',
        'Kaidah Tajwid (Makharijul Huruf & Shifatul Huruf)',
        'Fashahah & Keindahan Lagu/Tartil',
        "Adab Membaca Kitab Suci Al-Qur'an"
      ]),
      "Uji Hafalan dan Tartil Al-Qur'an Juz 30 dan Juz 29"
    ],
    [
      'cat-phbi-hadroh',
      'phbi-2026',
      'Festival Hadroh & Nasyid Sholawat',
      'Seni Musik Islami',
      'all',
      'Group',
      1,
      JSON.stringify([
        'Kekompakan Ketukan & Ritme Tabuhan Rebana',
        'Harmonisasi Vokal Utama & Backing Vokal',
        'Kesesuaian Syair Sholawat & Makhraj Bahasa Arab',
        'Kerapian Seragam & Koreografi Panggung'
      ]),
      'Lomba Paduan Rebana Klasik dan Shalawat Kontemporer Penggetar Jiwa'
    ],
    [
      'cat-phbn-orasi',
      'phbn-2026',
      'Lomba Orasi Kebangsaan Pemuda',
      'Orasi Kebangsaan',
      'all',
      'Individu',
      1,
      JSON.stringify([
        'Penjiwaan Semangat Nasionalisme & Heroisme',
        'Kekuatan Argumentasi & Solusi Generasi Emas',
        'Gestur, Penguasaan Panggung & Kontak Mata',
        'Kerapian Pakaian Adat / Pahlawan Nasional'
      ]),
      'Pidato Kepahlawanan & Mengobarkan Semangat Persatuan Bangsa'
    ],
    [
      'cat-phbn-padus',
      'phbn-2026',
      'Paduan Suara Lagu Wajib Nasional',
      'Paduan Suara',
      'all',
      'Group',
      1,
      JSON.stringify([
        'Ketepatan Nada (Pitch & Intonation)',
        'Kekompakan Aransemen & Dinamika Vokal',
        'Artikulasi & Pengucapan Lirik Nasional',
        'Kerapian Formasi & Penampilan Kontingen'
      ]),
      'Lomba Paduan Suara Harmonisasi Lagu Perjuangan Kemerdekaan Indonesia'
    ]
  ],
  teams: [
    ['team-rajawali', 'duta-camp-2026', 'Regu Rajawali', 'Kelas 8A / Pasukan Penggalang Khusus', 'Putra', '', '["Muhammad Rizky Pratama"]', 'Muhammad Rizky Pratama', 'Tangkas, Berani, Berakhlak Mulia', 'Group'],
    ['team-elang', 'duta-camp-2026', 'Regu Elang', 'Kelas 8B / Pasukan Penggalang Inti', 'Putra', '', '["Farhan Nur Hidayat"]', 'Farhan Nur Hidayat', 'Terbang Tinggi Menggapai Prestasi', 'Group'],
    ['team-garuda', 'duta-camp-2026', 'Regu Garuda', 'Kelas 7A / Pasukan Penggalang Ramu', 'Putra', '', '["Abdullah Azzam"]', 'Abdullah Azzam', 'Gagah Perkasa Pantang Menyerah', 'Group'],
    ['team-serigala', 'duta-camp-2026', 'Regu Serigala', 'Kelas 7B / Pasukan Penggalang Rakit', 'Putra', '', '["Haikal Danendra"]', 'Haikal Danendra', 'Setia Kawan, Disiplin dan Berani', 'Group'],
    ['team-melati', 'duta-camp-2026', 'Regu Melati', 'Kelas 8C / Pasukan Penggalang Putri Utama', 'Putri', '', '["Nayla Zahra Salsabila"]', 'Nayla Zahra Salsabila', 'Harum Namamu, Mulia Akhlakmu', 'Group'],
    ['team-mawar', 'duta-camp-2026', 'Regu Mawar', 'Kelas 8D / Pasukan Penggalang Putri Mandiri', 'Putri', '', '["Syifa Aulia Rahman"]', 'Syifa Aulia Rahman', 'Tegar Berduri, Indah Berbudi', 'Group'],
    ['team-sakura', 'duta-camp-2026', 'Regu Sakura', 'Kelas 7C / Pasukan Penggalang Harapan', 'Putri', '', '["Amina Khadijah"]', 'Amina Khadijah', 'Mekar Ceria Penuh Prestasi', 'Group'],
    ['team-anggrek', 'duta-camp-2026', 'Regu Anggrek', 'Kelas 7D / Pasukan Penggalang Cerdas', 'Putri', '', '["Fathimah Azzahra"]', 'Fathimah Azzahra', 'Anggun Berkarakter Qurani', 'Group'],
    ['phbi-raihan', 'phbi-2026', 'Muhammad Raihan Pratama', "Kelas 8B / Kontingen Da'i Mandiri", 'Putra', '', '[]', 'Ustadz Danang', 'Dakwah Cerdas Berakhlak Mulia', 'Individu'],
    ['phbi-zahra', 'phbi-2026', 'Sarah Azzahra Al-Hafizhah', 'Kelas 7C / Kafilah Tahfidz Khusus', 'Putri', '', '[]', 'Ustadzah Halimah', 'Mendekap Al-Quran di Lubuk Hati', 'Individu'],
    ['phbi-hadroh', 'phbi-2026', 'Grup Hadroh Shautud Duta', 'Kelas 9A / Sanggar Sholawat Utama', 'Putra', '', '[]', 'Ahmad Fauzan', 'Gema Sholawat Menyejukkan Jiwa', 'Group'],
    ['phbi-nasyid', 'phbi-2026', 'Grup Nasyid Nada Insani', 'Kelas 8C / Sanggar Nada Muslimah', 'Putri', '', '[]', 'Nabila Qatrunnada', 'Harmoni Dakwah Nada Suci', 'Group'],
    ['phbn-dimas', 'phbn-2026', 'Dimas Arya Putra', 'Kelas 9C / Duta Orator Sekolah', 'Putra', '', '[]', 'Kak Hendra', 'Kobarkan Jiwa Patriotisme Bangsa', 'Individu'],
    ['phbn-aisyah', 'phbn-2026', 'Aisyah Humaira', 'Kelas 8C / Orator Penggerak', 'Putri', '', '[]', 'Bunda Ratna', 'Generasi Emas Harapan Indonesia', 'Individu'],
    ['phbn-padus', 'phbn-2026', 'Tim Padus Gema Persada', 'Gabungan Kelas 8 & 9 / Gita Duta Swara', 'Putri', '', '[]', 'Ibu Cindy', 'Satu Nusa Satu Bangsa Berkarya', 'Group']
  ],
  jury_scores: [
    [
      'score-1',
      'user-juri1',
      'Kak Fajar Hidayat, S.Pd',
      'team-rajawali',
      'cat-campfire',
      4.6,
      'Harmonisasi vokal acapella dan pesan perjuangan dakwah sangat menyentuh hati audiens.',
      JSON.stringify({
        'Kreativitas & Orisinalitas Konsep': 4.5,
        'Kekompakan & Harmonisasi Regu': 4.7,
        'Penjiwaan & Pembawaan Pesan Moral/Islami': 4.8,
        'Kerapian Seragam & Tata Panggung': 4.4
      }),
      true,
      '2026-10-23T14:30:00Z'
    ],
    [
      'score-2',
      'user-juri2',
      'Kak Aisyah Wardani, M.Pd',
      'team-rajawali',
      'cat-campfire',
      4.5,
      'Kerapian seragam khas pramuka dan ketepatan tempo sangat baik.',
      JSON.stringify({
        'Kreativitas & Orisinalitas Konsep': 4.3,
        'Kekompakan & Harmonisasi Regu': 4.5,
        'Penjiwaan & Pembawaan Pesan Moral/Islami': 4.6,
        'Kerapian Seragam & Tata Panggung': 4.6
      }),
      true,
      '2026-10-23T14:45:00Z'
    ],
    [
      'score-3',
      'user-juri1',
      'Kak Fajar Hidayat, S.Pd',
      'team-melati',
      'cat-campfire',
      4.8,
      'Koreografi perkusi bambu dan puisi rimba sangat artistik dan rapi.',
      JSON.stringify({
        'Kreativitas & Orisinalitas Konsep': 4.8,
        'Kekompakan & Harmonisasi Regu': 4.9,
        'Penjiwaan & Pembawaan Pesan Moral/Islami': 4.7,
        'Kerapian Seragam & Tata Panggung': 4.8
      }),
      true,
      '2026-10-23T15:00:00Z'
    ]
  ],
  public_votes: [
    ['vote-1', 'user-voter1', 'Ahmad Fauzi', 'team-rajawali', 'cat-campfire', '2026-10-23T12:00:00Z'],
    ['vote-2', 'user-voter2', 'Bunda Lilis', 'team-melati', 'cat-campfire', '2026-10-23T12:05:00Z']
  ]
};

/**
 * Menyiapkan Tabel Database & Memasukkan Data Awal ke Google Sheets
 */
function setupDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  SCHEMAS.forEach(function(schema) {
    var sheet = ss.getSheetByName(schema.name);
    if (!sheet) {
      sheet = ss.insertSheet(schema.name);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(schema.headers);
      sheet.getRange(1, 1, 1, schema.headers.length)
        .setFontWeight('bold')
        .setBackground('#064e3b')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    } else {
      var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      for (var h = 0; h < schema.headers.length; h++) {
        var headerName = schema.headers[h];
        if (existingHeaders.indexOf(headerName) === -1) {
          var nextCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, nextCol).setValue(headerName)
            .setFontWeight('bold')
            .setBackground('#064e3b')
            .setFontColor('#ffffff');
        }
      }
    }
  });

  // Seed Data Awal ke Google Sheets jika sheet masih kosong (hanya header)
  var usersSheet = ss.getSheetByName(SHEETS.USERS);
  if (usersSheet.getLastRow() <= 1) {
    INITIAL_DATA.users.forEach(function(row) { usersSheet.appendRow(row); });
  }

  var eventsSheet = ss.getSheetByName(SHEETS.EVENTS);
  if (eventsSheet.getLastRow() <= 1) {
    INITIAL_DATA.events.forEach(function(row) { eventsSheet.appendRow(row); });
  }

  var catSheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (catSheet.getLastRow() <= 1) {
    INITIAL_DATA.categories.forEach(function(row) { catSheet.appendRow(row); });
  }

  var teamSheet = ss.getSheetByName(SHEETS.TEAMS);
  if (teamSheet.getLastRow() <= 1) {
    INITIAL_DATA.teams.forEach(function(row) { teamSheet.appendRow(row); });
  }

  var scoreSheet = ss.getSheetByName(SHEETS.JURY_SCORES);
  if (scoreSheet.getLastRow() <= 1) {
    INITIAL_DATA.jury_scores.forEach(function(row) { scoreSheet.appendRow(row); });
  }

  var voteSheet = ss.getSheetByName(SHEETS.PUBLIC_VOTES);
  if (voteSheet.getLastRow() <= 1) {
    INITIAL_DATA.public_votes.forEach(function(row) { voteSheet.appendRow(row); });
  }

  return { status: 'success', message: 'Database Google Sheets berhasil disiapkan dan diisi dengan Data Awal!' };
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
  var response = {};
  try {
    if (action === 'ping') {
      response = { status: 'success', message: 'Database Google Sheets Aktif & Terhubung', timestamp: new Date().toISOString() };
    } else if (action === 'getAllData') {
      response = { status: 'success', data: getAllDatabaseData() };
    } else if (action === 'setup') {
      response = setupDatabaseSheets();
    } else {
      response = { status: 'error', message: 'Action GET tidak dikenali: ' + action };
    }
  } catch (err) {
    response = { status: 'error', message: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var response = {};
  try {
    var body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      body = e.parameter;
    }
    var action = body.action || '';

    switch (action) {
      case 'ping':
        response = { status: 'success', message: 'Koneksi database berhasil.' };
        break;
      case 'setupSheets':
        response = setupDatabaseSheets();
        break;
      case 'getAllData':
        response = { status: 'success', data: getAllDatabaseData() };
        break;
      case 'login':
        response = handleLogin(body.username, body.password);
        break;
      case 'register':
        response = handleRegister(body);
        break;
      case 'submitJuryScore':
        response = handleSubmitJuryScore(body);
        break;
      case 'submitPublicVote':
        response = handleSubmitPublicVote(body);
        break;
      case 'updateCategoryCriteria':
        response = handleUpdateCategoryCriteria(body);
        break;
      case 'uploadLogo':
        response = handleUploadLogoToDrive(body);
        break;
      case 'saveConfig':
        response = handleSaveConfig(body);
        break;
      case 'getConfig':
        response = handleGetConfig(body.key);
        break;
      case 'manageCategory':
      case 'purgeCategory':
        response = handleManageCategory(body);
        break;
      case 'manageTeam':
        response = handleManageTeam(body);
        break;
      case 'manageJury':
        response = handleManageJury(body);
        break;
      case 'manageEvent':
        response = handleManageEvent(body);
        break;
      case 'toggleEventStatus':
        response = handleToggleEventStatus(body);
        break;
      case 'updateEventDeadline':
        response = handleUpdateEventDeadline(body);
        break;
      default:
        response = { status: 'error', message: 'Action POST tidak valid: ' + action };
    }
  } catch (err) {
    response = { status: 'error', message: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function getAllDatabaseData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  fixUserRowsAlignment();
  var teamSheet = ss.getSheetByName(SHEETS.TEAMS);
  if (teamSheet) {
    ensureHeaderExists(teamSheet, 'ketua_regu');
    ensureHeaderExists(teamSheet, 'motto');
    ensureHeaderExists(teamSheet, 'tipe_partisipasi');
  }
  return {
    users: getSheetDataAsObjects(ss.getSheetByName(SHEETS.USERS)),
    events: getSheetDataAsObjects(ss.getSheetByName(SHEETS.EVENTS)),
    categories: getSheetDataAsObjects(ss.getSheetByName(SHEETS.CATEGORIES)),
    teams: getSheetDataAsObjects(teamSheet),
    jury_scores: getSheetDataAsObjects(ss.getSheetByName(SHEETS.JURY_SCORES)),
    public_votes: getSheetDataAsObjects(ss.getSheetByName(SHEETS.PUBLIC_VOTES)),
    config: getConfigsMap(ss.getSheetByName(SHEETS.CONFIG || 'Config'))
  };
}

/**
 * Menyimpan baris baru dengan mencocokkan nama properti ke nama header kolom secara dinamis
 */
function appendRowByHeaders(sheet, dataObj) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i]).trim();
    var val = dataObj[key];
    if (val === undefined || val === null) {
      row.push('');
    } else if (typeof val === 'object') {
      row.push(JSON.stringify(val));
    } else {
      row.push(val);
    }
  }
  sheet.appendRow(row);
  return row;
}

/**
 * Memperbarui nilai sel pada baris tertentu berdasarkan kecocokan nama header
 */
function updateRowByHeaders(sheet, rowIndex, dataObj) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i]).trim();
    if (dataObj[key] !== undefined) {
      var val = dataObj[key];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      sheet.getRange(rowIndex, i + 1).setValue(val);
    }
  }
}

function ensureHeaderExists(sheet, headerName) {
  try {
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    for (var i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === headerName) return;
    }
    sheet.getRange(1, lastCol + 1).setValue(headerName);
  } catch (e) {
    // ignore
  }
}

/**
 * Perbaikan Otomatis Baris yang Tergeser di Sheet Users (misal nomor wa masuk ke created_at)
 */
function fixUserRowsAlignment() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.USERS);
    if (!sheet) return;
    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return;
    var headers = rows[0];
    var emailCol = headers.indexOf('emailOrWa');
    var createdCol = headers.indexOf('created_at');
    var specialtyCol = headers.indexOf('jurySpecialty');

    for (var r = 1; r < rows.length; r++) {
      var createdAtVal = String(rows[r][createdCol] || '').trim();
      // Jika kolom created_at terisi nomor telepon/wa (angka murni tanpa huruf 'T')
      if (createdAtVal && !createdAtVal.includes('T') && /^[0-9+]+$/.test(createdAtVal)) {
        var realPhone = createdAtVal;
        var realTimestamp = (specialtyCol >= 0 && String(rows[r][specialtyCol]).includes('T'))
          ? String(rows[r][specialtyCol])
          : new Date().toISOString();
        if (emailCol >= 0) {
          sheet.getRange(r + 1, emailCol + 1).setValue(realPhone);
        }
        sheet.getRange(r + 1, createdCol + 1).setValue(realTimestamp);
        if (specialtyCol >= 0) {
          sheet.getRange(r + 1, specialtyCol + 1).setValue('');
        }
      }
    }
  } catch (e) {
    Logger.log('Auto fix user alignment skipped: ' + e);
  }
}

function handleLogin(username, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return { status: 'error', message: 'Sheet Users belum tersedia' };
  var users = getSheetDataAsObjects(sheet);
  var cleanUser = String(username || '').trim().toLowerCase();
  var cleanPass = String(password || '').trim();

  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (String(u.username).trim().toLowerCase() === cleanUser) {
      if (String(u.password).trim() === cleanPass) {
        return {
          status: 'success',
          user: {
            id: u.id,
            username: u.username,
            nama: u.nama,
            role: u.role,
            created_at: u.created_at
          }
        };
      }
      return { status: 'error', message: 'Password salah' };
    }
  }
  return { status: 'error', message: 'Pengguna tidak ditemukan' };
}

function handleRegister(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEETS.USERS);
  }

  var username = String(data.username || '').trim().toLowerCase();
  var nama = String(data.nama || '').trim();
  var password = String(data.password || '');
  var emailOrWa = String(data.emailOrWa || '').trim();
  if (!username || !password || !nama) return { status: 'error', message: 'Data registrasi tidak lengkap' };

  var users = getSheetDataAsObjects(sheet);
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].username).trim().toLowerCase() === username) {
      return { status: 'error', message: 'Username sudah digunakan' };
    }
  }
  var newId = 'voter-' + new Date().getTime();
  var ts = new Date().toISOString();

  appendRowByHeaders(sheet, {
    id: newId,
    username: username,
    password: password,
    nama: nama,
    role: 'voter',
    emailOrWa: emailOrWa,
    jurySpecialty: '',
    created_at: ts
  });

  return { status: 'success', user: { id: newId, username: username, nama: nama, role: 'voter' } };
}

function handleSubmitJuryScore(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.JURY_SCORES);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEETS.JURY_SCORES);
  }

  var idJury = String(data.id_jury || '');
  var juryName = String(data.jury_name || '');
  var idTeam = String(data.id_team || '');
  var idKategori = String(data.id_kategori || '');
  var skor = parseFloat(data.skor_1_to_5 || 0);
  var catatan = String(data.catatan || '');
  var kriteriaScores = typeof data.kriteria_scores === 'object' ? JSON.stringify(data.kriteria_scores) : String(data.kriteria_scores || '{}');
  var isFinal = data.is_final ? true : false;
  var ts = new Date().toISOString();

  var scoreObj = {
    id_jury: idJury,
    jury_name: juryName,
    id_team: idTeam,
    id_kategori: idKategori,
    skor_1_to_5: skor,
    catatan: catatan,
    kriteria_scores: kriteriaScores,
    is_final: isFinal,
    timestamp: ts
  };

  var scores = getSheetDataAsObjects(sheet);
  for (var r = 0; r < scores.length; r++) {
    if (String(scores[r].id_jury) === idJury && String(scores[r].id_team) === idTeam && String(scores[r].id_kategori) === idKategori) {
      updateRowByHeaders(sheet, r + 2, scoreObj);
      return { status: 'success', message: 'Nilai juri berhasil diperbarui' };
    }
  }

  scoreObj.id_score = data.id_score || ('score-' + new Date().getTime());
  appendRowByHeaders(sheet, scoreObj);
  return { status: 'success', message: 'Nilai juri berhasil disimpan' };
}

function handleSubmitPublicVote(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.PUBLIC_VOTES);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEETS.PUBLIC_VOTES);
  }

  var idVoter = String(data.id_voter || '');
  var voterName = String(data.voter_name || '');
  var idTeam = String(data.id_team || '');
  var idKategori = String(data.id_kategori || '');
  var ts = new Date().toISOString();

  var votes = getSheetDataAsObjects(sheet);
  var userVotesInCat = 0;
  for (var r = 0; r < votes.length; r++) {
    if (String(votes[r].id_voter) === idVoter && String(votes[r].id_kategori) === idKategori) {
      if (String(votes[r].id_team) === idTeam) {
        return { status: 'error', message: 'Anda sudah memberikan suara untuk regu ini!' };
      }
      userVotesInCat++;
    }
  }

  var maxQuota = data.votes_required ? parseInt(data.votes_required, 10) : 1;
  if (userVotesInCat >= maxQuota) {
    return { status: 'error', message: 'Hak suara Anda (' + maxQuota + ' suara) untuk kategori ini sudah terpenuhi.' };
  }

  appendRowByHeaders(sheet, {
    id_vote: 'vote-' + new Date().getTime(),
    id_voter: idVoter,
    voter_name: voterName,
    id_team: idTeam,
    id_kategori: idKategori,
    timestamp: ts
  });

  return { status: 'success', message: 'Vote berhasil disimpan!' };
}

function handleManageCategory(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  }

  var op = data.operation || 'create';
  var idKategori = String(data.id_kategori || ('cat-' + new Date().getTime())).trim();
  var namaKategori = String(data.nama_kategori || '').trim();
  var idEvent = String(data.id_event || '').trim();
  var rows = sheet.getDataRange().getValues();

  if (op === 'delete' || op === 'purge') {
    var targetId = idKategori.toLowerCase();
    var targetName = namaKategori.toLowerCase();
    var targetEvent = idEvent.toLowerCase();
    var deletedCount = 0;

    // Loop dari baris paling bawah ke atas agar indeks baris sheet tidak tergeser saat deleteRow
    for (var r = rows.length - 1; r >= 1; r--) {
      var rowId = String(rows[r][0] || '').trim().toLowerCase();
      var rowEvent = String(rows[r][1] || '').trim().toLowerCase();
      var rowName = String(rows[r][2] || '').trim().toLowerCase();

      var matchName = targetName && (rowName === targetName);
      var matchId = targetId && (rowId === targetId);

      // Cocok jika:
      // 1. Nama kategori sama persis (misal 'Master Camp Chef')
      // 2. Atau jika targetId sama persis DAN jika targetName ada maka nama juga cocok, atau targetName kosong
      if (matchName || (matchId && (!targetName || rowName === targetName))) {
        sheet.deleteRow(r + 1);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      // Bersihkan juga nilai skor dan vote publik terkait kategori ini jika ada
      try {
        var scoreSheet = ss.getSheetByName(SHEETS.JURY_SCORES);
        if (scoreSheet) {
          var sRows = scoreSheet.getDataRange().getValues();
          for (var s = sRows.length - 1; s >= 1; s--) {
            var sCatId = String(sRows[s][4] || '').trim().toLowerCase();
            if (sCatId === targetId) {
              scoreSheet.deleteRow(s + 1);
            }
          }
        }
        var voteSheet = ss.getSheetByName(SHEETS.PUBLIC_VOTES);
        if (voteSheet) {
          var vRows = voteSheet.getDataRange().getValues();
          for (var v = vRows.length - 1; v >= 1; v--) {
            var vCatId = String(vRows[v][4] || '').trim().toLowerCase();
            if (vCatId === targetId) {
              voteSheet.deleteRow(v + 1);
            }
          }
        }
      } catch (cleanErr) {
        Logger.log('Score/vote cleanup warning: ' + cleanErr);
      }

      return { status: 'success', message: 'Cabang lomba (' + (namaKategori || idKategori) + ') sebanyak ' + deletedCount + ' baris berhasil dihapus permanen dari Google Sheets.' };
    }
    return { status: 'error', message: 'Cabang lomba tidak ditemukan di sheet Categories Google Sheets.' };
  }

  ensureHeaderExists(sheet, 'assigned_juries');

  var kriteriaStr = Array.isArray(data.kriteria) ? JSON.stringify(data.kriteria) : String(data.kriteria || '[]');
  var assignedJuriesStr = Array.isArray(data.assigned_juries)
    ? JSON.stringify(data.assigned_juries)
    : String(data.assigned_juries || '[]');

  var catObj = {
    id_kategori: idKategori,
    id_event: data.id_event || 'duta-camp-2026',
    nama_kategori: data.nama_kategori,
    tipe: data.tipe || 'Lomba',
    assessment_type: data.assessment_type || 'all',
    tipe_peserta: data.tipe_peserta || 'Group',
    votes_required: parseInt(data.votes_required || 1, 10),
    kriteria: kriteriaStr,
    deskripsi: data.deskripsi || '',
    assigned_juries: assignedJuriesStr
  };

  if (op === 'update') {
    // 1. Cari berdasarkan ID
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim().toLowerCase() === idKategori.toLowerCase()) {
        updateRowByHeaders(sheet, i + 1, catObj);
        return { status: 'success', message: 'Cabang lomba berhasil diperbarui' };
      }
    }
    // 2. Jika ID tidak cocok, cari berdasarkan nama kategori di event yang sama
    if (namaKategori) {
      for (var j = 1; j < rows.length; j++) {
        var rEvent = String(rows[j][1] || '').trim().toLowerCase();
        var rName = String(rows[j][2] || '').trim().toLowerCase();
        if (rName === namaKategori.toLowerCase() && (!idEvent || rEvent === idEvent.toLowerCase())) {
          updateRowByHeaders(sheet, j + 1, catObj);
          return { status: 'success', message: 'Cabang lomba berhasil diperbarui' };
        }
      }
    }
    return { status: 'error', message: 'Cabang lomba tidak ditemukan untuk diperbarui' };
  }

  // Operasi Create: Cek apakah nama atau id kategori sudah pernah ada agar tidak timbul baris ganda
  for (var k = 1; k < rows.length; k++) {
    var exId = String(rows[k][0] || '').trim().toLowerCase();
    var exEvent = String(rows[k][1] || '').trim().toLowerCase();
    var exName = String(rows[k][2] || '').trim().toLowerCase();

    if ((exId === idKategori.toLowerCase()) || 
        (namaKategori && exName === namaKategori.toLowerCase() && (!idEvent || exEvent === idEvent.toLowerCase()))) {
      updateRowByHeaders(sheet, k + 1, catObj);
      return { status: 'success', message: 'Cabang lomba sudah ada, data berhasil disinkronkan' };
    }
  }

  appendRowByHeaders(sheet, catObj);
  return { status: 'success', message: 'Cabang lomba berhasil ditambahkan' };
}

function handleManageTeam(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.TEAMS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEETS.TEAMS);
  }

  ensureHeaderExists(sheet, 'ketua_regu');
  ensureHeaderExists(sheet, 'motto');
  ensureHeaderExists(sheet, 'tipe_partisipasi');

  var op = data.operation || 'create';
  var idTeam = String(data.id_team || ('team-' + new Date().getTime()));
  var rows = sheet.getDataRange().getValues();

  if (op === 'delete') {
    for (var r = 1; r < rows.length; r++) {
      if (String(rows[r][0]) === idTeam) {
        sheet.deleteRow(r + 1);
        return { status: 'success', message: 'Peserta berhasil dihapus' };
      }
    }
    return { status: 'error', message: 'Peserta tidak ditemukan' };
  }

  var anggotaStr = Array.isArray(data.anggota) ? JSON.stringify(data.anggota) : String(data.anggota || '[]');
  var teamObj = {
    id_team: idTeam,
    id_event: data.id_event || 'duta-camp-2026',
    nama_regu: data.nama_regu || '',
    kelas_pangkalan: data.kelas_pangkalan || '',
    kategori_regu: data.kategori_regu || 'Putra',
    foto_url: data.foto_url || '',
    anggota: anggotaStr,
    ketua_regu: data.ketua_regu || '',
    motto: data.motto || '',
    tipe_partisipasi: data.tipe_partisipasi || 'Group'
  };

  if (op === 'update') {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === idTeam) {
        updateRowByHeaders(sheet, i + 1, teamObj);
        return { status: 'success', message: 'Data peserta berhasil diperbarui' };
      }
    }
  }

  appendRowByHeaders(sheet, teamObj);
  return { status: 'success', message: 'Peserta berhasil ditambahkan' };
}

function handleManageJury(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEETS.USERS);
  }

  var op = data.operation || 'create';
  var rows = sheet.getDataRange().getValues();

  function norm(str) {
    if (!str) return '';
    return String(str).trim().toLowerCase().replace(/^@+/, '');
  }

  var targetId = norm(data.id || data.id_jury);
  var targetUser = norm(data.username);
  var targetName = norm(data.nama);

  if (op === 'delete') {
    var deleted = false;
    var deletedUsernames = [];
    var deletedIds = [];

    // Loop dari bawah ke atas agar indeks baris aman saat deleteRow
    for (var r = rows.length - 1; r >= 1; r--) {
      var rowId = norm(rows[r][0]);
      var rowUsername = norm(rows[r][1]);
      var rowName = norm(rows[r][3]);
      var rowRole = norm(rows[r][4]);

      // Fleksibilitas pencocokan:
      // 1. ID sama persis atau sama tanpa prefix 'user-' atau 'jury-'
      var idMatch = targetId && (
        rowId === targetId ||
        rowId.replace(/^(user|jury)-/, '') === targetId.replace(/^(user|jury)-/, '')
      );
      // 2. Username sama (dengan atau tanpa tanda @)
      var userMatch = targetUser && (
        rowUsername === targetUser ||
        rowUsername === targetId.replace(/^(user|jury)-/, '') ||
        rowId.replace(/^(user|jury)-/, '') === targetUser
      );
      // 3. ID di frontend sama dengan Username di sheet (atau sebaliknya)
      var crossMatch = (targetId && (rowUsername === targetId || rowUsername === targetId.replace(/^(user|jury)-/, ''))) ||
                       (targetUser && (rowId === targetUser || rowId.replace(/^(user|jury)-/, '') === targetUser));
      // 4. Nama lengkap sama
      var nameMatch = targetName && (rowName === targetName);

      if (idMatch || userMatch || crossMatch || nameMatch) {
        if (rowUsername) deletedUsernames.push(rowUsername);
        if (rowId) deletedIds.push(rowId);
        sheet.deleteRow(r + 1);
        deleted = true;
      }
    }

    if (deleted) {
      // Bersihkan juga nilai di Jury_Scores yang terkait dengan juri ini
      try {
        var scoreSheet = ss.getSheetByName(SHEETS.JURY_SCORES);
        if (scoreSheet) {
          var sRows = scoreSheet.getDataRange().getValues();
          for (var s = sRows.length - 1; s >= 1; s--) {
            var sJuryId = norm(sRows[s][1]);
            var sJuryName = norm(sRows[s][2]);
            if ((targetId && sJuryId === targetId) ||
                (targetUser && sJuryId === targetUser) ||
                (targetName && sJuryName === targetName) ||
                deletedIds.indexOf(sJuryId) >= 0 ||
                deletedUsernames.indexOf(sJuryId) >= 0) {
              scoreSheet.deleteRow(s + 1);
            }
          }
        }
      } catch (scoreErr) {
        Logger.log('Error cleaning jury scores: ' + scoreErr);
      }
      return { status: 'success', message: 'Akun juri berhasil dihapus permanen dari Google Sheets' };
    }
    return { status: 'error', message: 'Akun juri tidak ditemukan di Google Sheets (ID: ' + targetId + ', Username: ' + targetUser + ')' };
  }

  if (op === 'update') {
    for (var i = 1; i < rows.length; i++) {
      var rowId = norm(rows[i][0]);
      var rowUsername = norm(rows[i][1]);
      var rowName = norm(rows[i][3]);

      var isMatch = (targetId && (rowId === targetId || rowId.replace(/^(user|jury)-/, '') === targetId.replace(/^(user|jury)-/, ''))) ||
                    (targetUser && (rowUsername === targetUser || rowUsername === targetId.replace(/^(user|jury)-/, '') || rowId.replace(/^(user|jury)-/, '') === targetUser)) ||
                    (targetName && rowName === targetName);

      if (isMatch) {
        var updateObj = {
          username: targetUser,
          nama: String(data.nama || ''),
          jurySpecialty: String(data.jurySpecialty || '')
        };
        if (data.password) updateObj.password = String(data.password);
        updateRowByHeaders(sheet, i + 1, updateObj);
        return { status: 'success', message: 'Data juri berhasil diperbarui di Google Sheets' };
      }
    }
    return { status: 'error', message: 'Akun juri tidak ditemukan di Google Sheets' };
  }

  // Create new jury
  // 1. Verify username uniqueness in sheet
  for (var u = 1; u < rows.length; u++) {
    var existingUser = norm(rows[u][1]);
    if (existingUser === targetUser) {
      return { status: 'error', message: 'Username ' + targetUser + ' sudah digunakan di database Google Sheets' };
    }
  }

  var newId = String(data.id || data.id_jury || ('jury-' + new Date().getTime()));
  appendRowByHeaders(sheet, {
    id: newId,
    username: targetUser,
    password: String(data.password || '123456'),
    nama: String(data.nama || ''),
    role: 'juri',
    emailOrWa: '',
    jurySpecialty: String(data.jurySpecialty || 'Dewan Juri Khusus'),
    created_at: String(data.created_at || new Date().toISOString())
  });

  return { status: 'success', message: 'Akun juri berhasil dibuat di Google Sheets', id: newId };
}

function handleManageEvent(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.EVENTS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEETS.EVENTS);
  }

  var idEvent = data.id_event || ('event-' + new Date().getTime());
  var op = data.operation || 'create';
  var rows = sheet.getDataRange().getValues();

  var eventObj = {
    id_event: idEvent,
    kode_event: data.kode_event || '',
    nama_event: data.nama_event,
    tahun: data.tahun || '2026',
    status_aktif: data.status_aktif !== undefined ? data.status_aktif : true,
    batas_waktu: data.batas_waktu || '',
    deskripsi: data.deskripsi || ''
  };

  if (op === 'update') {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === idEvent) {
        updateRowByHeaders(sheet, i + 1, eventObj);
        return { status: 'success', message: 'Event berhasil diperbarui' };
      }
    }
  }

  appendRowByHeaders(sheet, eventObj);
  return { status: 'success', message: 'Event berhasil ditambahkan' };
}

function handleToggleEventStatus(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.EVENTS);
  if (!sheet) return { status: 'error', message: 'Sheet Events belum tersedia' };
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { status: 'error', message: 'Tidak ada data event' };
  var headers = rows[0];
  var statusColIdx = -1;
  var tahunColIdx = -1;
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim().toLowerCase();
    if (h === 'status_aktif') statusColIdx = c + 1;
    if (h === 'tahun') tahunColIdx = c + 1;
  }
  var updated = false;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id_event).trim()) {
      var isAct = (data.is_active === true || String(data.is_active).toLowerCase() === 'true');
      if (statusColIdx > 0) sheet.getRange(i + 1, statusColIdx).setValue(isAct);
      if (tahunColIdx > 0 && typeof rows[i][tahunColIdx - 1] === 'boolean') {
        sheet.getRange(i + 1, tahunColIdx).setValue(isAct);
      }
      // Set column 3 and column 5 to guarantee both standard & shifted layouts stay in sync
      sheet.getRange(i + 1, 3).setValue(isAct);
      sheet.getRange(i + 1, 5).setValue(isAct);
      updated = true;
    }
  }
  if (updated) {
    return { status: 'success', message: 'Status event berhasil diubah' };
  }
  return { status: 'error', message: 'Event tidak ditemukan' };
}

function handleUpdateEventDeadline(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.EVENTS);
  if (!sheet) return { status: 'error', message: 'Sheet Events belum tersedia' };
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { status: 'error', message: 'Tidak ada data event' };
  var headers = rows[0];
  var deadlineColIdx = -1;
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim().toLowerCase();
    if (h === 'batas_waktu') deadlineColIdx = c + 1;
  }
  var updated = false;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id_event).trim()) {
      if (deadlineColIdx > 0) {
        sheet.getRange(i + 1, deadlineColIdx).setValue(data.deadline || '');
      } else {
        sheet.getRange(i + 1, 6).setValue(data.deadline || '');
      }
      updated = true;
    }
  }
  if (updated) {
    return { status: 'success', message: 'Batas waktu berhasil disimpan' };
  }
  return { status: 'error', message: 'Event tidak ditemukan' };
}

function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var results = [];
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[String(headers[c]).trim()] = row[c];
    }
    results.push(obj);
  }
  return results;
}

/**
 * =========================================================================
 * PERTANYAAN / KRITERIA DEWAN JURI (PERSISTENSI RESMI GOOGLE SHEETS)
 * =========================================================================
 */
function handleUpdateCategoryCriteria(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  }

  var idKategori = String(data.id_kategori || '').trim();
  if (!idKategori) {
    return { status: 'error', message: 'ID Kategori tidak disertakan' };
  }

  ensureHeaderExists(sheet, 'kriteria');
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return { status: 'error', message: 'Data kategori di spreadsheet masih kosong' };
  }

  var headers = rows[0];
  var idCol = headers.indexOf('id_kategori');
  var kriteriaCol = headers.indexOf('kriteria');
  if (idCol === -1) idCol = 0;
  if (kriteriaCol === -1) kriteriaCol = 7;

  var kriteriaStr = Array.isArray(data.kriteria)
    ? JSON.stringify(data.kriteria)
    : String(data.kriteria || '[]');

  var found = false;
  for (var r = 1; r < rows.length; r++) {
    if (String(rows[r][idCol]).trim() === idKategori) {
      sheet.getRange(r + 1, kriteriaCol + 1).setValue(kriteriaStr);
      found = true;
      break;
    }
  }

  if (!found) {
    return { status: 'error', message: 'Cabang lomba dengan ID ' + idKategori + ' tidak ditemukan di sheet Categories' };
  }

  return {
    status: 'success',
    message: 'Kriteria pertanyaan dewan juri berhasil disimpan permanen ke Google Sheets!',
    id_kategori: idKategori,
    kriteria: data.kriteria
  };
}

/**
 * =========================================================================
 * FUNGSI AKTIVASI IZIN GOOGLE DRIVE (PENTING DIBACA)
 * =========================================================================
 * Jika muncul error: "You do not have permission to call DriveApp...",
 * ikuti langkah mudah berikut:
 * 1. Di editor Apps Script, pada dropdown fungsi di samping tombol "Run / Jalankan",
 *    pilih fungsi "authorizeDriveApp".
 * 2. Klik tombol ▶ "Run" (Jalankan).
 * 3. Google akan menampilkan popup "Authorization Required" (Izin Diperlukan).
 * 4. Klik "Review Permissions" -> Pilih Akun Google Anda -> Klik "Advanced" -> Klik "Go to ... (unsafe)" -> Klik "Allow".
 * 5. Buat deployment versi baru:
 *    Klik "Deploy" -> "Manage deployments" -> Ikon Pensil (Edit) -> Versi: "New version" -> Klik "Deploy".
 */
function authorizeDriveApp() {
  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    // PENTING: Wajib memanggil createFile agar Google Apps Script memicu popup izin TULIS (WRITE): https://www.googleapis.com/auth/drive
    var testFile = folder.createFile('auth_test.txt', 'Otorisasi Google Drive Berhasil');
    testFile.setTrashed(true); // Langsung pindahkan file pengujian ke sampah
    Logger.log('Otorisasi Google Drive Berhasil Penuh! Hak tulis (createFile) aktif di folder: ' + folder.getName() + ' (ID: ' + folder.getId() + ')');
    return 'Otorisasi Berhasil Penuh: ' + folder.getName();
  } catch (e) {
    Logger.log('Error otorisasi Drive: ' + e);
    throw e;
  }
}

/**
 * =========================================================================
 * GOOGLE DRIVE LOGO & ASSET UPLOADER
 * Menyimpan Logo Sekolah / Kegiatan ke Google Drive Folder Khusus
 * Folder ID Default: 1NYeRMDn9xWTihaDK6LvHy97KoOTleqK7 (Logo dan Laporan)
 * =========================================================================
 */
function handleUploadLogoToDrive(data) {
  try {
    var targetFolderId = String(data.folderId || DRIVE_FOLDER_ID).trim();
    if (!targetFolderId) {
      targetFolderId = DRIVE_FOLDER_ID;
    }

    var folder = null;
    try {
      folder = DriveApp.getFolderById(targetFolderId);
    } catch (err1) {
      var errStr = err1.toString();
      if (errStr.indexOf('permission') > -1 || errStr.indexOf('DriveApp') > -1) {
        return {
          status: 'error',
          message: 'Izin Google Drive belum diaktifkan di Google Apps Script. Solusi: Buka editor Apps Script, pilih fungsi "authorizeDriveApp", klik Run/Jalankan, lalu klik "Allow" dan Deploy versi baru.'
        };
      }
      return {
        status: 'error',
        message: 'Folder Google Drive (ID: ' + targetFolderId + ') tidak dapat diakses: ' + errStr + '. Pastikan folder dibagikan (Shared) dengan akun Google ini sebagai Editor.'
      };
    }

    if (!folder) {
      return {
        status: 'error',
        message: 'Folder Google Drive (ID: ' + targetFolderId + ') tidak ditemukan. Pastikan folder sudah dibuat dan dapat diakses.'
      };
    }

    var base64Data = data.base64 || data.base64Data || '';
    if (base64Data.indexOf(';base64,') > -1) {
      base64Data = base64Data.split(';base64,')[1];
    }

    if (!base64Data) {
      return { status: 'error', message: 'Data gambar base64 kosong' };
    }

    var mimeType = data.mimeType || 'image/png';
    var logoTitle = String(data.logoTitle || data.name || '').trim();
    
    // Tentukan ekstensi file
    var ext = '.png';
    if (mimeType.indexOf('jpeg') > -1 || mimeType.indexOf('jpg') > -1) {
      ext = '.jpg';
    } else if (mimeType.indexOf('svg') > -1) {
      ext = '.svg';
    } else if (mimeType.indexOf('webp') > -1) {
      ext = '.webp';
    }

    // Tentukan nama file rapi di Google Drive sesuai input nama pengguna
    var fileName = '';
    if (logoTitle) {
      var safeTitle = logoTitle.replace(/[\\/:*?"<>|]/g, ' ').trim();
      fileName = safeTitle + ext;
    } else if (data.fileName) {
      fileName = data.fileName;
    } else {
      fileName = 'logo_' + new Date().getTime() + ext;
    }

    var decodedBytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
    var file = folder.createFile(blob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log('Set sharing warning: ' + shareErr);
    }

    var fileId = file.getId();
    var directViewUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
    var downloadUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;

    var logoEntry = {
      id: 'logo_' + fileId,
      name: logoTitle || fileName.replace(/\.[^/.]+$/, ""),
      url: directViewUrl,
      driveFileId: fileId,
      fileName: file.getName(),
      folderId: folder.getId(),
      folderName: folder.getName(),
      type: data.type || 'olahraga',
      created_at: new Date().toISOString()
    };

    // Otomatis simpan logo baru ke pustaka logo (Config sheet)
    saveUploadedLogoToConfig(logoEntry);

    return {
      status: 'success',
      fileId: fileId,
      fileUrl: directViewUrl,
      downloadUrl: downloadUrl,
      fileName: file.getName(),
      folderName: folder.getName(),
      folderId: folder.getId(),
      logoEntry: logoEntry,
      message: 'Logo "' + logoEntry.name + '" berhasil diunggah ke Google Drive di folder "' + folder.getName() + '"!'
    };
  } catch (err) {
    return { status: 'error', message: 'Gagal mengunggah logo ke Google Drive: ' + err.toString() };
  }
}

/**
 * Menyimpan metadata logo yang berhasil diunggah ke Config Sheet agar tersinkronisasi ke seluruh perangkat
 */
function saveUploadedLogoToConfig(logoEntry) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.CONFIG || 'Config');
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.CONFIG || 'Config');
      sheet.appendRow(['key', 'value', 'updated_at']);
      sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#064e3b').setFontColor('#ffffff');
    }

    var currentList = [];
    var rows = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var r = 1; r < rows.length; r++) {
      if (String(rows[r][0]).trim() === 'uploaded_logos') {
        rowIndex = r + 1;
        try {
          currentList = JSON.parse(rows[r][1]);
          if (!Array.isArray(currentList)) currentList = [];
        } catch (e) {
          currentList = [];
        }
        break;
      }
    }

    // Cek apakah logo dengan fileId sama sudah ada
    var existingIdx = -1;
    for (var i = 0; i < currentList.length; i++) {
      if (currentList[i].driveFileId === logoEntry.driveFileId || currentList[i].name === logoEntry.name) {
        existingIdx = i;
        break;
      }
    }

    if (existingIdx > -1) {
      currentList[existingIdx] = logoEntry;
    } else {
      currentList.unshift(logoEntry);
    }

    var ts = new Date().toISOString();
    var valStr = JSON.stringify(currentList);

    if (rowIndex > -1) {
      sheet.getRange(rowIndex, 2).setValue(valStr);
      sheet.getRange(rowIndex, 3).setValue(ts);
    } else {
      sheet.appendRow(['uploaded_logos', valStr, ts]);
    }
  } catch (err) {
    Logger.log('Gagal menyimpan logo ke Config sheet: ' + err);
  }
}

/**
 * =========================================================================
 * PENGATURAN KOP & REKAPITULASI (PERSISTENSI RESMI GOOGLE SHEETS)
 * Menyimpan Nama Kepala Sekolah, Ketua Panitia, Kota, dan Link Logo Drive
 * =========================================================================
 */
function handleSaveConfig(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.CONFIG || 'Config');
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.CONFIG || 'Config');
    sheet.appendRow(['key', 'value', 'updated_at']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#064e3b').setFontColor('#ffffff');
  }

  var key = String(data.key || '').trim();
  var value = typeof data.value === 'object' ? JSON.stringify(data.value) : String(data.value || '');
  var ts = new Date().toISOString();

  if (!key) return { status: 'error', message: 'Key config tidak boleh kosong' };

  var rows = sheet.getDataRange().getValues();
  for (var r = 1; r < rows.length; r++) {
    if (String(rows[r][0]).trim() === key) {
      sheet.getRange(r + 1, 2).setValue(value);
      sheet.getRange(r + 1, 3).setValue(ts);
      return { status: 'success', message: 'Konfigurasi ' + key + ' berhasil diperbarui di Google Sheets.' };
    }
  }

  sheet.appendRow([key, value, ts]);
  return { status: 'success', message: 'Konfigurasi ' + key + ' berhasil disimpan di Google Sheets.' };
}

function handleGetConfig(key) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.CONFIG || 'Config');
  if (!sheet) return { status: 'error', message: 'Sheet Config belum tersedia' };
  var rows = sheet.getDataRange().getValues();
  for (var r = 1; r < rows.length; r++) {
    if (String(rows[r][0]).trim() === String(key).trim()) {
      var val = rows[r][1];
      try {
        val = JSON.parse(val);
      } catch (e) {}
      return { status: 'success', key: key, value: val };
    }
  }
  return { status: 'error', message: 'Key config tidak ditemukan' };
}

function getConfigsMap(sheet) {
  var map = {};
  if (!sheet) return map;
  try {
    var rows = sheet.getDataRange().getValues();
    for (var r = 1; r < rows.length; r++) {
      var key = String(rows[r][0] || '').trim();
      var val = rows[r][1];
      if (key) {
        try {
          map[key] = JSON.parse(val);
        } catch (e) {
          map[key] = val;
        }
      }
    }
  } catch (e) {
    Logger.log('Error getConfigsMap: ' + e);
  }
  return map;
}

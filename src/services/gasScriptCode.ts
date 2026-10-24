export const GAS_SCRIPT_CODE = `/**
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
  PUBLIC_VOTES: 'Public_Votes'
};

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
    headers: ['id_kategori', 'id_event', 'nama_kategori', 'tipe', 'assessment_type', 'tipe_peserta', 'votes_required', 'kriteria', 'deskripsi']
  },
  {
    name: SHEETS.TEAMS,
    headers: ['id_team', 'id_event', 'nama_regu', 'kelas_pangkalan', 'kategori_regu', 'foto_url', 'anggota']
  },
  {
    name: SHEETS.JURY_SCORES,
    headers: ['id_score', 'id_jury', 'jury_name', 'id_team', 'id_kategori', 'skor_1_to_5', 'catatan', 'kriteria_scores', 'is_final', 'timestamp']
  },
  {
    name: SHEETS.PUBLIC_VOTES,
    headers: ['id_vote', 'id_voter', 'voter_name', 'id_team', 'id_kategori', 'timestamp']
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
    ['team-rajawali', 'duta-camp-2026', 'Regu Rajawali', 'Kelas 8A / Pasukan Penggalang Khusus', 'Putra', '', '["Muhammad Rizky Pratama"]'],
    ['team-elang', 'duta-camp-2026', 'Regu Elang', 'Kelas 8B / Pasukan Penggalang Inti', 'Putra', '', '["Farhan Nur Hidayat"]'],
    ['team-garuda', 'duta-camp-2026', 'Regu Garuda', 'Kelas 7A / Pasukan Penggalang Ramu', 'Putra', '', '["Abdullah Azzam"]'],
    ['team-serigala', 'duta-camp-2026', 'Regu Serigala', 'Kelas 7B / Pasukan Penggalang Rakit', 'Putra', '', '["Haikal Danendra"]'],
    ['team-melati', 'duta-camp-2026', 'Regu Melati', 'Kelas 8C / Pasukan Penggalang Putri Utama', 'Putri', '', '["Nayla Zahra Salsabila"]'],
    ['team-mawar', 'duta-camp-2026', 'Regu Mawar', 'Kelas 8D / Pasukan Penggalang Putri Mandiri', 'Putri', '', '["Syifa Aulia Rahman"]'],
    ['team-sakura', 'duta-camp-2026', 'Regu Sakura', 'Kelas 7C / Pasukan Penggalang Harapan', 'Putri', '', '["Amina Khadijah"]'],
    ['team-anggrek', 'duta-camp-2026', 'Regu Anggrek', 'Kelas 7D / Pasukan Penggalang Cerdas', 'Putri', '', '["Fathimah Azzahra"]'],
    ['phbi-raihan', 'phbi-2026', 'Muhammad Raihan Pratama', "Kelas 8B / Kontingen Da'i Mandiri", 'Putra', '', '[]'],
    ['phbi-zahra', 'phbi-2026', 'Sarah Azzahra Al-Hafizhah', 'Kelas 7C / Kafilah Tahfidz Khusus', 'Putri', '', '[]'],
    ['phbi-hadroh', 'phbi-2026', 'Grup Hadroh Shautud Duta', 'Kelas 9A / Sanggar Sholawat Utama', 'Putra', '', '[]'],
    ['phbi-nasyid', 'phbi-2026', 'Grup Nasyid Nada Insani', 'Kelas 8C / Sanggar Nada Muslimah', 'Putri', '', '[]'],
    ['phbn-dimas', 'phbn-2026', 'Dimas Arya Putra', 'Kelas 9C / Duta Orator Sekolah', 'Putra', '', '[]'],
    ['phbn-aisyah', 'phbn-2026', 'Aisyah Humaira', 'Kelas 8C / Orator Penggerak', 'Putri', '', '[]'],
    ['phbn-padus', 'phbn-2026', 'Tim Padus Gema Persada', 'Gabungan Kelas 8 & 9 / Gita Duta Swara', 'Putri', '', '[]']
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
      case 'manageCategory':
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
  return {
    users: getSheetDataAsObjects(ss.getSheetByName(SHEETS.USERS)),
    events: getSheetDataAsObjects(ss.getSheetByName(SHEETS.EVENTS)),
    categories: getSheetDataAsObjects(ss.getSheetByName(SHEETS.CATEGORIES)),
    teams: getSheetDataAsObjects(ss.getSheetByName(SHEETS.TEAMS)),
    jury_scores: getSheetDataAsObjects(ss.getSheetByName(SHEETS.JURY_SCORES)),
    public_votes: getSheetDataAsObjects(ss.getSheetByName(SHEETS.PUBLIC_VOTES))
  };
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
  sheet.appendRow([newId, username, password, nama, 'voter', emailOrWa, '', ts]);
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

  var rows = sheet.getDataRange().getValues();
  for (var r = 1; r < rows.length; r++) {
    if (String(rows[r][1]) === idJury && String(rows[r][3]) === idTeam && String(rows[r][4]) === idKategori) {
      sheet.getRange(r + 1, 6).setValue(skor);
      sheet.getRange(r + 1, 7).setValue(catatan);
      sheet.getRange(r + 1, 8).setValue(kriteriaScores);
      sheet.getRange(r + 1, 9).setValue(isFinal);
      sheet.getRange(r + 1, 10).setValue(ts);
      return { status: 'success', message: 'Nilai juri berhasil diperbarui' };
    }
  }

  var newScoreId = data.id_score || ('score-' + new Date().getTime());
  sheet.appendRow([newScoreId, idJury, juryName, idTeam, idKategori, skor, catatan, kriteriaScores, isFinal, ts]);
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

  var rows = sheet.getDataRange().getValues();
  var userVotesInCat = 0;
  for (var r = 1; r < rows.length; r++) {
    if (String(rows[r][1]) === idVoter && String(rows[r][4]) === idKategori) {
      if (String(rows[r][3]) === idTeam) {
        return { status: 'error', message: 'Anda sudah memberikan suara untuk regu ini!' };
      }
      userVotesInCat++;
    }
  }

  var maxQuota = data.votes_required ? parseInt(data.votes_required, 10) : 1;
  if (userVotesInCat >= maxQuota) {
    return { status: 'error', message: 'Hak suara Anda (' + maxQuota + ' suara) untuk kategori ini sudah terpenuhi.' };
  }

  sheet.appendRow(['vote-' + new Date().getTime(), idVoter, voterName, idTeam, idKategori, ts]);
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
  var idKategori = String(data.id_kategori || ('cat-' + new Date().getTime()));
  var rows = sheet.getDataRange().getValues();

  if (op === 'delete') {
    for (var r = 1; r < rows.length; r++) {
      if (String(rows[r][0]) === idKategori) {
        sheet.deleteRow(r + 1);
        return { status: 'success', message: 'Cabang lomba berhasil dihapus' };
      }
    }
    return { status: 'error', message: 'Cabang lomba tidak ditemukan' };
  }

  var kriteriaStr = Array.isArray(data.kriteria) ? JSON.stringify(data.kriteria) : String(data.kriteria || '[]');
  var assessType = data.assessment_type || 'all';
  var tipePeserta = data.tipe_peserta || 'Group';
  var votesReq = parseInt(data.votes_required || 1, 10);
  var desc = data.deskripsi || '';

  if (op === 'update') {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === idKategori) {
        sheet.getRange(i + 1, 3).setValue(data.nama_kategori);
        sheet.getRange(i + 1, 4).setValue(data.tipe || 'Lomba');
        sheet.getRange(i + 1, 5).setValue(assessType);
        sheet.getRange(i + 1, 6).setValue(tipePeserta);
        sheet.getRange(i + 1, 7).setValue(votesReq);
        sheet.getRange(i + 1, 8).setValue(kriteriaStr);
        sheet.getRange(i + 1, 9).setValue(desc);
        return { status: 'success', message: 'Cabang lomba berhasil diperbarui' };
      }
    }
  }

  sheet.appendRow([
    idKategori,
    data.id_event || 'duta-camp-2026',
    data.nama_kategori,
    data.tipe || 'Lomba',
    assessType,
    tipePeserta,
    votesReq,
    kriteriaStr,
    desc
  ]);
  return { status: 'success', message: 'Cabang lomba berhasil ditambahkan' };
}

function handleManageTeam(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.TEAMS);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEETS.TEAMS);
  }

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

  if (op === 'update') {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === idTeam) {
        sheet.getRange(i + 1, 3).setValue(data.nama_regu);
        sheet.getRange(i + 1, 4).setValue(data.kelas_pangkalan);
        sheet.getRange(i + 1, 5).setValue(data.kategori_regu || 'Putra');
        sheet.getRange(i + 1, 6).setValue(data.foto_url || '');
        sheet.getRange(i + 1, 7).setValue(anggotaStr);
        return { status: 'success', message: 'Data peserta berhasil diperbarui' };
      }
    }
  }

  sheet.appendRow([
    idTeam,
    data.id_event || 'duta-camp-2026',
    data.nama_regu,
    data.kelas_pangkalan,
    data.kategori_regu || 'Putra',
    data.foto_url || '',
    anggotaStr
  ]);
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

  if (op === 'delete') {
    for (var r = 1; r < rows.length; r++) {
      if (String(rows[r][0]) === String(data.id)) {
        sheet.deleteRow(r + 1);
        return { status: 'success', message: 'Akun juri berhasil dihapus' };
      }
    }
    return { status: 'error', message: 'Akun juri tidak ditemukan' };
  }

  if (op === 'update') {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(data.id)) {
        sheet.getRange(i + 1, 2).setValue(String(data.username).trim().toLowerCase());
        if (data.password) sheet.getRange(i + 1, 3).setValue(data.password);
        sheet.getRange(i + 1, 4).setValue(data.nama);
        sheet.getRange(i + 1, 7).setValue(data.jurySpecialty || '');
        return { status: 'success', message: 'Data juri berhasil diperbarui' };
      }
    }
  }

  var newId = 'jury-' + new Date().getTime();
  sheet.appendRow([
    newId,
    String(data.username).trim().toLowerCase(),
    data.password,
    data.nama,
    'juri',
    '',
    data.jurySpecialty || '',
    new Date().toISOString()
  ]);
  return { status: 'success', message: 'Akun juri berhasil dibuat' };
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

  if (op === 'update') {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === idEvent) {
        sheet.getRange(i + 1, 2).setValue(data.kode_event || '');
        sheet.getRange(i + 1, 3).setValue(data.nama_event || '');
        sheet.getRange(i + 1, 4).setValue(data.tahun || '2026');
        sheet.getRange(i + 1, 5).setValue(data.status_aktif !== undefined ? data.status_aktif : true);
        sheet.getRange(i + 1, 6).setValue(data.batas_waktu || '');
        sheet.getRange(i + 1, 7).setValue(data.deskripsi || '');
        return { status: 'success', message: 'Event berhasil diperbarui' };
      }
    }
  }

  sheet.appendRow([
    idEvent,
    data.kode_event || '',
    data.nama_event,
    data.tahun || '2026',
    data.status_aktif !== undefined ? data.status_aktif : true,
    data.batas_waktu || '',
    data.deskripsi || ''
  ]);
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
`;

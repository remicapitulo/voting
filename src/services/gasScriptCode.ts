export const GAS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (GAS) - DATABASE ENGINE E-VOTING & SCORING SYSTEM
 * SMPIT PONDOK DUTA - DATABASE RESMI (CLOUD SPREADSHEET)
 * =========================================================================
 * File ini bertindak sebagai Database Backend Utama yang melayani:
 * - Autentikasi Pengguna & Hak Akses (Admin, Dewan Juri, Pemilih Bebas)
 * - Penyimpanan Sub-Event, Cabang Lomba, Peserta/Regu
 * - Penyimpanan Link Siaran Langsung (TikTok, YouTube, Instagram) di Tab Categories
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
    headers: [
      'id_kategori',
      'id_event',
      'nama_kategori',
      'tipe',
      'assessment_type',
      'tipe_peserta',
      'votes_required',
      'kriteria',
      'deskripsi',
      'assigned_juries',
      'live_tiktok',
      'live_youtube',
      'live_instagram',
      'voting_start',
      'voting_end'
    ]
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
      var existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
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

  return { status: 'success', message: 'Database Google Sheets berhasil disiapkan dan diperbarui!' };
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
    } else if (action === 'getDriveLogos' || action === 'syncDriveLogos') {
      response = { status: 'success', logos: syncAndGetDriveLogos() };
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
      case 'getDriveLogos':
      case 'syncDriveLogos':
        response = { status: 'success', logos: syncAndGetDriveLogos(body.folderId) };
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
      case 'removePublicVote':
      case 'cancelPublicVote':
        response = handleRemovePublicVote(body);
        break;
      case 'updateCategoryCriteria':
        response = handleUpdateCategoryCriteria(body);
        break;
      case 'updateCategoryLiveLinks':
        response = handleUpdateCategoryLiveLinks(body);
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

  var catSheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (catSheet) {
    ensureHeaderExists(catSheet, 'assigned_juries');
    ensureHeaderExists(catSheet, 'live_tiktok');
    ensureHeaderExists(catSheet, 'live_youtube');
    ensureHeaderExists(catSheet, 'live_instagram');
    ensureHeaderExists(catSheet, 'voting_start');
    ensureHeaderExists(catSheet, 'voting_end');
  }

  var configMap = getConfigsMap(ss.getSheetByName(SHEETS.CONFIG || 'Config'));

  try {
    var driveFiles = getLogosFromDriveFolder(DRIVE_FOLDER_ID);
    if (driveFiles && driveFiles.length > 0) {
      var existingUploaded = configMap.uploaded_logos || [];
      if (!Array.isArray(existingUploaded)) existingUploaded = [];
      var mergedMap = {};
      for (var d = 0; d < driveFiles.length; d++) {
        var df = driveFiles[d];
        mergedMap[df.driveFileId] = df;
      }
      for (var ex = 0; ex < existingUploaded.length; ex++) {
        var itm = existingUploaded[ex];
        if (itm && (itm.driveFileId || itm.id)) {
          var k = itm.driveFileId || itm.id;
          if (mergedMap[k]) {
            mergedMap[k] = Object.assign({}, mergedMap[k], itm);
          } else if (itm.url) {
            mergedMap[k] = itm;
          }
        }
      }
      var mergedList = [];
      for (var mk in mergedMap) {
        mergedList.push(mergedMap[mk]);
      }
      configMap.uploaded_logos = mergedList;
      saveUploadedLogoListToConfig(mergedList);
    }
  } catch (driveErr) {
    Logger.log('Drive folder scanning skipped in getAllDatabaseData: ' + driveErr);
  }

  return {
    users: getSheetDataAsObjects(ss.getSheetByName(SHEETS.USERS)),
    events: getSheetDataAsObjects(ss.getSheetByName(SHEETS.EVENTS)),
    categories: getSheetDataAsObjects(catSheet),
    teams: getSheetDataAsObjects(teamSheet),
    jury_scores: getSheetDataAsObjects(ss.getSheetByName(SHEETS.JURY_SCORES)),
    public_votes: getSheetDataAsObjects(ss.getSheetByName(SHEETS.PUBLIC_VOTES)),
    config: configMap
  };
}

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
      if (String(headers[i]).trim().toLowerCase() === String(headerName).trim().toLowerCase()) return;
    }
    sheet.getRange(1, lastCol + 1).setValue(headerName)
      .setFontWeight('bold')
      .setBackground('#064e3b')
      .setFontColor('#ffffff');
  } catch (e) {
    Logger.log('ensureHeaderExists error: ' + e);
  }
}

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

  var idVote = String(data.id_vote || ('vote-' + new Date().getTime())).trim();
  var idVoter = String(data.id_voter || '').trim();
  var voterName = String(data.voter_name || '').trim();
  var idTeam = String(data.id_team || '').trim();
  var idKategori = String(data.id_kategori || '').trim();
  var ts = String(data.timestamp || new Date().toISOString());

  if (!idVoter || !idTeam || !idKategori) {
    return { status: 'error', message: 'Data vote tidak lengkap (voter, regu, atau kategori kosong).' };
  }

  if (!voterName && idVoter) {
    try {
      var userSheet = ss.getSheetByName(SHEETS.USERS);
      if (userSheet) {
        var uRows = userSheet.getDataRange().getValues();
        for (var u = 1; u < uRows.length; u++) {
          if (String(uRows[u][0]).trim() === idVoter || String(uRows[u][1]).trim().toLowerCase() === idVoter.toLowerCase()) {
            voterName = String(uRows[u][3] || uRows[u][1] || '').trim();
            break;
          }
        }
      }
    } catch (uErr) {
      Logger.log('Lookup user name error: ' + uErr);
    }
  }

  var votes = getSheetDataAsObjects(sheet);
  var userVotesInCat = 0;
  for (var r = 0; r < votes.length; r++) {
    var vVoter = String(votes[r].id_voter || '').trim();
    var vCat = String(votes[r].id_kategori || '').trim();
    var vTeam = String(votes[r].id_team || '').trim();

    if (vVoter === idVoter && vCat === idKategori) {
      if (vTeam === idTeam) {
        return { status: 'error', message: 'Anda sudah memberikan suara untuk regu ini!' };
      }
      userVotesInCat++;
    }
  }

  var maxQuota = data.votes_required ? parseInt(data.votes_required, 10) : 0;
  if (!maxQuota || maxQuota < 1) {
    try {
      var catSheet = ss.getSheetByName(SHEETS.CATEGORIES);
      if (catSheet) {
        var cRows = catSheet.getDataRange().getValues();
        for (var c = 1; c < cRows.length; c++) {
          if (String(cRows[c][0]).trim().toLowerCase() === idKategori.toLowerCase()) {
            maxQuota = parseInt(cRows[c][6] || 1, 10);
            break;
          }
        }
      }
    } catch (cErr) {
      Logger.log('Lookup category quota error: ' + cErr);
    }
  }
  if (!maxQuota || maxQuota < 1) maxQuota = 1;

  if (userVotesInCat >= maxQuota) {
    return { status: 'error', message: 'Hak suara Anda (' + maxQuota + ' suara) untuk kategori ini sudah terpenuhi.' };
  }

  appendRowByHeaders(sheet, {
    id_vote: idVote,
    id_voter: idVoter,
    voter_name: voterName,
    id_team: idTeam,
    id_kategori: idKategori,
    timestamp: ts
  });

  return { status: 'success', message: 'Vote berhasil disimpan ke database Google Sheets!', id_vote: idVote };
}

function handleRemovePublicVote(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.PUBLIC_VOTES);
  if (!sheet) return { status: 'error', message: 'Sheet Public_Votes belum tersedia' };

  var idVote = String(data.id_vote || '').trim();
  var idVoter = String(data.id_voter || '').trim();
  var idTeam = String(data.id_team || '').trim();
  var idKategori = String(data.id_kategori || '').trim();

  var rows = sheet.getDataRange().getValues();
  for (var r = rows.length - 1; r >= 1; r--) {
    var rowVoteId = String(rows[r][0] || '').trim();
    var rowVoter = String(rows[r][1] || '').trim();
    var rowTeam = String(rows[r][3] || '').trim();
    var rowCat = String(rows[r][4] || '').trim();

    var matchVoteId = idVote && (rowVoteId === idVote);
    var matchComposite = idVoter && idTeam && idKategori && (rowVoter === idVoter && rowTeam === idTeam && rowCat === idKategori);

    if (matchVoteId || matchComposite) {
      sheet.deleteRow(r + 1);
      return { status: 'success', message: 'Suara berhasil dibatalkan dari database Google Sheets.' };
    }
  }
  return { status: 'error', message: 'Data suara tidak ditemukan di database Google Sheets.' };
}

/**
 * Pengelolaan Cabang Lomba (Categories) Termasuk Link Siaran Langsung (Live Streaming)
 */
function handleManageCategory(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  }

  ensureHeaderExists(sheet, 'assigned_juries');
  ensureHeaderExists(sheet, 'live_tiktok');
  ensureHeaderExists(sheet, 'live_youtube');
  ensureHeaderExists(sheet, 'live_instagram');
  ensureHeaderExists(sheet, 'voting_start');
  ensureHeaderExists(sheet, 'voting_end');

  var op = data.operation || 'create';
  var idKategori = String(data.id_kategori || ('cat-' + new Date().getTime())).trim();
  var namaKategori = String(data.nama_kategori || '').trim();
  var idEvent = String(data.id_event || '').trim();
  var rows = sheet.getDataRange().getValues();

  if (op === 'delete' || op === 'purge') {
    var targetId = idKategori.toLowerCase();
    var targetName = namaKategori.toLowerCase();
    var deletedCount = 0;

    for (var r = rows.length - 1; r >= 1; r--) {
      var rowId = String(rows[r][0] || '').trim().toLowerCase();
      var rowName = String(rows[r][2] || '').trim().toLowerCase();
      var matchName = targetName && (rowName === targetName);
      var matchId = targetId && (rowId === targetId);

      if (matchName || (matchId && (!targetName || rowName === targetName))) {
        sheet.deleteRow(r + 1);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
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

      return { status: 'success', message: 'Cabang lomba (' + (namaKategori || idKategori) + ') berhasil dihapus permanen dari Google Sheets.' };
    }
    return { status: 'error', message: 'Cabang lomba tidak ditemukan di sheet Categories Google Sheets.' };
  }

  var kriteriaStr = Array.isArray(data.kriteria) ? JSON.stringify(data.kriteria) : String(data.kriteria || '[]');
  var assignedJuriesStr = Array.isArray(data.assigned_juries)
    ? JSON.stringify(data.assigned_juries)
    : String(data.assigned_juries || '[]');

  var liveTiktok = String(data.live_tiktok || '').trim();
  var liveYoutube = String(data.live_youtube || '').trim();
  var liveInstagram = String(data.live_instagram || '').trim();
  var votingStart = String(data.voting_start || '').trim();
  var votingEnd = String(data.voting_end || '').trim();

  var catObj = {
    id_kategori: idKategori,
    id_event: data.id_event || 'duta-camp-2026',
    nama_kategori: data.nama_kategori || '',
    tipe: data.tipe || 'Lomba',
    assessment_type: data.assessment_type || 'all',
    tipe_peserta: data.tipe_peserta || 'Group',
    votes_required: parseInt(data.votes_required || 1, 10),
    kriteria: kriteriaStr,
    deskripsi: data.deskripsi || '',
    assigned_juries: assignedJuriesStr,
    live_tiktok: liveTiktok,
    live_youtube: liveYoutube,
    live_instagram: liveInstagram,
    voting_start: votingStart,
    voting_end: votingEnd
  };

  if (op === 'update') {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim().toLowerCase() === idKategori.toLowerCase()) {
        updateRowByHeaders(sheet, i + 1, catObj);
        return { status: 'success', message: 'Cabang lomba & link siaran langsung berhasil diperbarui di Google Sheets (Categories)!' };
      }
    }
    if (namaKategori) {
      for (var j = 1; j < rows.length; j++) {
        var rEvent = String(rows[j][1] || '').trim().toLowerCase();
        var rName = String(rows[j][2] || '').trim().toLowerCase();
        if (rName === namaKategori.toLowerCase() && (!idEvent || rEvent === idEvent.toLowerCase())) {
          updateRowByHeaders(sheet, j + 1, catObj);
          return { status: 'success', message: 'Cabang lomba & link siaran langsung berhasil diperbarui di Google Sheets (Categories)!' };
        }
      }
    }
    return { status: 'error', message: 'Cabang lomba tidak ditemukan untuk diperbarui' };
  }

  for (var k = 1; k < rows.length; k++) {
    var exId = String(rows[k][0] || '').trim().toLowerCase();
    var exEvent = String(rows[k][1] || '').trim().toLowerCase();
    var exName = String(rows[k][2] || '').trim().toLowerCase();

    if ((exId === idKategori.toLowerCase()) || 
        (namaKategori && exName === namaKategori.toLowerCase() && (!idEvent || exEvent === idEvent.toLowerCase()))) {
      updateRowByHeaders(sheet, k + 1, catObj);
      return { status: 'success', message: 'Cabang lomba sudah ada, data disinkronkan ke Google Sheets.' };
    }
  }

  appendRowByHeaders(sheet, catObj);
  return { status: 'success', message: 'Cabang lomba berhasil ditambahkan ke Google Sheets' };
}

/**
 * Penyimpanan Cepat Link Siaran Langsung (TikTok, YouTube, Instagram) ke Sheet Categories
 */
function handleUpdateCategoryLiveLinks(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  }

  ensureHeaderExists(sheet, 'live_tiktok');
  ensureHeaderExists(sheet, 'live_youtube');
  ensureHeaderExists(sheet, 'live_instagram');

  var idKategori = String(data.id_kategori || '').trim();
  var namaKategori = String(data.nama_kategori || '').trim();
  var liveTiktok = String(data.live_tiktok || '').trim();
  var liveYoutube = String(data.live_youtube || '').trim();
  var liveInstagram = String(data.live_instagram || '').trim();

  if (!idKategori && !namaKategori) {
    return { status: 'error', message: 'ID atau Nama Cabang Lomba tidak disertakan' };
  }

  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return { status: 'error', message: 'Data kategori di spreadsheet masih kosong' };
  }

  var headers = rows[0];
  var tiktokCol = headers.indexOf('live_tiktok');
  var youtubeCol = headers.indexOf('live_youtube');
  var instagramCol = headers.indexOf('live_instagram');

  if (tiktokCol === -1) tiktokCol = 10;
  if (youtubeCol === -1) youtubeCol = 11;
  if (instagramCol === -1) instagramCol = 12;

  var found = false;
  for (var r = 1; r < rows.length; r++) {
    var rowId = String(rows[r][0] || '').trim().toLowerCase();
    var rowName = String(rows[r][2] || '').trim().toLowerCase();

    if ((idKategori && rowId === idKategori.toLowerCase()) || (namaKategori && rowName === namaKategori.toLowerCase())) {
      sheet.getRange(r + 1, tiktokCol + 1).setValue(liveTiktok);
      sheet.getRange(r + 1, youtubeCol + 1).setValue(liveYoutube);
      sheet.getRange(r + 1, instagramCol + 1).setValue(liveInstagram);
      found = true;
      break;
    }
  }

  if (!found) {
    return { status: 'error', message: 'Cabang lomba tidak ditemukan di sheet Categories' };
  }

  return {
    status: 'success',
    message: 'Link live streaming berhasil disimpan ke sheet Categories Google Sheets!',
    id_kategori: idKategori,
    live_tiktok: liveTiktok,
    live_youtube: liveYoutube,
    live_instagram: liveInstagram
  };
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

    for (var r = rows.length - 1; r >= 1; r--) {
      var rowId = norm(rows[r][0]);
      var rowUsername = norm(rows[r][1]);
      var rowName = norm(rows[r][3]);

      var idMatch = targetId && (
        rowId === targetId ||
        rowId.replace(/^(user|jury)-/, '') === targetId.replace(/^(user|jury)-/, '')
      );
      var userMatch = targetUser && (
        rowUsername === targetUser ||
        rowUsername === targetId.replace(/^(user|jury)-/, '') ||
        rowId.replace(/^(user|jury)-/, '') === targetUser
      );
      var crossMatch = (targetId && (rowUsername === targetId || rowUsername === targetId.replace(/^(user|jury)-/, ''))) ||
                       (targetUser && (rowId === targetUser || rowId.replace(/^(user|jury)-/, '') === targetUser));
      var nameMatch = targetName && (rowName === targetName);

      if (idMatch || userMatch || crossMatch || nameMatch) {
        if (rowUsername) deletedUsernames.push(rowUsername);
        if (rowId) deletedIds.push(rowId);
        sheet.deleteRow(r + 1);
        deleted = true;
      }
    }

    if (deleted) {
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
    return { status: 'error', message: 'Akun juri tidak ditemukan di Google Sheets' };
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
  var isCatSheet = (sheet.getName() === (SHEETS.CATEGORIES || 'Categories'));

  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var hName = String(headers[c]).trim();
      if (hName) {
        obj[hName] = row[c];
      }
    }
    // Jika sheet Categories memiliki data di kolom K (indeks 10), L (indeks 11), M (indeks 12)
    // namun kolom header di row 1 belum bernama:
    if (isCatSheet) {
      if (obj.live_tiktok === undefined && row.length > 10) obj.live_tiktok = row[10];
      if (obj.live_youtube === undefined && row.length > 11) obj.live_youtube = row[11];
      if (obj.live_instagram === undefined && row.length > 12) obj.live_instagram = row[12];
    }
    results.push(obj);
  }
  return results;
}

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

function authorizeDriveApp() {
  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var testFile = folder.createFile('auth_test.txt', 'Otorisasi Google Drive Berhasil');
    testFile.setTrashed(true);
    Logger.log('Otorisasi Google Drive Berhasil Penuh! Hak tulis aktif di folder: ' + folder.getName());
    return 'Otorisasi Berhasil Penuh: ' + folder.getName();
  } catch (e) {
    Logger.log('Error otorisasi Drive: ' + e);
    throw e;
  }
}

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
      return {
        status: 'error',
        message: 'Folder Google Drive (ID: ' + targetFolderId + ') tidak dapat diakses: ' + err1.toString()
      };
    }

    if (!folder) {
      return {
        status: 'error',
        message: 'Folder Google Drive (ID: ' + targetFolderId + ') tidak ditemukan.'
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
    var ext = '.png';
    if (mimeType.indexOf('jpeg') > -1 || mimeType.indexOf('jpg') > -1) {
      ext = '.jpg';
    } else if (mimeType.indexOf('svg') > -1) {
      ext = '.svg';
    } else if (mimeType.indexOf('webp') > -1) {
      ext = '.webp';
    }

    var fileName = '';
    if (logoTitle) {
      var safeTitle = logoTitle.replace(/[\\\\/:*?\"<>|]/g, ' ').trim();
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
    } catch (shareErr) {}

    var fileId = file.getId();
    var directViewUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
    var downloadUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;

    var logoEntry = {
      id: 'logo_' + fileId,
      name: logoTitle || fileName.replace(/\\.[^/.]+$/, ""),
      url: directViewUrl,
      driveFileId: fileId,
      fileName: file.getName(),
      folderId: folder.getId(),
      folderName: folder.getName(),
      type: data.type || 'olahraga',
      created_at: new Date().toISOString()
    };

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
      message: 'Logo \"' + logoEntry.name + '\" berhasil diunggah ke Google Drive!'
    };
  } catch (err) {
    return { status: 'error', message: 'Gagal mengunggah logo ke Google Drive: ' + err.toString() };
  }
}

function getLogosFromDriveFolder(folderId) {
  var targetId = String(folderId || DRIVE_FOLDER_ID).trim();
  if (!targetId) targetId = DRIVE_FOLDER_ID;
  var logos = [];
  try {
    var folder = DriveApp.getFolderById(targetId);
    if (!folder) return logos;
    var files = folder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      var name = file.getName();
      if (name === 'auth_test.txt') continue;
      var mime = String(file.getMimeType() || '').toLowerCase();
      if (mime.indexOf('image/') === 0 || /\\.(png|jpe?g|svg|webp|gif|bmp)$/i.test(name)) {
        var fileId = file.getId();
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (shareErr) {}
        var cleanTitle = name.replace(/\\.[^/.]+$/, "");
        logos.push({
          id: 'logo_' + fileId,
          name: cleanTitle,
          url: 'https://lh3.googleusercontent.com/d/' + fileId,
          driveFileId: fileId,
          fileName: name,
          folderId: folder.getId(),
          folderName: folder.getName(),
          type: 'olahraga',
          created_at: file.getDateCreated() ? file.getDateCreated().toISOString() : new Date().toISOString()
        });
      }
    }
  } catch (err) {
    Logger.log('getLogosFromDriveFolder error: ' + err);
  }
  return logos;
}

function syncAndGetDriveLogos(folderId) {
  var driveLogos = getLogosFromDriveFolder(folderId);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.CONFIG || 'Config');
  var existingList = [];
  if (sheet) {
    var rows = sheet.getDataRange().getValues();
    for (var r = 1; r < rows.length; r++) {
      if (String(rows[r][0]).trim() === 'uploaded_logos') {
        try {
          existingList = JSON.parse(rows[r][1]);
          if (!Array.isArray(existingList)) existingList = [];
        } catch (e) {
          existingList = [];
        }
        break;
      }
    }
  }

  var mergedMap = {};
  for (var d = 0; d < driveLogos.length; d++) {
    var dl = driveLogos[d];
    mergedMap[dl.driveFileId] = dl;
  }
  for (var ex = 0; ex < existingList.length; ex++) {
    var itm = existingList[ex];
    if (itm && (itm.driveFileId || itm.id)) {
      var k = itm.driveFileId || itm.id;
      if (mergedMap[k]) {
        mergedMap[k] = Object.assign({}, mergedMap[k], itm);
      } else if (itm.url) {
        mergedMap[k] = itm;
      }
    }
  }

  var finalList = [];
  for (var mk in mergedMap) {
    finalList.push(mergedMap[mk]);
  }

  if (finalList.length > 0) {
    saveUploadedLogoListToConfig(finalList);
  }

  return finalList;
}

function saveUploadedLogoListToConfig(list) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.CONFIG || 'Config');
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.CONFIG || 'Config');
      sheet.appendRow(['key', 'value', 'updated_at']);
      sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#064e3b').setFontColor('#ffffff');
    }
    var rows = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var r = 1; r < rows.length; r++) {
      if (String(rows[r][0]).trim() === 'uploaded_logos') {
        rowIndex = r + 1;
        break;
      }
    }
    var valStr = JSON.stringify(list);
    var ts = new Date().toISOString();
    if (rowIndex > -1) {
      sheet.getRange(rowIndex, 2).setValue(valStr);
      sheet.getRange(rowIndex, 3).setValue(ts);
    } else {
      sheet.appendRow(['uploaded_logos', valStr, ts]);
    }
  } catch (err) {
    Logger.log('Gagal menyimpan uploaded_logos: ' + err);
  }
}

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
`;

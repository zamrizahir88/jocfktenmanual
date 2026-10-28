/*
 * JOC FKTEN mock - sample data and a tiny in-browser "database".
 * Table and column names follow docs/erd/schema.py so the real Apps Script
 * version can reuse the same shapes. Everything here is SAMPLE DATA.
 */
(function () {
  const STORE_KEY = 'joc_fkten_mock_v1';
  const TODAY = '2026-10-28';

  const lookups = {
    APP_STATUS: [
      ['DRAFT', 'Draf'], ['SUBMITTED', 'Dihantar'], ['AMEND_REQUIRED', 'Perlu Pindaan'],
      ['RESUBMITTED', 'Dihantar Semula'], ['APPROVED', 'Lulus'], ['REJECTED', 'Ditolak'], ['WITHDRAWN', 'Ditarik Balik'],
    ],
    DECISION: [['AMEND', 'Pindaan'], ['APPROVE', 'Lulus'], ['REJECT', 'Tolak']],
    ACTION: [
      ['CREATE', 'Draf dicipta'], ['SUBMIT', 'Dihantar'], ['REQUEST_AMEND', 'Pindaan diminta'], ['RESUBMIT', 'Dihantar semula'],
      ['APPROVE', 'Diluluskan'], ['REJECT', 'Ditolak'], ['WITHDRAW', 'Ditarik balik'], ['LETTER_ISSUED', 'Surat kelulusan dijana'],
    ],
    OFFER_TYPE: [['PROJEK', 'Projek'], ['SAMBILAN', 'Sambilan'], ['ACARA', 'Acara']],
    PERIOD_TYPE: [['SEMESTER', 'Semester Akademik'], ['CUTI', 'Cuti Semester']],
    JOB_CATEGORY: [
      ['KEUSAHAWANAN', 'Keusahawanan'], ['PENTADBIRAN_OPERASI', 'Pentadbiran & Operasi'], ['PERKHIDMATAN', 'Perkhidmatan'],
      ['PROJECT_BASED', 'Project Based / Profesional'], ['TEKNIKAL', 'Teknikal'],
    ],
    RECRUIT_MODE: [['NAMED', 'Pelajar telah dikenal pasti'], ['OPEN_ADVERT', 'Melalui iklan terbuka JOC']],
    ATTACHMENT_TYPE: [
      ['KERTAS_KERJA', 'Kertas kerja diluluskan'], ['EMEL_KELULUSAN', 'Emel kelulusan'],
      ['SURAT_KELULUSAN', 'Surat kelulusan / lantikan'], ['LAIN', 'Lain-lain'],
    ],
  };

  const roles = [
    { role_code: 'APPLICANT', role_name: 'Pemohon', description: 'Mohon, pinda dan lihat sejarah permohonan sendiri.' },
    { role_code: 'REVIEWER', role_name: 'Penyemak', description: 'Semak permohonan dan buat keputusan.' },
    { role_code: 'ADMIN', role_name: 'Pentadbir Sistem', description: 'Urus pengguna, peranan, senarai dan tetapan.' },
    { role_code: 'VIEWER', role_name: 'Pemerhati', description: 'Lihat laporan sahaja.' },
  ];

  function ts(date, time) { return `${date}T${time || '09:00'}:00+08:00`; }

  function seed() {
    const departments = [
      { department_id: 'DEP-JES', code: 'JES', name: 'Jabatan Elektronik Semikonduktor', is_active: true },
      { department_id: 'DEP-JEG', code: 'JEG', name: 'Jabatan Elektronik Gunaan', is_active: true },
      { department_id: 'DEP-PTD', code: 'PTD', name: 'Pentadbiran FKTEN (Pejabat Dekan)', is_active: true },
    ];

    const users = [
      { user_id: 'USR-00001', email: 'nasrun@unimap.edu.my', full_name: 'Prof. Madya Ts. Dr. Mohamed Nasrun Osman', position: 'Timbalan Dekan (Hal Ehwal Pelajar dan Alumni)', department_id: 'DEP-PTD', phone: '012-4592997', staff_no: '', is_active: true },
      { user_id: 'USR-00002', email: 'fkten.digital@unimap.edu.my', full_name: 'Unit Digital FKTEN', position: 'Akaun Sistem', department_id: 'DEP-PTD', phone: '', staff_no: '', is_active: true },
      { user_id: 'USR-00003', email: 'aina.rahman@unimap.edu.my', full_name: 'Dr. Aina binti Rahman', position: 'Pensyarah Kanan', department_id: 'DEP-JES', phone: '013-2223344', staff_no: '', is_active: true },
      { user_id: 'USR-00004', email: 'hafiz.ismail@unimap.edu.my', full_name: 'Ts. Mohd Hafiz bin Ismail', position: 'Pensyarah', department_id: 'DEP-JEG', phone: '017-5556677', staff_no: '', is_active: true },
      { user_id: 'USR-00005', email: 'rohana.yusof@unimap.edu.my', full_name: 'Puan Rohana binti Yusof', position: 'Penolong Pegawai Tadbir', department_id: 'DEP-PTD', phone: '019-8889900', staff_no: '', is_active: true },
      { user_id: 'USR-00006', email: 'dekan.fkten@unimap.edu.my', full_name: 'Prof. Dr. Kamal bin Ahmad', position: 'Dekan', department_id: 'DEP-PTD', phone: '', staff_no: '', is_active: true },
    ];

    const user_roles = [];
    const grant = (u, r) => user_roles.push({ user_role_id: `UR-${String(user_roles.length + 1).padStart(5, '0')}`, user_id: u, role_code: r, is_active: true });
    users.forEach(u => grant(u.user_id, 'APPLICANT'));
    grant('USR-00001', 'REVIEWER'); grant('USR-00001', 'ADMIN');
    grant('USR-00002', 'ADMIN');
    grant('USR-00006', 'VIEWER');

    const base = (o) => Object.assign({
      ref_no: '', version_no: 0, rate_per_hour: 6, organiser: '', description: '',
      proof_approved_by_name: '', proof_approved_by_position: '', proof_approval_date: '',
      declaration_accepted: false, first_submitted_at: '', last_submitted_at: '', decided_at: '', decided_by: '',
      duplicated_from_id: '', is_deleted: false, scopes: [], students: [], attachments: [],
    }, o);

    const applications = [
      base({
        application_id: 'APP-000001', ref_no: 'JOC-FKTEN-2026-0001', applicant_id: 'USR-00003', department_id: 'DEP-JES', status_code: 'APPROVED', version_no: 1,
        programme_name: 'Pembantu Makmal Fabrikasi Semikonduktor Sem 1 2026/2027', organiser: 'Makmal Fabrikasi Semikonduktor, JES',
        description: 'Membantu penyediaan sesi amali, penyelenggaraan asas peralatan dan pengurusan inventori makmal fabrikasi.',
        offer_type_code: 'SAMBILAN', period_type_code: 'SEMESTER', job_title: 'Pembantu Makmal', job_category_code: 'TEKNIKAL',
        num_students: 4, hours_per_student: 120, start_date: '2026-10-05', end_date: '2027-01-15', recruitment_mode: 'NAMED',
        proof_approved_by_name: 'Prof. Dr. Kamal bin Ahmad', proof_approved_by_position: 'Dekan FKTEN', proof_approval_date: '2026-09-18',
        declaration_accepted: true, first_submitted_at: ts('2026-09-22', '10:15'), last_submitted_at: ts('2026-09-22', '10:15'),
        decided_at: ts('2026-09-24', '11:00'), decided_by: 'USR-00001',
        scopes: ['Menyediakan peralatan dan bahan untuk sesi amali', 'Merekod dan mengemas kini inventori makmal', 'Membantu penyelenggaraan asas peralatan', 'Memastikan kebersihan dan keselamatan ruang makmal'],
        students: [
          ['231011234', 'Nur Aisyah binti Ahmad', 'RY46 Kejuruteraan Elektronik'], ['231015678', 'Muhammad Danial bin Roslan', 'RY46 Kejuruteraan Elektronik'],
          ['221019876', 'Tan Wei Ling', 'RY47 Kejuruteraan Mikroelektronik'], ['221014455', 'Siti Khadijah binti Omar', 'RY47 Kejuruteraan Mikroelektronik'],
        ],
        attachments: [{ type: 'KERTAS_KERJA', file_name: 'Kertas Kerja Pembantu Makmal (Lulus).pdf', size: 845221 }],
      }),
      base({
        application_id: 'APP-000002', ref_no: 'JOC-FKTEN-2026-0002', applicant_id: 'USR-00004', department_id: 'DEP-JEG', status_code: 'SUBMITTED', version_no: 1,
        programme_name: 'Krew Teknikal Pertandingan Robotik Antara IPT FKTEN 2026', organiser: 'Kelab Robotik FKTEN',
        description: 'Krew teknikal untuk persediaan gelanggang, pendaftaran peserta dan sokongan teknikal semasa pertandingan.',
        offer_type_code: 'ACARA', period_type_code: 'SEMESTER', job_title: 'Krew Teknikal Acara', job_category_code: 'PERKHIDMATAN',
        num_students: 8, hours_per_student: 24, start_date: '2026-11-20', end_date: '2026-11-22', recruitment_mode: 'OPEN_ADVERT',
        proof_approved_by_name: 'Prof. Dr. Kamal bin Ahmad', proof_approved_by_position: 'Dekan FKTEN', proof_approval_date: '2026-10-15',
        declaration_accepted: true, first_submitted_at: ts('2026-10-21', '15:40'), last_submitted_at: ts('2026-10-21', '15:40'),
        scopes: ['Menyediakan gelanggang dan peralatan pertandingan', 'Mengurus kaunter pendaftaran peserta', 'Membantu juri merekod markah'],
        attachments: [{ type: 'EMEL_KELULUSAN', file_name: 'Emel Kelulusan Dekan - Pertandingan Robotik.pdf', size: 214330 }, { type: 'KERTAS_KERJA', file_name: 'Kertas Kerja Pertandingan Robotik 2026.pdf', size: 1320044 }],
      }),
      base({
        application_id: 'APP-000003', ref_no: 'JOC-FKTEN-2026-0003', applicant_id: 'USR-00005', department_id: 'DEP-PTD', status_code: 'AMEND_REQUIRED', version_no: 1,
        programme_name: 'Pembantu Pentadbiran Pejabat Dekan FKTEN', organiser: 'Pejabat Dekan FKTEN',
        description: 'Membantu urusan pengimbasan dokumen dan pengurusan fail pelajar.',
        offer_type_code: 'SAMBILAN', period_type_code: 'SEMESTER', job_title: 'Pembantu Pentadbiran', job_category_code: 'PENTADBIRAN_OPERASI',
        num_students: 2, hours_per_student: 200, start_date: '2026-11-02', end_date: '2026-12-31', recruitment_mode: 'NAMED',
        proof_approved_by_name: 'Timbalan Pendaftar FKTEN', proof_approved_by_position: '', proof_approval_date: '2026-10-10',
        declaration_accepted: true, first_submitted_at: ts('2026-10-14', '09:20'), last_submitted_at: ts('2026-10-14', '09:20'),
        scopes: ['Mengimbas dan menamakan fail dokumen pelajar', 'Menyusun fail fizikal mengikut sesi'],
        students: [['241010001', 'Ahmad Firdaus bin Zainal', 'RY44 Teknologi Elektronik']],
        attachments: [{ type: 'LAIN', file_name: 'Memo dalaman.jpg', size: 512000 }],
      }),
      base({
        application_id: 'APP-000004', ref_no: 'JOC-FKTEN-2026-0004', applicant_id: 'USR-00003', department_id: 'DEP-JES', status_code: 'RESUBMITTED', version_no: 2,
        programme_name: 'Pembantu Projek Penyelidikan Sensor IoT Pertanian', organiser: 'Kumpulan Penyelidikan Sensor & IoT',
        description: 'Membantu pemasangan nod sensor, pengumpulan data lapangan dan penyediaan laporan data mingguan.',
        offer_type_code: 'PROJEK', period_type_code: 'CUTI', job_title: 'Pembantu Projek', job_category_code: 'PROJECT_BASED',
        num_students: 2, hours_per_student: 160, start_date: '2027-02-01', end_date: '2027-03-12', recruitment_mode: 'NAMED',
        proof_approved_by_name: 'Prof. Dr. Kamal bin Ahmad', proof_approved_by_position: 'Dekan FKTEN', proof_approval_date: '2026-10-01',
        declaration_accepted: true, first_submitted_at: ts('2026-10-08', '11:00'), last_submitted_at: ts('2026-10-26', '16:05'),
        scopes: ['Memasang dan menguji nod sensor di lapangan', 'Mengumpul dan membersihkan data sensor', 'Menyediakan laporan data mingguan'],
        students: [['221013131', 'Lim Jia Hui', 'RY46 Kejuruteraan Elektronik'], ['221017272', 'Hakimi bin Salleh', 'RY46 Kejuruteraan Elektronik']],
        attachments: [{ type: 'KERTAS_KERJA', file_name: 'Kertas Kerja Projek IoT (Lulus).pdf', size: 990120 }, { type: 'SURAT_KELULUSAN', file_name: 'Surat Kelulusan Geran.pdf', size: 301233 }],
      }),
      base({
        application_id: 'APP-000005', ref_no: 'JOC-FKTEN-2026-0005', applicant_id: 'USR-00004', department_id: 'DEP-JEG', status_code: 'REJECTED', version_no: 1,
        programme_name: 'Pembersihan Stor Bahan Kimia Makmal', organiser: 'Makmal Elektronik Gunaan',
        description: 'Membantu pembersihan dan pelupusan bahan kimia lama di stor makmal.',
        offer_type_code: 'PROJEK', period_type_code: 'CUTI', job_title: 'Pembantu Stor', job_category_code: 'TEKNIKAL',
        num_students: 3, hours_per_student: 40, start_date: '2026-09-01', end_date: '2026-09-12', recruitment_mode: 'OPEN_ADVERT',
        proof_approved_by_name: 'Ketua Jabatan JEG', proof_approved_by_position: '', proof_approval_date: '2026-08-15',
        declaration_accepted: true, first_submitted_at: ts('2026-08-20', '14:30'), last_submitted_at: ts('2026-08-20', '14:30'),
        decided_at: ts('2026-08-21', '10:10'), decided_by: 'USR-00001',
        scopes: ['Mengasingkan bahan kimia lama', 'Membersihkan rak stor'],
        attachments: [{ type: 'EMEL_KELULUSAN', file_name: 'Emel KJ JEG.pdf', size: 120400 }],
      }),
      base({
        application_id: 'APP-000006', ref_no: 'JOC-FKTEN-2026-0006', applicant_id: 'USR-00005', department_id: 'DEP-PTD', status_code: 'APPROVED', version_no: 1,
        programme_name: 'Krew Hari Terbuka FKTEN 2026', organiser: 'Pejabat Dekan FKTEN',
        description: 'Krew acara untuk pameran makmal, pengurusan pengunjung dan kaunter maklumat semasa Hari Terbuka.',
        offer_type_code: 'ACARA', period_type_code: 'SEMESTER', job_title: 'Krew Acara', job_category_code: 'PERKHIDMATAN',
        num_students: 10, hours_per_student: 16, start_date: '2026-08-08', end_date: '2026-08-09', recruitment_mode: 'OPEN_ADVERT',
        proof_approved_by_name: 'Prof. Dr. Kamal bin Ahmad', proof_approved_by_position: 'Dekan FKTEN', proof_approval_date: '2026-07-10',
        declaration_accepted: true, first_submitted_at: ts('2026-07-15', '10:00'), last_submitted_at: ts('2026-07-15', '10:00'),
        decided_at: ts('2026-07-16', '09:30'), decided_by: 'USR-00001',
        scopes: ['Mengurus kaunter maklumat dan pendaftaran pengunjung', 'Membantu pameran makmal', 'Mengiring pengunjung ke lokasi pameran'],
        attachments: [{ type: 'KERTAS_KERJA', file_name: 'Kertas Kerja Hari Terbuka 2026.pdf', size: 1543000 }],
      }),
      base({
        application_id: 'APP-000007', ref_no: '', applicant_id: 'USR-00003', department_id: 'DEP-JES', status_code: 'DRAFT', version_no: 0,
        programme_name: 'Tutor Rakan Sebaya Litar Elektrik', organiser: 'JES', offer_type_code: 'SAMBILAN', period_type_code: 'SEMESTER',
        job_title: 'Tutor Rakan Sebaya', job_category_code: 'PROJECT_BASED', num_students: 3, hours_per_student: 60,
        start_date: '2026-11-16', end_date: '2027-01-29', recruitment_mode: 'OPEN_ADVERT', scopes: ['Mengendalikan sesi tutorial kumpulan kecil'],
      }),
    ];
    applications.forEach(a => { a.estimated_cost = a.num_students * a.hours_per_student * a.rate_per_hour; a.created_at = a.first_submitted_at || ts('2026-10-27'); a.updated_at = a.last_submitted_at || ts('2026-10-27'); });

    const reviews = [
      { review_id: 'REV-000001', application_id: 'APP-000001', version_no: 1, reviewer_id: 'USR-00001', decision_code: 'APPROVE', comments: 'Lengkap. Diluluskan.', decided_at: ts('2026-09-24', '11:00') },
      { review_id: 'REV-000002', application_id: 'APP-000003', version_no: 1, reviewer_id: 'USR-00001', decision_code: 'AMEND', comments: 'Sila lampirkan kertas kerja / memo yang telah DITANDATANGANI. Jumlah 200 jam dalam 9 minggu melebihi had 20 jam seminggu semasa semester — sila semak semula jam atau tempoh.', decided_at: ts('2026-10-16', '15:20') },
      { review_id: 'REV-000003', application_id: 'APP-000004', version_no: 1, reviewer_id: 'USR-00001', decision_code: 'AMEND', comments: 'Bilangan pelajar (3) tidak sepadan dengan senarai nama (2). Sila betulkan dan lampirkan surat kelulusan geran.', decided_at: ts('2026-10-20', '10:45') },
      { review_id: 'REV-000004', application_id: 'APP-000005', version_no: 1, reviewer_id: 'USR-00001', decision_code: 'REJECT', comments: 'Pengendalian dan pelupusan bahan kimia ialah kerja berisiko tinggi (3D) dan tidak dibenarkan di bawah JoC.', decided_at: ts('2026-08-21', '10:10') },
      { review_id: 'REV-000005', application_id: 'APP-000006', version_no: 1, reviewer_id: 'USR-00001', decision_code: 'APPROVE', comments: '', decided_at: ts('2026-07-16', '09:30') },
    ];

    const H = (id, app, v, action, from, to, actor, role, at, extra) => Object.assign({ history_id: id, application_id: app, version_no: v, action_code: action, from_status: from, to_status: to, actor_id: actor, actor_role: role, created_at: at, remarks: '' }, extra || {});
    const status_history = [
      H('HIS-000001', 'APP-000001', 1, 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-00003', 'APPLICANT', ts('2026-09-22', '10:15')),
      H('HIS-000002', 'APP-000001', 1, 'APPROVE', 'SUBMITTED', 'APPROVED', 'USR-00001', 'REVIEWER', ts('2026-09-24', '11:00')),
      H('HIS-000003', 'APP-000001', 1, 'LETTER_ISSUED', 'APPROVED', 'APPROVED', 'USR-00001', 'REVIEWER', ts('2026-09-24', '11:00')),
      H('HIS-000004', 'APP-000002', 1, 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-00004', 'APPLICANT', ts('2026-10-21', '15:40')),
      H('HIS-000005', 'APP-000003', 1, 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-00005', 'APPLICANT', ts('2026-10-14', '09:20')),
      H('HIS-000006', 'APP-000003', 1, 'REQUEST_AMEND', 'SUBMITTED', 'AMEND_REQUIRED', 'USR-00001', 'REVIEWER', ts('2026-10-16', '15:20')),
      H('HIS-000007', 'APP-000004', 1, 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-00003', 'APPLICANT', ts('2026-10-08', '11:00'), {
        snapshot: { num_students: 3, hours_per_student: 120, end_date: '2027-02-26', attachments: ['Kertas Kerja Projek IoT (Lulus).pdf'] },
      }),
      H('HIS-000008', 'APP-000004', 1, 'REQUEST_AMEND', 'SUBMITTED', 'AMEND_REQUIRED', 'USR-00001', 'REVIEWER', ts('2026-10-20', '10:45')),
      H('HIS-000009', 'APP-000004', 2, 'RESUBMIT', 'AMEND_REQUIRED', 'RESUBMITTED', 'USR-00003', 'APPLICANT', ts('2026-10-26', '16:05')),
      H('HIS-000010', 'APP-000005', 1, 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-00004', 'APPLICANT', ts('2026-08-20', '14:30')),
      H('HIS-000011', 'APP-000005', 1, 'REJECT', 'SUBMITTED', 'REJECTED', 'USR-00001', 'REVIEWER', ts('2026-08-21', '10:10')),
      H('HIS-000012', 'APP-000006', 1, 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-00005', 'APPLICANT', ts('2026-07-15', '10:00')),
      H('HIS-000013', 'APP-000006', 1, 'APPROVE', 'SUBMITTED', 'APPROVED', 'USR-00001', 'REVIEWER', ts('2026-07-16', '09:30')),
      H('HIS-000014', 'APP-000007', 0, 'CREATE', '', 'DRAFT', 'USR-00003', 'APPLICANT', ts('2026-10-27', '20:10')),
    ];

    const approval_letters = [
      { letter_id: 'LTR-000001', application_id: 'APP-000006', review_id: 'REV-000005', letter_ref_no: 'UniMAP/FKTEN/HEPA/JOC/2026/001', generated_at: ts('2026-07-16', '09:30'), is_void: false },
      { letter_id: 'LTR-000002', application_id: 'APP-000001', review_id: 'REV-000001', letter_ref_no: 'UniMAP/FKTEN/HEPA/JOC/2026/002', generated_at: ts('2026-09-24', '11:00'), is_void: false },
    ];

    const email_log = [];

    const settings = {
      EMAIL_MODE: 'OFF',
      TEST_EMAIL_TO: 'fkten.digital@unimap.edu.my',
      CGEE_EMAIL: 'cgee@unimap.edu.my',
      CGEE_NAME: 'Pusat Kebolehpasaran Graduan & Keusahawanan (CGEE) UniMAP',
      CGEE_ENABLED: 'TIDAK',
      LETTER_REF_PREFIX: 'UniMAP/FKTEN/HEPA/JOC',
      APP_REF_PREFIX: 'JOC-FKTEN',
      DEFAULT_RATE_PER_HOUR: '6.00',
      MAX_HOURS_WEEK_SEMESTER: '20',
      MAX_HOURS_WEEK_BREAK: '40',
      MIN_CGPA: '2.50',
      MAX_UPLOAD_MB: '10',
      SIGNATORY_NAME: 'Prof. Madya Ts. Dr. Mohamed Nasrun Osman',
      SIGNATORY_TITLE: 'Timbalan Dekan (Hal Ehwal Pelajar dan Alumni)',
      GOOGLE_SITE_URL: 'https://sites.google.com/unimap.edu.my/joc-fkten',
    };

    return { departments, users, user_roles, applications, reviews, status_history, approval_letters, email_log, settings, audit_log: [] };
  }

  let mem = null;
  function load() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* private mode */ }
    return seed();
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(mem)); } catch (e) { /* ignore */ } }

  mem = load();

  window.DB = {
    TODAY, lookups, roles,
    get data() { return mem; },
    save,
    reset() { mem = seed(); save(); },
    label(type, code) { const r = (lookups[type] || []).find(x => x[0] === code); return r ? r[1] : (code || '-'); },
    nextId(prefix, list, key, width) {
      const n = list.reduce((m, r) => Math.max(m, parseInt(String(r[key]).split('-').pop(), 10) || 0), 0) + 1;
      return `${prefix}-${String(n).padStart(width || 6, '0')}`;
    },
  };
})();

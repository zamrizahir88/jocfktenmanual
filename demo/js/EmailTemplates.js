/**
 * Email templates (subject + HTML) for every notification the system sends.
 * Pure functions with no Apps Script calls, so mock/preview-email.html can load
 * this same file and show exactly what will be sent.
 *
 * Layout uses tables and inline styles only, because Gmail/Outlook ignore <style>.
 */

/** d: { ref_no, programme_name, organiser, applicant_name, applicant_email, department, job_title,
 *       num_students, hours_per_student, period, start_date, end_date, estimated_cost,
 *       comments, letter_ref, reviewer_name, link }  -> { subject, html } */
function jocEmail_(kind, d) {
  const T = {
    SUBMITTED_TO_REVIEWER: {
      subject: '[JOC FKTEN] Permohonan baharu untuk semakan · ' + d.ref_no,
      chip: ['PERMOHONAN BAHARU', '#1d4ed8', '#e6eeff'],
      title: 'Permohonan JOC baharu menunggu semakan anda',
      intro: d.applicant_name + ' telah menghantar permohonan MySISWA Job on Campus untuk saringan peringkat fakulti.',
      button: 'Semak permohonan',
    },
    RESUBMITTED_TO_REVIEWER: {
      subject: '[JOC FKTEN] Permohonan dihantar semula · ' + d.ref_no,
      chip: ['DIHANTAR SEMULA', '#1d4ed8', '#e6eeff'],
      title: 'Permohonan telah dipinda dan dihantar semula',
      intro: d.applicant_name + ' telah membuat pindaan seperti yang diminta. Medan yang berubah ditanda kuning dalam sistem.',
      button: 'Semak pindaan',
    },
    AMEND_TO_APPLICANT: {
      subject: '[JOC FKTEN] Pindaan diperlukan · ' + d.ref_no,
      chip: ['PERLU PINDAAN', '#b45309', '#fff4d6'],
      title: 'Permohonan JOC anda memerlukan pindaan',
      intro: 'Permohonan anda telah disemak oleh TD HEPA. Sila buat pindaan berdasarkan ulasan di bawah dan hantar semula.',
      note: ['Ulasan TD HEPA', d.comments, '#b45309', '#fff8e6'],
      button: 'Buat pindaan',
    },
    REJECTED_TO_APPLICANT: {
      subject: '[JOC FKTEN] Permohonan tidak diluluskan · ' + d.ref_no,
      chip: ['TIDAK DILULUSKAN', '#b91c1c', '#fde7e7'],
      title: 'Permohonan JOC anda tidak diluluskan',
      intro: 'Permohonan anda telah disemak oleh TD HEPA dan tidak diluluskan di peringkat fakulti.',
      note: ['Ulasan TD HEPA', d.comments, '#b91c1c', '#fdf0f0'],
      button: 'Lihat permohonan',
    },
    APPROVED_TO_APPLICANT: {
      subject: '[JOC FKTEN] Kelulusan fakulti · ' + d.ref_no,
      chip: ['DILULUSKAN', '#15803d', '#dff6e8'],
      title: 'Tahniah! Permohonan JOC anda diluluskan',
      intro: 'Permohonan anda telah diluluskan di peringkat Fakulti Kejuruteraan & Teknologi Elektronik (FKTEN).',
      note: ['Langkah seterusnya', 'Daftar tawaran latihan di portal MySISWA@JoC (joc.mohe.gov.my) menggunakan maklumat yang diluluskan. Muat turun fail CSV dan surat kelulusan daripada sistem.', '#15803d', '#effbf3'],
      button: 'Lihat surat kelulusan',
    },
    APPROVED_TO_CGEE: {
      subject: '[JOC FKTEN] Kelulusan Fakulti · ' + d.ref_no + ' · ' + d.programme_name,
      chip: ['MAKLUMAN KELULUSAN', '#15803d', '#dff6e8'],
      title: 'Makluman kelulusan peringkat fakulti',
      intro: 'Untuk makluman Pusat Kebolehpasaran Graduan & Keusahawanan (CGEE), permohonan MySISWA Job on Campus berikut telah diluluskan di peringkat Fakulti Kejuruteraan & Teknologi Elektronik (FKTEN).',
      note: ['Tindakan seterusnya', 'Pemohon akan mendaftar tawaran latihan ini di portal MySISWA@JoC untuk semakan CGEE.', '#15803d', '#effbf3'],
      button: null, // CGEE does not use this system
    },
  }[kind];
  if (!T) throw new Error('Unknown email template ' + kind);

  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = [
    ['Rujukan', d.ref_no],
    ['Program', d.programme_name],
    ['Penganjur', d.organiser],
    ['Pemohon', d.applicant_name + (d.department ? ' · ' + d.department : '')],
    ['Jawatan', d.job_title],
    ['Pelajar / jam', d.num_students + ' pelajar × ' + d.hours_per_student + ' jam' + (d.period ? ' (' + d.period + ')' : '')],
    ['Tempoh', d.start_date + ' – ' + d.end_date],
    ['Anggaran kos', d.estimated_cost],
  ];
  if (kind.indexOf('APPROVED') === 0 && d.letter_ref) rows.push(['No. surat kelulusan', d.letter_ref]);

  const row = (l, v) => '<tr><td style="padding:7px 0;color:#5b6577;font-size:13px;width:150px;vertical-align:top">' + esc(l) + '</td>' +
    '<td style="padding:7px 0;color:#0f172a;font-size:14px;font-weight:600;vertical-align:top">' + esc(v) + '</td></tr>';

  const html =
    '<div style="background:#eef1f7;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e8f0">' +
    // header: text logomark (images are often blocked in email) + system name
    '<tr><td style="background:#0e2262;padding:18px 22px">' +
      '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
        '<td style="background:#f5c63a;border-radius:10px;width:50px;height:50px;text-align:center;vertical-align:middle">' +
          '<div style="font-weight:800;font-size:16px;color:#0a1230;line-height:16px;letter-spacing:1px">JOC</div>' +
          '<div style="height:2px;width:30px;background:#0a1230;opacity:.55;margin:3px auto 2px"></div>' +
          '<div style="font-weight:800;font-size:8px;color:#ff1a1a;line-height:8px;letter-spacing:2px">FKTEN</div></td>' +
        '<td style="padding-left:14px">' +
          '<div style="color:#ffffff;font-size:17px;font-weight:800">Sistem Permohonan JOC</div>' +
          '<div style="color:#f5c63a;font-size:11px;font-weight:700;letter-spacing:1px;margin-top:2px">FKTEN · UNIVERSITI MALAYSIA PERLIS</div></td>' +
      '</tr></table></td></tr>' +
    // status chip + title + intro
    '<tr><td style="padding:24px 26px 6px">' +
      '<span style="display:inline-block;font-size:11px;font-weight:800;letter-spacing:1px;padding:5px 10px;border-radius:20px;color:' + T.chip[1] + ';background:' + T.chip[2] + '">' + T.chip[0] + '</span>' +
      '<h1 style="margin:14px 0 8px;font-size:21px;line-height:1.3;color:#0f172a">' + esc(T.title) + '</h1>' +
      '<p style="margin:0;font-size:14px;line-height:1.6;color:#334155">' + esc(T.intro) + '</p></td></tr>' +
    // reviewer comment / next steps
    (T.note && T.note[1] ? '<tr><td style="padding:14px 26px 0"><div style="border-left:4px solid ' + T.note[2] + ';background:' + T.note[3] + ';border-radius:8px;padding:12px 14px">' +
      '<div style="font-size:12px;font-weight:800;color:' + T.note[2] + ';letter-spacing:.5px;text-transform:uppercase">' + esc(T.note[0]) + '</div>' +
      '<div style="font-size:14px;line-height:1.55;color:#0f172a;margin-top:4px;white-space:pre-line">' + esc(T.note[1]) + '</div></div></td></tr>' : '') +
    // details
    '<tr><td style="padding:16px 26px 4px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #e3e8f0;border-bottom:1px solid #e3e8f0">' +
      rows.map(r => row(r[0], r[1])).join('') + '</table></td></tr>' +
    // the button that opens this application directly in the system
    (T.button && d.link ? '<tr><td style="padding:20px 26px 6px" align="left">' +
      '<a href="' + esc(d.link) + '" style="display:inline-block;background:#0e2262;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:13px 22px;border-radius:10px">' + esc(T.button) + ' &rarr;</a>' +
      '<div style="font-size:12px;color:#5b6577;margin-top:10px">Butang ini membuka terus permohonan ' + esc(d.ref_no) + ' dalam sistem (log masuk dengan akaun @unimap.edu.my).</div></td></tr>' : '') +
    (kind === 'APPROVED_TO_CGEE' ? '<tr><td style="padding:16px 26px 0;font-size:13px;color:#334155">Surat kelulusan fakulti dilampirkan bersama emel ini.</td></tr>' : '') +
    // footer
    '<tr><td style="padding:22px 26px 24px"><div style="border-top:1px solid #e3e8f0;padding-top:14px;font-size:11px;line-height:1.6;color:#5b6577">' +
      'Emel ini dijana secara automatik oleh Sistem Permohonan JOC, Fakulti Kejuruteraan &amp; Teknologi Elektronik (FKTEN), Universiti Malaysia Perlis. Sila jangan balas emel ini.<br>' +
      'Pertanyaan: TD HEPA FKTEN.</div></td></tr>' +
    '</table></div>';

  return { subject: T.subject, html };
}

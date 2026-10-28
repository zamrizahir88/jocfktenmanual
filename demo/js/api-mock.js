/*
 * Mock backend: implements the same API as apps-script/src/ApiClient.html but
 * against the in-browser sample data (data.js). Lets the UI run without Google.
 */
(function () {
  const SESSION_KEY = 'joc_mock_session';
  // The UI also needs the lookup lists, role names and "today" in its snapshot.
  const D = () => Object.assign(DB.data, { lookups: DB.lookups, roles: DB.roles, today: DB.TODAY });
  const S = (k) => D().settings[k];
  let sessionUser = null;
  try { sessionUser = (JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') || {}).user_id || null; } catch (e) {}

  const nowISO = () => { const d = new Date(); const p = (x) => String(x).padStart(2, '0'); return `${DB.TODAY}T${p(d.getHours())}:${p(d.getMinutes())}:00+08:00`; };
  const getApp = (id) => D().applications.find(a => a.application_id === id);
  const me = () => D().users.find(u => u.user_id === sessionUser);
  const rolesOf = (uid) => D().user_roles.filter(r => r.user_id === uid && r.is_active).map(r => r.role_code);
  const ok = (v) => new Promise(res => setTimeout(() => res(v), 120));
  const fail = (msg) => Promise.reject(new Error(msg));

  // Older stored data may lack attachment ids.
  D().applications.forEach(a => (a.attachments || []).forEach((f, i) => { if (!f.attachment_id) f.attachment_id = `${a.application_id}-F${i + 1}`; }));

  function addHistory(app, action, from, to, role, extra) {
    D().status_history.push(Object.assign({
      history_id: DB.nextId('HIS', D().status_history, 'history_id'), application_id: app.application_id, version_no: app.version_no,
      action_code: action, from_status: from, to_status: to, actor_id: sessionUser, actor_role: role, created_at: nowISO(), remarks: '',
    }, extra || {}));
  }

  function snapshot(a) {
    return {
      programme_name: a.programme_name, organiser: a.organiser, description: a.description, offer_type_code: a.offer_type_code,
      period_type_code: a.period_type_code, job_title: a.job_title, job_category_code: a.job_category_code, num_students: a.num_students,
      hours_per_student: a.hours_per_student, start_date: a.start_date, end_date: a.end_date, recruitment_mode: a.recruitment_mode,
      proof_approved_by_name: a.proof_approved_by_name, proof_approval_date: a.proof_approval_date,
      scopes: a.scopes.slice(), students: a.students.length, attachments: a.attachments.map(f => f.file_name),
    };
  }

  function queueEmail(template, to, cc, subject, appId, hasAtt, blocked) {
    const mode = S('EMAIL_MODE');
    const held = mode === 'OFF' || !!blocked;
    D().email_log.unshift({
      email_id: DB.nextId('EML', D().email_log, 'email_id'), application_id: appId, template_code: template,
      intended_to: to, intended_cc: cc || '', actual_to: held ? '' : mode === 'TEST' ? S('TEST_EMAIL_TO') : to,
      subject, email_mode: mode, send_status: held ? 'LOGGED' : 'SENT', error_message: blocked || '', has_attachment: !!hasAtt, created_at: nowISO(),
    });
  }

  /** Every active Penyemak gets new applications and a copy of every decision. */
  function reviewerEmails() {
    const ids = D().user_roles.filter(r => r.role_code === 'REVIEWER' && r.is_active).map(r => r.user_id);
    return D().users.filter(u => ids.includes(u.user_id) && u.is_active).map(u => u.email).join(', ');
  }

  function audit(entity, id, action, value) {
    D().audit_log.push({ audit_id: DB.nextId('AUD', D().audit_log, 'audit_id'), actor_id: sessionUser, entity_name: entity, entity_id: id, action, new_value_json: JSON.stringify(value || {}), created_at: nowISO() });
  }

  window.API = {
    mode: 'mock',

    // ?open=APP-ID in the address mimics the button in notification emails
    boot() { return ok({ state: D(), userId: sessionUser && me() ? sessionUser : null, open: new URLSearchParams(location.search).get('open') || '' }); },

    login(email, name) {
      if (!email.endsWith('@unimap.edu.my')) return fail('NOT_UNIMAP');
      let user = D().users.find(u => u.email === email);
      if (!user) {
        user = { user_id: DB.nextId('USR', D().users, 'user_id', 5), email, full_name: name.replace(/\s*\(.*\)$/, ''), position: '', department_id: '', phone: '', staff_no: '', is_active: true };
        D().users.push(user);
        D().user_roles.push({ user_role_id: DB.nextId('UR', D().user_roles, 'user_role_id', 5), user_id: user.user_id, role_code: 'APPLICANT', is_active: true });
        DB.save();
      }
      sessionUser = user.user_id;
      try { localStorage.setItem(SESSION_KEY, JSON.stringify({ user_id: sessionUser })); } catch (e) {}
      return ok({ state: D(), userId: sessionUser });
    },

    refresh() { return ok(D()); },

    logout() { sessionUser = null; try { localStorage.removeItem(SESSION_KEY); } catch (e) {} return ok(true); },
    resetDemo() { DB.reset(); return ok(D()); },

    newDraft(fromId) {
      const user = me();
      const src = fromId ? getApp(fromId) : null;
      const a = {
        application_id: DB.nextId('APP', D().applications, 'application_id'), ref_no: '', applicant_id: user.user_id, department_id: user.department_id || '',
        status_code: 'DRAFT', version_no: 0, programme_name: '', organiser: '', description: '', offer_type_code: '', period_type_code: '',
        job_title: '', job_category_code: '', num_students: '', hours_per_student: '', rate_per_hour: Number(S('DEFAULT_RATE_PER_HOUR')), estimated_cost: 0,
        start_date: '', end_date: '', recruitment_mode: 'NAMED', proof_approved_by_name: '', proof_approved_by_position: '', proof_approval_date: '',
        declaration_accepted: false, first_submitted_at: '', last_submitted_at: '', decided_at: '', decided_by: '', duplicated_from_id: fromId || '',
        is_deleted: false, scopes: [], students: [], attachments: [], created_at: nowISO(), updated_at: nowISO(),
      };
      if (src) {
        ['programme_name', 'organiser', 'description', 'offer_type_code', 'period_type_code', 'job_title', 'job_category_code', 'num_students', 'hours_per_student', 'recruitment_mode']
          .forEach(k => { a[k] = src[k]; });
        a.programme_name = src.programme_name + ' (Salinan)';
        a.scopes = src.scopes.slice();
      }
      D().applications.push(a);
      addHistory(a, 'CREATE', '', 'DRAFT', 'APPLICANT', src ? { remarks: `Disalin daripada ${src.ref_no || src.application_id}` } : {});
      DB.save();
      return ok({ state: D(), id: a.application_id });
    },

    // The UI edits the application object in place; this just persists it.
    saveApp(app) { app.updated_at = nowISO(); DB.save(); return ok(true); },

    deleteDraft(id) { const a = getApp(id); a.is_deleted = true; DB.save(); return ok(D()); },

    submit(id) {
      const a = getApp(id);
      const from = a.status_code;
      a.version_no += 1; a.last_submitted_at = nowISO(); a.declaration_at = nowISO();
      if (from === 'DRAFT') {
        const y = DB.TODAY.slice(0, 4);
        const n = D().applications.filter(x => x.ref_no && x.ref_no.includes(`-${y}-`)).length + 1;
        a.ref_no = `${S('APP_REF_PREFIX')}-${y}-${String(n).padStart(4, '0')}`;
        a.first_submitted_at = a.last_submitted_at; a.status_code = 'SUBMITTED';
        a.department_id = me().department_id || a.department_id;
        addHistory(a, 'SUBMIT', from, 'SUBMITTED', 'APPLICANT', { snapshot: snapshot(a) });
      } else {
        a.status_code = 'RESUBMITTED';
        addHistory(a, 'RESUBMIT', from, 'RESUBMITTED', 'APPLICANT', { snapshot: snapshot(a) });
      }
      queueEmail(from === 'DRAFT' ? 'SUBMITTED_TO_REVIEWER' : 'RESUBMITTED_TO_REVIEWER', reviewerEmails(), '',
        `[JOC FKTEN] ${from === 'DRAFT' ? 'Permohonan baharu' : 'Permohonan dihantar semula'} ${a.ref_no}`, a.application_id, false);
      DB.save();
      return ok(D());
    },

    decide(id, decision, comments) {
      const a = getApp(id);
      const from = a.status_code;
      const rev = { review_id: DB.nextId('REV', D().reviews, 'review_id'), application_id: id, version_no: a.version_no, reviewer_id: sessionUser, decision_code: decision, comments, decided_at: nowISO() };
      D().reviews.push(rev);
      const applicant = D().users.find(u => u.user_id === a.applicant_id);
      if (decision === 'AMEND') {
        a.status_code = 'AMEND_REQUIRED';
        addHistory(a, 'REQUEST_AMEND', from, 'AMEND_REQUIRED', 'REVIEWER', { remarks: comments });
        queueEmail('AMEND_TO_APPLICANT', applicant.email, reviewerEmails(), `[JOC FKTEN] Pindaan diperlukan ${a.ref_no}`, id, false);
      } else if (decision === 'REJECT') {
        a.status_code = 'REJECTED'; a.decided_at = rev.decided_at; a.decided_by = sessionUser;
        addHistory(a, 'REJECT', from, 'REJECTED', 'REVIEWER', { remarks: comments });
        queueEmail('REJECTED_TO_APPLICANT', applicant.email, reviewerEmails(), `[JOC FKTEN] Permohonan tidak diluluskan ${a.ref_no}`, id, false);
      } else {
        a.status_code = 'APPROVED'; a.decided_at = rev.decided_at; a.decided_by = sessionUser;
        addHistory(a, 'APPROVE', from, 'APPROVED', 'REVIEWER', { remarks: comments });
        const y = DB.TODAY.slice(0, 4);
        const n = D().approval_letters.filter(l => l.letter_ref_no.includes(`/${y}/`)).length + 1;
        D().approval_letters.push({ letter_id: DB.nextId('LTR', D().approval_letters, 'letter_id'), application_id: id, review_id: rev.review_id, letter_ref_no: `${S('LETTER_REF_PREFIX')}/${y}/${String(n).padStart(3, '0')}`, generated_at: nowISO(), is_void: false });
        addHistory(a, 'LETTER_ISSUED', 'APPROVED', 'APPROVED', 'REVIEWER');
        queueEmail('APPROVED_TO_APPLICANT', applicant.email, reviewerEmails(), `[JOC FKTEN] Kelulusan ${a.ref_no}`, id, true);
        queueEmail('APPROVED_TO_CGEE', S('CGEE_EMAIL'), '', `[JOC FKTEN] Kelulusan Fakulti ${a.ref_no} - ${a.programme_name}`, id, true, S('CGEE_ENABLED') !== 'YA' ? 'CGEE dimatikan dalam Tetapan' : '');
      }
      a.updated_at = nowISO();
      DB.save();
      return ok(D());
    },

    // The UI adds the returned attachment to its copy of the application (same object here).
    upload(appId, file, type) {
      const att = { attachment_id: `${appId}-F${Date.now()}`, type, file_name: file.name, size: file.size };
      setTimeout(() => DB.save(), 200);
      return ok(att);
    },
    removeAttachment(appId, attId) { const a = getApp(appId); a.attachments = a.attachments.filter(f => f.attachment_id !== attId); DB.save(); return ok(true); },
    setAttachmentType(appId, attId, type) { const f = getApp(appId).attachments.find(x => x.attachment_id === attId); if (f) f.type = type; DB.save(); return ok(true); },
    openAttachment() { return ok(null); }, // mock has no real files
    getLetter() { return ok(null); },
    regenerateLetter(id) {
      addHistory(getApp(id), 'LETTER_ISSUED', 'APPROVED', 'APPROVED', 'REVIEWER', { remarks: 'Surat dijana semula' });
      DB.save();
      return ok(D());
    },

    saveProfile(fields) { Object.assign(me(), fields); DB.save(); return ok(D()); },

    setRole(uid, role, on) {
      const row = D().user_roles.find(x => x.user_id === uid && x.role_code === role);
      if (row) row.is_active = on; else D().user_roles.push({ user_role_id: DB.nextId('UR', D().user_roles, 'user_role_id', 5), user_id: uid, role_code: role, is_active: true, assigned_by: sessionUser });
      audit('user_roles', uid, on ? 'CREATE' : 'DEACTIVATE', { role_code: role });
      DB.save(); return ok(D());
    },
    setActive(uid, on) { D().users.find(x => x.user_id === uid).is_active = on; DB.save(); return ok(D()); },
    addUser(email, name, role) {
      if (D().users.some(u => u.email === email)) return fail('Pengguna sudah wujud');
      const u = { user_id: DB.nextId('USR', D().users, 'user_id', 5), email, full_name: name, position: '', department_id: '', phone: '', staff_no: '', is_active: true };
      D().users.push(u);
      ['APPLICANT', role].forEach(r => D().user_roles.push({ user_role_id: DB.nextId('UR', D().user_roles, 'user_role_id', 5), user_id: u.user_id, role_code: r, is_active: true, assigned_by: sessionUser }));
      DB.save(); return ok(D());
    },
    addDepartment(code, name) {
      if (D().departments.some(d => d.code === code)) return fail('Kod jabatan sudah wujud');
      D().departments.push({ department_id: 'DEP-' + code, code, name, is_active: true }); DB.save(); return ok(D());
    },
    saveSettings(values) { Object.assign(D().settings, values); audit('settings', 'ALL', 'UPDATE', values); DB.save(); return ok(D()); },
  };
})();

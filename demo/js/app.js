/*
 * JOC FKTEN - screens and behaviour (vanilla JS, hash routing).
 * Shared by the mock (mock/js/api-mock.js) and the real Apps Script web app
 * (apps-script/src/ApiClient.html). All reads come from STATE, a snapshot the
 * backend returns; every change goes through window.API and returns a promise.
 */
(function () {
  'use strict';

  let STATE = null;
  const D = () => STATE;
  const IS_MOCK = API.mode === 'mock';
  const LOGO = window.LOGO_SRC || 'assets/unimap_logo.png';
  const FACULTY = 'Fakulti Kejuruteraan & Teknologi Elektronik (FKTEN)';
  const HIDE_INFO_KEY = 'joc_hide_info';
  // Built by concatenation: Apps Script drops everything after a double slash inside template strings.
  const JOC_PORTAL = 'https:' + '/' + '/joc.mohe.gov.my';
  const TODAY = () => STATE.today;
  const label = (type, code) => { const r = (STATE.lookups[type] || []).find(x => x[0] === code); return r ? r[1] : (code || '-'); };
  const LK = (type) => STATE.lookups[type] || [];
  const roleName = (code) => (STATE.roles.find(r => r.role_code === code) || {}).role_name || code;

  // ------------------------------------------------------------ utilities
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const BULAN = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  const fmtDate = (s) => { if (!s) return '-'; const d = new Date(s.slice(0, 10) + 'T00:00:00'); return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtDT = (s) => s ? `${fmtDate(s)}, ${s.slice(11, 16)}` : '-';
  const fmtRM = (n) => 'RM ' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtNum = (n) => Number(n || 0).toLocaleString('en-MY');
  const daysBetween = (a, b) => Math.round((new Date(b.slice(0, 10)) - new Date(a.slice(0, 10))) / 86400000);
  const TITLES = /^(prof\.?|madya|ts\.?|dr\.?|ir\.?|puan|encik|cik|datuk|dato'?|unit|bin|binti|a\/l|a\/p)$/i;
  const initials = (name) => name.split(/\s+/).filter(w => w && !TITLES.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const S = (k) => D().settings[k];

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7z"/>',
    chart: '<path d="M3 3v18h18"/><path d="M8 17v-6M13 17V7M18 17v-4"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    ext: '<path d="M14 4h6v6M20 4 10 14M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    save: '<path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v5h8M7 21v-7h10v7"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  };
  const ic = (n, cls) => `<svg class="icon ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const badge = (code) => `<span class="badge st-${code}">${esc(label('APP_STATUS', code))}</span>`;
  const opts = (type, sel, placeholder) => (placeholder ? `<option value="">${placeholder}</option>` : '') + LK(type).map(([c, l]) => `<option value="${c}" ${c === sel ? 'selected' : ''}>${esc(l)}</option>`).join('');

  // Busy bar + error handling for backend calls.
  let busyCount = 0;
  function busy(on) {
    busyCount = Math.max(0, busyCount + (on ? 1 : -1));
    let bar = $('#busy');
    if (!bar) { bar = document.createElement('div'); bar.id = 'busy'; document.body.appendChild(bar); }
    bar.classList.toggle('on', busyCount > 0);
  }
  const ERRORS = { FORBIDDEN: 'Anda tiada kebenaran untuk tindakan ini.', NOT_EDITABLE: 'Permohonan ini tidak boleh disunting lagi.', NOT_PENDING: 'Permohonan ini sudah diputuskan.', OWN_APPLICATION: 'Anda tidak boleh membuat keputusan ke atas permohonan sendiri.', INCOMPLETE: 'Permohonan belum lengkap.', LETTER_NOT_READY: 'Surat PDF belum tersedia.', LETTER_TEMPLATE_MISSING: 'Templat surat belum disediakan (setupLetterTemplate).' };
  /** Run a backend call with the busy bar; shows the error and resolves to null on failure. */
  async function call(promise) {
    busy(true);
    try { return await promise; }
    catch (e) { const m = String((e && e.message) || e).replace(/^(Error|Exception):\s*/, ''); toast(ERRORS[m.split(':')[0]] || m, 'err'); return null; }
    finally { busy(false); }
  }
  // Full-screen "please wait" overlay for important actions (submit, decide...).
  let blocking = false;
  function overlay(msg) {
    let o = $('#overlay');
    if (!o) { o = document.createElement('div'); o.id = 'overlay'; document.body.appendChild(o); }
    if (msg === false) { o.classList.remove('on', 'done'); blocking = false; document.body.classList.remove('no-scroll'); return; }
    blocking = true;
    document.body.classList.add('no-scroll');
    o.innerHTML = `<div class="ov-card"><div class="ov-spin"></div><div class="ov-msg">${esc(msg)}</div><div class="ov-sub">Sila tunggu. Jangan tutup atau muat semula halaman ini.</div></div>`;
    o.classList.remove('done'); o.classList.add('on');
  }
  function overlayDone(msg) {
    const o = $('#overlay'); if (!o) return Promise.resolve();
    o.innerHTML = `<div class="ov-card"><div class="ov-tick">${ic('check')}</div><div class="ov-msg">${esc(msg)}</div></div>`;
    o.classList.add('done');
    return new Promise(res => setTimeout(() => { overlay(false); res(); }, 900));
  }
  /**
   * Run an action from a button: ignores repeat clicks, shows a spinner on the
   * button, and (with overlayMsg) blocks the whole page until the server replies.
   */
  async function act(btn, fn, overlayMsg) {
    if (btn && btn.dataset.busy) return null;
    if (btn) { btn.dataset.busy = '1'; btn.disabled = true; btn.classList.add('loading'); }
    if (overlayMsg) overlay(overlayMsg);
    try { return await fn(); }
    finally {
      if (overlayMsg && !$('#overlay.done')) overlay(false);
      if (btn && btn.isConnected) { delete btn.dataset.busy; btn.disabled = false; btn.classList.remove('loading'); }
    }
  }
  window.addEventListener('beforeunload', (e) => { if (blocking) { e.preventDefault(); e.returnValue = ''; } });

  /** Replace the snapshot with a fresh one from the backend and re-render. */
  function apply(state) { if (state) STATE = state; return !!state; }

  function toast(msg, kind) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${ic(kind === 'err' ? 'alert' : 'check')}<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function modal(html, opt) {
    const root = $('#modal-root');
    root.innerHTML = `<div class="modal-back"><div class="modal ${opt && opt.wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
    const back = $('.modal-back', root);
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) closeModal(); });
    return $('.modal', root);
  }
  const closeModal = () => { $('#modal-root').innerHTML = ''; };

  function confirmBox(title, body, okLabel, okClass) {
    return new Promise((resolve) => {
      const m = modal(`<div class="modal-head"><h3>${esc(title)}</h3></div><div class="modal-body">${body}</div>
        <div class="modal-foot"><button class="btn" data-close>Batal</button><button class="btn ${okClass || 'btn-primary'}" id="ok">${esc(okLabel)}</button></div>`);
      $('#ok', m).onclick = () => { closeModal(); resolve(true); };
      $$('[data-close]', m).forEach(b => b.addEventListener('click', () => resolve(false)));
    });
  }

  function downloadText(name, text, type) {
    const blob = new Blob(['﻿' + text], { type: type || 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function downloadBlob(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* blocked inside the Apps Script iframe */ }
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove(); return ok;
  }

  // -------------------------------------------------------------- theme
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('joc_theme', t); } catch (e) {}
  }
  const themeBtn = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return `<button class="btn btn-ghost btn-icon theme-btn" data-act="theme" title="${dark ? 'Mod cerah' : 'Mod gelap'}" aria-label="Tukar tema">${ic(dark ? 'sun' : 'moon')}</button>`;
  };

  // ------------------------------------------------------------ session
  // session = { user_id, role }. The chosen role is remembered per user in this browser.
  let session = null;
  const roleKey = () => 'joc_role_' + session.user_id;
  const saveSession = () => { try { localStorage.setItem(roleKey(), session.role); } catch (e) {} };
  const me = () => session && D().users.find(u => u.user_id === session.user_id);
  const rolesOf = (uid) => D().user_roles.filter(r => r.user_id === uid && r.is_active).map(r => r.role_code);
  const userName = (uid) => (D().users.find(u => u.user_id === uid) || {}).full_name || '-';
  const deptName = (id) => (D().departments.find(d => d.department_id === id) || {}).name || '-';
  const deptCode = (id) => (D().departments.find(d => d.department_id === id) || {}).code || '-';

  // ----------------------------------------------------------- domain logic
  const getApp = (id) => D().applications.find(a => a.application_id === id);
  const histOf = (id) => D().status_history.filter(h => h.application_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const reviewsOf = (id) => D().reviews.filter(r => r.application_id === id).sort((a, b) => a.decided_at.localeCompare(b.decided_at));
  const letterOf = (id) => D().approval_letters.find(l => l.application_id === id && !l.is_void);
  const pending = (a) => a.status_code === 'SUBMITTED' || a.status_code === 'RESUBMITTED';
  const editable = (a) => a.status_code === 'DRAFT' || a.status_code === 'AMEND_REQUIRED';

  function weeklyCheck(a) {
    if (!a.start_date || !a.end_date || !a.hours_per_student) return null;
    const days = daysBetween(a.start_date, a.end_date) + 1;
    if (days <= 0) return null;
    const weeks = Math.max(1, days / 7);
    const perWeek = a.hours_per_student / weeks;
    const limit = Number(a.period_type_code === 'CUTI' ? S('MAX_HOURS_WEEK_BREAK') : S('MAX_HOURS_WEEK_SEMESTER'));
    return { perWeek, limit, weeks, over: perWeek > limit + 0.01 };
  }

  // ------------------------------------------------------------- routing
  const routes = [];
  const route = (pattern, fn, opt) => routes.push({ re: new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '$'), fn, opt: opt || {} });
  const go = (h) => { if (location.hash === h) render(); else location.hash = h; };

  function render() {
    if (!STATE) return; // still starting up
    const hash = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = hash.split('?');
    const params = new URLSearchParams(qs || '');
    if (!session && path !== '/') return go('#/');
    if (session && path === '/' && !IS_MOCK) return go('#/home');
    for (const r of routes) {
      const m = path.match(r.re);
      if (!m) continue;
      if (r.opt.roles && !r.opt.roles.includes(session.role)) return go('#/home');
      closeModal();
      r.fn(...m.slice(1), params);
      window.scrollTo(0, 0);
      return;
    }
    go(session ? '#/home' : '#/');
  }
  window.addEventListener('hashchange', render);

  // --------------------------------------------------------------- shell
  const NAV = {
    APPLICANT: [['#/home', 'home', 'Laman Utama'], ['#/apply', 'plus', 'Permohonan Baharu'], ['#/my', 'file', 'Permohonan Saya'], ['#/about', 'info', 'Tentang JOC']],
    REVIEWER: [['#/home', 'home', 'Laman Utama'], ['#/review', 'inbox', 'Senarai Semakan', 'pending'], ['#/all', 'list', 'Semua Permohonan'], ['#/reports', 'chart', 'Laporan'], ['#/about', 'info', 'Tentang JOC']],
    ADMIN: [['#/home', 'home', 'Laman Utama'], ['#/admin/users', 'users', 'Pengguna & Peranan'], ['#/admin/lists', 'list', 'Senarai Pilihan'], ['#/admin/settings', 'sliders', 'Tetapan'], ['#/admin/emails', 'mail', 'Log Emel'], ['#/reports', 'chart', 'Laporan']],
    VIEWER: [['#/home', 'chart', 'Laporan'], ['#/all', 'list', 'Semua Permohonan'], ['#/about', 'info', 'Tentang JOC']],
  };
  const ROLE_ICON = { APPLICANT: 'file', REVIEWER: 'inbox', ADMIN: 'shield', VIEWER: 'chart' };

  function shell(title, body) {
    const user = me();
    const myRoles = rolesOf(user.user_id);
    const pendingCount = D().applications.filter(a => pending(a)).length;
    const cur = '#' + (location.hash.replace(/^#/, '').split('?')[0]);
    const nav = NAV[session.role].map(([href, icon, label, count]) => {
      const active = cur === href || (href !== '#/home' && cur.startsWith(href + '/'));
      return `<a href="${href}" class="${active ? 'active' : ''}" data-label="${esc(label)}">${ic(icon)}<span>${label}</span>${count && pendingCount ? `<span class="count">${pendingCount}</span>` : ''}</a>`;
    }).join('');
    let collapsed = false;
    try { collapsed = localStorage.getItem('joc_side_collapsed') === '1'; } catch (e) {}
    $('#root').innerHTML = `
      <div class="app ${collapsed ? 'collapsed' : ''}" id="app">
        <aside class="sidebar" id="sidebar">
          <button class="collapse-btn" data-act="collapse" title="${collapsed ? 'Besarkan menu' : 'Kecilkan menu'}" aria-label="${collapsed ? 'Besarkan menu' : 'Kecilkan menu'}">${collapsed ? '»' : '«'}</button>
          <div class="side-scroll">
          <div class="brand">
            <span class="logo-chip"><img src="${LOGO}" alt="Universiti Malaysia Perlis"></span>
            <div class="sys-big">Sistem Permohonan JOC</div>
            <div class="sys-tag">Job on Campus · Saringan Fakulti</div>
            <div class="fac">Fakulti Kejuruteraan &amp; Teknologi Elektronik <b>(FKTEN)</b></div>
          </div>
          <div class="brand-mini"><a class="logomark" href="#/home" title="Sistem Permohonan JOC · Laman Utama"><b>JOC</b><i></i><em>FKTEN</em></a></div>
          <div class="nav-label">${esc(roleName(session.role))}</div>
          <nav class="nav">${nav}</nav>
          <div class="spacer"></div>
          <div class="side-foot">Saringan peringkat fakulti sebelum permohonan di portal MySISWA@JoC KPT.</div>
          </div>
        </aside>
        <div class="main">
          <header class="topbar">
            <button class="btn btn-ghost btn-icon menu-btn" data-act="nav" aria-label="Menu">${ic('menu')}</button>
            <div class="appname"><a class="logomark sm" href="#/home" title="Laman Utama"><b>JOC</b><i></i><em>FKTEN</em></a><div class="an-text"><div class="an-title sys">Sistem Permohonan JOC</div><div class="an-sub page"><span class="crumb">FKTEN ·</span> ${esc(title)}</div></div></div>
            ${myRoles.length > 1 ? `<label class="role-switch" title="Tukar peranan"><select data-act="role" aria-label="Peranan">${myRoles.map(r => `<option value="${r}" ${r === session.role ? 'selected' : ''}>${esc(roleName(r))}</option>`).join('')}</select></label>` : ''}
            <button class="btn btn-ghost btn-icon" data-act="refresh" title="Muat semula data" aria-label="Muat semula data">${ic('refresh')}</button>
            ${themeBtn()}
            <div class="menu-wrap">
              <button class="avatar" data-act="usermenu" aria-label="Akaun">${esc(initials(user.full_name))}</button>
              <div class="dropdown hidden" id="usermenu">
                <div class="who"><b>${esc(user.full_name)}</b><div class="small muted">${esc(user.email)}</div></div>
                ${myRoles.length > 1 ? `<div class="dd-roles"><div class="dd-label">Tukar peranan</div>${myRoles.map(r => `<button data-act="role-pick" data-role="${r}" class="${r === session.role ? 'on' : ''}">${ic(ROLE_ICON[r])} ${esc(roleName(r))}${r === session.role ? ' ✓' : ''}</button>`).join('')}</div>` : ''}
                <a href="#/profile">${ic('user')} Profil saya</a>
                <button data-act="theme-menu">${ic(document.documentElement.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon')} ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'Mod cerah' : 'Mod gelap'}</button>
                <button data-act="switch">${ic('refresh')} Tukar akaun Google</button>
                ${IS_MOCK ? `<button data-act="reset">${ic('trash')} Set semula data demo</button><button data-act="logout">${ic('logout')} Log keluar</button>` : ''}
              </div>
            </div>
          </header>
          <main class="content">${body}</main>
        </div>
      </div>`;
    countUp();
  }

  /** Numbers in stat cards count up from 0 (skipped when the user prefers less motion). */
  function countUp() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    $$('.k-val[data-n]').forEach(el => {
      const end = Number(el.dataset.n); if (!end) return;
      const t0 = performance.now(), dur = 650;
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = fmtNum(Math.round(end * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /** Stat card: coloured icon tile + top line (cls = c-draft | c-sub | c-amend | c-ok | c-rej | c-gold). */
  function kpi(label, value, sub, cls, icon, money) {
    return `<div class="card kpi ${cls}"><div class="k-ic">${ic(icon)}</div><div class="k-label">${esc(label)}</div>
      <div class="k-val ${money ? 'money' : ''}" ${money ? '' : `data-n="${Number(value) || 0}"`}>${money ? esc(value) : fmtNum(value)}</div><div class="k-sub">${esc(sub)}</div></div>`;
  }

  const HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const BULAN_PENUH = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Selamat pagi' : h < 15 ? 'Selamat tengah hari' : h < 19 ? 'Selamat petang' : 'Selamat malam';
  }
  /** Animated welcome banner used on each role's home page. pills: [[cls, text, href]] */
  function hero(sub, pills, cta) {
    const user = me(), d = new Date();
    return `<section class="hero"><span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span><span class="dots"></span>
      <div class="h-eyebrow"><span class="dot"></span><span class="sysname">Sistem Permohonan JOC · FKTEN</span><span class="sep">—</span><span>${HARI[d.getDay()]}, ${d.getDate()} ${BULAN_PENUH[d.getMonth()]} ${d.getFullYear()}</span></div>
      <h1><span class="g1">${greeting()} <span class="wave">👋</span></span><span class="g2">${esc(user.full_name)}</span></h1>
      <div class="h-sub">${esc(sub)}</div>
      <div class="h-row">${pills.map(([c, t, h]) => `<a class="pill ${c}" href="${h}"><i></i>${esc(t)}</a>`).join('')}${cta || ''}</div></section>`;
  }

  // Global click handling for shell actions
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-act]');
    const app = $('#app');
    if (app && app.classList.contains('nav-open') && !e.target.closest('#sidebar') && !(t && t.dataset.act === 'nav')) app.classList.remove('nav-open');
    if (!e.target.closest('.menu-wrap')) { const um = $('#usermenu'); if (um) um.classList.add('hidden'); }
    if (!t) return;
    const act = t.dataset.act;
    if (act === 'theme') { setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); t.outerHTML = themeBtn(); }
    else if (act === 'nav') app.classList.toggle('nav-open');
    else if (act === 'collapse') {
      const on = !app.classList.contains('collapsed');
      app.classList.toggle('collapsed', on);
      t.textContent = on ? '»' : '«'; t.title = t.ariaLabel = on ? 'Besarkan menu' : 'Kecilkan menu';
      try { localStorage.setItem('joc_side_collapsed', on ? '1' : '0'); } catch (e) {}
    }
    else if (act === 'role-pick') { session.role = t.dataset.role; saveSession(); toast(`Peranan: ${roleName(session.role)}`); go('#/home'); }
    else if (act === 'theme-menu') { setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); render(); }
    else if (act === 'refresh') {
      await act_refresh(t);
    }
    else if (act === 'usermenu') $('#usermenu').classList.toggle('hidden');
    else if (act === 'logout') { await API.logout(); session = null; go('#/'); }
    else if (act === 'switch') {
      if (IS_MOCK) { await API.logout(); session = null; go('#/'); setTimeout(openChooser, 80); }
      else window.open('https://accounts.google.com/AccountChooser?continue=' + encodeURIComponent(STATE.appUrl), '_top');
    }
    else if (act === 'reset') { if (await confirmBox('Set semula data demo?', '<p>Semua perubahan dalam mock ini akan dipadam dan data contoh asal dimuat semula.</p>', 'Set semula', 'btn-danger')) { apply(await call(API.resetDemo())); toast('Data demo telah diset semula'); render(); } }
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-act="role"]')) { session.role = e.target.value; saveSession(); toast(`Peranan: ${roleName(session.role)}`); go('#/home'); }
  });

  /** Reload just the data (not the page) and redraw the current screen. */
  async function act_refresh(btn) {
    await flushSave();
    const st = await act(btn, () => call(API.refresh()));
    if (apply(st)) { render(); toast('Data dikemas kini'); }
  }

  // ------------------------------------------------------------- landing
  route('/', () => {
    if (session) return go('#/home');
    $('#root').innerHTML = `
      <div class="landing">
        <div class="landing-top">
          <span class="logo-chip"><img src="${LOGO}" alt="Universiti Malaysia Perlis"></span>
          ${themeBtn()}
        </div>
        <section class="landing-hero">
          <div>
            <span class="eyebrow">MySISWA Job on Campus</span>
            <h1>Sistem Permohonan JOC</h1>
            <div class="faculty">${FACULTY}</div>
            <p class="lead">Saringan permohonan Job on Campus di peringkat fakulti. Hantar butiran program dan bukti kelulusan di sini dahulu; setelah diluluskan oleh TD HEPA, teruskan permohonan di portal MySISWA@JoC KPT.</p>
            <div class="cta-row">
              <button class="btn btn-primary btn-lg" id="login">${ic('user')} Log masuk dengan akaun UniMAP</button>
              <a class="btn btn-lg" href="${esc(S('GOOGLE_SITE_URL'))}" target="_blank" rel="noopener">${ic('info')} Tentang JOC</a>
            </div>
            <p class="small muted" style="margin-top:14px">Hanya akaun <b>@unimap.edu.my</b> dibenarkan.</p>
          </div>
          <div class="steps-card">
            <h3>Bagaimana ia berfungsi</h3>
            ${[['Mohon di sistem ini', 'Isi butiran program JOC dan lampirkan bukti kelulusan (kertas kerja / emel).'],
               ['Semakan TD HEPA', 'Keputusan: Lulus, Pindaan atau Tolak. Anda dimaklumkan melalui emel.'],
               ['Surat kelulusan', 'Jika lulus, surat kelulusan fakulti dihantar kepada anda dan CGEE.'],
               ['Daftar di portal JoC', 'Daftar tawaran latihan di joc.mohe.gov.my menggunakan maklumat yang telah diluluskan.']]
              .map(([t, d], i) => `<div class="step-line"><div class="step-num">${i + 1}</div><div><b>${t}</b><p class="small muted">${d}</p></div></div>`).join('')}
          </div>
        </section>
        <div class="landing-foot">${FACULTY} · Universiti Malaysia Perlis${IS_MOCK ? ' · Prototaip untuk semakan' : ''}</div>
      </div>`;
    $('#login').onclick = openChooser;
  });

  // Mock of Google's account chooser (in the real system Google shows this).
  function openChooser() {
    const accts = D().users.map(u => [u.email, u.full_name, rolesOf(u.user_id).map(r => roleName(r)).join(' · ')])
      .concat([['staf.baharu@unimap.edu.my', 'Staf Baharu (log masuk kali pertama)', 'Belum berdaftar'], ['pengguna.peribadi@gmail.com', 'Akaun Gmail peribadi', 'Bukan akaun UniMAP']]);
    const colors = ['#0e2262', '#2563eb', '#0f766e', '#b45309', '#7c3aed', '#be123c', '#475569', '#64748b'];
    const m = modal(`<div class="modal-head"><div><h3>Pilih akaun</h3><p class="small muted">untuk meneruskan ke Sistem Permohonan JOC</p></div><button class="btn btn-ghost btn-icon" data-close aria-label="Tutup">${ic('x')}</button></div>
      <div class="modal-body" style="padding:10px">
        <div class="callout info small" style="margin:6px 6px 10px">${ic('info')}<div>Mock: dalam sistem sebenar, skrin ini dipaparkan oleh Google. Pilih akaun demo untuk mencuba setiap peranan.</div></div>
        ${accts.map(([em, nm, rl], i) => `<button class="acct" data-em="${esc(em)}" data-nm="${esc(nm)}"><span class="av" style="background:${colors[i % colors.length]}">${esc(initials(nm) || '?')}</span><span><b>${esc(nm)}</b><div class="em">${esc(em)}</div><div class="small muted">${esc(rl)}</div></span></button>`).join('')}
      </div>`);
    $$('.acct', m).forEach(b => b.onclick = () => login(b.dataset.em, b.dataset.nm));
  }

  async function login(email, name) {
    if (!email.endsWith('@unimap.edu.my')) {
      modal(`<div class="modal-head"><h3>Akses tidak dibenarkan</h3></div><div class="modal-body"><div class="callout err">${ic('shield')}<div class="body"><b>${esc(email)}</b> bukan akaun UniMAP. Sistem ini hanya untuk staf dengan akaun <b>@unimap.edu.my</b>. Sila tukar akaun Google.</div></div></div><div class="modal-foot"><button class="btn btn-primary" id="again">Tukar akaun</button></div>`);
      $('#again').onclick = openChooser;
      return;
    }
    const res = await call(API.login(email, name));
    if (!res) return;
    closeModal();
    enter(res.state, res.userId);
  }

  /**
   * The button in notification emails opens ?open=APP-ID. Penyemak go to the review
   * page; the applicant (or admin / pemerhati) goes to the application's detail page.
   */
  function openFromLink(id, rs) {
    // Apply each email link once per browser tab, so a later refresh keeps the user where they are.
    try { if (sessionStorage.getItem('joc_opened') === id) return false; sessionStorage.setItem('joc_opened', id); } catch (e) {}
    try { if (IS_MOCK) history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    const a = getApp(id);
    if (!a) { toast('Permohonan ' + id + ' tidak ditemui atau anda tiada akses', 'err'); return false; }
    const use = (role, hash) => { session.role = role; saveSession(); go(hash); return true; };
    if (a.applicant_id !== session.user_id && rs.includes('REVIEWER') && a.version_no > 0) return use('REVIEWER', '#/review/' + id);
    if (a.applicant_id === session.user_id && rs.includes('APPLICANT')) return use('APPLICANT', '#/app/' + id);
    const staff = rs.find(r => r === 'ADMIN' || r === 'VIEWER');
    if (staff) return use(staff === 'VIEWER' ? 'VIEWER' : 'ADMIN', '#/app/' + id);
    return false;
  }

  /** After the backend has identified the user: pick the role and the first screen. */
  function enter(state, userId, openId) {
    STATE = state;
    const rs = rolesOf(userId);
    let saved = null;
    try { saved = localStorage.getItem('joc_role_' + userId); } catch (e) {}
    session = { user_id: userId, role: rs.includes(saved) ? saved : rs[0] };
    const user = me();
    if (!user.department_id) { toast('Selamat datang! Sila lengkapkan profil anda.'); return go('#/profile?first=1'); }
    if (openId && openFromLink(openId, rs)) return;
    if (rs.length > 1 && !rs.includes(saved)) return go('#/roles');
    if (location.hash && location.hash !== '#/' && location.hash !== '#') return render();
    go('#/home');
  }

  // ---------------------------------------------------------- role chooser
  route('/roles', () => {
    const user = me();
    const rs = rolesOf(user.user_id);
    const desc = { APPLICANT: 'Mohon JOC untuk program anda, buat pindaan dan muat turun surat kelulusan.', REVIEWER: 'Semak permohonan staf dan buat keputusan Lulus, Pindaan atau Tolak.', ADMIN: 'Urus pengguna, peranan, senarai pilihan, tetapan dan suis emel.', VIEWER: 'Lihat laporan dan statistik permohonan JOC fakulti.' };
    $('#root').innerHTML = `<div class="landing"><div class="landing-top"><span class="logo-chip"><img src="${LOGO}" alt="UniMAP"></span>${themeBtn()}</div>
      <div class="content" style="max-width:860px">
        <div class="sys-line"><span class="logomark lg"><b>JOC</b><i></i><em>FKTEN</em></span><div><div class="t1">Sistem Permohonan JOC</div><div class="t2">${FACULTY}</div></div></div>
        <h1>Selamat datang, ${esc(user.full_name)}</h1>
        <p class="muted" style="margin-top:6px">Akaun anda mempunyai ${rs.length} peranan. Pilih peranan untuk sesi ini — anda boleh tukar bila-bila masa di bahagian atas skrin.</p>
        <div class="role-grid">${rs.map(r => `<button class="role-card" data-role="${r}"><div class="ri">${ic(ROLE_ICON[r])}</div><h3>${esc(roleName(r))}</h3><p class="small muted" style="margin-top:6px">${desc[r]}</p></button>`).join('')}</div>
      </div></div>`;
    $$('.role-card').forEach(b => b.onclick = () => { session.role = b.dataset.role; saveSession(); go('#/home'); });
  });

  // ---------------------------------------------------------------- home
  route('/home', () => {
    if (session.role === 'APPLICANT') return applicantHome();
    if (session.role === 'REVIEWER') return reviewerHome();
    if (session.role === 'ADMIN') return adminHome();
    return reportsPage('Laporan');
  });

  function appItem(a, href, extra) {
    const wc = weeklyCheck(a);
    return `<a class="app-item strip-${a.status_code}" href="${href}">
      <div><div class="t">${esc(a.programme_name || '(Tanpa nama program)')}</div>
        <div class="meta"><span>${esc(a.ref_no || 'Draf · ' + a.application_id)}</span><span>${esc(deptCode(a.department_id))}</span><span>${a.num_students || 0} pelajar · ${a.hours_per_student || 0} jam</span><span>${fmtDate(a.start_date)} – ${fmtDate(a.end_date)}</span>${wc && wc.over && editable(a) ? '<span style="color:var(--st-amend)">⚠ melebihi had jam</span>' : ''}${extra || ''}</div></div>
      <div class="right">${badge(a.status_code)}<span class="small muted">${a.last_submitted_at ? 'Dihantar ' + fmtDate(a.last_submitted_at) : 'Dikemas kini ' + fmtDate(a.updated_at)}</span></div></a>`;
  }

  function applicantHome() {
    const user = me();
    const mine = D().applications.filter(a => a.applicant_id === user.user_id && !a.is_deleted).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const cnt = (f) => mine.filter(f).length;
    const amend = mine.filter(a => a.status_code === 'AMEND_REQUIRED');
    const nPend = cnt(pending), nAmend = cnt(a => a.status_code === 'AMEND_REQUIRED'), nOk = cnt(a => a.status_code === 'APPROVED');
    shell('Laman Utama', `
      ${hero(`${deptName(user.department_id)} · ${roleName('APPLICANT')}`,
        [nAmend ? ['p-amend', `${nAmend} perlu pindaan`, '#/my'] : null, ['p-sub', `${nPend} dalam semakan`, '#/my'], ['p-ok', `${nOk} lulus`, '#/my']].filter(Boolean),
        `<a class="btn btn-gold" href="#/apply">${ic('plus')} Permohonan Baharu</a>`)}
      ${amend.map(a => `<div class="callout warn" style="margin-bottom:14px">${ic('alert')}<div class="body"><b>Pindaan diperlukan:</b> ${esc(a.programme_name)} (${esc(a.ref_no)}). <a href="#/app/${a.application_id}">Lihat ulasan TD HEPA →</a></div></div>`).join('')}
      <div class="kpis">
        ${kpi('Draf', cnt(a => a.status_code === 'DRAFT'), 'belum dihantar', 'c-draft', 'file')}
        ${kpi('Dalam semakan', nPend, 'menunggu penyemak', 'c-sub', 'clock')}
        ${kpi('Perlu pindaan', nAmend, 'tindakan anda', 'c-amend', 'edit')}
        ${kpi('Lulus', nOk, 'sedia untuk portal JoC', 'c-ok', 'check')}
      </div>
      <div class="card"><div class="card-head"><h2>Permohonan saya</h2><a class="btn btn-sm" href="#/my">Lihat semua</a></div>
        <div class="app-list">${mine.slice(0, 5).map(a => appItem(a, `#/app/${a.application_id}`)).join('') || emptyState('Belum ada permohonan.', '<a class="btn btn-primary" href="#/apply">Mula permohonan pertama</a>')}</div></div>`);
  }

  const emptyState = (msg, action) => `<div class="empty">${ic('inbox')}<p>${msg}</p>${action ? `<div style="margin-top:12px">${action}</div>` : ''}</div>`;

  route('/my', () => {
    const mine = D().applications.filter(a => a.applicant_id === session.user_id && !a.is_deleted).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    shell('Permohonan Saya', `<div class="page-head"><div><h1>Permohonan Saya</h1><p class="muted">${mine.length} permohonan</p></div><a class="btn btn-primary" href="#/apply">${ic('plus')} Permohonan Baharu</a></div>
      <div class="card"><div class="app-list">${mine.map(a => appItem(a, `#/app/${a.application_id}`)).join('') || emptyState('Belum ada permohonan.')}</div></div>`);
  }, { roles: ['APPLICANT'] });

  // -------------------------------------------------------- JOC info
  function rulesBlock() {
    return `<div class="rules">
      <div class="card rule"><div class="big">RM${esc(Number(S('DEFAULT_RATE_PER_HOUR')).toFixed(2))}</div><div class="lbl">sejam</div></div>
      <div class="card rule"><div class="big">${esc(S('MAX_HOURS_WEEK_SEMESTER'))} jam</div><div class="lbl">maks seminggu (semester)</div></div>
      <div class="card rule"><div class="big">${esc(S('MAX_HOURS_WEEK_BREAK'))} jam</div><div class="lbl">maks seminggu (cuti semester)</div></div>
      <div class="card rule"><div class="big">≥ ${esc(S('MIN_CGPA'))}</div><div class="lbl">PNGK pelajar*</div></div>
    </div>`;
  }
  const CLUSTERS = () => LK('JOB_CATEGORY').map(([, l]) => `<span class="cluster">${esc(l)}</span>`).join('');

  function infoContent(forApply) {
    return `
      <div class="info-hero"><h2>MySISWA Job on Campus (JoC)</h2>
        <p>Inisiatif Kementerian Pendidikan Tinggi (Belanjawan 2026) yang memberi peluang mahasiswa bekerja sambilan di dalam kampus — menjana pendapatan, menimba pengalaman kerja sebenar dan membina kemahiran insaniah. Di UniMAP, JoC dilaksanakan secara rasmi pada Mei 2026 dan diselaraskan oleh CGEE.</p></div>
      ${rulesBlock()}
      <div class="card card-pad stack">
        <div><h3>Kluster tugas yang dibenarkan</h3><div class="clusters" style="margin-top:10px">${CLUSTERS()}</div></div>
        <div class="callout err">${ic('alert')}<div class="body"><b>Tidak dibenarkan:</b> kerja berisiko tinggi atau kerja 3D (kotor, bahaya, sukar) — contohnya pengendalian bahan kimia berbahaya.</div></div>
        <div><h3>Syarat pelajar*</h3><p class="muted small" style="margin-top:6px">Warganegara Malaysia · pelajar aktif (Sarjana Muda / Sarjana / PhD) · telah tamat sekurang-kurangnya 1 semester · PNGK ≥ ${esc(S('MIN_CGPA'))}.</p>
          <p class="small muted" style="margin-top:4px">*Tertakluk kepada syarat UniMAP / CGEE yang terkini.</p></div>
      </div>
      <div class="card card-pad"><h3>Proses di FKTEN</h3>
        <div class="grid-2" style="margin-top:6px">${[['Mohon di sistem ini', 'Butiran program + bukti kelulusan.'], ['Semakan TD HEPA', 'Lulus / Pindaan / Tolak.'], ['Surat kelulusan', 'Dihantar kepada anda & CGEE.'], ['Daftar di portal JoC', 'joc.mohe.gov.my — rujuk Manual Majikan.']]
          .map(([t, d], i) => `<div class="step-line" style="border-top:0"><div class="step-num">${i + 1}</div><div><b>${t}</b><p class="small muted">${d}</p></div></div>`).join('')}</div>
      </div>
      ${forApply ? `<div class="card card-pad"><h3>Sediakan sebelum mula</h3><ul class="checklist" style="margin-top:12px">
          ${['Kertas kerja / emel / surat kelulusan program (PDF atau gambar)', 'Tarikh mula & tamat, jumlah jam bagi setiap pelajar', 'Skop tugas pelajar', 'Senarai pelajar (no. matrik, nama, program) — jika telah dikenal pasti']
            .map(x => `<li>${ic('check')}<span>${x}</span></li>`).join('')}</ul></div>` : ''}
      <p class="small muted">Sumber: Siaran Media KPT Belanjawan 2026 · Berita UKM (29 Jun 2026) · Jendela MADANI (16 Mei 2026). <a href="${esc(S('GOOGLE_SITE_URL'))}" target="_blank" rel="noopener">Baca lanjut di laman JOC FKTEN ${ic('ext')}</a></p>`;
  }

  route('/about', () => {
    shell('Tentang JOC', `<div class="stack">${infoContent(false)}</div>`);
  });

  route('/apply', (params) => {
    let hide = false;
    try { hide = localStorage.getItem(HIDE_INFO_KEY) === '1'; } catch (e) {}
    const mine = D().applications.filter(a => a.applicant_id === session.user_id && a.version_no > 0);
    if (hide && !params.get('info')) return startNew();
    shell('Permohonan Baharu', `
      <div class="page-head"><div><h1>Sebelum anda mula</h1><p class="muted">Ringkasan syarat MySISWA JoC dan perkara yang perlu disediakan.</p></div></div>
      <div class="stack">${infoContent(true)}
        <div class="card card-pad stack">
          <label class="check"><input type="checkbox" id="ack"> <span>Saya telah membaca dan faham syarat JOC di atas.</span></label>
          <label class="check"><input type="checkbox" id="hide"> <span class="muted">Jangan tunjuk halaman ini lagi untuk permohonan seterusnya.</span></label>
          <div class="row between">
            ${mine.length ? `<select id="dupe" style="max-width:420px"><option value="">— atau salin daripada permohonan terdahulu —</option>${mine.map(a => `<option value="${a.application_id}">${esc(a.ref_no)} · ${esc(a.programme_name)}</option>`).join('')}</select>` : '<span></span>'}
            <button class="btn btn-primary" id="start" disabled>Mula permohonan ${ic('right')}</button>
          </div>
        </div></div>`);
    $('#ack').onchange = (e) => { $('#start').disabled = !e.target.checked; };
    $('#start').onclick = (e) => {
      try { if ($('#hide').checked) localStorage.setItem(HIDE_INFO_KEY, '1'); } catch (err) {}
      act(e.currentTarget, () => startNew($('#dupe') ? $('#dupe').value : ''));
    };
  }, { roles: ['APPLICANT'] });

  async function startNew(fromId) {
    const res = await call(API.newDraft(fromId || ''));
    if (!res) return;
    apply(res.state);
    toast(fromId ? 'Draf baharu disalin daripada permohonan terdahulu' : 'Draf baharu dicipta');
    go(`#/form/${res.id}?step=1`);
  }

  let uploading = 0; // files still being uploaded on the proof step

  // Drafts are saved automatically shortly after the user stops typing.
  let saveTimer = null, savePending = null;
  function scheduleSave(a) {
    savePending = a;
    const ind = $('#save-ind'); if (ind) ind.textContent = 'Belum disimpan…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => flushSave(), 1200);
  }
  async function flushSave() {
    clearTimeout(saveTimer);
    const a = savePending; savePending = null;
    if (!a) return true;
    const ind = $('#save-ind'); if (ind) ind.textContent = 'Menyimpan…';
    const ok = await call(API.saveApp(a));
    const ind2 = $('#save-ind'); if (ind2) ind2.textContent = ok ? 'Disimpan ✓' : 'Gagal disimpan';
    return !!ok;
  }
  window.addEventListener('beforeunload', (e) => { if (savePending) { flushSave(); e.preventDefault(); e.returnValue = ''; } });

  // ---------------------------------------------------------------- wizard
  const STEPS = ['Program', 'Keperluan JOC', 'Pelajar', 'Bukti Kelulusan', 'Semak & Hantar'];

  function validateStep(a, step) {
    const e = {};
    const need = (k, msg) => { if (a[k] === '' || a[k] == null || (typeof a[k] === 'number' && isNaN(a[k]))) e[k] = msg || 'Wajib diisi'; };
    if (step === 1) { need('programme_name'); need('organiser'); need('description'); need('offer_type_code', 'Sila pilih'); need('period_type_code', 'Sila pilih'); }
    if (step === 2) {
      need('job_title'); need('job_category_code', 'Sila pilih'); need('start_date'); need('end_date');
      if (!(Number(a.num_students) >= 1)) e.num_students = 'Sekurang-kurangnya 1';
      if (!(Number(a.hours_per_student) > 0)) e.hours_per_student = 'Mesti lebih daripada 0';
      if (a.start_date && a.end_date && a.end_date < a.start_date) e.end_date = 'Tarikh tamat sebelum tarikh mula';
      if (!a.scopes.length) e.scopes = 'Tambah sekurang-kurangnya satu skop tugas';
    }
    if (step === 3 && a.recruitment_mode === 'NAMED') {
      if (!a.students.length) e.students = 'Tambah sekurang-kurangnya seorang pelajar, atau pilih "Melalui iklan terbuka JOC"';
      else if (a.students.some(s => !s[0] || !s[1])) e.students = 'No. matrik dan nama wajib diisi bagi setiap pelajar';
    }
    if (step === 4) {
      if (!a.attachments.filter(f => !f.uploading).length) e.attachments = 'Lampirkan sekurang-kurangnya satu bukti kelulusan';
      need('proof_approved_by_name'); need('proof_approval_date');
    }
    if (step === 5 && !a.declaration_accepted) e.declaration_accepted = 'Sila sahkan perakuan';
    return e;
  }

  const fieldHTML = (label, name, inner, errs, hint, req) =>
    `<label class="field ${errs[name] ? 'error' : ''}"><span>${label}${req === false ? '' : ' <span class="req">*</span>'}</span>${inner}${hint ? `<div class="hint">${hint}</div>` : ''}${errs[name] ? `<div class="err">${esc(errs[name])}</div>` : ''}</label>`;
  const inp = (a, name, type, extra) => `<input type="${type || 'text'}" name="${name}" value="${esc(a[name])}" ${extra || ''}>`;

  route('/form/:id', (id, params) => {
    const a = getApp(id);
    if (!a || a.applicant_id !== session.user_id || !editable(a)) { toast('Permohonan ini tidak boleh disunting', 'err'); return go('#/my'); }
    const step = Math.min(5, Math.max(1, parseInt(params.get('step') || '1', 10)));
    renderStep(a, step, {});
  }, { roles: ['APPLICANT'] });

  function renderStep(a, step, errs) {
    const lastReview = reviewsOf(a.application_id).filter(r => r.decision_code === 'AMEND').pop();
    const stepper = `<div class="stepper">${STEPS.map((s, i) => `<div class="s ${i + 1 < step ? 'done' : ''} ${i + 1 === step ? 'on' : ''}"><div class="bar"></div><div class="name">${i + 1}. <span class="hide-sm">${s}</span></div></div>`).join('')}</div>`;
    let body = '';
    if (step === 1) {
      body = `<h2 style="margin-bottom:16px">Maklumat program</h2>
        ${fieldHTML('Nama program / aktiviti', 'programme_name', inp(a, 'programme_name', 'text', 'placeholder="cth: Pembantu Makmal Semikonduktor Sem 1 2026/2027"'), errs)}
        ${fieldHTML('Penganjur / unit', 'organiser', inp(a, 'organiser', 'text', 'placeholder="cth: Kelab Robotik FKTEN, Makmal Fabrikasi"'), errs, 'Taip sendiri — kelab, makmal, projek, rakan industri dan lain-lain.')}
        ${fieldHTML('Penerangan ringkas / objektif', 'description', `<textarea name="description" rows="3" placeholder="2–3 ayat tentang program dan peranan pelajar">${esc(a.description)}</textarea>`, errs)}
        <div class="grid-2">
          ${fieldHTML('Jenis tawaran', 'offer_type_code', `<select name="offer_type_code">${opts('OFFER_TYPE', a.offer_type_code, 'Pilih...')}</select>`, errs, 'Sama seperti pilihan di portal JoC.')}
          ${fieldHTML('Jenis tempoh latihan', 'period_type_code', `<select name="period_type_code">${opts('PERIOD_TYPE', a.period_type_code, 'Pilih...')}</select>`, errs, 'Menentukan had jam seminggu.')}
        </div>`;
    }
    if (step === 2) {
      const wc = weeklyCheck(a);
      body = `<h2 style="margin-bottom:16px">Keperluan JOC</h2>
        <div class="grid-2">
          ${fieldHTML('Jawatan / jenis latihan', 'job_title', inp(a, 'job_title', 'text', 'placeholder="cth: Pembantu Makmal"'), errs)}
          ${fieldHTML('Kategori latihan', 'job_category_code', `<select name="job_category_code">${opts('JOB_CATEGORY', a.job_category_code, 'Pilih...')}</select>`, errs)}
        </div>
        <div class="grid-3">
          ${fieldHTML('Bilangan pelajar JOC', 'num_students', inp(a, 'num_students', 'number', 'min="1" inputmode="numeric"'), errs)}
          ${fieldHTML('Jumlah jam setiap pelajar', 'hours_per_student', inp(a, 'hours_per_student', 'number', 'min="1" step="0.5" inputmode="decimal"'), errs)}
          ${fieldHTML('Kadar (RM / jam)', 'rate_per_hour', `<input type="text" value="${Number(a.rate_per_hour).toFixed(2)}" readonly>`, errs, 'Ditetapkan oleh KPT.', false)}
        </div>
        <div class="grid-2">
          ${fieldHTML('Tarikh mula', 'start_date', inp(a, 'start_date', 'date'), errs)}
          ${fieldHTML('Tarikh tamat', 'end_date', inp(a, 'end_date', 'date'), errs)}
        </div>
        <div id="live">${liveCalc(a, wc)}</div>
        <div class="field ${errs.scopes ? 'error' : ''}"><span style="display:block;font-weight:600;font-size:.88rem;margin-bottom:6px">Skop tugas <span class="req">*</span></span>
          <ul class="scope-list">${a.scopes.map((s, i) => `<li data-li="${i}"><span class="n">${i + 1}.</span><span class="d">${esc(s)}</span>
            <span class="scope-btns"><button type="button" class="btn btn-ghost btn-sm btn-icon" data-up-scope="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Naik">${ic('up')}</button><button type="button" class="btn btn-ghost btn-sm btn-icon" data-down-scope="${i}" ${i === a.scopes.length - 1 ? 'disabled' : ''} aria-label="Turun">${ic('down')}</button><button type="button" class="btn btn-ghost btn-sm btn-icon" data-edit-scope="${i}" aria-label="Sunting">${ic('edit')}</button><button type="button" class="btn btn-ghost btn-sm btn-icon" data-del-scope="${i}" aria-label="Buang">${ic('x')}</button></span></li>`).join('')}</ul>
          <div class="row" style="flex-wrap:nowrap"><input type="text" id="scope-in" placeholder="Taip satu tugas dan tekan Enter"><button class="btn" id="scope-add">${ic('plus')}<span class="hide-sm">Tambah</span></button></div>
          ${errs.scopes ? `<div class="err">${esc(errs.scopes)}</div>` : ''}</div>`;
    }
    if (step === 3) {
      body = `<h2 style="margin-bottom:16px">Pelajar</h2>
        <div class="stack" style="gap:10px;margin-bottom:16px">
          ${LK('RECRUIT_MODE').map(([c, l]) => `<label class="check card card-pad" style="padding:14px"><input type="radio" name="recruitment_mode" value="${c}" ${a.recruitment_mode === c ? 'checked' : ''}><span><b>${esc(l)}</b><div class="small muted">${c === 'NAMED' ? 'Senaraikan pelajar yang akan menyertai program.' : 'Pelajar akan memohon sendiri melalui iklan di portal JoC.'}</div></span></label>`).join('')}
        </div>
        ${a.recruitment_mode === 'NAMED' ? studentsEditor(a, errs) : '<div class="callout info">' + ic('info') + '<div class="body">Tiada senarai pelajar diperlukan. Pastikan iklan di portal JoC dibuka selepas permohonan ini diluluskan.</div></div>'}`;
    }
    if (step === 4) {
      body = `<h2 style="margin-bottom:6px">Bukti kelulusan program</h2><p class="muted small" style="margin-bottom:16px">Kertas kerja yang telah diluluskan, emel kelulusan atau surat lantikan. PDF/JPG/PNG, maks ${esc(S('MAX_UPLOAD_MB'))}MB setiap fail.</p>
        <label class="dropzone" id="dz">${ic('upload')}<div style="margin-top:8px"><b>Klik untuk pilih fail</b> atau seret ke sini</div><div class="small">Boleh lampir lebih daripada satu fail</div><input type="file" id="files" multiple accept=".pdf,.jpg,.jpeg,.png"></label>
        <div class="stack" style="gap:8px;margin:12px 0 18px">${a.attachments.map((f, i) => f.uploading
          ? `<div class="file-row uploading"><div class="fi">${esc((f.file_name.split('.').pop() || '').toUpperCase().slice(0, 4))}</div><div class="fn">${esc(f.file_name)}<div class="small muted">${(f.size / 1024 / 1024).toFixed(2)} MB · Memuat naik…</div><div class="up-bar"><span></span></div></div><span class="spin-sm"></span></div>`
          : `<div class="file-row"><div class="fi">${esc((f.file_name.split('.').pop() || '').toUpperCase().slice(0, 4))}</div><div class="fn">${esc(f.file_name)}<div class="small muted">${(f.size / 1024 / 1024).toFixed(2)} MB · <span style="color:var(--st-ok)">✓ dimuat naik</span></div></div><select data-att-type="${i}" aria-label="Jenis bukti">${opts('ATTACHMENT_TYPE', f.type)}</select><button class="btn btn-ghost btn-icon btn-sm" data-del-att="${i}" aria-label="Buang">${ic('trash')}</button></div>`).join('')}
          ${errs.attachments ? `<div class="err" style="color:#dc2626;font-size:.8rem">${esc(errs.attachments)}</div>` : ''}</div>
        <div class="grid-3">
          ${fieldHTML('Diluluskan oleh (nama)', 'proof_approved_by_name', inp(a, 'proof_approved_by_name', 'text', 'placeholder="cth: Dekan FKTEN"'), errs)}
          ${fieldHTML('Jawatan', 'proof_approved_by_position', inp(a, 'proof_approved_by_position'), errs, '', false)}
          ${fieldHTML('Tarikh kelulusan', 'proof_approval_date', inp(a, 'proof_approval_date', 'date'), errs)}
        </div>`;
    }
    if (step === 5) {
      const allErr = [1, 2, 3, 4].map(s => [s, Object.keys(validateStep(a, s)).length]).filter(x => x[1]);
      body = `<div class="callout warn" style="margin-bottom:16px">${ic('alert')}<div class="body"><b>Permohonan BELUM DIHANTAR.</b> Semak ringkasan di bawah, tandakan perakuan, kemudian tekan <b>${a.status_code === 'AMEND_REQUIRED' ? 'Hantar semula' : 'Hantar permohonan'}</b> di bahagian bawah.</div></div>
        <h2 style="margin-bottom:4px">Ringkasan permohonan <span class="tag">DRAF</span></h2>
        <p class="small muted" style="margin-bottom:16px">Ini paparan semakan sahaja — belum dihantar kepada TD HEPA.</p>
        ${allErr.length ? `<div class="callout err" style="margin-bottom:16px">${ic('alert')}<div class="body">Masih ada maklumat yang belum lengkap: ${allErr.map(([s]) => `<a href="#/form/${a.application_id}?step=${s}">Langkah ${s} (${STEPS[s - 1]})</a>`).join(', ')}.</div></div>` : ''}
        ${appSummary(a, null)}
        <div class="card card-pad" style="margin-top:16px">
          <label class="check ${errs.declaration_accepted ? 'field error' : ''}"><input type="checkbox" name="declaration_accepted" ${a.declaration_accepted ? 'checked' : ''}><span>Saya mengesahkan maklumat di atas adalah benar dan program ini telah mendapat kelulusan pihak berkenaan. Saya faham bahawa kelulusan fakulti ini <b>bukan</b> kelulusan akhir JoC — saya perlu mendaftar tawaran di portal MySISWA@JoC selepas diluluskan.</span></label>
          ${errs.declaration_accepted ? `<div class="err" style="color:#dc2626;font-size:.8rem;margin-top:6px">${esc(errs.declaration_accepted)}</div>` : ''}
        </div>`;
    }
    const resub = a.status_code === 'AMEND_REQUIRED';
    shell(resub ? `Pindaan ${a.ref_no}` : 'Permohonan Baharu', `
      <div class="page-head"><div><h1>${resub ? 'Pinda permohonan' : 'Permohonan JOC baharu'}</h1><p class="muted">${esc(a.ref_no || 'Draf ' + a.application_id)} · <span id="save-ind">disimpan secara automatik</span></p></div>
        <a class="btn btn-sm" href="#/app/${a.application_id}">${ic('eye')} Lihat ringkasan</a></div>
      ${resub && lastReview ? `<div class="callout warn" style="margin-bottom:16px">${ic('edit')}<div class="body"><b>Ulasan TD HEPA (${fmtDate(lastReview.decided_at)}):</b> ${esc(lastReview.comments)}</div></div>` : ''}
      ${stepper}
      <div class="card"><form class="card-body" id="wf" novalidate>${body}</form>
        <div class="wizard-foot ${step === 5 ? 'final' : ''}">
          <div class="row">${step > 1 ? `<button class="btn" data-nav="${step - 1}">${ic('left')} Kembali</button>` : `<button class="btn" data-act-save>${ic('save')} Simpan draf</button>`}</div>
          <div class="row">${step < 5 ? `<button class="btn btn-primary" data-nav="${step + 1}">Seterusnya ${ic('right')}</button>` : `<button class="btn btn-primary" id="submit">${ic('send')} ${resub ? 'Hantar semula' : 'Hantar permohonan'}</button>`}</div>
        </div></div>`);
    bindStep(a, step);
  }

  function liveCalc(a, wc) {
    const cost = (Number(a.num_students) || 0) * (Number(a.hours_per_student) || 0) * Number(a.rate_per_hour);
    return `<div class="cost-box"><div><div class="small muted">Anggaran kos keseluruhan</div><div class="amt">${fmtRM(cost)}</div><div class="small muted">${a.num_students || 0} pelajar × ${a.hours_per_student || 0} jam × RM${Number(a.rate_per_hour).toFixed(2)}</div></div>
      ${wc ? `<div style="text-align:right"><div class="small muted">Purata seminggu (${wc.weeks.toFixed(1)} minggu)</div><div style="font-weight:800;font-size:1.15rem;color:${wc.over ? '#dc2626' : 'var(--st-ok)'}">${wc.perWeek.toFixed(1)} jam</div><div class="small muted">had ${wc.limit} jam</div></div>` : ''}</div>
      ${wc && wc.over ? `<div class="callout warn" style="margin-bottom:14px">${ic('alert')}<div class="body">Purata <b>${wc.perWeek.toFixed(1)} jam seminggu</b> melebihi had <b>${wc.limit} jam</b> bagi ${esc(label('PERIOD_TYPE', a.period_type_code)).toLowerCase()}. Kurangkan jumlah jam atau panjangkan tempoh. (Anda masih boleh menghantar, tetapi TD HEPA mungkin meminta pindaan.)</div></div>` : ''}`;
  }

  function studentsEditor(a, errs) {
    const n = Number(a.num_students) || 0;
    return `<div class="card"><div class="card-head"><h3>Senarai pelajar (${a.students.length}${n ? ' / ' + n : ''})</h3>
        <div class="row"><button class="btn btn-sm" type="button" id="paste">${ic('copy')} Tampal dari Excel</button><button class="btn btn-sm" type="button" id="add-stu">${ic('plus')} Tambah</button></div></div>
      <div class="table-wrap"><table class="stu-table"><thead><tr><th>#</th><th>No. matrik</th><th>Nama pelajar</th><th>Program pengajian</th><th></th></tr></thead><tbody>
        ${a.students.map((s, i) => `<tr><td>${i + 1}</td><td><input data-stu="${i}" data-col="0" value="${esc(s[0])}" inputmode="numeric" placeholder="No. matrik" aria-label="No. matrik"></td><td><input data-stu="${i}" data-col="1" value="${esc(s[1])}" placeholder="Nama pelajar" aria-label="Nama pelajar"></td><td><input data-stu="${i}" data-col="2" value="${esc(s[2])}" placeholder="Program pengajian" aria-label="Program pengajian"></td><td><button class="btn btn-ghost btn-icon btn-sm" type="button" data-del-stu="${i}" aria-label="Buang">${ic('x')}</button></td></tr>`).join('') || `<tr><td colspan="5" class="muted" style="text-align:center;padding:20px">Belum ada pelajar. Klik "Tambah" atau "Tampal dari Excel".</td></tr>`}
      </tbody></table></div></div>
      ${errs.students ? `<div class="err" style="color:#dc2626;font-size:.85rem;margin-top:8px">${esc(errs.students)}</div>` : ''}
      ${n && a.students.length && n !== a.students.length ? `<div class="callout warn" style="margin-top:12px">${ic('alert')}<div class="body">Bilangan pelajar dalam senarai (${a.students.length}) tidak sama dengan bilangan pelajar JOC yang dimohon (${n}).</div></div>` : ''}`;
  }

  function readForm(a) {
    const f = $('#wf'); if (!f) return;
    $$('input[name], select[name], textarea[name]', f).forEach(el => {
      if (el.readOnly) return;
      if (el.type === 'checkbox') a[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) a[el.name] = el.value; }
      else if (el.type === 'number') a[el.name] = el.value === '' ? '' : Number(el.value);
      else a[el.name] = el.value.trim();
    });
    $$('[data-stu]', f).forEach(el => { a.students[+el.dataset.stu][+el.dataset.col] = el.value.trim(); });
    a.estimated_cost = (Number(a.num_students) || 0) * (Number(a.hours_per_student) || 0) * Number(a.rate_per_hour);
    scheduleSave(a);
  }

  /** Re-render the step after a list change and save straight away. */
  function changed(a, step) { scheduleSave(a); renderStep(a, step, {}); flushSave(); }

  function bindStep(a, step) {
    const f = $('#wf');
    f.addEventListener('submit', (e) => e.preventDefault());
    f.addEventListener('input', () => {
      readForm(a);
      if (step === 2) $('#live').innerHTML = liveCalc(a, weeklyCheck(a));
    });
    f.addEventListener('change', (e) => { readForm(a); if (e.target.name === 'recruitment_mode') changed(a, step); });
    $$('[data-nav]').forEach(b => b.onclick = (e) => {
      e.preventDefault(); readForm(a);
      if (uploading) return toast('Tunggu sehingga semua fail selesai dimuat naik', 'err');
      const to = +b.dataset.nav;
      if (to > step) { const errs = validateStep(a, step); if (Object.keys(errs).length) { renderStep(a, step, errs); toast('Sila lengkapkan maklumat yang ditanda', 'err'); return; } }
      act(b, async () => { if (await flushSave()) go(`#/form/${a.application_id}?step=${to}`); });
    });
    const saveBtn = $('[data-act-save]'); if (saveBtn) saveBtn.onclick = (e) => { e.preventDefault(); readForm(a); act(saveBtn, async () => { if (await flushSave()) toast('Draf disimpan'); }); };

    if (step === 2) {
      const add = () => { const v = $('#scope-in').value.trim(); if (!v) return; readForm(a); a.scopes.push(v); changed(a, 2); $('#scope-in').focus(); };
      $('#scope-add').onclick = (e) => { e.preventDefault(); add(); };
      $('#scope-in').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } };
      $$('[data-del-scope]').forEach(b => b.onclick = (e) => { e.preventDefault(); readForm(a); a.scopes.splice(+b.dataset.delScope, 1); changed(a, 2); });
      const move = (i, d) => { readForm(a); const t = a.scopes[i]; a.scopes[i] = a.scopes[i + d]; a.scopes[i + d] = t; changed(a, 2); };
      $$('[data-up-scope]').forEach(b => b.onclick = (e) => { e.preventDefault(); move(+b.dataset.upScope, -1); });
      $$('[data-down-scope]').forEach(b => b.onclick = (e) => { e.preventDefault(); move(+b.dataset.downScope, 1); });
      $$('[data-edit-scope]').forEach(b => b.onclick = (e) => {
        e.preventDefault();
        const i = +b.dataset.editScope;
        const li = $(`[data-li="${i}"]`);
        li.innerHTML = `<span class="n">${i + 1}.</span><input type="text" class="scope-edit" value="${esc(a.scopes[i])}" aria-label="Sunting skop tugas"><button type="button" class="btn btn-sm btn-primary" data-ok>Simpan</button><button type="button" class="btn btn-sm" data-cancel>Batal</button>`;
        const inp = $('.scope-edit', li);
        inp.focus(); inp.select();
        const save = () => { const v = inp.value.trim(); if (v) { readForm(a); a.scopes[i] = v; changed(a, 2); } else renderStep(a, 2, {}); };
        inp.onkeydown = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); save(); } if (ev.key === 'Escape') { ev.preventDefault(); renderStep(a, 2, {}); } };
        $('[data-ok]', li).onclick = save;
        $('[data-cancel]', li).onclick = () => renderStep(a, 2, {});
      });
    }
    if (step === 3 && a.recruitment_mode === 'NAMED') {
      $('#add-stu').onclick = () => { readForm(a); a.students.push(['', '', '']); changed(a, 3); };
      $$('[data-del-stu]').forEach(b => b.onclick = () => { readForm(a); a.students.splice(+b.dataset.delStu, 1); changed(a, 3); });
      $('#paste').onclick = () => {
        const m = modal(`<div class="modal-head"><h3>Tampal dari Excel</h3><button class="btn btn-ghost btn-icon" data-close>${ic('x')}</button></div>
          <div class="modal-body"><p class="small muted" style="margin-bottom:10px">Salin 3 lajur dari Excel (No. matrik, Nama, Program) dan tampal di bawah. Satu pelajar setiap baris.</p>
          <textarea id="pt" rows="8" placeholder="231011234&#9;Nur Aisyah binti Ahmad&#9;RY46 Kejuruteraan Elektronik"></textarea></div>
          <div class="modal-foot"><button class="btn" data-close>Batal</button><button class="btn btn-primary" id="pt-ok">Tambah pelajar</button></div>`);
        $('#pt-ok', m).onclick = () => {
          readForm(a);
          const rows = $('#pt').value.split(/\r?\n/).map(l => l.split(/\t|,(?=\S)/).map(x => x.trim())).filter(r => r[0]);
          rows.forEach(r => a.students.push([r[0] || '', r[1] || '', r[2] || '']));
          closeModal(); changed(a, 3); toast(`${rows.length} pelajar ditambah`);
        };
      };
    }
    if (step === 4) {
      const readB64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
      const addFiles = async (files) => {
        readForm(a);
        const max = Number(S('MAX_UPLOAD_MB')) * 1024 * 1024;
        const ok = Array.from(files).filter(file => {
          if (file.size > max) { toast(`${file.name} melebihi ${S('MAX_UPLOAD_MB')}MB`, 'err'); return false; }
          if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) { toast(`${file.name}: hanya PDF, JPG atau PNG`, 'err'); return false; }
          return true;
        });
        // Show every file at once with an "uploading" state, then upload them one by one.
        const pendingRows = ok.map(file => ({ uploading: true, file_name: file.name, size: file.size, type: /emel|email/i.test(file.name) ? 'EMEL_KELULUSAN' : 'KERTAS_KERJA', file }));
        a.attachments.push(...pendingRows);
        uploading += pendingRows.length; blocking = uploading > 0;
        renderStep(a, 4, {});
        await flushSave();
        for (const row of pendingRows) {
          const att = await call(API.upload(a.application_id, { name: row.file.name, mime: row.file.type || 'application/octet-stream', size: row.file.size, data: IS_MOCK ? '' : await readB64(row.file) }, row.type));
          const idx = a.attachments.indexOf(row);
          if (att) a.attachments[idx] = att; else a.attachments.splice(idx, 1);
          uploading--; blocking = uploading > 0;
          if (location.hash.includes(`/form/${a.application_id}?step=4`)) renderStep(a, 4, {});
        }
      };
      $('#files').onchange = (e) => addFiles(e.target.files);
      const dz = $('#dz');
      dz.ondragover = (e) => { e.preventDefault(); dz.style.borderColor = 'var(--primary)'; };
      dz.ondragleave = () => { dz.style.borderColor = ''; };
      dz.ondrop = (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); };
      $$('[data-att-type]').forEach(s => s.onchange = () => { const f = a.attachments[+s.dataset.attType]; f.type = s.value; call(API.setAttachmentType(a.application_id, f.attachment_id, s.value)); });
      $$('[data-del-att]').forEach(b => b.onclick = async (e) => {
        e.preventDefault(); readForm(a);
        const f = a.attachments[+b.dataset.delAtt];
        if (await call(API.removeAttachment(a.application_id, f.attachment_id))) { a.attachments = a.attachments.filter(x => x !== f); renderStep(a, 4, {}); }
      });
    }
    if (step === 5) {
      $('#submit').onclick = async (e) => {
        e.preventDefault(); readForm(a);
        for (const s of [1, 2, 3, 4]) { const errs = validateStep(a, s); if (Object.keys(errs).length) { toast(`Langkah ${s} belum lengkap`, 'err'); return go(`#/form/${a.application_id}?step=${s}`); } }
        const errs = validateStep(a, 5); if (Object.keys(errs).length) return renderStep(a, 5, errs);
        const resub = a.status_code === 'AMEND_REQUIRED';
        if (!await confirmBox(resub ? 'Hantar semula permohonan?' : 'Hantar permohonan?', `<p>Permohonan akan dihantar kepada TD HEPA untuk semakan. Anda tidak boleh menyunting sehingga keputusan dibuat.</p>`, resub ? 'Hantar semula' : 'Hantar')) return;
        const ok = await act($('#submit'), async () => {
          if (!await flushSave()) return false;
          if (!apply(await call(API.submit(a.application_id)))) return false;
          await overlayDone(`Permohonan ${getApp(a.application_id).ref_no} berjaya dihantar`);
          return true;
        }, resub ? 'Menghantar semula permohonan…' : 'Menghantar permohonan…');
        if (ok) go(`#/app/${a.application_id}`);
      };
    }
  }

  // --------------------------------------------------------- summary view
  function appSummary(a, prevSnap) {
    const ch = (k, val, fmt) => {
      if (!prevSnap || !(k in prevSnap)) return val;
      const before = prevSnap[k];
      const same = Array.isArray(before) ? JSON.stringify(before) === JSON.stringify(a[k]) : String(before) === String(a[k]);
      return same ? val : `<span class="changed">${val}<span class="was">sebelum: ${esc(fmt ? fmt(before) : before)}</span></span>`;
    };
    const wc = weeklyCheck(a);
    const attNames = a.attachments.map(f => f.file_name);
    const attChanged = prevSnap && prevSnap.attachments && JSON.stringify(prevSnap.attachments) !== JSON.stringify(attNames);
    return `<div class="stack">
      <div class="card"><div class="card-head"><h3>Program</h3></div><div class="card-body"><dl class="dl">
        <dt>Nama program</dt><dd>${ch('programme_name', esc(a.programme_name))}</dd>
        <dt>Penganjur</dt><dd>${ch('organiser', esc(a.organiser))}</dd>
        <dt>Penerangan</dt><dd>${ch('description', esc(a.description))}</dd>
        <dt>Pemohon</dt><dd>${esc(userName(a.applicant_id))} · ${esc(deptName(a.department_id))}</dd>
        <dt>Jenis tawaran</dt><dd>${ch('offer_type_code', esc(label('OFFER_TYPE', a.offer_type_code)), c => label('OFFER_TYPE', c))}</dd>
        <dt>Tempoh latihan</dt><dd>${ch('period_type_code', esc(label('PERIOD_TYPE', a.period_type_code)), c => label('PERIOD_TYPE', c))}</dd>
      </dl></div></div>
      <div class="card"><div class="card-head"><h3>Keperluan JOC</h3><span class="tag">${fmtRM(a.estimated_cost)}</span></div><div class="card-body"><dl class="dl">
        <dt>Jawatan</dt><dd>${ch('job_title', esc(a.job_title))}</dd>
        <dt>Kategori</dt><dd>${ch('job_category_code', esc(label('JOB_CATEGORY', a.job_category_code)), c => label('JOB_CATEGORY', c))}</dd>
        <dt>Bilangan pelajar</dt><dd>${ch('num_students', esc(a.num_students))}</dd>
        <dt>Jam setiap pelajar</dt><dd>${ch('hours_per_student', esc(a.hours_per_student) + ' jam')}${wc ? ` <span class="small" style="color:${wc.over ? '#dc2626' : 'var(--muted)'}">(≈ ${wc.perWeek.toFixed(1)} jam/minggu, had ${wc.limit})</span>` : ''}</dd>
        <dt>Tempoh</dt><dd>${ch('start_date', fmtDate(a.start_date), fmtDate)} – ${ch('end_date', fmtDate(a.end_date), fmtDate)}</dd>
        <dt>Kadar</dt><dd>RM${Number(a.rate_per_hour).toFixed(2)} sejam</dd>
        <dt>Anggaran kos</dt><dd><b>${fmtRM(a.estimated_cost)}</b></dd>
        <dt>Skop tugas</dt><dd>${ch('scopes', `<ol style="margin:0;padding-left:18px">${a.scopes.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`, v => v.join('; '))}</dd>
      </dl></div></div>
      <div class="card"><div class="card-head"><h3>Pelajar</h3><span class="tag">${esc(label('RECRUIT_MODE', a.recruitment_mode))}</span></div>
        ${a.recruitment_mode === 'NAMED' ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>No. matrik</th><th>Nama</th><th>Program</th></tr></thead><tbody>${a.students.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s[0])}</td><td>${esc(s[1])}</td><td>${esc(s[2])}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Tiada</td></tr>'}</tbody></table></div>
          ${prevSnap && 'students' in prevSnap && prevSnap.students !== a.students.length ? `<div class="card-body small"><span class="changed">Bilangan dalam senarai: ${a.students.length}<span class="was">sebelum: ${prevSnap.students}</span></span></div>` : ''}`
          : '<div class="card-body muted">Pelajar akan direkrut melalui iklan terbuka di portal JoC.</div>'}
      </div>
      <div class="card"><div class="card-head"><h3>Bukti kelulusan</h3>${attChanged ? '<span class="badge st-AMEND_REQUIRED">Lampiran dikemas kini</span>' : ''}</div><div class="card-body stack" style="gap:8px">
        ${a.attachments.map(f => `<div class="file-row"><div class="fi">${esc((f.file_name.split('.').pop() || '').toUpperCase().slice(0, 4))}</div><div class="fn">${esc(f.file_name)}<div class="small muted">${esc(label('ATTACHMENT_TYPE', f.type))} · ${(f.size / 1024 / 1024).toFixed(2)} MB${prevSnap && prevSnap.attachments && !prevSnap.attachments.includes(f.file_name) ? ' · <b style="color:var(--st-amend)">BAHARU</b>' : ''}</div></div><button class="btn btn-sm" data-preview="${esc(f.attachment_id)}" data-name="${esc(f.file_name)}">${ic('eye')} Lihat</button></div>`).join('') || '<p class="muted">Tiada lampiran</p>'}
        <dl class="dl" style="margin-top:10px"><dt>Diluluskan oleh</dt><dd>${esc(a.proof_approved_by_name || '-')}${a.proof_approved_by_position ? ', ' + esc(a.proof_approved_by_position) : ''}</dd><dt>Tarikh kelulusan</dt><dd>${fmtDate(a.proof_approval_date)}</dd></dl>
      </div></div>
    </div>`;
  }

  function bindPreview() {
    $$('[data-preview]').forEach(b => b.onclick = async (e) => {
      e.preventDefault();
      if (!IS_MOCK) {
        // Files are private to fkten.digital, so the server streams them back to authorised users.
        const win = window.open('', '_blank');
        const f = await call(API.openAttachment(b.dataset.preview));
        if (!f) { if (win) win.close(); return; }
        const bytes = Uint8Array.from(atob(f.data), c => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: f.mime }));
        if (win) win.location.href = url; else downloadBlob(url, f.name);
        return;
      }
      modal(`<div class="modal-head"><h3>${esc(b.dataset.name)}</h3><button class="btn btn-ghost btn-icon" data-close>${ic('x')}</button></div>
        <div class="modal-body"><div class="empty" style="border:1px dashed var(--border);border-radius:12px">${ic('file')}<p>Pratonton fail dari Google Drive akan dipaparkan di sini dalam sistem sebenar.</p></div></div>`, { wide: true });
    });
  }

  function timelineHTML(a) {
    const dotCls = { SUBMIT: '', RESUBMIT: '', CREATE: 'grey', REQUEST_AMEND: 'warn', APPROVE: 'ok', LETTER_ISSUED: 'ok', REJECT: 'err', WITHDRAW: 'grey' };
    return `<ul class="timeline">${histOf(a.application_id).map(h => `<li><span class="dot ${dotCls[h.action_code] || ''}"></span>
      <div class="tt">${esc(label('ACTION', h.action_code))}${h.version_no ? ` <span class="small muted">· versi ${h.version_no}</span>` : ''}</div>
      <div class="tm">${fmtDT(h.created_at)} · ${esc(userName(h.actor_id))}</div>
      ${h.remarks ? `<div class="tc">${esc(h.remarks)}</div>` : ''}</li>`).join('')}</ul>`;
  }

  // -------------------------------------------------------- detail (applicant)
  route('/app/:id', (id) => {
    const a = getApp(id);
    if (!a || (a.applicant_id !== session.user_id && session.role === 'APPLICANT')) return go('#/my');
    const lastAmend = reviewsOf(id).filter(r => r.decision_code === 'AMEND').pop();
    const lastReject = reviewsOf(id).filter(r => r.decision_code === 'REJECT').pop();
    const letter = letterOf(id);
    const actions = [];
    if (editable(a) && a.applicant_id === session.user_id) actions.push(`<a class="btn btn-primary" href="#/form/${id}?step=1">${ic('edit')} ${a.status_code === 'DRAFT' ? 'Sambung isi' : 'Buat pindaan'}</a>`);
    if (a.version_no > 0 && session.role === 'APPLICANT') actions.push(`<button class="btn" id="dup">${ic('copy')} Salin</button>`);
    if (a.status_code === 'DRAFT') actions.push(`<button class="btn" id="del">${ic('trash')} Padam draf</button>`);
    shell(a.ref_no || 'Draf', `
      <div class="page-head"><div><div class="row" style="margin-bottom:6px">${badge(a.status_code)}<span class="small muted">${esc(a.ref_no || a.application_id)}</span></div><h1>${esc(a.programme_name || '(Tanpa nama)')}</h1></div><div class="row">${actions.join('')}</div></div>
      ${a.status_code === 'AMEND_REQUIRED' && lastAmend ? `<div class="callout warn" style="margin-bottom:16px">${ic('edit')}<div class="body"><b>Pindaan diminta oleh TD HEPA (${fmtDate(lastAmend.decided_at)}):</b><br>${esc(lastAmend.comments)}</div></div>` : ''}
      ${a.status_code === 'REJECTED' && lastReject ? `<div class="callout err" style="margin-bottom:16px">${ic('x')}<div class="body"><b>Tidak diluluskan:</b> ${esc(lastReject.comments)}</div></div>` : ''}
      ${pending(a) ? `<div class="callout info" style="margin-bottom:16px">${ic('clock')}<div class="body">Permohonan sedang disemak oleh TD HEPA. Anda akan dimaklumkan melalui emel.</div></div>` : ''}
      ${a.status_code === 'APPROVED' ? approvedPanel(a, letter) : ''}
      <div class="detail-grid">
        <div>${appSummary(a, null)}</div>
        <div class="card"><div class="card-head"><h3>Sejarah</h3></div><div class="card-body">${timelineHTML(a)}</div></div>
      </div>`);
    bindPreview();
    bindApproved(a, letter);
    if ($('#dup')) $('#dup').onclick = (e) => act(e.currentTarget, () => startNew(id));
    if ($('#del')) $('#del').onclick = async (e) => {
      const btn = e.currentTarget;
      if (!await confirmBox('Padam draf?', '<p>Draf ini akan dipadam.</p>', 'Padam', 'btn-danger')) return;
      if (await act(btn, async () => apply(await call(API.deleteDraft(id))), 'Memadam draf…')) { toast('Draf dipadam'); go('#/my'); }
    };
  });

  /** Fields in the same order as the JoC portal's "Tambah Tawaran Latihan" form. */
  function joCopyFields(a) {
    return [
      ['Jenis Latihan / Jawatan', a.job_title], ['Kategori Latihan', label('JOB_CATEGORY', a.job_category_code)],
      ['Kadar Bayaran (RM/Jam)', Number(a.rate_per_hour).toFixed(2)],
      // JoC adds job scope one item at a time, so each item is its own row
      ...a.scopes.map((s, i) => [`Skop Tugas ${i + 1}`, s]),
      ['Bilangan Pelatih', String(a.num_students)], ['Jenis Tempoh Latihan', label('PERIOD_TYPE', a.period_type_code)],
      ['Jam Latihan Individu', String(a.hours_per_student)], ['Jenis Tawaran', label('OFFER_TYPE', a.offer_type_code)],
      ['Tarikh Mula', fmtDate(a.start_date)], ['Tarikh Tamat', fmtDate(a.end_date)],
    ];
  }

  function approvedPanel(a, letter) {
    const isOwner = a.applicant_id === session.user_id;
    return `<div class="card" style="margin-bottom:20px;border-color:color-mix(in srgb, var(--st-ok) 40%, var(--border))">
      <div class="card-head"><div><h2>Diluluskan oleh fakulti ✓</h2><p class="small muted">${letter ? esc(letter.letter_ref_no) + ' · ' + fmtDate(letter.generated_at) : ''}</p></div>
        <div class="row"><button class="btn btn-primary" id="letter">${ic('download')} Surat kelulusan (PDF)</button><button class="btn" id="csv">${ic('download')} Maklumat untuk portal JoC (CSV)</button>${['REVIEWER', 'ADMIN'].includes(session.role) && letter ? `<button class="btn" id="regen">${ic('refresh')} Jana semula surat</button>` : ''}</div></div>
      ${letter && !IS_MOCK && !letter.drive_file_id ? `<div class="card-body" style="padding-bottom:0"><div class="callout warn">${ic('alert')}<div class="body">Surat PDF belum berjaya dijana.${['REVIEWER', 'ADMIN'].includes(session.role) ? ' Tekan <b>Jana semula surat</b>.' : ' TD HEPA akan menjananya semula.'}</div></div></div>` : ''}
      ${isOwner ? `<div class="card-body"><div class="callout ok">${ic('check')}<div class="body"><b>Langkah seterusnya:</b> daftar tawaran latihan di <a href="${JOC_PORTAL}" target="_blank" rel="noopener">portal MySISWA@JoC</a> (menu Penempatan Latihan → Tawaran Latihan → + Tambah Tawaran Latihan). Muat turun fail CSV — ia mengandungi semua maklumat yang diluluskan (dan senarai pelajar) mengikut susunan borang JoC, sedia untuk disalin.</div></div></div>` : ''}
    </div>`;
  }

  function bindApproved(a, letter) {
    if ($('#letter')) $('#letter').onclick = async (e) => {
      // the mock has no Drive, so it shows the HTML version of the letter
      if (IS_MOCK) return showLetter(a, letter);
      const win = window.open('', '_blank');
      const f = await act(e.currentTarget, () => call(API.getLetter(a.application_id)));
      if (!f) { if (win) win.close(); return; }
      const bytes = Uint8Array.from(atob(f.data), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: f.mime }));
      if (win) win.location.href = url; else downloadBlob(url, f.name);
    };
    if ($('#regen')) $('#regen').onclick = async (e) => {
      const btn = e.currentTarget;
      if (!await confirmBox('Jana semula surat?', `<p>Surat <b>${esc(letter.letter_ref_no)}</b> akan dijana semula menggunakan templat terkini. Nombor dan tarikh surat kekal sama; fail lama dipindahkan ke arkib.</p><p class="small muted">Tiada emel dihantar.</p>`, 'Jana semula')) return;
      if (await act(btn, async () => apply(await call(API.regenerateLetter(a.application_id))), 'Menjana surat…')) { toast('Surat dijana semula'); render(); }
    };
    if ($('#csv')) $('#csv').onclick = () => {
      const q = (x) => `"${String(x == null ? '' : x).replace(/"/g, '""')}"`;
      const rows = [['MAKLUMAT UNTUK PORTAL MySISWA@JoC', ''], ['Rujukan', a.ref_no], ['Program', a.programme_name], ['Surat kelulusan', letter ? letter.letter_ref_no : ''], ['', ''], ['Medan (ikut borang JoC)', 'Nilai']]
        .concat(joCopyFields(a));
      if (a.recruitment_mode === 'NAMED' && a.students.length) {
        rows.push(['', ''], ['SENARAI PELAJAR', ''], ['No. Matrik', 'Nama', 'Program']);
        a.students.forEach(s => rows.push(s));
      }
      downloadText(`${a.ref_no}_untuk_portal_JoC.csv`, rows.map(r => r.map(q).join(',')).join('\r\n'));
    };
  }

  function showLetter(a, letter) {
    const applicant = D().users.find(u => u.user_id === a.applicant_id);
    const html = `<div class="letter print-area">
      <div class="lh"><img src="${LOGO}" alt="UniMAP"><div class="fx">FAKULTI KEJURUTERAAN & TEKNOLOGI ELEKTRONIK<br>Kampus Tetap Pauh Putra, 02600 Arau, Perlis</div></div>
      <table style="border:0;width:auto;margin-bottom:12px"><tr><td style="border:0;padding:0 12px 0 0">Rujukan kami</td><td style="border:0;padding:0">: ${esc(letter ? letter.letter_ref_no : '-')}</td></tr><tr><td style="border:0;padding:0 12px 0 0">Tarikh</td><td style="border:0;padding:0">: ${fmtDate(letter ? letter.generated_at : TODAY())}</td></tr></table>
      <p><b>${esc(applicant.full_name)}</b><br>${esc(applicant.position || '')}<br>${esc(deptName(a.department_id))}<br>Fakulti Kejuruteraan & Teknologi Elektronik<br>Universiti Malaysia Perlis</p>
      <p style="margin-top:12px">Tuan/Puan,</p>
      <p style="margin-top:10px"><b>KELULUSAN PERINGKAT FAKULTI BAGI PERMOHONAN MySISWA JOB ON CAMPUS (JoC): ${esc(a.programme_name.toUpperCase())}</b></p>
      <p style="margin-top:10px">Dengan segala hormatnya perkara di atas adalah dirujuk.</p>
      <p style="margin-top:10px">2. Sukacita dimaklumkan bahawa permohonan tuan/puan (${esc(a.ref_no)}) telah <b>diluluskan</b> di peringkat Fakulti Kejuruteraan & Teknologi Elektronik dengan butiran berikut:</p>
      <table style="margin:10px 0"><tbody>
        <tr><td>Program</td><td>${esc(a.programme_name)}</td></tr><tr><td>Penganjur</td><td>${esc(a.organiser)}</td></tr>
        <tr><td>Jawatan / Kategori</td><td>${esc(a.job_title)} / ${esc(label('JOB_CATEGORY', a.job_category_code))}</td></tr>
        <tr><td>Bilangan pelajar</td><td>${esc(a.num_students)} orang</td></tr><tr><td>Jam setiap pelajar</td><td>${esc(a.hours_per_student)} jam (${esc(label('PERIOD_TYPE', a.period_type_code))})</td></tr>
        <tr><td>Tempoh</td><td>${fmtDate(a.start_date)} hingga ${fmtDate(a.end_date)}</td></tr><tr><td>Kadar / Anggaran kos</td><td>RM${Number(a.rate_per_hour).toFixed(2)} sejam / ${fmtRM(a.estimated_cost)}</td></tr>
        <tr><td>Bukti kelulusan program</td><td>${esc(a.attachments.map(f => f.file_name).join('; '))} (diluluskan oleh ${esc(a.proof_approved_by_name)}, ${fmtDate(a.proof_approval_date)})</td></tr>
      </tbody></table>
      <p>3. Tuan/puan dipohon untuk mendaftar tawaran latihan ini di portal MySISWA@JoC (joc.mohe.gov.my) berdasarkan butiran yang diluluskan di atas untuk tindakan selanjutnya oleh CGEE.</p>
      <p style="margin-top:10px">Sekian, terima kasih.</p>
      <p style="margin-top:10px"><b>"MALAYSIA MADANI"</b><br><b>"BERKHIDMAT UNTUK NEGARA"</b></p>
      <p style="margin-top:14px">Saya yang menjalankan amanah,<br><br><b>${esc(S('SIGNATORY_NAME'))}</b><br>${esc(S('SIGNATORY_TITLE'))}<br>Fakulti Kejuruteraan & Teknologi Elektronik (FKTEN)<br>Universiti Malaysia Perlis (UniMAP)</p>
      <p style="margin-top:10px">s.k.: ${esc(S('CGEE_NAME'))}</p>
      <div class="foot">Surat ini dijana oleh komputer, tiada tandatangan diperlukan.</div>
    </div>`;
    modal(`<div class="modal-head"><h3>Surat kelulusan</h3><button class="btn btn-ghost btn-icon" data-close>${ic('x')}</button></div><div class="modal-body" style="background:var(--surface-2)">${html}</div>
      <div class="modal-foot"><button class="btn" data-close>Tutup</button><button class="btn btn-primary" id="print">${ic('download')} Cetak / Simpan PDF</button></div>`, { wide: true });
    $('#print').onclick = () => window.print();
  }

  // ---------------------------------------------------------------- reviewer
  function reviewerHome() {
    const apps = D().applications.filter(a => a.version_no > 0 && !a.is_deleted);
    const q = apps.filter(pending).sort((a, b) => a.last_submitted_at.localeCompare(b.last_submitted_at));
    const y = apps.filter(a => a.status_code === 'APPROVED');
    shell('Laman Utama', `
      ${hero(`${roleName('REVIEWER')} · Permohonan JOC FKTEN ${TODAY().slice(0, 4)}`,
        [['p-sub', `${q.length} menunggu semakan`, '#/review'], ['p-amend', `${apps.filter(a => a.status_code === 'AMEND_REQUIRED').length} perlu pindaan`, '#/review?tab=AMEND_REQUIRED'], ['p-ok', `${y.length} lulus`, '#/review?tab=APPROVED']],
        `<a class="btn btn-gold" href="#/review">${ic('inbox')} Buka senarai semakan</a>`)}
      <div class="kpis">
        ${kpi('Menunggu semakan', q.length, q.length ? 'paling lama ' + daysBetween(q[0].last_submitted_at, TODAY()) + ' hari' : 'tiada', 'c-sub', 'clock')}
        ${kpi('Diluluskan', y.length, fmtNum(y.reduce((s, a) => s + Number(a.num_students), 0)) + ' tempat JOC', 'c-ok', 'check')}
        ${kpi('Jumlah jam diluluskan', y.reduce((s, a) => s + a.num_students * a.hours_per_student, 0), 'jam pelajar', 'c-gold', 'chart')}
        ${kpi('Anggaran kos diluluskan', fmtRM(y.reduce((s, a) => s + a.estimated_cost, 0)), 'RM6 sejam', 'c-draft', 'list', true)}
      </div>
      <div class="card"><div class="card-head"><h2>Menunggu semakan</h2><a class="btn btn-sm" href="#/review">Lihat semua</a></div>
        <div class="app-list">${q.map(a => appItem(a, `#/review/${a.application_id}`)).join('') || emptyState('Tiada permohonan menunggu. 🎉')}</div></div>`);
  }

  function listPage(title, base, filterFn) {
    const st = new URLSearchParams(location.hash.split('?')[1] || '');
    const tab = st.get('tab') || (base === '#/review' ? 'pending' : 'all');
    const dept = st.get('dept') || '';
    const qtxt = (st.get('q') || '').toLowerCase();
    let apps = D().applications.filter(a => a.version_no > 0 && !a.is_deleted).filter(filterFn || (() => true));
    const tabs = [['pending', 'Menunggu', pending], ['AMEND_REQUIRED', 'Perlu pindaan', a => a.status_code === 'AMEND_REQUIRED'], ['APPROVED', 'Lulus', a => a.status_code === 'APPROVED'], ['REJECTED', 'Ditolak', a => a.status_code === 'REJECTED'], ['all', 'Semua', () => true]];
    const tf = tabs.find(t => t[0] === tab) || tabs[4];
    apps = apps.filter(tf[2]).filter(a => !dept || a.department_id === dept).filter(a => !qtxt || (a.programme_name + a.ref_no + userName(a.applicant_id)).toLowerCase().includes(qtxt));
    apps.sort((a, b) => tab === 'pending' ? a.last_submitted_at.localeCompare(b.last_submitted_at) : b.last_submitted_at.localeCompare(a.last_submitted_at));
    const qs = (o) => '?' + new URLSearchParams(Object.assign({ tab, dept, q: st.get('q') || '' }, o)).toString();
    shell(title, `
      <div class="page-head"><div><h1>${title}</h1><p class="muted">${apps.length} permohonan</p></div>
        ${session.role !== 'APPLICANT' ? `<button class="btn" id="exp">${ic('download')} Eksport CSV</button>` : ''}</div>
      <div class="row" style="margin-bottom:14px"><div class="tabs">${tabs.map(t => `<button class="${t[0] === tab ? 'on' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div></div>
      <div class="row" style="margin-bottom:14px">
        <input type="text" id="q" placeholder="Cari program, rujukan atau pemohon" value="${esc(st.get('q') || '')}" style="max-width:340px">
        <select id="dept" style="max-width:280px"><option value="">Semua jabatan</option>${D().departments.map(d => `<option value="${d.department_id}" ${d.department_id === dept ? 'selected' : ''}>${esc(d.code)} – ${esc(d.name)}</option>`).join('')}</select>
      </div>
      <div class="card"><div class="app-list">${apps.map(a => {
        const days = pending(a) ? daysBetween(a.last_submitted_at, TODAY()) : 0;
        const waited = pending(a) ? `<span><b style="color:${days > 5 ? '#dc2626' : 'inherit'}">${days} hari menunggu</b></span>` : '';
        return appItem(a, `${session.role === 'REVIEWER' ? '#/review/' : '#/app/'}${a.application_id}`, `<span>${esc(userName(a.applicant_id))}</span>${waited}`);
      }).join('') || emptyState('Tiada permohonan dalam senarai ini.')}</div></div>`);
    $$('[data-tab]').forEach(b => b.onclick = () => go(base + qs({ tab: b.dataset.tab })));
    $('#dept').onchange = (e) => go(base + qs({ dept: e.target.value }));
    $('#q').onkeydown = (e) => { if (e.key === 'Enter') go(base + qs({ q: e.target.value })); };
    if ($('#exp')) $('#exp').onclick = () => exportCSV(apps);
  }

  route('/review', () => listPage('Senarai Semakan', '#/review'), { roles: ['REVIEWER'] });
  route('/all', () => listPage('Semua Permohonan', '#/all'), { roles: ['REVIEWER', 'VIEWER'] });

  route('/review/:id', (id) => {
    const a = getApp(id);
    if (!a || a.version_no === 0) return go('#/review');
    const own = a.applicant_id === session.user_id;
    const prevSubmit = a.status_code === 'RESUBMITTED' ? histOf(id).filter(h => (h.action_code === 'SUBMIT' || h.action_code === 'RESUBMIT') && h.version_no === a.version_no - 1).pop() : null;
    const prevSnap = prevSubmit && prevSubmit.snapshot;
    const prevReview = reviewsOf(id).pop();
    const wc = weeklyCheck(a);
    const flags = [];
    if (wc && wc.over) flags.push(`Purata ${wc.perWeek.toFixed(1)} jam/minggu melebihi had ${wc.limit} jam.`);
    if (a.recruitment_mode === 'NAMED' && a.students.length !== Number(a.num_students)) flags.push(`Senarai pelajar (${a.students.length}) ≠ bilangan dimohon (${a.num_students}).`);
    if (!a.attachments.some(f => f.type !== 'LAIN')) flags.push('Tiada kertas kerja / emel / surat kelulusan rasmi dilampirkan.');
    const decisionPanel = pending(a) ? (own
      ? `<div class="callout warn">${ic('shield')}<div class="body">Ini permohonan anda sendiri. Keputusan mesti dibuat oleh penyemak lain atau Pentadbir.</div></div>`
      : `<h3 style="margin-bottom:12px">Keputusan</h3>
        <div class="decision-btns">
          <button class="btn" data-dec="AMEND">${ic('edit')} Pindaan</button>
          <button class="btn" data-dec="APPROVE">${ic('check')} Lulus</button>
          <button class="btn" data-dec="REJECT">${ic('x')} Tolak</button></div>
        <label class="field"><span>Ulasan kepada pemohon <span id="req" class="req hidden">*</span></span><textarea id="cmt" rows="4" placeholder="Wajib bagi Pindaan dan Tolak"></textarea></label>
        <button class="btn btn-primary" id="dec-go" style="width:100%" disabled>Pilih keputusan</button>
        <p class="small muted" style="margin-top:10px">Lulus akan menjana surat kelulusan dan menghantar emel kepada pemohon & CGEE (mod emel semasa: <b>${esc(S('EMAIL_MODE'))}</b>).</p>`)
      : `<div class="row" style="margin-bottom:8px">${badge(a.status_code)}</div><p class="small muted">Tiada tindakan diperlukan.</p>`;
    shell(`Semakan ${a.ref_no}`, `
      <div class="page-head"><div><div class="row" style="margin-bottom:6px">${badge(a.status_code)}<span class="small muted">${esc(a.ref_no)} · versi ${a.version_no} · dihantar ${fmtDT(a.last_submitted_at)}</span></div><h1>${esc(a.programme_name)}</h1><p class="muted">${esc(userName(a.applicant_id))} · ${esc(deptName(a.department_id))}</p></div>
        <div class="row"><a class="btn btn-sm" href="#/review">${ic('left')} Senarai</a>${pending(a) ? `<button class="btn btn-sm btn-primary show-sm" id="jump">Buat keputusan ↓</button>` : ''}</div></div>
      ${prevSnap ? `<div class="callout info" style="margin-bottom:16px">${ic('refresh')}<div class="body"><b>Dihantar semula.</b> Medan yang berubah sejak versi ${a.version_no - 1} ditanda <span class="changed">kuning</span>.${prevReview && prevReview.decision_code === 'AMEND' ? `<br><span class="small">Ulasan anda sebelum ini: “${esc(prevReview.comments)}”</span>` : ''}</div></div>` : ''}
      ${flags.length && pending(a) ? `<div class="callout warn" style="margin-bottom:16px">${ic('alert')}<div class="body"><b>Semakan automatik:</b><ul style="margin:6px 0 0;padding-left:18px">${flags.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div></div>` : ''}
      ${a.status_code === 'APPROVED' ? approvedPanel(a, letterOf(id)) : ''}
      <div class="detail-grid">
        <div>${appSummary(a, prevSnap)}</div>
        <div class="stack"><div class="card card-pad decision">${decisionPanel}</div>
          <div class="card"><div class="card-head"><h3>Sejarah</h3></div><div class="card-body">${timelineHTML(a)}</div></div></div>
      </div>`);
    bindPreview();
    bindApproved(a, letterOf(id));
    if ($('#jump')) $('#jump').onclick = () => $('.decision').scrollIntoView({ behavior: 'smooth', block: 'start' });
    let choice = null;
    const labels = { AMEND: 'Minta pindaan', APPROVE: 'Luluskan permohonan', REJECT: 'Tolak permohonan' };
    $$('[data-dec]').forEach(b => b.onclick = () => {
      choice = b.dataset.dec;
      $$('[data-dec]').forEach(x => x.className = 'btn' + (x === b ? ' sel-' + choice : ''));
      $('#req').classList.toggle('hidden', choice === 'APPROVE');
      const go_ = $('#dec-go'); go_.disabled = false; go_.textContent = labels[choice];
      go_.className = 'btn ' + (choice === 'APPROVE' ? 'btn-ok' : choice === 'AMEND' ? 'btn-warn' : 'btn-danger');
      go_.style.width = '100%';
    });
    if ($('#dec-go')) $('#dec-go').onclick = async () => {
      const c = $('#cmt').value.trim();
      if (choice !== 'APPROVE' && !c) { $('#cmt').focus(); return toast('Ulasan wajib bagi Pindaan dan Tolak', 'err'); }
      const body = { AMEND: `<p>Permohonan akan dikembalikan kepada <b>${esc(userName(a.applicant_id))}</b> untuk pindaan.</p>`, APPROVE: `<p>Surat kelulusan akan dijana dan emel dihantar kepada pemohon serta <b>CGEE (${esc(S('CGEE_EMAIL'))})</b>.</p><p class="small muted" style="margin-top:8px">Mod emel: ${esc(S('EMAIL_MODE'))}${S('EMAIL_MODE') === 'OFF' ? ' — emel hanya direkod dalam log, tidak dihantar.' : ''}</p>`, REJECT: '<p>Permohonan akan ditolak. Pemohon boleh membuat permohonan baharu jika perlu.</p>' }[choice];
      if (!await confirmBox(labels[choice] + '?', body, labels[choice], choice === 'APPROVE' ? 'btn-ok' : choice === 'AMEND' ? 'btn-warn' : 'btn-danger')) return;
      const done = await act($('#dec-go'), async () => {
        if (!apply(await call(API.decide(id, choice, c)))) return false;
        await overlayDone({ AMEND: 'Pindaan diminta', APPROVE: 'Permohonan diluluskan', REJECT: 'Permohonan ditolak' }[choice]);
        return true;
      }, { AMEND: 'Menghantar permintaan pindaan…', APPROVE: 'Meluluskan permohonan & menjana surat…', REJECT: 'Menolak permohonan…' }[choice]);
      if (!done) return;
      toast({ AMEND: 'Pindaan diminta', APPROVE: 'Permohonan diluluskan · surat dijana', REJECT: 'Permohonan ditolak' }[choice]);
      go(`#/review/${id}`);
    };
  }, { roles: ['REVIEWER'] });

  function exportCSV(apps) {
    const head = ['ref_no', 'programme_name', 'organiser', 'applicant', 'department', 'status', 'job_title', 'job_category', 'num_students', 'hours_per_student', 'estimated_cost', 'start_date', 'end_date', 'last_submitted_at', 'decided_at'];
    const rows = apps.map(a => [a.ref_no, a.programme_name, a.organiser, userName(a.applicant_id), deptCode(a.department_id), label('APP_STATUS', a.status_code), a.job_title, label('JOB_CATEGORY', a.job_category_code), a.num_students, a.hours_per_student, a.estimated_cost, a.start_date, a.end_date, a.last_submitted_at, a.decided_at]);
    downloadText(`JOC_FKTEN_${TODAY()}.csv`, [head].concat(rows).map(r => r.map(x => `"${String(x == null ? '' : x).replace(/"/g, '""')}"`).join(',')).join('\n'));
    toast('Fail CSV dimuat turun');
  }

  // ---------------------------------------------------------------- reports
  function reportsPage(title) {
    const apps = D().applications.filter(a => a.version_no > 0 && !a.is_deleted);
    const ok = apps.filter(a => a.status_code === 'APPROVED');
    const byDept = D().departments.map(d => [d.code, apps.filter(a => a.department_id === d.department_id).length, ok.filter(a => a.department_id === d.department_id).reduce((s, a) => s + a.estimated_cost, 0)]);
    const byStatus = LK('APP_STATUS').filter(([c]) => c !== 'DRAFT').map(([c, l]) => [c, l, apps.filter(a => a.status_code === c).length]);
    const months = Array.from({ length: 12 }, (_, i) => [BULAN[i], apps.filter(a => a.first_submitted_at && +a.first_submitted_at.slice(5, 7) === i + 1 && a.first_submitted_at.startsWith(TODAY().slice(0, 4))).length]);
    const maxD = Math.max(1, ...byDept.map(x => x[1])), maxS = Math.max(1, ...byStatus.map(x => x[2])), maxM = Math.max(1, ...months.map(x => x[1]));
    const statusColor = { SUBMITTED: 'var(--st-sub)', RESUBMITTED: 'var(--st-sub)', AMEND_REQUIRED: '#d97706', APPROVED: '#16a34a', REJECTED: '#dc2626', WITHDRAWN: '#94a3b8' };
    shell(title, `
      <div class="page-head"><div><h1>Laporan JOC FKTEN ${TODAY().slice(0, 4)}</h1><p class="muted">Data dikemas kini secara langsung daripada pangkalan data sistem.</p></div><button class="btn" id="exp">${ic('download')} Eksport CSV</button></div>
      <div class="kpis">
        ${kpi('Permohonan dihantar', apps.length, apps.filter(pending).length + ' dalam semakan', 'c-sub', 'send')}
        ${kpi('Diluluskan', ok.length, (apps.length ? Math.round(ok.length / apps.length * 100) : 0) + '% kadar kelulusan', 'c-ok', 'check')}
        ${kpi('Tempat JOC diluluskan', ok.reduce((s, a) => s + Number(a.num_students), 0), fmtNum(ok.reduce((s, a) => s + a.num_students * a.hours_per_student, 0)) + ' jam pelajar', 'c-gold', 'users')}
        ${kpi('Anggaran kos diluluskan', fmtRM(ok.reduce((s, a) => s + a.estimated_cost, 0)), 'kadar RM6 sejam', 'c-draft', 'chart', true)}
      </div>
      <div class="grid-2" style="gap:16px">
        <div class="card"><div class="card-head"><h3>Permohonan mengikut jabatan</h3></div><div class="card-body bars">${byDept.map(([c, n, cost]) => `<div class="bar-row"><span>${esc(c)} <span class="small muted">${fmtRM(cost)}</span></span><div class="bar-track"><div class="bar-fill" style="width:${n / maxD * 100}%"></div></div><span class="v">${n}</span></div>`).join('')}</div></div>
        <div class="card"><div class="card-head"><h3>Mengikut status</h3></div><div class="card-body bars">${byStatus.map(([c, l, n]) => `<div class="bar-row"><span>${esc(l)}</span><div class="bar-track"><div class="bar-fill" style="width:${n / maxS * 100}%;background:${statusColor[c]}"></div></div><span class="v">${n}</span></div>`).join('')}</div></div>
      </div>
      <div class="card" style="margin-top:16px"><div class="card-head"><h3>Permohonan dihantar mengikut bulan</h3></div><div class="card-body"><div class="cols">${months.map(([m, n]) => `<div class="c"><span class="n">${n || ''}</span><div class="b" style="height:${n / maxM * 100}%"></div><span class="l">${m}</span></div>`).join('')}</div></div></div>`);
    $('#exp').onclick = () => exportCSV(apps);
  }
  route('/reports', () => reportsPage('Laporan'), { roles: ['REVIEWER', 'ADMIN', 'VIEWER'] });

  // ------------------------------------------------------------------ admin
  function adminHome() {
    const d = D();
    shell('Laman Utama', `
      ${hero(`${roleName('ADMIN')} · Urus pengguna, senarai pilihan, tetapan dan emel`,
        [['p-draft', `Mod emel: ${S('EMAIL_MODE')}`, '#/admin/settings'], [S('CGEE_ENABLED') === 'YA' ? 'p-ok' : 'p-amend', `CGEE: ${S('CGEE_ENABLED') || 'TIDAK'}`, '#/admin/settings'], ['p-sub', `${d.users.length} pengguna`, '#/admin/users']],
        `<a class="btn btn-gold" href="#/admin/settings">${ic('sliders')} Tetapan</a>`)}
      <div class="callout ${S('EMAIL_MODE') === 'LIVE' ? 'ok' : 'warn'}" style="margin-bottom:16px">${ic('mail')}<div class="body">Mod emel: <b>${esc(S('EMAIL_MODE'))}</b> — ${{ OFF: 'emel hanya direkod dalam log, tiada emel dihantar (fasa ujian).', TEST: 'semua emel dihantar ke ' + esc(S('TEST_EMAIL_TO')) + ' sahaja.', LIVE: 'emel dihantar kepada penerima sebenar.' }[S('EMAIL_MODE')]} <a href="#/admin/settings">Tukar</a></div></div>
      <div class="kpis">
        ${kpi('Pengguna', d.users.length, d.user_roles.filter(r => r.role_code === 'REVIEWER' && r.is_active).length + ' penyemak', 'c-sub', 'users')}
        ${kpi('Permohonan', d.applications.filter(a => !a.is_deleted).length, 'termasuk draf', 'c-draft', 'file')}
        ${kpi('Emel dalam log', d.email_log.length, d.email_log.filter(e => e.send_status === 'LOGGED').length + ' tidak dihantar (OFF)', 'c-gold', 'mail')}
        ${kpi('Surat kelulusan', d.approval_letters.length, 'dijana', 'c-ok', 'check')}
      </div>
      <div class="grid-2" style="gap:16px">${[['#/admin/users', 'users', 'Pengguna & Peranan', 'Tambah penyemak, pentadbir atau pemerhati.'], ['#/admin/lists', 'list', 'Senarai Pilihan', 'Jabatan dan pilihan dropdown.'], ['#/admin/settings', 'sliders', 'Tetapan', 'Suis emel, emel CGEE, rujukan surat, had jam.'], ['#/admin/emails', 'mail', 'Log Emel', 'Semua emel yang dijana oleh sistem.']]
        .map(([h, i, t, s]) => `<a class="role-card" href="${h}" style="text-decoration:none"><div class="ri">${ic(i)}</div><h3>${t}</h3><p class="small muted" style="margin-top:6px">${s}</p></a>`).join('')}</div>`);
  }

  route('/admin/users', () => {
    const d = D();
    const ROLE_COLS = ['REVIEWER', 'ADMIN', 'VIEWER'];
    shell('Pengguna & Peranan', `
      <div class="page-head"><div><h1>Pengguna & Peranan</h1><p class="muted">Semua staf @unimap.edu.my menjadi <b>Pemohon</b> secara automatik selepas log masuk pertama.</p></div><button class="btn btn-primary" id="add">${ic('plus')} Tambah pengguna</button></div>
      <div class="card"><div class="table-wrap"><table><thead><tr><th>Pengguna</th><th>Jabatan</th>${ROLE_COLS.map(r => `<th>${esc(roleName(r))}</th>`).join('')}<th>Aktif</th></tr></thead><tbody>
        ${d.users.map(u => { const rs = rolesOf(u.user_id); return `<tr><td><b>${esc(u.full_name)}</b><div class="small muted">${esc(u.email)}</div></td><td>${esc(deptCode(u.department_id))}</td>
          ${ROLE_COLS.map(r => `<td><input type="checkbox" data-u="${u.user_id}" data-r="${r}" ${rs.includes(r) ? 'checked' : ''} ${u.user_id === session.user_id && r === 'ADMIN' ? 'disabled title="Tidak boleh buang peranan sendiri"' : ''} aria-label="${r}"></td>`).join('')}
          <td><input type="checkbox" data-active="${u.user_id}" ${u.is_active ? 'checked' : ''} ${u.user_id === session.user_id ? 'disabled' : ''} aria-label="Aktif"></td></tr>`; }).join('')}
      </tbody></table></div></div>`);
    $$('[data-r]').forEach(cb => cb.onchange = async () => {
      const { u, r } = cb.dataset;
      if (!apply(await call(API.setRole(u, r, cb.checked)))) { cb.checked = !cb.checked; return; }
      toast(`${roleName(r)} ${cb.checked ? 'ditambah' : 'dibuang'} · ${userName(u)}`);
    });
    $$('[data-active]').forEach(cb => cb.onchange = async () => {
      if (!apply(await call(API.setActive(cb.dataset.active, cb.checked)))) { cb.checked = !cb.checked; return; }
      toast(cb.checked ? 'Pengguna diaktifkan' : 'Pengguna dinyahaktifkan');
    });
    $('#add').onclick = () => {
      const m = modal(`<div class="modal-head"><h3>Tambah pengguna</h3><button class="btn btn-ghost btn-icon" data-close>${ic('x')}</button></div><div class="modal-body">
        <label class="field"><span>Emel UniMAP <span class="req">*</span></span><input type="email" id="nu-em" placeholder="nama@unimap.edu.my"></label>
        <label class="field"><span>Nama penuh <span class="req">*</span></span><input type="text" id="nu-nm"></label>
        <label class="field"><span>Peranan</span><select id="nu-r"><option value="REVIEWER">Penyemak</option><option value="ADMIN">Pentadbir Sistem</option><option value="VIEWER">Pemerhati</option></select></label></div>
        <div class="modal-foot"><button class="btn" data-close>Batal</button><button class="btn btn-primary" id="nu-ok">Tambah</button></div>`);
      $('#nu-ok', m).onclick = (ev) => act(ev.currentTarget, async () => {
        const em = $('#nu-em').value.trim().toLowerCase(), nm = $('#nu-nm').value.trim();
        if (!em.endsWith('@unimap.edu.my') || !nm) return toast('Emel mesti @unimap.edu.my dan nama wajib diisi', 'err');
        if (d.users.some(u => u.email === em)) return toast('Pengguna sudah wujud', 'err');
        if (!apply(await call(API.addUser(em, nm, $('#nu-r').value)))) return;
        closeModal(); toast('Pengguna ditambah'); render();
      });
    };
  }, { roles: ['ADMIN'] });

  route('/admin/lists', () => {
    const d = D();
    shell('Senarai Pilihan', `
      <div class="page-head"><div><h1>Senarai Pilihan</h1><p class="muted">Jabatan boleh ditambah. Pilihan JoC mengikut portal KPT (baca sahaja).</p></div></div>
      <div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Jabatan / unit FKTEN</h3><button class="btn btn-sm" id="add-dep">${ic('plus')} Tambah</button></div>
        <div class="table-wrap"><table><thead><tr><th>Kod</th><th>Nama</th><th>Aktif</th></tr></thead><tbody>${d.departments.map(x => `<tr><td><b>${esc(x.code)}</b></td><td>${esc(x.name)}</td><td>${x.is_active ? 'Ya' : 'Tidak'}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="grid-2" style="gap:16px">${['JOB_CATEGORY', 'OFFER_TYPE', 'PERIOD_TYPE', 'ATTACHMENT_TYPE'].map(t => `<div class="card"><div class="card-head"><h3>${t}</h3></div><div class="card-body"><div class="clusters">${LK(t).map(([c, l]) => `<span class="tag" title="${c}">${esc(l)}</span>`).join('')}</div></div></div>`).join('')}</div>`);
    $('#add-dep').onclick = () => {
      const m = modal(`<div class="modal-head"><h3>Tambah jabatan / unit</h3></div><div class="modal-body"><div class="grid-2"><label class="field"><span>Kod</span><input id="dc" maxlength="6"></label><label class="field"><span>Nama</span><input id="dn"></label></div></div><div class="modal-foot"><button class="btn" data-close>Batal</button><button class="btn btn-primary" id="dok">Tambah</button></div>`);
      $('#dok', m).onclick = (ev) => act(ev.currentTarget, async () => { const c = $('#dc').value.trim().toUpperCase(), n = $('#dn').value.trim(); if (!c || !n) return toast('Kod dan nama wajib', 'err'); if (!apply(await call(API.addDepartment(c, n)))) return; closeModal(); render(); toast('Jabatan ditambah'); });
    };
  }, { roles: ['ADMIN'] });

  route('/admin/settings', () => {
    const keys = [['CGEE_EMAIL', 'Emel CGEE'], ['CGEE_NAME', 'Nama CGEE (paparan)'], ['TEST_EMAIL_TO', 'Penerima emel mod TEST'], ['LETTER_REF_PREFIX', 'Awalan rujukan surat'], ['APP_REF_PREFIX', 'Awalan rujukan permohonan'], ['DEFAULT_RATE_PER_HOUR', 'Kadar RM sejam'], ['MAX_HOURS_WEEK_SEMESTER', 'Had jam/minggu (semester)'], ['MAX_HOURS_WEEK_BREAK', 'Had jam/minggu (cuti)'], ['MIN_CGPA', 'PNGK minimum pelajar'], ['MAX_UPLOAD_MB', 'Saiz maks fail (MB)'], ['SIGNATORY_NAME', 'Nama penandatangan surat'], ['SIGNATORY_TITLE', 'Jawatan penandatangan'], ['GOOGLE_SITE_URL', 'Pautan Google Site']];
    shell('Tetapan', `
      <div class="page-head"><div><h1>Tetapan Sistem</h1><p class="muted">Perubahan direkod dalam log audit.</p></div></div>
      <div class="callout info" style="margin-bottom:16px">${ic('mail')}<div class="body"><b>Siapa menerima emel:</b> permohonan baharu / dihantar semula → <b>semua Penyemak</b>. Pindaan / Tolak → pemohon (s.k. semua Penyemak). Lulus → pemohon (s.k. semua Penyemak) dan <b>CGEE</b> (hanya jika suis CGEE = YA). Senarai Penyemak diambil daripada <a href="#/admin/users">Pengguna &amp; Peranan</a>.</div></div>
      <div class="card card-pad" style="margin-bottom:16px"><h3>Suis emel</h3><p class="small muted" style="margin:4px 0 12px">OFF = rekod sahaja · TEST = hantar semua ke penerima ujian · LIVE = hantar kepada penerima sebenar (CGEE ikut suis di bawah)</p>
        <div class="seg" id="seg">${['OFF', 'TEST', 'LIVE'].map(m => `<button data-mode="${m}" class="${S('EMAIL_MODE') === m ? 'on' : ''}">${m}</button>`).join('')}</div></div>
      <div class="card card-pad" style="margin-bottom:16px"><h3>Hantar kepada CGEE</h3><p class="small muted" style="margin:4px 0 12px">TIDAK = emel kelulusan kepada CGEE hanya direkod dalam log (untuk ujian dengan pemohon &amp; TD HEPA). YA = CGEE menerima emel kelulusan (apabila mod emel TEST/LIVE).</p>
        <div class="seg">${['TIDAK', 'YA'].map(m => `<button data-cgee="${m}" class="${(S('CGEE_ENABLED') || 'TIDAK') === m ? 'on' : ''}">${m}</button>`).join('')}</div></div>
      <div class="card"><form class="card-body" id="sf"><div class="grid-2">${keys.map(([k, l]) => `<label class="field"><span>${l}</span><input name="${k}" value="${esc(S(k))}"></label>`).join('')}</div>
        <div class="row end"><button class="btn btn-primary" id="save">${ic('save')} Simpan tetapan</button></div></form></div>`);
    $$('[data-mode]').forEach(b => b.onclick = async () => {
      const m = b.dataset.mode;
      const cgeeOn = S('CGEE_ENABLED') === 'YA';
      if (m === 'LIVE' && !await confirmBox('Hidupkan emel LIVE?', `<p>Emel akan dihantar kepada pemohon dan semua Penyemak yang sebenar${cgeeOn ? ', <b>termasuk CGEE</b>' : '. CGEE <b>tidak</b> akan menerima emel (suis CGEE: TIDAK)'}.</p>`, 'Hidupkan LIVE', 'btn-danger')) return;
      if (!apply(await act(b, () => call(API.saveSettings({ EMAIL_MODE: m }))))) return;
      toast('Mod emel: ' + m); render();
    });
    $$('[data-cgee]').forEach(b => b.onclick = async () => {
      const v = b.dataset.cgee;
      if (v === 'YA' && !await confirmBox('Hantar emel kepada CGEE?', `<p>Emel kelulusan akan dihantar kepada <b>${esc(S('CGEE_EMAIL'))}</b> apabila mod emel TEST/LIVE.</p>`, 'Ya, hantar kepada CGEE', 'btn-danger')) return;
      if (!apply(await act(b, () => call(API.saveSettings({ CGEE_ENABLED: v }))))) return;
      toast('Hantar kepada CGEE: ' + v); render();
    });
    $('#save').onclick = async (e) => {
      e.preventDefault();
      const values = {}; $$('#sf input').forEach(i => { values[i.name] = i.value.trim(); });
      if (apply(await act($('#save'), () => call(API.saveSettings(values))))) toast('Tetapan disimpan');
    };
  }, { roles: ['ADMIN'] });

  route('/admin/emails', () => {
    const log = D().email_log;
    shell('Log Emel', `
      <div class="page-head"><div><h1>Log Emel</h1><p class="muted">Setiap emel yang dijana oleh sistem. Mod semasa: <b>${esc(S('EMAIL_MODE'))}</b>.</p></div></div>
      <div class="card"><div class="table-wrap"><table><thead><tr><th>Masa</th><th>Templat</th><th>Kepada</th><th>Subjek</th><th>Mod</th><th>Status</th></tr></thead><tbody>
        ${log.map(e => `<tr><td class="small">${fmtDT(e.created_at)}</td><td><span class="tag">${esc(e.template_code)}</span></td><td class="small">${esc(e.intended_to)}${e.intended_cc ? `<div class="muted">s.k. ${esc(e.intended_cc)}</div>` : ''}${e.actual_to && e.actual_to !== e.intended_to ? `<div style="color:var(--st-amend)">→ ${esc(e.actual_to)}</div>` : ''}</td><td class="small">${esc(e.subject)}${e.has_attachment ? ' 📎' : ''}</td><td>${esc(e.email_mode)}</td><td><span class="badge ${e.send_status === 'LOGGED' ? 'st-DRAFT' : e.send_status === 'FAILED' ? 'st-REJECTED' : 'st-APPROVED'}">${esc(e.send_status)}</span>${e.error_message ? `<div class="small muted" style="margin-top:4px">${esc(e.error_message)}</div>` : ''}</td></tr>`).join('') || `<tr><td colspan="6">${emptyState('Belum ada emel. Cuba hantar atau luluskan permohonan.')}</td></tr>`}
      </tbody></table></div></div>`);
  }, { roles: ['ADMIN'] });

  // ---------------------------------------------------------------- profile
  route('/profile', (params) => {
    const u = me();
    const first = params.get('first') === '1';
    shell('Profil Saya', `
      <div class="page-head"><div><h1>${first ? 'Lengkapkan profil anda' : 'Profil Saya'}</h1><p class="muted">${first ? 'Maklumat ini digunakan dalam permohonan dan surat kelulusan. Anda hanya perlu isi sekali.' : 'Nama dan emel diambil daripada akaun Google UniMAP anda.'}</p></div></div>
      <div class="card" style="max-width:720px"><form class="card-body" id="pf">
        <div class="grid-2"><label class="field"><span>Nama penuh</span><input name="full_name" value="${esc(u.full_name)}"></label><label class="field"><span>Emel</span><input value="${esc(u.email)}" readonly></label></div>
        <div class="grid-2"><label class="field"><span>Jabatan / unit <span class="req">*</span></span><select name="department_id"><option value="">Pilih...</option>${D().departments.filter(x => x.is_active).map(x => `<option value="${x.department_id}" ${x.department_id === u.department_id ? 'selected' : ''}>${esc(x.code)} – ${esc(x.name)}</option>`).join('')}</select></label>
          <label class="field"><span>Jawatan</span><input name="position" value="${esc(u.position)}" placeholder="cth: Pensyarah Kanan"></label></div>
        <div class="grid-2"><label class="field"><span>No. telefon</span><input type="tel" name="phone" value="${esc(u.phone)}"></label><label class="field"><span>No. staf</span><input name="staff_no" value="${esc(u.staff_no)}"></label></div>
        <div class="row end"><button class="btn btn-primary" id="ps">${ic('save')} Simpan</button></div></form></div>`);
    $('#ps').onclick = async (e) => {
      e.preventDefault();
      const f = $('#pf');
      if (!f.department_id.value) return toast('Sila pilih jabatan', 'err');
      if (!f.full_name.value.trim()) return toast('Sila isi nama penuh', 'err');
      const fields = {}; ['full_name', 'department_id', 'position', 'phone', 'staff_no'].forEach(k => { fields[k] = f[k].value.trim(); });
      if (!apply(await act($('#ps'), () => call(API.saveProfile(fields))))) return;
      toast('Profil disimpan');
      if (first) go(rolesOf(u.user_id).length > 1 ? '#/roles' : '#/home');
    };
  });

  // ----------------------------------------------------------------- start
  (async function start() {
    busy(true);
    let res = null;
    try { res = await API.boot(); } catch (e) { res = { error: String((e && e.message) || e) }; }
    busy(false);
    if (res && res.error) return accessDenied(res.error, res.email);
    STATE = res.state;
    if (res.userId) return enter(res.state, res.userId, res.open);
    render(); // mock: landing page with the demo account chooser
  })();

  function accessDenied(code, email) {
    const msg = { NOT_UNIMAP: 'Akaun ini bukan akaun @unimap.edu.my. Sila log masuk dengan akaun UniMAP anda.', NO_EMAIL: 'Google tidak memberikan alamat emel anda. Pastikan anda log masuk dengan akaun UniMAP.', INACTIVE: 'Akaun anda telah dinyahaktifkan. Sila hubungi pentadbir sistem.' }[code] || code;
    $('#root').innerHTML = `<div class="landing"><div class="landing-top"><span class="logo-chip"><img src="${LOGO}" alt="UniMAP"></span></div>
      <div class="content" style="max-width:640px"><h1>Sistem Permohonan JOC</h1><p class="muted" style="margin:6px 0 20px">${FACULTY}</p>
      <div class="callout err">${ic('shield')}<div class="body"><b>Akses ditolak.</b> ${esc(msg)}${email ? `<br><span class="small">${esc(email)}</span>` : ''}</div></div></div></div>`;
  }
})();

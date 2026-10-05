// =========================================================
// Utilidades compartidas: sesión, peticiones, iconos, toasts
// =========================================================

// ---------- Iconos (SVG en línea) ----------
const ICONS = {
  dumbbell: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.66 21.49a2 2 0 1 1-2.83-2.83l-1.77 1.77a2 2 0 1 1-2.83-2.83l6.37-6.36a2 2 0 1 1 2.82 2.83l-1.76 1.77a2 2 0 1 1 2.82 2.83z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.4 12.77a2 2 0 1 1-2.83-2.83l1.77-1.77a2 2 0 1 1-2.83-2.83l2.83-2.82a2 2 0 1 1 2.83 2.82l1.76-1.76a2 2 0 1 1 2.83 2.83z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-2.16 3.19"/><path d="M6.6 6.6C3.7 8.5 2 12 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.39-1.61"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m2 2 20 20"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3z"/><path d="M20 14v.01"/><path d="M14 20h.01"/><path d="M17 17h4v4h-4z"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  grid: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3 .4 1.3 1.6 2.5 3.5 2.5z"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  hash: '<path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="m16 3-2 18"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  timer: '<path d="M10 2h4"/><path d="M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  badge: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2"/><path d="M15 12h2"/><path d="M7 16h6"/>',
};

function icon(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

// Sustituye <i data-icon="nombre"></i> por su SVG
function renderIcons(root = document) {
  root.querySelectorAll('i[data-icon]').forEach((el) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = icon(el.dataset.icon, Number(el.dataset.size) || 18);
    const svg = tpl.content.firstChild;
    if (el.className) svg.setAttribute('class', el.className);
    el.replaceWith(svg);
  });
}

// ---------- Sesión ----------
const Session = {
  get token() { return localStorage.getItem('token'); },
  get role() { return localStorage.getItem('role'); },
  get nombre() { return localStorage.getItem('nombre') || ''; },
  get username() { return localStorage.getItem('username') || ''; },
  get isAdmin() { return this.role === 'admin'; },
  get isScanner() { return this.role === 'scanner'; },
  save(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', user.rol);
    localStorage.setItem('nombre', user.nombre || '');
    localStorage.setItem('username', user.username || '');
  },
  // Actualiza los datos visibles tras editar el perfil (el token no cambia)
  updateUser(user) {
    localStorage.setItem('nombre', user.nombre || '');
    localStorage.setItem('username', user.username || '');
  },
  clear() {
    ['token', 'role', 'nombre', 'username'].forEach((k) => localStorage.removeItem(k));
  },
  homeUrl() { return this.isAdmin ? '/admin.html' : this.isScanner ? '/scanner.html' : '/profile.html'; },
};

// Redirige al login si no hay sesión (o al perfil si se exige admin)
function requireAuth(role) {
  if (!Session.token) {
    location.replace('/login.html');
    return false;
  }
  // 'scanner' = admin o cuenta de escáner; 'admin' = solo admin
  if (role === 'scanner' && !(Session.isAdmin || Session.isScanner)) {
    location.replace('/403');
    return false;
  }
  // La cuenta de escáner solo tiene su pantalla; el resto de páginas la devuelven allí
  if (role !== 'scanner' && Session.isScanner) {
    location.replace('/scanner.html');
    return false;
  }
  if (role === 'admin' && !Session.isAdmin) {
    location.replace('/403');
    return false;
  }
  return true;
}

// fetch con token y JSON. Si el token caduca, cierra la sesión.
async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && Session.token) headers.Authorization = `Bearer ${Session.token}`;

  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = {};
  try { data = await res.json(); } catch { /* respuesta sin JSON */ }

  if (res.status === 401 && auth && Session.token) {
    Session.clear();
    location.replace('/login.html?expired=1');
  }
  return { res, data };
}

// ---------- Cerrar sesión ----------
function doLogout() {
  const overlay = document.createElement('div');
  overlay.className = 'logout-overlay';
  overlay.innerHTML = '<div><span class="spinner"></span><span>Cerrando sesión…</span></div>';
  document.body.appendChild(overlay);
  Session.clear();
  setTimeout(() => location.replace('/login.html?logout=1'), 650);
}

function confirmLogout() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal card" role="dialog" aria-modal="true" aria-labelledby="logoutTitle">
      <div class="modal-ico">${icon('logout', 26)}</div>
      <h3 id="logoutTitle">¿Cerrar sesión?</h3>
      <p>Tendrás que volver a iniciar sesión para ver tu perfil y tu código QR.</p>
      <div class="actions">
        <button class="btn" data-cancel>Cancelar</button>
        <button class="btn btn-primary" data-confirm>Cerrar sesión</button>
      </div>
    </div>`;
  const close = () => { backdrop.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector('[data-cancel]').addEventListener('click', close);
  backdrop.querySelector('[data-confirm]').addEventListener('click', () => { close(); doLogout(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(backdrop);
  backdrop.querySelector('[data-confirm]').focus();
}

// ---------- Toasts ----------
function toast(message, type = 'info', timeout = 3500) {
  let box = document.querySelector('.toasts');
  if (!box) {
    box = document.createElement('div');
    box.className = 'toasts';
    box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);
  }
  const iconName = { success: 'check', error: 'alert', info: 'zap' }[type] || 'zap';
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(iconName, 18)}<span>${escapeHtml(message)}</span>`;
  box.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, timeout);
}

// ---------- Formato ----------
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('') || '?';
}

const fmtDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const fmtDateTime = (d) => `${fmtDate(d)} · ${fmtTime(d)}`;

function fmtDuration(ms) {
  if (!ms || ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}min`;
}

function durationBetween(start, end) {
  return new Date(end || Date.now()) - new Date(start);
}

// Anima un número desde 0 hasta su valor
function countUp(el, value, { duration = 900, format = (n) => Math.round(n) } = {}) {
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(value * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function setLoading(btn, loading) {
  btn.classList.toggle('is-loading', loading);
  btn.disabled = loading;
}

function shake(el) {
  el.classList.remove('shake');
  void el.offsetWidth; // reinicia la animación
  el.classList.add('shake');
}

// Refresca el nombre y el avatar de la barra superior
function refreshUserChip() {
  document.querySelectorAll('[data-user-name]').forEach((el) => { el.textContent = Session.nombre || Session.username; });
  document.querySelectorAll('[data-user-avatar]').forEach((el) => { el.textContent = initials(Session.nombre || Session.username); });
}

// ---------- Reglas de validación de formularios (el servidor repite todas) ----------
const RULES = {
  nombre: (v) => (v.length < 2 ? 'El nombre debe tener al menos 2 caracteres' : ''),
  username: (v) => (/^[a-zA-Z0-9_.]{3,20}$/.test(v) ? '' : 'Usuario de 3-20 caracteres (letras, números, _ o .)'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Introduce un email válido'),
  telefono: (v) => (/^[+\d][\d\s-]{6,19}$/.test(v) ? '' : 'El teléfono no es válido'),
  nif_cif: (v) => (/^[A-Za-z0-9\s-]{8,15}$/.test(v) ? '' : 'El NIF/CIF no es válido (ej. 12345678Z o A58818501)'),
};

// ---------- Formulario en modal ----------
// config: { title, subtitle, icon, notice, submitLabel,
//   sections: [{ title, icon, note, fields: [{ name, label, icon, type, value, placeholder, autocomplete,
//     maxlength, required, hint, span, validate(value, values), showWhen(values) }] }],
//   onSubmit(values, changed) -> { ok, message, errors } }
// Los campos con showWhen son auxiliares (p. ej. contraseña actual): solo se piden cuando hacen falta
// y no cuentan como "cambio".
function openFormModal(config) {
  const fields = config.sections.flatMap((s) => s.fields);
  const initial = Object.fromEntries(fields.map((f) => [f.name, f.type === 'checkbox' ? false : String(f.value ?? '')]));
  let sending = false;
  let closeTimer = null;
  let saved = false;

  const fieldHtml = (f) => {
    const id = `mf_${f.name}`;
    const req = f.required ? ' <span class="req" aria-hidden="true">*</span>' : '';
    const hint = f.hint ? `<span class="hint">${escapeHtml(f.hint)}</span>` : '';
    const err = `<span class="field-error" id="mfe_${f.name}" role="alert">${icon('alert', 14)}<span></span></span>`;
    const span = f.span ? ' span-2' : '';
    const hidden = f.showWhen ? ' hidden' : '';
    if (f.type === 'checkbox') {
      return `<div class="field${span}${hidden ? ' hidden' : ''}" data-field="${f.name}">
        <label class="check" for="${id}"><input type="checkbox" id="${id}" name="${f.name}"><span>${escapeHtml(f.label)}</span></label>${err}</div>`;
    }
    const isPass = f.type === 'password';
    const ico = f.icon ? icon(f.icon, 18).replace('<svg ', '<svg class="input-icon" ') : '';
    return `<div class="field${span}${hidden ? ' hidden' : ''}" data-field="${f.name}">
      <label for="${id}">${escapeHtml(f.label)}${req}</label>
      <div class="input-wrap">${ico}
        <input class="input${f.icon ? '' : ' no-icon'}" id="${id}" name="${f.name}" type="${isPass ? 'password' : (f.type || 'text')}"
          value="${escapeHtml(initial[f.name])}" placeholder="${escapeHtml(f.placeholder || '')}"
          autocomplete="${escapeHtml(f.autocomplete || 'off')}" ${f.maxlength ? `maxlength="${f.maxlength}"` : ''}>
        ${isPass ? `<button type="button" class="toggle-pass" aria-label="Mostrar contraseña">${icon('eye', 18)}</button>` : ''}
      </div>${hint}${err}</div>`;
  };

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <form class="modal modal-form card" role="dialog" aria-modal="true" aria-labelledby="mfTitle" novalidate>
      <div class="mf-head">
        <span class="mf-ico">${icon(config.icon || 'edit', 22)}</span>
        <div class="mf-titles"><h3 id="mfTitle">${escapeHtml(config.title)}</h3>
          ${config.subtitle ? `<span class="mf-sub">${escapeHtml(config.subtitle)}</span>` : ''}</div>
        <button type="button" class="btn btn-ghost btn-icon btn-sm mf-close" data-close aria-label="Cerrar">${icon('x', 18)}</button>
      </div>
      <div class="mf-body">
        ${config.notice ? `<div class="mf-notice">${icon('info', 16)}<span>${escapeHtml(config.notice)}</span></div>` : ''}
        ${config.sections.map((s) => `
          <section class="mf-section">
            <div class="mf-section-title">${icon(s.icon || 'user', 15)}${escapeHtml(s.title)}</div>
            ${s.note ? `<div class="mf-section-note">${escapeHtml(s.note)}</div>` : ''}
            <div class="form-grid">${s.fields.map(fieldHtml).join('')}</div>
          </section>`).join('')}
      </div>
      <div class="mf-foot">
        <div class="mf-banner" id="mfBanner" role="status" aria-live="polite"></div>
        <div class="mf-actions">
          <span class="dirty-note" id="mfDirty">Sin cambios</span>
          <button type="button" class="btn" data-close id="mfCancel">Cancelar</button>
          <button type="submit" class="btn btn-primary" id="mfSubmit" disabled>
            <span class="btn-label">${escapeHtml(config.submitLabel || 'Guardar cambios')}</span><span class="spinner"></span>
          </button>
        </div>
      </div>
    </form>`;

  const form = backdrop.querySelector('form');
  const banner = backdrop.querySelector('#mfBanner');
  const dirtyNote = backdrop.querySelector('#mfDirty');
  const submitBtn = backdrop.querySelector('#mfSubmit');
  const cancelBtn = backdrop.querySelector('#mfCancel');
  const wrapOf = (name) => form.querySelector(`[data-field="${name}"]`);
  const inputOf = (name) => form.elements[name];

  const readValues = () => Object.fromEntries(fields.map((f) => {
    const el = inputOf(f.name);
    return [f.name, f.type === 'checkbox' ? el.checked : (f.type === 'password' ? el.value : el.value.trim())];
  }));
  const isVisible = (f, values) => !f.showWhen || f.showWhen(values);
  const changedNames = (values) => fields
    .filter((f) => !f.showWhen && values[f.name] !== initial[f.name]).map((f) => f.name);

  function setBanner(kind, html) {
    banner.className = `mf-banner ${kind || ''}${kind ? ' show' : ''}`;
    banner.innerHTML = html || '';
  }

  function setFieldError(name, message) {
    const wrap = wrapOf(name);
    if (!wrap) return false;
    wrap.classList.toggle('has-error', Boolean(message));
    wrap.querySelector('.field-error span').textContent = message || '';
    const input = inputOf(name);
    if (input && input.type !== 'checkbox') input.classList.toggle('invalid', Boolean(message));
    return true;
  }

  function validateField(f, values) {
    if (!isVisible(f, values)) return '';
    const v = values[f.name];
    if (f.type === 'checkbox') return f.required && !v ? 'Debes confirmarlo para continuar' : '';
    if (f.required && !v) return `${f.label}: campo obligatorio`;
    if (v === '' || !f.validate) return '';
    return f.validate(v, values) || '';
  }

  function refresh() {
    const values = readValues();
    fields.forEach((f) => {
      if (f.showWhen) wrapOf(f.name).classList.toggle('hidden', !f.showWhen(values));
    });
    // Una sección cuyos campos están todos ocultos (solo auxiliares) tampoco se muestra
    form.querySelectorAll('.mf-section').forEach((sec, i) => {
      const sf = config.sections[i].fields;
      sec.classList.toggle('hidden', sf.every((f) => f.showWhen) && !sf.some((f) => f.showWhen(values)));
    });
    const n = changedNames(values).length;
    const dirty = n > 0;
    dirtyNote.textContent = saved ? 'Guardado' : dirty ? `${n} ${n === 1 ? 'cambio' : 'cambios'} sin guardar` : 'Sin cambios';
    dirtyNote.classList.toggle('dirty', dirty && !saved);
    submitBtn.disabled = !dirty || sending || saved;
  }

  function setSending(on) {
    sending = on;
    setLoading(submitBtn, on);
    form.querySelectorAll('input, [data-close]').forEach((el) => { el.disabled = on; });
    form.querySelectorAll('.toggle-pass').forEach((el) => { el.disabled = on; });
    refresh();
  }

  function close() {
    if (sending) return;
    clearTimeout(closeTimer);
    document.removeEventListener('keydown', onKey);
    backdrop.remove();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  form.addEventListener('input', (e) => {
    if (saved) return;
    if (e.target.name && wrapOf(e.target.name)) setFieldError(e.target.name, '');
    if (banner.classList.contains('error')) setBanner();
    refresh();
  });
  form.addEventListener('change', refresh);
  form.addEventListener('focusout', (e) => {
    const name = e.target && e.target.name;
    const f = fields.find((x) => x.name === name);
    if (!f || saved || sending) return;
    const values = readValues();
    if (values[name] !== initial[name] || wrapOf(name).classList.contains('has-error')) setFieldError(name, validateField(f, values));
  });
  form.querySelectorAll('.toggle-pass').forEach((btn) => btn.addEventListener('click', () => {
    const input = btn.parentElement.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = icon(show ? 'eyeOff' : 'eye', 18);
    btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  }));
  form.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', close));
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending || saved) return;

    // 1) Validación en el navegador
    const values = readValues();
    const problems = fields.map((f) => [f.name, validateField(f, values)]);
    problems.forEach(([name, msg]) => setFieldError(name, msg));
    const bad = problems.filter(([, msg]) => msg);
    if (bad.length) {
      setBanner('error', `${icon('alert', 18)}<span>Revisa ${bad.length === 1 ? 'el campo marcado' : `los ${bad.length} campos marcados`} antes de guardar.</span>`);
      shake(form);
      inputOf(bad[0][0]).focus();
      return;
    }

    // 2) Envío
    setBanner('info', '<span class="spinner"></span><span>Guardando cambios…</span>');
    setSending(true);
    let result;
    try {
      const visible = Object.fromEntries(fields.filter((f) => isVisible(f, values)).map((f) => [f.name, values[f.name]]));
      result = await config.onSubmit(visible, changedNames(values));
    } catch {
      result = { ok: false, network: true };
    }
    setSending(false);

    // 3) Resultado
    if (result.ok) {
      saved = true;
      fields.forEach((f) => { initial[f.name] = f.type === 'checkbox' ? false : (f.showWhen ? '' : values[f.name]); });
      form.querySelectorAll('input').forEach((el) => { el.disabled = true; });
      setBanner('success', `${icon('check', 18)}<span>${escapeHtml(result.message || 'Cambios guardados correctamente')}</span>`);
      toast(result.message || 'Cambios guardados correctamente', 'success');
      cancelBtn.disabled = false;
      cancelBtn.textContent = 'Cerrar';
      submitBtn.querySelector('.btn-label').textContent = 'Guardado';
      refresh();
      closeTimer = setTimeout(close, 1800);
      return;
    }

    const message = result.network
      ? 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.'
      : (result.message || 'No se pudieron guardar los cambios.');
    let firstWithError = null;
    Object.entries(result.errors || {}).forEach(([name, msg]) => {
      if (setFieldError(name, msg) && !firstWithError) firstWithError = name;
    });
    setBanner('error', `${icon('alert', 18)}<span>${escapeHtml(message)}</span>`);
    toast(message, 'error', 5000);
    shake(form);
    if (firstWithError) inputOf(firstWithError).focus();
    refresh();
  });

  document.addEventListener('keydown', onKey);
  document.body.appendChild(backdrop);
  refresh();
  const first = form.querySelector('input:not([type="checkbox"])');
  if (first) first.focus();
}

// ---------- Inicialización común ----------
(function initCommon() {
  renderIcons();

  const logged = Boolean(Session.token);
  document.body.classList.toggle('is-logged', logged);
  document.body.classList.toggle('is-admin', logged && Session.isAdmin);
  document.body.classList.toggle('is-scanner', logged && Session.isScanner);

  refreshUserChip();
  document.querySelectorAll('[data-user-role]').forEach((el) => { el.textContent = Session.isAdmin ? 'Administrador' : Session.isScanner ? 'Escáner' : 'Socio'; });
  document.querySelectorAll('[data-home]').forEach((el) => { el.href = logged ? Session.homeUrl() : '/login.html'; });
  document.querySelectorAll('[data-logout]').forEach((el) => el.addEventListener('click', confirmLogout));

  // Mostrar / ocultar contraseña
  document.querySelectorAll('.toggle-pass').forEach((btn) => {
    btn.innerHTML = icon('eye', 18);
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = icon(show ? 'eyeOff' : 'eye', 18);
      btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });
})();

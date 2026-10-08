(() => {
  if (!requireAuth('admin')) return;

  const $ = (id) => document.getElementById(id);
  const LIMIT = 25;
  let page = 1;
  let pages = 0;
  let requestId = 0;
  let debounce = null;

  const FIELD_LABELS = {
    nombre: 'nombre', telefono: 'teléfono', email: 'email', username: 'usuario',
    direccion: 'dirección', nombre_fiscal: 'nombre fiscal', nif_cif: 'NIF/CIF', direccion_cobro: 'dirección de cobro',
  };

  // [texto de la insignia, clase]
  const ACTIONS = {
    self_update: ['Perfil propio', 'badge-muted'],
    password_change: ['Contraseña', 'badge-muted'],
    admin_update: ['Corrección (admin)', 'badge-info'],
    admin_update_billing: ['Facturación (admin)', 'badge-accent'],
    admin_activate_user: ['Reactivación', 'badge-success'],
    admin_deactivate_user: ['Desactivación', 'badge-danger'],
    admin_delete_user: ['Eliminación', 'badge-danger'],
  };

  const emptyRow = (ico, title, text, retry = false) => `
    <tr><td colspan="5" class="empty-cell"><div class="empty">
      ${icon(ico, 38)}<b style="color:var(--text)">${escapeHtml(title)}</b><span>${escapeHtml(text)}</span>
      ${retry ? '<button class="btn btn-sm" data-retry>Reintentar</button>' : ''}
    </div></td></tr>`;

  const person = (p) => `
    <div class="cell-user">
      <span class="avatar sm ${p.rol === 'admin' ? 'alt' : ''}">${escapeHtml(initials(p.nombre))}</span>
      <div class="meta"><span class="strong">${escapeHtml(p.nombre || '—')}</span><small>@${escapeHtml(p.username || '—')}</small></div>
    </div>`;

  function targetCell(e) {
    if (e.target && e.actor && e.target.id === e.actor.id) return '<span class="muted">Su propia cuenta</span>';
    if (e.target) return person(e.target);
    const name = e.fields && !Array.isArray(e.fields) && e.fields.username;
    return `<span class="muted">Cuenta eliminada${name ? ` (@${escapeHtml(name)})` : ''}</span>`;
  }

  function detail(e) {
    const f = e.fields;
    const names = Array.isArray(f) ? f.map((k) => FIELD_LABELS[k] || k).join(', ') : '';
    switch (e.action) {
      case 'self_update': return `Modificó sus datos: ${names}`;
      case 'admin_update': return `Corrigió: ${names}`;
      case 'admin_update_billing': return `Corrigió (con confirmación del cliente): ${names}`;
      case 'password_change': return 'Cambió su contraseña';
      case 'admin_activate_user': return 'La cuenta puede volver a entrar';
      case 'admin_deactivate_user': {
        const n = f && f.entradas_cerradas;
        return `No puede iniciar sesión ni fichar${n ? ` · ${n} ${n === 1 ? 'entrada cerrada' : 'entradas cerradas'}` : ''}`;
      }
      case 'admin_delete_user': return 'Cuenta e historial de accesos eliminados';
      default: return '—';
    }
  }

  function renderRows(entries) {
    if (!entries.length) {
      const filtered = $('action').value || $('usuario').value || $('desde').value || $('hasta').value;
      $('auditBody').innerHTML = emptyRow('search', filtered ? 'Sin resultados' : 'Todavía no hay actividad',
        filtered ? 'Prueba con otros filtros.' : 'Aquí aparecerán las acciones sobre cuentas.');
      return;
    }
    $('auditBody').innerHTML = entries.map((e, i) => {
      const [label, cls] = ACTIONS[e.action] || [e.action, 'badge-muted'];
      return `
        <tr style="animation-delay:${Math.min(i, 15) * 25}ms">
          <td>${fmtDateTime(e.created_at)}</td>
          <td><span class="badge ${cls}">${escapeHtml(label)}</span></td>
          <td>${e.actor ? person(e.actor) : '<span class="muted">Cuenta desconocida</span>'}</td>
          <td>${targetCell(e)}</td>
          <td class="audit-detail">${escapeHtml(detail(e))}</td>
        </tr>`;
    }).join('');
  }

  function renderPager(total) {
    $('totalBadge').textContent = `${total} ${total === 1 ? 'registro' : 'registros'}`;
    $('pagerInfo').textContent = total ? `Página ${page} de ${pages}` : '—';
    $('prevBtn').disabled = page <= 1;
    $('nextBtn').disabled = page >= pages;
  }

  function currentParams() {
    const params = new URLSearchParams({ page, limit: LIMIT });
    [['action', 'action'], ['usuario', 'usuario'], ['desde', 'desde'], ['hasta', 'hasta']].forEach(([key, id]) => {
      const value = $(id).value.trim();
      if (value) params.set(key, value);
    });
    return params;
  }

  async function load() {
    const desde = $('desde').value;
    const hasta = $('hasta').value;
    if (desde && hasta && desde > hasta) {
      toast('La fecha "desde" no puede ser posterior a "hasta"', 'error');
      return;
    }

    const mine = ++requestId;
    $('tableWrap').classList.add('loading');
    $('refreshBtn').disabled = true;
    try {
      const { res, data } = await apiFetch(`/api/audit?${currentParams()}`);
      if (mine !== requestId) return; // llegó una respuesta más nueva
      if (res.status === 403) { location.replace('/403'); return; }
      if (!res.ok || !data.success) {
        $('auditBody').innerHTML = emptyRow('alert', 'No se pudo cargar', data.message || 'Inténtalo de nuevo.', true);
        renderPager(0);
        return;
      }
      pages = data.pages;
      // Si se eliminaron registros y la página ya no existe, volver a la última
      if (data.pages && page > data.pages) { page = data.pages; load(); return; }
      renderRows(data.entries);
      renderPager(data.total);
    } catch {
      if (mine !== requestId) return;
      $('auditBody').innerHTML = emptyRow('alert', 'Sin conexión', 'No se pudo contactar con el servidor.', true);
      renderPager(0);
    } finally {
      if (mine === requestId) {
        $('tableWrap').classList.remove('loading');
        $('refreshBtn').disabled = false;
      }
    }
  }

  const reloadFromStart = () => { page = 1; load(); };

  $('action').addEventListener('change', reloadFromStart);
  $('desde').addEventListener('change', reloadFromStart);
  $('hasta').addEventListener('change', reloadFromStart);
  $('usuario').addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(reloadFromStart, 350);
  });
  $('filters').addEventListener('submit', (e) => e.preventDefault());
  $('clearBtn').addEventListener('click', () => {
    $('filters').reset();
    reloadFromStart();
  });
  $('refreshBtn').addEventListener('click', load);
  $('prevBtn').addEventListener('click', () => { if (page > 1) { page--; load(); } });
  $('nextBtn').addEventListener('click', () => { if (page < pages) { page++; load(); } });
  $('auditBody').addEventListener('click', (e) => { if (e.target.closest('[data-retry]')) load(); });

  load();
})();

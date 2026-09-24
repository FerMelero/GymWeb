(() => {
  if (!requireAuth('admin')) return;

  const $ = (id) => document.getElementById(id);
  const REFRESH_MS = 15000;

  let users = [];
  let inside = [];
  let lastUpdate = null;
  let firstLoad = true;

  $('today').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const emptyRow = (cols, ico, title, text) => `
    <tr><td colspan="${cols}" class="empty-cell"><div class="empty">
      ${icon(ico, 38)}<b style="color:var(--text)">${title}</b><span>${text}</span>
    </div></td></tr>`;

  const userCell = (u, alt = false) => `
    <div class="cell-user">
      <span class="avatar sm ${alt ? 'alt' : ''}">${escapeHtml(initials(u?.nombre))}</span>
      <div class="meta"><span class="strong">${escapeHtml(u?.nombre || 'Usuario eliminado')}</span><small>@${escapeHtml(u?.username || '—')}</small></div>
    </div>`;

  function setStat(id, value, format) {
    if (firstLoad && typeof value === 'number') countUp($(id), value, format ? { format } : undefined);
    else $(id).textContent = format ? format(value) : value;
  }

  // ---------- Usuarios ----------
  function renderUsers() {
    const q = $('search').value.trim().toLowerCase();
    const role = $('roleFilter').value;
    const list = users.filter((u) =>
      (!role || u.rol === role) &&
      (!q || [u.nombre, u.username, u.email].some((v) => String(v || '').toLowerCase().includes(q)))
    );

    if (!list.length) {
      $('usersBody').innerHTML = emptyRow(6, 'search', 'Sin resultados', users.length ? 'Prueba con otra búsqueda o filtro.' : 'Todavía no hay socios registrados.');
      return;
    }

    $('usersBody').innerHTML = list.map((u, i) => `
      <tr style="animation-delay:${Math.min(i, 15) * 25}ms">
        <td>${userCell(u, u.rol === 'admin')}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.telefono || '—')}</td>
        <td>${u.rol === 'admin'
          ? `<span class="badge badge-accent">${icon('shield', 12)}Admin</span>`
          : '<span class="badge badge-muted">Socio</span>'}</td>
        <td>${u.activo
          ? '<span class="badge badge-success"><span class="dot"></span>Activo</span>'
          : '<span class="badge badge-danger"><span class="dot"></span>Inactivo</span>'}</td>
        <td>${u.created_at ? fmtDate(u.created_at) : '—'}</td>
      </tr>`).join('');
  }

  // ---------- Entradas de hoy ----------
  function renderToday(data) {
    const entries = data.entradas || [];
    $('todayCount').textContent = `${entries.length} ${entries.length === 1 ? 'registro' : 'registros'}`;

    const closed = entries.filter((e) => e.salida_timestamp);
    const avg = closed.length
      ? closed.reduce((s, e) => s + durationBetween(e.entrada_timestamp, e.salida_timestamp), 0) / closed.length
      : 0;

    setStat('statToday', entries.length);
    $('statTodaySub').textContent = `${data.ya_salieron || 0} ya han salido`;
    $('statAvg').textContent = closed.length ? fmtDuration(avg) : '—';

    if (!entries.length) {
      $('todayBody').innerHTML = emptyRow(5, 'calendar', 'Sin entradas hoy', 'Las entradas aparecerán aquí en cuanto alguien escanee su código.');
      return;
    }

    $('todayBody').innerHTML = entries.map((e, i) => {
      const open = !e.salida_timestamp;
      return `
        <tr style="animation-delay:${Math.min(i, 15) * 25}ms">
          <td>${userCell(e.users)}</td>
          <td>${fmtTime(e.entrada_timestamp)}</td>
          <td>${open ? '—' : fmtTime(e.salida_timestamp)}</td>
          <td>${fmtDuration(durationBetween(e.entrada_timestamp, e.salida_timestamp))}</td>
          <td>${open
            ? '<span class="badge badge-success"><span class="dot live"></span>Dentro</span>'
            : '<span class="badge badge-info">Salió</span>'}</td>
        </tr>`;
    }).join('');
  }

  // ---------- Dentro ahora ----------
  function renderInside() {
    setStat('statInside', inside.length);
    $('insideBadge').innerHTML = `<span class="dot live"></span>${inside.length}`;

    if (!inside.length) {
      $('insideList').innerHTML = `<li style="border:0"><div class="empty" style="width:100%;padding:2rem 0">${icon('users', 34)}<span>No hay nadie en el gimnasio ahora mismo</span></div></li>`;
      return;
    }

    $('insideList').innerHTML = inside.map((e, i) => `
      <li style="animation-delay:${Math.min(i, 12) * 40}ms">
        <span class="avatar sm">${escapeHtml(initials(e.users?.nombre))}</span>
        <div class="meta"><b>${escapeHtml(e.users?.nombre || 'Usuario')}</b><small>Entró a las ${fmtTime(e.entrada_timestamp)}</small></div>
        <span class="time">${fmtDuration(durationBetween(e.entrada_timestamp))}</span>
      </li>`).join('');
  }

  function renderUpdated() {
    if (!lastUpdate) return;
    const secs = Math.round((Date.now() - lastUpdate) / 1000);
    $('updated').textContent = secs < 5 ? 'En directo · actualizado ahora' : `En directo · hace ${secs} s`;
  }

  // ---------- Carga de datos ----------
  async function load() {
    const btn = $('refreshBtn');
    btn.disabled = true;
    btn.querySelector('svg').style.animation = 'spin .8s linear infinite';

    try {
      const [u, t, ins] = await Promise.all([
        apiFetch('/api/users'),
        apiFetch('/api/entries/today'),
        apiFetch('/api/entries/inside'),
      ]);

      if ([u, t, ins].some((r) => r.res.status === 403)) {
        location.replace('/profile.html');
        return;
      }

      if (u.data.success) {
        users = u.data.users || [];
        setStat('statUsers', users.length);
        $('statUsersSub').textContent = `${users.filter((x) => x.activo).length} activos`;
        renderUsers();
      } else {
        $('usersBody').innerHTML = emptyRow(6, 'alert', 'Error', escapeHtml(u.data.message || 'No se pudieron cargar los usuarios'));
      }

      if (t.data.success) renderToday(t.data);
      else $('todayBody').innerHTML = emptyRow(5, 'alert', 'Error', escapeHtml(t.data.message || 'No se pudieron cargar las entradas'));

      if (ins.data.success) {
        inside = ins.data.usuarios_dentro || [];
        renderInside();
      }

      lastUpdate = Date.now();
      renderUpdated();
      firstLoad = false;
      setTimeout(() => document.body.classList.add('loaded'), 1000);
    } catch {
      toast('Error de conexión con el servidor', 'error');
      $('updated').textContent = 'Sin conexión';
    } finally {
      btn.disabled = false;
      btn.querySelector('svg').style.animation = '';
    }
  }

  $('search').addEventListener('input', renderUsers);
  $('roleFilter').addEventListener('change', renderUsers);
  $('refreshBtn').addEventListener('click', async () => {
    await load();
    toast('Datos actualizados', 'success', 1800);
  });

  load();
  setInterval(load, REFRESH_MS);
  setInterval(renderUpdated, 1000);
})();

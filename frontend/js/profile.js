(() => {
  if (!requireAuth()) return;

  const $ = (id) => document.getElementById(id);
  let user = null;
  let qrRendered = false;

  function greetingForNow() {
    const h = new Date().getHours();
    if (h < 14) return 'Buenos días';
    if (h < 21) return 'Buenas tardes';
    return 'Buenas noches';
  }

  function renderUser(u) {
    const firstName = (u.nombre || u.username || '').split(' ')[0];
    $('greeting').innerHTML = `${greetingForNow()}, <span class="accent">${escapeHtml(firstName)}</span>`;
    $('qrText').textContent = u.qr_code;

    const rows = [
      ['user', 'Nombre', u.nombre],
      ['at', 'Usuario', `@${u.username}`],
      ['mail', 'Email', u.email],
      ['phone', 'Teléfono', u.telefono || 'No indicado'],
      ['calendar', 'Socio desde', u.created_at ? fmtDate(u.created_at) : '—'],
    ];
    $('infoList').innerHTML = rows.map(([ico, label, value]) => `
      <li>
        <span class="ico">${icon(ico, 17)}</span>
        <div class="meta"><small>${label}</small><b>${escapeHtml(value)}</b></div>
      </li>`).join('');

    if (!qrRendered && window.QRCode) {
      // Se genera grande para que la descarga tenga buena resolución
      new QRCode($('qr'), { text: u.qr_code, width: 512, height: 512, colorDark: '#0a0c0f', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
      qrRendered = true;
    } else if (!window.QRCode) {
      $('qr').innerHTML = '<p class="muted" style="color:#555;padding:1rem">No se pudo cargar el generador de QR. Revisa tu conexión.</p>';
    }
  }

  function renderEntries(entries) {
    const closed = entries.filter((e) => e.salida_timestamp);
    const open = entries.find((e) => !e.salida_timestamp);
    const totalMs = closed.reduce((sum, e) => sum + durationBetween(e.entrada_timestamp, e.salida_timestamp), 0);

    if ($('statVisits').dataset.done) {
      $('statVisits').textContent = entries.length;
    } else {
      countUp($('statVisits'), entries.length);
      $('statVisits').dataset.done = '1';
    }
    $('statTotal').textContent = fmtDuration(totalMs);
    $('statAvg').textContent = fmtDuration(closed.length ? totalMs / closed.length : 0);

    const pill = $('statusPill');
    if (open) {
      pill.className = 'status in';
      pill.innerHTML = `<span class="dot live"></span><span>En el gimnasio desde las ${fmtTime(open.entrada_timestamp)}</span>`;
    } else {
      pill.className = 'status out';
      pill.innerHTML = `<span class="dot"></span><span>Fuera del gimnasio</span>`;
    }

    $('historyCount').textContent = `${entries.length} ${entries.length === 1 ? 'registro' : 'registros'}`;

    if (!entries.length) {
      $('historyBody').innerHTML = `
        <tr><td colspan="5" class="empty-cell"><div class="empty">
          ${icon('qr', 40)}
          <b style="color:var(--text)">Aún no hay entrenamientos</b>
          <span>Escanea tu código QR en recepción para registrar tu primera visita.</span>
        </div></td></tr>`;
      return;
    }

    $('historyBody').innerHTML = entries.map((e, i) => {
      const inside = !e.salida_timestamp;
      return `
        <tr style="animation-delay:${Math.min(i, 12) * 35}ms">
          <td class="strong">${fmtDate(e.entrada_timestamp)}</td>
          <td>${fmtTime(e.entrada_timestamp)}</td>
          <td>${inside ? '—' : fmtTime(e.salida_timestamp)}</td>
          <td>${fmtDuration(durationBetween(e.entrada_timestamp, e.salida_timestamp))}</td>
          <td>${inside
            ? '<span class="badge badge-success"><span class="dot live"></span>Dentro</span>'
            : '<span class="badge badge-muted">Completada</span>'}</td>
        </tr>`;
    }).join('');
  }

  async function load() {
    try {
      const [me, list] = await Promise.all([apiFetch('/api/users/me'), apiFetch('/api/entries')]);

      if (!me.res.ok || !me.data.success) {
        // El usuario del token ya no existe: forzar un nuevo login
        Session.clear();
        location.replace('/login.html?expired=1');
        return;
      }

      user = me.data.user;
      renderUser(user);

      const entries = (list.data.entries || [])
        .filter((e) => e.user_id === user.id) // un admin recibe todas las entradas
        .sort((a, b) => new Date(b.entrada_timestamp) - new Date(a.entrada_timestamp));
      renderEntries(entries);
      setTimeout(() => document.body.classList.add('loaded'), 1000);
    } catch {
      toast('Error de conexión con el servidor', 'error');
    }
  }

  $('downloadQr').addEventListener('click', () => {
    const canvas = $('qr').querySelector('canvas');
    if (!canvas || !user) return;

    // Añade un margen blanco alrededor para que se lea bien impreso
    const pad = 48;
    const out = document.createElement('canvas');
    out.width = canvas.width + pad * 2;
    out.height = canvas.height + pad * 2;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, pad, pad);

    const a = document.createElement('a');
    a.href = out.toDataURL('image/png');
    a.download = `gymweb-qr-${user.username}.png`;
    a.click();
    toast('Código QR descargado', 'success');
  });

  $('copyQr').addEventListener('click', async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.qr_code);
      toast('Código copiado al portapapeles', 'success');
    } catch {
      toast('No se pudo copiar el código', 'error');
    }
  });

  load();
  // Refresca el estado cada 30 s por si entra o sale mientras mira la página
  setInterval(load, 30000);
})();

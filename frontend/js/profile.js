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
      ['pin', 'Dirección', u.direccion || 'No indicada'],
      ['calendar', 'Socio desde', u.created_at ? fmtDate(u.created_at) : '—'],
      ['sep', 'Facturación'],
      ['building', 'Nombre fiscal', u.nombre_fiscal || 'No indicado'],
      ['badge', 'NIF/CIF', u.nif_cif || 'No indicado'],
      ['receipt', 'Dirección de cobro', u.direccion_cobro || 'No indicada'],
    ];
    $('infoList').innerHTML = rows.map(([ico, label, value]) => ico === 'sep'
      ? `<li class="info-sep">${label}</li>`
      : `<li>
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

  // ---------- Editar mis datos ----------
  function openEditProfile() {
    const loginChanged = (v) =>
      v.email.toLowerCase() !== String(user.email || '').toLowerCase() ||
      v.username.toLowerCase() !== String(user.username || '').toLowerCase();

    openFormModal({
      title: 'Editar mis datos',
      subtitle: 'Puedes modificar toda tu información. Solo se guardan los campos que cambies.',
      icon: 'edit',
      sections: [
        {
          title: 'Datos personales', icon: 'user',
          fields: [
            { name: 'nombre', label: 'Nombre completo', icon: 'user', value: user.nombre, required: true, maxlength: 60, autocomplete: 'name', validate: RULES.nombre },
            { name: 'username', label: 'Usuario', icon: 'at', value: user.username, required: true, maxlength: 20, autocomplete: 'username', validate: RULES.username },
            { name: 'email', label: 'Email', icon: 'mail', type: 'email', value: user.email, required: true, maxlength: 254, autocomplete: 'email', validate: RULES.email },
            { name: 'telefono', label: 'Teléfono', icon: 'phone', type: 'tel', value: user.telefono, maxlength: 20, autocomplete: 'tel', validate: RULES.telefono },
            { name: 'direccion', label: 'Dirección postal', icon: 'pin', value: user.direccion, maxlength: 200, autocomplete: 'street-address', span: true, placeholder: 'Calle, número, código postal y ciudad' },
          ],
        },
        {
          title: 'Datos de facturación', icon: 'receipt',
          note: 'Opcional. Se usan para emitir tus facturas.',
          fields: [
            { name: 'nombre_fiscal', label: 'Nombre fiscal', icon: 'building', value: user.nombre_fiscal, maxlength: 120, autocomplete: 'organization', placeholder: 'Nombre o razón social' },
            { name: 'nif_cif', label: 'NIF / CIF', icon: 'badge', value: user.nif_cif, maxlength: 15, placeholder: '12345678Z', validate: RULES.nif_cif },
            { name: 'direccion_cobro', label: 'Dirección de cobro', icon: 'pin', value: user.direccion_cobro, maxlength: 200, span: true, placeholder: 'Dirección donde se envían las facturas' },
          ],
        },
        {
          title: 'Confirmación', icon: 'lock',
          fields: [
            { name: 'contraseñaActual', label: 'Contraseña actual', type: 'password', icon: 'lock', required: true, span: true, autocomplete: 'current-password',
              hint: 'Necesaria para cambiar el email o el usuario, porque son tus datos de acceso.', showWhen: loginChanged },
          ],
        },
      ],
      onSubmit: async (values, changed) => {
        const body = {};
        changed.forEach((k) => { body[k] = values[k]; });
        if (values.contraseñaActual) body.contraseñaActual = values.contraseñaActual;

        const { res, data } = await apiFetch('/api/users/me', { method: 'PATCH', body });
        if (res.ok && data.success) {
          user = data.user;
          Session.updateUser(user);
          renderUser(user);
          refreshUserChip();
          return { ok: true, message: data.message };
        }
        return { ok: false, message: data.message, errors: data.errors };
      },
    });
  }

  // ---------- Cambiar contraseña ----------
  function openPasswordModal() {
    openFormModal({
      title: 'Cambiar contraseña',
      subtitle: 'Por seguridad, necesitamos tu contraseña actual.',
      icon: 'key',
      submitLabel: 'Cambiar contraseña',
      sections: [{
        title: 'Nueva contraseña', icon: 'lock',
        fields: [
          { name: 'contraseñaActual', label: 'Contraseña actual', type: 'password', icon: 'lock', required: true, span: true, autocomplete: 'current-password' },
          {
            name: 'contraseñaNueva', label: 'Nueva contraseña', type: 'password', icon: 'lock', required: true, autocomplete: 'new-password', hint: 'Entre 8 y 72 caracteres.',
            validate: (v, vals) => (v.length < 8 ? 'Mínimo 8 caracteres' : v.length > 72 ? 'Máximo 72 caracteres' : v === vals.contraseñaActual ? 'Debe ser distinta de la actual' : ''),
          },
          {
            name: 'confirmar', label: 'Repite la nueva contraseña', type: 'password', icon: 'lock', required: true, autocomplete: 'new-password',
            validate: (v, vals) => (v !== vals.contraseñaNueva ? 'Las contraseñas no coinciden' : ''),
          },
        ],
      }],
      onSubmit: async (values) => {
        const { res, data } = await apiFetch('/api/users/me/password', {
          method: 'PATCH',
          body: { contraseñaActual: values.contraseñaActual, contraseñaNueva: values.contraseñaNueva },
        });
        return { ok: res.ok && data.success, message: data.message, errors: data.errors };
      },
    });
  }

  $('editProfile').addEventListener('click', () => { if (user) openEditProfile(); });
  $('editPassword').addEventListener('click', openPasswordModal);

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

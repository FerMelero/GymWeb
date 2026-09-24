(() => {
  if (Session.token) {
    location.replace(Session.homeUrl());
    return;
  }

  const form = document.getElementById('registerForm');
  const errorEl = document.getElementById('error');
  const submitBtn = document.getElementById('submitBtn');
  const strengthEl = document.getElementById('strength');
  const $ = (id) => document.getElementById(id);

  // Medidor de seguridad de la contraseña
  $('contraseña').addEventListener('input', (e) => {
    const v = e.target.value;
    let level = 0;
    if (v.length >= 6) level++;
    if (v.length >= 10) level++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) level++;
    if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) level++;
    strengthEl.dataset.level = v ? Math.max(1, level) : 0;
  });

  form.querySelectorAll('.input').forEach((input) =>
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      errorEl.textContent = '';
    })
  );

  function validate(values) {
    const checks = [
      ['nombre', values.nombre.length >= 2, 'Introduce tu nombre'],
      ['telefono', !values.telefono || /^[+\d][\d\s-]{6,}$/.test(values.telefono), 'El teléfono no es válido'],
      ['username', /^[a-zA-Z0-9_.]{3,20}$/.test(values.username), 'El usuario debe tener 3-20 caracteres (letras, números, _ o .)'],
      ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email), 'Introduce un email válido'],
      ['contraseña', values.contraseña.length >= 6, 'La contraseña debe tener al menos 6 caracteres'],
      ['confirmar', values.confirmar === values.contraseña, 'Las contraseñas no coinciden'],
    ];
    const failed = checks.filter(([, ok]) => !ok);
    failed.forEach(([id]) => $(id).classList.add('invalid'));
    return failed.length ? failed[0][2] : null;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const values = {
      nombre: $('nombre').value.trim(),
      telefono: $('telefono').value.trim(),
      username: $('username').value.trim(),
      email: $('email').value.trim().toLowerCase(),
      contraseña: $('contraseña').value,
      confirmar: $('confirmar').value,
    };

    const problem = validate(values);
    if (problem) {
      errorEl.textContent = problem;
      shake(form);
      return;
    }

    setLoading(submitBtn, true);
    try {
      const { confirmar, ...body } = values;
      const { res, data } = await apiFetch('/api/auth/register', { method: 'POST', body, auth: false });

      if (!res.ok || !data.success) {
        setLoading(submitBtn, false);
        errorEl.textContent = data.message || 'No se pudo crear la cuenta';
        shake(form);
        return;
      }

      location.replace(`/login.html?registered=1&u=${encodeURIComponent(values.username)}`);
    } catch {
      setLoading(submitBtn, false);
      errorEl.textContent = 'Error de conexión con el servidor';
      shake(form);
    }
  });
})();

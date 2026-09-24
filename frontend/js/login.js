(() => {
  // Si ya hay sesión abierta, ir directamente a su página
  if (Session.token) {
    location.replace(Session.homeUrl());
    return;
  }

  const form = document.getElementById('loginForm');
  const identifierInput = document.getElementById('identifier');
  const passwordInput = document.getElementById('password');
  const errorEl = document.getElementById('error');
  const submitBtn = document.getElementById('submitBtn');

  // Mensajes que llegan desde otras páginas
  const params = new URLSearchParams(location.search);
  if (params.has('logout')) toast('Has cerrado sesión correctamente', 'success');
  if (params.has('expired')) toast('Tu sesión ha caducado, vuelve a entrar', 'error');
  if (params.has('registered')) {
    toast('¡Cuenta creada! Ya puedes iniciar sesión', 'success');
    identifierInput.value = params.get('u') || '';
    passwordInput.focus();
  }
  if (params.toString()) history.replaceState(null, '', location.pathname);

  function showError(message) {
    errorEl.textContent = message;
    shake(form);
  }

  [identifierInput, passwordInput].forEach((input) =>
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      errorEl.textContent = '';
    })
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;

    identifierInput.classList.toggle('invalid', !identifier);
    passwordInput.classList.toggle('invalid', !password);
    if (!identifier || !password) {
      showError('Introduce tu usuario o email y tu contraseña');
      return;
    }

    setLoading(submitBtn, true);
    try {
      const { res, data } = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { identifier, password },
        auth: false,
      });

      if (!res.ok || !data.success) {
        setLoading(submitBtn, false);
        passwordInput.classList.add('invalid');
        showError(data.message || 'No se pudo iniciar sesión');
        return;
      }

      Session.save(data.token, data.user);
      toast(`¡Hola, ${data.user.nombre || data.user.username}!`, 'success');
      setTimeout(() => location.replace(Session.homeUrl()), 500);
    } catch {
      setLoading(submitBtn, false);
      showError('Error de conexión con el servidor');
    }
  });
})();

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const identifier = document.getElementById('identifier').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById('error').innerText = data.message;
      return;
    }

    // Guardamos token y rol
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.rol);

    // Redirigir
    if (data.user.rol === 'admin'){
        window.location.href = '/admin.html';

    } else {
        window.location.href = '/profile.html';
    }
    

  } catch (err) {
    document.getElementById('error').innerText = 'Error de conexión al servidor';
  }
});

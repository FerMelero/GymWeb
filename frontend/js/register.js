document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const telefono = document.getElementById('telefono').value;
  const email = document.getElementById('email').value;
  const username = document.getElementById('username').value;
  const contraseña = document.getElementById('contraseña').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, telefono, username, email, contraseña })
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById('error').innerText = data.message;
      return;
    }

    window.location.href = '/login.html';

  } catch (err) {
    document.getElementById('error').innerText = 'Error de conexión al servidor';
  }
});

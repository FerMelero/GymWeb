const token = localStorage.getItem('token');

if (!token) {
  document.getElementById('mensaje').innerText = "No estás logueado o no eres admin";
  throw new Error("No token");
}

// Cargar usuarios
async function cargarUsuarios() {
  const res = await fetch('http://localhost:5000/api/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  const tbody = document.querySelector('#tablaUsuarios tbody');

  if (!res.ok || !data.success) {
    tbody.innerHTML = `<tr><td colspan="6">${data.message || "Error al cargar usuarios"}</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  data.users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.nombre}</td>
      <td>${u.email}</td>
      <td>${u.username}</td>
      <td>${u.rol}</td>
      <td>${u.activo}</td>
      <td>${new Date(u.created_at).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Cargar entradas de hoy
async function cargarEntradasHoy() {
  const res = await fetch('http://localhost:5000/api/entries/today', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  const tbody = document.querySelector('#tablaEntradasHoy tbody');

  if (!res.ok || !data.success) {
    tbody.innerHTML = `<tr><td colspan="4">${data.message || "Error al cargar entradas"}</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  data.entries.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.user.nombre}</td>
      <td>${e.entrada_timestamp}</td>
      <td>${e.salida_timestamp || '-'}</td>
      <td>${e.duracion || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Cargar usuarios dentro ahora
async function cargarUsuariosDentro() {
  const res = await fetch('http://localhost:5000/api/entries/inside', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  const ul = document.getElementById('usuariosDentro');

  if (!res.ok || !data.success) {
    ul.innerHTML = `<li>${data.message || "Error al cargar usuarios dentro"}</li>`;
    return;
  }

  ul.innerHTML = '';
  data.users.forEach(u => {
    const li = document.createElement('li');
    li.textContent = `${u.nombre} (${u.username})`;
    ul.appendChild(li);
  });
}

// Cargar todo al abrir la página
cargarUsuarios();
cargarEntradasHoy();
cargarUsuariosDentro();

const token = localStorage.getItem('token');

if (!token) {
  document.getElementById('mensaje').innerText = "No estás logueado o no eres admin";
  throw new Error("No token");
}

// Cargar usuarios
async function cargarUsuarios() {
  const res = await fetch('/api/users', {
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

function calcularDuracion(entrada, salida) {
  if (!salida) return '-';
  const diff = new Date(salida) - new Date(entrada);
  const horas = Math.floor(diff / 1000 / 60 / 60);
  const minutos = Math.floor((diff / 1000 / 60) % 60);
  return `${horas}h ${minutos}min`;
}

// Cargar entradas de hoy
async function cargarEntradasHoy() {
  try {
    const res = await fetch('/api/entries/today', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    const tbody = document.querySelector('#tablaEntradasHoy tbody');

    if (!res.ok || !data.success) {
      tbody.innerHTML = `<tr><td colspan="4">${data.message || "Error al cargar entradas"}</td></tr>`;
      return;
    }

    tbody.innerHTML = '';

    // Recorrer entradas (nota: vienen en data.entradas y el usuario está en e.users)
    data.entradas.forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${e.users.nombre}</td>
        <td>${new Date(e.entrada_timestamp).toLocaleString()}</td>
        <td>${e.salida_timestamp ? new Date(e.salida_timestamp).toLocaleString() : '-'}</td>
        <td>${calcularDuracion(e.entrada_timestamp, e.salida_timestamp)}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error('Error al cargar entradas de hoy:', error);
    const tbody = document.querySelector('#tablaEntradasHoy tbody');
    tbody.innerHTML = `<tr><td colspan="4">Error al cargar entradas</td></tr>`;
  }
}

// Cargar usuarios dentro ahora
async function cargarUsuariosDentro() {
  try {
    const res = await fetch('/api/entries/inside', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const ul = document.getElementById('usuariosDentro');

    if (!res.ok || !data.success) {
      ul.innerHTML = `<li>${data.message || "Error al cargar usuarios dentro"}</li>`;
      return;
    }

    ul.innerHTML = '';

    // Recorrer usuarios dentro (vienen en data.usuarios_dentro y el usuario está en e.users)
    data.usuarios_dentro.forEach(e => {
      const u = e.users; // el objeto user dentro de cada entry
      const li = document.createElement('li');
      li.textContent = `${u.nombre} (${u.username})`;
      ul.appendChild(li);
    });

  } catch (error) {
    console.error('Error al cargar usuarios dentro:', error);
    const ul = document.getElementById('usuariosDentro');
    ul.innerHTML = `<li>Error al cargar usuarios dentro</li>`;
  }
}

// Cargar todo al abrir la página
cargarUsuarios();
cargarEntradasHoy();
cargarUsuariosDentro();

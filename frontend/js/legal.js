// Rellena las páginas legales con los datos de backend/src/config/legal.js (vía /api/legal).
//   null  -> dato pendiente: se resalta como [PENDIENTE: ...]
//   false -> no aplica: se oculta
(() => {
  const todo = (key) => `<mark class="legal-todo" title="Falta por rellenar en backend/src/config/legal.js">[PENDIENTE: ${escapeHtml(key)}]</mark>`;
  const show = (value, key) => (value === null ? todo(key) : value === false || value === undefined ? '' : escapeHtml(value));
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

  const fmtLong = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  function renderProviders(list) {
    const ul = document.getElementById('legalProviders');
    if (!ul) return;
    ul.innerHTML = list.map((p, i) => `
      <li>
        <strong>${show(p.nombre, `proveedores[${i}].nombre`)}</strong> — ${escapeHtml(p.funcion)}.
        Ubicación de los datos: ${show(p.ubicacion, `proveedores[${i}].ubicacion`)}.
        ${p.garantias === false ? '' : `Garantías para las transferencias fuera del EEE: ${show(p.garantias, `proveedores[${i}].garantias`)}.`}
      </li>`).join('');
  }

  async function init() {
    const body = document.getElementById('legalBody');
    const loading = document.getElementById('legalLoading');
    try {
      const { res, data } = await apiFetch('/api/legal', { auth: false });
      if (!res.ok || !data.success) throw new Error('legal');

      const legal = { ...data.legal, actualizadaFmt: fmtLong(data.legal.actualizada) };

      document.querySelectorAll('[data-legal]').forEach((el) => {
        const key = el.dataset.legal;
        el.innerHTML = show(get(legal, key), key);
      });
      // Bloques que desaparecen del todo cuando su valor es false (p. ej. sin DPO)
      document.querySelectorAll('[data-legal-show]').forEach((el) => {
        if (get(legal, el.dataset.legalShow) === false) el.remove();
      });
      renderProviders(legal.proveedores || []);

      if (data.pendientes > 0) {
        document.getElementById('draftBanner').classList.remove('hidden');
        console.warn(`Documento en borrador: ${data.pendientes} datos pendientes en backend/src/config/legal.js`);
      }
      loading.remove();
      body.classList.remove('hidden');
    } catch {
      loading.textContent = 'No se pudo cargar el documento. Inténtalo de nuevo más tarde.';
    }
    document.getElementById('legal').removeAttribute('aria-busy');
  }

  init();
})();

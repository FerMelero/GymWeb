(() => {
  const $ = (id) => document.getElementById(id);
  const RESET_MS = 3500;

  let scanner = null;
  let cameraOn = false;
  let busy = false;
  let resetTimer = null;
  const recent = [];

  // ---------- Reloj ----------
  function tick() {
    const now = new Date();
    $('clock').textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    $('clockDate').textContent = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  tick();
  setInterval(tick, 1000);

  // ---------- Sonido y vibración ----------
  let audioCtx = null;
  function beep(type) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { entrada: [880, 1320], salida: [1320, 880], error: [220, 180] }[type];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const t = audioCtx.currentTime + i * 0.12;
        osc.type = type === 'error' ? 'square' : 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      });
    } catch { /* sin audio */ }
    if (navigator.vibrate) navigator.vibrate(type === 'error' ? [80, 60, 80] : 60);
  }

  // ---------- Panel de resultado ----------
  function setResult(state, { title, text, meta = [], ico }) {
    const box = $('result');
    box.className = `result ${state}`;
    void box.offsetWidth;
    box.classList.add('animate');
    $('resultIco').innerHTML = ico === 'loading' ? '<span class="spinner" style="width:42px;height:42px"></span>' : icon(ico, 52);
    $('resultTitle').textContent = title;
    $('resultText').textContent = text;
    $('resultMeta').innerHTML = meta.map((m) => `<span class="badge badge-muted">${icon(m[0], 13)}${escapeHtml(m[1])}</span>`).join('');
  }

  function setIdle() {
    setResult('', {
      ico: 'qr',
      title: 'Esperando código',
      text: cameraOn ? 'Acerca el código QR a la cámara.' : 'Activa la cámara o introduce el código manualmente.',
    });
    $('countdown').classList.remove('run');
  }

  function startCountdown() {
    const bar = $('countdown');
    bar.style.setProperty('--dur', `${RESET_MS}ms`);
    bar.classList.remove('run');
    void bar.offsetWidth;
    bar.classList.add('run');
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      busy = false;
      setIdle();
      if (cameraOn) {
        try { scanner.resume(); } catch { /* ya reanudado */ }
      }
    }, RESET_MS);
  }

  function addRecent(action, nombre) {
    recent.unshift({ action, nombre, at: new Date() });
    recent.splice(6);
    $('recent').innerHTML = recent.map((r) => `
      <li>
        <span class="avatar sm ${r.action === 'salida' ? 'alt' : ''}">${escapeHtml(initials(r.nombre))}</span>
        <div class="meta"><b>${escapeHtml(r.nombre)}</b><small>${fmtTime(r.at)}</small></div>
        <span class="badge ${r.action === 'entrada' ? 'badge-success' : 'badge-info'}">
          ${icon(r.action === 'entrada' ? 'login' : 'logout', 13)}${r.action === 'entrada' ? 'Entrada' : 'Salida'}
        </span>
      </li>`).join('');
  }

  // ---------- Registrar entrada / salida ----------
  async function registrar(qr_code) {
    busy = true;
    clearTimeout(resetTimer);
    setResult('', { ico: 'loading', title: 'Verificando…', text: 'Comprobando el código del socio.' });

    try {
      const { res, data } = await apiFetch('/api/entries', { method: 'POST', body: { qr_code }, auth: false });

      if (!res.ok || !data.success) {
        beep('error');
        setResult('error', { ico: 'x', title: 'Acceso denegado', text: data.message || 'Código no válido' });
      } else if (data.action === 'entrada') {
        beep('entrada');
        setResult('entrada', {
          ico: 'login',
          title: '¡Bienvenido!',
          text: data.user.nombre,
          meta: [['clock', `Entrada ${fmtTime(data.timestamp)}`]],
        });
        addRecent('entrada', data.user.nombre);
      } else {
        beep('salida');
        setResult('salida', {
          ico: 'logout',
          title: '¡Hasta pronto!',
          text: data.user.nombre,
          meta: [['clock', `Salida ${fmtTime(data.salida)}`], ['timer', `Sesión de ${data.duracion}`]],
        });
        addRecent('salida', data.user.nombre);
      }
    } catch {
      beep('error');
      setResult('error', { ico: 'alert', title: 'Sin conexión', text: 'No se pudo contactar con el servidor.' });
    }
    startCountdown();
  }

  // ---------- Cámara ----------
  function updateCameraUi() {
    $('readerBox').classList.toggle('is-active', cameraOn);
    $('readerIdle').classList.toggle('hidden', cameraOn);
    $('stopBtn').classList.toggle('hidden', !cameraOn);
    $('camStatus').innerHTML = cameraOn
      ? '<span class="dot live" style="color:var(--success)"></span>Cámara activa · escaneando'
      : '<span class="dot" style="color:var(--muted)"></span>Cámara apagada';
    if (!busy) setIdle();
  }

  async function startCamera() {
    if (!window.Html5Qrcode) {
      toast('No se pudo cargar el lector de QR. Revisa tu conexión a internet.', 'error');
      return;
    }
    const btn = $('startBtn');
    setLoading(btn, true);
    try {
      scanner = scanner || new Html5Qrcode('reader', { verbose: false });
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 12, aspectRatio: 1 },
        (text) => { if (!busy) { try { scanner.pause(true); } catch { /* */ } registrar(text.trim()); } },
        () => { /* ningún QR en este fotograma */ }
      );
      cameraOn = true;
    } catch (err) {
      console.error(err);
      toast('No se pudo acceder a la cámara. Revisa los permisos del navegador.', 'error', 5000);
    }
    setLoading(btn, false);
    updateCameraUi();
  }

  async function stopCamera() {
    try { if (scanner && cameraOn) await scanner.stop(); } catch { /* ya parada */ }
    cameraOn = false;
    updateCameraUi();
  }

  $('startBtn').addEventListener('click', startCamera);
  $('stopBtn').addEventListener('click', stopCamera);

  $('manualForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = $('manualCode').value.trim();
    if (!code) {
      shake($('manualForm'));
      return;
    }
    if (busy) return;
    $('manualCode').value = '';
    registrar(code);
  });

  setIdle();
})();

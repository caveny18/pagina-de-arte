/* ========= arte-immersive.js (versión lista) ========= */
(() => {
  // Evita doble init si se incluye 2 veces
  if (document.documentElement.hasAttribute('data-immersive-ready')) return;
  document.documentElement.setAttribute('data-immersive-ready', '1');

  // === Utils ===
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];
  const safe = (fn) => { try { fn(); } catch(_){} };

  // === Config dinámica de clave/llave de sesión ===
  const obraTitle = (document.querySelector('meta[name="piece-name"]')?.content || '').trim();
  const normalized = obraTitle.toLowerCase().replace(/\s+/g,''); // minúsculas + sin espacios
  const MASTER_CODE = normalized + normalized.length;             // regla: titulo + nº letras
  const SESSION_KEY = normalized + '-unlocked';                   // sesión única por obra

  // === Diálogos utilitarios ===
  const openDialog = (dlg) => {
    if (!dlg) return;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else { dlg.hidden = false; dlg.style.display = 'block'; }
    document.body.style.overflow = 'hidden';
  };
  const closeDialog = (dlg) => {
    if (!dlg) return;
    if (typeof dlg.close === 'function') dlg.close();
    else { dlg.hidden = true; dlg.style.display = ''; }
    document.body.style.overflow = '';
  };

  // === BLOQUEO / DESBLOQUEO sección exclusiva ===
  const exclusive = $('#exclusive');
  function lockExclusive(){
    if (!exclusive) return;
    exclusive.hidden = false;
    exclusive.setAttribute('aria-hidden', 'true');
    exclusive.classList.add('is-blurred');
  }
  function unlockExclusive(){
    if (!exclusive) return;
    exclusive.classList.remove('is-blurred');
    exclusive.removeAttribute('aria-hidden');
  }

  // === HERO media autoplay (si existe) ===
  (function setupHero(){
    const v = document.querySelector('.hero video');
    if (!v) return;
    const play = () => v.play().catch(()=>{});
    window.addEventListener('load', play, { once:true });
    document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) play(); });
  })();

  // === Modal de Acceso (contraseña) ===
  (function setupAccess(){
    const accessModal = $('#accessModal');
    const accessForm  = $('#accessForm');
    const input       = $('#accessCode');
    const msg         = $('#accessMsg');

    if (!exclusive) return;

    // Estado inicial
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      // Ya desbloqueado previamente
      unlockExclusive();
    } else {
      lockExclusive();
    }

    // Botón “Conocer más de la obra”
    $('#openAccess')?.addEventListener('click', ()=>{
      openDialog(accessModal);
      requestAnimationFrame(()=> input?.focus());
    });

    // Validación de contraseña
    let tries = 0;
    accessForm?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const val = (input?.value || '').trim().toLowerCase();
      tries++;
      if (val === MASTER_CODE) {
        sessionStorage.setItem(SESSION_KEY, '1');
        if (msg) msg.textContent = 'Acceso concedido.';
        unlockExclusive();
        setTimeout(()=> closeDialog(accessModal), 220);
      } else {
        if (msg) msg.textContent = `Contraseña incorrecta (${tries}).`;
        safe(()=> input.select());
      }
    });

    // Cierres
    accessModal?.addEventListener('click', (e)=>{ if(e.target === accessModal) closeDialog(accessModal); });
    $('#accessModal .modal__close')?.addEventListener('click', ()=> closeDialog(accessModal));
  })();

  // === Modal de pedido (obra / tarjeta) ===
  (function setupCompra(){
    const pedidoModal = $('#pedidoModal');
    const pedidoForm  = $('#pedidoForm');
    if (!pedidoModal || !pedidoForm) return;

    const obra = (document.querySelector('meta[name="piece-name"]')?.content || 'Obra').trim();
    const cat  = (document.querySelector('meta[name="piece-category"]')?.content || 'Óleos').trim();

    function openPedido(type){
      const nombre = (type === 'gift')
        ? `Tarjeta impresa — ${obra} (Historia completa)`
        : obra;

      // Autorrelleno
      const obraNombreEl = $('#obraNombre');
      if (obraNombreEl) obraNombreEl.value = nombre;

      const obraCatEl = $('#obraCategoria');
      if (obraCatEl) obraCatEl.value = cat;

      const urlEl = $('#obraURL'); if (urlEl) urlEl.value = location.href;
      const thEl  = $('#obraThumb'); if (thEl) thEl.value = 'assets/cristo-poster.jpg';

      const notasEl = $('#contactoNotas');
      if (notasEl) notasEl.value = `Referido por: ${nombre}. `;

      // Abrir
      openDialog(pedidoModal);
    }

    // Delegación: cualquier botón con data-pedir
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-pedir]');
      if (!btn) return;
      e.preventDefault();
      const type = btn.getAttribute('data-type'); // "obra" | "gift"
      openPedido(type);
    });

    // Burbuja opcional
    $('#bubbleContact')?.addEventListener('click', ()=>{
      openPedido('obra'); // por defecto abre como obra
    });

    // Cierres
    $('#pedidoModal .modal-close')?.addEventListener('click', ()=> closeDialog(pedidoModal));
    pedidoModal.addEventListener('click', (e)=>{ if(e.target === pedidoModal) closeDialog(pedidoModal); });

    // Envío (demo)
    pedidoForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      alert('¡Gracias! Tu solicitud fue registrada. El artista te contactará personalmente.');
      pedidoForm.reset();
      closeDialog(pedidoModal);
    });
  })();
})();

// ========= Helpers =========
const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// ========= Inyección de CSS mínimo para el blur/overlay (por si no está en tu stylesheet) =========
(function injectLockedStyles(){
  if (document.getElementById('locked-styles')) return;
  const css = `
  #exclusive{ position: relative; }
  #exclusive.is-locked{
    filter: blur(18px) saturate(.8) brightness(.85);
    transition: filter .5s ease;
    pointer-events: none; user-select: none;
  }
  .lock-overlay{
    position: absolute; inset: 0;
    display: grid; place-items: center;
    background:
      linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.75));
    border-radius: inherit;
    z-index: 5;
  }
  .lock-overlay__panel{
    text-align: center; max-width: 640px; padding: 22px 18px;
    color: #fff; border: 1px solid rgba(255,255,255,.18);
    background: rgba(10,12,18,.6); backdrop-filter: blur(10px);
    border-radius: 16px;
  }
  .lock-overlay__panel h3{ margin: 0 0 6px; font-weight: 800; letter-spacing: .02em; }
  .lock-overlay__panel p{ margin: 0 0 12px; color: #cbd1dc; }
  .btn, .btn--primary{
    border:0; border-radius:12px; padding:12px 18px; font-weight:800; cursor:pointer;
  }
  .btn--primary{ background:#ff8a5c; color:#111; box-shadow:0 8px 24px rgba(0,0,0,.35); }
  `;
  const style = document.createElement('style');
  style.id = 'locked-styles';
  style.textContent = css;
  document.head.appendChild(style);
})();

// ========= HERO autoplay =========
(function ensureHeroAutoplay(){
  const heroVid = document.querySelector('header.hero video, .hero__video');
  if(!heroVid) return;
  const tryPlay = () => heroVid.play().catch(()=>{});
  window.addEventListener('load', tryPlay, { once: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tryPlay(); });
})();

// ========= Reveal on scroll =========
(function reveal(){
  const els = $$('[data-reveal]');
  if(!els.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, {threshold: .2});
  els.forEach(el => io.observe(el));
})();

// ========= Parallax (suave) =========
(function parallax(){
  const frames = $$('[data-parallax]');
  if(!frames.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      const img = entry.target.querySelector('img'); if(!img) return;
      const speed = parseFloat(entry.target.dataset.speed || '0.2');
      if(entry.isIntersecting){
        const onScroll = () => {
          const r = entry.target.getBoundingClientRect();
          const vh = innerHeight || 1;
          const p = (r.top / vh) - 0.5;
          img.style.transform = `translateY(${p*speed*200}px)`;
        };
        entry.target._onScroll = onScroll;
        addEventListener('scroll', onScroll, { passive:true });
        onScroll();
      }else{
        removeEventListener('scroll', entry.target._onScroll || (()=>{}));
      }
    });
  }, {threshold:[0,1]});
  frames.forEach(f => io.observe(f));
})();

// ========= Audio toggle =========
(function audioCtl(){
  const btn = $('#audioToggle');
  const loop = $('#audioLoop');
  const fx   = $('#audioFx');
  if(!btn || !loop || !fx) return;

  btn.addEventListener('click', async ()=>{
    const on = btn.getAttribute('aria-pressed') === 'true';
    if(on){
      loop.pause(); fx.pause();
      btn.setAttribute('aria-pressed','false');
      btn.textContent = '♫';
    }else{
      try{
        await loop.play(); await fx.play();
        btn.setAttribute('aria-pressed','true');
        btn.textContent = '❚❚';
      }catch(e){ /* autoplay bloqueado */ }
    }
  });
})();

// ========= Modal acceso por código + LÓGICA DE BLOQUEO/BLUR =========
(function access(){
  const modal = $('#accessModal');
  const open  = $('#openAccess');               // tu botón (“Explorar pieza” o “Conocer más de la historia”)
  const form  = $('#accessForm');
  const input = $('#accessCode');
  const msg   = $('#accessMsg');
  const close = modal?.querySelector('.modal__close');
  const exclusive = $('#exclusive');            // bloque privado que queremos mostrar borroso

  if(!modal || !form || !exclusive){
    // Si no hay modal o exclusive, no hacemos nada
    return;
  }

  // Datos de la pieza
  const pieceName = (document.querySelector('meta[name="piece-name"]')?.content || 'Obra').trim();
  const edition   = (document.querySelector('meta[name="piece-edition"]')?.content || '—').trim();

  // Pinta edición en dos lugares (si existen)
  $('#edition') && ($('#edition').textContent = `Pieza #${edition}`);
  $('#edition2') && ($('#edition2').textContent = edition);

  // Genera ID simple para certificado
  const pid = btoa( pieceName.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,'') + '-' + (Date.now()%1e6) ).slice(0,10);
  $('#pieceId') && ($('#pieceId').textContent = pid);

  // Algoritmo requerido: minúsculas, sin tildes, sin espacios + número de letras
  const genCode = (name) => {
    const clean = name.toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu,'') // quita acentos
      .replace(/\s+/g,'');                             // quita espacios
    return clean + clean.length;
  };
  const expected = genCode(pieceName);
  const key = 'unlocked:' + expected;

  // Helper: muestra el bloque privado pero borroso, con overlay CTA
  function showLockedPreview(){
    // si venía hidden (del HTML), lo mostramos para que “se intuya” algo
    exclusive.hidden = false;
    exclusive.classList.add('is-locked');

    // si ya existe overlay, no duplicar
    if (exclusive.querySelector('.lock-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'lock-overlay';
    overlay.innerHTML = `
      <div class="lock-overlay__panel">
        <h3>Contenido exclusivo</h3>
        <p>La historia completa, proceso de pintado, galería HD y certificado están disponibles para compradores.</p>
        <button class="btn btn--primary" type="button" id="ctaUnlock">Conocer más de la historia</button>
      </div>
    `;
    exclusive.appendChild(overlay);

    // Abrir modal desde el overlay
    overlay.querySelector('#ctaUnlock')?.addEventListener('click', () => {
      openModal();
    });
  }

  // Helper: elimina blur y overlay (desbloqueado)
  function unlock(){
    // Asegura que sea visible
    exclusive.hidden = false;
    // Quita blur
    exclusive.classList.remove('is-locked');
    // Quita overlay si existe
    exclusive.querySelector('.lock-overlay')?.remove();
    // Revela el contenido “ya nítido”
    $$('#exclusive [data-reveal]').forEach(el => el.classList.add('is-visible'));
  }

  // Apertura de modal (reutilizable)
  function openModal(){
    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open','');
    }
    setTimeout(() => input?.focus(), 50);
  }

  // Si ya desbloqueó en esta sesión, mostrar directo; si no, modo borroso
  if(sessionStorage.getItem(key)){
    unlock();
  }else{
    showLockedPreview();
  }

  // Botón global para abrir modal (si existe en la página)
  open?.addEventListener('click', openModal);

  // Cierre del modal
  close?.addEventListener('click', ()=>{
    if (typeof modal.close === 'function') modal.close();
    else modal.removeAttribute('open');
  });
  modal.addEventListener('click', (e)=>{ if(e.target === modal) close?.click(); });

  // Validación de código
  let attempts = 0;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const val = (input.value || '').trim()
      .toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'') // sin tildes
      .replace(/\s+/g,'');                                         // sin espacios

    attempts++;
    if(val === expected){
      sessionStorage.setItem(key,'1');
      msg.style.color = '#7CFC9A';
      msg.textContent = 'Acceso concedido. Desbloqueando…';
      unlock();
      setTimeout(()=> close?.click(), 300);
    }else{
      msg.style.color = '#ff8a5c';
      // pista opcional: primeras 3 letras
      msg.textContent = `Código incorrecto (${attempts}).`;
      input.select();
    }
  });
})();

// ========= Lightbox simple =========
(function lightbox(){
  const lb = $('#lightbox'), img = $('#lightboxImg'), close = $('.lightbox__close');
  if(!lb) return;
  document.addEventListener('click', e=>{
    const a = e.target.closest('a.gl'); if(!a) return;
    e.preventDefault();
    img.src = a.getAttribute('href');
    lb.hidden = false;
  });
  close?.addEventListener('click', ()=> lb.hidden = true);
  lb.addEventListener('click', e=>{ if(e.target === lb) lb.hidden = true; });
  addEventListener('keydown', e=>{ if(e.key === 'Escape') lb.hidden = true; });
})();

/* ===== Helpers ===== */
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];

/* ===== Obras para la parte inmersiva (puedes ampliar la lista) ===== */
const WORKS = [
  { slug:"asi-es-mi-peru", title:"Así es mi Perú", meta:"Cartulina, lápiz y acuarela · 20×28 cm",
    cover:"imagenes/papel-1.jpg",
    story:"Una postal íntima. El trazo captura costumbres y afectos; un país que cabe en la memoria de quien lo mira.",
    process:["imagenes/papel-1.jpg","imagenes/papel-2.jpg","imagenes/papel-3.jpg"] },
  { slug:"be-cool", title:"Be Cool", meta:"Cartulina, lápiz y acuarela · 20×28 cm",
    cover:"imagenes/papel-2.jpg",
    story:"Cuando la calma se vuelve estilo: la línea se relaja y el gesto decide dónde mirar.",
    process:["imagenes/papel-2.jpg","imagenes/papel-3.jpg","imagenes/papel-1.jpg"] },
  { slug:"la-maravilla-del-mundo", title:"La maravilla del mundo", meta:"Cartulina, lápiz y acuarela · 20×28 cm",
    cover:"imagenes/papel-3.jpg",
    story:"El asombro como método: mirar lo cotidiano hasta encontrar lo extraordinario.",
    process:["imagenes/papel-3.jpg","imagenes/papel-1.jpg","imagenes/papel-2.jpg"] },
];

/* ===== Render inmersivo ===== */
function renderWorks(){
  const wrap = $('#works');
  if(!wrap) return;
  wrap.innerHTML = WORKS.map(w => `
    <article id="${w.slug}" class="work">
      <figure class="media">
        <img src="${w.cover}" alt="${w.title}" loading="lazy" decoding="async">
      </figure>
      <div class="copy">
        <h3>${w.title}</h3>
        <div class="meta">${w.meta}</div>
        <p>${w.story}</p>
        <p class="muted">Proceso</p>
        <div class="gallery">
          ${w.process.map(src=>`<img src="${src}" loading="lazy" decoding="async" alt="Proceso ${w.title}">`).join('')}
        </div>
      </div>
    </article>
  `).join('');
}

/* ===== Autoplay del video del hero ===== */
(function heroAutoplay(){
  const v = $('#heroVid');
  if(!v) return;
  const play = () => v.play().catch(()=>{});
  window.addEventListener('load', play, { once:true });
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) play(); });
})();

/* ===== Acceso por contraseña (solo desbloquea el bloque borroso) ===== */
(function access(){
  const MASTER_CODE = "miperu6"; // <- tu contraseña única
  renderWorks();

  const locked = $('#locked');
  const modal  = $('#accessModal');
  const input  = $('#accessCode');
  const form   = $('#accessForm');
  const msg    = $('#accessMsg');

  // Abrir modal desde botones “Conocer más”
  const open = () => { modal.showModal(); requestAnimationFrame(()=> input?.focus()); };
  $('#openModalTop')?.addEventListener('click', open);
  $('#openModal')?.addEventListener('click', open);

  // Cerrar modal manual
  $('#cancelModal')?.addEventListener('click', ()=> modal.close());
  $('#accessModal .close')?.addEventListener('click', ()=> modal.close());
  modal?.addEventListener('click', e=>{ if(e.target === modal) modal.close(); });

  // Validación
  let tries = 0;
  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const val = (input.value||'').trim().toLowerCase();
    tries++;
    if(val === MASTER_CODE){
      msg.textContent = 'Acceso concedido.';
      locked?.classList.remove('is-blurred');      // quita blur del bloque inmersivo
      locked?.setAttribute('aria-hidden','false');
      // cierre robusto al siguiente frame
      requestAnimationFrame(()=>{
        try{ modal.close(); }catch(_){}
        modal.removeAttribute?.('open');
        modal.setAttribute?.('hidden','');
        modal.style.display = 'none';
      });
      // Si venía ?obra=slug, hace scroll
      const slug = new URLSearchParams(location.search).get('obra');
      if(slug){
        const t = document.getElementById(slug);
        if(t) setTimeout(()=> t.scrollIntoView({behavior:'smooth', block:'start'}), 260);
      }
    }else{
      msg.textContent = `Contraseña incorrecta (${tries}).`;
      input.select();
    }
  });
})();

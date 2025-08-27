// ============ HERO autoplay ============
(function ensureHeroAutoplay(){
  const heroVid = document.querySelector('header.hero video');
  if(!heroVid) return;
  const tryPlay = () => heroVid.play().catch(()=>{});
  window.addEventListener('load', tryPlay, { once: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tryPlay(); });
})();

// ============ Dataset buscador ============
const OBRAS = [
  { name: "Ángel sobre Lotus", url: "cuadros/angel-sobre-lotus.html", cat: "Óleos",                 thumb: "cuadros/imagenesarte/angel-sobre-lotus-1.jpg" },
  { name: "Cupido Punta Roja", url: "obra/cupido-punta-roja.html",   cat: "Escultura & Cerámica",  thumb: "imagenes/cupido-1.jpg" },
  { name: "Escultura Dragón Rojo", url: "obra/dragon-rojo.html",     cat: "Escultura & Cerámica",  thumb: "imagenes/dragon-1.jpg" },
  { name: "Estudio Botánico",   url: "obra/estudio-botanico.html",   cat: "Papel & Agua",          thumb: "imagenes/papel-1.jpg" },
];

// ============ Buscador con autocompletar ============
(function initSearch(){
  const input = document.getElementById('siteSearch');
  const list  = document.getElementById('searchResults');
  if(!input || !list) return;

  let idx = -1;
  const render = (items) => {
    list.innerHTML = items.map((it,i)=>`
      <li role="option" data-url="${it.url}" data-i="${i}" ${i===idx?'aria-selected="true"':''}>
        <img class="thumb" src="${it.thumb}" alt="">
        <div class="meta"><span class="ttl">${it.name}</span><span class="cat">${it.cat}</span></div>
      </li>`).join('');
    list.classList.toggle('show', items.length>0);
  };
  const search = (q) => {
    q = q.trim().toLowerCase();
    if(!q){ list.classList.remove('show'); list.innerHTML=''; idx=-1; return; }
    const res = OBRAS.filter(o => o.name.toLowerCase().includes(q)).slice(0,12);
    idx = res.length ? 0 : -1;
    render(res);
  };
  input.addEventListener('input', e => search(e.target.value));
  list.addEventListener('click', e => { const li = e.target.closest('li[data-url]'); if(li){ window.location.href = li.dataset.url; }});
  input.addEventListener('keydown', e => {
    const items = [...list.querySelectorAll('li')]; if(!items.length) return;
    if(e.key==='ArrowDown'){ idx=Math.min(idx+1, items.length-1); e.preventDefault(); }
    if(e.key==='ArrowUp'){   idx=Math.max(idx-1, 0);            e.preventDefault(); }
    if(e.key==='Enter'){ const go=items[idx]; if(go){ window.location.href = go.dataset.url; } }
    items.forEach((el,i)=> el.setAttribute('aria-selected', i===idx?'true':'false'));
  });
  document.addEventListener('click', e => { if(!e.target.closest('.search')) list.classList.remove('show'); });
})();

// ============ Preload de imágenes alternativas (hover-swap) ============
(function preloadAlts(){
  document.querySelectorAll('.product-media .img-alt').forEach(img => {
    const pre = new Image(); pre.src = img.getAttribute('src');
  });
})();

// ============ Soporte táctil para hover-swap ============
(function touchHoverSwap(){
  document.querySelectorAll('.product-card').forEach(card=>{
    let tapped=false;
    card.addEventListener('touchstart',e=>{
      if(!tapped){
        card.classList.add('show-alt');
        tapped=true;
        setTimeout(()=>tapped=false,800);
        e.preventDefault();
      }
    }, {passive:false});
  });
})();

// ============ Modal de PEDIDO (sin carrito) ============
const modal   = document.getElementById('pedidoModal');
const mClose  = modal ? modal.querySelector('.modal-close') : null;
const form    = modal ? modal.querySelector('#pedidoForm') : null;

function openModal(data){
  if(!modal) return;
  const obraNombre    = modal.querySelector('#obraNombre');
  const obraCategoria = modal.querySelector('#obraCategoria');
  const obraURL       = modal.querySelector('#obraURL');
  const obraThumb     = modal.querySelector('#obraThumb');
  const notas         = modal.querySelector('#contactoNotas');

  obraNombre.value     = data.name  || '';
  obraCategoria.value  = data.cat   || '';
  obraURL.value        = data.url   || location.href;
  obraThumb.value      = data.thumb || '';

  // Prefill de notas con referencia
  const base = data.name ? `Referido por: ${data.name}. ` : '';
  notas.value = base;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeModal(){
  if(!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
}
if(mClose){ mClose.addEventListener('click', closeModal); }
if(modal){ modal.addEventListener('click', e => { if(e.target === modal) closeModal(); }); }
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

// Burbujas: “Contacto” abre el mismo modal
document.querySelector('.bubble-contact')?.addEventListener('click', () => openModal({}));

// ============ FIX: Interceptar "Pedir" para que NO navegue al <a> ============
// (Captura el click ANTES que el <a> y detiene la navegación)
function handlePedir(event){
  const btn = event.target.closest('.btn-pedir');
  if(!btn) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const card = btn.closest('.product-card');
  const name = card?.dataset.obra  || card?.querySelector('.product-title')?.textContent?.trim();
  const cat  = card?.dataset.cat   || '';
  const url  = card?.querySelector('.product-link')?.getAttribute('href') || location.href;
  const thumb= card?.dataset.thumb || card?.querySelector('.product-media img')?.getAttribute('src') || '';

  openModal({ name, cat, url, thumb });
}
// Click en fase de captura (true) para ganarle al <a>
document.addEventListener('click', handlePedir, true);
// iOS/Android: a veces navega en touchend; interceptamos también
document.addEventListener('touchend', function(event){
  const btn = event.target.closest('.btn-pedir');
  if(!btn) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const card = btn.closest('.product-card');
  const name = card?.dataset.obra  || card?.querySelector('.product-title')?.textContent?.trim();
  const cat  = card?.dataset.cat   || '';
  const url  = card?.querySelector('.product-link')?.getAttribute('href') || location.href;
  const thumb= card?.dataset.thumb || card?.querySelector('.product-media img')?.getAttribute('src') || '';

  openModal({ name, cat, url, thumb });
}, true);

// ============ Prefill si llegan con ?obra=... ============
(function prefillFromQuery(){
  const params = new URLSearchParams(location.search);
  const obraQ  = params.get('obra');
  if(!obraQ) return;

  const match = OBRAS.find(o => o.name.toLowerCase() === obraQ.toLowerCase());
  if(match){ openModal({ name: match.name, cat: match.cat, url: match.url, thumb: match.thumb }); }
  else { openModal({ name: obraQ, cat: '', url: location.href }); }
})();

// ============ Botón "Pedir" en páginas de detalle (lee el <h1>) ============
document.addEventListener('click', (e)=>{
  const det = e.target.closest('[data-pedir-detalle]');
  if(!det) return;
  e.preventDefault();
  const h1  = document.querySelector('main h1, .detail-info h1')?.textContent?.trim();
  const cat = document.body?.dataset?.theme || ''; // si usas data-theme en <body>
  openModal({ name: h1 || '', cat, url: location.href });
});

// ============ Envío del formulario (DEMO sin backend) ============
if(form){
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    // Aquí conectas tu backend/email/WhatsApp/etc.
    alert('¡Gracias! Tu solicitud fue registrada. El artista te contactará personalmente.');
    form.reset();
    closeModal();
  });
}
const lazyVideos = document.querySelectorAll("video.lazy-video");

const videoObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const video = entry.target;
      const src = video.dataset.src;
      if (src) {
        video.src = src; // ahora sí carga el video real
        video.removeAttribute("data-src");
      }
      obs.unobserve(video); // deja de vigilar este video
    }
  });
}, { threshold: 0.25 }); // se activa cuando al menos 25% del video es visible

lazyVideos.forEach(video => videoObserver.observe(video));
<script type="module">
  // ===== Firebase (v10, módulos ES) =====
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

  // TU CONFIG (la que me diste)
  const firebaseConfig = {
    apiKey: "AIzaSyBD6ZQYAbY2ojjm0yiuCnkhXuT13ZnobWM",
    authDomain: "arte-da57d.firebaseapp.com",
    projectId: "arte-da57d",
    storageBucket: "arte-da57d.firebasestorage.app",
    messagingSenderId: "134306013865",
    appId: "1:134306013865:web:96f862a046eb0562103fb8",
    measurementId: "G-JJYJ884MKF"
  };

  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  // ===== Helpers =====
  const $ = (s, c=document) => c.querySelector(s);
  const getParam = (k) => new URLSearchParams(location.search).get(k) || "";

  // ===== Autorrelleno: obra/categoría/tipo =====
  const obraMeta = document.querySelector('meta[name="piece-name"]')?.content || "";
  const catMeta  = document.querySelector('meta[name="piece-category"]')?.content || "";

  const obraField = $('#f_obra');
  const catField  = $('#f_categoria');
  const tipoField = $('#f_tipo');

  // Permite pre-cargar por URL: ?obra=El%20León&cat=Óleos&tipo=tarjeta
  const obraFromUrl = getParam('obra');
  const catFromUrl  = getParam('cat');
  const tipoFromUrl = getParam('tipo'); // "original" | "tarjeta"

  const obraBase = obraFromUrl || obraMeta || "Obra";
  const tipo     = (tipoFromUrl || "original").toLowerCase();

  obraField.value = (tipo === "tarjeta")
    ? `${obraBase} — Tarjeta impresa`
    : `${obraBase} — Obra original`;

  catField.value  = catFromUrl || catMeta || "Óleos";
  tipoField.value = tipo;

  // ===== Envío a Firestore =====
  const form   = $('#reservaForm');
  const status = $('#f_status');
  const submit = $('#f_submit');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const medios = [...document.querySelectorAll('input[name="medio"]:checked')].map(x => x.value);

    // payload a guardar
    const data = {
      obra: obraField.value.trim(),
      categoria: catField.value.trim(),
      tipo: tipoField.value.trim(),                  // original | tarjeta
      nombre: $('#f_nombre').value.trim(),
      telefono: $('#f_tel').value.trim(),
      email: $('#f_email').value.trim(),
      pais: $('#f_pais').value.trim(),
      medioContacto: medios,                         // array
      notas: $('#f_notas').value.trim(),
      url: location.href,
      referrer: document.referrer || 'directo',
      fecha: serverTimestamp()
    };

    // validación simple
    if (!data.nombre || !data.telefono || !data.pais) {
      status.textContent = "Completa nombre, teléfono y país.";
      return;
    }

    try {
      submit.disabled = true;
      status.textContent = "Enviando…";
      await addDoc(collection(db, 'pedidos'), data);
      status.textContent = "¡Listo! Tu solicitud fue enviada. Te contactaré pronto.";
      // Resetea pero conserva obra/categoría/tipo
      const obraKeep = obraField.value, catKeep = catField.value, tipoKeep = tipoField.value;
      form.reset();
      obraField.value = obraKeep; catField.value = catKeep; tipoField.value = tipoKeep;
    } catch(err) {
      console.error(err);
      status.textContent = "Hubo un error al enviar. Intenta de nuevo.";
    } finally {
      submit.disabled = false;
    }
  });
</script>
// Botones de compra → van a index#reservar con autorrelleno
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.buy-btn');
  if (!btn) return;

  e.preventDefault();
  const card = btn.closest('.product-card');
  if (!card) return;

  const obra = card.dataset.obra || 'Obra';
  const categoria = card.dataset.cat || 'Óleos';
  const tipo = btn.getAttribute('data-buy') === 'tarjeta' ? 'tarjeta' : 'original';

  const params = new URLSearchParams({
    obra: obra,
    categoria: categoria,
    tipo: tipo
  });

  // 🔥 Los params van antes del #reservar
  location.href = `index.html?${params.toString()}#reservar`;
});

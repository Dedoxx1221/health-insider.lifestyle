/**
 * ==========================================================================
   GOLDENES ELIXIER (NEUROSCHUTZ) — BLACK FRIDAY DEUTSCHLAND
   Lógica Frontend: Data Dinâmica em Alemão & Cabeçalho Sticky estilo Der Spiegel
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initGermanDate();
  initStickySpiegelHeader();
});

/**
 * 1. Data atual formatada em alemão no topo da página (ex: Stand: 27. Oktober 2026)
 */
function initGermanDate() {
  const dateContainers = document.querySelectorAll('.dynamic-german-date');
  if (!dateContainers.length) return;

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(today);

  dateContainers.forEach(container => {
    container.textContent = `Stand: ${formattedDate}`;
  });
}

/**
 * 2. Cabeçalho Der Spiegel: maior no topo e compacto com ícone menu+lupa ao rolar
 */
function initStickySpiegelHeader() {
  const brandBar = document.querySelector('.spiegel-brand-bar');
  if (!brandBar) return;

  const onScroll = () => {
    if (window.scrollY > 36) {
      brandBar.classList.add('is-scrolled');
    } else {
      brandBar.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

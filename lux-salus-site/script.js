(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Cabeçalho sutil e fluido na rolagem
  const setHeaderState = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  // 2. Menu mobile responsivo e acessível
  const closeMenu = () => {
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Abrir menu');
  };

  toggle?.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
    nav?.classList.toggle('is-open', !isOpen);
  });

  navLinks.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => {
    if (nav?.classList.contains('is-open') && !nav.contains(event.target) && !toggle?.contains(event.target)) {
      closeMenu();
    }
  });

  // 3. Ativar revelações progressivas de conteúdo
  document.documentElement.classList.add('js-observer-ready');

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // 4. Sincronizar link ativo da navegação com a seção visível
  const sections = ['inicio', 'espaco', 'especialidades', 'depoimentos', 'localizacao']
    .map(id => document.getElementById(id)).filter(Boolean);

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`));
    }, { threshold: [0.2, 0.45, 0.7], rootMargin: '-18% 0px -55% 0px' });

    sections.forEach(section => sectionObserver.observe(section));
  }

  // 5. Parallax sutil e controlado nas imagens do espaço e dos serviços
  const parallaxImages = document.querySelectorAll('.service-image img, .space-photo img');
  if (!reduceMotion && parallaxImages.length > 0 && window.innerWidth > 768) {
    let ticking = false;

    const updateParallax = () => {
      const vh = window.innerHeight;
      parallaxImages.forEach(img => {
        const rect = img.parentElement ? img.parentElement.getBoundingClientRect() : img.getBoundingClientRect();
        // Apenas processa se estiver na tela ou próximo
        if (rect.bottom >= -50 && rect.top <= vh + 50) {
          const centerDelta = (rect.top + rect.height / 2) - (vh / 2);
          // Fator de movimento muito sutil limitado entre -6px e 6px
          const offset = Math.max(-6, Math.min(6, centerDelta * -0.02));
          img.style.transform = `scale(1.02) translateY(${offset.toFixed(1)}px)`;
        }
      });
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    }, { passive: true });

    // Execução inicial
    updateParallax();
  }

  // 6. Animação fluida e suave do fechamento (.closing-cta)
  const closingCta = document.querySelector('.closing-cta');
  if (closingCta && !reduceMotion) {
    let scheduled = false;
    const updateCta = () => {
      const viewportHeight = window.innerHeight;
      const rect = closingCta.getBoundingClientRect();
      const ctaTop = rect.top + window.scrollY;
      const start = ctaTop - viewportHeight;
      const end = ctaTop;
      const progress = Math.min(Math.max((window.scrollY - start) / (end - start), 0), 1);
      const width = 78 + (98 - 78) * progress;
      const scale = 0.92 + (1 - 0.92) * progress;
      const borderRadius = 52 - (52 - 24) * progress;
      closingCta.style.width = `${width}%`;
      closingCta.style.transform = `scale(${scale})`;
      closingCta.style.borderRadius = `${borderRadius}px`;
      scheduled = false;
    };

    window.addEventListener('scroll', () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateCta);
      }
    }, { passive: true });

    updateCta();
  }

  // Ano atual no rodapé
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();

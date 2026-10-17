import Lenis from 'lenis';

(() => {
  const header = document.querySelector('.site-header');
  const progressBar = document.getElementById('scroll-progress');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const overlayScrollbar = document.getElementById('overlay-scrollbar');
  const overlayThumb = document.getElementById('overlay-scrollbar-thumb');
  let scrollbarHideTimer = null;
  let isDraggingScrollbar = false;
  let dragStartY = 0;
  let dragStartScrollY = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 0. Inicialização do Lenis Smooth Scroll acoplado ao requestAnimationFrame
  const lenis = !reduceMotion
    ? new Lenis({
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        orientation: 'vertical',
      })
    : null;

  // 1. Menu mobile responsivo e acessível
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

  // 2. Rolagem Suave Inteligente para Links Internos (Anchor Navigation integrada ao Lenis)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = href === '#topo' ? document.body : document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      closeMenu();

      const headerHeight = header ? header.offsetHeight : 80;

      if (lenis) {
        lenis.scrollTo(href === '#topo' ? 0 : target, {
          offset: href === '#topo' ? 0 : -headerHeight + 2,
          duration: 1.2,
        });
      } else {
        const targetTop = href === '#topo'
          ? 0
          : target.getBoundingClientRect().top + window.scrollY - headerHeight + 2;

        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      }

      if (history.pushState) {
        history.pushState(null, '', href);
      }
    });
  });

  // 3. Revelações dinâmicas suaves (executadas uma única vez por elemento para evitar saltos de layout)
  document.documentElement.classList.add('js-observer-ready');
  const revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // 4. Sincronizar link ativo da navegação com a seção visível
  const sections = ['inicio', 'localizacao', 'especialidades', 'espaco']
    .map(id => document.getElementById(id)).filter(Boolean);

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`));
    }, { threshold: [0.2, 0.45, 0.7], rootMargin: '-18% 0px -55% 0px' });

    sections.forEach(section => sectionObserver.observe(section));
  }

  // 5. Motor de Parallax Unificado de Alta Performance (60fps / 120fps RAF sem Layout Thrashing)
  const heroSection = document.getElementById('inicio');
  const heroBg = document.querySelector('.hero-parallax-bg');
  const heroContent = document.querySelector('.hero-content');

  const serviceCards = [...document.querySelectorAll('.service-card-item')].map(card => ({
    card,
    img: card.querySelector('.service-image img')
  })).filter(item => item.img);

  const treatmentVisual = document.querySelector('.treatment-visual');
  const treatmentPhoto = document.querySelector('.treatment-photo-wrapper');
  const treatmentBadge = document.querySelector('.treatment-badge-card');
  const spaceGallery = document.querySelector('.space-gallery');
  const spacePhoto = document.querySelector('.space-photo');
  const spacePhotoSmall = document.querySelector('.space-photo--small');
  const spaceImages = [...document.querySelectorAll('.space-photo img')];
  const locationMapBox = document.querySelector('.location-simple-map-box');
  const closingCta = document.querySelector('.closing-cta');
  const ctaBranchLeft = document.querySelector('.cta-branch--left');
  const ctaBranchRight = document.querySelector('.cta-branch--right');

  let ticking = false;
  let vh = window.innerHeight;
  let isDesktop = window.innerWidth > 768;
  let maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  let lastHeaderScrolled = null;
  let lastMapTranslateY = 0;
  let lastCtaTranslateY = 0;

  const updateMetrics = () => {
    vh = window.innerHeight;
    isDesktop = window.innerWidth > 768;
    maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  };

  const computeExpandingCard = (anchorRect, includeBadge = false) => {
    if (!anchorRect || anchorRect.bottom < -120 || anchorRect.top > vh + 120) return null;

    const enterPoint = vh;
    const fullPoint = vh * 0.40;

    let progress = 0;
    if (anchorRect.top >= enterPoint) {
      progress = 0;
    } else if (anchorRect.top <= fullPoint) {
      progress = 1;
    } else {
      progress = (enterPoint - anchorRect.top) / (enterPoint - fullPoint);
    }
    progress = Math.min(Math.max(progress, 0), 1);

    const minScale = isDesktop ? 0.86 : 0.90;
    const maxElevation = isDesktop ? 64 : 40;

    const currentScale = minScale + (1 - minScale) * progress;
    const elevationY = (1 - progress) * maxElevation;
    const centerDelta = (anchorRect.top + (anchorRect.height || 400) / 2) - (vh / 2);
    const scrollParallax = Math.max(-22, Math.min(22, centerDelta * -0.05));
    const totalTranslateY = elevationY + scrollParallax;

    return {
      transform: `translate3d(0, ${totalTranslateY.toFixed(1)}px, 0) scale(${currentScale.toFixed(3)})`,
      badgeTransform: includeBadge
        ? `translate3d(0, ${totalTranslateY.toFixed(1)}px, 0) scale(${(0.92 + 0.08 * progress).toFixed(3)})`
        : null
    };
  };

  const updateVisuals = () => {
    // ================= FASE 1: LEITURA GEOMÉTRICA (DOM READS) =================
    const scrollY = lenis ? lenis.scroll : window.scrollY;
    const scrollLimit = (lenis && lenis.limit > 0) ? lenis.limit : maxScroll;
    const heroRect = (!reduceMotion && heroSection) ? heroSection.getBoundingClientRect() : null;
    const treatmentRect = (!reduceMotion && treatmentVisual) ? treatmentVisual.getBoundingClientRect() : null;
    const spaceRect = (!reduceMotion && spaceGallery) ? spaceGallery.getBoundingClientRect() : null;

    const serviceRects = (!reduceMotion && isDesktop && serviceCards.length > 0)
      ? serviceCards.map(item => ({ img: item.img, rect: item.card.getBoundingClientRect() }))
      : null;

    const mapRawRect = (!reduceMotion && locationMapBox) ? locationMapBox.getBoundingClientRect() : null;
    const ctaRawRect = (!reduceMotion && closingCta) ? closingCta.getBoundingClientRect() : null;

    // ================= FASE 2: ESCRITA DE ESTILOS (DOM WRITES) =================
    // A. Estado do cabeçalho (apenas quando muda de estado)
    const isScrolled = scrollY > 12;
    if (isScrolled !== lastHeaderScrolled) {
      lastHeaderScrolled = isScrolled;
      header?.classList.toggle('is-scrolled', isScrolled);
    }

    // B. Barra de progresso da leitura
    const scrollProgress = Math.min(Math.max(scrollY / scrollLimit, 0), 1);
    if (progressBar) {
      progressBar.style.transform = `scaleX(${scrollProgress.toFixed(4)})`;
    }

    // B2. Atualização da Barra de rolagem flutuante sobreposta
    if (overlayThumb && overlayScrollbar) {
      const trackHeight = overlayScrollbar.clientHeight;
      const thumbHeight = Math.max(36, Math.min(trackHeight * (vh / (document.documentElement.scrollHeight || 1)), 180));
      const maxThumbTravel = Math.max(0, trackHeight - thumbHeight);
      const thumbY = scrollProgress * maxThumbTravel;

      overlayThumb.style.height = `${thumbHeight}px`;
      overlayThumb.style.transform = `translate3d(0, ${thumbY.toFixed(1)}px, 0)`;

      overlayScrollbar.classList.add('is-scrolling');
      clearTimeout(scrollbarHideTimer);
      scrollbarHideTimer = setTimeout(() => {
        if (!isDraggingScrollbar) {
          overlayScrollbar.classList.remove('is-scrolling');
        }
      }, 900);
    }

    if (!reduceMotion) {
      // C. Parallax do Hero
      if (heroRect && heroRect.bottom > 0) {
        if (heroBg) {
          const heroBgOffset = scrollY * 0.30;
          heroBg.style.transform = `translate3d(0, ${heroBgOffset.toFixed(1)}px, 0)`;
        }
        if (heroContent && isDesktop) {
          const heroContentOffset = scrollY * 0.08;
          heroContent.style.transform = `translate3d(0, ${heroContentOffset.toFixed(1)}px, 0)`;
        }
      }

      // C2. Animação fluida e expansão contínua do Maps ("sobe e abre") idêntica ao CTA via GPU
      if (locationMapBox && mapRawRect) {
        // Posição real sem a interferência do próprio translateY aplicado no frame anterior
        const naturalTop = mapRawRect.top - lastMapTranslateY;
        const naturalBottom = mapRawRect.bottom - lastMapTranslateY;

        if (naturalBottom >= -150 && naturalTop <= vh + 180) {
          const enterPoint = vh;
          const fullPoint = vh * 0.42;

          let progress = 0;
          if (naturalTop >= enterPoint) {
            progress = 0;
          } else if (naturalTop <= fullPoint) {
            progress = 1;
          } else {
            progress = (enterPoint - naturalTop) / (enterPoint - fullPoint);
          }
          progress = Math.min(Math.max(progress, 0), 1);

          const minScale = isDesktop ? 0.86 : 0.92;
          const currentScale = minScale + (1 - minScale) * progress;

          const elevationY = (1 - progress) * 90;
          const centerDelta = (naturalTop + (mapRawRect.height || 360) / 2) - (vh / 2);
          const scrollParallax = Math.max(-32, Math.min(32, centerDelta * -0.08));
          const totalTranslateY = elevationY + scrollParallax;
          lastMapTranslateY = totalTranslateY;

          locationMapBox.style.transform = `translate3d(0, ${totalTranslateY.toFixed(1)}px, 0) scale(${currentScale.toFixed(3)})`;
        }
      }

      // D. Expansão fluida e elevação das imagens em destaque (usando container pai fixo para evitar feedback loop)
      if (treatmentPhoto && treatmentRect) {
        const state = computeExpandingCard(treatmentRect, Boolean(treatmentBadge));
        if (state) {
          treatmentPhoto.style.transform = state.transform;
          if (treatmentBadge && state.badgeTransform) {
            treatmentBadge.style.transform = state.badgeTransform;
          }
        }
      }

      if (spacePhoto && spaceRect) {
        const state = computeExpandingCard(spaceRect, false);
        if (state) {
          spacePhoto.style.transform = state.transform;
        }
      }

      // E. Parallax sutil nas imagens das Especialidades (Cards)
      if (serviceRects) {
        for (let i = 0; i < serviceRects.length; i++) {
          const { img, rect } = serviceRects[i];
          if (rect.bottom >= -80 && rect.top <= vh + 80) {
            const centerDelta = (rect.top + rect.height / 2) - (vh / 2);
            const offset = Math.max(-20, Math.min(20, centerDelta * -0.07));
            img.style.setProperty('--parallax-y', `${offset.toFixed(1)}px`);
          }
        }
      }

      // F. Parallax editorial no Espaço ("Nossa Essência")
      if (isDesktop && spaceRect && spaceRect.bottom >= -80 && spaceRect.top <= vh + 80) {
        const centerDelta = (spaceRect.top + spaceRect.height / 2) - (vh / 2);

        if (spacePhotoSmall) {
          const cardFloat = Math.max(-24, Math.min(24, centerDelta * -0.06));
          spacePhotoSmall.style.setProperty('--card-parallax-y', `${cardFloat.toFixed(1)}px`);
        }

        const imgOffset = `${Math.max(-18, Math.min(18, centerDelta * -0.05)).toFixed(1)}px`;
        for (let i = 0; i < spaceImages.length; i++) {
          spaceImages[i].style.setProperty('--parallax-y', imgOffset);
        }
      }

      // G. Animação fluida e expansão contínua do CTA via GPU (transform scale + translate3d, zero reflow)
      if (closingCta && ctaRawRect) {
        // Posição real sem a interferência do próprio translateY aplicado no frame anterior
        const naturalTop = ctaRawRect.top - lastCtaTranslateY;
        const naturalBottom = ctaRawRect.bottom - lastCtaTranslateY;

        if (naturalBottom >= -150 && naturalTop <= vh + 180) {
          const enterPoint = vh;
          const fullPoint = vh * 0.42;

          let progress = 0;
          if (naturalTop >= enterPoint) {
            progress = 0;
          } else if (naturalTop <= fullPoint) {
            progress = 1;
          } else {
            progress = (enterPoint - naturalTop) / (enterPoint - fullPoint);
          }
          progress = Math.min(Math.max(progress, 0), 1);

          const minScale = isDesktop ? 0.86 : 0.92;
          const currentScale = minScale + (1 - minScale) * progress;

          const elevationY = (1 - progress) * 90;
          const centerDelta = (naturalTop + (ctaRawRect.height || 360) / 2) - (vh / 2);
          const scrollParallax = Math.max(-32, Math.min(32, centerDelta * -0.08));
          const totalTranslateY = elevationY + scrollParallax;
          lastCtaTranslateY = totalTranslateY;

          closingCta.style.transform = `translate3d(0, ${totalTranslateY.toFixed(1)}px, 0) scale(${currentScale.toFixed(3)})`;

          if (ctaBranchLeft) {
            const branchX = -progress * 26;
            const branchY = progress * 14;
            const branchRot = -progress * 7;
            ctaBranchLeft.style.transform = `translate3d(${branchX.toFixed(1)}px, ${branchY.toFixed(1)}px, 0) rotate(${(-10 + branchRot).toFixed(1)}deg)`;
          }

          if (ctaBranchRight) {
            const branchX = progress * 26;
            const branchY = -progress * 14;
            const branchRot = progress * 7;
            ctaBranchRight.style.transform = `translate3d(${branchX.toFixed(1)}px, ${branchY.toFixed(1)}px, 0) rotate(${(170 + branchRot).toFixed(1)}deg)`;
          }
        }
      }
    }

    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateVisuals);
    }
  };

  // Sincronização acoplada ao ciclo de renderização via requestAnimationFrame
  if (lenis) {
    lenis.on('scroll', updateVisuals);

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  } else {
    window.addEventListener('scroll', requestTick, { passive: true });
  }

  window.addEventListener('resize', () => {
    updateMetrics();
    requestTick();
  }, { passive: true });
  window.addEventListener('DOMContentLoaded', () => {
    updateMetrics();
    requestTick();
  });
  window.addEventListener('load', () => {
    updateMetrics();
    requestTick();
  });

  updateMetrics();
  requestTick();

  // Interação de arrastar a barra de rolagem sobreposta (Drag & Drop)
  if (overlayThumb && overlayScrollbar) {
    const onPointerMove = (e) => {
      if (!isDraggingScrollbar) return;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
      if (clientY === undefined) return;

      const trackHeight = overlayScrollbar.clientHeight;
      const thumbHeight = overlayThumb.offsetHeight || 48;
      const maxThumbTravel = Math.max(1, trackHeight - thumbHeight);
      const deltaY = clientY - dragStartY;
      const scrollLimit = (lenis && lenis.limit > 0) ? lenis.limit : maxScroll;
      const targetScroll = dragStartScrollY + (deltaY / maxThumbTravel) * scrollLimit;

      if (lenis) {
        lenis.scrollTo(targetScroll, { immediate: true });
      } else {
        window.scrollTo({ top: targetScroll });
      }
    };

    const onPointerUp = () => {
      if (!isDraggingScrollbar) return;
      isDraggingScrollbar = false;
      overlayScrollbar.classList.remove('is-active');
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    const onPointerDown = (e) => {
      isDraggingScrollbar = true;
      dragStartY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
      dragStartScrollY = lenis ? lenis.scroll : window.scrollY;
      overlayScrollbar.classList.add('is-active');
      document.body.style.userSelect = 'none';

      window.addEventListener('mousemove', onPointerMove, { passive: true });
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp);
    };

    overlayThumb.addEventListener('mousedown', onPointerDown);
    overlayThumb.addEventListener('touchstart', onPointerDown, { passive: true });
  }

  // 6. Deformação Orgânica Interativa das Linhas Douradas sob Demanda (ativa apenas ao mover o cursor)
  const initContourInteractiveDeform = () => {
    if (reduceMotion) return;
    const spotlightSection = document.getElementById('microagulhamento');
    const contoursSvg = document.querySelector('.treatment-contours-full');
    if (!spotlightSection || !contoursSvg) return;

    const pathElements = contoursSvg.querySelectorAll('.contour-line');
    if (pathElements.length < 5) return;

    const rawPaths = [
      {
        start: [-50, 120],
        curves: [
          [280, 180, 580, 70, 940, 130],
          [1280, 190, 1520, 70, 1740, 110],
          [1830, 125, 1910, 165, 1970, 180]
        ]
      },
      {
        start: [-40, 220],
        curves: [
          [240, 250, 540, 170, 870, 230],
          [1180, 290, 1370, 160, 1590, 210],
          [1750, 245, 1860, 310, 1960, 330]
        ]
      },
      {
        start: [-50, 340],
        curves: [
          [260, 310, 550, 390, 880, 340],
          [1190, 290, 1380, 240, 1580, 350],
          [1710, 420, 1820, 440, 1970, 420]
        ]
      },
      {
        start: [-40, 460],
        curves: [
          [310, 500, 640, 440, 960, 420],
          [1250, 400, 1420, 470, 1630, 520],
          [1770, 555, 1870, 505, 1960, 480]
        ]
      },
      {
        start: [-50, 560],
        curves: [
          [360, 590, 720, 530, 1080, 530],
          [1390, 530, 1660, 590, 1970, 560]
        ]
      }
    ];

    const createPoint = (x, y) => ({
      x,
      y,
      dx: 0,
      dy: 0,
      targetDx: 0,
      targetDy: 0
    });

    const lineModels = rawPaths.map((rp, lineIdx) => {
      const start = createPoint(rp.start[0], rp.start[1]);
      const curves = rp.curves.map(c => ({
        cp1: createPoint(c[0], c[1]),
        cp2: createPoint(c[2], c[3]),
        end: createPoint(c[4], c[5])
      }));
      return {
        el: pathElements[lineIdx],
        start,
        curves,
        points: [start, ...curves.flatMap(c => [c.cp1, c.cp2, c.end])]
      };
    });

    const mouse = {
      x: -9999,
      y: -9999,
      active: false
    };

    let animFrameId = null;

    const onPointerMove = (e) => {
      if (e.pointerType === 'touch') return;
      const rect = contoursSvg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      mouse.x = (e.clientX - rect.left) * (1920 / rect.width);
      mouse.y = (e.clientY - rect.top) * (640 / rect.height);
      mouse.active = true;

      if (!animFrameId) {
        animFrameId = requestAnimationFrame(animateLines);
      }
    };

    const onPointerLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
      if (!animFrameId) {
        animFrameId = requestAnimationFrame(animateLines);
      }
    };

    spotlightSection.addEventListener('pointermove', onPointerMove, { passive: true });
    spotlightSection.addEventListener('pointerleave', onPointerLeave, { passive: true });

    const animateLines = () => {
      animFrameId = null;
      const influenceRadius = 400;
      let maxDisplacement = 0;

      for (let lineIdx = 0; lineIdx < lineModels.length; lineIdx++) {
        const model = lineModels[lineIdx];
        const pts = model.points;

        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          if (mouse.active) {
            const distX = p.x - mouse.x;
            const distY = p.y - mouse.y;
            const dist = Math.hypot(distX, distY);

            if (dist < influenceRadius && dist > 1) {
              const force = Math.pow(1 - dist / influenceRadius, 1.8);
              const angle = Math.atan2(distY, distX);
              p.targetDx = Math.cos(angle) * (34 * force);
              p.targetDy = Math.sin(angle) * (48 * force);
            } else {
              p.targetDx = 0;
              p.targetDy = 0;
            }
          } else {
            p.targetDx = 0;
            p.targetDy = 0;
          }

          p.dx += (p.targetDx - p.dx) * 0.1;
          p.dy += (p.targetDy - p.dy) * 0.1;

          const disp = Math.abs(p.dx) + Math.abs(p.dy) + Math.abs(p.targetDx - p.dx) + Math.abs(p.targetDy - p.dy);
          if (disp > maxDisplacement) maxDisplacement = disp;
        }

        let pathStr = `M ${(model.start.x + model.start.dx).toFixed(1)},${(model.start.y + model.start.dy).toFixed(1)}`;
        for (let cIdx = 0; cIdx < model.curves.length; cIdx++) {
          const c = model.curves[cIdx];
          pathStr += ` C ${(c.cp1.x + c.cp1.dx).toFixed(1)},${(c.cp1.y + c.cp1.dy).toFixed(1)} ${(c.cp2.x + c.cp2.dx).toFixed(1)},${(c.cp2.y + c.cp2.dy).toFixed(1)} ${(c.end.x + c.end.dx).toFixed(1)},${(c.end.y + c.end.dy).toFixed(1)}`;
        }

        model.el.setAttribute('d', pathStr);
      }

      // Continua o loop apenas enquanto houver movimento ativo ou desaceleração residual (poupa 100% de CPU em repouso/scroll)
      if (mouse.active || maxDisplacement > 0.15) {
        animFrameId = requestAnimationFrame(animateLines);
      }
    };
  };

  initContourInteractiveDeform();

  // Ano atual no rodapé
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();

/**
 * Antigravity Design Expert - 인터랙티브 3D 틸트 & 스크롤 등장 엔진
 * - IntersectionObserver 기반 스크롤 스태거 등장 (.ag-reveal)
 * - 커서 추적 3D 원근 틸트 및 스페큘러 글레어 (--rx, --ry, --glare-x, --glare-y)
 * - prefers-reduced-motion 준수
 */
(function (global) {
  const prefersReducedMotion =
    global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice =
    global.matchMedia && global.matchMedia('(pointer: coarse)').matches;

  let revealObserver = null;

  function ensureObserver() {
    if (revealObserver || prefersReducedMotion || !('IntersectionObserver' in global)) {
      return revealObserver;
    }
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );
    return revealObserver;
  }

  function bindTilt(el, maxDeg) {
    if (prefersReducedMotion || isTouchDevice || el.dataset.agTiltBound) return;
    el.dataset.agTiltBound = '1';

    let rafId = null;
    el.addEventListener('pointermove', (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = ((0.5 - py) * maxDeg).toFixed(2) + 'deg';
        const ry = ((px - 0.5) * maxDeg).toFixed(2) + 'deg';
        el.style.setProperty('--rx', rx);
        el.style.setProperty('--ry', ry);
        el.style.setProperty('--glare-x', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--glare-y', (py * 100).toFixed(1) + '%');
      });
    });

    el.addEventListener('pointerleave', () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  }

  function enhanceTree(root) {
    if (!root) return;
    const observer = ensureObserver();

    const revealTargets = root.querySelectorAll(
      '.hobak-list-card, .hobak-list-popular-box, .hobak-detail-card, .hobak-detail-related-card, .hobak-write-form'
    );

    revealTargets.forEach((el, idx) => {
      if (!el.classList.contains('ag-reveal')) {
        el.classList.add('ag-reveal');
        el.style.setProperty('--ag-delay', Math.min(idx * 45, 270) + 'ms');
      }
      if (prefersReducedMotion || !observer) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    });

    const tiltTargets = root.querySelectorAll('.hobak-list-card, .hobak-detail-related-card');
    tiltTargets.forEach((el) => bindTilt(el, 7));
  }

  function initAmbientParallax() {
    if (prefersReducedMotion) return;
    const orbs = document.querySelectorAll('.ag-orb');
    if (!orbs.length) return;

    let ticking = false;
    global.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = global.scrollY || 0;
          orbs.forEach((orb, idx) => {
            const speed = (idx + 1) * 0.04;
            orb.style.marginTop = Math.round(y * speed * -1) + 'px';
          });
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  document.addEventListener('DOMContentLoaded', () => {
    const main = document.getElementById('hobak-main');
    if (main) {
      enhanceTree(main);
      const mo = new MutationObserver(() => enhanceTree(main));
      mo.observe(main, { childList: true, subtree: true });
    }
    initAmbientParallax();
  });
})(window);

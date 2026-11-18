/**
 * 호박 (Hobak) - 통합 SPA 라우터 및 공통 헤더/검색/네비게이션 제어
 */
(function (global) {
  let currentQuery = '';

  function parseHash() {
    const raw = (global.location.hash || '#list').replace(/^#/, '');
    if (raw.startsWith('detail/')) {
      const id = raw.slice('detail/'.length).split('?')[0];
      return { page: 'detail', id };
    }
    if (raw === 'write' || raw.startsWith('write?')) {
      const qs = raw.includes('?') ? raw.split('?')[1] : '';
      const params = new URLSearchParams(qs);
      return { page: 'write', editId: params.get('edit') || null };
    }
    return { page: 'list' };
  }

  function navigate(hash) {
    const normalized = hash.startsWith('#') ? hash : '#' + hash;
    if (global.location.hash === normalized) {
      renderRoute();
    } else {
      global.location.hash = normalized;
    }
    global.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function syncHeaderState(route) {
    const searchInput = document.getElementById('hobak-header-search');
    const writeBtn = document.getElementById('hobak-header-write-btn');
    if (searchInput && route.page !== 'list') {
      // keep value synced
    }
    if (writeBtn) {
      writeBtn.style.display = 'inline-flex';
    }
  }

  function renderRoute() {
    const main = document.getElementById('hobak-main');
    if (!main || !global.HobakPages) return;

    const route = parseHash();
    syncHeaderState(route);

    if (route.page === 'detail' && global.HobakPages.detail) {
      global.HobakPages.detail.render(main, {
        id: route.id,
        onNavigate: navigate,
      });
      return;
    }

    if (route.page === 'write' && global.HobakPages.write) {
      if (global.HobakAuth && !global.HobakAuth.isLoggedIn()) {
        if (global.HobakPages.list) {
          global.HobakPages.list.render(main, {
            query: currentQuery,
            onNavigate: navigate,
          });
        }
        global.HobakAuth.requireAuth(() => navigate('#write'));
        return;
      }
      global.HobakPages.write.render(main, {
        editId: route.editId,
        onNavigate: navigate,
      });
      return;
    }

    if (global.HobakPages.list) {
      global.HobakPages.list.render(main, {
        query: currentQuery,
        onNavigate: navigate,
      });
    }
  }

  function initHeaderEvents() {
    const logo = document.getElementById('hobak-header-logo');
    const searchForm = document.getElementById('hobak-header-search-form');
    const searchInput = document.getElementById('hobak-header-search');
    const writeBtn = document.getElementById('hobak-header-write-btn');
    const resetBtn = document.getElementById('hobak-reset-demo');

    if (logo) {
      logo.addEventListener('click', (e) => {
        e.preventDefault();
        currentQuery = '';
        if (searchInput) searchInput.value = '';
        navigate('#list');
      });
    }

    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentQuery = searchInput.value.trim();
        navigate('#list');
      });
    }

    if (writeBtn) {
      writeBtn.addEventListener('click', () => {
        if (global.HobakAuth) {
          global.HobakAuth.requireAuth(() => navigate('#write'));
        } else {
          navigate('#write');
        }
      });
    }

    document.querySelectorAll('a[href="#write"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (global.HobakAuth) {
          global.HobakAuth.requireAuth(() => navigate('#write'));
        } else {
          navigate('#write');
        }
      });
    });

    if (resetBtn && global.HobakData) {
      resetBtn.addEventListener('click', () => {
        global.HobakData.resetDemoData();
        currentQuery = '';
        if (searchInput) searchInput.value = '';
        global.HobakData.showToast('기본 가상 데이터 10개로 초기화되었습니다 🎃');
        navigate('#list');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeaderEvents();
    global.addEventListener('hashchange', renderRoute);
    global.addEventListener('hobak:data-ready', renderRoute);
    renderRoute();

    if (global.HobakData && typeof global.HobakData.initFromSupabase === 'function') {
      global.HobakData.initFromSupabase();
    }
  });
})(window);

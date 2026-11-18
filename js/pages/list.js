/**
 * 호박 (Hobak) - 상품 목록 페이지
 * window.HobakPages.list = { render(container, options) }
 */
(function (global) {
  global.HobakPages = global.HobakPages || {};

  const ITEMS_PER_PAGE = 6;

  // 페이지 재렌더링 간 유지되는 목록 상태
  const state = {
    category: '전체',
    query: '',
    onlyAvailable: false,
    onlyFree: false,
    location: '전체',
    sort: 'latest',
    page: 1,
    filterPanelOpen: false,
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getUniqueLocations(products) {
    const set = new Set();
    products.forEach((item) => {
      if (item.location) set.add(item.location);
    });
    return ['전체', ...Array.from(set)];
  }

  function filterAndSortProducts(products) {
    const q = state.query.trim().toLowerCase();

    const filtered = products.filter((item) => {
      if (state.category !== '전체' && item.category !== state.category) {
        return false;
      }
      if (state.onlyAvailable && item.status !== '거래완료') {
        return false;
      }
      if (state.onlyFree && !item.isFree && Number(item.price) !== 0) {
        return false;
      }
      if (state.location !== '전체' && item.location !== state.location) {
        return false;
      }
      if (q) {
        const haystack = [item.title, item.category, item.location, item.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sorted = filtered.slice();
    if (state.sort === 'price_asc') {
      sorted.sort((a, b) => (a.isFree ? 0 : a.price) - (b.isFree ? 0 : b.price));
    } else if (state.sort === 'price_desc') {
      sorted.sort((a, b) => (b.isFree ? 0 : b.price) - (a.isFree ? 0 : a.price));
    } else if (state.sort === 'likes') {
      sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    // 'latest' preserves the store's newest-first order
    return sorted;
  }

  function buildHeadingText() {
    if (state.query.trim()) {
      return `🎃 "${escapeHtml(state.query.trim())}" 중고거래 검색 결과`;
    }
    if (state.location !== '전체') {
      const parts = state.location.split(' ');
      const dong = parts[parts.length - 1] || state.location;
      return `🎃 ${escapeHtml(dong)} 중고거래 검색 결과`;
    }
    if (state.category !== '전체') {
      return `🎃 ${escapeHtml(state.category)} 중고거래 검색 결과`;
    }
    return '🎃 전체 동네 중고거래';
  }

  function renderStatusBadge(item) {
    if (item.status === '예약중') {
      return '<span class="hobak-list-badge hobak-list-badge--reserved">예약중</span>';
    }
    if (item.status === '거래완료') {
      return '<span class="hobak-list-badge hobak-list-badge--done">거래완료</span>';
    }
    if (item.isFree || Number(item.price) === 0) {
      return '<span class="hobak-list-badge hobak-list-badge--free">나눔 🧡</span>';
    }
    return '<span class="hobak-list-badge hobak-list-badge--selling">판매중</span>';
  }

  function renderCard(item) {
    const thumb =
      Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '';
    const isFree = Boolean(item.isFree) || Number(item.price) === 0;
    const priceText = global.HobakData.formatPrice(item.price, item.isFree);
    const heartIcon = item.liked ? '♥' : '♡';
    const isDone = item.status === '거래완료';

    return `
      <article class="hobak-list-card ${isDone ? 'is-sold-done' : ''}" data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="${escapeHtml(item.title)} 상세보기">
        <div class="hobak-list-thumb-wrap">
          <img class="hobak-list-thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(item.title)}" loading="lazy" />
          ${renderStatusBadge(item)}
        </div>
        <div class="hobak-list-card-body">
          <h3 class="hobak-list-card-title">${escapeHtml(item.title)}</h3>
          <div class="hobak-list-card-price ${isFree ? 'is-free' : ''}">${escapeHtml(priceText)}</div>
          <div class="hobak-list-card-meta">${escapeHtml((item.seller && item.seller.name) || '호박이웃')} · ${escapeHtml(item.location)} · ${escapeHtml(item.timeAgo)}</div>
          <div class="hobak-list-card-stats">
            <span class="hobak-list-stat-text">♡ ${Number(item.likes) || 0} · 💬 ${Number(item.chats) || 0}</span>
            <button
              type="button"
              class="hobak-list-like-btn ${item.liked ? 'is-liked' : ''}"
              data-like-id="${escapeHtml(item.id)}"
              aria-pressed="${item.liked ? 'true' : 'false'}"
              aria-label="관심 상품 찜하기"
            >
              <span>${heartIcon}</span>
              <span>찜</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) return '';
    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(`
        <button
          type="button"
          class="hobak-list-page-btn ${i === state.page ? 'is-active' : ''}"
          data-page="${i}"
          aria-current="${i === state.page ? 'page' : 'false'}"
        >${i}</button>
      `);
    }

    return `
      <nav class="hobak-list-pagination" aria-label="상품 목록 페이지네이션">
        <button
          type="button"
          class="hobak-list-page-btn"
          data-page="${state.page - 1}"
          ${state.page <= 1 ? 'disabled' : ''}
          aria-label="이전 페이지"
        >&lt;</button>
        ${pages.join('')}
        <button
          type="button"
          class="hobak-list-page-btn"
          data-page="${state.page + 1}"
          ${state.page >= totalPages ? 'disabled' : ''}
          aria-label="다음 페이지"
        >&gt;</button>
      </nav>
    `;
  }

  function resetAllFilters() {
    state.category = '전체';
    state.query = '';
    state.onlyAvailable = false;
    state.onlyFree = false;
    state.location = '전체';
    state.sort = 'latest';
    state.page = 1;
  }

  function render(container, options) {
    const opts = options || {};
    const onNavigate = typeof opts.onNavigate === 'function' ? opts.onNavigate : function () {};

    if (typeof opts.query === 'string' && opts.query !== state.query) {
      state.query = opts.query;
      state.page = 1;
    }

    const dataApi = global.HobakData;
    const allProducts = dataApi.getProducts();
    const locations = getUniqueLocations(allProducts);
    const filtered = filterAndSortProducts(allProducts);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    if (state.page > totalPages) state.page = totalPages;

    const startIdx = (state.page - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    const activeFilterCount =
      (state.onlyFree ? 1 : 0) + (state.location !== '전체' ? 1 : 0);

    const categoriesHtml = dataApi.CATEGORIES.map((cat) => {
      const active = cat === state.category ? 'is-active' : '';
      return `<button type="button" class="hobak-list-cat-chip ${active}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`;
    }).join('');

    const keywordsHtml = dataApi.POPULAR_KEYWORDS.map((kw) => {
      const active = state.query.trim().toLowerCase() === kw.toLowerCase() ? 'is-active' : '';
      return `<button type="button" class="hobak-list-keyword-tag ${active}" data-keyword="${escapeHtml(kw)}">${escapeHtml(kw)}</button>`;
    }).join('');

    const mainContentHtml =
      pageItems.length > 0
        ? `
          <div class="hobak-list-grid">
            ${pageItems.map(renderCard).join('')}
          </div>
          ${renderPagination(totalPages)}
        `
        : `
          <div class="hobak-list-empty">
            <div class="hobak-list-empty-icon">🎃</div>
            <div class="hobak-list-empty-title">조건에 맞는 중고 물품이 없어요</div>
            <div class="hobak-list-empty-desc">검색어나 필터 조건을 변경해 다시 찾아보세요.</div>
            <button type="button" class="hobak-btn hobak-btn-outline" data-action="reset-filters">필터 초기화</button>
          </div>
        `;

    container.innerHTML = `
      <section class="hobak-list-page">
        <div class="hobak-list-categories" role="tablist" aria-label="카테고리 필터">
          ${categoriesHtml}
        </div>

        <div class="hobak-list-header">
          <div class="hobak-list-title-wrap">
            <h1 class="hobak-list-title">${buildHeadingText()}</h1>
            <span class="hobak-list-count-badge">총 ${filtered.length}개</span>
            ${
              state.query.trim()
                ? `<button type="button" class="hobak-list-query-clear" data-action="clear-query">검색어 지우기 ✕</button>`
                : ''
            }
          </div>
        </div>

        <div class="hobak-list-toolbar">
          <div class="hobak-list-filters">
            <button
              type="button"
              class="hobak-list-filter-chip ${state.filterPanelOpen || activeFilterCount > 0 ? 'is-active' : ''}"
              data-action="toggle-filter-panel"
            >
              <span>필터${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
            </button>
            <button
              type="button"
              class="hobak-list-filter-chip ${state.onlyAvailable ? 'is-active' : ''}"
              data-action="toggle-available"
              aria-pressed="${state.onlyAvailable ? 'true' : 'false'}"
            >
              <span>거래 가능만 보기</span>
            </button>
          </div>

          <div class="hobak-list-sort-wrap">
            <select class="hobak-list-sort-select" data-action="change-sort" aria-label="정렬 기준">
              <option value="latest" ${state.sort === 'latest' ? 'selected' : ''}>최신순</option>
              <option value="price_asc" ${state.sort === 'price_asc' ? 'selected' : ''}>낮은 가격순</option>
              <option value="price_desc" ${state.sort === 'price_desc' ? 'selected' : ''}>높은 가격순</option>
              <option value="likes" ${state.sort === 'likes' ? 'selected' : ''}>인기순(찜)</option>
            </select>
          </div>
        </div>

        <div class="hobak-list-filter-panel ${state.filterPanelOpen ? 'is-open' : ''}">
          <div class="hobak-list-filter-group">
            <label class="hobak-list-filter-label" for="hobak-list-loc-select">동네</label>
            <select id="hobak-list-loc-select" class="hobak-list-filter-select" data-action="change-location">
              ${locations
                .map(
                  (loc) =>
                    `<option value="${escapeHtml(loc)}" ${state.location === loc ? 'selected' : ''}>${escapeHtml(loc)}</option>`
                )
                .join('')}
            </select>
          </div>
          <button
            type="button"
            class="hobak-list-filter-chip ${state.onlyFree ? 'is-active' : ''}"
            data-action="toggle-free"
          >
            나눔만 보기 🧡
          </button>
          <button type="button" class="hobak-list-filter-reset" data-action="reset-filters">
            전체 초기화
          </button>
        </div>

        <div class="hobak-list-layout">
          <div class="hobak-list-main">
            ${mainContentHtml}
          </div>

          <aside class="hobak-list-sidebar" aria-label="인기 검색어">
            <div class="hobak-list-popular-box">
              <h2 class="hobak-list-popular-title">🔍 인기 검색어</h2>
              <div class="hobak-list-keyword-list">
                ${keywordsHtml}
              </div>
            </div>
          </aside>
        </div>
      </section>
    `;

    bindEvents(container, opts, onNavigate);
  }

  function bindEvents(container, opts, onNavigate) {
    const rerender = () => {
      render(container, { ...opts, query: state.query, onNavigate });
    };

    container.querySelectorAll('[data-category]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.category = btn.getAttribute('data-category') || '전체';
        state.page = 1;
        rerender();
      });
    });

    container.querySelectorAll('[data-keyword]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kw = btn.getAttribute('data-keyword') || '';
        state.query =
          state.query.trim().toLowerCase() === kw.toLowerCase() ? '' : kw;
        state.page = 1;
        rerender();
      });
    });

    container.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const nextPage = Number(btn.getAttribute('data-page'));
        if (nextPage >= 1) {
          state.page = nextPage;
          rerender();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    container.querySelectorAll('[data-like-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-like-id');
        const updated = global.HobakData.toggleLike(id);
        if (updated) {
          global.HobakData.showToast(
            updated.liked ? '관심 목록에 추가했어요 🧡' : '관심 목록에서 해제했어요'
          );
          rerender();
        }
      });
    });

    container.querySelectorAll('.hobak-list-card').forEach((card) => {
      const goDetail = () => {
        const id = card.getAttribute('data-id');
        if (id) onNavigate('#detail/' + id);
      };
      card.addEventListener('click', goDetail);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goDetail();
        }
      });
    });

    const toggleAvailableBtn = container.querySelector('[data-action="toggle-available"]');
    if (toggleAvailableBtn) {
      toggleAvailableBtn.addEventListener('click', () => {
        state.onlyAvailable = !state.onlyAvailable;
        state.page = 1;
        rerender();
      });
    }

    const toggleFilterPanelBtn = container.querySelector('[data-action="toggle-filter-panel"]');
    if (toggleFilterPanelBtn) {
      toggleFilterPanelBtn.addEventListener('click', () => {
        state.filterPanelOpen = !state.filterPanelOpen;
        rerender();
      });
    }

    const toggleFreeBtn = container.querySelector('[data-action="toggle-free"]');
    if (toggleFreeBtn) {
      toggleFreeBtn.addEventListener('click', () => {
        state.onlyFree = !state.onlyFree;
        state.page = 1;
        rerender();
      });
    }

    const locSelect = container.querySelector('[data-action="change-location"]');
    if (locSelect) {
      locSelect.addEventListener('change', (e) => {
        state.location = e.target.value;
        state.page = 1;
        rerender();
      });
    }

    const sortSelect = container.querySelector('[data-action="change-sort"]');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        state.page = 1;
        rerender();
      });
    }

    const clearQueryBtn = container.querySelector('[data-action="clear-query"]');
    if (clearQueryBtn) {
      clearQueryBtn.addEventListener('click', () => {
        state.query = '';
        state.page = 1;
        rerender();
      });
    }

    container.querySelectorAll('[data-action="reset-filters"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        resetAllFilters();
        rerender();
      });
    });
  }

  global.HobakPages.list = {
    render,
  };
})(window);

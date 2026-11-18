/**
 * 호박 (Hobak) - 내 물건 팔기(글쓰기) 페이지
 */
(function (global) {
  global.HobakPages = global.HobakPages || {};

  const MAX_IMAGES = 5;
  const MAX_DESC_LENGTH = 1000;
  const CONDITIONS = ['새상품', '거의 새것', '사용감 적음', '사용감 많음'];
  const NEIGHBORHOODS = [
    '경기 광명시 광명동',
    '부산 중구 대청동4가',
    '서울 강남구 역삼동',
    '서울 마포구 서교동',
  ];

  const SAMPLE_PRESETS = [
    {
      label: '👟 운동화',
      bg: '#f4efe9',
      accent: '#6f4e37',
      emoji: '👟',
      title: '스니커즈 컬렉션',
      subtitle: '깔끔한 컨디션 · 실착 소수',
      badge: '인기 상품',
    },
    {
      label: '📱 스마트폰',
      bg: '#eef2f6',
      accent: '#1c7ed6',
      emoji: '📱',
      title: '스마트폰 풀박스',
      subtitle: '생활 기스 없음 · 정상 작동',
      badge: 'S급',
    },
    {
      label: '💻 노트북',
      bg: '#e8edf5',
      accent: '#1e293b',
      emoji: '💻',
      title: '노트북 & 충전기',
      subtitle: '배터리 양호 · 초기화 완료',
      badge: '직거래',
    },
    {
      label: '🪑 가구/소품',
      bg: '#f8f3eb',
      accent: '#b08968',
      emoji: '🪑',
      title: '감성 인테리어 소품',
      subtitle: '집 분위기 전환 · 상태 최상',
      badge: '추천',
    },
  ];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function navigateTo(onNavigate, hash) {
    if (typeof onNavigate === 'function') {
      onNavigate(hash);
    } else {
      global.location.hash = hash;
    }
  }

  function render(container, options) {
    const { onNavigate, editId } = options || {};
    const dataApi = global.HobakData;
    const editingProduct = editId && dataApi ? dataApi.getProductById(editId) : null;
    const categories = (dataApi && Array.isArray(dataApi.CATEGORIES)
      ? dataApi.CATEGORIES
      : ['전체', '디지털기기', '생활가전', '가구/인테리어', '생활/주방', '여성의류', '남성패션/잡화', '취미/게임/음반', '도서', '기타 중고물품']
    ).filter((c) => c !== '전체');

    const state = {
      images: [],
      category: '',
      isFree: false,
      negotiable: false,
      condition: '거의 새것',
      location: NEIGHBORHOODS[0],
    };

    container.innerHTML = `
      <section class="hobak-write-page" aria-labelledby="hobak-write-heading">
        <div class="hobak-write-topbar">
          <button type="button" class="hobak-write-back" id="hobak-write-back-btn">
            ← 목록으로
          </button>
        </div>

        <header class="hobak-write-header">
          <div class="hobak-write-title-wrap">
            <span class="hobak-write-pumpkin" aria-hidden="true">🎃</span>
            <div>
              <h1 class="hobak-write-title" id="hobak-write-heading">${editingProduct ? '내 물건 수정하기' : '내 물건 팔기'}</h1>
              <p class="hobak-write-subtitle">동네 이웃과 따뜻하고 안전한 중고거래를 시작해보세요.</p>
            </div>
          </div>
          <span class="hobak-write-required-note">
            <span class="hobak-write-required-mark">*</span> 필수 입력 항목
          </span>
        </header>

        <form class="hobak-write-form" id="hobak-write-form" novalidate autocomplete="off">
          <!-- 사진 등록 -->
          <div class="hobak-write-field">
            <div class="hobak-write-label-row">
              <span class="hobak-write-label">상품 사진</span>
              <span class="hobak-write-helper">최대 ${MAX_IMAGES}장 · 첫 번째 사진이 대표 이미지가 됩니다</span>
            </div>

            <div class="hobak-write-photo-grid" id="hobak-write-photo-grid">
              <label class="hobak-write-photo-upload" id="hobak-write-photo-upload-label" tabindex="0" role="button" aria-label="상품 사진 업로드">
                <span class="hobak-write-photo-icon">📷</span>
                <span class="hobak-write-photo-count" id="hobak-write-photo-count">0 / ${MAX_IMAGES}</span>
                <input
                  type="file"
                  id="hobak-write-photo-input"
                  class="hobak-write-photo-input"
                  accept="image/*"
                  multiple
                />
              </label>
            </div>

            <div class="hobak-write-sample-bar">
              <span class="hobak-write-sample-label">샘플 이미지 추가</span>
              ${SAMPLE_PRESETS.map(
                (preset, idx) => `
                  <button
                    type="button"
                    class="hobak-write-sample-btn"
                    data-sample-index="${idx}"
                  >${escapeHtml(preset.label)}</button>
                `
              ).join('')}
            </div>
          </div>

          <!-- 제목 -->
          <div class="hobak-write-field" id="hobak-field-title">
            <div class="hobak-write-label-row">
              <label class="hobak-write-label" for="hobak-write-title-input">
                제목<span class="hobak-write-required-mark">*</span>
              </label>
            </div>
            <input
              type="text"
              id="hobak-write-title-input"
              class="hobak-write-input"
              maxlength="60"
              placeholder="상품 제목을 입력해주세요 (예: 나이키 에어 조던 1 하이)"
              required
            />
            <span class="hobak-write-error" id="hobak-error-title">상품 제목을 입력해주세요.</span>
          </div>

          <!-- 카테고리 -->
          <div class="hobak-write-field" id="hobak-field-category">
            <div class="hobak-write-label-row">
              <span class="hobak-write-label">
                카테고리<span class="hobak-write-required-mark">*</span>
              </span>
            </div>
            <div class="hobak-write-pills" id="hobak-write-category-pills" role="radiogroup" aria-label="카테고리 선택">
              ${categories
                .map(
                  (cat) => `
                    <button
                      type="button"
                      class="hobak-write-pill"
                      data-category="${escapeHtml(cat)}"
                      aria-pressed="false"
                    >${escapeHtml(cat)}</button>
                  `
                )
                .join('')}
            </div>
            <span class="hobak-write-error" id="hobak-error-category">카테고리를 선택해주세요.</span>
          </div>

          <!-- 거래 방식 & 가격 -->
          <div class="hobak-write-field" id="hobak-field-price">
            <div class="hobak-write-label-row">
              <label class="hobak-write-label" for="hobak-write-price-input">
                거래 방식 및 가격<span class="hobak-write-required-mark">*</span>
              </label>
            </div>
            <div class="hobak-write-trade-row">
              <div class="hobak-write-segmented" role="group" aria-label="거래 방식 선택">
                <button
                  type="button"
                  class="hobak-write-seg-btn is-active"
                  data-trade-mode="sell"
                  aria-pressed="true"
                >판매하기</button>
                <button
                  type="button"
                  class="hobak-write-seg-btn"
                  data-trade-mode="free"
                  aria-pressed="false"
                >나눔하기</button>
              </div>

              <div class="hobak-write-price-row">
                <div class="hobak-write-price-wrap" id="hobak-write-price-wrap">
                  <input
                    type="text"
                    inputmode="numeric"
                    id="hobak-write-price-input"
                    class="hobak-write-input"
                    placeholder="가격을 입력해주세요"
                  />
                  <span class="hobak-write-price-suffix">원</span>
                </div>

                <label class="hobak-write-checkbox-label" id="hobak-write-nego-label">
                  <input type="checkbox" id="hobak-write-nego-checkbox" />
                  <span>가격 제안 받기</span>
                </label>
              </div>
            </div>
            <span class="hobak-write-error" id="hobak-error-price">올바른 판매 가격(0원 초과)을 입력해주세요.</span>
          </div>

          <!-- 상품 상태 & 사이즈/옵션 -->
          <div class="hobak-write-grid-2">
            <div class="hobak-write-field">
              <span class="hobak-write-label">상품 상태</span>
              <div class="hobak-write-pills" id="hobak-write-condition-pills" role="radiogroup" aria-label="상품 상태">
                ${CONDITIONS.map(
                  (cond) => `
                    <button
                      type="button"
                      class="hobak-write-pill ${cond === state.condition ? 'is-active' : ''}"
                      data-condition="${escapeHtml(cond)}"
                      aria-pressed="${cond === state.condition ? 'true' : 'false'}"
                    >${escapeHtml(cond)}</button>
                  `
                ).join('')}
              </div>
            </div>

            <div class="hobak-write-field">
              <label class="hobak-write-label" for="hobak-write-size-input">사이즈 / 옵션 <span class="hobak-write-helper">(선택)</span></label>
              <input
                type="text"
                id="hobak-write-size-input"
                class="hobak-write-input"
                maxlength="40"
                placeholder="예: 270mm, M(95), 512GB 등"
              />
            </div>
          </div>

          <!-- 자세한 설명 -->
          <div class="hobak-write-field" id="hobak-field-description">
            <div class="hobak-write-label-row">
              <label class="hobak-write-label" for="hobak-write-desc-input">
                자세한 설명<span class="hobak-write-required-mark">*</span>
              </label>
              <span class="hobak-write-char-count" id="hobak-write-char-count">0 / ${MAX_DESC_LENGTH}</span>
            </div>
            <textarea
              id="hobak-write-desc-input"
              class="hobak-write-textarea"
              maxlength="${MAX_DESC_LENGTH}"
              placeholder="구매 시기, 브랜드, 사용감, 하자 여부 등 자세한 내용을 적어주세요."
              required
            ></textarea>
            <span class="hobak-write-error" id="hobak-error-description">상품에 대한 자세한 설명을 입력해주세요.</span>
          </div>

          <!-- 거래 희망 장소 & 작성자 닉네임 -->
          <div class="hobak-write-grid-2">
            <div class="hobak-write-field">
              <label class="hobak-write-label" for="hobak-write-location-input">거래 희망 장소</label>
              <input
                type="text"
                id="hobak-write-location-input"
                class="hobak-write-input"
                maxlength="40"
                value="${escapeHtml(state.location)}"
                placeholder="동네 이름을 입력해주세요"
              />
              <div class="hobak-write-pills" id="hobak-write-location-chips">
                ${NEIGHBORHOODS.map(
                  (loc) => `
                    <button
                      type="button"
                      class="hobak-write-pill ${loc === state.location ? 'is-active' : ''}"
                      data-location="${escapeHtml(loc)}"
                    >${escapeHtml(loc)}</button>
                  `
                ).join('')}
              </div>
            </div>

            <div class="hobak-write-field">
              <label class="hobak-write-label" for="hobak-write-seller-input">작성자 닉네임</label>
              <input
                type="text"
                id="hobak-write-seller-input"
                class="hobak-write-input"
                maxlength="20"
                value="호박이웃"
                placeholder="닉네임을 입력해주세요"
              />
              <span class="hobak-write-helper">입력하지 않으면 기본 닉네임(호박이웃)으로 등록됩니다.</span>
            </div>
          </div>

          <!-- 하단 버튼 -->
          <div class="hobak-write-actions">
            <button type="button" class="hobak-btn hobak-btn-outline hobak-write-cancel-btn" id="hobak-write-cancel-btn">
              취소
            </button>
            <button type="submit" class="hobak-btn hobak-btn-primary hobak-write-submit-btn" id="hobak-write-submit-btn">
              ${editingProduct ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </section>
    `;

    // DOM 참조
    const form = container.querySelector('#hobak-write-form');
    const backBtn = container.querySelector('#hobak-write-back-btn');
    const cancelBtn = container.querySelector('#hobak-write-cancel-btn');

    const photoGrid = container.querySelector('#hobak-write-photo-grid');
    const photoUploadLabel = container.querySelector('#hobak-write-photo-upload-label');
    const photoInput = container.querySelector('#hobak-write-photo-input');
    const photoCountEl = container.querySelector('#hobak-write-photo-count');
    const sampleBtns = container.querySelectorAll('.hobak-write-sample-btn');

    const titleField = container.querySelector('#hobak-field-title');
    const titleInput = container.querySelector('#hobak-write-title-input');

    const categoryField = container.querySelector('#hobak-field-category');
    const categoryPills = container.querySelectorAll('#hobak-write-category-pills .hobak-write-pill');

    const priceField = container.querySelector('#hobak-field-price');
    const tradeSegBtns = container.querySelectorAll('.hobak-write-seg-btn');
    const priceWrap = container.querySelector('#hobak-write-price-wrap');
    const priceInput = container.querySelector('#hobak-write-price-input');
    const negoLabel = container.querySelector('#hobak-write-nego-label');
    const negoCheckbox = container.querySelector('#hobak-write-nego-checkbox');

    const conditionPills = container.querySelectorAll('#hobak-write-condition-pills .hobak-write-pill');
    const sizeInput = container.querySelector('#hobak-write-size-input');

    const descField = container.querySelector('#hobak-field-description');
    const descInput = container.querySelector('#hobak-write-desc-input');
    const charCountEl = container.querySelector('#hobak-write-char-count');

    const locationInput = container.querySelector('#hobak-write-location-input');
    const locationChips = container.querySelectorAll('#hobak-write-location-chips .hobak-write-pill');
    const sellerInput = container.querySelector('#hobak-write-seller-input');

    const loggedInUser = global.HobakAuth && global.HobakAuth.getUser();

    function resetFormState() {
      form.reset();
      state.images = [];
      state.category = '';
      state.isFree = false;
      state.condition = '거의 새것';
      state.location = '경기 광명시 광명동';

      titleInput.value = '';
      priceInput.value = '';
      sizeInput.value = '';
      descInput.value = '';
      charCountEl.textContent = '0 / 1000';
      locationInput.value = state.location;
      sellerInput.value = loggedInUser ? loggedInUser.nickname : '호박이웃';
      negoCheckbox.checked = false;
      photoInput.value = '';

      categoryPills.forEach((pill) => {
        pill.classList.remove('is-active');
        pill.setAttribute('aria-pressed', 'false');
      });
      conditionPills.forEach((pill) => {
        const active = pill.dataset.condition === state.condition;
        pill.classList.toggle('is-active', active);
        pill.setAttribute('aria-pressed', String(active));
      });
      locationChips.forEach((chip) => {
        chip.classList.toggle('is-active', chip.dataset.location === state.location);
      });
      tradeSegBtns.forEach((btn) => {
        const active = btn.dataset.tradeMode === 'sell';
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });

      priceInput.disabled = false;
      priceInput.placeholder = '가격을 입력해주세요';
      priceWrap.classList.remove('is-disabled');
      negoCheckbox.disabled = false;
      negoLabel.classList.remove('is-disabled');

      [titleField, categoryField, priceField, descField].forEach((f) => {
        if (f) f.classList.remove('is-error');
      });
    }

    resetFormState();

    if (editingProduct) {
      state.images = Array.isArray(editingProduct.images) ? editingProduct.images.slice(0, MAX_PHOTOS) : [];
      state.category = editingProduct.category || '';
      state.isFree = Boolean(editingProduct.isFree);
      state.condition = editingProduct.condition || '거의 새것';
      state.location = editingProduct.location || NEIGHBORHOODS[0];

      titleInput.value = editingProduct.title || '';
      sizeInput.value = editingProduct.size || '';
      descInput.value = editingProduct.description || '';
      charCountEl.textContent = `${descInput.value.length} / 1000`;
      locationInput.value = state.location;
      sellerInput.value = (editingProduct.seller && editingProduct.seller.name) || (loggedInUser ? loggedInUser.nickname : '호박이웃');

      categoryPills.forEach((pill) => {
        const active = pill.dataset.category === state.category;
        pill.classList.toggle('is-active', active);
        pill.setAttribute('aria-pressed', String(active));
      });
      conditionPills.forEach((pill) => {
        const active = pill.dataset.condition === state.condition;
        pill.classList.toggle('is-active', active);
        pill.setAttribute('aria-pressed', String(active));
      });
      locationChips.forEach((chip) => {
        chip.classList.toggle('is-active', chip.dataset.location === state.location);
      });
      tradeSegBtns.forEach((btn) => {
        const active = btn.dataset.tradeMode === (state.isFree ? 'free' : 'sell');
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });

      if (state.isFree) {
        priceInput.value = '';
        priceInput.disabled = true;
        priceInput.placeholder = '0원 (나눔 🧡)';
        priceWrap.classList.add('is-disabled');
        negoCheckbox.checked = false;
        negoCheckbox.disabled = true;
        negoLabel.classList.add('is-disabled');
      } else {
        priceInput.value = editingProduct.price ? Number(editingProduct.price).toLocaleString('ko-KR') : '';
        negoCheckbox.checked = Boolean(editingProduct.negotiable);
      }
    }

    // 이미지 미리보기 렌더링
    function renderPhotos() {
      const existingThumbs = photoGrid.querySelectorAll('.hobak-write-photo-thumb');
      existingThumbs.forEach((el) => el.remove());

      state.images.forEach((src, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'hobak-write-photo-thumb';

        const img = document.createElement('img');
        img.src = src;
        img.alt = `업로드된 상품 이미지 ${index + 1}`;
        thumb.appendChild(img);

        if (index === 0) {
          const badge = document.createElement('span');
          badge.className = 'hobak-write-photo-badge';
          badge.textContent = '대표';
          thumb.appendChild(badge);
        }

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'hobak-write-photo-remove';
        removeBtn.setAttribute('aria-label', `이미지 ${index + 1} 삭제`);
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => {
          state.images.splice(index, 1);
          renderPhotos();
        });
        thumb.appendChild(removeBtn);

        photoGrid.appendChild(thumb);
      });

      photoCountEl.textContent = `${state.images.length} / ${MAX_IMAGES}`;
      if (state.images.length >= MAX_IMAGES) {
        photoUploadLabel.classList.add('is-full');
      } else {
        photoUploadLabel.classList.remove('is-full');
      }
    }

    function addImageDataUrl(url) {
      if (state.images.length >= MAX_IMAGES) {
        if (dataApi && dataApi.showToast) {
          dataApi.showToast(`사진은 최대 ${MAX_IMAGES}장까지 등록할 수 있어요.`);
        }
        return false;
      }
      state.images.push(url);
      renderPhotos();
      return true;
    }

    if (editingProduct && state.images.length > 0) {
      renderPhotos();
    }

    // 파일 선택 처리
    photoUploadLabel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        photoInput.click();
      }
    });

    photoInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const remaining = MAX_IMAGES - state.images.length;
      if (remaining <= 0) {
        if (dataApi && dataApi.showToast) {
          dataApi.showToast(`사진은 최대 ${MAX_IMAGES}장까지 등록할 수 있어요.`);
        }
        photoInput.value = '';
        return;
      }

      const targets = files.slice(0, remaining);
      if (files.length > remaining && dataApi && dataApi.showToast) {
        dataApi.showToast(`최대 ${MAX_IMAGES}장까지만 추가되었어요.`);
      }

      targets.forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target && typeof ev.target.result === 'string') {
            addImageDataUrl(ev.target.result);
          }
        };
        reader.readAsDataURL(file);
      });

      photoInput.value = '';
    });

    // 샘플 이미지 추가
    sampleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-sample-index'));
        const preset = SAMPLE_PRESETS[idx];
        if (!preset || !dataApi || typeof dataApi.makeProductSvg !== 'function') return;
        const svgUrl = dataApi.makeProductSvg(preset);
        addImageDataUrl(svgUrl);
      });
    });

    // 제목 입력 시 에러 해제
    titleInput.addEventListener('input', () => {
      if (titleInput.value.trim()) {
        titleField.classList.remove('is-error');
      }
    });

    // 카테고리 선택
    categoryPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const selected = pill.getAttribute('data-category');
        state.category = selected;
        categoryPills.forEach((p) => {
          const isActive = p === pill;
          p.classList.toggle('is-active', isActive);
          p.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        categoryField.classList.remove('is-error');
      });
    });

    // 거래 방식 토글 (판매하기 vs 나눔하기)
    function updateTradeMode(isFree) {
      state.isFree = isFree;
      tradeSegBtns.forEach((btn) => {
        const mode = btn.getAttribute('data-trade-mode');
        const active = (isFree && mode === 'free') || (!isFree && mode === 'sell');
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      if (isFree) {
        priceWrap.classList.add('is-free');
        priceInput.disabled = true;
        priceInput.value = '0원 (나눔 🧡)';
        negoCheckbox.checked = false;
        negoCheckbox.disabled = true;
        negoLabel.classList.add('is-disabled');
        priceField.classList.remove('is-error');
      } else {
        priceWrap.classList.remove('is-free');
        priceInput.disabled = false;
        if (priceInput.value === '0원 (나눔 🧡)') {
          priceInput.value = '';
        }
        negoCheckbox.disabled = false;
        negoLabel.classList.remove('is-disabled');
      }
    }

    tradeSegBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-trade-mode');
        updateTradeMode(mode === 'free');
      });
    });

    // 가격 숫자 포맷팅 (쉼표 표시)
    priceInput.addEventListener('input', () => {
      if (state.isFree) return;
      const digits = priceInput.value.replace(/[^0-9]/g, '');
      if (!digits) {
        priceInput.value = '';
        return;
      }
      const num = Number(digits);
      priceInput.value = num.toLocaleString('ko-KR');
      if (num > 0) {
        priceField.classList.remove('is-error');
      }
    });

    negoCheckbox.addEventListener('change', () => {
      state.negotiable = negoCheckbox.checked;
    });

    // 상품 상태 선택
    conditionPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        state.condition = pill.getAttribute('data-condition');
        conditionPills.forEach((p) => {
          const isActive = p === pill;
          p.classList.toggle('is-active', isActive);
          p.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
      });
    });

    // 설명 글자 수 카운터
    descInput.addEventListener('input', () => {
      const len = descInput.value.length;
      charCountEl.textContent = `${len} / ${MAX_DESC_LENGTH}`;
      if (descInput.value.trim()) {
        descField.classList.remove('is-error');
      }
    });

    // 거래 희망 장소 칩 선택
    function syncLocationChips(val) {
      locationChips.forEach((chip) => {
        const loc = chip.getAttribute('data-location');
        chip.classList.toggle('is-active', loc === val.trim());
      });
    }

    locationChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const loc = chip.getAttribute('data-location');
        locationInput.value = loc;
        state.location = loc;
        syncLocationChips(loc);
      });
    });

    locationInput.addEventListener('input', () => {
      state.location = locationInput.value;
      syncLocationChips(locationInput.value);
    });

    // 뒤로가기 / 취소
    backBtn.addEventListener('click', () => navigateTo(onNavigate, '#list'));
    cancelBtn.addEventListener('click', () => navigateTo(onNavigate, '#list'));

    // 등록하기 제출
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = titleInput.value.trim();
      const description = descInput.value.trim();
      const rawPriceDigits = priceInput.value.replace(/[^0-9]/g, '');
      const numericPrice = state.isFree ? 0 : Number(rawPriceDigits || 0);

      let firstErrorEl = null;

      if (!title) {
        titleField.classList.add('is-error');
        firstErrorEl = firstErrorEl || titleInput;
      } else {
        titleField.classList.remove('is-error');
      }

      if (!state.category) {
        categoryField.classList.add('is-error');
        firstErrorEl = firstErrorEl || categoryField;
      } else {
        categoryField.classList.remove('is-error');
      }

      if (!state.isFree && (!rawPriceDigits || numericPrice <= 0)) {
        priceField.classList.add('is-error');
        firstErrorEl = firstErrorEl || priceInput;
      } else {
        priceField.classList.remove('is-error');
      }

      if (!description) {
        descField.classList.add('is-error');
        firstErrorEl = firstErrorEl || descInput;
      } else {
        descField.classList.remove('is-error');
      }

      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof firstErrorEl.focus === 'function') {
          firstErrorEl.focus();
        }
        if (dataApi && dataApi.showToast) {
          dataApi.showToast('필수 입력 항목을 확인해주세요.');
        }
        return;
      }

      const location = locationInput.value.trim() || '경기 광명시 광명동';
      const sellerName = sellerInput.value.trim() || '호박이웃';
      const size = sizeInput.value.trim();

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = editingProduct ? '수정 중...' : '등록 중...';
      }

      const payload = {
        title,
        price: numericPrice,
        isFree: state.isFree,
        negotiable: state.isFree ? false : Boolean(negoCheckbox.checked),
        category: state.category,
        location,
        condition: state.condition,
        size,
        description,
        sellerName,
        images: state.images.slice(),
      };

      if (editingProduct && typeof dataApi.updateProductAsync === 'function') {
        await dataApi.updateProductAsync(editingProduct.id, payload);
        if (dataApi && dataApi.showToast) {
          dataApi.showToast('게시글이 수정되었어요! 🎃');
        }
        navigateTo(onNavigate, `#detail/${editingProduct.id}`);
        return;
      }

      const created =
        typeof dataApi.addProductAsync === 'function'
          ? await dataApi.addProductAsync(payload)
          : dataApi.addProduct(payload);

      if (dataApi && dataApi.showToast) {
        dataApi.showToast('상품이 등록되었어요! 🎃');
      }

      navigateTo(onNavigate, `#detail/${created.id}`);
    });
  }

  global.HobakPages.write = {
    render,
  };
})(window);

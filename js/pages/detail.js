/**
 * 호박 (Hobak) - 상품 상세 페이지 (window.HobakPages.detail)
 */
(function (global) {
  global.HobakPages = global.HobakPages || {};

  function escapeHtml(value) {
    return String(value == null ? '' : value)
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

  function getHeartSvg(filled) {
    if (filled) {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="#ff6f0f" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
    }
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
  }

  function getRelatedProducts(currentProduct) {
    const all = global.HobakData.getProducts().filter(
      (item) => String(item.id) !== String(currentProduct.id)
    );
    const sameCategory = all.filter((item) => item.category === currentProduct.category);
    const others = all.filter((item) => item.category !== currentProduct.category);
    return sameCategory.concat(others).slice(0, 4);
  }

  function renderNotFound(container, onNavigate) {
    container.innerHTML = `
      <div class="hobak-detail-empty">
        <div class="hobak-detail-empty-icon">🎃</div>
        <h2 class="hobak-detail-empty-title">상품을 찾을 수 없습니다</h2>
        <p class="hobak-detail-empty-desc">
          삭제되었거나 존재하지 않는 게시글이에요.
        </p>
        <button type="button" class="hobak-btn hobak-btn-primary" id="hobak-detail-back-list">
          목록으로 돌아가기
        </button>
      </div>
    `;
    const backBtn = container.querySelector('#hobak-detail-back-list');
    if (backBtn) {
      backBtn.addEventListener('click', () => navigateTo(onNavigate, '#list'));
    }
  }

  function openChatModal(product) {
    const existing = document.getElementById('hobak-detail-chat-modal');
    if (existing) existing.remove();

    const sellerName = escapeHtml((product.seller && product.seller.name) || '호박이웃');
    const thumb = (product.images && product.images[0]) || '';
    const priceText = escapeHtml(global.HobakData.formatPrice(product.price, product.isFree));

    const backdrop = document.createElement('div');
    backdrop.id = 'hobak-detail-chat-modal';
    backdrop.className = 'hobak-detail-modal-backdrop';
    backdrop.innerHTML = `
      <div class="hobak-detail-chat-modal" role="dialog" aria-modal="true" aria-label="호박채팅">
        <div class="hobak-detail-chat-header">
          <div>
            <span class="hobak-detail-chat-title">${sellerName}</span>
            <span class="hobak-detail-chat-sub">${Number((product.seller && product.seller.mannerTemp) || 36.5).toFixed(1)}°C</span>
          </div>
          <button type="button" class="hobak-detail-chat-close" aria-label="채팅 닫기">✕</button>
        </div>
        <div class="hobak-detail-chat-product">
          <img src="${escapeHtml(thumb)}" alt="${escapeHtml(product.title)}" />
          <div class="hobak-detail-chat-product-info">
            <div class="hobak-detail-chat-product-name">${escapeHtml(product.title)}</div>
            <div class="hobak-detail-chat-product-price">${priceText}</div>
          </div>
        </div>
        <div class="hobak-detail-chat-messages" id="hobak-chat-messages">
          <div class="hobak-detail-chat-bubble seller">
            안녕하세요! "${escapeHtml(product.title)}" 상품 보고 연락주셨나요? 편하게 문의주세요 😊
          </div>
        </div>
        <div class="hobak-detail-chat-quick">
          <button type="button" class="hobak-detail-chat-chip">구매 가능할까요?</button>
          <button type="button" class="hobak-detail-chat-chip">직거래 어디서 가능할까요?</button>
          <button type="button" class="hobak-detail-chat-chip">상태 확인하고 싶어요</button>
        </div>
        <form class="hobak-detail-chat-form" id="hobak-chat-form">
          <input type="text" class="hobak-detail-chat-input" id="hobak-chat-input" placeholder="메시지를 입력하세요..." autocomplete="off" />
          <button type="submit" class="hobak-detail-chat-send">전송</button>
        </form>
      </div>
    `;

    document.body.appendChild(backdrop);

    const closeModal = () => backdrop.remove();
    backdrop.querySelector('.hobak-detail-chat-close').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    const msgList = backdrop.querySelector('#hobak-chat-messages');
    const input = backdrop.querySelector('#hobak-chat-input');

    function sendUserMessage(text) {
      const trimmed = String(text || '').trim();
      if (!trimmed) return;

      const myBubble = document.createElement('div');
      myBubble.className = 'hobak-detail-chat-bubble me';
      myBubble.textContent = trimmed;
      msgList.appendChild(myBubble);
      msgList.scrollTop = msgList.scrollHeight;
      input.value = '';

      setTimeout(() => {
        if (!document.body.contains(backdrop)) return;
        const reply = document.createElement('div');
        reply.className = 'hobak-detail-chat-bubble seller';
        reply.textContent = '네! 지금 거래 가능해요. 원하시는 시간대 알려주시면 맞춰볼게요 🎃';
        msgList.appendChild(reply);
        msgList.scrollTop = msgList.scrollHeight;
      }, 450);
    }

    backdrop.querySelectorAll('.hobak-detail-chat-chip').forEach((chip) => {
      chip.addEventListener('click', () => sendUserMessage(chip.textContent));
    });

    backdrop.querySelector('#hobak-chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      sendUserMessage(input.value);
    });

    setTimeout(() => input.focus(), 50);
  }

  function render(container, options) {
    if (!container) return;
    const { id, onNavigate } = options || {};
    const product = id != null ? global.HobakData.getProductById(id) : null;

    if (!product) {
      renderNotFound(container, onNavigate);
      return;
    }

    if (typeof global.HobakData.incrementView === 'function') {
      global.HobakData.incrementView(product.id);
    }

    const images =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [
            global.HobakData.makeProductSvg({
              bg: '#fff3eb',
              accent: '#ff6f0f',
              emoji: '🎃',
              title: product.title || '호박 중고거래',
              subtitle: product.category || '',
              badge: '',
            }),
          ];

    const seller = product.seller || {};
    const sellerName = seller.name || '호박이웃';
    const sellerLocation = seller.location || product.location || '';
    const mannerTemp = Number(seller.mannerTemp != null ? seller.mannerTemp : 36.5);
    const mannerPercent = Math.min(100, Math.max(0, mannerTemp));
    const mannerEmoji = global.HobakData.getMannerEmoji(mannerTemp);
    const priceText = global.HobakData.formatPrice(product.price, product.isFree);

    const currentUser = global.HobakAuth && global.HobakAuth.getUser();
    const isOwner = Boolean(
      currentUser && product.sellerId && String(currentUser.id) === String(product.sellerId)
    );

    const ownerBarHtml = isOwner
      ? `
        <section class="hobak-detail-owner-bar" aria-label="내 게시글 관리">
          <div class="hobak-detail-owner-status" role="group" aria-label="거래 상태 변경">
            ${['판매중', '예약중', '거래완료']
              .map(
                (st) => `
                  <button
                    type="button"
                    class="hobak-detail-owner-status-btn ${(product.status || '판매중') === st ? 'is-active' : ''}"
                    data-status="${st}"
                  >${st}</button>
                `
              )
              .join('')}
          </div>
          <div class="hobak-detail-owner-actions">
            <button type="button" class="hobak-detail-owner-btn" id="hobak-detail-edit-btn">수정</button>
            <button type="button" class="hobak-detail-owner-btn is-danger" id="hobak-detail-delete-btn">삭제</button>
          </div>
        </section>
      `
      : '';

    let statusBadgeHtml = '';
    if (product.status === '예약중') {
      statusBadgeHtml =
        '<div class="hobak-detail-status-row"><span class="hobak-detail-status-badge reserved">예약중</span></div>';
    } else if (product.status === '거래완료') {
      statusBadgeHtml =
        '<div class="hobak-detail-status-row"><span class="hobak-detail-status-badge sold">거래완료</span></div>';
    } else {
      statusBadgeHtml =
        '<div class="hobak-detail-status-row"><span class="hobak-detail-status-badge selling">판매중</span></div>';
    }

    const specRows = [];
    if (product.size) {
      specRows.push(`
        <div class="hobak-detail-spec-row">
          <span class="hobak-detail-spec-label">사이즈</span>
          <span class="hobak-detail-spec-value">${escapeHtml(product.size)}</span>
        </div>
      `);
    }
    if (product.condition) {
      specRows.push(`
        <div class="hobak-detail-spec-row">
          <span class="hobak-detail-spec-label">상품 상태</span>
          <span class="hobak-detail-spec-value">${escapeHtml(product.condition)}</span>
        </div>
      `);
    }

    const related = getRelatedProducts(product);

    container.innerHTML = `
      <div class="hobak-detail-page">
        <article class="hobak-detail-card">
          <div class="hobak-detail-carousel">
            <div class="hobak-detail-top-bar">
              <button type="button" class="hobak-detail-close-btn" id="hobak-detail-close" aria-label="목록으로 돌아가기">✕</button>
              <button type="button" class="hobak-detail-app-btn" id="hobak-detail-app-btn">앱에서 보기</button>
            </div>

            <div class="hobak-detail-carousel-track" id="hobak-detail-track">
              ${images
                .map(
                  (src, idx) => `
                  <div class="hobak-detail-slide">
                    <img src="${escapeHtml(src)}" alt="${escapeHtml(product.title)} 이미지 ${idx + 1}" />
                  </div>
                `
                )
                .join('')}
            </div>

            ${
              images.length > 1
                ? `
              <button type="button" class="hobak-detail-nav-btn prev" id="hobak-detail-prev" aria-label="이전 이미지">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button type="button" class="hobak-detail-nav-btn next" id="hobak-detail-next" aria-label="다음 이미지">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <div class="hobak-detail-dots" id="hobak-detail-dots">
                ${images
                  .map(
                    (_, idx) =>
                      `<button type="button" class="hobak-detail-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="${idx + 1}번 이미지"></button>`
                  )
                  .join('')}
              </div>
            `
                : ''
            }
          </div>

          <section class="hobak-detail-seller">
            <div class="hobak-detail-seller-left">
              <div class="hobak-detail-avatar" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </div>
              <div class="hobak-detail-seller-info">
                <div class="hobak-detail-seller-name">${escapeHtml(sellerName)}</div>
                <div class="hobak-detail-seller-loc">${escapeHtml(sellerLocation)}</div>
              </div>
            </div>
            <div class="hobak-detail-manner">
              <div class="hobak-detail-manner-top">
                <span class="hobak-detail-manner-temp">${mannerTemp.toFixed(1)}°C</span>
                <span class="hobak-detail-manner-emoji">${mannerEmoji}</span>
              </div>
              <div class="hobak-detail-manner-bar" aria-hidden="true">
                <div class="hobak-detail-manner-fill" style="width: ${mannerPercent}%"></div>
              </div>
              <button type="button" class="hobak-detail-manner-label" id="hobak-detail-manner-btn">매너온도</button>
            </div>
          </section>

          ${ownerBarHtml}

          <section class="hobak-detail-body" id="hobak-detail-body">
            <div id="hobak-detail-status-wrap">${statusBadgeHtml}</div>
            <h1 class="hobak-detail-title">${escapeHtml(product.title)}</h1>
            <div class="hobak-detail-meta">
              <button type="button" class="hobak-detail-category-link" id="hobak-detail-category-btn">${escapeHtml(product.category || '기타 중고물품')}</button>
              <span>·</span>
              <span>${escapeHtml(product.timeAgo || '방금 전')}</span>
            </div>

            <div class="hobak-detail-price-row">
              <span class="hobak-detail-price">${escapeHtml(priceText)}</span>
              ${
                product.negotiable && !product.isFree
                  ? '<span class="hobak-detail-nego-tag">가격 제안 가능</span>'
                  : ''
              }
            </div>

            <div class="hobak-detail-desc">${escapeHtml(product.description || '')}</div>

            ${
              specRows.length > 0
                ? `<div class="hobak-detail-specs">${specRows.join('')}</div>`
                : ''
            }

            <div class="hobak-detail-counts" id="hobak-detail-counts">
              관심 ${Number(product.likes || 0)} · 채팅 ${Number(product.chats || 0)} · 조회 ${Number(product.views || 0)}
            </div>
          </section>

          <div class="hobak-detail-action-bar">
            <div class="hobak-detail-action-left">
              <button type="button" class="hobak-detail-like-btn ${product.liked ? 'liked' : ''}" id="hobak-detail-like-btn" aria-pressed="${product.liked ? 'true' : 'false'}" aria-label="관심 상품">
                <span id="hobak-detail-heart-icon">${getHeartSvg(Boolean(product.liked))}</span>
                <span id="hobak-detail-like-count">${Number(product.likes || 0)}</span>
              </button>
              <div class="hobak-detail-bar-price-wrap">
                <span class="hobak-detail-bar-price">${escapeHtml(priceText)}</span>
                <span class="hobak-detail-bar-sub">${product.negotiable && !product.isFree ? '가격 제안 가능' : '가격 제안 불가'}</span>
              </div>
            </div>
            <div class="hobak-detail-action-btns">
              <button type="button" class="hobak-detail-sub-btn" id="hobak-detail-sub-btn">
                ${product.negotiable && !product.isFree ? '가격제안' : '바로구매'}
              </button>
              <button type="button" class="hobak-detail-chat-btn" id="hobak-detail-chat-btn">채팅하기</button>
            </div>
          </div>
        </article>

        ${
          related.length > 0
            ? `
          <section class="hobak-detail-related">
            <div class="hobak-detail-related-header">
              <h2 class="hobak-detail-related-title">이 글과 함께 본 상품</h2>
              <button type="button" class="hobak-detail-related-more" id="hobak-detail-more-btn">더 구경하기</button>
            </div>
            <div class="hobak-detail-related-grid">
              ${related
                .map((item) => {
                  const thumb = (item.images && item.images[0]) || '';
                  return `
                    <button type="button" class="hobak-detail-related-item" data-id="${escapeHtml(item.id)}">
                      <div class="hobak-detail-related-thumb">
                        <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.title)}" />
                      </div>
                      <div class="hobak-detail-related-info">
                        <div class="hobak-detail-related-name">${escapeHtml(item.title)}</div>
                        <div class="hobak-detail-related-price">${escapeHtml(global.HobakData.formatPrice(item.price, item.isFree))}</div>
                        <div class="hobak-detail-related-loc">${escapeHtml(item.location)}</div>
                      </div>
                    </button>
                  `;
                })
                .join('')}
            </div>
          </section>
        `
            : ''
        }
      </div>
    `;

    // 캐러셀 상태 및 이벤트
    let currentIndex = 0;
    const track = container.querySelector('#hobak-detail-track');
    const dots = container.querySelectorAll('.hobak-detail-dot');

    function updateSlide(nextIndex) {
      if (images.length <= 1) return;
      currentIndex = (nextIndex + images.length) % images.length;
      if (track) {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
      }
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }

    const prevBtn = container.querySelector('#hobak-detail-prev');
    const nextBtn = container.querySelector('#hobak-detail-next');
    if (prevBtn) prevBtn.addEventListener('click', () => updateSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => updateSlide(currentIndex + 1));
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = Number(dot.getAttribute('data-index'));
        if (!Number.isNaN(idx)) updateSlide(idx);
      });
    });

    // 상단 버튼들
    container
      .querySelector('#hobak-detail-close')
      .addEventListener('click', () => navigateTo(onNavigate, '#list'));

    container.querySelector('#hobak-detail-app-btn').addEventListener('click', () => {
      global.HobakData.showToast('호박 앱으로 연결합니다 🎃');
    });

    // 매너온도 안내
    container.querySelector('#hobak-detail-manner-btn').addEventListener('click', () => {
      global.HobakData.showToast(
        '매너온도는 호박 이웃들의 거래 후기와 칭찬을 반영한 신뢰 지표예요 🌡️'
      );
    });

    // 카테고리 클릭 시 목록으로 이동
    container.querySelector('#hobak-detail-category-btn').addEventListener('click', () => {
      navigateTo(onNavigate, '#list');
    });

    // 관심(좋아요) 토글
    const likeBtn = container.querySelector('#hobak-detail-like-btn');
    const heartIcon = container.querySelector('#hobak-detail-heart-icon');
    const likeCountEl = container.querySelector('#hobak-detail-like-count');
    const countsEl = container.querySelector('#hobak-detail-counts');

    likeBtn.addEventListener('click', () => {
      const updated = global.HobakData.toggleLike(product.id);
      if (!updated) return;
      likeBtn.classList.toggle('liked', updated.liked);
      likeBtn.setAttribute('aria-pressed', updated.liked ? 'true' : 'false');
      heartIcon.innerHTML = getHeartSvg(Boolean(updated.liked));
      likeCountEl.textContent = String(updated.likes);
      countsEl.textContent = `관심 ${updated.likes} · 채팅 ${updated.chats} · 조회 ${updated.views}`;
      global.HobakData.showToast(
        updated.liked ? '관심 목록에 추가했어요 🧡' : '관심 목록에서 제외했어요.'
      );
    });

    // 가격제안 / 바로구매
    container.querySelector('#hobak-detail-sub-btn').addEventListener('click', () => {
      if (product.negotiable && !product.isFree) {
        global.HobakData.showToast('판매자에게 가격 제안을 보냈어요 💬');
      } else {
        global.HobakData.showToast('호박페이 안전결제 화면으로 이동합니다 🎃');
      }
    });

    // 작성자 전용: 상태 변경, 수정, 삭제
    if (isOwner) {
      const statusWrap = container.querySelector('#hobak-detail-status-wrap');
      const statusBtns = container.querySelectorAll('.hobak-detail-owner-status-btn');
      statusBtns.forEach((btn) => {
        btn.addEventListener('click', async () => {
          const nextStatus = btn.dataset.status;
          if (!nextStatus) return;
          statusBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
          if (statusWrap) {
            if (nextStatus === '예약중') {
              statusWrap.innerHTML =
                '<div class="hobak-detail-status-row"><span class="hobak-detail-status-badge reserved">예약중</span></div>';
            } else if (nextStatus === '거래완료') {
              statusWrap.innerHTML =
                '<div class="hobak-detail-status-row"><span class="hobak-detail-status-badge sold">거래완료</span></div>';
            } else {
              statusWrap.innerHTML =
                '<div class="hobak-detail-status-row"><span class="hobak-detail-status-badge selling">판매중</span></div>';
            }
          }
          if (typeof global.HobakData.updateProductStatusAsync === 'function') {
            await global.HobakData.updateProductStatusAsync(product.id, nextStatus);
          }
          global.HobakData.showToast(`거래 상태가 '${nextStatus}'(으)로 변경되었습니다 🎃`);
        });
      });

      const editBtn = container.querySelector('#hobak-detail-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          navigateTo(onNavigate, `#write?edit=${product.id}`);
        });
      }

      const deleteBtn = container.querySelector('#hobak-detail-delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
          if (!global.confirm('정말 이 게시글을 삭제할까요?')) return;
          deleteBtn.disabled = true;
          deleteBtn.textContent = '삭제 중...';
          if (typeof global.HobakData.deleteProductAsync === 'function') {
            await global.HobakData.deleteProductAsync(product.id);
          }
          global.HobakData.showToast('게시글이 삭제되었습니다.');
          navigateTo(onNavigate, '#list');
        });
      }
    }

    // 채팅하기
    container.querySelector('#hobak-detail-chat-btn').addEventListener('click', () => {
      openChatModal(product);
    });

    // 연관 상품 및 더보기
    const moreBtn = container.querySelector('#hobak-detail-more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => navigateTo(onNavigate, '#list'));
    }

    container.querySelectorAll('.hobak-detail-related-item').forEach((card) => {
      card.addEventListener('click', () => {
        const targetId = card.getAttribute('data-id');
        if (targetId) {
          navigateTo(onNavigate, `#detail/${targetId}`);
          global.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  global.HobakPages.detail = { render };
})(window);

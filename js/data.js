/**
 * 호박 (Hobak) - Supabase 연동 데이터 레이어 + 로컬 캐시/폴백
 * 모든 페이지(목록, 상세, 글쓰기)가 window.HobakData를 통해 데이터를 공유합니다.
 */
(function (global) {
  const STORAGE_KEY = 'hobak_products_v1';
  const ANON_TOKEN_KEY = 'hobak_anon_token_v1';

  // 깔끔한 SVG 상품 일러스트 생성기 (이미지 미등록 시에도 선명한 다중 이미지 제공)
  function makeProductSvg({ bg, accent, title, subtitle, emoji, badge }) {
    const safeTitle = String(title || '').replace(/[<>&"]/g, '');
    const safeSub = String(subtitle || '').replace(/[<>&"]/g, '');
    const safeBadge = badge ? String(badge).replace(/[<>&"]/g, '') : '';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${bg}" />
            <stop offset="100%" stop-color="${accent}" stop-opacity="0.22" />
          </linearGradient>
        </defs>
        <rect width="600" height="600" fill="url(#g)" />
        <circle cx="300" cy="255" r="145" fill="#ffffff" fill-opacity="0.82" />
        <text x="300" y="290" font-size="120" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
        ${
          safeBadge
            ? `<rect x="215" y="425" width="170" height="34" rx="17" fill="${accent}" />
               <text x="300" y="447" font-family="sans-serif" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle">${safeBadge}</text>`
            : ''
        }
        <text x="300" y="498" font-family="sans-serif" font-size="22" font-weight="700" fill="#212529" text-anchor="middle">${safeTitle}</text>
        <text x="300" y="532" font-family="sans-serif" font-size="16" fill="#4d5159" text-anchor="middle">${safeSub}</text>
      </svg>
    `.trim();
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  const INITIAL_PRODUCTS = [
    {
      id: 1,
      title: '나이키 에어 조던 1 하이 다크 모카 270mm',
      price: 100000,
      isFree: false,
      negotiable: true,
      category: '남성패션/잡화',
      location: '부산 중구 대청동4가',
      timeAgo: '끌올 1시간 전',
      status: '판매중',
      condition: '거의 새것',
      size: '270',
      description:
        '매력적인 나이키 에어 조던 1 하이 다크 모카를 소개해요. 깔끔한 디자인과 편안한 착용감으로 어떤 코디에도 잘 어울려요. 박스와 함께 보내드려요. 이 신발은 당신의 스타일을 한층 더 업그레이드 시켜줄 거예요.\n\n나코탭 포함 풀구성\n밑창 새거에 업체 보강맡겨두고 신발에 손이 잘 안가서 판매합니다 상태아주좋아요\n궁금한점 바로구매 후 편하게 문의주세요',
      seller: {
        name: '락락',
        location: '부산 중구 대청동4가',
        mannerTemp: 50.2,
      },
      likes: 18,
      chats: 5,
      views: 342,
      liked: false,
      images: [
        makeProductSvg({
          bg: '#f4efe9',
          accent: '#6f4e37',
          emoji: '👟',
          title: 'NIKE AIR JORDAN 1',
          subtitle: 'Dark Mocha · 270mm · 박스 풀구성',
          badge: '나코탭 정품',
        }),
        makeProductSvg({
          bg: '#ece8e3',
          accent: '#343a40',
          emoji: '📦',
          title: '정품 박스 & 여분 끈',
          subtitle: '밑창 보강 완료 · 실착 2회',
          badge: '구성품 사진',
        }),
        makeProductSvg({
          bg: '#f5f2ee',
          accent: '#ff6f0f',
          emoji: '✨',
          title: '아웃솔 컨디션 최상',
          subtitle: '오염/주름 거의 없음',
          badge: '상세 컷',
        }),
      ],
    },
    {
      id: 2,
      title: '삼성 갤럭시 S24 울트라 512GB 티타늄 그레이',
      price: 1120000,
      isFree: false,
      negotiable: false,
      category: '디지털기기',
      location: '경기 광명시 광명동',
      timeAgo: '14분 전',
      status: '판매중',
      condition: '거의 새것',
      size: '512GB',
      description:
        '자급제 512GB 티타늄 그레이 모델입니다. 구매 직후부터 강화유리 필름과 정품 케이스 착용해서 기스 전혀 없습니다.\n배터리 효율 100%, 박스 및 기본 케이블 미사용 그대로 드립니다.\n광명사거리역 직거래 선호합니다.',
      seller: {
        name: '광명테크',
        location: '경기 광명시 광명동',
        mannerTemp: 41.8,
      },
      likes: 27,
      chats: 8,
      views: 519,
      liked: false,
      images: [
        makeProductSvg({
          bg: '#eef2f6',
          accent: '#495057',
          emoji: '📱',
          title: 'Galaxy S24 Ultra',
          subtitle: '512GB · 티타늄 그레이 · 자급제',
          badge: 'S급 풀박스',
        }),
        makeProductSvg({
          bg: '#e9ecef',
          accent: '#1c7ed6',
          emoji: '🔋',
          title: '배터리 & 외관 무결점',
          subtitle: '케이스 + 강화유리 포함',
          badge: '상태 확인',
        }),
      ],
    },
    {
      id: 3,
      title: '애플 맥북 에어 M2 13인치 16GB / 512GB 미드나이트',
      price: 1180000,
      isFree: false,
      negotiable: true,
      category: '디지털기기',
      location: '서울 강남구 역삼동',
      timeAgo: '32분 전',
      status: '판매중',
      condition: '사용감 적음',
      size: '13인치',
      description:
        '업무용으로 집에서만 거치해두고 사용했습니다. 사이클 수 28회로 아주 적고 외관 찍힘이나 생활 기스 없습니다.\nCTO 램 16GB / SSD 512GB 모델이라 영상 편집이나 개발용으로도 쾌적합니다.',
      seller: {
        name: '코코넛라떼',
        location: '서울 강남구 역삼동',
        mannerTemp: 62.4,
      },
      likes: 41,
      chats: 11,
      views: 890,
      liked: false,
      images: [
        makeProductSvg({
          bg: '#e8edf5',
          accent: '#1e293b',
          emoji: '💻',
          title: 'MacBook Air M2',
          subtitle: '16GB RAM · 512GB SSD · 미드나이트',
          badge: '배터리 99%',
        }),
        makeProductSvg({
          bg: '#f1f3f5',
          accent: '#3b82f6',
          emoji: '🔌',
          title: '맥세이프 충전기 포함',
          subtitle: '오리지널 박스 보관 중',
          badge: '풀구성',
        }),
      ],
    },
    {
      id: 4,
      title: '다이슨 에어랩 멀티 스타일러 컴플리트 롱',
      price: 390000,
      isFree: false,
      negotiable: false,
      category: '생활가전',
      location: '경기 광명시 철산동',
      timeAgo: '1시간 전',
      status: '예약중',
      condition: '사용감 적음',
      size: '컴플리트 롱',
      description:
        '선물 받고 5회 미만 사용했습니다. 주로 드라이어 툴만 쓰고 나머지 배럴들은 새것 그대로입니다.\n정품 등록 완료 제품이고 보관 케이스까지 함께 드립니다.',
      seller: {
        name: '달달구리',
        location: '경기 광명시 철산동',
        mannerTemp: 44.5,
      },
      likes: 33,
      chats: 6,
      views: 412,
      liked: false,
      images: [
        makeProductSvg({
          bg: '#fdf2f8',
          accent: '#d6336c',
          emoji: '💇‍♀️',
          title: 'Dyson Airwrap Long',
          subtitle: '니켈/코퍼 · 툴 전체 구성',
          badge: '정품 등록',
        }),
      ],
    },
    {
      id: 5,
      title: '닌텐도 스위치 OLED 화이트 + 젤다 왕눈 칩',
      price: 310000,
      isFree: false,
      negotiable: true,
      category: '취미/게임/음반',
      location: '서울 마포구 서교동',
      timeAgo: '2시간 전',
      status: '판매중',
      condition: '거의 새것',
      size: 'OLED',
      description:
        '작년에 구매해서 젤다의 전설 티어스 오브 더 킹덤 엔딩만 보고 보관했습니다.\n독 모드 위주로 플레이해서 조이콘 쏠림 전혀 없고 액정 필름 부착되어 있습니다.',
      seller: {
        name: '링크의모험',
        location: '서울 마포구 서교동',
        mannerTemp: 39.7,
      },
      likes: 22,
      chats: 4,
      views: 287,
      liked: false,
      images: [
        makeProductSvg({
          bg: '#fff5f5',
          accent: '#fa5252',
          emoji: '🎮',
          title: 'Nintendo Switch OLED',
          subtitle: '화이트 + 젤다 왕눈 패키지',
          badge: '일괄 판매',
        }),
      ],
    },
    {
      id: 6,
      title: '무인양품(MUJI) 떡갈나무 원목 3단 선반',
      price: 95000,
      isFree: false,
      negotiable: false,
      category: '가구/인테리어',
      location: '경기 광명시 하안동',
      timeAgo: '3시간 전',
      status: '판매중',
      condition: '사용감 적음',
      size: '82×28×121cm',
      description:
        '이사 가면서 인테리어가 바뀌어 내놓습니다. 물 얼룩이나 긁힘 없이 깨끗하게 썼습니다.\n무게가 있어서 직접 가지러 오셔야 합니다. 분해 원하시면 미리 말씀해주세요!',
      seller: {
        name: '미니멀라이프',
        location: '경기 광명시 하안동',
        mannerTemp: 47.1,
      },
      likes: 15,
      chats: 3,
      views: 198,
      liked: false,
      images: [
        makeProductSvg({
          bg: '#f8f3eb',
          accent: '#b08968',
          emoji: '🪵',
          title: 'MUJI 원목 3단 선반',
          subtitle: '떡갈나무 · 82×28×121cm',
          badge: '직거래',
        }),
      ],
    },
    {
      id: 7,
      title: '아이패드 에어 5세대 64GB Wi-Fi 스페이스 그레이 + 애플펜슬 2세대',
      price: 580000,
      isFree: false,
      negotiable: true,
      category: '디지털기기',
      location: '서울 송파구 잠실동',
      timeAgo: '4시간 전',
      status: '판매중',
      condition: '거의 새것',
      size: '10.9인치',
      description:
        '대학 강의 필기용으로 구매했는데 노트북을 주로 써서 판매합니다.\n종이질감 필름 붙어있고 애플펜슬 2세대 정품 같이 드립니다. 각인 없습니다.',
      seller: {
        name: '잠실호수',
        location: '서울 송파구 잠실동',
        mannerTemp: 53.6,
      },
      likes: 29,
      chats: 7,
      views: 465,
      liked: false,
      images: [
        makeProductSvg({
          bg: '#eef1f4',
          accent: '#343a40',
          emoji: '✏️',
          title: 'iPad Air 5 + Pencil 2',
          subtitle: '64GB Wi-Fi · 스페이스 그레이',
          badge: '펜슬 포함',
        }),
      ],
    },
    {
      id: 8,
      title: '뉴발란스 993 그레이 265mm (MR993GL)',
      price: 185000,
      isFree: false,
      negotiable: false,
      category: '남성패션/잡화',
      location: '경기 광명시 광명동',
      timeAgo: '5시간 전',
      status: '판매중',
      condition: '사용감 적음',
      size: '265',
      description:
        '공홈 드로우 당첨 제품입니다. 5회 정도 가볍게 착용했고 스웨이드 상태 매우 양호합니다.\n인솔 교체해서 신어서 기존 인솔은 새것입니다.',
      seller: {
        name: '스니커헤드',
        location: '경기 광명시 광명동',
        mannerTemp: 38.4,
      },
      likes: 14,
      chats: 2,
      views: 210,
      liked: false,
      images: [
        makeProductSvg({
          bg: '#f1f3f5',
          accent: '#868e96',
          emoji: '👟',
          title: 'New Balance 993',
          subtitle: 'MR993GL · 265mm · Made in USA',
          badge: '공홈 정품',
        }),
      ],
    },
    {
      id: 9,
      title: '노스페이스 눕시 1996 다운 자켓 블랙 M (95)',
      price: 165000,
      isFree: false,
      negotiable: true,
      category: '여성의류',
      location: '인천 연수구 송도동',
      timeAgo: '6시간 전',
      status: '판매중',
      condition: '거의 새것',
      size: 'M (95)',
      description:
        '작년 겨울에 백화점에서 구매 후 드라이클리닝까지 완료해서 보관 중입니다.\n빵빵함 그대로 살아있고 소매 보풀이나 오염 전혀 없습니다.',
      seller: {
        name: '송도바람',
        location: '인천 연수구 송도동',
        mannerTemp: 42.0,
      },
      likes: 19,
      chats: 4,
      views: 274,
      liked: false,
      images: [
        makeProductSvg({
          bg: '#f1f3f5',
          accent: '#212529',
          emoji: '🧥',
          title: 'THE NORTH FACE 1996',
          subtitle: '블랙 · M(95) · 드라이 완료',
          badge: '겨울 준비',
        }),
      ],
    },
    {
      id: 10,
      title: '스타벅스 SS 엘마 텀블러 + 스탠리 머그 세트 (미개봉 새상품)',
      price: 0,
      isFree: true,
      negotiable: false,
      category: '생활/주방',
      location: '경기 광명시 소하동',
      timeAgo: '끌올 8시간 전',
      status: '판매중',
      condition: '새상품',
      size: '473ml',
      description:
        '집에 텀블러가 너무 많아서 미개봉 새상품 무료 나눔합니다!\n동네 이웃분 중 필요하신 분 편하게 채팅 주세요. 소하동 행정복지센터 앞 직거래 원합니다.',
      seller: {
        name: '호박나눔이',
        location: '경기 광명시 소하동',
        mannerTemp: 58.9,
      },
      likes: 36,
      chats: 12,
      views: 503,
      liked: false,
      images: [
        makeProductSvg({
          bg: '#ebfbee',
          accent: '#2b8a3e',
          emoji: '🥤',
          title: '스타벅스 텀블러 세트',
          subtitle: '미개봉 새상품 · 무료 나눔',
          badge: '나눔 🧡',
        }),
      ],
    },
  ];

  const CATEGORY_EMOJI = {
    디지털기기: '📱',
    생활가전: '🏠',
    '가구/인테리어': '🪑',
    '생활/주방': '🍳',
    여성의류: '👗',
    '남성패션/잡화': '👟',
    '취미/게임/음반': '🎮',
    도서: '📚',
    '기타 중고물품': '🎃',
  };

  const DEFAULT_KEYWORDS = [
    '아이폰',
    '자전거',
    '에어팟',
    '조던',
    '맥북',
    '아이패드',
    '닌텐도',
    '다이슨',
    '냉장고',
    '책상',
    '텀블러',
    '캠핑',
    '노스페이스',
    '선풍기',
  ];

  const CATEGORIES = [
    '전체',
    '디지털기기',
    '생활가전',
    '가구/인테리어',
    '생활/주방',
    '여성의류',
    '남성패션/잡화',
    '취미/게임/음반',
    '도서',
    '기타 중고물품',
  ];

  function getAnonToken() {
    try {
      let token = localStorage.getItem(ANON_TOKEN_KEY);
      if (!token) {
        token =
          global.crypto && typeof global.crypto.randomUUID === 'function'
            ? global.crypto.randomUUID()
            : 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(ANON_TOKEN_KEY, token);
      }
      return token;
    } catch (e) {
      return 'anon-session';
    }
  }

  function getSupabaseConfig() {
    const cfg = global.HOBAK_SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) return null;
    return cfg;
  }

  async function sbFetch(path, options = {}) {
    const cfg = getSupabaseConfig();
    if (!cfg) throw new Error('Supabase config missing');
    const authToken =
      global.HobakAuth && typeof global.HobakAuth.getAccessToken === 'function'
        ? global.HobakAuth.getAccessToken()
        : null;
    const headers = Object.assign(
      {
        apikey: cfg.anonKey,
        Authorization: 'Bearer ' + (authToken || cfg.anonKey),
        'Content-Type': 'application/json',
      },
      options.headers || {}
    );
    const res = await fetch(cfg.url + '/rest/v1/' + path, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Supabase HTTP ${res.status}: ${errText}`);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return '방금 전';
    const ts = new Date(isoString).getTime();
    if (Number.isNaN(ts)) return '방금 전';
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 60) return '방금 전';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}일 전`;
  }

  function resolveFallbackImages(row) {
    if (Array.isArray(row.images) && row.images.length > 0) {
      return row.images;
    }
    const preset = INITIAL_PRODUCTS.find((item) => item.title === row.title);
    if (preset && preset.images && preset.images.length > 0) {
      return preset.images;
    }
    return [
      makeProductSvg({
        bg: '#fff3eb',
        accent: '#ff6f0f',
        emoji: CATEGORY_EMOJI[row.category] || '🎃',
        title: String(row.title || '호박 상품').slice(0, 18),
        subtitle: row.category || '중고거래',
        badge: row.is_free ? '나눔 🧡' : '호박마켓',
      }),
    ];
  }

  function mapRowToProduct(row, likedSet) {
    const sellerObj = row.sellers || {};
    return {
      id: row.id,
      sellerId: row.seller_id,
      title: row.title,
      price: Number(row.price) || 0,
      isFree: Boolean(row.is_free),
      negotiable: Boolean(row.negotiable),
      category: row.category || '기타 중고물품',
      location: row.location || sellerObj.location || '경기 광명시 광명동',
      timeAgo: formatRelativeTime(row.bumped_at || row.created_at),
      status: row.status || '판매중',
      condition: row.condition || '사용감 적음',
      size: row.size_option || '',
      description: row.description || '',
      seller: {
        name: sellerObj.nickname || '호박이웃',
        location: sellerObj.location || row.location || '경기 광명시 광명동',
        mannerTemp: Number(sellerObj.manner_temp) || 36.5,
      },
      likes: Number(row.likes_count) || 0,
      chats: Number(row.chats_count) || 0,
      views: Number(row.views_count) || 0,
      liked: likedSet ? likedSet.has(String(row.id)) : false,
      images: resolveFallbackImages(row),
    };
  }

  function loadLocalCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return INITIAL_PRODUCTS.slice();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS.slice();
    } catch (e) {
      return INITIAL_PRODUCTS.slice();
    }
  }

  function saveLocalCache(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      // ignore storage quota errors
    }
  }

  let _productsCache = loadLocalCache();
  let _likedIdsSet = new Set(
    _productsCache.filter((p) => p.liked).map((p) => String(p.id))
  );
  let _supabaseConnected = false;

  function formatPrice(price, isFree) {
    if (isFree || Number(price) === 0) return '나눔 🧡';
    return Number(price).toLocaleString('ko-KR') + '원';
  }

  function getMannerEmoji(temp) {
    if (temp >= 50) return '🤩';
    if (temp >= 42) return '😊';
    if (temp >= 36.5) return '🙂';
    return '😐';
  }

  function showToast(message) {
    let toast = document.getElementById('hobak-global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'hobak-global-toast';
      toast.className = 'hobak-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  const HobakData = {
    CATEGORIES,
    POPULAR_KEYWORDS: DEFAULT_KEYWORDS.slice(),
    makeProductSvg,
    formatPrice,
    getMannerEmoji,
    showToast,
    isSupabaseConnected() {
      return _supabaseConnected;
    },
    getProducts() {
      return _productsCache.slice();
    },
    getProductById(id) {
      return _productsCache.find((item) => String(item.id) === String(id)) || null;
    },
    async initFromSupabase() {
      if (!getSupabaseConfig()) return false;
      const anonToken = getAnonToken();
      try {
        const [productRows, keywordRows, likeRows] = await Promise.all([
          sbFetch('products?select=*,sellers(id,nickname,location,manner_temp)&order=bumped_at.desc'),
          sbFetch('popular_keywords?select=keyword,search_count&order=search_count.desc&limit=14').catch(
            () => null
          ),
          sbFetch(
            `product_likes?select=product_id&anon_token=eq.${encodeURIComponent(anonToken)}`
          ).catch(() => []),
        ]);

        if (Array.isArray(likeRows)) {
          _likedIdsSet = new Set(likeRows.map((r) => String(r.product_id)));
        }

        if (Array.isArray(productRows) && productRows.length > 0) {
          _productsCache = productRows.map((row) => mapRowToProduct(row, _likedIdsSet));
          saveLocalCache(_productsCache);
        }

        if (Array.isArray(keywordRows) && keywordRows.length > 0) {
          HobakData.POPULAR_KEYWORDS.splice(
            0,
            HobakData.POPULAR_KEYWORDS.length,
            ...keywordRows.map((k) => k.keyword)
          );
        }

        _supabaseConnected = true;
        global.dispatchEvent(new CustomEvent('hobak:data-ready', { detail: { connected: true } }));
        return true;
      } catch (err) {
        console.warn('[Hobak] Supabase 초기 동기화 실패, 로컬 캐시 사용:', err);
        _supabaseConnected = false;
        return false;
      }
    },
    addProduct(newItem) {
      const maxId = _productsCache.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
      const created = {
        id: maxId + 1,
        title: newItem.title,
        price: newItem.isFree ? 0 : Number(newItem.price) || 0,
        isFree: Boolean(newItem.isFree),
        negotiable: Boolean(newItem.negotiable),
        category: newItem.category || '기타 중고물품',
        location: newItem.location || '경기 광명시 광명동',
        timeAgo: '방금 전',
        status: '판매중',
        condition: newItem.condition || '사용감 적음',
        size: newItem.size || '',
        description: newItem.description || '',
        seller: {
          name: newItem.sellerName || '호박이웃',
          location: newItem.location || '경기 광명시 광명동',
          mannerTemp: 37.5,
        },
        likes: 0,
        chats: 0,
        views: 1,
        liked: false,
        images:
          Array.isArray(newItem.images) && newItem.images.length > 0
            ? newItem.images
            : [
                makeProductSvg({
                  bg: '#fff3eb',
                  accent: '#ff6f0f',
                  emoji: CATEGORY_EMOJI[newItem.category] || '🎃',
                  title: String(newItem.title || '').slice(0, 18),
                  subtitle: newItem.category || '중고거래',
                  badge: '방금 등록',
                }),
              ],
      };
      _productsCache.unshift(created);
      saveLocalCache(_productsCache);
      return created;
    },
    async addProductAsync(newItem) {
      if (!getSupabaseConfig()) {
        return HobakData.addProduct(newItem);
      }
      try {
        const authUser =
          global.HobakAuth && typeof global.HobakAuth.getUser === 'function'
            ? global.HobakAuth.getUser()
            : null;
        const sellerName =
          (authUser && authUser.nickname) || newItem.sellerName || '호박이웃';
        const location = newItem.location || '경기 광명시 광명동';

        let seller;
        if (authUser && authUser.id) {
          const sellerRows = await sbFetch('sellers?on_conflict=id', {
            method: 'POST',
            headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
            body: {
              id: authUser.id,
              nickname: sellerName,
              location,
              manner_temp: 36.5,
            },
          });
          seller = Array.isArray(sellerRows) ? sellerRows[0] : sellerRows;
        } else {
          const sellerRows = await sbFetch('sellers', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: {
              nickname: sellerName,
              location,
              manner_temp: 37.5,
            },
          });
          seller = Array.isArray(sellerRows) ? sellerRows[0] : sellerRows;
        }

        const imagesPayload =
          Array.isArray(newItem.images) && newItem.images.length > 0 ? newItem.images : [];

        const productRows = await sbFetch('products', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: {
            seller_id: seller.id,
            title: newItem.title,
            category: newItem.category || '기타 중고물품',
            price: newItem.isFree ? 0 : Number(newItem.price) || 0,
            is_free: Boolean(newItem.isFree),
            negotiable: Boolean(newItem.negotiable),
            status: '판매중',
            condition: newItem.condition || '사용감 적음',
            size_option: newItem.size || '',
            description: newItem.description || '',
            location,
            images: imagesPayload,
          },
        });

        const inserted = Array.isArray(productRows) ? productRows[0] : productRows;
        inserted.sellers = seller;
        const mapped = mapRowToProduct(inserted, _likedIdsSet);

        _productsCache.unshift(mapped);
        saveLocalCache(_productsCache);
        _supabaseConnected = true;
        return mapped;
      } catch (err) {
        console.warn('[Hobak] Supabase 상품 등록 실패, 로컬 등록으로 대체:', err);
        return HobakData.addProduct(newItem);
      }
    },
    async updateProductStatusAsync(id, status) {
      const target = _productsCache.find((item) => String(item.id) === String(id));
      if (!target) return null;
      target.status = status;
      saveLocalCache(_productsCache);
      if (getSupabaseConfig()) {
        try {
          await sbFetch(`products?id=eq.${Number(target.id)}`, {
            method: 'PATCH',
            body: { status },
          });
        } catch (err) {
          console.warn('[Hobak] 상태 업데이트 실패:', err);
        }
      }
      return target;
    },
    async updateProductAsync(id, patch) {
      const target = _productsCache.find((item) => String(item.id) === String(id));
      if (!target) return null;

      target.title = patch.title;
      target.price = patch.isFree ? 0 : Number(patch.price) || 0;
      target.isFree = Boolean(patch.isFree);
      target.negotiable = Boolean(patch.negotiable);
      target.category = patch.category || target.category;
      target.location = patch.location || target.location;
      target.condition = patch.condition || target.condition;
      target.size = patch.size || '';
      target.description = patch.description || '';
      if (Array.isArray(patch.images) && patch.images.length > 0) {
        target.images = patch.images.slice();
      }
      saveLocalCache(_productsCache);

      if (getSupabaseConfig()) {
        try {
          await sbFetch(`products?id=eq.${Number(target.id)}`, {
            method: 'PATCH',
            body: {
              title: target.title,
              category: target.category,
              price: target.price,
              is_free: target.isFree,
              negotiable: target.negotiable,
              condition: target.condition,
              size_option: target.size,
              description: target.description,
              location: target.location,
              images: Array.isArray(patch.images) ? patch.images : [],
            },
          });
        } catch (err) {
          console.warn('[Hobak] 상품 수정 동기화 실패:', err);
        }
      }
      return target;
    },
    async deleteProductAsync(id) {
      const idx = _productsCache.findIndex((item) => String(item.id) === String(id));
      if (idx === -1) return false;
      const numericId = Number(_productsCache[idx].id);
      _productsCache.splice(idx, 1);
      saveLocalCache(_productsCache);

      if (getSupabaseConfig()) {
        try {
          await sbFetch(`products?id=eq.${numericId}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.warn('[Hobak] 상품 삭제 동기화 실패:', err);
        }
      }
      return true;
    },
    toggleLike(id) {
      const target = _productsCache.find((item) => String(item.id) === String(id));
      if (!target) return null;

      target.liked = !target.liked;
      target.likes = Math.max(0, (target.likes || 0) + (target.liked ? 1 : -1));
      if (target.liked) {
        _likedIdsSet.add(String(target.id));
      } else {
        _likedIdsSet.delete(String(target.id));
      }
      saveLocalCache(_productsCache);

      if (getSupabaseConfig()) {
        const anonToken = getAnonToken();
        const productId = Number(target.id);
        const likeOp = target.liked
          ? sbFetch('product_likes', {
              method: 'POST',
              headers: { Prefer: 'resolution=ignore-duplicates' },
              body: { product_id: productId, anon_token: anonToken },
            })
          : sbFetch(
              `product_likes?product_id=eq.${productId}&anon_token=eq.${encodeURIComponent(anonToken)}`,
              { method: 'DELETE' }
            );

        Promise.all([
          likeOp,
          sbFetch(`products?id=eq.${productId}`, {
            method: 'PATCH',
            body: { likes_count: target.likes },
          }),
        ]).catch((err) => console.warn('[Hobak] 찜 동기화 실패:', err));
      }

      return target;
    },
    incrementView(id) {
      const target = _productsCache.find((item) => String(item.id) === String(id));
      if (!target) return;
      target.views = (target.views || 0) + 1;
      saveLocalCache(_productsCache);
      if (getSupabaseConfig()) {
        sbFetch(`products?id=eq.${Number(target.id)}`, {
          method: 'PATCH',
          body: { views_count: target.views },
        }).catch(() => {});
      }
    },
    resetDemoData() {
      _productsCache = INITIAL_PRODUCTS.slice();
      saveLocalCache(_productsCache);
      if (getSupabaseConfig()) {
        HobakData.initFromSupabase();
      }
      return _productsCache.slice();
    },
  };

  global.HobakData = HobakData;
})(window);

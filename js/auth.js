/**
 * 호박 (Hobak) - Supabase Auth 로그인 / 회원가입 / 세션 관리
 */
(function (global) {
  const SESSION_KEY = 'hobak_auth_session_v1';
  let _session = loadSession();
  let _pendingCallback = null;
  let _mode = 'login'; // 'login' | 'signup'

  function getConfig() {
    const cfg = global.HOBAK_SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) return null;
    return cfg;
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.access_token || !parsed.user) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveSession(session) {
    _session = session;
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      // ignore storage errors
    }
    syncHeaderButtons();
    global.dispatchEvent(new CustomEvent('hobak:auth-changed', { detail: { user: getUser() } }));
  }

  function getUser() {
    if (!_session || !_session.user) return null;
    const u = _session.user;
    const meta = u.user_metadata || {};
    return {
      id: u.id,
      email: u.email || '',
      nickname: meta.nickname || (u.email ? u.email.split('@')[0] : '호박이웃'),
      location: meta.location || '경기 광명시 광명동',
    };
  }

  function getAccessToken() {
    return _session && _session.access_token ? _session.access_token : null;
  }

  function isLoggedIn() {
    return Boolean(getUser() && getAccessToken());
  }

  async function authFetch(path, options = {}) {
    const cfg = getConfig();
    if (!cfg) throw new Error('Supabase 설정이 없습니다.');
    const headers = Object.assign(
      {
        apikey: cfg.anonKey,
        'Content-Type': 'application/json',
      },
      options.headers || {}
    );
    const res = await fetch(cfg.url + '/auth/v1/' + path, {
      method: options.method || 'POST',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        data.error_description ||
        data.msg ||
        data.message ||
        `인증 요청 실패 (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  function translateError(msg) {
    const lower = String(msg || '').toLowerCase();
    if (lower.includes('invalid login credentials')) {
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }
    if (lower.includes('email not confirmed')) {
      return '이메일 인증이 완료되지 않았습니다. 받은 편지함을 확인해주세요.';
    }
    if (lower.includes('user already registered') || lower.includes('already exists')) {
      return '이미 가입된 이메일입니다. 로그인 탭에서 로그인해주세요.';
    }
    if (lower.includes('password should be at least')) {
      return '비밀번호는 최소 6자 이상이어야 합니다.';
    }
    if (lower.includes('unable to validate email')) {
      return '올바른 이메일 형식을 입력해주세요.';
    }
    return msg || '오류가 발생했습니다. 다시 시도해주세요.';
  }

  async function ensureSellerProfile(user, accessToken) {
    const cfg = getConfig();
    if (!cfg || !user || !accessToken) return;
    try {
      await fetch(cfg.url + '/rest/v1/sellers?on_conflict=id', {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: user.id,
          nickname: user.nickname,
          location: user.location,
          manner_temp: 36.5,
        }),
      });
    } catch (e) {
      // trigger handles initial creation as well
    }
  }

  function syncHeaderButtons() {
    const loginBtn = document.getElementById('hobak-auth-login-btn');
    const userChip = document.getElementById('hobak-auth-user-chip');
    const logoutBtn = document.getElementById('hobak-auth-logout-btn');
    const user = getUser();

    if (loginBtn) {
      loginBtn.classList.toggle('hobak-auth-hidden', Boolean(user));
    }
    if (userChip) {
      userChip.classList.toggle('hobak-auth-hidden', !user);
      if (user) {
        userChip.textContent = `🎃 ${user.nickname}`;
      }
    }
    if (logoutBtn) {
      logoutBtn.classList.toggle('hobak-auth-hidden', !user);
    }
  }

  function ensureModalDom() {
    let overlay = document.getElementById('hobak-auth-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'hobak-auth-overlay';
    overlay.className = 'hobak-auth-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'hobak-auth-modal-title');
    overlay.innerHTML = `
      <div class="hobak-auth-modal">
        <button type="button" class="hobak-auth-close" id="hobak-auth-close" aria-label="닫기">✕</button>
        <div class="hobak-auth-brand" id="hobak-auth-modal-title">
          <span>🎃</span>
          <span>호박마켓</span>
        </div>
        <p class="hobak-auth-subtitle">따뜻한 우리 동네 중고거래를 시작해보세요</p>

        <div class="hobak-auth-tabs" role="tablist">
          <button type="button" class="hobak-auth-tab is-active" data-mode="login" role="tab">로그인</button>
          <button type="button" class="hobak-auth-tab" data-mode="signup" role="tab">회원가입</button>
        </div>

        <form id="hobak-auth-form" class="hobak-auth-form" novalidate>
          <div class="hobak-auth-field hobak-auth-hidden" id="hobak-auth-nickname-field">
            <label class="hobak-auth-label" for="hobak-auth-nickname">
              닉네임<span class="hobak-auth-req">*</span>
            </label>
            <input
              id="hobak-auth-nickname"
              class="hobak-auth-input"
              type="text"
              maxlength="20"
              placeholder="예: 호박이웃"
            />
          </div>

          <div class="hobak-auth-field">
            <label class="hobak-auth-label" for="hobak-auth-email">
              이메일<span class="hobak-auth-req">*</span>
            </label>
            <input
              id="hobak-auth-email"
              class="hobak-auth-input"
              type="email"
              required
              autocomplete="email"
              placeholder="example@email.com"
            />
          </div>

          <div class="hobak-auth-field">
            <label class="hobak-auth-label" for="hobak-auth-password">
              비밀번호<span class="hobak-auth-req">*</span>
            </label>
            <input
              id="hobak-auth-password"
              class="hobak-auth-input"
              type="password"
              required
              minlength="6"
              autocomplete="current-password"
              placeholder="6자 이상 입력"
            />
          </div>

          <div id="hobak-auth-error" class="hobak-auth-error hobak-auth-hidden"></div>
          <div id="hobak-auth-info" class="hobak-auth-info hobak-auth-hidden"></div>

          <button type="submit" id="hobak-auth-submit" class="hobak-btn hobak-btn-primary hobak-auth-submit">
            로그인하기
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#hobak-auth-close');
    const tabs = overlay.querySelectorAll('.hobak-auth-tab');
    const form = overlay.querySelector('#hobak-auth-form');

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeModal();
      }
    });

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        setMode(tab.dataset.mode);
      });
    });

    form.addEventListener('submit', handleFormSubmit);
    return overlay;
  }

  function setMode(mode) {
    _mode = mode === 'signup' ? 'signup' : 'login';
    const overlay = ensureModalDom();
    const tabs = overlay.querySelectorAll('.hobak-auth-tab');
    const nickField = overlay.querySelector('#hobak-auth-nickname-field');
    const nickInput = overlay.querySelector('#hobak-auth-nickname');
    const passInput = overlay.querySelector('#hobak-auth-password');
    const submitBtn = overlay.querySelector('#hobak-auth-submit');
    const errBox = overlay.querySelector('#hobak-auth-error');
    const infoBox = overlay.querySelector('#hobak-auth-info');

    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.mode === _mode));
    if (_mode === 'signup') {
      nickField.classList.remove('hobak-auth-hidden');
      nickInput.required = true;
      passInput.autocomplete = 'new-password';
      submitBtn.textContent = '회원가입하기';
    } else {
      nickField.classList.add('hobak-auth-hidden');
      nickInput.required = false;
      passInput.autocomplete = 'current-password';
      submitBtn.textContent = '로그인하기';
    }
    errBox.classList.add('hobak-auth-hidden');
    infoBox.classList.add('hobak-auth-hidden');
  }

  function openModal(options = {}) {
    const overlay = ensureModalDom();
    setMode(options.mode || 'login');
    _pendingCallback = typeof options.onSuccess === 'function' ? options.onSuccess : null;
    overlay.classList.add('is-open');
    setTimeout(() => {
      const target =
        _mode === 'signup'
          ? overlay.querySelector('#hobak-auth-nickname')
          : overlay.querySelector('#hobak-auth-email');
      if (target) target.focus();
    }, 60);
  }

  function closeModal() {
    const overlay = document.getElementById('hobak-auth-overlay');
    if (overlay) overlay.classList.remove('is-open');
    _pendingCallback = null;
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const overlay = ensureModalDom();
    const nickInput = overlay.querySelector('#hobak-auth-nickname');
    const emailInput = overlay.querySelector('#hobak-auth-email');
    const passInput = overlay.querySelector('#hobak-auth-password');
    const submitBtn = overlay.querySelector('#hobak-auth-submit');
    const errBox = overlay.querySelector('#hobak-auth-error');
    const infoBox = overlay.querySelector('#hobak-auth-info');

    errBox.classList.add('hobak-auth-hidden');
    infoBox.classList.add('hobak-auth-hidden');

    const email = emailInput.value.trim();
    const password = passInput.value;
    const nickname = nickInput.value.trim();

    if (_mode === 'signup' && !nickname) {
      errBox.textContent = '회원가입 시 닉네임을 필수로 입력해주세요.';
      errBox.classList.remove('hobak-auth-hidden');
      nickInput.focus();
      return;
    }
    if (!email) {
      errBox.textContent = '이메일을 입력해주세요.';
      errBox.classList.remove('hobak-auth-hidden');
      emailInput.focus();
      return;
    }
    if (!password || password.length < 6) {
      errBox.textContent = '비밀번호는 6자 이상 입력해주세요.';
      errBox.classList.remove('hobak-auth-hidden');
      passInput.focus();
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = _mode === 'signup' ? '가입 중...' : '로그인 중...';

    try {
      if (_mode === 'signup') {
        const res = await authFetch('signup', {
          body: {
            email,
            password,
            data: {
              nickname,
              location: '경기 광명시 광명동',
            },
          },
        });

        if (res.access_token && res.user) {
          saveSession({ access_token: res.access_token, user: res.user });
          await ensureSellerProfile(getUser(), res.access_token);
          const cb = _pendingCallback;
          closeModal();
          if (global.HobakData) global.HobakData.showToast(`${nickname}님, 환영합니다! 🎃`);
          if (cb) cb();
        } else {
          // 이메일 인증이 활성화된 프로젝트인 경우
          setMode('login');
          emailInput.value = email;
          passInput.value = '';
          infoBox.textContent =
            '가입 확인 메일을 발송했습니다. 이메일 인증을 완료한 후 로그인해주세요.';
          infoBox.classList.remove('hobak-auth-hidden');
        }
      } else {
        const res = await authFetch('token?grant_type=password', {
          body: { email, password },
        });
        saveSession({ access_token: res.access_token, user: res.user });
        await ensureSellerProfile(getUser(), res.access_token);
        const user = getUser();
        const cb = _pendingCallback;
        closeModal();
        if (global.HobakData) {
          global.HobakData.showToast(`${user.nickname}님, 반가워요! 🎃`);
        }
        if (cb) cb();
      }
    } catch (err) {
      errBox.textContent = translateError(err.message);
      errBox.classList.remove('hobak-auth-hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  async function logout() {
    const token = getAccessToken();
    const cfg = getConfig();
    if (token && cfg) {
      fetch(cfg.url + '/auth/v1/logout', {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: 'Bearer ' + token,
        },
      }).catch(() => {});
    }
    saveSession(null);
    if (global.HobakData) {
      global.HobakData.showToast('로그아웃되었습니다 🎃');
    }
  }

  function requireAuth(onAuthenticated) {
    if (isLoggedIn()) {
      if (typeof onAuthenticated === 'function') onAuthenticated();
      return true;
    }
    if (global.HobakData) {
      global.HobakData.showToast('글쓰기는 로그인 후 이용할 수 있어요 🎃');
    }
    openModal({
      mode: 'login',
      onSuccess: onAuthenticated,
    });
    return false;
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncHeaderButtons();
    const loginBtn = document.getElementById('hobak-auth-login-btn');
    const logoutBtn = document.getElementById('hobak-auth-logout-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => openModal({ mode: 'login' }));
    }
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => logout());
    }
  });

  global.HobakAuth = {
    getUser,
    getAccessToken,
    isLoggedIn,
    openModal,
    closeModal,
    logout,
    requireAuth,
    syncHeaderButtons,
  };
})(window);

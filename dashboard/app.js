// ─────────────────── CONFIG ───────────────────
const API_BASE = '/api/v1';

// ─────────────────── STATE ───────────────────
const state = {
  user: null,
  accessToken: null,
  species: [],
  catches: [],
  waypoints: [],
  weather: null,
  currentTab: 'feed',
  feedFilter: 'nearby',
  currentCatch: null,
};

// ─────────────────── API ───────────────────
async function api(method, path, body = null, auth = true) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (auth && state.accessToken) headers['Authorization'] = `Bearer ${state.accessToken}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.error('API error:', err);
    throw err;
  }
}

// ─────────────────── AUTH ───────────────────
function normalizeUser(apiUser) {
  return {
    id: apiUser.id,
    name: apiUser.displayName || apiUser.name || apiUser.phoneNumber || 'User',
    handle: apiUser.handle || 'user',
    avatar: apiUser.avatarUrl,
    isPremium: (apiUser.subscriptionTier || '').toLowerCase() === 'premium',
    phone: apiUser.phoneNumber,
    email: apiUser.email,
    locale: apiUser.locale || 'ar',
  };
}

async function requestOTP() {
  const phoneNumber = '0' + document.getElementById('phone-input').value.trim();
  if (!phoneNumber.match(/^01[0-2,5]\d{8}$/)) return alert('أدخل رقم هاتف صحيح');
  try {
    await api('POST', '/auth/otp/request', { phoneNumber }, false);
    document.getElementById('otp-section').classList.remove('hidden');
  } catch (e) { alert('فشل إرسال رمز التحقق'); }
}

async function verifyOTP() {
  const phoneNumber = '0' + document.getElementById('phone-input').value.trim();
  const otp = document.getElementById('otp-input').value.trim();
  try {
    const { user, tokens } = await api('POST', '/auth/otp/verify', { phoneNumber, otp }, false);
    state.user = normalizeUser(user);
    state.accessToken = tokens.accessToken;
    localStorage.setItem('sennara_refresh', tokens.refreshToken);
    showMainScreen();
    loadAllData();
  } catch (e) { alert('رمز التحقق غير صحيح'); }
}

async function tryAutoLogin() {
  const refresh = localStorage.getItem('sennara_refresh');
  if (!refresh) return;
  try {
    const { tokens } = await api('POST', '/auth/refresh', { refreshToken: refresh }, false);
    state.accessToken = tokens.accessToken;
    const { user } = await api('GET', '/auth/me');
    state.user = normalizeUser(user);
    showMainScreen();
    loadAllData();
  } catch (e) { localStorage.removeItem('sennara_refresh'); }
}

// ─────────────────── UI ───────────────────
function showMainScreen() {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('main-screen').classList.add('active');
}

function showTab(tabName) {
  state.currentTab = tabName;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tabName}`)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-tab="${tabName}"]`)?.classList.add('active');
  const titles = { feed: 'الرئيسية', map: 'الخريطة', logbook: 'سجل الصيد', weather: 'الطقس', species: 'الأنواع', profile: 'الملف الشخصي' };
  document.getElementById('screen-title').textContent = titles[tabName] || 'سنارة';
}

// ─────────────────── DATA LOADING ───────────────────
async function loadAllData() {
  await Promise.all([loadSpecies(), loadCatches(), loadWaypoints(), loadWeather()]);
}

async function loadSpecies() {
  try {
    const { species } = await api('GET', '/species?limit=100');
    state.species = species.map(s => ({
      id: s.id,
      english_name: s.englishName,
      arabic_name: s.arabicName,
      scientific_name: s.scientificName,
      egyptian_slang_names: s.egyptianSlangNames,
      family: s.family,
      category: s.category,
      water_bodies: s.waterBodies,
      habitat: s.habitat,
      description: s.description,
      average_weight_kg: s.averageWeightKg,
      conservation_status: s.conservationStatus,
    }));
    renderSpecies();
    populateCatchSpecies();
  } catch (e) {}
}

async function loadCatches() {
  try {
    const { catches } = await api('GET', `/catches?feed=${state.feedFilter}&limit=50`);
    state.catches = catches.map(c => ({
      id: c.id,
      userId: c.userId,
      userName: c.user?.displayName,
      userHandle: c.user?.handle,
      speciesName: c.species?.arabicName,
      weightKg: c.weightKg,
      lengthCm: c.lengthCm,
      location: c.location ? { lat: c.location.latitude, lng: c.location.longitude, name: '' } : null,
      privacy: c.privacy,
      weatherSnapshot: c.weather,
      photoUrl: c.photoUrls?.[0],
      note: c.description,
      createdAt: c.createdAt,
      likeCount: c.likesCount,
      commentCount: c.commentsCount,
      liked: c.liked,
    }));
    renderCatches();
    renderMyCatches();
  } catch (e) {}
}

async function loadWaypoints() {
  try {
    const { waypoints } = await api('GET', '/waypoints/nearby?limit=50');
    state.waypoints = waypoints.map(w => ({
      id: w.id,
      userId: w.userId,
      name: w.name,
      description: w.description,
      location: w.location ? { lat: w.location.latitude, lng: w.location.longitude } : null,
      type: w.waypointType,
      privacy: w.privacy,
      createdAt: w.createdAt,
    }));
    renderWaypoints();
  } catch (e) {}
}

async function loadWeather() {
  try {
    const current = await api('GET', '/weather/current?lat=30&lng=31');
    const forecastRes = await api('GET', '/weather/forecast?lat=30&lng=31&days=5');
    const currentMapped = {
      location: { lat: current.location?.latitude, lng: current.location?.longitude },
      temperature: current.airTemperatureC,
      feelsLike: current.airTemperatureC,
      wind: { speed: current.windSpeedKmh, direction: current.windDirectionDeg?.toString() || 'N', gust: current.windSpeedKmh },
      pressure: current.barometricPressureHpa,
      humidity: 65,
      condition: 'clear',
      visibility: 10,
      updatedAt: current.fetchedAt,
    };
    const forecast = {
      forecast: (forecastRes.forecast || []).map(d => ({
        date: d.date,
        temperature: { min: d.airTemperatureMinC ?? d.airTemperatureC - 3, max: d.airTemperatureMaxC ?? d.airTemperatureC + 4 },
        wind: { speed: d.windSpeedKmh, direction: d.windDirectionDeg?.toString() || 'N' },
        condition: d.condition || 'clear',
        waveHeight: d.waveHeightM,
        tide: d.tide,
      })),
    };
    state.weather = { current: currentMapped, forecast };
    renderWeather();
  } catch (e) {}
}

// ─────────────────── RENDERERS ───────────────────
function renderCatches() {
  const container = document.getElementById('catches-list');
  if (!state.catches.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎣</div><div class="empty-state-text">لا يوجد صيد حالياً</div></div>';
    return;
  }
  container.innerHTML = state.catches.map(c => `
    <div class="catch-card" data-id="${c.id}">
      <div class="catch-header">
        <div class="catch-user">
          <div class="catch-avatar">${(c.userName || 'U').charAt(0)}</div>
          <div>
            <div class="catch-user-name">${c.userName || 'Unknown'}</div>
            <div class="catch-user-handle">@${c.userHandle || 'unknown'}</div>
          </div>
        </div>
        <div class="catch-time">${timeAgo(c.createdAt)}</div>
      </div>
      <div class="catch-body">
        <div class="catch-species">
          <span class="catch-species-icon">🐟</span>
          <span class="catch-species-name">${c.speciesName || 'Unknown'}</span>
        </div>
        ${c.photoUrl ? `<img src="${c.photoUrl}" style="width:100%;max-height:220px;object-fit:cover;border-radius:8px;margin:8px 0;">` : ''}
        <div class="catch-stats">
          ${c.weightKg ? `<div class="catch-stat"><strong>${c.weightKg} كجم</strong> الوزن</div>` : ''}
          ${c.lengthCm ? `<div class="catch-stat"><strong>${c.lengthCm} سم</strong> الطول</div>` : ''}
        </div>
        <div class="catch-location">📍 ${c.location?.name || 'Unknown location'}</div>
        ${c.note ? `<div class="catch-note">${c.note}</div>` : ''}
      </div>
      <div class="catch-actions">
        <button class="catch-action ${c.likeCount > 0 ? 'liked' : ''}" data-id="${c.id}" onclick="toggleLike('${c.id}')">
          <span>🙌</span> تحية ${c.likeCount > 0 ? `<strong>${c.likeCount}</strong>` : ''}
        </button>
        <button class="catch-action" onclick="showCatchDetail('${c.id}')">
          <span>💬</span> تعليق ${c.commentCount > 0 ? `(${c.commentCount})` : ''}
        </button>
        <button class="catch-action" onclick="shareCatch('${c.id}')">
          <span>↗️</span> مشاركة
        </button>
      </div>
    </div>
  `).join('');
}

function renderMyCatches() {
  const container = document.getElementById('my-catches-list');
  const myCatches = state.catches.filter(c => c.userId === state.user?.id);
  if (!myCatches.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📖</div><div class="empty-state-text">سجل الصيد فارغ. اضغط "+ صيد جديد" للبدء!</div></div>';
    return;
  }
  container.innerHTML = myCatches.map(c => `
    <div class="catch-card" data-id="${c.id}">
      <div class="catch-header">
        <div class="catch-user">
          <div class="catch-avatar">${(c.userName || 'U').charAt(0)}</div>
          <div>
            <div class="catch-user-name">${c.speciesName || 'Unknown'}</div>
            <div class="catch-user-handle">${timeAgo(c.createdAt)}</div>
          </div>
        </div>
      </div>
      <div class="catch-body">
        <div class="catch-stats">
          ${c.weightKg ? `<div class="catch-stat"><strong>${c.weightKg} كجم</strong></div>` : ''}
          ${c.lengthCm ? `<div class="catch-stat"><strong>${c.lengthCm} سم</strong></div>` : ''}
        </div>
        <div class="catch-location">📍 ${c.location?.name || 'Unknown'}</div>
      </div>
    </div>
  `).join('');
}

function renderWaypoints() {
  const container = document.getElementById('waypoints-list');
  if (!state.waypoints.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🗺️</div><div class="empty-state-text">لا توجد نقاط مسجلة</div></div>';
    return;
  }
  container.innerHTML = state.waypoints.map(w => `
    <div class="waypoint-card">
      <h4>${w.name}</h4>
      <p>${w.description || ''}</p>
      <div class="coords">${w.location?.lat?.toFixed(4)}, ${w.location?.lng?.toFixed(4)}</div>
      <span class="waypoint-type">${w.type || 'spot'}</span>
    </div>
  `).join('');
}

function renderWeather() {
  if (!state.weather) return;
  const { current, forecast } = state.weather;
  const wIcon = { clear: '☀️', partly_cloudy: '⛅', cloudy: '☁️', windy: '💨', rain: '🌧️' };
  
  document.getElementById('weather-current').innerHTML = `
    <div class="location">📍 ${current.location?.lat?.toFixed(1)}, ${current.location?.lng?.toFixed(1)}</div>
    <div class="temp">${current.temperature}°</div>
    <div class="temp-feels">يشعر كـ ${current.feelsLike}°</div>
    <div class="weather-stats">
      <div class="weather-stat">
        <div class="weather-stat-value">${current.wind?.speed}</div>
        <div class="weather-stat-label">كم/س رياح</div>
      </div>
      <div class="weather-stat">
        <div class="weather-stat-value">${current.humidity}%</div>
        <div class="weather-stat-label">رطوبة</div>
      </div>
      <div class="weather-stat">
        <div class="weather-stat-value">${current.pressure}</div>
        <div class="weather-stat-label">ضغط</div>
      </div>
    </div>
  `;
  
  document.getElementById('weather-forecast').innerHTML = forecast.forecast.map((d, i) => `
    <div class="forecast-day">
      <div class="day-name">${i === 0 ? 'اليوم' : dayName(d.date)}</div>
      <div class="day-icon">${wIcon[d.condition] || '🌤️'}</div>
      <div class="day-temp">${d.temperature?.max}°</div>
      <div class="day-temp-range">${d.temperature?.min}° / ${d.temperature?.max}°</div>
    </div>
  `).join('');
}

function renderSpecies() {
  const container = document.getElementById('species-list');
  const search = (document.getElementById('species-search')?.value || '').toLowerCase();
  let filtered = state.species;
  if (search) {
    filtered = filtered.filter(s =>
      s.english_name?.toLowerCase().includes(search) ||
      s.arabic_name?.includes(search) ||
      s.scientific_name?.toLowerCase().includes(search)
    );
  }
  container.innerHTML = filtered.map(s => `
    <div class="species-card" data-id="${s.id}" onclick="showSpeciesDetail('${s.id}')">
      <div class="species-icon">🐟</div>
      <div class="species-info">
        <div class="species-name">${s.arabic_name}</div>
        <div class="species-name-en">${s.english_name} · <em>${s.scientific_name}</em></div>
        <div class="species-meta">
          <span class="species-tag category">${s.category || 'unknown'}</span>
          <span class="species-tag water">${s.water_bodies?.[0] || 'unknown'}</span>
          <span class="species-tag conservation ${s.conservation_status}">${s.conservation_status}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderProfile() {
  const u = state.user;
  if (!u) return;
  const myCatches = state.catches.filter(c => c.userId === u.id);
  document.getElementById('profile-card').innerHTML = `
    <div class="profile-avatar">${(u.name || 'U').charAt(0)}</div>
    <div class="profile-name">${u.name}</div>
    <div class="profile-handle">@${u.handle || 'user'}</div>
    ${u.isPremium ? '<div class="profile-badge">⭐ بريميوم</div>' : '<div class="profile-badge" style="background:#eee;color:#666;">مجاني</div>'}
  `;
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card"><div class="stat-value">${myCatches.length}</div><div class="stat-label">صيدات</div></div>
    <div class="stat-card"><div class="stat-value">${state.waypoints.length}</div><div class="stat-label">نقاط</div></div>
    <div class="stat-card"><div class="stat-value">${myCatches.reduce((s, c) => s + (c.weightKg || 0), 0).toFixed(1)}</div><div class="stat-label">كجم</div></div>
  `;
  
  document.getElementById('premium-card').innerHTML = `
    <h3>⭐ اشتراك بريميوم</h3>
    <p>احصل على إحداثيات دقيقة، توقعات 7 أيام، إحصائيات متقدمة، ومزامنة أولوية</p>
    <div class="price">149 ج.م <span class="price-period">/ شهر</span></div>
    <div class="premium-features">
      <div class="premium-feature">✅ إحداثيات دقيقة على الخريطة</div>
      <div class="premium-feature">✅ توقعات طقس بحرية 7 أيام</div>
      <div class="premium-feature">✅ إحصائيات متقدمة للأنواع</div>
      <div class="premium-feature">✅ مزامنة أولوية</div>
    </div>
  `;
}

function populateCatchSpecies() {
  const select = document.getElementById('catch-species');
  select.innerHTML = '<option value="">اختر نوع السمكة...</option>' + 
    state.species.map(s => `<option value="${s.id}">${s.arabic_name} (${s.english_name})</option>`).join('');
}

// ─────────────────── ACTIONS ───────────────────
async function toggleLike(catchId) {
  try {
    const data = await api('POST', `/feed/catches/${catchId}/like`);
    const c = state.catches.find(x => x.id === catchId);
    if (c) { c.likeCount = data.likes; c.liked = data.liked; }
    renderCatches();
  } catch (e) {}
}

async function showCatchDetail(catchId) {
  const c = state.catches.find(x => x.id === catchId);
  if (!c) return;
  state.currentCatch = c;
  
  try {
    const { comments } = await api('GET', `/feed/catches/${catchId}/comments`);
    const commentsHtml = comments.length ? comments.map(cm => `
      <div class="comment-item">
        <div class="comment-avatar">${(cm.userName || 'U').charAt(0)}</div>
        <div class="comment-body">
          <div class="comment-name">${cm.userName}</div>
          <div class="comment-text">${cm.text}</div>
          <div class="comment-time">${timeAgo(cm.createdAt)}</div>
        </div>
      </div>
    `).join('') : '<div class="empty-state" style="padding:20px 0"><div class="empty-state-text">لا توجد تعليقات</div></div>';
    
    document.getElementById('catch-detail-content').innerHTML = `
      <div class="catch-header" style="margin-bottom:16px">
        <div class="catch-user">
          <div class="catch-avatar">${(c.userName || 'U').charAt(0)}</div>
          <div>
            <div class="catch-user-name">${c.userName || 'Unknown'}</div>
            <div class="catch-user-handle">@${c.userHandle || 'unknown'}</div>
          </div>
        </div>
        <div class="catch-time">${timeAgo(c.createdAt)}</div>
      </div>
      <div class="catch-body" style="margin-bottom:16px">
        <div class="catch-species">
          <span class="catch-species-icon">🐟</span>
          <span class="catch-species-name">${c.speciesName || 'Unknown'}</span>
        </div>
        ${c.photoUrl ? `<img src="${c.photoUrl}" style="width:100%;max-height:220px;object-fit:cover;border-radius:8px;margin:8px 0;">` : ''}
        <div class="catch-stats">
          ${c.weightKg ? `<div class="catch-stat"><strong>${c.weightKg} كجم</strong> الوزن</div>` : ''}
          ${c.lengthCm ? `<div class="catch-stat"><strong>${c.lengthCm} سم</strong> الطول</div>` : ''}
        </div>
        <div class="catch-location">📍 ${c.location?.name || 'Unknown location'}</div>
        ${c.note ? `<div class="catch-note">${c.note}</div>` : ''}
      </div>
      <div class="comments-list">${commentsHtml}</div>
      <div class="add-comment">
        <input type="text" id="new-comment-text" placeholder="اكتب تعليقاً...">
        <button onclick="addComment('${catchId}')">إرسال</button>
      </div>
    `;
    document.getElementById('modal-catch-detail').classList.remove('hidden');
  } catch (e) {}
}

async function addComment(catchId) {
  const content = document.getElementById('new-comment-text').value.trim();
  if (!content) return;
  try {
    await api('POST', `/feed/catches/${catchId}/comments`, { content });
    showCatchDetail(catchId);
    loadCatches();
  } catch (e) {}
}

function shareCatch(catchId) {
  const url = `${window.location.origin}/catch/${catchId}`;
  if (navigator.share) navigator.share({ title: 'صيد على سنارة', url });
  else alert(`تم نسخ الرابط: ${url}`);
}

async function showSpeciesDetail(id) {
  const s = state.species.find(x => x.id === id);
  if (!s) return;
  document.getElementById('species-detail-title').textContent = s.arabic_name;
  document.getElementById('species-detail-content').innerHTML = `
    <div style="text-align:center;margin-bottom:16px"><div style="font-size:64px">🐟</div></div>
    <div class="species-name" style="font-size:20px;text-align:center;margin-bottom:4px">${s.arabic_name}</div>
    <div class="species-name-en" style="text-align:center;margin-bottom:16px">${s.english_name} · <em>${s.scientific_name}</em></div>
    <div class="species-meta" style="justify-content:center;margin-bottom:16px">
      <span class="species-tag category">${s.category}</span>
      <span class="species-tag conservation ${s.conservation_status}">${s.conservation_status}</span>
    </div>
    <div style="margin-bottom:16px">
      <h4 style="margin-bottom:8px;font-size:14px;color:var(--text-secondary)">العائلة</h4>
      <p style="font-size:15px">${s.family}</p>
    </div>
    <div style="margin-bottom:16px">
      <h4 style="margin-bottom:8px;font-size:14px;color:var(--text-secondary)">الموائل</h4>
      <p style="font-size:15px">${s.habitat}</p>
    </div>
    <div style="margin-bottom:16px">
      <h4 style="margin-bottom:8px;font-size:14px;color:var(--text-secondary)">الوصف</h4>
      <p style="font-size:15px;line-height:1.6">${s.description}</p>
    </div>
    <div style="margin-bottom:16px">
      <h4 style="margin-bottom:8px;font-size:14px;color:var(--text-secondary)">مواطن المياه</h4>
      <p style="font-size:15px">${s.water_bodies?.join(', ')}</p>
    </div>
    <div>
      <h4 style="margin-bottom:8px;font-size:14px;color:var(--text-secondary)">الوزن المتوسط</h4>
      <p style="font-size:15px">${s.average_weight_kg} كجم</p>
    </div>
  `;
  document.getElementById('modal-species-detail').classList.remove('hidden');
}

async function uploadPhoto(file) {
  const filename = file.name || 'photo.jpg';
  const contentType = file.type || 'image/jpeg';
  const { uploadUrl, publicUrl } = await api('POST', '/uploads/presign', { filename, contentType });

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return publicUrl;
}

async function saveCatch() {
  const speciesId = document.getElementById('catch-species').value;
  const weightKg = parseFloat(document.getElementById('catch-weight').value) || undefined;
  const lengthCm = parseFloat(document.getElementById('catch-length').value) || undefined;
  const lat = parseFloat(document.getElementById('catch-lat').value) || 30;
  const lng = parseFloat(document.getElementById('catch-lng').value) || 31;
  const description = document.getElementById('catch-note').value;
  const photoInput = document.getElementById('catch-photo');

  if (!speciesId) return alert('اختر نوع السمكة');

  try {
    const body = {
      speciesId,
      weightKg,
      lengthCm,
      latitude: lat,
      longitude: lng,
      privacy: 'public',
      description,
    };

    if (photoInput.files && photoInput.files[0]) {
      body.photoUrls = [await uploadPhoto(photoInput.files[0])];
    }

    await api('POST', '/catches', body);
    closeModal('modal-add-catch');
    loadCatches();
    clearCatchForm();
    showTab('feed');
  } catch (e) {
    console.error(e);
    alert('فشل حفظ الصيد');
  }
}

function clearCatchForm() {
  document.getElementById('catch-species').value = '';
  document.getElementById('catch-weight').value = '';
  document.getElementById('catch-length').value = '';
  document.getElementById('catch-lat').value = '';
  document.getElementById('catch-lng').value = '';
  document.getElementById('catch-note').value = '';
  document.getElementById('catch-photo').value = '';
  const preview = document.getElementById('catch-photo-preview');
  preview.src = '';
  preview.classList.add('hidden');
}

function useCurrentLocation() {
  if (!navigator.geolocation) return alert('المتصفح لا يدعم تحديد الموقع');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById('catch-lat').value = pos.coords.latitude.toFixed(5);
      document.getElementById('catch-lng').value = pos.coords.longitude.toFixed(5);
    },
    () => alert('تعذر الحصول على الموقع'),
    { enableHighAccuracy: true }
  );
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ─────────────────── HELPERS ───────────────────
function timeAgo(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff/60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff/3600)} ساعة`;
  if (diff < 604800) return `منذ ${Math.floor(diff/86400)} يوم`;
  return d.toLocaleDateString('ar-EG');
}

function dayName(dateStr) {
  const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  return days[new Date(dateStr).getDay()];
}

// ─────────────────── EVENT LISTENERS ───────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Auth
  document.getElementById('btn-request-otp')?.addEventListener('click', requestOTP);
  document.getElementById('btn-verify-otp')?.addEventListener('click', verifyOTP);
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      showTab(tab);
      if (tab === 'profile') renderProfile();
    });
  });
  
  // Feed tabs
  document.querySelectorAll('.feed-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.feed-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.feedFilter = btn.dataset.feed;
      loadCatches();
    });
  });
  
  // Header profile button
  document.getElementById('btn-profile')?.addEventListener('click', () => {
    showTab('profile');
    renderProfile();
  });
  
  // Add catch
  document.getElementById('btn-add-catch')?.addEventListener('click', () => {
    document.getElementById('modal-add-catch').classList.remove('hidden');
  });
  document.getElementById('btn-save-catch')?.addEventListener('click', saveCatch);
  document.getElementById('btn-use-location')?.addEventListener('click', useCurrentLocation);
  document.getElementById('catch-photo')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    const preview = document.getElementById('catch-photo-preview');
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.classList.remove('hidden');
    } else {
      preview.src = '';
      preview.classList.add('hidden');
    }
  });

  // Species search
  document.getElementById('species-search')?.addEventListener('input', renderSpecies);
  
  // Modal closes
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', () => {
      overlay.closest('.modal').classList.add('hidden');
    });
  });
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').classList.add('hidden');
    });
  });
  
  // Try auto-login
  tryAutoLogin();
});

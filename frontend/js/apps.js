"use strict";

const API_URL     = '/api';
const ADMIN_EMAIL = 'perdebaevadilbek586@gmail.com';

/* ── API client ──────────────────────────────────────────── */
const api = {
  _t: () => localStorage.getItem('kybers_token') || '',
  _h() { return { 'Content-Type':'application/json', 'Authorization':`Bearer ${this._t()}` }; },
  async get(path) {
    const r = await fetch(API_URL + path, { headers: this._h() });
    return r.ok ? r.json() : null;
  },
  async post(path, body) {
    const r = await fetch(API_URL + path, { method:'POST', headers:this._h(), body:JSON.stringify(body) });
    return r.json();
  },
};

/* ── IndexedDB file store ───────────────────────────────── */
const appsFileDB = {
  _db: null,
  async init() {
    if (this._db) return;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('kybers_files_v1', 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore('files', { keyPath: 'id' });
      req.onsuccess = e => { this._db = e.target.result; resolve(); };
      req.onerror   = () => reject(req.error);
    });
  },
  async get(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx  = this._db.transaction('files', 'readonly');
      const req = tx.objectStore('files').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => reject(req.error);
    });
  },
};

async function downloadAppFile(_appId, fileId, fileName) {
  try {
    const record = await appsFileDB.get(fileId);
    if (!record) { showToast('Fayl topilmadi.', 'error'); return; }
    const blob = new Blob([record.buffer], { type: record.type || 'application/octet-stream' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: fileName || 'download' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    showToast('Faylni yuklab olishda xato: ' + err.message, 'error');
  }
}
window.downloadAppFile = downloadAppFile;

/* ── Session helpers ─────────────────────────────────────── */
function getSession()    { return JSON.parse(localStorage.getItem('kybers_session') || 'null'); }
function removeSession() { localStorage.removeItem('kybers_session'); localStorage.removeItem('kybers_token'); }

function checkAuth() {
  const s = getSession();
  if (!s) { window.location.replace('login.html'); return null; }
  return s;
}

/* ── Toast ───────────────────────────────────────────────── */
function showToast(message, type = 'info') {
  let toast = document.getElementById('appsToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appsToast';
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background:rgba(12,0,0,0.95); border:1px solid rgba(255,0,0,0.3);
      border-radius:14px; padding:14px 20px; max-width:340px;
      font-family:'Space Grotesk',sans-serif; font-size:0.9rem;
      color:#fff; backdrop-filter:blur(20px);
      box-shadow:0 0 30px rgba(255,0,0,0.15);
      transform:translateY(120%); opacity:0;
      transition:all 0.4s cubic-bezier(0.4,0,0.2,1);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.borderColor = type === 'error' ? 'rgba(255,50,50,0.5)' : 'rgba(255,0,0,0.3)';
  requestAnimationFrame(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.transform = 'translateY(120%)'; toast.style.opacity = '0'; }, 3500);
}

/* ── User menu ───────────────────────────────────────────── */
function initUserMenu() {
  const loginBtn      = document.getElementById('loginBtn');
  const userMenu      = document.getElementById('userMenu');
  const userAvatarBtn = document.getElementById('userAvatarBtn');
  const userDropdown  = document.getElementById('userDropdown');
  const logoutBtn     = document.getElementById('logoutBtn');
  const chevron       = userAvatarBtn?.querySelector('.chevron-icon');
  const session       = getSession();

  if (session) {
    const isAdmin = session.isAdmin || session.email === ADMIN_EMAIL;
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';

    const letter  = session.name ? session.name.charAt(0).toUpperCase() : '?';
    const avatarEl = document.getElementById('userAvatarLetter');
    if (avatarEl) avatarEl.textContent = letter;

    const dnName  = document.getElementById('dropdownName');
    const dnEmail = document.getElementById('dropdownEmail');
    if (dnName)  dnName.textContent  = session.name  || '';
    if (dnEmail) dnEmail.textContent = session.email || '';

    const adminBadge = document.getElementById('dropdownAdminBadge');
    const userBadge  = document.getElementById('dropdownUserBadge');
    const adminLink  = document.getElementById('adminPanelLink');
    const adminDiv   = document.getElementById('adminDivider');

    if (isAdmin) {
      if (adminBadge) adminBadge.style.display = 'block';
      if (adminLink)  adminLink.style.display  = 'flex';
      if (adminDiv)   adminDiv.style.display   = 'block';
    } else {
      if (userBadge) userBadge.style.display = 'block';
    }

    if (userAvatarBtn) {
      userAvatarBtn.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = userDropdown.classList.toggle('show');
        if (chevron) chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
      });
    }
    document.addEventListener('click', () => {
      userDropdown?.classList.remove('show');
      if (chevron) chevron.style.transform = '';
    });
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => { removeSession(); window.location.href = 'login.html'; });
    }
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (userMenu) userMenu.style.display = 'none';
  }
}

/* ── Payment modal state ─────────────────────────────────── */
let _payApp    = null;
let _payUser   = null;
let _receiptB64 = null;

function openPayModal(appId) {
  console.log('openPayModal called with appId:', appId);
  
  const user = getSession();
  if (!user) { 
    console.log('No user session, redirecting to login');
    window.location.href = 'login.html'; 
    return; 
  }
  
  console.log('User session:', user);
  console.log('Apps cache:', window._appsCache);
  
  _payApp  = window._appsCache?.find(a => String(a.id) === String(appId));
  _payUser = user;
  _receiptB64 = null;
  
  if (!_payApp) {
    console.error('App not found in cache for id:', appId);
    showToast('Ilova topilmadi', 'error');
    return;
  }
  
  console.log('Opening payment modal for app:', _payApp);

  const title  = document.getElementById('payAppTitle');
  const amount = document.getElementById('payAmount');
  if (title)  title.textContent  = _payApp.name;
  if (amount) amount.textContent = Number(_payApp.price).toLocaleString() + ' UZS';
  showPayStep(1);
  const modal = document.getElementById('payModal');
  if (!modal) {
    console.error('Payment modal not found in DOM');
    return;
  }
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
window.openPayModal = openPayModal;

function closePayModal() {
  document.getElementById('payModal').style.display = 'none';
  document.body.style.overflow = '';
  _receiptB64 = null;
  const preview = document.getElementById('receiptPreview');
  if (preview) preview.style.display = 'none';
  const img = document.getElementById('receiptImg');
  if (img) img.src = '';
  resetSubmitBtn();
}
window.closePayModal = closePayModal;

function showPayStep(n) {
  [1,2,3].forEach(i => {
    const el = document.getElementById('payStep' + i);
    if (el) el.style.display = (i === n) ? 'block' : 'none';
  });
}
function goPayStep2() { showPayStep(2); }
window.goPayStep2 = goPayStep2;

function openCamera()  { document.getElementById('cameraInput').value  = ''; document.getElementById('cameraInput').click(); }
function openGallery() { document.getElementById('galleryInput').value = ''; document.getElementById('galleryInput').click(); }
window.openCamera  = openCamera;
window.openGallery = openGallery;

async function pasteClipboard() {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imageType = item.types.find(t => t.startsWith('image/'));
      if (imageType) { handleReceiptBlob(await item.getType(imageType)); return; }
    }
    showToast('Buferda rasm topilmadi.', 'error');
  } catch {
    showToast('Buferga kirish rad etildi.', 'error');
  }
}
window.pasteClipboard = pasteClipboard;

function handleReceiptFile(input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Faqat rasm formati qabul qilinadi.', 'error'); return; }
  handleReceiptBlob(file);
}
window.handleReceiptFile = handleReceiptFile;

function handleReceiptBlob(blob) {
  const reader = new FileReader();
  reader.onload = e => { _receiptB64 = e.target.result; setReceiptPreview(_receiptB64); };
  reader.readAsDataURL(blob);
}
function setReceiptPreview(dataUrl) {
  const preview = document.getElementById('receiptPreview');
  const img     = document.getElementById('receiptImg');
  const btn     = document.getElementById('submitReceiptBtn');
  if (img)     img.src               = dataUrl;
  if (preview) preview.style.display = 'block';
  if (btn) {
    btn.disabled          = false;
    btn.style.background  = 'linear-gradient(135deg,#ff0000,#cc0000)';
    btn.style.borderColor = 'transparent';
    btn.style.color       = '#fff';
    btn.style.cursor      = 'pointer';
    btn.style.boxShadow   = '0 0 24px rgba(255,0,0,0.35)';
  }
}
function resetSubmitBtn() {
  const btn = document.getElementById('submitReceiptBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.style.background  = 'rgba(255,0,0,0.15)';
  btn.style.borderColor = 'rgba(255,0,0,0.3)';
  btn.style.color       = '#664a4a';
  btn.style.cursor      = 'not-allowed';
  btn.style.boxShadow   = 'none';
}

async function submitReceipt() {
  if (!_receiptB64 || !_payApp || !_payUser) return;
  try {
    await api.post('/payments', {
      appId:   _payApp.id,
      appName: _payApp.name,
      amount:  _payApp.price,
      receipt: _receiptB64,
    });
    showPayStep(3);
    renderApps();
  } catch (err) {
    showToast('Xato: ' + err.message, 'error');
  }
}
window.submitReceipt = submitReceipt;

/* ── Category label map ──────────────────────────────────── */
const CAT_LABELS = { security:'Xavfsizlik', network:'Tarmoq', utility:'Yordamchi', education:"Ta'lim", other:'Boshqa' };

/* ── Toggle description expand ───────────────────────────── */
window.toggleDesc = (id) => {
  const el  = document.getElementById('desc-' + id);
  const btn = document.getElementById('rdm-' + id);
  if (!el || !btn) return;
  const expanded = el.classList.toggle('expanded');
  btn.textContent = expanded ? 'Yig\'ish ↑' : 'Ko\'proq ↓';
};

/* ── Skeleton loaders ────────────────────────────────────── */
function showSkeletons(grid, n = 6) {
  grid.innerHTML = Array.from({ length: n }, () => `
    <div class="app-skeleton">
      <div class="sk-logo"></div>
      <div class="sk-line w80"></div>
      <div class="sk-line w60"></div>
      <div class="sk-line"></div>
      <div class="sk-btn"></div>
    </div>`).join('');
}

/* ── Render Apps ─────────────────────────────────────────── */
async function renderApps() {
  const grid = document.getElementById('appsGrid');
  if (!grid) return;

  showSkeletons(grid);

  try {
    const session = getSession();

    const [apps, approvedIds, myPayments] = await Promise.all([
      api.get('/apps').then(d => d || []),
      session ? api.get('/payments/approved').then(d => d || []) : Promise.resolve([]),
      session ? api.get('/payments/my').then(d => d || [])       : Promise.resolve([]),
    ]);

    window._appsCache = apps;

    if (apps.length === 0) {
      grid.innerHTML = `<div class="apps-empty"><p>Tez orada ilovalar qo'shiladi!</p></div>`;
      return;
    }

    const TG_URL   = 'https://t.me/IlovachiTexnoBot';
    const dlSvg    = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    const extSvg   = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
    const paySvg   = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>';
    const clockSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
    const tgSvg    = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.84 8.673c-.137.613-.5.76-1.016.473l-2.8-2.065-1.35 1.3c-.15.15-.275.275-.563.275l.2-2.8 5.15-4.65c.225-.2-.05-.312-.35-.112l-6.36 4.005-2.74-.856c-.6-.187-.612-.6.125-.888l10.7-4.125c.5-.187.937.112.775.888z"/></svg>';

    grid.innerHTML = apps.map(app => {
      const isFree    = !app.price || Number(app.price) <= 0;
      const approved  = approvedIds.includes(String(app.id));
      const canAccess = isFree || approved;
      const pending   = myPayments.some(p => String(p.appId) === String(app.id) && p.status === 'pending');

      const letter       = (app.name || '?')[0].toUpperCase();
      const safeIconUrl  = app.icon ? app.icon.replace(/"/g, '&quot;') : '';
      const iconFallback = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 72 72%27%3E%3Crect fill=%27%230d0202%27 width=%2772%27 height=%2772%27/%3E%3Ctext x=%2750%25%27 y=%2755%25%27 font-size=%2732%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27 fill=%27rgba(255,0,0,0.7)%27 font-family=%27monospace%27%3E' + letter + '%3C/text%3E%3C/svg%3E';

      /* Badge */
      let badge;
      if (isFree)        badge = '<span class="app-badge free"><span class="bdot"></span>BEPUL</span>';
      else if (approved) badge = '<span class="app-badge approved"><span class="bdot"></span>TASDIQLANGAN</span>';
      else if (pending)  badge = '<span class="app-badge pending"><span class="bdot"></span>TEKSHIRILMOQDA</span>';
      else               badge = '<span class="app-badge paid"><span class="bdot"></span>' + Number(app.price).toLocaleString() + ' UZS</span>';

      /* Action button */
      let actionBtn;
      if (canAccess) {
        if (app.link) {
          const sl = String(app.link).replace(/"/g, '&quot;');
          actionBtn = '<a href="' + sl + '" target="_blank" rel="noopener noreferrer" class="app-btn dl-btn">' + extSvg + ' Ochish</a>';
        } else if (app.fileId) {
          actionBtn = '<button type="button" class="app-btn dl-btn" data-appid="' + esc(String(app.id)) + '" data-fileid="' + esc(String(app.fileId)) + '" data-filename="' + esc(String(app.fileName || app.name || 'file')) + '" onclick="downloadAppFile(this.dataset.appid,this.dataset.fileid,this.dataset.filename)">' + dlSvg + ' Yuklab olish</button>';
        } else {
          actionBtn = '<a href="' + TG_URL + '" target="_blank" rel="noopener noreferrer" class="app-btn dl-btn">' + tgSvg + " Admin bilan bog'lanish</a>";
        }
      } else if (pending) {
        actionBtn = '<button type="button" class="app-btn pending-btn" disabled>' + clockSvg + ' Kutilmoqda...</button>';
      } else if (!session) {
        actionBtn = '<a href="login.html" class="app-btn pay-btn">' + paySvg + ' Kirish kerak</a>';
      } else {
        actionBtn = '<a href="' + TG_URL + '" target="_blank" rel="noopener noreferrer" class="app-btn pay-btn">' + tgSvg + " Admin bilan bog'lanish</a>";
      }

      /* Description read-more */
      const desc      = app.desc || '';
      const needsMore = desc.length > 110;
      const appIdStr  = String(app.id);
      const descHtml  = '<p class="app-desc" id="desc-' + appIdStr + '">' + esc(desc) + '</p>' +
        (needsMore ? '<button class="app-read-more" id="rdm-' + appIdStr + '" onclick="toggleDesc(\'' + appIdStr + '\')">Ko\'proq ↓</button>' : '');

      const catLabel = CAT_LABELS[app.category] || app.category || '';

      return '<div class="app-card' + (isFree ? ' free-card' : '') + '">' +
        '<div class="app-card-top">' +
          '<div class="app-logo">' +
            '<img src="' + (safeIconUrl || iconFallback) + '" alt="' + esc(app.name) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" />' +
            '<span class="app-logo-letter" style="display:none">' + letter + '</span>' +
          '</div>' +
          badge +
        '</div>' +
        '<h3 class="app-name">' + esc(app.name) + '</h3>' +
        (catLabel ? '<p class="app-category">' + esc(catLabel) + '</p>' : '') +
        '<div class="app-desc-wrap">' + descHtml + '</div>' +
        '<div class="app-divider"></div>' +
        actionBtn +
        '<a href="' + TG_URL + '" target="_blank" rel="noopener noreferrer" class="app-btn tg-btn">' + tgSvg + ' TELEGRAM ORQALI YOZISH</a>' +
        '</div>';
    }).join('');

  } catch (err) {
    grid.innerHTML = `<div class="apps-empty"><p style="color:#ff6b6b">Xato: ${err.message}</p></div>`;
  }
}

/* ── esc helper (local, for card HTML safety) ────────────── */
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('payModal');
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closePayModal(); });

  initUserMenu();
  renderApps();
});

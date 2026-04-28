"use strict";

const API_URL     = '/api';
const ADMIN_EMAIL = 'perdebaevadilbek586@gmail.com';

/* ── Simple cache ────────────────────────────────────────── */
const cache = {
  data: {},
  set(key, value, ttl = 30000) { // 30 seconds default
    this.data[key] = { value, expires: Date.now() + ttl };
  },
  get(key) {
    const item = this.data[key];
    if (!item) return null;
    if (Date.now() > item.expires) {
      delete this.data[key];
      return null;
    }
    return item.value;
  },
  clear() { this.data = {}; }
};

/* ── API client ──────────────────────────────────────────── */
const api = {
  _t: () => localStorage.getItem('kybers_token') || '',
  _h() { return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this._t()}` }; },
  async get(path, timeout = 30000, useCache = true) {
    // Check cache first
    if (useCache) {
      const cached = cache.get(path);
      if (cached) return cached;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const r = await fetch(API_URL + path, { 
        headers: this._h(),
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!r.ok) {
        const d = await r.json().catch(() => ({ message: 'Server error' }));
        throw new Error(d.message || 'Error');
      }
      
      const d = await r.json();
      
      // Cache successful response
      if (useCache) cache.set(path, d);
      
      return d;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Server javob bermadi. Iltimos, qayta urinib ko\'ring.');
      throw err;
    }
  },
  async post(path, body, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const r = await fetch(API_URL + path, { 
        method:'POST', 
        headers:this._h(), 
        body:JSON.stringify(body),
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!r.ok) {
        const d = await r.json().catch(() => ({ message: 'Server error' }));
        throw new Error(d.message || 'Error');
      }
      
      const d = await r.json();
      
      // Clear cache after mutation
      cache.clear();
      
      return d;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Server javob bermadi. Iltimos, qayta urinib ko\'ring.');
      throw err;
    }
  },
  async put(path, body={}, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const r = await fetch(API_URL + path, { 
        method:'PUT', 
        headers:this._h(), 
        body:JSON.stringify(body),
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!r.ok) {
        const d = await r.json().catch(() => ({ message: 'Server error' }));
        throw new Error(d.message || 'Error');
      }
      
      const d = await r.json();
      
      // Clear cache after mutation
      cache.clear();
      
      return d;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Server javob bermadi. Iltimos, qayta urinib ko\'ring.');
      throw err;
    }
  },
  async del(path, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const r = await fetch(API_URL + path, { 
        method:'DELETE', 
        headers:this._h(),
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!r.ok) {
        const d = await r.json().catch(() => ({ message: 'Server error' }));
        throw new Error(d.message || 'Error');
      }
      
      const d = await r.json();
      
      // Clear cache after mutation
      cache.clear();
      
      return d;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Server javob bermadi. Iltimos, qayta urinib ko\'ring.');
      throw err;
    }
  },
};

/* ── IndexedDB for app file storage ──────────────────────── */
const fileDB = {
  _db: null,
  async init() {
    if (this._db) return;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('kybers_files_v1', 1);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains('files'))
          d.createObjectStore('files', { keyPath: 'id' });
      };
      req.onsuccess = e => { this._db = e.target.result; resolve(); };
      req.onerror   = () => reject(req.error);
    });
  },
  async save(id, name, type, buffer) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('files', 'readwrite');
      tx.objectStore('files').put({ id, name, type, buffer, savedAt: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror    = () => reject(tx.error);
    });
  },
  async get(id) {
    return new Promise((resolve, reject) => {
      const tx  = this._db.transaction('files', 'readonly');
      const req = tx.objectStore('files').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  },
  async del(id) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('files', 'readwrite');
      tx.objectStore('files').delete(id);
      tx.oncomplete = resolve;
      tx.onerror    = () => reject(tx.error);
    });
  },
};

/* ── Upload state (per modal session) ───────────────────── */
let _iconBase64 = null;
let _fileBuffer = null;
let _fileName   = '';
let _fileType   = '';
let _fileId     = null;
let _existingFileName = '';

/* ── File helpers ────────────────────────────────────────── */
function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = e => resolve(e.target.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function readAsBuffer(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = e => resolve(e.target.result);
    r.onerror = reject;
    r.readAsArrayBuffer(file);
  });
}
function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/* ── Zone render helpers ─────────────────────────────────── */
function renderIconPreview(base64) {
  const z = document.getElementById('iconZone');
  if (!z) return;
  z.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;width:100%;padding:2px 0">
      <img src="${base64}" style="width:56px;height:56px;border-radius:12px;object-fit:cover;border:1px solid var(--border);flex-shrink:0" />
      <div>
        <div style="font-family:var(--font-display);font-size:0.65rem;letter-spacing:0.1em;text-transform:uppercase;color:#00c864;margin-bottom:6px">✓ Rasm yuklandi</div>
        <button type="button" class="btn-sm btn-delete" style="font-size:0.6rem;padding:4px 10px" onclick="clearIconUpload()">O'chirish</button>
      </div>
    </div>`;
  z.classList.add('has-file');
}
function renderIconPlaceholder() {
  const z = document.getElementById('iconZone');
  if (!z) return;
  z.innerHTML = `
    <div class="upload-zone-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    </div>
    <div class="upload-zone-text">Rasm yuklash</div>
    <div class="upload-zone-hint">Drag &amp; drop &middot; Bosing &middot; <kbd>Ctrl+V</kbd></div>`;
  z.classList.remove('has-file');
}
function renderFileInfo(name, size) {
  const z = document.getElementById('fileZone');
  if (!z) return;
  z.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;width:100%;padding:2px 0">
      <div style="width:40px;height:40px;background:rgba(255,0,0,0.1);border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" stroke-width="1.8" width="20" height="20">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name)}</div>
        ${size ? `<div style="font-size:0.72rem;color:var(--text-muted)">${fmtSize(size)}</div>` : '<div style="font-size:0.72rem;color:#00c864">Mavjud fayl</div>'}
      </div>
      <button type="button" class="btn-sm btn-delete" style="font-size:0.6rem;padding:4px 10px;flex-shrink:0" onclick="clearFileUpload()">O'chirish</button>
    </div>`;
  z.classList.add('has-file');
}
function renderFilePlaceholder() {
  const z = document.getElementById('fileZone');
  if (!z) return;
  z.innerHTML = `
    <div class="upload-zone-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    </div>
    <div class="upload-zone-text">Fayl yuklash</div>
    <div class="upload-zone-hint">Drag &amp; drop &middot; Bosing (APK, EXE, ZIP...)</div>`;
  z.classList.remove('has-file');
}

window.clearIconUpload = () => { _iconBase64 = null; renderIconPlaceholder(); };
window.clearFileUpload = () => {
  _fileBuffer = null; _fileName = ''; _fileType = ''; _fileId = null; _existingFileName = '';
  renderFilePlaceholder();
};

/* ── Drag & drop helper ──────────────────────────────────── */
function makeDrop(zone, onFile) {
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  });
}

/* ── Upload zones init ───────────────────────────────────── */
function initUploadZones() {
  const iconZone      = document.getElementById('iconZone');
  const iconFileInput = document.getElementById('iconFileInput');
  const fileZone      = document.getElementById('fileZone');
  const appFileInput  = document.getElementById('appFileInput');

  if (iconZone && iconFileInput) {
    iconZone.addEventListener('click', () => {
      if (!iconZone.classList.contains('has-file')) iconFileInput.click();
    });
    iconFileInput.addEventListener('change', async () => {
      const f = iconFileInput.files[0];
      if (!f || !f.type.startsWith('image/')) return;
      _iconBase64 = await readAsBase64(f);
      renderIconPreview(_iconBase64);
      iconFileInput.value = '';
    });
    makeDrop(iconZone, async (f) => {
      if (!f.type.startsWith('image/')) return;
      _iconBase64 = await readAsBase64(f);
      renderIconPreview(_iconBase64);
    });
  }

  if (fileZone && appFileInput) {
    fileZone.addEventListener('click', () => {
      if (!fileZone.classList.contains('has-file')) appFileInput.click();
    });
    appFileInput.addEventListener('change', async () => {
      const f = appFileInput.files[0];
      if (!f) return;
      _fileBuffer = await readAsBuffer(f);
      _fileName   = f.name;
      _fileType   = f.type;
      renderFileInfo(f.name, f.size);
      appFileInput.value = '';
    });
    makeDrop(fileZone, async (f) => {
      _fileBuffer = await readAsBuffer(f);
      _fileName   = f.name;
      _fileType   = f.type;
      renderFileInfo(f.name, f.size);
    });
  }
}

/* ── Clipboard paste ─────────────────────────────────────── */
function initClipboardPaste() {
  document.addEventListener('paste', async (e) => {
    const modal = document.getElementById('appModal');
    if (!modal?.classList.contains('active')) return;
    for (const item of (e.clipboardData?.items || [])) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (!f) continue;
        _iconBase64 = await readAsBase64(f);
        renderIconPreview(_iconBase64);
        break;
      }
    }
  });
}

/* ── Auth guard ──────────────────────────────────────────── */
function checkAdmin() {
  const s = JSON.parse(localStorage.getItem('kybers_session') || 'null');
  if (!s || s.email !== ADMIN_EMAIL) {
    window.location.href = '../index.html';
    return null;
  }
  return s;
}

/* ── Clock ───────────────────────────────────────────────── */
function startClock() {
  const el = document.getElementById('headerTime');
  if (!el) return;
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const now = new Date();
    el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}  ${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}`;
  };
  tick();
  setInterval(tick, 1000);
}

/* ── Navigation ──────────────────────────────────────────── */
function initNav() {
  document.querySelectorAll('.sidebar-link[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('section-' + btn.dataset.section)?.classList.add('active');
      closeSidebar();
      const fn = {
        dashboard: renderDashboard,
        apps:      renderApps,
        users:     renderUsers,
        payments:  () => renderPayments(),
        messages:  () => renderMessages(),
      };
      fn[btn.dataset.section]?.();
    });
  });
}

/* ── Mobile sidebar toggle ───────────────────────────────── */
function initSidebarToggle() {
  const toggle  = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  toggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay?.addEventListener('click', closeSidebar);
}
function closeSidebar() {
  document.getElementById('adminSidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('show');
}

/* ── Sidebar user ────────────────────────────────────────── */
function initSidebarUser(session) {
  const av = document.getElementById('sidebarAvatar');
  const nm = document.getElementById('sidebarName');
  if (av) av.textContent = session.name.charAt(0).toUpperCase();
  if (nm) nm.textContent = session.name;
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('kybers_session');
    localStorage.removeItem('kybers_token');
    window.location.href = '../index.html';
  });
}

/* ── Badges ──────────────────────────────────────────────── */
async function loadBadges() {
  try {
    const [payments, messages, usersResp] = await Promise.all([
      api.get('/payments').catch(() => []),
      api.get('/messages').catch(() => []),
      api.get('/admin/users').catch(() => ({ users: [] })),
    ]);
    const users       = usersResp.users || [];
    const seenCount   = parseInt(localStorage.getItem('kybers_users_seen') || '0', 10);
    setBadge('pendingBadge',  payments.filter(p => p.status === 'pending').length);
    setBadge('messagesBadge', messages.filter(m => m.status === 'unread').length);
    setBadge('newUsersBadge', Math.max(0, users.length - seenCount));
  } catch (_) {}
}
function setBadge(id, n) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent   = n;
  el.style.display = n > 0 ? 'inline-flex' : 'none';
}

/* ═══ DASHBOARD ════════════════════════════════════════════ */
async function renderDashboard() {
  setLoading('dashUsersBody', 5);
  try {
    const [appsData, paymentsData, messagesData, usersResp] = await Promise.all([
      api.get('/apps'),
      api.get('/payments'),
      api.get('/messages'),
      api.get('/admin/users'),
    ]);
    const users = usersResp.users || [];
    setText('dashUsers',    users.length);
    setText('dashApps',     appsData.length);
    setText('dashPending',  paymentsData.filter(p => p.status === 'pending').length);
    setText('dashApproved', paymentsData.filter(p => p.status === 'approved').length);
    setText('dashMessages', messagesData.filter(m => m.status === 'unread').length);

    const tbody = document.getElementById('dashUsersBody');
    if (!tbody) return;
    const recent = [...users].slice(0, 8);
    tbody.innerHTML = recent.length
      ? recent.map((u, i) => `
        <tr>
          <td data-label="#">${i + 1}</td>
          <td data-label="Ism">${esc(u.name)}</td>
          <td data-label="Email">${esc(u.email)}</td>
          <td data-label="Sana">${fmtDate(u.createdAt)}</td>
          <td data-label="Rol">${u.email === ADMIN_EMAIL
            ? '<span class="badge badge-admin">Admin</span>'
            : '<span class="badge badge-user">Foydalanuvchi</span>'}</td>
        </tr>`).join('')
      : emptyRow(5, "Hali foydalanuvchilar yo'q");
  } catch (err) {
    showErr('dashUsersBody', 5, err.message);
  }
}

/* ═══ APPS ═════════════════════════════════════════════════ */
async function renderApps() {
  setLoading('appsTableBody', 7);
  try {
    const apps  = await api.get('/apps', 30000, false); // No cache, 30s timeout
    const tbody = document.getElementById('appsTableBody');
    if (!tbody) return;
    
    if (!apps || apps.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">${emptyHtml("Hali ilovalar qo'shilmagan")}</td></tr>`;
      return;
    }
    
    tbody.innerHTML = apps.map((app, i) => `
      <tr>
        <td data-label="#">${i + 1}</td>
        <td data-label="Ilova">
          <div class="app-icon-cell">
            ${app.icon
              ? `<img src="${esc(app.icon)}" alt="${esc(app.name)}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div class="app-icon-fallback" style="display:none">${esc(app.name.charAt(0))}</div>`
              : `<div class="app-icon-fallback">${esc(app.name.charAt(0))}</div>`}
            <strong>${esc(app.name)}</strong>
          </div>
        </td>
        <td data-label="Tavsif" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(app.desc || '')}</td>
        <td data-label="Kategoriya">${catLabel(app.category)}</td>
        <td data-label="Narx">${app.price > 0
          ? `<span class="badge badge-paid">${fmtNum(app.price)} UZS</span>`
          : '<span class="badge badge-free">Bepul</span>'}</td>
        <td data-label="Havola" style="font-size:0.75rem;color:var(--text-muted)">
          ${app.fileId ? '📁 Fayl' : app.link ? '🔗 URL' : '—'}
        </td>
        <td data-label="Amal">
          <div class="actions-cell">
            <button type="button" class="btn-sm btn-edit"   onclick="openEditApp('${app.id}')">Tahrirlash</button>
            <button type="button" class="btn-sm btn-delete" onclick="deleteApp('${app.id}')">O'chirish</button>
          </div>
        </td>
      </tr>`).join('');
  } catch (err) {
    console.error('Apps render error:', err);
    showErr('appsTableBody', 7, err.message || 'Xatolik yuz berdi');
  }
}

/* ─ App modal ───────────────────────────────────────────── */
function openAppModal(app) {
  _iconBase64 = null; _fileBuffer = null; _fileName = ''; _fileType = ''; _fileId = null; _existingFileName = '';
  document.getElementById('appModalTitle').textContent = app ? 'Ilovani tahrirlash' : "Ilova qo'shish";
  document.getElementById('appId').value          = app?.id          ?? '';
  document.getElementById('appName').value        = app?.name        ?? '';
  document.getElementById('appDesc').value        = app?.desc        ?? '';
  document.getElementById('appIconUrl').value     = (app?.icon && !app.icon.startsWith('data:')) ? app.icon : '';
  document.getElementById('appLink').value        = app?.link        ?? '';
  document.getElementById('appPrice').value       = app?.price       ?? 0;
  document.getElementById('appCategory').value    = app?.category    ?? 'other';
  document.getElementById('appPaymentInfo').value = app?.paymentInfo ?? '';

  if (app?.icon?.startsWith('data:')) { _iconBase64 = app.icon; renderIconPreview(app.icon); }
  else renderIconPlaceholder();

  if (app?.fileId) { _fileId = app.fileId; _existingFileName = app.fileName ?? ''; renderFileInfo(app.fileName || 'Saqlangan fayl', 0); }
  else renderFilePlaceholder();

  document.getElementById('appModal').classList.add('active');
}
function closeAppModal() { document.getElementById('appModal').classList.remove('active'); }

window.openEditApp = async (id) => {
  try {
    const apps = await api.get('/apps');
    const app  = apps.find(a => a.id === id);
    if (app) openAppModal(app);
  } catch (_) {}
};

window.deleteApp = async (id) => {
  if (!confirm("Bu ilovani o'chirmoqchimisiz?")) return;
  try {
    const apps = await api.get('/apps');
    const app  = apps.find(a => a.id === id);
    if (app?.fileId) { try { await fileDB.del(app.fileId); } catch (_) {} }
    await api.del(`/apps/${id}`);
    renderApps();
    loadBadges();
  } catch (err) {
    alert('Xato: ' + err.message);
  }
};

function initAppModal() {
  document.getElementById('btnAddApp')?.addEventListener('click',       () => openAppModal(null));
  document.getElementById('appModalClose')?.addEventListener('click',   closeAppModal);
  document.getElementById('appModalCancel')?.addEventListener('click',  closeAppModal);
  document.getElementById('appModalOverlay')?.addEventListener('click', closeAppModal);

  document.getElementById('appForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id   = document.getElementById('appId').value;
    const iconUrl   = document.getElementById('appIconUrl').value.trim();
    const finalIcon = _iconBase64 || iconUrl || '';

    let finalFileId   = null;
    let finalFileName = '';

    if (_fileBuffer) {
      const newId = 'f_' + Date.now();
      await fileDB.save(newId, _fileName, _fileType, _fileBuffer);
      if (id) {
        try {
          const apps = await api.get('/apps');
          const old  = apps.find(a => a.id === id);
          if (old?.fileId) await fileDB.del(old.fileId);
        } catch (_) {}
      }
      finalFileId   = newId;
      finalFileName = _fileName;
    } else if (_fileId) {
      finalFileId   = _fileId;
      finalFileName = _existingFileName;
    } else if (id) {
      try {
        const apps = await api.get('/apps');
        const old  = apps.find(a => a.id === id);
        if (old?.fileId) await fileDB.del(old.fileId);
      } catch (_) {}
    }

    const entry = {
      id:          id || Date.now().toString(),
      name:        document.getElementById('appName').value.trim(),
      desc:        document.getElementById('appDesc').value.trim(),
      icon:        finalIcon,
      fileId:      finalFileId,
      fileName:    finalFileName,
      link:        document.getElementById('appLink').value.trim(),
      price:       parseInt(document.getElementById('appPrice').value) || 0,
      category:    document.getElementById('appCategory').value,
      paymentInfo: document.getElementById('appPaymentInfo').value.trim(),
    };

    try {
      if (id) await api.put(`/apps/${id}`, entry);
      else    await api.post('/apps', entry);
      closeAppModal();
      renderApps();
    } catch (err) {
      alert('Saqlashda xato: ' + err.message);
    }
  });
}

/* ═══ USERS ════════════════════════════════════════════════ */
async function renderUsers(filter = '') {
  setLoading('usersTableBody', 5);
  try {
    const data = await api.get('/admin/users', 30000, false); // No cache, 30s timeout
    const allUsers = data.users || [];
    
    localStorage.setItem('kybers_users_seen', String(allUsers.length));
    setBadge('newUsersBadge', 0);

    let users = allUsers;
    if (filter) users = users.filter(u =>
      u.name.toLowerCase().includes(filter) || u.email.toLowerCase().includes(filter));

    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">${emptyHtml("Foydalanuvchilar yo'q")}</td></tr>`;
      return;
    }
    
    tbody.innerHTML = users.map((u, i) => `
      <tr>
        <td data-label="#">${i + 1}</td>
        <td data-label="Ism">${esc(u.name)}</td>
        <td data-label="Email">${esc(u.email)}</td>
        <td data-label="Sana">${fmtDate(u.createdAt)}</td>
        <td data-label="Rol">${u.email === ADMIN_EMAIL
          ? '<span class="badge badge-admin">Admin</span>'
          : '<span class="badge badge-user">Foydalanuvchi</span>'}</td>
      </tr>`).join('');
  } catch (err) {
    console.error('Users render error:', err);
    showErr('usersTableBody', 5, err.message || 'Xatolik yuz berdi');
  }
}

function initUserSearch() {
  document.getElementById('userSearch')?.addEventListener('input', e =>
    renderUsers(e.target.value.toLowerCase().trim()));
}

/* ═══ PAYMENTS ═════════════════════════════════════════════ */
async function renderPayments(filter = 'pending') {
  setLoading('paymentsTableBody', 8);
  try {
    let payments = await api.get('/payments');
    if (filter !== 'all') payments = payments.filter(p => p.status === filter);

    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    tbody.innerHTML = payments.length
      ? payments.map((p, i) => `
        <tr>
          <td data-label="#">${i + 1}</td>
          <td data-label="Foydalanuvchi">
            <div style="font-weight:600;color:var(--text-primary)">${esc(p.userName)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted)">${esc(p.userEmail)}</div>
          </td>
          <td data-label="Ilova">${esc(p.appName)}</td>
          <td data-label="Summa" style="color:var(--neon);font-family:var(--font-display);font-size:0.8rem">
            ${p.amount > 0 ? fmtNum(p.amount) + ' UZS' : 'Bepul'}
          </td>
          <td data-label="Chek">
            <button type="button" class="btn-sm btn-edit" style="font-size:0.6rem" onclick="viewReceipt('${p.id}')">Ko'rish</button>
          </td>
          <td data-label="Sana" style="font-size:0.75rem;color:var(--text-muted)">${fmtDate(p.createdAt)}</td>
          <td data-label="Holat">${statusBadge(p.status)}</td>
          <td data-label="Amal">
            <div class="actions-cell">
              ${p.status === 'pending' ? `
                <button type="button" class="btn-sm btn-approve" onclick="approvePayment('${p.id}')">Tasdiqlash</button>
                <button type="button" class="btn-sm btn-deny"    onclick="denyPayment('${p.id}')">Rad etish</button>` : '—'}
            </div>
          </td>
        </tr>`).join('')
      : `<tr><td colspan="8">${emptyHtml("To'lovlar yo'q")}</td></tr>`;
  } catch (err) {
    showErr('paymentsTableBody', 8, err.message);
  }
}

window.approvePayment = async (id) => {
  try {
    await api.put(`/payments/${id}/approve`);
    const f = document.getElementById('paymentFilter')?.value || 'pending';
    renderPayments(f);
    loadBadges();
  } catch (err) { alert('Xato: ' + err.message); }
};

window.denyPayment = async (id) => {
  try {
    await api.put(`/payments/${id}/deny`);
    const f = document.getElementById('paymentFilter')?.value || 'pending';
    renderPayments(f);
    loadBadges();
  } catch (err) { alert('Xato: ' + err.message); }
};

window.viewReceipt = async (id) => {
  try {
    const payments = await api.get('/payments');
    const p = payments.find(x => x.id === id);
    if (!p) return;
    const isImg = p.receipt &&
      (p.receipt.startsWith('data:image') || /\.(png|jpg|jpeg|gif|webp)$/i.test(p.receipt));
    document.getElementById('receiptDetails').innerHTML = `
      <div style="margin-bottom:16px">
        <div style="font-size:0.7rem;color:var(--text-muted);font-family:var(--font-display);letter-spacing:0.1em;margin-bottom:4px">FOYDALANUVCHI</div>
        <div style="color:var(--text-primary);font-weight:600">${esc(p.userName)} — ${esc(p.userEmail)}</div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:0.7rem;color:var(--text-muted);font-family:var(--font-display);letter-spacing:0.1em;margin-bottom:4px">ILOVA / SUMMA</div>
        <div style="color:var(--neon);font-family:var(--font-display);font-size:0.9rem">
          ${esc(p.appName)} — ${p.amount > 0 ? fmtNum(p.amount) + ' UZS' : 'Bepul'}
        </div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:0.7rem;color:var(--text-muted);font-family:var(--font-display);letter-spacing:0.1em;margin-bottom:8px">CHEK</div>
        ${isImg
          ? `<img src="${esc(p.receipt)}" class="receipt-img" />`
          : `<div class="receipt-full">${esc(p.receipt)}</div>`}
      </div>
      ${p.status === 'pending' ? `
        <div style="display:flex;gap:12px;margin-top:20px">
          <button type="button" class="btn-sm btn-approve" style="flex:1;padding:12px"
            onclick="approvePayment('${p.id}');closeReceiptModal()">Tasdiqlash</button>
          <button type="button" class="btn-sm btn-deny" style="flex:1;padding:12px"
            onclick="denyPayment('${p.id}');closeReceiptModal()">Rad etish</button>
        </div>` : `<div style="text-align:center;margin-top:12px">${statusBadge(p.status)}</div>`}
    `;
    document.getElementById('receiptModal').classList.add('active');
  } catch (err) { alert('Xato: ' + err.message); }
};

window.closeReceiptModal = () => document.getElementById('receiptModal').classList.remove('active');

function initReceiptModal() {
  document.getElementById('receiptModalClose')?.addEventListener('click',   closeReceiptModal);
  document.getElementById('receiptModalOverlay')?.addEventListener('click', closeReceiptModal);
}

function initPaymentFilter() {
  document.getElementById('paymentFilter')?.addEventListener('change', e =>
    renderPayments(e.target.value));
}

/* ═══ MESSAGES ═════════════════════════════════════════════ */
async function renderMessages(filter = 'unread') {
  setLoading('messagesTableBody', 8);
  try {
    let msgs = await api.get('/messages');
    if (filter !== 'all') msgs = msgs.filter(m => m.status === filter);

    const tbody = document.getElementById('messagesTableBody');
    if (!tbody) return;
    tbody.innerHTML = msgs.length
      ? msgs.map((m, i) => `
        <tr style="${m.status === 'unread' ? 'background:rgba(255,0,0,0.04)' : ''}">
          <td data-label="#">${i + 1}</td>
          <td data-label="Ism" style="font-weight:600;color:var(--text-primary)">${esc(m.name)}</td>
          <td data-label="Telefon">${esc(m.phone)}</td>
          <td data-label="Email" style="font-size:0.8rem;color:var(--text-muted)">${esc(m.email)}</td>
          <td data-label="Xabar" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
              title="${esc(m.message)}">${esc(m.message)}</td>
          <td data-label="Sana" style="font-size:0.75rem;color:var(--text-muted)">${fmtDate(m.createdAt)}</td>
          <td data-label="Holat">${m.status === 'unread'
            ? '<span class="badge badge-pending"><span class="dot"></span>O\'qilmagan</span>'
            : '<span class="badge badge-approved"><span class="dot"></span>O\'qilgan</span>'}</td>
          <td data-label="Amal">
            ${m.status === 'unread'
              ? `<button type="button" class="btn-sm btn-approve" onclick="markMessageRead('${m.id}')">O'qildi</button>`
              : '—'}
          </td>
        </tr>`).join('')
      : `<tr><td colspan="8">${emptyHtml("Murojaatlar yo'q")}</td></tr>`;
  } catch (err) {
    showErr('messagesTableBody', 8, err.message);
  }
}

window.markMessageRead = async (id) => {
  try {
    await api.put(`/messages/${id}/read`);
    const f = document.getElementById('messageFilter')?.value || 'unread';
    renderMessages(f);
    loadBadges();
  } catch (err) { alert('Xato: ' + err.message); }
};

function initMessageFilter() {
  document.getElementById('messageFilter')?.addEventListener('change', e =>
    renderMessages(e.target.value));
}

/* ═══ HELPERS ══════════════════════════════════════════════ */
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function setLoading(tbodyId, cols) {
  const el = document.getElementById(tbodyId);
  if (el) el.innerHTML = `<tr><td colspan="${cols}"><div class="empty-state" style="padding:20px"><div class="loading-spinner"></div><p style="color:var(--text-muted);font-size:0.85rem;margin:0">Yuklanmoqda...</p></div></td></tr>`;
}
function showErr(tbodyId, cols, msg) {
  const el = document.getElementById(tbodyId);
  if (el) el.innerHTML = `<tr><td colspan="${cols}"><div class="empty-state" style="padding:30px 20px">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" style="margin:0 auto 16px;display:block;opacity:0.7">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <p style="color:#ff6b6b;font-size:0.95rem;margin-bottom:8px;font-weight:600">Xato yuz berdi</p>
    <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:16px">${esc(msg)}</p>
    <button type="button" class="btn-sm btn-primary" onclick="location.reload()" style="margin:0 auto;display:block">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 4 23 10 17 10"/>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
      Qayta yuklash
    </button>
  </div></td></tr>`;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uz-UZ', { year:'numeric', month:'short', day:'numeric' });
}
function fmtNum(n) { return Number(n).toLocaleString('uz-UZ'); }
function catLabel(cat) {
  return { security:'Xavfsizlik', network:'Tarmoq', utility:'Yordamchi', education:"Ta'lim", other:'Boshqa' }[cat] || cat || '—';
}
function statusBadge(status) {
  const map = { pending:{cls:'pending',label:'Kutilmoqda'}, approved:{cls:'approved',label:'Tasdiqlangan'}, denied:{cls:'denied',label:'Rad etilgan'} };
  const s = map[status] || {cls:'pending',label:status};
  return `<span class="badge badge-${s.cls}"><span class="dot"></span>${s.label}</span>`;
}
function emptyHtml(msg) { return `<div class="empty-state"><p>${msg}</p></div>`; }
function emptyRow(cols, msg) { return `<tr><td colspan="${cols}">${emptyHtml(msg)}</td></tr>`; }

/* ═══ INIT ══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  const session = checkAdmin();
  if (!session) return;

  // Check server health
  try {
    const health = await fetch(`${API_URL}/health`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json()).catch(() => null);
    
    if (!health) {
      console.warn('⚠️ Server ishlamayapti. Iltimos, serverni ishga tushiring.');
      showToast('Server ishlamayapti. Iltimos, serverni ishga tushiring.', 'error');
    } else {
      console.log('✅ Server ishlayapti:', health);
    }
  } catch (err) {
    console.warn('⚠️ Server tekshirishda xato:', err);
  }

  await fileDB.init();

  startClock();
  initSidebarUser(session);
  initSidebarToggle();
  initNav();
  initUploadZones();
  initClipboardPaste();
  initAppModal();
  initUserSearch();
  initPaymentFilter();
  initReceiptModal();
  initMessageFilter();

  renderDashboard();
  loadBadges();
});

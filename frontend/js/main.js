"use strict";

const API_URL    = '/api';
const ADMIN_EMAIL = 'perdebaevadilbek586@gmail.com';

/* ── Session helpers ──────────────────────────────────────── */
function getSession() { return JSON.parse(localStorage.getItem('kybers_session') || 'null'); }
function getToken()   { return localStorage.getItem('kybers_token') || null; }

async function apiPost(endpoint, body) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

/* ── SVG Icons ────────────────────────────────────────────── */
const ICONS = {
  shield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  zap:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  cpu:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="6" height="6"/><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/></svg>`,
  lock:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  check:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>`,
  arrow:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
};

/* ── Navbar scroll ────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ── User menu ────────────────────────────────────────────── */
function initUserMenu() {
  const loginBtn     = document.getElementById('loginBtn');
  const userMenu     = document.getElementById('userMenu');
  const userAvatarBtn = document.getElementById('userAvatarBtn');
  const userDropdown  = document.getElementById('userDropdown');
  const logoutBtn    = document.getElementById('logoutBtn');
  const chevron      = userAvatarBtn?.querySelector('.chevron-icon');

  const session = getSession();

  if (session) {
    const isAdmin = session.isAdmin || session.email === ADMIN_EMAIL;

    /* Kirish tugmasini yashir, profilni ko'rsat */
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';

    /* Avatar */
    const letter = session.name ? session.name.charAt(0).toUpperCase() : '?';
    const avatarEl = document.getElementById('userAvatarLetter');
    if (avatarEl) avatarEl.textContent = letter;

    /* Dropdown ma'lumotlari */
    const dnName  = document.getElementById('dropdownName');
    const dnEmail = document.getElementById('dropdownEmail');
    if (dnName)  dnName.textContent  = session.name  || '';
    if (dnEmail) dnEmail.textContent = session.email || '';

    /* Admin / User badge */
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

    /* Dropdown ochish/yopish */
    if (userAvatarBtn) {
      userAvatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = userDropdown.classList.toggle('show');
        if (chevron) chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
      });
    }

    document.addEventListener('click', () => {
      userDropdown?.classList.remove('show');
      if (chevron) chevron.style.transform = '';
    });

    /* Chiqish */
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('kybers_token');
        localStorage.removeItem('kybers_session');
        window.location.reload();
      });
    }
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (userMenu) userMenu.style.display = 'none';
  }
}

/* ── Particles ────────────────────────────────────────────── */
function initParticles() {
  const wrap = document.getElementById('heroParticles');
  if (!wrap) return;
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left              = Math.random() * 100 + '%';
    p.style.width             = (Math.random() * 2 + 1) + 'px';
    p.style.height            = p.style.width;
    p.style.animationDuration = (Math.random() * 12 + 8) + 's';
    p.style.animationDelay    = (Math.random() * 8) + 's';
    p.style.opacity           = String(Math.random() * 0.6 + 0.2);
    wrap.appendChild(p);
  }
}

/* ── Counter ──────────────────────────────────────────────── */
function animateCounter(el, target, duration = 1800) {
  const start  = performance.now();
  const suffix = el.dataset.suffix || '';
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

let countersStarted = false;
function startCounters() {
  document.querySelectorAll('.stat-value[data-target]').forEach(el => {
    animateCounter(el, parseInt(el.dataset.target, 10));
  });
}

/* ── Services ─────────────────────────────────────────────── */
async function renderServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  let topApps = [];
  try {
    const data = await fetch(`${API_URL}/apps`).then(r => r.ok ? r.json() : []);
    topApps = (data || []).slice(0, 6);
  } catch (_) {}

  if (topApps.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:60px 20px;">Tez orada ilovalar qo\'shiladi!</p>';
    return;
  }

  grid.innerHTML = topApps.map((app, i) => {
    const safeName = (app.name || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const safeDesc = (app.desc || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const safeIcon = app.icon ? app.icon.replace(/'/g, '%27').replace(/"/g, '%22') : '';
    
    return `
    <div class="service-card reveal delay-${(i % 3) + 1}">
      <div class="service-icon app-icon-small">
        ${safeIcon ? `<img src="${safeIcon}" alt="${safeName}" onerror="this.style.display='none'" />` : ''}
      </div>
      <h3 class="service-title">${safeName}</h3>
      <p class="service-desc">${safeDesc}</p>
      <a href="./pages/apps.html" class="service-arrow">${ICONS.arrow} Batafsil</a>
    </div>
  `;
  }).join('');

  initScrollReveal();
}

/* ── Scroll Reveal ────────────────────────────────────────── */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
      if (entry.target.closest('#stats') && !countersStarted) {
        countersStarted = true;
        setTimeout(startCounters, 200);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
}

/* ── Contact Form ─────────────────────────────────────────── */
function initContactForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  const btn     = document.getElementById('submitBtn');
  if (!form) return;

  const showErr = (id, msg) => {
    const input = document.getElementById(id);
    const err   = document.getElementById(id + 'Error');
    if (input) input.classList.add('error');
    if (err)   { err.textContent = msg; err.classList.add('visible'); }
  };
  const clearErrs = () => {
    form.querySelectorAll('.form-input,.form-textarea').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrs();
    let valid = true;
    const name  = document.getElementById('inputName');
    const phone = document.getElementById('inputPhone');
    const email = document.getElementById('inputEmail');
    const msg   = document.getElementById('inputMsg');

    if (!name.value.trim() || name.value.trim().length < 2)
      { showErr('inputName', 'Ism kamida 2 ta harf bo\'lishi kerak'); valid = false; }
    if (!phone.value.trim() || !/^[\+\d\s\(\)-]{7,20}$/.test(phone.value.trim()))
      { showErr('inputPhone', 'To\'g\'ri telefon raqam kiriting'); valid = false; }
    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
      { showErr('inputEmail', 'To\'g\'ri email manzil kiriting'); valid = false; }
    if (!msg.value.trim() || msg.value.trim().length < 10)
      { showErr('inputMsg', 'Xabar kamida 10 ta belgi bo\'lishi kerak'); valid = false; }

    if (!valid) return;
    btn.classList.add('loading');
    btn.disabled = true;
    await new Promise(r => setTimeout(r, 1800));

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    name.value.trim(),
          phone:   phone.value.trim(),
          email:   email.value.trim(),
          message: msg.value.trim(),
        }),
      });
    } catch (_) {}

    btn.classList.remove('loading');
    form.style.display = 'none';
    success.classList.add('visible');
  });

  form.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('error');
      const err = document.getElementById(el.id + 'Error');
      if (err) err.classList.remove('visible');
    });
  });
}

/* ── Smooth Scroll ────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initUserMenu();
  initParticles();
  renderServices();
  initScrollReveal();
  initContactForm();
  initSmoothScroll();
});

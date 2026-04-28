/* ============================================================
   KYBERS.OS — Authentication JavaScript
   ============================================================ */

const API_URL = '/api/auth';

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = toast.querySelector('.toast-message');
  
  toast.className = `toast ${type}`;
  toastMessage.textContent = message;
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Toggle password visibility
function initPasswordToggle() {
  const toggleButtons = document.querySelectorAll('.toggle-password');
  
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      const type = input.type === 'password' ? 'text' : 'password';
      input.type = type;
      
      btn.innerHTML = type === 'password' 
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    });
  });
}

// Validate email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Clear errors
function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
}

// Show error
function showError(fieldId, message) {
  const errorEl = document.getElementById(`${fieldId}Error`);
  const inputEl = document.getElementById(fieldId);
  
  if (errorEl) errorEl.textContent = message;
  if (inputEl) inputEl.classList.add('error');
}

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember')?.checked || false;
    const submitBtn = document.getElementById('submitBtn');
    
    // Validation
    if (!email) {
      showError('email', 'Email kiriting');
      return;
    }
    
    if (!validateEmail(email)) {
      showError('email', 'Email formati noto\'g\'ri');
      return;
    }
    
    if (!password) {
      showError('password', 'Parol kiriting');
      return;
    }
    
    if (password.length < 6) {
      showError('password', 'Parol kamida 6 belgidan iborat bo\'lishi kerak');
      return;
    }
    
    // Submit
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, remember }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        localStorage.setItem('kybers_token', data.token);
        localStorage.setItem('kybers_session', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          isAdmin: data.user.isAdmin || false
        }));

        showToast('Muvaffaqiyatli kirdingiz!', 'success');

        setTimeout(() => {
          window.location.href = data.user.isAdmin ? 'admin.html' : 'apps.html';
        }, 1000);
      } else {
        showToast(data.message || 'Xatolik yuz berdi', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Server bilan ulanib bo\'lmadi', 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
}

// Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.getElementById('submitBtn');
    
    // Validation
    if (!name) {
      showError('name', 'Ism kiriting');
      return;
    }
    
    if (name.length < 2) {
      showError('name', 'Ism kamida 2 belgidan iborat bo\'lishi kerak');
      return;
    }
    
    if (!email) {
      showError('email', 'Email kiriting');
      return;
    }
    
    if (!validateEmail(email)) {
      showError('email', 'Email formati noto\'g\'ri');
      return;
    }
    
    if (!password) {
      showError('password', 'Parol kiriting');
      return;
    }
    
    if (password.length < 6) {
      showError('password', 'Parol kamida 6 belgidan iborat bo\'lishi kerak');
      return;
    }
    
    if (password !== confirmPassword) {
      showError('confirmPassword', 'Parollar mos kelmadi');
      return;
    }
    
    // Submit
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        localStorage.setItem('kybers_token', data.token);
        localStorage.setItem('kybers_session', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          isAdmin: data.user.isAdmin || false
        }));

        showToast('Ro\'yxatdan o\'tdingiz!', 'success');

        setTimeout(() => {
          window.location.href = data.user.isAdmin ? 'admin.html' : 'apps.html';
        }, 1000);
      } else {
        showToast(data.message || 'Xatolik yuz berdi', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      showToast('Server bilan ulanib bo\'lmadi', 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
}

// Check if user is logged in
function checkAuth() {
  return !!localStorage.getItem('kybers_token');
}

// Logout
function logout() {
  localStorage.removeItem('kybers_token');
  localStorage.removeItem('kybers_session');
  window.location.href = 'login.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggle();
  
  // Display current date in proper format
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    const now = new Date();
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    const formattedDate = now.toLocaleDateString('uz-UZ', options);
    dateEl.textContent = formattedDate;
  }
});

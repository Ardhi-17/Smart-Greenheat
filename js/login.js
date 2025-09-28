// ====== UI helpers ======
function showLoading() {
  document.getElementById('loading-overlay').classList.add('show');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.remove('show');
}
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  toastMessage.textContent = message;
  toast.className = 'toast show';
  // border kiri sesuai type
  toast.style.borderLeftColor =
    type === 'success' ? '#4CAF50' :
    type === 'error'   ? '#F44336' :
    type === 'warning' ? '#FF9800' : '#FF9A00';
  // auto hide
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList.contains('toast-close')) {
    document.getElementById('toast').className = 'toast';
  }
});

// ====== util kecil untuk clear & efek error ======
// (kelas .input-error opsional; aman walau CSS-nya tidak ada)
function pulseError(els = []) {
  els.forEach(el => {
    if (!el) return;
    el.classList.remove('input-error');
    // paksa reflow agar animasi bisa diulang
    void el.offsetWidth;
    el.classList.add('input-error');
  });
  setTimeout(() => els.forEach(el => el && el.classList.remove('input-error')), 300);
}

function clearFields({ emailEl, passEl, clearEmail = false }) {
  if (clearEmail && emailEl) emailEl.value = '';
  if (passEl) passEl.value = '';
  pulseError([emailEl, passEl]);
  (clearEmail ? emailEl : passEl)?.focus();
}

// ====== Login logic ======
document.addEventListener('DOMContentLoaded', function () {
  const auth     = window.auth; // dari firebase-config.js
  const form     = document.getElementById('login-form');
  const remember = document.getElementById('remember');
  const forgot   = document.getElementById('forgot-link');
  const loginBtn = document.getElementById('login-btn');

  // cache input
  const emailEl = document.getElementById('email');
  const pwdEl   = document.getElementById('password');

  // Redirect jika sudah login
  auth.onAuthStateChanged(function (user) {
    if (user) {
      window.location.href = 'dashboard.html';
    }
  });

  // Reset password
  if (forgot) {
    forgot.addEventListener('click', function (e) {
      e.preventDefault();
      const email = emailEl.value.trim();
      if (!email) {
        showToast('Masukkan email terlebih dahulu untuk reset kata sandi.', 'warning');
        emailEl.focus();
        pulseError([emailEl]);
        return;
      }
      showLoading();
      auth.sendPasswordResetEmail(email)
        .then(() => {
          hideLoading();
          showToast('Email reset password telah dikirim.', 'success');
        })
        .catch((error) => {
          hideLoading();
          showToast(`Gagal mengirim reset password: ${error.message}`, 'error');
        });
    });
  }

  // Submit login
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = emailEl.value.trim();
    const pwd   = pwdEl.value;

    if (!email || !pwd) {
      showToast('Email dan password wajib diisi.', 'warning');
      pulseError([!email ? emailEl : null, !pwd ? pwdEl : null].filter(Boolean));
      (!email ? emailEl : pwdEl).focus();
      return;
    }

    // Persistence: Ingat saya → LOCAL; else → SESSION
    const mode = remember.checked
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;

    loginBtn.disabled = true;
    showLoading();

    auth.setPersistence(mode)
      .then(() => auth.signInWithEmailAndPassword(email, pwd))
      .then(() => {
        hideLoading();
        showToast('Login berhasil! Mengarahkan ke dashboard...', 'success');
        setTimeout(() => (window.location.href = 'dashboard.html'), 1200);
      })
      .catch((error) => {
        hideLoading();
        loginBtn.disabled = false;

        // Pesan error yang lebih ramah
        let msg = error.message;

        if (error.code === 'auth/invalid-email')              msg = 'Format email tidak valid.';
        if (error.code === 'auth/missing-email')              msg = 'Email wajib diisi.';
        if (error.code === 'auth/missing-password')           msg = 'Password wajib diisi.';
        if (error.code === 'auth/user-not-found')             msg = 'Akun tidak ditemukan.';   // email belum terdaftar
        if (error.code === 'auth/wrong-password')             msg = 'Password salah.';
        if (error.code === 'auth/invalid-credential'
         || error.code === 'auth/invalid-login-credentials')  msg = 'Email belum terdaftar atau password salah.'; // gabungan
        if (error.code === 'auth/user-disabled')              msg = 'Akun ini telah dinonaktifkan.';
        if (error.code === 'auth/too-many-requests')          msg = 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi atau reset sandi.';
        if (error.code === 'auth/network-request-failed')     msg = 'Gagal terhubung. Periksa koneksi internet Anda.';

        // bersihin prefix "Firebase: " & kode di dalam kurung jika masih ada
        msg = msg.replace(/^Firebase:\s*/i, '').replace(/\s*\(.*\)$/, '');
        showToast(msg, 'error');

        // === DI SINI PERILAKU CLEAR FIELD ===
        // - invalid-email / user-not-found / missing-email -> kosongkan KEDUANYA, fokus ke email
        // - wrong-password / invalid-credential / invalid-login-credentials / too-many-requests -> kosongkan password saja
        // - missing-password -> kosongkan password saja
        const code = error.code || '';
        const clearBoth =
          code === 'auth/invalid-email' ||
          code === 'auth/user-not-found' ||
          code === 'auth/missing-email';

        clearFields({ emailEl, passEl: pwdEl, clearEmail: clearBoth });
      });
  });
});

// ====== eye ====== //
const pwdInput  = document.getElementById('password');
const togglePwd = document.getElementById('toggle-password');

if (togglePwd && pwdInput) {
  togglePwd.addEventListener('click', () => {
    const nowHidden = pwdInput.type === 'password';
    pwdInput.type = nowHidden ? 'text' : 'password';

    togglePwd.setAttribute('aria-pressed', String(nowHidden));
    togglePwd.setAttribute('aria-label', nowHidden ? 'Sembunyikan password' : 'Tampilkan password');
    togglePwd.title = nowHidden ? 'Sembunyikan password' : 'Tampilkan password';

    const icon = togglePwd.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-eye', !nowHidden);
      icon.classList.toggle('fa-eye-slash', nowHidden);
    }
  });
}

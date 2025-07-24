// Simple in-memory auth mock

const auth = {
  user: null, // {email, role: 'admin' or 'user'}

  login(email, password) {
    if (email === 'admin@petpair.com' && password === 'admin123') {
      this.user = { email, role: 'admin' };
      this.saveUser();
      return true;
    } else if (email === 'user@petpair.com' && password === 'user123') {
      this.user = { email, role: 'user' };
      this.saveUser();
      return true;
    }
    return false;
  },

  logout() {
    this.user = null;
    localStorage.removeItem('petpairUser');
    updateNav();
  },

  loadUser() {
    const saved = localStorage.getItem('petpairUser');
    if (saved) {
      this.user = JSON.parse(saved);
    }
  },

  saveUser() {
    localStorage.setItem('petpairUser', JSON.stringify(this.user));
  },

  isAuthenticated() {
    return this.user !== null;
  }
};

// Update nav UI based on auth status
function updateNav() {
  const adminLink = document.getElementById('admin-link');
  const profileLink = document.getElementById('profile-link');
  const loginLink = document.getElementById('login-link');
  const logoutLink = document.getElementById('logout-link');

  if (auth.isAuthenticated()) {
    loginLink.style.display = 'none';
    logoutLink.style.display = 'inline-block';
    profileLink.style.display = 'inline-block';

    if (auth.user.role === 'admin') {
      adminLink.style.display = 'inline-block';
    } else {
      adminLink.style.display = 'none';
    }
  } else {
    loginLink.style.display = 'inline-block';
    logoutLink.style.display = 'none';
    profileLink.style.display = 'none';
    adminLink.style.display = 'none';
  }
}

// Call this on page load
document.addEventListener('DOMContentLoaded', () => {
  auth.loadUser();
  updateNav();
});

function logout() {
  auth.logout();
  window.location.href = 'index.html';
}

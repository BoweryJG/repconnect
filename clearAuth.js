// Run this in browser console to completely clear all auth data
(() => {
  console.log('Clearing all authentication data...');

  // Clear all localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
      console.log('Removing:', key);
      localStorage.removeItem(key);
    }
  });

  // Clear all sessionStorage
  Object.keys(sessionStorage).forEach((key) => {
    if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
      console.log('Removing from session:', key);
      sessionStorage.removeItem(key);
    }
  });

  // Clear all cookies
  document.cookie.split(';').forEach(function (c) {
    document.cookie = c
      .replace(/^ +/, '')
      .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  });

  console.log('All auth data cleared. Refreshing page...');
  window.location.href = '/';
})();

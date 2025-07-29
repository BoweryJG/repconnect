// Run this in browser console to debug auth state

console.log('=== AUTH DEBUG ===');

// Check localStorage
console.log('\n📦 LocalStorage Keys:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.includes('supabase') || key.includes('auth')) {
    console.log(`  ${key}:`, localStorage.getItem(key)?.substring(0, 50) + '...');
  }
}

// Check sessionStorage
console.log('\n📦 SessionStorage Keys:');
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key.includes('supabase') || key.includes('auth')) {
    console.log(`  ${key}:`, sessionStorage.getItem(key)?.substring(0, 50) + '...');
  }
}

// Check cookies
console.log('\n🍪 Cookies:');
document.cookie.split(';').forEach((cookie) => {
  if (cookie.includes('supabase') || cookie.includes('auth')) {
    console.log(`  ${cookie.trim().substring(0, 50)}...`);
  }
});

// Check for wrong project
console.log('\n⚠️  Checking for wrong project references:');
const hasWrongProject =
  JSON.stringify(localStorage).includes('fiozmyoedptukpkzuhqm') ||
  JSON.stringify(sessionStorage).includes('fiozmyoedptukpkzuhqm');

if (hasWrongProject) {
  console.error('❌ FOUND REFERENCES TO WRONG PROJECT!');
} else {
  console.log('✅ No wrong project references found');
}

console.log('\n=== END DEBUG ===');

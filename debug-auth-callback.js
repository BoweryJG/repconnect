#!/usr/bin/env node

// Debug auth callback issues
const puppeteer = require('puppeteer');

async function debugAuthCallback() {
  console.log('🔍 Debugging Auth Callback...\n');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Open Chrome DevTools
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  // Capture console logs
  page.on('console', (msg) => {
    console.log('Browser console:', msg.type(), msg.text());
  });

  // Capture errors
  page.on('pageerror', (error) => {
    console.error('Page error:', error.message);
  });

  try {
    console.log('1. Opening https://repconnect.repspheres.com...');
    await page.goto('https://repconnect.repspheres.com', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('\n2. Check Chrome DevTools Console tab for:');
    console.log('   - "AuthCallback - Processing OAuth callback..."');
    console.log('   - "AuthCallback - Found access token in URL hash"');
    console.log('   - Any Supabase errors');
    console.log('\n3. Check Network tab for:');
    console.log('   - Supabase API calls');
    console.log('   - Failed requests (red)');
    console.log('\n4. Check Application > Local Storage for:');
    console.log('   - sb-cbopynuvhcymbumjnvay-auth-token');

    console.log('\n📌 Manual test steps:');
    console.log('1. Click Login button');
    console.log('2. Complete OAuth login');
    console.log('3. Watch console for auth callback logs');
    console.log('4. Check if stuck at /auth/callback URL');

    // Keep browser open
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run debug
debugAuthCallback();

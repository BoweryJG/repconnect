#!/usr/bin/env node

// Quick check of logout state
const puppeteer = require('puppeteer');

async function checkLogoutState() {
  console.log('🔍 Checking current app state...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // Navigate to app
    console.log('1. Opening app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check for buttons
    console.log('2. Checking for auth buttons...');

    // Get all button texts
    const buttonTexts = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map((btn) => btn.textContent?.trim()).filter(Boolean);
    });

    console.log('   Found buttons:', buttonTexts);

    const hasLogin = buttonTexts.some((text) => text.includes('Login'));
    const hasSignOut = buttonTexts.some((text) => text.includes('Sign Out'));

    if (hasLogin && !hasSignOut) {
      console.log('\n✅ User is LOGGED OUT (Login button visible)');
    } else if (hasSignOut && !hasLogin) {
      console.log('\n⚠️  User is LOGGED IN (Sign Out button visible)');
      console.log('   Attempting to click Sign Out...');

      // Click sign out
      await page.evaluate(() => {
        const signOutBtn = Array.from(document.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('Sign Out')
        );
        if (signOutBtn) signOutBtn.click();
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check for modal
      const hasModal = await page.evaluate(() => {
        return document.querySelector('.modal-overlay') !== null;
      });

      if (hasModal) {
        console.log('   ✓ Logout modal appeared');
        console.log('   Please click "Sign Out" in the modal to test logout');
      }
    } else {
      console.log('\n❓ Unexpected state:');
      console.log(`   Login button: ${hasLogin ? 'yes' : 'no'}`);
      console.log(`   Sign Out button: ${hasSignOut ? 'yes' : 'no'}`);
    }

    // Check localStorage
    console.log('\n3. Checking localStorage...');
    const storageInfo = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const authKeys = keys.filter((k) => k.includes('supabase') || k.includes('auth'));
      return {
        totalKeys: keys.length,
        authKeys: authKeys,
        allKeys: keys,
      };
    });

    console.log(`   Total keys: ${storageInfo.totalKeys}`);
    if (storageInfo.authKeys.length > 0) {
      console.log(`   Auth keys found: ${storageInfo.authKeys.join(', ')}`);
    } else {
      console.log('   No auth keys found');
    }

    console.log('\n📌 Keep this browser open to test logout manually');
    console.log('   Press Ctrl+C when done');

    // Keep browser open
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkLogoutState();

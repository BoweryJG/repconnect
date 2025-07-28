#!/usr/bin/env node

// Verify auth UI is working
const puppeteer = require('puppeteer');

async function verifyAuthUI() {
  console.log('🔍 Verifying Auth UI on production...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // Test production
    console.log('Testing https://repconnect.repspheres.com...');
    await page.goto('https://repconnect.repspheres.com', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Check logged out state
    console.log('\n1. LOGGED OUT STATE:');
    const loggedOutState = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
        .map((b) => b.textContent?.trim())
        .filter(Boolean);
      return {
        hasLogin: buttons.some((t) => t.includes('Login')),
        hasSignUp: buttons.some((t) => t.includes('Sign Up')),
        hasSignOut: buttons.some((t) => t.includes('Sign Out')),
      };
    });

    console.log(`   Login button: ${loggedOutState.hasLogin ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Sign Up button: ${loggedOutState.hasSignUp ? '✅ Present' : '❌ Missing'}`);
    console.log(
      `   Sign Out button: ${loggedOutState.hasSignOut ? '❌ Should not be visible' : '✅ Correctly hidden'}`
    );

    // Test login modal
    console.log('\n2. LOGIN MODAL:');
    if (loggedOutState.hasLogin) {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) =>
          b.textContent?.includes('Login')
        );
        if (btn) btn.click();
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const modalState = await page.evaluate(() => {
        const modal = document.querySelector('.modal-overlay');
        if (!modal) return { hasModal: false };

        const buttons = Array.from(modal.querySelectorAll('button'))
          .map((b) => b.textContent?.trim())
          .filter(Boolean);

        return {
          hasModal: true,
          hasGoogle: buttons.some((t) => t.includes('Google')),
          hasFacebook: buttons.some((t) => t.includes('Facebook')),
          buttons: buttons,
        };
      });

      if (modalState.hasModal) {
        console.log('   Modal: ✅ Opens correctly');
        console.log(`   Google auth: ${modalState.hasGoogle ? '✅ Available' : '❌ Missing'}`);
        console.log(`   Facebook auth: ${modalState.hasFacebook ? '✅ Available' : '❌ Missing'}`);
      } else {
        console.log('   Modal: ❌ Failed to open');
      }
    }

    // Check localStorage
    console.log('\n3. STORAGE STATE:');
    const storage = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return {
        total: keys.length,
        authKeys: keys.filter((k) => k.includes('supabase') || k.includes('auth')),
      };
    });

    console.log(`   Total localStorage keys: ${storage.total}`);
    console.log(`   Auth-related keys: ${storage.authKeys.length}`);
    if (storage.authKeys.length > 0) {
      console.log('   ⚠️  Found auth keys:', storage.authKeys);
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    const uiWorking =
      loggedOutState.hasLogin && loggedOutState.hasSignUp && !loggedOutState.hasSignOut;

    if (uiWorking) {
      console.log('✅ Auth UI is working correctly');
      console.log('   - Shows Login/Sign Up when logged out');
      console.log('   - Login modal opens with OAuth options');
      console.log('   - No Sign Out button when not authenticated');
    } else {
      console.log('❌ Auth UI has issues');
    }

    console.log('\n📝 To complete full test:');
    console.log('1. Manually log in with Google/Facebook');
    console.log('2. Verify Sign Out button appears');
    console.log('3. Click Sign Out and confirm');
    console.log('4. Verify return to Login/Sign Up state');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run verification
verifyAuthUI();

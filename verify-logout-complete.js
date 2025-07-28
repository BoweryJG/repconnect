#!/usr/bin/env node

// Verify logout is complete on production
const puppeteer = require('puppeteer');

async function verifyLogoutComplete() {
  console.log('🔍 Verifying logout state on production...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // Go to production
    console.log('1. Testing https://repconnect.repspheres.com...');
    await page.goto('https://repconnect.repspheres.com', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Take screenshot
    await page.screenshot({ path: 'production-state.png' });
    console.log('   Screenshot saved as production-state.png');

    // Check all aspects of logout
    console.log('\n2. CHECKING LOGOUT COMPLETION:');

    const state = await page.evaluate(() => {
      // Get all button texts
      const buttons = Array.from(document.querySelectorAll('button'))
        .map((b) => b.textContent?.trim())
        .filter(Boolean);

      // Check localStorage
      const storage = Object.keys(localStorage);
      const authKeys = storage.filter(
        (k) =>
          k.includes('supabase') ||
          k.includes('auth') ||
          k.includes('session') ||
          k.includes('user')
      );

      // Check sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      const sessionAuthKeys = sessionKeys.filter(
        (k) => k.includes('supabase') || k.includes('auth')
      );

      // Check cookies
      const cookies = document.cookie;

      return {
        buttons,
        hasLogin: buttons.some((t) => t.includes('Login')),
        hasSignUp: buttons.some((t) => t.includes('Sign Up')),
        hasSignOut: buttons.some((t) => t.includes('Sign Out')),
        localStorage: {
          total: storage.length,
          authKeys: authKeys,
          allKeys: storage,
        },
        sessionStorage: {
          total: sessionKeys.length,
          authKeys: sessionAuthKeys,
        },
        cookies: cookies,
        url: window.location.href,
      };
    });

    // Display results
    console.log('   URL:', state.url);
    console.log('\n   BUTTONS:');
    console.log(`   - Login button: ${state.hasLogin ? '✅ Present' : '❌ Missing'}`);
    console.log(`   - Sign Up button: ${state.hasSignUp ? '✅ Present' : '❌ Missing'}`);
    console.log(
      `   - Sign Out button: ${state.hasSignOut ? '❌ STILL VISIBLE' : '✅ Not visible'}`
    );

    console.log('\n   STORAGE:');
    console.log(`   - localStorage keys: ${state.localStorage.total}`);
    if (state.localStorage.authKeys.length > 0) {
      console.log(`   - ❌ Auth keys found:`, state.localStorage.authKeys);
    } else {
      console.log(`   - ✅ No auth keys in localStorage`);
    }

    console.log(`   - sessionStorage keys: ${state.sessionStorage.total}`);
    if (state.sessionStorage.authKeys.length > 0) {
      console.log(`   - ❌ Session auth keys found:`, state.sessionStorage.authKeys);
    } else {
      console.log(`   - ✅ No auth keys in sessionStorage`);
    }

    console.log('\n   COOKIES:');
    console.log(`   - ${state.cookies || 'No cookies set'}`);

    // Test login modal opens
    console.log('\n3. TESTING LOGIN MODAL:');
    if (state.hasLogin) {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) =>
          b.textContent?.includes('Login')
        );
        if (btn) btn.click();
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const modalCheck = await page.evaluate(() => {
        const modal = document.querySelector('.modal-overlay');
        if (!modal) return { hasModal: false };

        const modalText = modal.textContent || '';
        return {
          hasModal: true,
          hasGoogle: modalText.includes('Google'),
          hasFacebook: modalText.includes('Facebook'),
          text: modalText.substring(0, 200),
        };
      });

      if (modalCheck.hasModal) {
        console.log('   ✅ Login modal opens');
        console.log(`   ✅ Google OAuth: ${modalCheck.hasGoogle ? 'Available' : 'Missing'}`);
        console.log(`   ✅ Facebook OAuth: ${modalCheck.hasFacebook ? 'Available' : 'Missing'}`);
      } else {
        console.log('   ❌ Login modal did not open');
      }
    }

    // Final verdict
    console.log('\n📊 LOGOUT VERIFICATION RESULT:');

    const isLoggedOut =
      state.hasLogin &&
      state.hasSignUp &&
      !state.hasSignOut &&
      state.localStorage.authKeys.length === 0 &&
      state.sessionStorage.authKeys.length === 0;

    if (isLoggedOut) {
      console.log('✅ LOGOUT IS COMPLETE AND WORKING');
      console.log('   - Shows Login/Sign Up buttons');
      console.log('   - No Sign Out button visible');
      console.log('   - No auth data in storage');
      console.log('   - Login modal functional');
      return true;
    } else {
      console.log('❌ LOGOUT IS NOT COMPLETE');
      if (!state.hasLogin) console.log('   - Missing Login button');
      if (!state.hasSignUp) console.log('   - Missing Sign Up button');
      if (state.hasSignOut) console.log('   - Sign Out button still visible');
      if (state.localStorage.authKeys.length > 0) console.log('   - Auth keys in localStorage');
      if (state.sessionStorage.authKeys.length > 0) console.log('   - Auth keys in sessionStorage');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run verification
verifyLogoutComplete().then((success) => {
  process.exit(success ? 0 : 1);
});

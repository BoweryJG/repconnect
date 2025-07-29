# RepConnect Supabase Project Information

## ✅ CORRECT PROJECT: Sphere1a

- **Project ID**: `cbopynuvhcymbumjnvay`
- **URL**: `https://cbopynuvhcymbumjnvay.supabase.co`
- **Created**: April 7, 2025
- **Region**: us-east-1
- **Purpose**: RepConnect Production Database
- **OAuth Redirect URLs Configured**:
  - `https://repconnect.repspheres.com/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3001/auth/callback`

## ❌ INCORRECT PROJECT: Bowery Creative

- **Project ID**: `fiozmyoedptukpkzuhqm`
- **URL**: `https://fiozmyoedptukpkzuhqm.supabase.co`
- **DO NOT USE THIS PROJECT FOR REPCONNECT**
- **Purpose**: Different application (contains agencies, automation tables)

## Environment Variables

```env
# CORRECT VALUES FOR REPCONNECT
REACT_APP_SUPABASE_URL=https://cbopynuvhcymbumjnvay.supabase.co
REACT_APP_SUPABASE_ANON_KEY=[get from Sphere1a project settings]
```

## How to Verify You're Using the Right Project

1. Check browser console - should show NO errors about "Bowery Creative"
2. Storage key should be: `sb-cbopynuvhcymbumjnvay-auth-token`
3. Network requests should go to: `cbopynuvhcymbumjnvay.supabase.co`

## If You See Authentication Issues

1. Clear all browser data (localStorage, sessionStorage, cookies)
2. Check .env file has correct URL
3. Verify OAuth redirect URLs in Supabase dashboard
4. Look for any console errors mentioning wrong project

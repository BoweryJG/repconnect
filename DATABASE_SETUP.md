# Database Setup Instructions

## Setting up Supabase Tables

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase_schema.sql` 
4. Click "Run" to execute the SQL commands

This will create:
- `contacts` table for storing contact information
- `calls` table for storing call history
- Necessary indexes and RLS policies
- Some demo data to get started

## Fixing the 400 Error

The 400 error occurs because the database tables don't exist yet. After running the SQL schema above, the app should work correctly.

## Performance Optimization

If you're experiencing performance issues:

1. The particle effects are GPU-intensive. The system will automatically reduce particle count when detecting performance issues.
2. You can manually adjust performance by modifying the default particle count in `/src/lib/performance/AdaptiveRenderer.ts`
3. The thermal management system monitors device temperature and adjusts quality settings accordingly.
// Run this script to enrich all public contacts
// Usage: npx tsx scripts/enrichContacts.ts

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

// Now import the enrichment function after env vars are loaded
import { enrichPublicContacts } from '../src/lib/mockData/enrichPublicContacts';

async function main() {
  console.log('🚀 Starting contact enrichment process...\n');
  console.log('Using Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
  
  try {
    const result = await enrichPublicContacts();
    
    if (result) {
      console.log('\n✅ Enrichment completed successfully!');
    } else {
      console.log('\n❌ Enrichment completed but no result returned');
    }
  } catch (error) {
    console.error('\n❌ Enrichment failed:', error);
    process.exit(1);
  }
}

main();
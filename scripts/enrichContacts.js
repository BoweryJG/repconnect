// Run this script to enrich all public contacts
// Usage: node scripts/enrichContacts.js

import { enrichPublicContacts } from '../src/lib/mockData/enrichPublicContacts.js';

async function main() {
  console.log('🚀 Starting contact enrichment process...\n');
  
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
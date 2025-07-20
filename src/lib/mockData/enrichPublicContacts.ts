import { supabase } from '../supabase';
import { enrichContact, EnrichedContact } from './enrichmentGenerator';

export async function enrichPublicContacts() {
  try {
    // Fetch all public contacts
    const { data: publicContacts, error } = await supabase
      .from('public_contacts')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return;
    }

    if (!publicContacts || publicContacts.length === 0) {
      return;
    }

    // Note: The enriched_public_contacts table should be created in Supabase dashboard
    // For now, we'll check if the table exists by attempting a query
    const { error: checkError } = await supabase
      .from('enriched_public_contacts')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist, create it
      const createTableQuery = `
        CREATE TABLE enriched_public_contacts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          original_id UUID REFERENCES public_contacts(id),
          name TEXT NOT NULL,
          practice_name TEXT NOT NULL,
          specialization TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          practice_type TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          mobile TEXT NOT NULL,
          fax TEXT NOT NULL,
          website TEXT NOT NULL,
          title TEXT NOT NULL,
          years_experience INTEGER NOT NULL,
          education TEXT[] NOT NULL,
          certifications TEXT[] NOT NULL,
          languages TEXT[] NOT NULL,
          bio TEXT NOT NULL,
          linkedin TEXT NOT NULL,
          facebook TEXT NOT NULL,
          twitter TEXT NOT NULL,
          instagram TEXT NOT NULL,
          healthgrades TEXT NOT NULL,
          zocdoc TEXT NOT NULL,
          address TEXT NOT NULL,
          suite TEXT NOT NULL,
          zip_code TEXT NOT NULL,
          office_hours JSONB NOT NULL,
          insurance_accepted TEXT[] NOT NULL,
          payment_methods TEXT[] NOT NULL,
          parking_available BOOLEAN NOT NULL,
          wheelchair_accessible BOOLEAN NOT NULL,
          accepting_new_patients BOOLEAN NOT NULL,
          telehealth BOOLEAN NOT NULL,
          google_rating DECIMAL(2,1) NOT NULL,
          google_review_count INTEGER NOT NULL,
          yelp_rating DECIMAL(2,1) NOT NULL,
          yelp_review_count INTEGER NOT NULL,
          healthgrades_rating DECIMAL(2,1) NOT NULL,
          healthgrades_review_count INTEGER NOT NULL,
          overall_rating DECIMAL(3,2) NOT NULL,
          total_reviews INTEGER NOT NULL,
          heat_score INTEGER NOT NULL,
          segment TEXT NOT NULL CHECK (segment IN ('champion', 'decision-maker', 'researcher', 'quick-win', 'cold')),
          lead_quality TEXT NOT NULL CHECK (lead_quality IN ('A+', 'A', 'B', 'C', 'D')),
          response_rate DECIMAL(3,2) NOT NULL,
          engagement_score DECIMAL(3,2) NOT NULL,
          last_enriched TIMESTAMP WITH TIME ZONE NOT NULL,
          enrichment_source TEXT NOT NULL,
          data_completeness INTEGER NOT NULL,
          verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'pending', 'unverified')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_enriched_contacts_heat_score ON enriched_public_contacts(heat_score DESC);
        CREATE INDEX idx_enriched_contacts_segment ON enriched_public_contacts(segment);
        CREATE INDEX idx_enriched_contacts_city_state ON enriched_public_contacts(city, state);
        CREATE INDEX idx_enriched_contacts_original_id ON enriched_public_contacts(original_id);
      `;

      await supabase.rpc('exec_sql', { sql: createTableQuery });
      return;
    }

    // Clear existing enriched data if table exists
    if (!checkError) {
      await supabase
        .from('enriched_public_contacts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // City/State mapping for enrichment
    const cityStateMap = [
      { city: 'New York', state: 'NY' },
      { city: 'Los Angeles', state: 'CA' },
      { city: 'Chicago', state: 'IL' },
      { city: 'Houston', state: 'TX' },
      { city: 'Phoenix', state: 'AZ' },
      { city: 'Philadelphia', state: 'PA' },
      { city: 'San Antonio', state: 'TX' },
      { city: 'San Diego', state: 'CA' },
      { city: 'Dallas', state: 'TX' },
      { city: 'Miami', state: 'FL' },
      { city: 'Austin', state: 'TX' },
      { city: 'Denver', state: 'CO' },
      { city: 'Boston', state: 'MA' },
      { city: 'Seattle', state: 'WA' },
      { city: 'San Francisco', state: 'CA' },
      { city: 'Atlanta', state: 'GA' },
      { city: 'Portland', state: 'OR' },
      { city: 'Las Vegas', state: 'NV' },
      { city: 'Charlotte', state: 'NC' },
      { city: 'Nashville', state: 'TN' },
    ];

    // Enrich each contact
    const enrichedContacts: any[] = [];

    for (let i = 0; i < publicContacts.length; i++) {
      const contact = publicContacts[i];

      // Assign city/state in round-robin fashion
      const location = cityStateMap[i % cityStateMap.length];

      // Determine practice type from specialization
      const practiceType = [
        'Dermatology',
        'Aesthetic Medicine',
        'Plastic Surgery',
        'MedSpa',
      ].includes(contact.specialization)
        ? 'Medical'
        : 'Dental';

      const baseContact = {
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`,
        practice_name: contact.practice_name,
        specialization: contact.specialization,
        city: location.city,
        state: location.state,
        practice_type: practiceType,
      };

      const enriched = enrichContact(baseContact);

      // Transform for database insertion
      const dbRecord = {
        original_id: contact.id,
        name: enriched.name,
        practice_name: enriched.practice_name,
        specialization: enriched.specialization,
        city: enriched.city,
        state: enriched.state,
        practice_type: enriched.practice_type,

        // Contact Information
        email: enriched.email,
        phone: enriched.phone,
        mobile: enriched.mobile,
        fax: enriched.fax,
        website: enriched.website,

        // Professional Profile
        title: enriched.title,
        years_experience: enriched.yearsExperience,
        education: enriched.education,
        certifications: enriched.certifications,
        languages: enriched.languages,
        bio: enriched.bio,

        // Social Media
        linkedin: enriched.linkedin,
        facebook: enriched.facebook,
        twitter: enriched.twitter,
        instagram: enriched.instagram,
        healthgrades: enriched.healthgrades,
        zocdoc: enriched.zocdoc,

        // Practice Details
        address: enriched.address,
        suite: enriched.suite,
        zip_code: enriched.zipCode,
        office_hours: enriched.officeHours,

        // Business Information
        insurance_accepted: enriched.insuranceAccepted,
        payment_methods: enriched.paymentMethods,
        parking_available: enriched.parkingAvailable,
        wheelchair_accessible: enriched.wheelchairAccessible,
        accepting_new_patients: enriched.acceptingNewPatients,
        telehealth: enriched.telehealth,

        // Reviews & Ratings
        google_rating: enriched.googleRating,
        google_review_count: enriched.googleReviewCount,
        yelp_rating: enriched.yelpRating,
        yelp_review_count: enriched.yelpReviewCount,
        healthgrades_rating: enriched.healthgradesRating,
        healthgrades_review_count: enriched.healthgradesReviewCount,
        overall_rating: enriched.overallRating,
        total_reviews: enriched.totalReviews,

        // Enrichment Scores
        heat_score: enriched.heatScore,
        segment: enriched.segment,
        lead_quality: enriched.leadQuality,
        response_rate: enriched.responseRate,
        engagement_score: enriched.engagementScore,

        // Metadata
        last_enriched: enriched.lastEnriched,
        enrichment_source: enriched.enrichmentSource,
        data_completeness: enriched.dataCompleteness,
        verification_status: enriched.verificationStatus,
      };

      enrichedContacts.push(dbRecord);
    }

    // Insert enriched contacts in batches
    const batchSize = 5;
    for (let i = 0; i < enrichedContacts.length; i += batchSize) {
      const batch = enrichedContacts.slice(i, i + batchSize);
      const { error: insertError } = await supabase.from('enriched_public_contacts').insert(batch);

      if (insertError) {
      } else {
      }
    }

    // Return summary statistics
    const stats = {
      total: enrichedContacts.length,
      champions: enrichedContacts.filter((c) => c.segment === 'champion').length,
      decisionMakers: enrichedContacts.filter((c) => c.segment === 'decision-maker').length,
      acceptingNewPatients: enrichedContacts.filter((c) => c.accepting_new_patients).length,
      withTelehealth: enrichedContacts.filter((c) => c.telehealth).length,
      averageHeatScore: Math.round(
        enrichedContacts.reduce((sum, c) => sum + c.heat_score, 0) / enrichedContacts.length
      ),
      averageRating:
        Math.round(
          (enrichedContacts.reduce((sum, c) => sum + c.overall_rating, 0) /
            enrichedContacts.length) *
            100
        ) / 100,
    };

    return { enrichedContacts, stats };
  } catch (error) {
    throw error;
  }
}

// Function to get enriched contacts for UI
export async function getEnrichedPublicContacts(): Promise<EnrichedContact[]> {
  const { data, error } = await supabase
    .from('enriched_public_contacts')
    .select('*')
    .order('heat_score', { ascending: false });

  if (error) {
    return [];
  }

  // Transform database records back to EnrichedContact format
  return data.map((record) => ({
    id: record.original_id,
    name: record.name,
    practice_name: record.practice_name,
    specialization: record.specialization,
    city: record.city,
    state: record.state,
    practice_type: record.practice_type,

    email: record.email,
    phone: record.phone,
    mobile: record.mobile,
    fax: record.fax,
    website: record.website,

    title: record.title,
    yearsExperience: record.years_experience,
    education: record.education,
    certifications: record.certifications,
    languages: record.languages,
    bio: record.bio,

    linkedin: record.linkedin,
    facebook: record.facebook,
    twitter: record.twitter,
    instagram: record.instagram,
    healthgrades: record.healthgrades,
    zocdoc: record.zocdoc,

    address: record.address,
    suite: record.suite,
    zipCode: record.zip_code,
    officeHours: record.office_hours,

    insuranceAccepted: record.insurance_accepted,
    paymentMethods: record.payment_methods,
    parkingAvailable: record.parking_available,
    wheelchairAccessible: record.wheelchair_accessible,
    acceptingNewPatients: record.accepting_new_patients,
    telehealth: record.telehealth,

    googleRating: record.google_rating,
    googleReviewCount: record.google_review_count,
    yelpRating: record.yelp_rating,
    yelpReviewCount: record.yelp_review_count,
    healthgradesRating: record.healthgrades_rating,
    healthgradesReviewCount: record.healthgrades_review_count,
    overallRating: record.overall_rating,
    totalReviews: record.total_reviews,

    heatScore: record.heat_score,
    segment: record.segment,
    leadQuality: record.lead_quality,
    responseRate: record.response_rate,
    engagementScore: record.engagement_score,

    lastEnriched: record.last_enriched,
    enrichmentSource: record.enrichment_source,
    dataCompleteness: record.data_completeness,
    verificationStatus: record.verification_status,
  }));
}

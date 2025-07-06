const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cbopynuvhcymbumjnvay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTUxNzMsImV4cCI6MjA1OTU3MTE3M30.UZElMkoHugIt984RtYWyfrRuv2rB67opQdCrFVPCfzU'
);

async function insertCoachData() {
  try {
    // Insert sales coach agents
    const coaches = [
      {
        name: "Dr. Harvey Stern",
        gender: "male", 
        personality_type: "Trust-Building Expert",
        coaching_style: {
          approach: "consultative",
          tone: "professional_friendly",
          pace: "measured"
        },
        trust_building_approach: "Establishes credibility through deep product knowledge and genuine concern for patient outcomes",
        specialized_knowledge: ["yomi_robot", "dental_procedures", "patient_psychology"]
      },
      {
        name: "Dr. Sarah Chen",
        gender: "female",
        personality_type: "Aesthetic Authority", 
        coaching_style: {
          approach: "educational",
          tone: "warm_confident", 
          pace: "adaptive"
        },
        trust_building_approach: "Uses evidence-based results and artistic expertise to build confidence",
        specialized_knowledge: ["injectables", "fillers", "aesthetic_procedures", "patient_consultation"]
      },
      {
        name: "Marcus Rodriguez",
        gender: "male",
        personality_type: "Fitness Results Coach",
        coaching_style: {
          approach: "results_driven",
          tone: "motivational",
          pace: "energetic"
        }, 
        trust_building_approach: "Focuses on transformation outcomes and lifestyle improvement",
        specialized_knowledge: ["emsculpt", "body_contouring", "fitness_technology"]
      },
      {
        name: "Dr. Amanda Foster", 
        gender: "female",
        personality_type: "Precision Specialist",
        coaching_style: {
          approach: "technical_detail",
          tone: "reassuring_expert",
          pace: "thorough"
        },
        trust_building_approach: "Demonstrates expertise through technical precision and safety protocols", 
        specialized_knowledge: ["lasers", "microneedling", "skin_technology", "treatment_protocols"]
      }
    ];

    console.log('Inserting coaches...');
    const { data: insertedCoaches, error: coachError } = await supabase
      .from('sales_coach_agents')
      .insert(coaches)
      .select();

    if (coachError) {
      console.error('Error inserting coaches:', coachError);
      return;
    }

    console.log('✅ Coaches inserted:', insertedCoaches.length);

    // Insert specializations for each coach
    const specializations = [
      // Dr. Harvey - Yomi Robot
      {
        coach_id: insertedCoaches[0].id,
        procedure_category: 'yomi_robot',
        expertise_level: 10,
        expertise_description: 'Leading expert in robotic dental surgery with 15+ years experience',
        common_questions: [
          'How accurate is the Yomi robot compared to traditional implant surgery?',
          'What is the learning curve for dental practices adopting Yomi?',
          'How does Yomi improve patient outcomes and safety?'
        ],
        mock_scenarios: [
          { name: 'Skeptical Dentist', difficulty: 'medium' },
          { name: 'ROI-Focused Practice Owner', difficulty: 'high' },
          { name: 'Tech-Curious Young Dentist', difficulty: 'easy' }
        ]
      },
      // Dr. Sarah - Injectables
      {
        coach_id: insertedCoaches[1].id,
        procedure_category: 'injectables',
        expertise_level: 9,
        expertise_description: 'Board-certified expert in neuromodulators and aesthetic injections',
        common_questions: [
          'What are the differences between Botox, Dysport, and Xeomin?',
          'How do you handle patients who want dramatic results?',
          'What are the most common injection mistakes to avoid?'
        ],
        mock_scenarios: [
          { name: 'First-time Botox Patient', difficulty: 'easy' },
          { name: 'Competitor Price Shopper', difficulty: 'medium' },
          { name: 'Over-injected Patient Seeking Natural Look', difficulty: 'high' }
        ]
      },
      // Dr. Sarah - Fillers
      {
        coach_id: insertedCoaches[1].id,
        procedure_category: 'fillers',
        expertise_level: 9,
        expertise_description: 'Specialist in hyaluronic acid fillers and volumizing techniques',
        common_questions: [
          'How long do different types of fillers last?',
          'What is the difference between Juvederm and Restylane?',
          'How do you prevent complications like vascular occlusion?'
        ],
        mock_scenarios: [
          { name: 'Lip Enhancement Consultation', difficulty: 'easy' },
          { name: 'Cheek Volumizing for Aging Patient', difficulty: 'medium' },
          { name: 'Correcting Previous Bad Filler Work', difficulty: 'high' }
        ]
      },
      // Marcus - EMSculpt
      {
        coach_id: insertedCoaches[2].id,
        procedure_category: 'emsculpt',
        expertise_level: 8,
        expertise_description: 'Certified EMSculpt specialist with proven body contouring results',
        common_questions: [
          'How many EMSculpt sessions are needed for visible results?',
          'Can EMSculpt replace traditional exercise and diet?',
          'What body areas respond best to EMSculpt treatments?'
        ],
        mock_scenarios: [
          { name: 'Post-Pregnancy Body Concerns', difficulty: 'medium' },
          { name: 'Athletic Performance Enhancement', difficulty: 'easy' },
          { name: 'Weight Loss Surgery Follow-up', difficulty: 'high' }
        ]
      },
      // Dr. Amanda - Lasers
      {
        coach_id: insertedCoaches[3].id,
        procedure_category: 'lasers',
        expertise_level: 9,
        expertise_description: 'Expert in medical laser technology and skin resurfacing',
        common_questions: [
          'What laser is best for acne scarring vs wrinkles?',
          'How do you determine proper laser settings for different skin types?',
          'What are the risks and downtime for fractional laser treatments?'
        ],
        mock_scenarios: [
          { name: 'Melasma Treatment Consultation', difficulty: 'high' },
          { name: 'Anti-aging Laser Package', difficulty: 'medium' },
          { name: 'Acne Scar Improvement', difficulty: 'medium' }
        ]
      },
      // Dr. Amanda - Microneedling 
      {
        coach_id: insertedCoaches[3].id,
        procedure_category: 'microneedling',
        expertise_level: 8,
        expertise_description: 'Specialist in RF microneedling and collagen induction therapy',
        common_questions: [
          'How does RF microneedling differ from traditional microneedling?',
          'What results can patients expect and when?',
          'How do you minimize discomfort during treatment?'
        ],
        mock_scenarios: [
          { name: 'Sensitive Skin Consultation', difficulty: 'medium' },
          { name: 'Combination Treatment Planning', difficulty: 'high' },
          { name: 'First-time Aesthetic Patient', difficulty: 'easy' }
        ]
      }
    ];

    console.log('Inserting specializations...');
    const { data: insertedSpecs, error: specError } = await supabase
      .from('coach_procedure_specializations')
      .insert(specializations)
      .select();

    if (specError) {
      console.error('Error inserting specializations:', specError);
      return;
    }

    console.log('✅ Specializations inserted:', insertedSpecs.length);

    // Insert availability records
    const availability = insertedCoaches.map(coach => ({
      coach_id: coach.id,
      is_available: true,
      max_concurrent_sessions: 3,
      daily_sessions_count: 0
    }));

    console.log('Inserting availability records...');
    const { data: insertedAvail, error: availError } = await supabase
      .from('coach_availability')
      .insert(availability)
      .select();

    if (availError) {
      console.error('Error inserting availability:', availError);
      return;
    }

    console.log('✅ Availability records inserted:', insertedAvail.length);
    console.log('🎉 All coaching data successfully created!');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Only insert data, don't try to create tables since they might not exist
insertCoachData();
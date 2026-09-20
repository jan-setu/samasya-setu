const bcrypt = require('bcryptjs');
const db = require('./index');
const migrate = require('./migrate');
const { generateEmbedding } = require('../services/aiService');
const { calculatePriorityScore } = require('../services/priorityEngine');

async function seed() {
  console.log('🌱 Starting SamasyaSetu Jharkhand Demo Seeding...');
  await migrate();

  // 1. Clean existing tables
  const tables = [
    'notifications', 'impact_reports', 'milestones', 'proposals',
    'teams', 'verifications', 'confirmations', 'problem_media',
    'problems', 'problem_clusters', 'users', 'organizations'
  ];

  for (const table of tables) {
    try {
      await db.query(`DELETE FROM ${table}`);
    } catch (e) {
      // Table might be clean
    }
  }

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 2. Seed Organizations
  console.log('🏛️ Seeding Organizations...');
  const orgs = [
    {
      id: 'org_bit_mesra',
      type: 'university',
      name: 'Birla Institute of Technology (BIT) Mesra',
      district: 'Ranchi',
      expertise_tags: ['Water Resources', 'Urban Development', 'AI & IoT', 'Sensors', 'Civil Engineering', 'Energy']
    },
    {
      id: 'org_ism_dhanbad',
      type: 'university',
      name: 'IIT (ISM) Dhanbad',
      district: 'Dhanbad',
      expertise_tags: ['Environment', 'Mining Reclamation', 'Groundwater', 'Clean Energy', 'Robotics', 'Agriculture']
    },
    {
      id: 'org_nit_jsr',
      type: 'university',
      name: 'National Institute of Technology (NIT) Jamshedpur',
      district: 'East Singhbhum',
      expertise_tags: ['Rural Livelihoods', 'Healthcare Devices', 'Renewable Energy', 'Automation', 'Sanitation']
    },
    {
      id: 'org_bau_ranchi',
      type: 'university',
      name: 'Birsa Agricultural University (BAU) Ranchi',
      district: 'Ranchi',
      expertise_tags: ['Agriculture', 'Soil Health', 'Drip Irrigation', 'Crop Disease AI', 'Tribal Livelihoods']
    },
    {
      id: 'org_tata_steel',
      type: 'industry',
      name: 'Tata Steel Foundation & CSR',
      district: 'East Singhbhum',
      expertise_tags: ['Healthcare', 'Education', 'Water Supply', 'Rural Development', 'Skill Training', 'CSR Grants']
    },
    {
      id: 'org_cimfr',
      type: 'research_lab',
      name: 'CSIR - Central Institute of Mining & Fuel Research',
      district: 'Dhanbad',
      expertise_tags: ['Environment', 'Air Quality', 'Mine Water Purification', 'Heavy Metal Remediation']
    },
    {
      id: 'org_agro_startup',
      type: 'startup',
      name: 'KisanSetu Agritech Labs',
      district: 'Ranchi',
      expertise_tags: ['Agriculture', 'Drone Spraying', 'Solar Cold Storage', 'Supply Chain']
    },
    {
      id: 'org_dept_dwss',
      type: 'govt_dept',
      name: 'Drinking Water & Sanitation Dept, Govt of Jharkhand',
      district: 'Ranchi',
      expertise_tags: ['Water Resources', 'Sanitation', 'Piped Water Supply', 'Jal Jeevan Mission']
    },
    {
      id: 'org_dept_health',
      type: 'govt_dept',
      name: 'Department of Health, Medical Education & Family Welfare',
      district: 'Ranchi',
      expertise_tags: ['Healthcare', 'PHC Infrastructure', 'Telemedicine', 'Nutrition']
    }
  ];

  for (const org of orgs) {
    const embedding = await generateEmbedding(org.expertise_tags.join(' '));
    await db.query(
      'INSERT INTO organizations (id, type, name, district, expertise_tags, expertise_embedding) VALUES (?, ?, ?, ?, ?, ?)',
      [org.id, org.type, org.name, org.district, JSON.stringify(org.expertise_tags), JSON.stringify(embedding)]
    );
  }

  // 3. Seed Users (All 6 Roles)
  console.log('👥 Seeding Users across all 6 roles...');
  const users = [
    {
      id: 'usr_citizen_sunita',
      role: 'citizen',
      name: 'Sunita Devi',
      phone: '9876543210',
      email: 'citizen@samsyasetu.in',
      org_id: null,
      department: null,
      is_verified: 1
    },
    {
      id: 'usr_citizen_ramesh',
      role: 'citizen',
      name: 'Ramesh Oraon',
      phone: '9876543211',
      email: 'ramesh.oraon@gmail.com',
      org_id: null,
      department: null,
      is_verified: 1
    },
    {
      id: 'usr_admin_rajesh',
      role: 'admin',
      name: 'Rajesh Kumar (State Super Admin)',
      phone: '9876543220',
      email: 'admin@samsyasetu.in',
      org_id: 'org_dept_dwss',
      department: 'State Innovation & Grievance Cell',
      is_verified: 1
    },
    {
      id: 'usr_govt_water',
      role: 'govt_dept',
      name: 'Er. Sandeep Tigga (Executive Engineer)',
      phone: '9876543230',
      email: 'dept.water@jharkhand.gov.in',
      org_id: 'org_dept_dwss',
      department: 'Rural Water Supply Wing',
      is_verified: 1
    },
    {
      id: 'usr_faculty_sharma',
      role: 'faculty',
      name: 'Prof. Alok Sharma (Department Head)',
      phone: '9876543240',
      email: 'prof.sharma@bitmesra.ac.in',
      org_id: 'org_bit_mesra',
      department: 'Civil & Environmental Engineering',
      is_verified: 1
    },
    {
      id: 'usr_student_ananya',
      role: 'student',
      name: 'Ananya Verma (Research Scholar)',
      phone: '9876543250',
      email: 'student.ananya@iitism.ac.in',
      org_id: 'org_ism_dhanbad',
      department: 'Environmental Science & Engineering',
      is_verified: 1
    },
    {
      id: 'usr_industry_tata',
      role: 'industry',
      name: 'Vikramaditya Sen (Head of CSR Innovation)',
      phone: '9876543260',
      email: 'csr.lead@tatasteel.com',
      org_id: 'org_tata_steel',
      department: 'Sustainable Livelihoods & Tech Deployment',
      is_verified: 1
    },
    {
      id: 'usr_pending_govt',
      role: 'govt_dept',
      name: 'Dr. Manoj Soren (District Medical Officer)',
      phone: '9876543270',
      email: 'dmo.dumka@jharkhand.gov.in',
      org_id: 'org_dept_health',
      department: 'District Health Society Dumka',
      is_verified: 0 // For demonstrating account approval queue
    }
  ];

  for (const user of users) {
    await db.query(
      `INSERT INTO users (id, role, name, phone, email, password_hash, org_id, department, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.role, user.name, user.phone, user.email, defaultPasswordHash, user.org_id, user.department, user.is_verified]
    );
  }

  // 4. Seed Clusters & Realistic Problems
  console.log('📍 Seeding Jharkhand Societal Problems across domains...');

  const problemsData = [
    {
      id: 'prob_fluoride_khunti',
      reporter_id: 'usr_citizen_ramesh',
      title: 'Severe Fluoride & Arsenic Contamination in Village Handpumps',
      raw_description: 'हमारे गांव मुरहू में चापाकल के पानी में फ्लोराइड की भारी मात्रा है। बच्चे और बुजुर्गों के दांत पीले और हड्डियां कमजोर हो रही हैं। 400 से ज्यादा परिवार प्रभावित हैं।',
      description_en: 'Severe fluoride and arsenic contamination detected in groundwater handpumps across Murhu block. Children and elders are suffering from skeletal fluorosis. Over 400 tribal families urgently need a localized low-cost filtration solution.',
      lat: 23.2750,
      lng: 85.2800,
      district: 'Khunti',
      category: 'Water Resources',
      subcategory: 'Groundwater Contamination & Filtration',
      affected_scope: 'Village/Ward',
      safety_risk: 1,
      infrastructure_type: 'Water Supply System',
      report_count: 8,
      daysPending: 12,
      status: 'published',
      media: [
        { url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60', type: 'photo', caption: 'Defective borewell water testing sample in Murhu' }
      ]
    },
    {
      id: 'prob_mine_fire_dhanbad',
      reporter_id: 'usr_citizen_sunita',
      title: 'Underground Coal Fire Smoke Inundating Bastacolla School & Dwellings',
      raw_description: 'झरिया-बस्ताकोला क्षेत्र में भूमिगत आग का जहरीला धुआं और कार्बन मोनोऑक्साइड प्राइमरी स्कूल के कमरों में घुस रहा है। जमीन धंसने का खतरा है।',
      description_en: 'Toxic carbon monoxide smoke and subsurface heat from Jharia underground coal fires are permeating classrooms of the local primary school. Risk of sudden ground subsidence requiring IoT continuous air-monitoring and stabilization.',
      lat: 23.7420,
      lng: 86.4180,
      district: 'Dhanbad',
      category: 'Environment',
      subcategory: 'Air Pollution & Mine Fire Hazard',
      affected_scope: 'Neighborhood',
      safety_risk: 1,
      infrastructure_type: 'Educational Facility',
      report_count: 14,
      daysPending: 18,
      status: 'in_development',
      media: [
        { url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&auto=format&fit=crop&q=60', type: 'photo', caption: 'Subsurface smoke emerging near residential perimeter' }
      ]
    },
    {
      id: 'prob_bridge_dumka',
      reporter_id: 'usr_citizen_sunita',
      title: 'Collapsed Wooden Culvert Cutting Off 5 Tribal Hamlets from PHC Hospital',
      raw_description: 'बरसात में मसानजोर के पास का लकड़ी का पुल बह गया। गर्भवती महिलाओं और बीमारों को खटिया पर उठाकर 8 किमी जंगल से ले जाना पड़ता है।',
      description_en: 'Seasonal flood washed away the primary culvert near Massanjore, completely isolating 5 tribal hamlets from the nearest Primary Health Center. Patients must be carried on cots for 8 km through forest trails.',
      lat: 24.1180,
      lng: 87.2750,
      district: 'Dumka',
      category: 'Urban Development',
      subcategory: 'Bridge & Rural Connectivity',
      affected_scope: 'Village/Ward',
      safety_risk: 1,
      infrastructure_type: 'Bridge & Culvert',
      report_count: 22,
      daysPending: 25,
      status: 'impact_verified',
      media: [
        { url: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&auto=format&fit=crop&q=60', type: 'photo', caption: 'Collapsed stream crossing during monsoon' }
      ]
    },
    {
      id: 'prob_solar_cold_storage_ranchi',
      reporter_id: 'usr_citizen_ramesh',
      title: 'High Post-Harvest Spoilage of Organic Tomatoes & Vegetables in Bero Block',
      raw_description: 'बेड़ो में टमाटर और सब्जियों की बंपर पैदावार होती है लेकिन कोल्ड स्टोरेज न होने के कारण किसान ₹2 किलो बेचने पर मजबूर हैं या फेंक देते हैं।',
      description_en: 'Severe post-harvest spoilage of organic tomatoes and fresh vegetables in Bero block due to zero localized cold storage. Farmers are forced into distress sales at ₹2/kg. Need decentralized solar-powered micro cold-storage.',
      lat: 23.2800,
      lng: 85.0300,
      district: 'Ranchi',
      category: 'Agriculture',
      subcategory: 'Post-Harvest Solar Storage',
      affected_scope: 'Village/Ward',
      safety_risk: 0,
      infrastructure_type: 'Civic Infrastructure',
      report_count: 11,
      daysPending: 8,
      status: 'deployed',
      media: [
        { url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=60', type: 'photo', caption: 'Vegetable harvest at Bero Mandi' }
      ]
    },
    {
      id: 'prob_transformer_bokaro',
      reporter_id: 'usr_citizen_sunita',
      title: 'Burnt 100kVA Distribution Transformer Plunging Chas PHC into Darkness',
      raw_description: 'चास के पास ट्रांसफार्मर में शॉर्ट सर्किट से आग लग गई और जल गया। 15 दिन से बिजली नहीं है, अस्पताल में दवाइयां और वैक्सीन खराब हो रही हैं।',
      description_en: 'Short circuit led to 100kVA transformer explosion in Chas, disrupting power supply for 15 days and risking vital vaccine cold-chain refrigeration at the community health center.',
      lat: 23.6350,
      lng: 86.1750,
      district: 'Bokaro',
      category: 'Energy',
      subcategory: 'Transformer & Power Grid Failure',
      affected_scope: 'Neighborhood',
      safety_risk: 1,
      infrastructure_type: 'Power Grid & Transformer',
      report_count: 16,
      daysPending: 15,
      status: 'pending_verification',
      media: [
        { url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=60', type: 'photo', caption: 'Burnt transformer unit at Chas junction' }
      ]
    },
    {
      id: 'prob_pothole_nh33_jsr',
      reporter_id: 'usr_citizen_sunita',
      title: 'Dangerous Crater-sized Potholes on NH-33 Dimna Ghat Industrial Corridor',
      raw_description: 'मानगो-डिमना चौक के पास सड़क पर 2 फीट गहरे गड्ढे हैं। भारी ट्रकों और दोपहिया वाहनों का रोज एक्सीडेंट हो रहा है।',
      description_en: 'Severe 2-feet deep craters and damaged bitumen surfacing near Dimna Chowk on NH-33 causing frequent vehicle rollovers and acute traffic congestion in the industrial logistics artery.',
      lat: 22.8420,
      lng: 86.2300,
      district: 'East Singhbhum',
      category: 'Urban Development',
      subcategory: 'Potholes & Highway Corridor Maintenance',
      affected_scope: 'Block/District',
      safety_risk: 1,
      infrastructure_type: 'Road Network',
      report_count: 29,
      daysPending: 6,
      status: 'claimed',
      media: [
        { url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60', type: 'photo', caption: 'Crater damage on industrial corridor' }
      ]
    }
  ];

  for (const prob of problemsData) {
    const embedding = await generateEmbedding(`${prob.title} ${prob.description_en} ${prob.category} ${prob.subcategory}`);
    
    // Cluster
    const clusterId = 'cluster_' + prob.id;
    await db.query(
      'INSERT INTO problem_clusters (id, canonical_problem_id, report_count, centroid_lat, centroid_lng, category) VALUES (?, ?, ?, ?, ?, ?)',
      [clusterId, prob.id, prob.report_count, prob.lat, prob.lng, prob.category]
    );

    // Calculate explainable priority
    const priority = calculatePriorityScore({
      safetyRisk: prob.safety_risk === 1,
      reportCount: prob.report_count,
      nearVulnerableFacility: prob.category === 'Education' || prob.category === 'Healthcare',
      daysPending: prob.daysPending,
      district: prob.district
    });

    const matchedOrgIds = ['org_bit_mesra', 'org_ism_dhanbad', 'org_nit_jsr', 'org_tata_steel'];

    await db.query(`
      INSERT INTO problems (
        id, reporter_id, title, raw_description, description_en,
        lat, lng, district, category, subcategory, affected_scope,
        safety_risk, infrastructure_type, priority_score, priority_band,
        priority_breakdown, status, cluster_id, embedding, matched_org_ids
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      prob.id,
      prob.reporter_id,
      prob.title,
      prob.raw_description,
      prob.description_en,
      prob.lat,
      prob.lng,
      prob.district,
      prob.category,
      prob.subcategory,
      prob.affected_scope,
      prob.safety_risk,
      prob.infrastructure_type,
      priority.totalScore,
      priority.band,
      JSON.stringify(priority.breakdown),
      prob.status,
      clusterId,
      JSON.stringify(embedding),
      JSON.stringify(matchedOrgIds)
    ]);

    // Media
    for (const m of prob.media) {
      const mId = 'media_' + Math.random().toString(36).substring(2, 8);
      await db.query(
        'INSERT INTO problem_media (id, problem_id, url, type, caption) VALUES (?, ?, ?, ?, ?)',
        [mId, prob.id, m.url, m.type, m.caption]
      );
    }

    // Confirmations
    const confirmUsers = ['usr_citizen_sunita', 'usr_citizen_ramesh'];
    for (let c = 0; c < confirmUsers.length; c++) {
      const uId = confirmUsers[c];
      if (uId !== prob.reporter_id) {
        const cId = 'conf_' + Math.random().toString(36).substring(2, 8);
        try {
          await db.query(
            'INSERT INTO confirmations (id, problem_id, user_id, comment) VALUES (?, ?, ?, ?)',
            [cId, prob.id, uId, `Confirmed by local community member in ${prob.district}`]
          );
        } catch (e) {}
      }
    }
  }

  // 5. Seed Teams, Proposals, Milestones, and Impact Reports
  console.log('💡 Seeding Proposals, Innovation Teams, Milestones & Impact Outcomes...');

  // Proposal 1: BIT Mesra for Murhu Fluoride
  const team1Id = 'team_bit_water';
  await db.query(`
    INSERT INTO teams (id, org_id, name, faculty_lead_id, member_ids, department)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    team1Id,
    'org_bit_mesra',
    'BIT Water Innovation Lab',
    'usr_faculty_sharma',
    JSON.stringify(['usr_faculty_sharma', 'usr_student_ananya']),
    'Civil & Environmental Engineering'
  ]);

  const prop1Id = 'prop_fluoride_filter';
  await db.query(`
    INSERT INTO proposals (
      id, problem_id, org_id, team_id, submitted_by, approach,
      tech_stack, budget, timeline_weeks, status, funding_requested, funding_pledged, pledged_by_org_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    prop1Id,
    'prob_fluoride_khunti',
    'org_bit_mesra',
    team1Id,
    'usr_faculty_sharma',
    'Community-scale activated alumina adsorption + solar-powered automatic backwash filtration unit producing 2,500 L/day potability.',
    'Solar PV, Activated Alumina Filters, IoT TDS/Fluoride Sensor node, GSM telemetry',
    280000,
    10,
    'accepted',
    280000,
    280000,
    'org_tata_steel'
  ]);

  // Milestones for Prop 1
  const ms1 = [
    { id: 'ms_f1', title: 'Water sample collection and laboratory baseline titration', status: 'completed', evidence_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800' },
    { id: 'ms_f2', title: 'Design & fabrication of 2,500L/day alumina solar filtration rig', status: 'in_progress', evidence_url: null },
    { id: 'ms_f3', title: 'Community handover & PRI water committee training', status: 'pending', evidence_url: null }
  ];
  for (const m of ms1) {
    await db.query(
      'INSERT INTO milestones (id, proposal_id, title, due_date, status, evidence_url) VALUES (?, ?, ?, ?, ?, ?)',
      [m.id, prop1Id, m.title, '2026-10-15', m.status, m.evidence_url]
    );
  }

  // Proposal 2: IIT ISM Dhanbad for Coal Fire (In Development)
  const prop2Id = 'prop_mine_iot';
  await db.query(`
    INSERT INTO proposals (
      id, problem_id, org_id, submitted_by, approach,
      tech_stack, budget, timeline_weeks, status, funding_requested, funding_pledged, pledged_by_org_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    prop2Id,
    'prob_mine_fire_dhanbad',
    'org_ism_dhanbad',
    'usr_student_ananya',
    'Subsurface nitrogen foaming fire suppression combined with solar LoRaWAN gas sensor mesh for early school evacuation alerts.',
    'LoRaWAN, ESP32, MQ-7 / CO Sensors, Nitrogen Grouting, Cloud Alert Gateway',
    420000,
    12,
    'accepted',
    420000,
    350000,
    'org_tata_steel'
  ]);

  // Proposal 3: Dumka Bamboo-Steel Composite Bridge (Deployed & Impact Verified)
  const prop3Id = 'prop_bridge_dumka_sol';
  await db.query(`
    INSERT INTO proposals (
      id, problem_id, org_id, submitted_by, approach,
      tech_stack, budget, timeline_weeks, status, funding_requested, funding_pledged, pledged_by_org_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    prop3Id,
    'prob_bridge_dumka',
    'org_nit_jsr',
    'usr_faculty_sharma',
    'Engineered treated bamboo-steel modular footbridge capable of 3-ton load with anti-corrosive concrete footings.',
    'Treated Dendrocalamus strictus bamboo, galvanized steel trusses, pre-cast concrete',
    350000,
    6,
    'completed',
    350000,
    350000,
    'org_tata_steel'
  ]);

  // Impact report for Dumka Bridge
  await db.query(`
    INSERT INTO impact_reports (
      id, proposal_id, beneficiaries_count, patents_filed, startups_created, metrics_json, summary, verified_by_admin, verified_by_admin_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'impact_dumka_bridge',
    prop3Id,
    4200,
    1,
    0,
    JSON.stringify({ travel_time_saved_minutes: 65, emergency_ambulances_passed: 48, cost_saved_vs_concrete: '72%' }),
    'Modular treated bamboo bridge successfully erected in 28 days. Direct foot and 2-wheeler access restored for 4,200 villagers across 5 hamlets.',
    1,
    'usr_admin_rajesh'
  ]);

  // Proposal 4: Solar Cold Storage Bero (Deployed & Impact Verified)
  const prop4Id = 'prop_solar_cold_storage';
  await db.query(`
    INSERT INTO proposals (
      id, problem_id, org_id, submitted_by, approach,
      tech_stack, budget, timeline_weeks, status, funding_requested, funding_pledged, pledged_by_org_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    prop4Id,
    'prob_solar_cold_storage_ranchi',
    'org_agro_startup',
    'usr_faculty_sharma',
    '5 Metric Ton Phase Change Material (PCM) solar micro-cold room with humidity control and mobile booking for farmer SHGs.',
    'PCM Thermal Storage, 5kW Solar Array, BLDC Compressor, Flutter Mobile App',
    550000,
    8,
    'completed',
    550000,
    550000,
    'org_tata_steel'
  ]);

  await db.query(`
    INSERT INTO impact_reports (
      id, proposal_id, beneficiaries_count, patents_filed, startups_created, metrics_json, summary, verified_by_admin, verified_by_admin_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'impact_bero_cold_storage',
    prop4Id,
    1850,
    1,
    1,
    JSON.stringify({ tomato_spoilage_reduced_percent: 88, farmer_income_increase_percent: 34, cold_room_uptime: '99.4%' }),
    'Zero-electricity grid solar cold room operational in Bero Mandi. Spoilage reduced from 40% to under 5%, raising monthly household farmer incomes by 34%.',
    1,
    'usr_admin_rajesh'
  ]);

  // 6. Seed Sample Notifications
  console.log('🔔 Seeding Notifications...');
  const sampleNotifications = [
    {
      id: 'notif_demo_1',
      user_id: 'usr_citizen_sunita',
      type: 'PROPOSAL_RECEIVED',
      title: 'Solution Proposal Submitted',
      message: 'BIT Mesra has submitted a technical proposal for your reported water problem in Khunti.',
      related_problem_id: 'prob_fluoride_khunti',
      is_read: 0
    },
    {
      id: 'notif_demo_2',
      user_id: 'usr_admin_rajesh',
      type: 'VERIFICATION_REQUIRED',
      title: 'High Priority Report in Bokaro',
      message: 'New Critical priority problem reported in Chas regarding burnt transformer disrupting health clinic.',
      related_problem_id: 'prob_transformer_bokaro',
      is_read: 0
    },
    {
      id: 'notif_demo_3',
      user_id: 'usr_faculty_sharma',
      type: 'FUNDING_PLEDGED',
      title: 'CSR Grant Pledged: ₹2,80,000',
      message: 'Tata Steel Foundation has pledged full funding for your Murhu Fluoride Filtration project.',
      related_proposal_id: prop1Id,
      is_read: 1
    }
  ];

  for (const n of sampleNotifications) {
    await db.query(`
      INSERT INTO notifications (id, user_id, type, title, message, related_problem_id, related_proposal_id, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [n.id, n.user_id, n.type, n.title, n.message, n.related_problem_id || null, n.related_proposal_id || null, n.is_read]);
  }

  console.log('✅ SamasyaSetu Jharkhand Demo Seeding Complete!');
  console.log('--------------------------------------------------');
  console.log('Demo Login Accounts (Password for all: Password123!)');
  console.log('1. Citizen:      citizen@samsyasetu.in');
  console.log('2. Admin:        admin@samsyasetu.in');
  console.log('3. Govt Dept:    dept.water@jharkhand.gov.in');
  console.log('4. Faculty:      prof.sharma@bitmesra.ac.in');
  console.log('5. Student:      student.ananya@iitism.ac.in');
  console.log('6. Industry/CSR: csr.lead@tatasteel.com');
  console.log('--------------------------------------------------');
}

if (require.main === module) {
  seed().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}

module.exports = seed;

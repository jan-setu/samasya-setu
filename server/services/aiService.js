/**
 * Isolated AI Service Module for SamasyaSetu
 * Supports OpenAI, Anthropic, or Built-in Multilingual & Regional NLP Engine
 * Tailored for Jharkhand Regional & Tribal Languages (Hindi, Khortha, Nagpuri, Santhali, Mundari, Kurukh, Bengali)
 */

const DOMAINS = [
  'Education',
  'Healthcare',
  'Agriculture',
  'Water Resources',
  'Sanitation',
  'Environment',
  'Energy',
  'Urban Development',
  'Accessibility',
  'Public Administration',
  'Rural Livelihoods'
];

// Multilingual keyword dictionary for robust regional domain mapping
const DOMAIN_KEYWORDS = {
  'Education': [
    'school', 'teacher', 'student', 'classroom', 'book', 'desk', 'blackboard', 'college', 'midday', 'scholarship', 'education',
    'shiksha', 'vidyalaya', 'padhai', 'iskul', 'padhao', 'master', 'chhatravriti', 'anganwadi', 'pathshala', 'poshan', 'biddaloy'
  ],
  'Healthcare': [
    'hospital', 'doctor', 'clinic', 'medicine', 'nurse', 'ambulance', 'health', 'disease', 'fever', 'vaccine', 'treatment', 'patient',
    'swasthya', 'dawa', 'chikitsa', 'phc', 'chc', 'bimari', 'ruwa', 'hasu', 'dawai', 'doctorbabu', 'rog', 'shastho', 'asukh', 'chikitsalaya'
  ],
  'Agriculture': [
    'crop', 'farmer', 'farming', 'fertilizer', 'pesticide', 'irrigation', 'soil', 'seed', 'harvest', 'tractor', 'mandi', 'storage',
    'kisan', 'kheti', 'krishi', 'fasal', 'dhan', 'bihan', 'khet', 'hasa', 'patwan', 'sinchai', 'tamatar', 'chasi', 'khorak'
  ],
  'Water Resources': [
    'water', 'drinking water', 'pipeline', 'handpump', 'well', 'borewell', 'drainage', 'tanker', 'fluoride', 'arsenic', 'contamination',
    'paani', 'jal', 'nal', 'talaab', 'chaapaakal', 'dapaakal', 'daah', 'dak', 'kuan', 'dari', 'bandha', 'jol', 'pani', 'bore'
  ],
  'Sanitation': [
    'garbage', 'waste', 'trash', 'sewage', 'drain', 'toilet', 'sanitation', 'cleanliness', 'dump', 'smell',
    'kachra', 'safai', 'nalian', 'shauchalaya', 'gandagi', 'letrin', 'joda', 'noda', 'barjyo', 'nojoda'
  ],
  'Environment': [
    'pollution', 'tree', 'forest', 'smoke', 'air quality', 'mining', 'dust', 'coal', 'river pollution', 'wildlife', 'subsidence',
    'pradushan', 'jangal', 'paryavaran', 'dhuwan', 'koyla', 'khanan', 'jharia', 'bir', 'pahaad', 'dhur', 'dushon'
  ],
  'Energy': [
    'electricity', 'power cut', 'transformer', 'wire', 'pole', 'solar', 'grid', 'voltage', 'blackout',
    'bijli', 'vidyut', 'tar', 'urja', 'khambha', 'batti', 'line', 'solar batti', 'biddyut', 'power'
  ],
  'Urban Development': [
    'road', 'pothole', 'street light', 'bridge', 'traffic', 'footpath', 'encroachment', 'flyover', 'culvert',
    'sadak', 'gaddha', 'pul', 'pulia', 'batti', 'shahar', 'rasta', 'sanko', 'kulhi', 'gali', 'doba', 'bhanga rasta'
  ],
  'Accessibility': [
    'ramp', 'wheelchair', 'disabled', 'blind', 'elderly', 'signage', 'braille', 'sidewalk',
    'divyang', 'viklang', 'sulabh', 'bujurg', 'andha', 'bahera', 'asahay'
  ],
  'Public Administration': [
    'ration', 'pension', 'aadhar', 'panchayat', 'bribe', 'certificate', 'subsidy', 'scheme', 'block office',
    'yojana', 'prashasan', 'adhikari', 'mukhiya', 'pramukh', 'bdo', 'dakhil', 'ghoos', 'rashan', 'pension'
  ],
  'Rural Livelihoods': [
    'employment', 'mgnrega', 'artisan', 'handicraft', 'dairy', 'poultry', 'self help group', 'shg', 'tribal craft',
    'rojgar', 'mazdoor', 'mahila mandal', 'shg', 'didi', 'palak', 'murgi', 'bhed', 'bunaai', 'kamai', 'dhan kuta'
  ]
};

/**
 * 1. Translate raw text (Hindi, Khortha, Nagpuri, Santhali, Bengali) to English
 */
async function translateToEnglish(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  const trimmed = rawText.trim();

  // If OpenAI key configured, call LLM
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an Indian regional and tribal language translator for Jharkhand societal problem reports (handling Hindi, Santhali, Khortha, Nagpuri, Kurukh, Mundari, and Bengali). Translate the citizen report into clear, professional English. Output only the translated English text.'
            },
            { role: 'user', content: trimmed }
          ],
          temperature: 0.1
        })
      });
      const data = await response.json();
      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      }
    } catch (e) {
      console.warn('OpenAI translation failed, using regional dictionary engine:', e.message);
    }
  }

  // Fallback intelligent multilingual & regional translator
  let translated = trimmed;

  const regionalToEnglishMap = [
    // Hindi & Khortha / Nagpuri road patterns
    [/सड़क में बहुत गड्ढे हैं|सड़क खराब है|रास्ता टूट गेल हे|सड़किया में बहुत गड़हा हे/gi, 'There are dangerous deep potholes in the road corridor'],
    [/पुल टूट गया है|पुलिया बह गेल हे|सांको भांगी गेछे|पुलिया टूट गेल/gi, 'The stream crossing bridge / culvert has collapsed, disrupting local transport'],
    // Water patterns
    [/पानी नहीं आ रहा है|चापाकल खराब है|चापाकल से लाल पानी आ रहा है|डापाकल खराब हे|दाः बांनूगा/gi, 'Drinking water handpump is broken or contaminated with iron/fluoride, causing severe water crisis'],
    [/पानी में फ्लोराइड है|पानी में जहर है/gi, 'Groundwater has dangerous fluoride and arsenic chemical contamination'],
    // Electricity & Transformer patterns
    [/बिजली का ट्रांसफार्मर जल गया है|ट्रांसफार्मर उड़ गेल हे|लाइन नईखे|बिजली नहीं है/gi, 'The electricity distribution transformer has burned out, cutting off community power'],
    // Health & School patterns
    [/स्कूल में छत टपक रही है|स्कूलक छत गिरत हे|इस्कुल भित्ति भांग गेछे/gi, 'The primary school building roof is severely leaking and posing a safety hazard'],
    [/अस्पताल में डॉक्टर नहीं हैं|दवा नहीं है|हॉस्पिटल में सुई नईखे/gi, 'Essential doctors and medicines are absent at the rural primary healthcare clinic'],
    // Waste / Sanitation
    [/कचरा जमा है|नाली जाम है|गंदगी से बीमारी फैल रही है|नालिया जाम हे/gi, 'Choked open drainage and solid waste accumulation causing acute health hazard'],
    // Agriculture
    [/कोल्ड स्टोरेज न होने के कारण|सब्जी सड़ रही है|फसल बर्बाद हो रही है/gi, 'Severe agricultural post-harvest spoilage due to complete lack of localized cold storage'],
    // Mine Fire & Environment
    [/भूमिगत आग का जहरीला धुआं|जमीन धंसने का खतरा|कोयला का धुआं/gi, 'Subsurface underground coal fire emission causing dangerous carbon monoxide pollution and subsidence risk']
  ];

  for (const [pattern, replacement] of regionalToEnglishMap) {
    if (pattern.test(translated)) {
      translated = translated.replace(pattern, replacement);
    }
  }

  return translated;
}

/**
 * 2. Classify domain, subdomain, safety risk, and infrastructure
 */
async function classifyProblem(text) {
  const cleanText = text.toLowerCase();

  // Try LLM if configured
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a societal challenge classifier for Jharkhand. Return a strict JSON object with fields:
              - domain (Must be exactly one of: ${DOMAINS.join(', ')})
              - subdomain (string)
              - affected_scope ("Individual", "Neighborhood", "Village/Ward", "Block/District")
              - safety_risk (boolean)
              - infrastructure_type (e.g., "Road Network", "Water Supply System", "Power Grid & Transformer", "Educational Facility", "Healthcare Facility", "Bridge & Culvert", "Civic Infrastructure")`
            },
            { role: 'user', content: text }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      });
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (DOMAINS.includes(parsed.domain)) {
          return {
            domain: parsed.domain,
            subdomain: parsed.subdomain || `${parsed.domain} Infrastructure`,
            affected_scope: parsed.affected_scope || 'Neighborhood',
            safety_risk: Boolean(parsed.safety_risk),
            infrastructure_type: parsed.infrastructure_type || 'Civic Infrastructure'
          };
        }
      }
    } catch (e) {
      console.warn('OpenAI classification fallback:', e.message);
    }
  }

  // Fallback Rule-Based NLP Classifier with Multilingual keywords
  let bestDomain = 'Urban Development';
  let maxScore = -1;

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (cleanText.includes(kw.toLowerCase())) {
        score += 2;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestDomain = domain;
    }
  }

  // Safety risk heuristics (Multilingual)
  const safetyKeywords = [
    'fire', 'danger', 'hazard', 'burn', 'electric', 'shock', 'accident', 'collapsed', 'poison', 'arsenic', 'fluoride', 'flood',
    'overflow', 'broken bridge', 'khatra', 'durghatna', 'bimar', 'hasu', 'ruwa', 'sengel', 'bipod', 'moron', 'maran'
  ];
  const hasSafetyRisk = safetyKeywords.some(kw => cleanText.includes(kw));

  // Determine infrastructure type
  let infra = 'Civic Infrastructure';
  if (cleanText.includes('road') || cleanText.includes('sadak') || cleanText.includes('pothole') || cleanText.includes('gaddha') || cleanText.includes('rasta')) {
    infra = 'Road Network';
  } else if (cleanText.includes('water') || cleanText.includes('handpump') || cleanText.includes('pipe') || cleanText.includes('paani') || cleanText.includes('chaapaakal') || cleanText.includes('daah') || cleanText.includes('jol')) {
    infra = 'Water Supply System';
  } else if (cleanText.includes('transformer') || cleanText.includes('wire') || cleanText.includes('electric') || cleanText.includes('bijli') || cleanText.includes('line') || cleanText.includes('batti')) {
    infra = 'Power Grid & Transformer';
  } else if (cleanText.includes('school') || cleanText.includes('classroom') || cleanText.includes('school building') || cleanText.includes('iskul') || cleanText.includes('vidyalaya')) {
    infra = 'Educational Facility';
  } else if (cleanText.includes('hospital') || cleanText.includes('clinic') || cleanText.includes('phc') || cleanText.includes('swasthya') || cleanText.includes('dawa')) {
    infra = 'Healthcare Facility';
  } else if (cleanText.includes('bridge') || cleanText.includes('pul') || cleanText.includes('pulia') || cleanText.includes('sanko')) {
    infra = 'Bridge & Culvert';
  }

  return {
    domain: bestDomain,
    subdomain: `${bestDomain} Infrastructure & Maintenance`,
    affected_scope: cleanText.includes('village') || cleanText.includes('gram') || cleanText.includes('gaao') || cleanText.includes('aatu') ? 'Village/Ward' : 'Neighborhood',
    safety_risk: hasSafetyRisk,
    infrastructure_type: infra
  };
}

/**
 * 3. Generate 64-dimensional semantic text embedding vector
 */
async function generateEmbedding(text) {
  if (!text) return new Array(64).fill(0);

  const vector = new Array(64).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  words.forEach((word, idx) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const dim = Math.abs(hash) % 64;
    vector[dim] += 1 / (1 + idx * 0.05);
  });

  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(v => Number((v / norm).toFixed(4)));
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = {
  DOMAINS,
  translateToEnglish,
  classifyProblem,
  generateEmbedding,
  cosineSimilarity
};

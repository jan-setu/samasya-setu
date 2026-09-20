/**
 * Rule-Based Explainable Priority Scoring Engine
 * Never relies on opaque LLM hallucinated scores.
 * Every point is traceable and displayed transparently to citizens, admins, and researchers.
 */

// Priority index for 24 Jharkhand districts (NITI Aayog aspirational district weightage)
const DISTRICT_PRIORITY_INDEX = {
  'Khunti': 10,
  'Dumka': 10,
  'West Singhbhum': 10,
  'Pakur': 10,
  'Sahibganj': 10,
  'Simdega': 9,
  'Latehar': 9,
  'Gumla': 9,
  'Garhwa': 9,
  'Chatra': 8,
  'Godda': 8,
  'Palamu': 8,
  'Giridih': 8,
  'Jamtara': 7,
  'Koderma': 7,
  'Lohardaga': 7,
  'Saraikela Kharsawan': 7,
  'Hazaribagh': 6,
  'Ramgarh': 6,
  'Deoghar': 6,
  'Bokaro': 5,
  'Dhanbad': 5,
  'East Singhbhum': 4,
  'Ranchi': 4
};

/**
 * Calculates priority score and explainable breakdown
 * @param {Object} params
 * @param {boolean} params.safetyRisk - Has safety or public health hazard
 * @param {number} params.reportCount - Cluster duplicate/citizen report count
 * @param {boolean} params.nearVulnerableFacility - Near school, hospital, elderly center
 * @param {number} params.daysPending - Number of days since report was logged
 * @param {string} params.district - Jharkhand district name
 * @returns {Object} { totalScore, band, breakdown }
 */
function calculatePriorityScore({
  safetyRisk = false,
  reportCount = 1,
  nearVulnerableFacility = false,
  daysPending = 0,
  district = 'Ranchi'
}) {
  const breakdown = {
    safetyRiskPoints: 0,
    volumePoints: 0,
    vulnerableGroupPoints: 0,
    pendingAgePoints: 0,
    districtIndexPoints: 0,
    explanations: []
  };

  // 1. Safety / Health risk flag: +30
  if (safetyRisk) {
    breakdown.safetyRiskPoints = 30;
    breakdown.explanations.push('High safety/public hazard detected (+30)');
  }

  // 2. Affected people via cluster report_count (log-scaled): up to +25
  const count = Math.max(1, reportCount);
  const volPoints = Math.min(25, Math.round(Math.log2(count + 1) * 7.5));
  breakdown.volumePoints = volPoints;
  breakdown.explanations.push(`${count} citizen confirmation${count > 1 ? 's' : ''} reported (+${volPoints})`);

  // 3. Vulnerable group nearby: +20
  if (nearVulnerableFacility) {
    breakdown.vulnerableGroupPoints = 20;
    breakdown.explanations.push('Direct proximity to school/hospital/elderly care (+20)');
  }

  // 4. Days pending: up to +15 (1.5 pts per day, max 15)
  const pendingDays = Math.max(0, Math.floor(daysPending));
  const agePoints = Math.min(15, Math.round(pendingDays * 1.5));
  breakdown.pendingAgePoints = agePoints;
  if (pendingDays > 0) {
    breakdown.explanations.push(`Pending resolution for ${pendingDays} days (+${agePoints})`);
  }

  // 5. District backwardness / priority index: up to +10
  const distPoints = DISTRICT_PRIORITY_INDEX[district] || 5;
  breakdown.districtIndexPoints = distPoints;
  breakdown.explanations.push(`${district} district priority tier index (+${distPoints})`);

  // Compute Total
  const totalScore = Math.min(
    100,
    breakdown.safetyRiskPoints +
    breakdown.volumePoints +
    breakdown.vulnerableGroupPoints +
    breakdown.pendingAgePoints +
    breakdown.districtIndexPoints
  );

  // Band classification
  let band = 'Low';
  if (totalScore >= 80) band = 'Critical';
  else if (totalScore >= 60) band = 'High';
  else if (totalScore >= 35) band = 'Medium';

  return {
    totalScore,
    band,
    breakdown
  };
}

module.exports = {
  DISTRICT_PRIORITY_INDEX,
  calculatePriorityScore
};

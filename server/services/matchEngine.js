/**
 * Organization Expertise Matcher
 * Matches societal problems with the most suitable Universities, Research Labs, Startups, and Industries.
 */
const db = require('../db');
const { cosineSimilarity } = require('./aiService');

/**
 * Finds top matching organizations for a given problem
 * @param {Object} problem
 * @param {string} problem.category
 * @param {Array<number>} problem.embedding
 * @param {string} [problem.district]
 * @returns {Promise<Array<Object>>} Top matching organizations with scores
 */
async function matchOrganizationsForProblem(problem) {
  const orgsResult = await db.query(
    "SELECT id, name, type, district, expertise_tags, expertise_embedding FROM organizations WHERE type != 'govt_dept'"
  );

  const scoredOrgs = [];

  for (const org of orgsResult.rows) {
    let score = 0;
    let tags = [];
    try {
      tags = typeof org.expertise_tags === 'string' ? JSON.parse(org.expertise_tags) : (org.expertise_tags || []);
    } catch (e) {
      tags = [];
    }

    // 1. Tag matching with problem category
    const categoryLower = (problem.category || '').toLowerCase();
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      if (categoryLower.includes(tagLower) || tagLower.includes(categoryLower)) {
        score += 35;
      }
    }

    // 2. Vector cosine similarity if embeddings are present
    if (problem.embedding && org.expertise_embedding) {
      try {
        const orgVec = typeof org.expertise_embedding === 'string' 
          ? JSON.parse(org.expertise_embedding) 
          : org.expertise_embedding;
        const sim = cosineSimilarity(problem.embedding, orgVec);
        score += sim * 40;
      } catch (e) {
        // Ignore vector error
      }
    }

    // 3. District proximity bonus
    if (org.district && problem.district && org.district.toLowerCase() === problem.district.toLowerCase()) {
      score += 15;
    }

    // 4. University / Research lab baseline fit bonus
    if (org.type === 'university' || org.type === 'research_lab') {
      score += 10;
    }

    scoredOrgs.push({
      org_id: org.id,
      name: org.name,
      type: org.type,
      district: org.district,
      match_score: Math.min(100, Math.round(score))
    });
  }

  // Sort descending by score and take top 5
  scoredOrgs.sort((a, b) => b.match_score - a.match_score);
  return scoredOrgs.slice(0, 5);
}

module.exports = {
  matchOrganizationsForProblem
};

/**
 * Geo-spatial & Semantic Embedding Duplicate Clustering Service
 */
const db = require('../db');
const { cosineSimilarity } = require('./aiService');

/**
 * Calculates Great-Circle distance in meters between two lat/lng coordinates (Haversine Formula)
 */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Finds or creates a cluster for a new problem report
 * @param {Object} problemData
 * @param {string} problemData.id
 * @param {number} problemData.lat
 * @param {number} problemData.lng
 * @param {string} problemData.category
 * @param {Array<number>} problemData.embedding
 * @returns {Promise<{ clusterId: string, isDuplicate: boolean, matchedCanonicalId: string|null, reportCount: number }>}
 */
async function clusterProblem({ id, lat, lng, category, embedding }) {
  // 1. Fetch existing active clusters in the same domain/category or all clusters
  const clustersResult = await db.query(
    'SELECT * FROM problem_clusters WHERE category = ? OR category IS NULL',
    [category]
  );

  let bestCluster = null;
  let bestDistance = Infinity;

  for (const cluster of clustersResult.rows) {
    const dist = getDistanceMeters(lat, lng, cluster.centroid_lat, cluster.centroid_lng);
    
    // Within 600m radius threshold
    if (dist <= 600) {
      // Check embedding similarity against the canonical problem
      if (cluster.canonical_problem_id) {
        const canonRes = await db.query(
          'SELECT embedding FROM problems WHERE id = ?',
          [cluster.canonical_problem_id]
        );
        if (canonRes.rows.length > 0 && canonRes.rows[0].embedding) {
          try {
            const canonVec = JSON.parse(canonRes.rows[0].embedding);
            const sim = cosineSimilarity(embedding, canonVec);
            // High semantic similarity (> 0.70) in close radius
            if (sim >= 0.70 && dist < bestDistance) {
              bestCluster = cluster;
              bestDistance = dist;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      } else if (dist < bestDistance) {
        bestCluster = cluster;
        bestDistance = dist;
      }
    }
  }

  if (bestCluster) {
    // Increment cluster report count
    const updatedCount = (bestCluster.report_count || 1) + 1;
    // Update centroid slightly towards new report
    const newLat = (bestCluster.centroid_lat * bestCluster.report_count + lat) / updatedCount;
    const newLng = (bestCluster.centroid_lng * bestCluster.report_count + lng) / updatedCount;

    await db.query(
      'UPDATE problem_clusters SET report_count = ?, centroid_lat = ?, centroid_lng = ? WHERE id = ?',
      [updatedCount, newLat, newLng, bestCluster.id]
    );

    return {
      clusterId: bestCluster.id,
      isDuplicate: true,
      matchedCanonicalId: bestCluster.canonical_problem_id,
      reportCount: updatedCount
    };
  }

  // Create new unique cluster
  const clusterId = 'cluster_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  await db.query(
    'INSERT INTO problem_clusters (id, canonical_problem_id, report_count, centroid_lat, centroid_lng, category) VALUES (?, ?, ?, ?, ?, ?)',
    [clusterId, id, 1, lat, lng, category]
  );

  return {
    clusterId,
    isDuplicate: false,
    matchedCanonicalId: id,
    reportCount: 1
  };
}

module.exports = {
  getDistanceMeters,
  clusterProblem
};

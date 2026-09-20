const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const queueWorker = require('../services/queueWorker');
const { calculatePriorityScore } = require('../services/priorityEngine');

/**
 * POST /api/problems
 * Citizen problem submission - non-blocking AI pipeline trigger
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title,
      raw_description,
      lat,
      lng,
      district,
      media = [] // Array of { url, type, caption }
    } = req.body;

    if (!title || !raw_description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const latitude = Number(lat) || 23.3441; // Default Ranchi
    const longitude = Number(lng) || 85.3096;
    const targetDistrict = district || 'Ranchi';

    const problemId = 'prob_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Baseline priority before AI enrichment
    const initialPriority = calculatePriorityScore({
      safetyRisk: false,
      reportCount: 1,
      nearVulnerableFacility: false,
      daysPending: 0,
      district: targetDistrict
    });

    // 1. Save problem with initial status = 'processing'
    await db.query(`
      INSERT INTO problems (
        id, reporter_id, title, raw_description, lat, lng, district,
        priority_score, priority_band, priority_breakdown, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      problemId,
      req.user.id,
      title.trim(),
      raw_description.trim(),
      latitude,
      longitude,
      targetDistrict,
      initialPriority.totalScore,
      initialPriority.band,
      JSON.stringify(initialPriority.breakdown),
      'processing'
    ]);

    // 2. Insert media items if any
    if (Array.isArray(media) && media.length > 0) {
      for (const item of media) {
        if (item.url) {
          const mediaId = 'media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
          await db.query(`
            INSERT INTO problem_media (id, problem_id, url, type, caption)
            VALUES (?, ?, ?, ?, ?)
          `, [
            mediaId,
            problemId,
            item.url,
            item.type || 'photo',
            item.caption || ''
          ]);
        }
      }
    }

    // 3. Auto-add reporter confirmation
    const confId = 'conf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    await db.query(`
      INSERT INTO confirmations (id, problem_id, user_id, comment)
      VALUES (?, ?, ?, ?)
    `, [confId, problemId, req.user.id, 'Original Reporter']);

    // 4. Non-blocking trigger of AI pipeline
    queueWorker.enqueueProblem(problemId);

    res.status(201).json({
      message: 'Problem report registered successfully. AI analysis and duplicate clustering running in background.',
      problemId,
      status: 'processing'
    });
  } catch (err) {
    console.error('Submit problem error:', err);
    res.status(500).json({ error: 'Failed to submit problem report: ' + err.message });
  }
});

/**
 * GET /api/problems
 * Public & authenticated list of problems with filtering
 */
router.get('/', async (req, res) => {
  try {
    const { district, category, status, priority_band, search, limit = 50 } = req.query;

    let query = `
      SELECT p.*,
             u.name as reporter_name,
             u.role as reporter_role,
             pc.report_count as cluster_reports,
             (SELECT COUNT(*) FROM confirmations c WHERE c.problem_id = p.id) as confirmation_count,
             (SELECT COUNT(*) FROM proposals pr WHERE pr.problem_id = p.id) as proposal_count
      FROM problems p
      LEFT JOIN users u ON p.reporter_id = u.id
      LEFT JOIN problem_clusters pc ON p.cluster_id = pc.id
      WHERE 1=1
    `;
    const params = [];

    if (district && district !== 'all') {
      query += ` AND p.district = ?`;
      params.push(district);
    }
    if (category && category !== 'all') {
      query += ` AND p.category = ?`;
      params.push(category);
    }
    if (status && status !== 'all') {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    if (priority_band && priority_band !== 'all') {
      query += ` AND p.priority_band = ?`;
      params.push(priority_band);
    }
    if (search) {
      query += ` AND (p.title LIKE ? OR p.raw_description LIKE ? OR p.description_en LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY p.priority_score DESC, p.created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const result = await db.query(query, params);

    // Fetch media for each problem
    const problemsWithMedia = await Promise.all(
      result.rows.map(async (p) => {
        const mediaRes = await db.query('SELECT * FROM problem_media WHERE problem_id = ?', [p.id]);
        return {
          ...p,
          media: mediaRes.rows,
          priority_breakdown: typeof p.priority_breakdown === 'string' ? JSON.parse(p.priority_breakdown || '{}') : p.priority_breakdown
        };
      })
    );

    res.json({ problems: problemsWithMedia });
  } catch (err) {
    console.error('Fetch problems error:', err);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

/**
 * GET /api/problems/my-reports
 */
router.get('/my-reports', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*,
             pc.report_count as cluster_reports,
             (SELECT COUNT(*) FROM confirmations c WHERE c.problem_id = p.id) as confirmation_count,
             (SELECT COUNT(*) FROM proposals pr WHERE pr.problem_id = p.id) as proposal_count
      FROM problems p
      LEFT JOIN problem_clusters pc ON p.cluster_id = pc.id
      WHERE p.reporter_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    const problemsWithMedia = await Promise.all(
      result.rows.map(async (p) => {
        const mediaRes = await db.query('SELECT * FROM problem_media WHERE problem_id = ?', [p.id]);
        return {
          ...p,
          media: mediaRes.rows,
          priority_breakdown: typeof p.priority_breakdown === 'string' ? JSON.parse(p.priority_breakdown || '{}') : p.priority_breakdown
        };
      })
    );

    res.json({ reports: problemsWithMedia });
  } catch (err) {
    console.error('Fetch my reports error:', err);
    res.status(500).json({ error: 'Failed to fetch your reports' });
  }
});

/**
 * GET /api/problems/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*,
             u.name as reporter_name,
             u.email as reporter_email,
             u.phone as reporter_phone,
             pc.report_count as cluster_reports,
             pc.canonical_problem_id
      FROM problems p
      LEFT JOIN users u ON p.reporter_id = u.id
      LEFT JOIN problem_clusters pc ON p.cluster_id = pc.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const problem = result.rows[0];
    const mediaRes = await db.query('SELECT * FROM problem_media WHERE problem_id = ?', [problem.id]);
    const confRes = await db.query(`
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM confirmations c
      JOIN users u ON c.user_id = u.id
      WHERE c.problem_id = ?
      ORDER BY c.created_at DESC
    `, [problem.id]);
    
    const verifRes = await db.query(`
      SELECT v.*, u.name as admin_name
      FROM verifications v
      JOIN users u ON v.admin_id = u.id
      WHERE v.problem_id = ?
      ORDER BY v.timestamp DESC
    `, [problem.id]);

    const propRes = await db.query(`
      SELECT pr.*, o.name as org_name, o.type as org_type, u.name as lead_name
      FROM proposals pr
      JOIN organizations o ON pr.org_id = o.id
      JOIN users u ON pr.submitted_by = u.id
      WHERE pr.problem_id = ?
      ORDER BY pr.created_at DESC
    `, [problem.id]);

    // Matched org details
    let matchedOrgs = [];
    if (problem.matched_org_ids) {
      try {
        const orgIds = typeof problem.matched_org_ids === 'string' ? JSON.parse(problem.matched_org_ids) : problem.matched_org_ids;
        if (Array.isArray(orgIds) && orgIds.length > 0) {
          const placeholders = orgIds.map(() => '?').join(',');
          const orgsRes = await db.query(
            `SELECT id, name, type, district, expertise_tags FROM organizations WHERE id IN (${placeholders})`,
            orgIds
          );
          matchedOrgs = orgsRes.rows;
        }
      } catch (e) {
        matchedOrgs = [];
      }
    }

    res.json({
      problem: {
        ...problem,
        media: mediaRes.rows,
        confirmations: confRes.rows,
        verifications: verifRes.rows,
        proposals: propRes.rows,
        matchedOrgs,
        priority_breakdown: typeof problem.priority_breakdown === 'string' ? JSON.parse(problem.priority_breakdown || '{}') : problem.priority_breakdown
      }
    });
  } catch (err) {
    console.error('Fetch problem detail error:', err);
    res.status(500).json({ error: 'Failed to fetch problem details' });
  }
});

/**
 * POST /api/problems/:id/confirm
 * Citizen confirmation "I have this problem too"
 */
router.post('/:id/confirm', requireAuth, async (req, res) => {
  try {
    const problemId = req.params.id;
    const userId = req.user.id;
    const { comment = '' } = req.body;

    // Check if already confirmed
    const existing = await db.query(
      'SELECT id FROM confirmations WHERE problem_id = ? AND user_id = ?',
      [problemId, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You have already confirmed this issue.' });
    }

    const confId = 'conf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    await db.query(
      'INSERT INTO confirmations (id, problem_id, user_id, comment) VALUES (?, ?, ?, ?)',
      [confId, problemId, userId, comment]
    );

    // Increment cluster count if problem has a cluster
    const probRes = await db.query('SELECT * FROM problems WHERE id = ?', [problemId]);
    if (probRes.rows.length > 0) {
      const prob = probRes.rows[0];
      let currentReportCount = 1;

      if (prob.cluster_id) {
        await db.query('UPDATE problem_clusters SET report_count = report_count + 1 WHERE id = ?', [prob.cluster_id]);
        const clRes = await db.query('SELECT report_count FROM problem_clusters WHERE id = ?', [prob.cluster_id]);
        if (clRes.rows.length > 0) {
          currentReportCount = clRes.rows[0].report_count;
        }
      }

      // Recalculate priority score dynamically with increased volume
      const updatedPriority = calculatePriorityScore({
        safetyRisk: prob.safety_risk === 1 || prob.safety_risk === true,
        reportCount: currentReportCount,
        nearVulnerableFacility: prob.category === 'Education' || prob.category === 'Healthcare',
        daysPending: 0,
        district: prob.district
      });

      await db.query(`
        UPDATE problems SET
          priority_score = ?,
          priority_band = ?,
          priority_breakdown = ?
        WHERE id = ?
      `, [
        updatedPriority.totalScore,
        updatedPriority.band,
        JSON.stringify(updatedPriority.breakdown),
        problemId
      ]);
    }

    res.json({ message: 'Issue confirmation recorded. Priority score updated.' });
  } catch (err) {
    console.error('Confirmation error:', err);
    res.status(500).json({ error: 'Failed to record confirmation: ' + err.message });
  }
});

module.exports = router;

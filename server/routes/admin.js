const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// All admin routes require admin or govt_dept role
router.use(requireAuth);
router.use(requireRole(['admin', 'govt_dept']));

/**
 * GET /api/admin/pending-users
 * List govt and admin accounts pending verification
 */
router.get('/pending-users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.role, u.name, u.email, u.phone, u.department, u.created_at,
             o.name as org_name, o.type as org_type, o.district as org_district
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.id
      WHERE u.is_verified = 0 AND u.role IN ('admin', 'govt_dept')
      ORDER BY u.created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Fetch pending users error:', err);
    res.status(500).json({ error: 'Failed to fetch pending user registrations' });
  }
});

/**
 * POST /api/admin/approve-user/:id
 */
router.post('/approve-user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await db.query('UPDATE users SET is_verified = 1 WHERE id = ?', [userId]);

    // Send notification
    const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    await db.query(`
      INSERT INTO notifications (id, user_id, type, title, message)
      VALUES (?, ?, ?, ?, ?)
    `, [
      notifId,
      userId,
      'ACCOUNT_APPROVED',
      'Account Approved',
      'Your administrator / government department account has been verified and approved.'
    ]);

    res.json({ message: 'User account has been verified and activated.' });
  } catch (err) {
    console.error('Approve user error:', err);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

/**
 * POST /api/admin/reject-user/:id
 */
router.post('/reject-user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await db.query('DELETE FROM users WHERE id = ? AND is_verified = 0', [userId]);
    res.json({ message: 'User registration rejected and removed.' });
  } catch (err) {
    console.error('Reject user error:', err);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

/**
 * GET /api/admin/verification-queue
 */
router.get('/verification-queue', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*,
             u.name as reporter_name,
             u.email as reporter_email,
             u.role as reporter_role,
             pc.report_count as cluster_reports,
             (SELECT COUNT(*) FROM problem_media pm WHERE pm.problem_id = p.id) as media_count
      FROM problems p
      LEFT JOIN users u ON p.reporter_id = u.id
      LEFT JOIN problem_clusters pc ON p.cluster_id = pc.id
      WHERE p.status IN ('pending_verification', 'processing')
      ORDER BY p.priority_score DESC, p.created_at DESC
    `);

    const enriched = await Promise.all(
      result.rows.map(async (p) => {
        const media = await db.query('SELECT * FROM problem_media WHERE problem_id = ?', [p.id]);
        return {
          ...p,
          media: media.rows,
          priority_breakdown: typeof p.priority_breakdown === 'string' ? JSON.parse(p.priority_breakdown || '{}') : p.priority_breakdown
        };
      })
    );

    res.json({ queue: enriched });
  } catch (err) {
    console.error('Verification queue error:', err);
    res.status(500).json({ error: 'Failed to fetch verification queue' });
  }
});

/**
 * POST /api/admin/verify-problem/:id
 * One-click approve, reject, or mark as duplicate
 */
router.post('/verify-problem/:id', async (req, res) => {
  try {
    const problemId = req.params.id;
    const { action, reason = '', category, priority_score, priority_band } = req.body;

    if (!['approve', 'reject', 'merge'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approve, reject, or merge' });
    }

    let nextStatus = 'published';
    if (action === 'reject') nextStatus = 'rejected';
    if (action === 'merge') nextStatus = 'merged';

    // Update problem record
    const updateParams = [nextStatus];
    let updateSql = 'UPDATE problems SET status = ?, updated_at = CURRENT_TIMESTAMP';
    
    if (category) {
      updateSql += ', category = ?';
      updateParams.push(category);
    }
    if (priority_score !== undefined) {
      updateSql += ', priority_score = ?, priority_band = ?';
      updateParams.push(priority_score, priority_band || 'Medium');
    }

    updateSql += ' WHERE id = ?';
    updateParams.push(problemId);

    await db.query(updateSql, updateParams);

    // Record verification entry
    const verifId = 'verif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    await db.query(`
      INSERT INTO verifications (id, problem_id, admin_id, action, reason)
      VALUES (?, ?, ?, ?, ?)
    `, [verifId, problemId, req.user.id, action, reason]);

    // Fetch reporter to notify
    const probRes = await db.query('SELECT reporter_id, title FROM problems WHERE id = ?', [problemId]);
    if (probRes.rows.length > 0) {
      const prob = probRes.rows[0];
      const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await db.query(`
        INSERT INTO notifications (id, user_id, type, title, message, related_problem_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        notifId,
        prob.reporter_id,
        'PROBLEM_VERIFIED',
        `Problem ${action === 'approve' ? 'Published' : action === 'reject' ? 'Rejected' : 'Merged'}`,
        `Your problem "${prob.title}" has been reviewed by the administration and is now marked as ${nextStatus}.`,
        problemId
      ]);
    }

    res.json({ message: `Problem successfully ${action}d.` });
  } catch (err) {
    console.error('Verify problem error:', err);
    res.status(500).json({ error: 'Failed to verify problem: ' + err.message });
  }
});

/**
 * GET /api/admin/analytics
 * Comprehensive SIH analytics dashboard metrics
 */
router.get('/analytics', async (req, res) => {
  try {
    // 1. Problem summary counts
    const totalProblems = await db.query('SELECT COUNT(*) as count FROM problems');
    const publishedProblems = await db.query("SELECT COUNT(*) as count FROM problems WHERE status NOT IN ('rejected', 'merged', 'processing')");
    const solvedProblems = await db.query("SELECT COUNT(*) as count FROM problems WHERE status IN ('deployed', 'impact_verified')");
    const activeProposals = await db.query("SELECT COUNT(*) as count FROM proposals WHERE status IN ('submitted', 'accepted')");
    
    // 2. Domain distribution
    const domainDist = await db.query(`
      SELECT category as domain, COUNT(*) as count
      FROM problems
      GROUP BY category
      ORDER BY count DESC
    `);

    // 3. Priority band distribution
    const priorityDist = await db.query(`
      SELECT priority_band, COUNT(*) as count
      FROM problems
      GROUP BY priority_band
    `);

    // 4. District-wise breakdown
    const districtBreakdown = await db.query(`
      SELECT district,
             COUNT(*) as problem_count,
             AVG(priority_score) as avg_priority,
             SUM(CASE WHEN status IN ('deployed', 'impact_verified') THEN 1 ELSE 0 END) as solved_count
      FROM problems
      GROUP BY district
      ORDER BY problem_count DESC
    `);

    // 5. Impact metrics aggregation
    const impactAgg = await db.query(`
      SELECT 
        COALESCE(SUM(beneficiaries_count), 0) as total_beneficiaries,
        COALESCE(SUM(patents_filed), 0) as total_patents,
        COALESCE(SUM(startups_created), 0) as total_startups
      FROM impact_reports
    `);

    // 6. Institutional & Industry engagement
    const orgStats = await db.query(`
      SELECT type, COUNT(*) as count
      FROM organizations
      GROUP BY type
    `);

    const fundingStats = await db.query(`
      SELECT 
        COALESCE(SUM(budget), 0) as total_budget_requested,
        COALESCE(SUM(funding_pledged), 0) as total_funding_pledged
      FROM proposals
    `);

    res.json({
      summary: {
        totalReports: Number(totalProblems.rows[0]?.count || 0),
        publishedChallenges: Number(publishedProblems.rows[0]?.count || 0),
        solvedChallenges: Number(solvedProblems.rows[0]?.count || 0),
        activeProposals: Number(activeProposals.rows[0]?.count || 0),
        totalBeneficiaries: Number(impactAgg.rows[0]?.total_beneficiaries || 0),
        patentsFiled: Number(impactAgg.rows[0]?.total_patents || 0),
        startupsCreated: Number(impactAgg.rows[0]?.total_startups || 0),
        fundingPledged: Number(fundingStats.rows[0]?.total_funding_pledged || 0)
      },
      domainDistribution: domainDist.rows,
      priorityDistribution: priorityDist.rows,
      districtBreakdown: districtBreakdown.rows,
      organizationBreakdown: orgStats.rows
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

module.exports = router;

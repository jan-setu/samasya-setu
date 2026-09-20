const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/impact/stats
 * Publicly accessible aggregate statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalReports = await db.query('SELECT COUNT(*) as count FROM problems');
    const solvedProblems = await db.query("SELECT COUNT(*) as count FROM problems WHERE status IN ('deployed', 'impact_verified')");
    const activeProposals = await db.query("SELECT COUNT(*) as count FROM proposals WHERE status IN ('submitted', 'accepted', 'completed')");
    
    const impactAgg = await db.query(`
      SELECT 
        COALESCE(SUM(beneficiaries_count), 0) as total_beneficiaries,
        COALESCE(SUM(patents_filed), 0) as total_patents,
        COALESCE(SUM(startups_created), 0) as total_startups
      FROM impact_reports
    `);

    const orgCounts = await db.query(`
      SELECT 
        COUNT(CASE WHEN type = 'university' THEN 1 END) as universities,
        COUNT(CASE WHEN type IN ('industry', 'msme', 'csr') THEN 1 END) as industries,
        COUNT(CASE WHEN type = 'startup' THEN 1 END) as startups
      FROM organizations
    `);

    // Top solved success stories
    const successStories = await db.query(`
      SELECT p.id, p.title, p.category, p.district, p.description_en,
             pr.approach, pr.tech_stack,
             o.name as org_name, o.type as org_type,
             ir.beneficiaries_count, ir.patents_filed, ir.startups_created, ir.summary as impact_summary
      FROM problems p
      JOIN proposals pr ON pr.problem_id = p.id
      JOIN organizations o ON pr.org_id = o.id
      LEFT JOIN impact_reports ir ON ir.proposal_id = pr.id
      WHERE p.status IN ('deployed', 'impact_verified')
      ORDER BY p.updated_at DESC
      LIMIT 6
    `);

    res.json({
      stats: {
        totalReports: Number(totalReports.rows[0]?.count || 0),
        solvedProblems: Number(solvedProblems.rows[0]?.count || 0),
        activeProposals: Number(activeProposals.rows[0]?.count || 0),
        totalBeneficiaries: Number(impactAgg.rows[0]?.total_beneficiaries || 0),
        totalPatents: Number(impactAgg.rows[0]?.total_patents || 0),
        totalStartups: Number(impactAgg.rows[0]?.total_startups || 0),
        universitiesCount: Number(orgCounts.rows[0]?.universities || 0),
        industriesCount: Number(orgCounts.rows[0]?.industries || 0),
        startupsCount: Number(orgCounts.rows[0]?.startups || 0)
      },
      successStories: successStories.rows
    });
  } catch (err) {
    console.error('Impact stats error:', err);
    res.status(500).json({ error: 'Failed to fetch impact stats' });
  }
});

module.exports = router;

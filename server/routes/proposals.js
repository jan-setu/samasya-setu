const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/proposals/matched-feed
 * Scoped to user's organization expertise
 */
router.get('/matched-feed', requireAuth, async (req, res) => {
  try {
    const userOrgId = req.user.org_id;
    let expertiseTags = [];

    if (userOrgId) {
      const orgRes = await db.query('SELECT expertise_tags FROM organizations WHERE id = ?', [userOrgId]);
      if (orgRes.rows.length > 0 && orgRes.rows[0].expertise_tags) {
        try {
          expertiseTags = JSON.parse(orgRes.rows[0].expertise_tags);
        } catch (e) {
          expertiseTags = [];
        }
      }
    }

    // Fetch published problems
    const problemsRes = await db.query(`
      SELECT p.*,
             u.name as reporter_name,
             (SELECT COUNT(*) FROM proposals pr WHERE pr.problem_id = p.id) as proposal_count
      FROM problems p
      LEFT JOIN users u ON p.reporter_id = u.id
      WHERE p.status IN ('published', 'claimed', 'in_development')
      ORDER BY p.priority_score DESC, p.created_at DESC
    `);

    // Score problems for this organization
    const scoredProblems = problemsRes.rows.map((prob) => {
      let matchScore = 50; // Baseline
      const catLower = (prob.category || '').toLowerCase();
      
      for (const tag of expertiseTags) {
        const tagLower = tag.toLowerCase();
        if (catLower.includes(tagLower) || tagLower.includes(catLower)) {
          matchScore += 25;
        }
      }

      if (prob.matched_org_ids && userOrgId) {
        try {
          const matchedList = JSON.parse(prob.matched_org_ids);
          if (matchedList.includes(userOrgId)) {
            matchScore += 25;
          }
        } catch (e) {}
      }

      return {
        ...prob,
        orgMatchScore: Math.min(100, matchScore),
        priority_breakdown: typeof prob.priority_breakdown === 'string' ? JSON.parse(prob.priority_breakdown || '{}') : prob.priority_breakdown
      };
    });

    // Sort by match score then priority score
    scoredProblems.sort((a, b) => (b.orgMatchScore * 0.6 + b.priority_score * 0.4) - (a.orgMatchScore * 0.6 + a.priority_score * 0.4));

    res.json({ matchedProblems: scoredProblems });
  } catch (err) {
    console.error('Matched feed error:', err);
    res.status(500).json({ error: 'Failed to fetch matched problem feed' });
  }
});

/**
 * POST /api/proposals
 * Submit a solution proposal
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      problem_id,
      approach,
      tech_stack,
      budget,
      timeline_weeks,
      funding_requested,
      team_name,
      team_members = [],
      milestones = []
    } = req.body;

    if (!problem_id || !approach || !tech_stack) {
      return res.status(400).json({ error: 'Problem ID, technical approach, and tech stack are required.' });
    }

    const orgId = req.user.org_id || 'org_indiv_' + req.user.id;
    const proposalId = 'prop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // 1. Create Team if details provided
    let teamId = null;
    if (team_name || team_members.length > 0) {
      teamId = 'team_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await db.query(`
        INSERT INTO teams (id, org_id, name, faculty_lead_id, member_ids, department)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        teamId,
        orgId,
        team_name || `${req.user.name}'s Innovation Team`,
        req.user.id,
        JSON.stringify(team_members),
        req.user.department || 'Innovation Lab'
      ]);
    }

    // 2. Insert Proposal
    await db.query(`
      INSERT INTO proposals (
        id, problem_id, org_id, team_id, submitted_by, approach,
        tech_stack, budget, timeline_weeks, funding_requested, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      proposalId,
      problem_id,
      orgId,
      teamId,
      req.user.id,
      approach,
      tech_stack,
      Number(budget) || 0,
      Number(timeline_weeks) || 8,
      Number(funding_requested || budget) || 0,
      'submitted'
    ]);

    // 3. Insert Milestones
    if (Array.isArray(milestones) && milestones.length > 0) {
      for (const ms of milestones) {
        const msId = 'ms_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        await db.query(`
          INSERT INTO milestones (id, proposal_id, title, description, due_date, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          msId,
          proposalId,
          ms.title,
          ms.description || '',
          ms.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          'pending'
        ]);
      }
    } else {
      // Create default 3 milestone roadmap
      const defaultMilestones = [
        { title: 'Phase 1: Field Assessment & Requirements Sign-off', days: 14 },
        { title: 'Phase 2: Prototype Development & Testing', days: 35 },
        { title: 'Phase 3: Field Deployment & Impact Validation', days: 60 }
      ];
      for (const ms of defaultMilestones) {
        const msId = 'ms_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const dueDate = new Date(Date.now() + ms.days * 86400000).toISOString().split('T')[0];
        await db.query(`
          INSERT INTO milestones (id, proposal_id, title, due_date, status)
          VALUES (?, ?, ?, ?, ?)
        `, [msId, proposalId, ms.title, dueDate, 'pending']);
      }
    }

    // 4. Update Problem status to 'claimed' or 'in_development'
    await db.query("UPDATE problems SET status = 'claimed' WHERE id = ? AND status = 'published'", [problem_id]);

    // 5. Notify Problem Reporter
    const probRes = await db.query('SELECT reporter_id, title FROM problems WHERE id = ?', [problem_id]);
    if (probRes.rows.length > 0) {
      const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await db.query(`
        INSERT INTO notifications (id, user_id, type, title, message, related_problem_id, related_proposal_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        notifId,
        probRes.rows[0].reporter_id,
        'PROPOSAL_SUBMITTED',
        'Solution Proposal Received',
        `An innovation team has submitted a solution proposal for your problem: "${probRes.rows[0].title}".`,
        problem_id,
        proposalId
      ]);
    }

    res.status(201).json({
      message: 'Proposal submitted successfully with milestones and team configuration.',
      proposalId
    });
  } catch (err) {
    console.error('Submit proposal error:', err);
    res.status(500).json({ error: 'Failed to submit proposal: ' + err.message });
  }
});

/**
 * GET /api/proposals/my-proposals
 */
router.get('/my-proposals', requireAuth, async (req, res) => {
  try {
    const isInstitution = ['faculty', 'student', 'industry'].includes(req.user.role);
    
    let query = `
      SELECT pr.*,
             p.title as problem_title,
             p.district as problem_district,
             p.category as problem_category,
             p.status as problem_status,
             o.name as org_name,
             t.name as team_name
      FROM proposals pr
      JOIN problems p ON pr.problem_id = p.id
      LEFT JOIN organizations o ON pr.org_id = o.id
      LEFT JOIN teams t ON pr.team_id = t.id
      WHERE pr.submitted_by = ? OR pr.org_id = ?
      ORDER BY pr.created_at DESC
    `;

    const result = await db.query(query, [req.user.id, req.user.org_id || 'none']);

    const fullProposals = await Promise.all(
      result.rows.map(async (pr) => {
        const msRes = await db.query('SELECT * FROM milestones WHERE proposal_id = ? ORDER BY due_date ASC', [pr.id]);
        const impactRes = await db.query('SELECT * FROM impact_reports WHERE proposal_id = ?', [pr.id]);
        return {
          ...pr,
          milestones: msRes.rows,
          impactReport: impactRes.rows[0] || null
        };
      })
    );

    res.json({ proposals: fullProposals });
  } catch (err) {
    console.error('Fetch my proposals error:', err);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

/**
 * GET /api/proposals/:id
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT pr.*,
             p.title as problem_title,
             p.raw_description as problem_description,
             p.district as problem_district,
             p.category as problem_category,
             p.lat, p.lng,
             o.name as org_name,
             o.type as org_type,
             t.name as team_name,
             t.member_ids as team_member_ids,
             u.name as lead_name,
             u.email as lead_email
      FROM proposals pr
      JOIN problems p ON pr.problem_id = p.id
      LEFT JOIN organizations o ON pr.org_id = o.id
      LEFT JOIN teams t ON pr.team_id = t.id
      LEFT JOIN users u ON pr.submitted_by = u.id
      WHERE pr.id = ?
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = result.rows[0];
    const msRes = await db.query('SELECT * FROM milestones WHERE proposal_id = ? ORDER BY due_date ASC', [proposal.id]);
    const impactRes = await db.query('SELECT * FROM impact_reports WHERE proposal_id = ?', [proposal.id]);

    res.json({
      proposal: {
        ...proposal,
        milestones: msRes.rows,
        impactReport: impactRes.rows[0] || null
      }
    });
  } catch (err) {
    console.error('Fetch proposal error:', err);
    res.status(500).json({ error: 'Failed to fetch proposal details' });
  }
});

/**
 * POST /api/proposals/:id/milestones
 */
router.post('/:id/milestones', requireAuth, async (req, res) => {
  try {
    const proposalId = req.params.id;
    const { title, description, due_date } = req.body;

    if (!title || !due_date) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }

    const msId = 'ms_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    await db.query(`
      INSERT INTO milestones (id, proposal_id, title, description, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [msId, proposalId, title, description || '', due_date, 'pending']);

    res.status(201).json({ message: 'Milestone added successfully', milestoneId: msId });
  } catch (err) {
    console.error('Add milestone error:', err);
    res.status(500).json({ error: 'Failed to add milestone' });
  }
});

/**
 * PUT /api/proposals/:id/milestones/:milestoneId
 * Update milestone status, attach evidence URL
 */
router.put('/:id/milestones/:milestoneId', requireAuth, async (req, res) => {
  try {
    const { id: proposalId, milestoneId } = req.params;
    const { status, evidence_url, notes } = req.body;

    const completedAt = status === 'completed' ? new Date().toISOString() : null;

    await db.query(`
      UPDATE milestones SET
        status = COALESCE(?, status),
        evidence_url = COALESCE(?, evidence_url),
        notes = COALESCE(?, notes),
        completed_at = COALESCE(?, completed_at)
      WHERE id = ? AND proposal_id = ?
    `, [status, evidence_url, notes, completedAt, milestoneId, proposalId]);

    // Check if all milestones are completed
    const allMs = await db.query('SELECT status FROM milestones WHERE proposal_id = ?', [proposalId]);
    const allDone = allMs.rows.length > 0 && allMs.rows.every(m => m.status === 'completed');

    if (allDone) {
      // Update problem status to 'deployed'
      const propRes = await db.query('SELECT problem_id FROM proposals WHERE id = ?', [proposalId]);
      if (propRes.rows.length > 0) {
        await db.query("UPDATE problems SET status = 'deployed' WHERE id = ?", [propRes.rows[0].problem_id]);
      }
    } else {
      // In development
      const propRes = await db.query('SELECT problem_id FROM proposals WHERE id = ?', [proposalId]);
      if (propRes.rows.length > 0) {
        await db.query("UPDATE problems SET status = 'in_development' WHERE id = ?", [propRes.rows[0].problem_id]);
      }
    }

    res.json({ message: 'Milestone updated successfully', allCompleted: allDone });
  } catch (err) {
    console.error('Update milestone error:', err);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

/**
 * POST /api/proposals/:id/impact
 * Log final impact, patents filed, startups created
 */
router.post('/:id/impact', requireAuth, async (req, res) => {
  try {
    const proposalId = req.params.id;
    const { beneficiaries_count, patents_filed, startups_created, metrics_json, summary } = req.body;

    const impactId = 'impact_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    
    await db.query(`
      INSERT INTO impact_reports (
        id, proposal_id, beneficiaries_count, patents_filed, startups_created, metrics_json, summary, verified_by_admin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      impactId,
      proposalId,
      Number(beneficiaries_count) || 0,
      Number(patents_filed) || 0,
      Number(startups_created) || 0,
      typeof metrics_json === 'object' ? JSON.stringify(metrics_json) : (metrics_json || '{}'),
      summary || 'Field deployment verified with positive community impact.',
      1
    ]);

    // Update problem status to 'impact_verified'
    const propRes = await db.query('SELECT problem_id FROM proposals WHERE id = ?', [proposalId]);
    if (propRes.rows.length > 0) {
      await db.query("UPDATE problems SET status = 'impact_verified' WHERE id = ?", [propRes.rows[0].problem_id]);
    }

    res.status(201).json({ message: 'Impact report logged successfully! Outcomes updated on Public Impact Wall.' });
  } catch (err) {
    console.error('Log impact error:', err);
    res.status(500).json({ error: 'Failed to log impact: ' + err.message });
  }
});

/**
 * POST /api/proposals/:id/fund
 * Industry / CSR funding pledge & mentorship
 */
router.post('/:id/fund', requireAuth, async (req, res) => {
  try {
    const proposalId = req.params.id;
    const { amount, mentorshipNote } = req.body;

    const pledgeAmount = Number(amount) || 0;
    const userOrgId = req.user.org_id;

    await db.query(`
      UPDATE proposals SET
        funding_pledged = funding_pledged + ?,
        pledged_by_org_id = ?
      WHERE id = ?
    `, [pledgeAmount, userOrgId, proposalId]);

    // Send notification to team lead
    const propRes = await db.query('SELECT submitted_by, problem_id FROM proposals WHERE id = ?', [proposalId]);
    if (propRes.rows.length > 0) {
      const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await db.query(`
        INSERT INTO notifications (id, user_id, type, title, message, related_proposal_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        notifId,
        propRes.rows[0].submitted_by,
        'FUNDING_PLEDGED',
        'Funding & Mentorship Pledged!',
        `${req.user.name} has pledged ₹${pledgeAmount.toLocaleString('en-IN')} in CSR/Grant funding and technical mentorship for your proposal.`,
        proposalId
      ]);
    }

    res.json({ message: `Successfully pledged ₹${pledgeAmount.toLocaleString('en-IN')} in funding & mentorship support!` });
  } catch (err) {
    console.error('Fund proposal error:', err);
    res.status(500).json({ error: 'Failed to pledge funding' });
  }
});

module.exports = router;

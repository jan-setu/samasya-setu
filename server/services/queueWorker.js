/**
 * Asynchronous In-Memory Job Queue Worker for AI Pipeline
 * Never blocks the HTTP response. Executes translation, classification,
 * embedding, clustering, priority scoring, and org matching in background.
 */
const db = require('../db');
const { translateToEnglish, classifyProblem, generateEmbedding } = require('./aiService');
const { clusterProblem } = require('./clusterService');
const { calculatePriorityScore } = require('./priorityEngine');
const { matchOrganizationsForProblem } = require('./matchEngine');

class QueueWorker {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Enqueues a newly submitted problem for async AI processing
   * @param {string} problemId
   */
  enqueueProblem(problemId) {
    console.log(`📥 [JobQueue] Enqueued problem ${problemId} for AI pipeline processing`);
    this.queue.push({ type: 'PROCESS_PROBLEM', problemId, retries: 0 });
    this.processNext();
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const job = this.queue.shift();

    try {
      if (job.type === 'PROCESS_PROBLEM') {
        await this.handleProblemJob(job.problemId);
      }
    } catch (err) {
      console.error(`❌ [JobQueue] Error processing job for problem ${job.problemId}:`, err);
      if (job.retries < 2) {
        job.retries++;
        this.queue.push(job);
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  async handleProblemJob(problemId) {
    console.log(`⚙️ [JobQueue] Starting AI pipeline execution for problem ${problemId}...`);
    
    // 1. Fetch current problem record
    const result = await db.query('SELECT * FROM problems WHERE id = ?', [problemId]);
    if (result.rows.length === 0) {
      console.warn(`[JobQueue] Problem ${problemId} not found in DB`);
      return;
    }
    const problem = result.rows[0];

    // 2. Step 1: Translate
    const textToProcess = problem.raw_description || problem.title;
    const translatedEn = await translateToEnglish(textToProcess);

    // 3. Step 2: Classify domain, scope, safety risk, infrastructure
    const classification = await classifyProblem(translatedEn || textToProcess);

    // 4. Step 3: Generate Embedding
    const fullTextForEmbedding = `${problem.title} ${translatedEn} ${classification.domain} ${classification.subdomain}`;
    const embedding = await generateEmbedding(fullTextForEmbedding);

    // 5. Step 4: Clustering & Duplicate Detection
    const clusterResult = await clusterProblem({
      id: problemId,
      lat: problem.lat,
      lng: problem.lng,
      category: classification.domain,
      embedding
    });

    // 6. Step 5: Explainable Priority Scoring
    // Check if near vulnerable facility (mock/heuristic: if in school/hospital domain or flagged in text)
    const isVulnerableNearby = classification.domain === 'Education' || classification.domain === 'Healthcare' || 
      /school|hospital|anganwadi|clinic|elderly/i.test(translatedEn);

    const priority = calculatePriorityScore({
      safetyRisk: classification.safety_risk,
      reportCount: clusterResult.reportCount,
      nearVulnerableFacility: isVulnerableNearby,
      daysPending: 0,
      district: problem.district
    });

    // 7. Step 6: Match Organizations
    const matchedOrgs = await matchOrganizationsForProblem({
      category: classification.domain,
      embedding,
      district: problem.district
    });

    // 8. Update database record with enriched AI pipeline output
    const status = clusterResult.isDuplicate ? 'merged' : 'pending_verification';

    await db.query(`
      UPDATE problems SET
        description_en = ?,
        category = ?,
        subcategory = ?,
        affected_scope = ?,
        safety_risk = ?,
        infrastructure_type = ?,
        priority_score = ?,
        priority_band = ?,
        priority_breakdown = ?,
        status = ?,
        cluster_id = ?,
        embedding = ?,
        matched_org_ids = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      translatedEn,
      classification.domain,
      classification.subdomain,
      classification.affected_scope,
      classification.safety_risk ? 1 : 0,
      classification.infrastructure_type,
      priority.totalScore,
      priority.band,
      JSON.stringify(priority.breakdown),
      status,
      clusterResult.clusterId,
      JSON.stringify(embedding),
      JSON.stringify(matchedOrgs.map(o => o.org_id)),
      problemId
    ]);

    // 9. Create Notifications
    // Citizen notification
    const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    await db.query(`
      INSERT INTO notifications (id, user_id, type, title, message, related_problem_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      notifId,
      problem.reporter_id,
      'PROBLEM_PROCESSED',
      'AI Analysis Complete',
      `Your report "${problem.title}" was analyzed and categorized under ${classification.domain} (Priority ${priority.totalScore}/100). It is now awaiting admin verification.`,
      problemId
    ]);

    // Admin notification
    const admins = await db.query("SELECT id FROM users WHERE role IN ('admin', 'govt_dept') AND is_verified = 1");
    for (const admin of admins.rows) {
      const adminNotifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await db.query(`
        INSERT INTO notifications (id, user_id, type, title, message, related_problem_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        adminNotifId,
        admin.id,
        'NEW_PROBLEM_VERIFY',
        'New Problem for Verification',
        `New ${priority.band} priority problem reported in ${problem.district}: "${problem.title}".`,
        problemId
      ]);
    }

    console.log(`✅ [JobQueue] Successfully processed problem ${problemId} -> Category: ${classification.domain}, Priority: ${priority.totalScore} (${priority.band}), Status: ${status}`);
  }
}

const queueWorker = new QueueWorker();
module.exports = queueWorker;

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/**
 * GET /api/notifications
 * Fetch logged-in user's notifications
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );

    const unreadCount = result.rows.filter(n => n.is_read === 0 || n.is_read === false).length;

    res.json({
      notifications: result.rows,
      unreadCount
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * PUT /api/notifications/mark-read
 */
router.put('/mark-read', async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (notificationId) {
      await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notificationId, req.user.id]);
    } else {
      await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    }
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;

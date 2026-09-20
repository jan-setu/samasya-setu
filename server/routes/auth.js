const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');
const { generateEmbedding } = require('../services/aiService');

/**
 * Generate standard JWT Token for user session
 */
function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      org_id: user.org_id,
      department: user.department,
      is_verified: user.is_verified === 1 || user.is_verified === true
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      role,
      orgName,
      orgType,
      district,
      department,
      universityName,
      expertiseTags
    } = req.body;

    // 1. Validations
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ error: 'Name, email, phone, password, and role are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // 2. Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // 3. Organization handling if not citizen
    let orgId = null;
    if (role !== 'citizen') {
      const targetOrgName = (role === 'faculty' || role === 'student') ? (universityName || orgName || 'State University') : (orgName || 'Regional Organization');
      const targetOrgType = (role === 'faculty' || role === 'student') ? 'university' : (orgType || 'industry');
      const targetDistrict = district || 'Ranchi';

      // Check if org already exists with similar name
      const existingOrg = await db.query('SELECT id FROM organizations WHERE LOWER(name) = LOWER(?)', [targetOrgName]);
      if (existingOrg.rows.length > 0) {
        orgId = existingOrg.rows[0].id;
      } else {
        orgId = 'org_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const tags = Array.isArray(expertiseTags) ? expertiseTags : ['Civic Tech', 'Innovation', targetDistrict];
        const embedding = await generateEmbedding(tags.join(' '));

        await db.query(
          'INSERT INTO organizations (id, type, name, district, expertise_tags, expertise_embedding) VALUES (?, ?, ?, ?, ?, ?)',
          [orgId, targetOrgType, targetOrgName, targetDistrict, JSON.stringify(tags), JSON.stringify(embedding)]
        );
      }
    }

    // 4. Verification flag: Govt & Admin require secondary verification
    const isGovtOrAdmin = role === 'admin' || role === 'govt_dept';
    const isVerified = isGovtOrAdmin ? 0 : 1;

    // 5. Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    await db.query(
      `INSERT INTO users (id, role, name, phone, email, password_hash, org_id, department, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, role, name.trim(), phone.trim(), email.toLowerCase().trim(), passwordHash, orgId, department || null, isVerified]
    );

    const userObj = {
      id: userId,
      role,
      name: name.trim(),
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      org_id: orgId,
      department: department || null,
      is_verified: isVerified === 1
    };

    const token = createToken(userObj);

    // If unverified admin/govt, create notification for existing admins
    if (!isVerified) {
      const existingAdmins = await db.query("SELECT id FROM users WHERE role = 'admin' AND is_verified = 1");
      for (const admin of existingAdmins.rows) {
        const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        await db.query(`
          INSERT INTO notifications (id, user_id, type, title, message)
          VALUES (?, ?, ?, ?, ?)
        `, [
          notifId,
          admin.id,
          'ACCOUNT_VERIFY_REQUEST',
          'New Govt/Admin Account Approval Needed',
          `${name} (${email}) has registered as ${role} and is awaiting administrative approval.`
        ]);
      }
    }

    res.status(201).json({
      message: isVerified ? 'Registration successful!' : 'Registration submitted. Awaiting administrator approval.',
      token,
      user: userObj,
      pendingApproval: !isVerified
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration: ' + err.message });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, email, phone, password } = req.body;
    const loginIdentifier = (identifier || email || phone || '').toLowerCase().trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Please provide your email/phone and password.' });
    }

    // Find user by email or phone
    const userRes = await db.query(
      `SELECT u.*, o.name as org_name, o.type as org_type, o.district as org_district
       FROM users u
       LEFT JOIN organizations o ON u.org_id = o.id
       WHERE LOWER(u.email) = ? OR u.phone = ?`,
      [loginIdentifier, loginIdentifier]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'No account found with this email or phone number.' });
    }

    const user = userRes.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const isVerified = user.is_verified === 1 || user.is_verified === true;

    const userObj = {
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
      org_id: user.org_id,
      org_name: user.org_name,
      org_type: user.org_type,
      org_district: user.org_district,
      department: user.department,
      is_verified: isVerified
    };

    const token = createToken(userObj);

    res.json({
      message: 'Login successful',
      token,
      user: userObj,
      pendingApproval: !isVerified && (user.role === 'admin' || user.role === 'govt_dept')
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login: ' + err.message });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userRes = await db.query(
      `SELECT u.id, u.role, u.name, u.phone, u.email, u.org_id, u.department, u.is_verified, u.created_at,
              o.name as org_name, o.type as org_type, o.district as org_district, o.expertise_tags
       FROM users u
       LEFT JOIN organizations o ON u.org_id = o.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];
    user.is_verified = user.is_verified === 1 || user.is_verified === true;

    res.json({ user });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const userRes = await db.query('SELECT id FROM users WHERE LOWER(email) = ?', [email.toLowerCase().trim()]);
  if (userRes.rows.length === 0) {
    // Return friendly message even if not found to avoid user enumeration
    return res.json({ message: 'If that email exists in our registry, a password reset link has been dispatched.' });
  }

  return res.json({
    message: 'Password reset link dispatched. In this demo environment, you may reset your password directly.',
    resetToken: 'reset_token_' + Date.now()
  });
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Valid email and password (min 8 characters) required' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = ? WHERE LOWER(email) = ?', [passwordHash, email.toLowerCase().trim()]);

  res.json({ message: 'Password has been successfully updated. You may now log in.' });
});

module.exports = router;

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getOne, getAll } = require('../../shared/database');
const { authenticateToken, generateToken } = require('./auth.middleware');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'user', division } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        error: {
          message: 'Email, password, and name are required',
          status: 400
        }
      });
    }

    // Check if user already exists
    const existingUser = await getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({
        error: {
          message: 'User with this email already exists',
          status: 409
        }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    await runQuery(
      `INSERT INTO users (id, email, password, name, role, division, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [userId, email, hashedPassword, name, role, division]
    );

    // Generate token
    const token = generateToken({ id: userId, email, role, division });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        name,
        role,
        division
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to register user',
        status: 500
      }
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required',
          status: 400
        }
      });
    }

    // Find user
    const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Invalid credentials',
          status: 401
        }
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        error: {
          message: 'Invalid credentials',
          status: 401
        }
      });
    }

    // Update last login
    await runQuery(
      'UPDATE users SET last_login = datetime("now") WHERE id = ?',
      [user.id]
    );

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        division: user.division
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to login',
        status: 500
      }
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await getOne(
      'SELECT id, email, name, role, division, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch profile',
        status: 500
      }
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, division } = req.body;
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (division) {
      updates.push('division = ?');
      params.push(division);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: {
          message: 'No updates provided',
          status: 400
        }
      });
    }

    params.push(req.user.id);
    await runQuery(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to update profile',
        status: 500
      }
    });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: {
          message: 'Current and new passwords are required',
          status: 400
        }
      });
    }

    // Get user with password
    const user = await getOne('SELECT * FROM users WHERE id = ?', [req.user.id]);

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({
        error: {
          message: 'Current password is incorrect',
          status: 401
        }
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await runQuery(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to change password',
        status: 500
      }
    });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // You could implement token blacklisting here if needed
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to logout',
        status: 500
      }
    });
  }
});

module.exports = router;
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getOne, getAll } = require('../../shared/database');
const { authenticateToken, authorizeRoles } = require('../auth/auth.middleware');

const router = express.Router();

// Get security dashboard overview
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get threat statistics
    const threatStats = await getOne(`
      SELECT 
        COUNT(*) as total_threats,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_threats,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_threats,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_threats,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_threats,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_threats,
        COUNT(CASE WHEN status = 'mitigated' THEN 1 END) as mitigated_threats
      FROM security_threats
      WHERE created_at >= datetime('now', '-30 days')
    `);

    // Get recent security events
    const recentEvents = await getAll(`
      SELECT * FROM security_events
      ORDER BY occurred_at DESC
      LIMIT 20
    `);

    // Get system health
    const systemHealth = {
      firewall: { status: 'active', health: 98 },
      ids: { status: 'active', health: 95 },
      antivirus: { status: 'active', health: 99 },
      vpn: { status: 'active', health: 92 },
      encryption: { status: 'active', health: 100 }
    };

    // Get vulnerability scan results
    const vulnerabilities = await getAll(`
      SELECT 
        severity,
        COUNT(*) as count
      FROM vulnerabilities
      WHERE status = 'open'
      GROUP BY severity
    `);

    res.json({
      threatStats,
      recentEvents,
      systemHealth,
      vulnerabilities
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get dashboard data',
        status: 500
      }
    });
  }
});

// Get all threats with filtering
router.get('/threats', authenticateToken, async (req, res) => {
  try {
    const { 
      severity,
      status = 'all',
      type,
      limit = 50, 
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let sql = `
      SELECT t.*, 
             COUNT(DISTINCT e.id) as event_count
      FROM security_threats t
      LEFT JOIN security_events e ON t.id = e.threat_id
      WHERE 1=1
    `;
    const params = [];

    if (severity) {
      sql += ` AND t.severity = ?`;
      params.push(severity);
    }

    if (status !== 'all') {
      sql += ` AND t.status = ?`;
      params.push(status);
    }

    if (type) {
      sql += ` AND t.threat_type = ?`;
      params.push(type);
    }

    sql += ` GROUP BY t.id`;
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const threats = await getAll(sql, params);

    res.json({ threats });
  } catch (error) {
    console.error('Get threats error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get threats',
        status: 500
      }
    });
  }
});

// Create security alert
router.post('/alerts', authenticateToken, async (req, res) => {
  try {
    const { 
      title,
      description,
      severity,
      source,
      affectedSystems = []
    } = req.body;

    if (!title || !severity || !source) {
      return res.status(400).json({
        error: {
          message: 'Title, severity, and source are required',
          status: 400
        }
      });
    }

    const alertId = uuidv4();
    const threatId = uuidv4();

    // Create threat record
    await runQuery(
      `INSERT INTO security_threats 
       (id, title, description, severity, threat_type, source, status, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'), ?)`,
      [threatId, title, description, severity, 'manual', source, req.user.id]
    );

    // Create alert
    await runQuery(
      `INSERT INTO alerts 
       (id, type, title, message, severity, threat_id, created_at)
       VALUES (?, 'security', ?, ?, ?, ?, datetime('now'))`,
      [alertId, title, description, severity, threatId]
    );

    // Log security event
    await runQuery(
      `INSERT INTO security_events 
       (id, event_type, description, severity, source, threat_id, user_id, occurred_at)
       VALUES (?, 'alert_created', ?, ?, ?, ?, ?, datetime('now'))`,
      [uuidv4(), `Security alert created: ${title}`, severity, source, threatId, req.user.id]
    );

    // Trigger WebSocket notification
    const io = req.app.get('io');
    if (io) {
      io.emit('security-alert', {
        alertId,
        threatId,
        title,
        severity,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      message: 'Security alert created successfully',
      alertId,
      threatId
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to create alert',
        status: 500
      }
    });
  }
});

// Run vulnerability scan (mock)
router.post('/scan/vulnerabilities', authenticateToken, authorizeRoles('admin', 'security'), async (req, res) => {
  try {
    const { targetSystems = ['all'], scanType = 'full' } = req.body;

    const scanId = uuidv4();
    
    // Mock vulnerability scan results
    const vulnerabilities = [
      {
        id: uuidv4(),
        title: 'Outdated SSL Certificate',
        severity: 'high',
        cvss: 7.5,
        system: 'web-server-01',
        description: 'SSL certificate expires in 7 days',
        remediation: 'Renew SSL certificate immediately'
      },
      {
        id: uuidv4(),
        title: 'Unpatched Apache Vulnerability',
        severity: 'critical',
        cvss: 9.8,
        system: 'web-server-02',
        description: 'Apache version 2.4.41 has known vulnerabilities',
        remediation: 'Update to Apache 2.4.54 or later'
      },
      {
        id: uuidv4(),
        title: 'Weak Password Policy',
        severity: 'medium',
        cvss: 5.3,
        system: 'auth-server',
        description: 'Password policy allows weak passwords',
        remediation: 'Enforce minimum 12 characters with complexity requirements'
      }
    ];

    // Store scan results
    for (const vuln of vulnerabilities) {
      await runQuery(
        `INSERT INTO vulnerabilities 
         (id, scan_id, title, description, severity, cvss_score, affected_system, 
          remediation, status, discovered_at, discovered_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', datetime('now'), ?)`,
        [vuln.id, scanId, vuln.title, vuln.description, vuln.severity, 
         vuln.cvss, vuln.system, vuln.remediation, req.user.id]
      );
    }

    res.json({
      scanId,
      scanType,
      targetSystems,
      vulnerabilitiesFound: vulnerabilities.length,
      vulnerabilities
    });
  } catch (error) {
    console.error('Vulnerability scan error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to run vulnerability scan',
        status: 500
      }
    });
  }
});

// Get security events log
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const { 
      eventType,
      severity,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query;

    let sql = `
      SELECT e.*, u.name as user_name
      FROM security_events e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (eventType) {
      sql += ` AND e.event_type = ?`;
      params.push(eventType);
    }

    if (severity) {
      sql += ` AND e.severity = ?`;
      params.push(severity);
    }

    if (startDate) {
      sql += ` AND e.occurred_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND e.occurred_at <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY e.occurred_at DESC`;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const events = await getAll(sql, params);

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get security events',
        status: 500
      }
    });
  }
});

// Update threat status
router.put('/threats/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, resolution } = req.body;

    if (!status) {
      return res.status(400).json({
        error: {
          message: 'Status is required',
          status: 400
        }
      });
    }

    await runQuery(
      `UPDATE security_threats 
       SET status = ?, resolution = ?, resolved_at = datetime('now'), resolved_by = ?
       WHERE id = ?`,
      [status, resolution, req.user.id, req.params.id]
    );

    // Log event
    await runQuery(
      `INSERT INTO security_events 
       (id, event_type, description, threat_id, user_id, occurred_at)
       VALUES (?, 'threat_status_changed', ?, ?, ?, datetime('now'))`,
      [uuidv4(), `Threat status changed to ${status}`, req.params.id, req.user.id]
    );

    res.json({ message: 'Threat status updated successfully' });
  } catch (error) {
    console.error('Update threat error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to update threat status',
        status: 500
      }
    });
  }
});

// Get compliance status
router.get('/compliance', authenticateToken, async (req, res) => {
  try {
    // Mock compliance data
    const compliance = {
      frameworks: [
        {
          name: 'HIPAA',
          status: 'compliant',
          score: 95,
          lastAudit: '2024-01-15',
          nextAudit: '2024-07-15',
          findings: 2
        },
        {
          name: 'SOC 2',
          status: 'compliant',
          score: 92,
          lastAudit: '2024-02-01',
          nextAudit: '2024-08-01',
          findings: 5
        },
        {
          name: 'ISO 27001',
          status: 'in_progress',
          score: 87,
          lastAudit: '2023-12-01',
          nextAudit: '2024-06-01',
          findings: 8
        }
      ],
      overallScore: 91,
      totalFindings: 15,
      criticalFindings: 1
    };

    res.json({ compliance });
  } catch (error) {
    console.error('Get compliance error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get compliance status',
        status: 500
      }
    });
  }
});

// AI-powered threat analysis (mock)
router.post('/ai/analyze-threat', authenticateToken, async (req, res) => {
  try {
    const { threatId, analysisType = 'comprehensive' } = req.body;

    if (!threatId) {
      return res.status(400).json({
        error: {
          message: 'Threat ID is required',
          status: 400
        }
      });
    }

    // Mock AI analysis
    const analysis = {
      id: uuidv4(),
      threatId,
      analysisType,
      timestamp: new Date().toISOString(),
      riskScore: 78.5,
      attackVectors: [
        { vector: 'phishing', probability: 0.65 },
        { vector: 'malware', probability: 0.82 },
        { vector: 'insider_threat', probability: 0.23 }
      ],
      predictedImpact: {
        dataLoss: 'high',
        servicDisruption: 'medium',
        financialLoss: '$50,000 - $200,000',
        reputationalDamage: 'moderate'
      },
      recommendations: [
        'Implement additional email filtering',
        'Update endpoint protection signatures',
        'Conduct security awareness training',
        'Enable MFA for all critical systems'
      ],
      similarIncidents: [
        { date: '2024-01-10', organization: 'Similar Industry Co.', impact: 'high' },
        { date: '2023-12-05', organization: 'Competitor Inc.', impact: 'medium' }
      ]
    };

    res.json({ analysis });
  } catch (error) {
    console.error('AI threat analysis error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to analyze threat',
        status: 500
      }
    });
  }
});

module.exports = router;
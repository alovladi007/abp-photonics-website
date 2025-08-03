const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getOne, getAll } = require('../../shared/database');
const { authenticateToken, authorizeRoles } = require('../auth/auth.middleware');

const router = express.Router();

// Get all patients (with pagination)
router.get('/patients', authenticateToken, async (req, res) => {
  try {
    const { 
      search = '', 
      status = 'all',
      limit = 20, 
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let sql = `
      SELECT p.*, 
             COUNT(DISTINCT v.id) as vital_count,
             MAX(v.recorded_at) as last_vital_update
      FROM patients p
      LEFT JOIN patient_vitals v ON p.id = v.patient_id
      WHERE 1=1
    `;
    const params = [];

    // Add division filter based on user role
    if (req.user.role !== 'admin') {
      sql += ` AND p.division = ?`;
      params.push(req.user.division || 'general');
    }

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.patient_id LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status !== 'all') {
      sql += ` AND p.status = ?`;
      params.push(status);
    }

    sql += ` GROUP BY p.id`;
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const patients = await getAll(sql, params);

    res.json({ patients });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get patients',
        status: 500
      }
    });
  }
});

// Get patient by ID with full details
router.get('/patients/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await getOne('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    
    if (!patient) {
      return res.status(404).json({
        error: {
          message: 'Patient not found',
          status: 404
        }
      });
    }

    // Get recent vitals
    const vitals = await getAll(`
      SELECT * FROM patient_vitals
      WHERE patient_id = ?
      ORDER BY recorded_at DESC
      LIMIT 100
    `, [req.params.id]);

    // Get risk assessments
    const riskAssessments = await getAll(`
      SELECT * FROM risk_assessments
      WHERE patient_id = ?
      ORDER BY assessed_at DESC
      LIMIT 10
    `, [req.params.id]);

    // Get appointments
    const appointments = await getAll(`
      SELECT * FROM appointments
      WHERE patient_id = ?
      ORDER BY appointment_date DESC
    `, [req.params.id]);

    patient.vitals = vitals;
    patient.riskAssessments = riskAssessments;
    patient.appointments = appointments;

    res.json({ patient });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get patient details',
        status: 500
      }
    });
  }
});

// Record patient vitals
router.post('/patients/:id/vitals', authenticateToken, async (req, res) => {
  try {
    const { 
      heartRate, 
      bloodPressure, 
      temperature, 
      oxygenSaturation,
      respiratoryRate,
      glucoseLevel
    } = req.body;

    const vitalId = uuidv4();
    await runQuery(
      `INSERT INTO patient_vitals 
       (id, patient_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, 
        temperature, oxygen_saturation, respiratory_rate, glucose_level, recorded_at, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
      [
        vitalId, 
        req.params.id, 
        heartRate,
        bloodPressure?.systolic,
        bloodPressure?.diastolic,
        temperature,
        oxygenSaturation,
        respiratoryRate,
        glucoseLevel,
        req.user.id
      ]
    );

    // Trigger real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`patient-${req.params.id}`).emit('vitals-update', {
        patientId: req.params.id,
        vitals: req.body,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      message: 'Vitals recorded successfully',
      vitalId
    });
  } catch (error) {
    console.error('Record vitals error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to record vitals',
        status: 500
      }
    });
  }
});

// AI Risk Assessment
router.post('/patients/:id/assess-risk', authenticateToken, async (req, res) => {
  try {
    const patient = await getOne('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    
    if (!patient) {
      return res.status(404).json({
        error: {
          message: 'Patient not found',
          status: 404
        }
      });
    }

    // Get recent vitals for analysis
    const recentVitals = await getAll(`
      SELECT * FROM patient_vitals
      WHERE patient_id = ?
      ORDER BY recorded_at DESC
      LIMIT 50
    `, [req.params.id]);

    // Mock AI risk assessment
    const riskScore = Math.random() * 100;
    const riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';
    
    const assessment = {
      id: uuidv4(),
      patientId: req.params.id,
      riskScore: riskScore.toFixed(2),
      riskLevel,
      factors: [
        { factor: 'Vital Signs Stability', score: Math.random() * 100, weight: 0.3 },
        { factor: 'Medical History', score: Math.random() * 100, weight: 0.25 },
        { factor: 'Age Factor', score: Math.random() * 100, weight: 0.15 },
        { factor: 'Comorbidities', score: Math.random() * 100, weight: 0.2 },
        { factor: 'Treatment Compliance', score: Math.random() * 100, weight: 0.1 }
      ],
      recommendations: [
        riskLevel === 'high' ? 'Immediate medical attention recommended' : null,
        riskLevel === 'medium' ? 'Schedule follow-up within 48 hours' : null,
        'Continue monitoring vital signs',
        'Review medication adherence'
      ].filter(Boolean),
      assessedAt: new Date().toISOString()
    };

    // Store assessment
    await runQuery(
      `INSERT INTO risk_assessments 
       (id, patient_id, risk_score, risk_level, factors, recommendations, assessed_at, assessed_by)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
      [
        assessment.id,
        req.params.id,
        assessment.riskScore,
        assessment.riskLevel,
        JSON.stringify(assessment.factors),
        JSON.stringify(assessment.recommendations),
        req.user.id
      ]
    );

    res.json({ assessment });
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to assess risk',
        status: 500
      }
    });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const divisionFilter = req.user.role === 'admin' ? '' : 'WHERE division = ?';
    const params = req.user.role === 'admin' ? [] : [req.user.division || 'general'];

    const stats = await getOne(`
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
        COUNT(CASE WHEN status = 'critical' THEN 1 END) as critical_patients
      FROM patients
      ${divisionFilter}
    `, params);

    const recentAlerts = await getAll(`
      SELECT * FROM alerts
      ${divisionFilter}
      ORDER BY created_at DESC
      LIMIT 10
    `, params);

    const vitalsToday = await getOne(`
      SELECT COUNT(*) as count
      FROM patient_vitals v
      JOIN patients p ON v.patient_id = p.id
      WHERE date(v.recorded_at) = date('now')
      ${divisionFilter ? 'AND p.' + divisionFilter : ''}
    `, params);

    res.json({
      stats,
      recentAlerts,
      vitalsRecordedToday: vitalsToday.count
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get dashboard statistics',
        status: 500
      }
    });
  }
});

// Create appointment
router.post('/appointments', authenticateToken, async (req, res) => {
  try {
    const { patientId, appointmentDate, type, notes, provider } = req.body;

    if (!patientId || !appointmentDate || !type) {
      return res.status(400).json({
        error: {
          message: 'Patient ID, appointment date, and type are required',
          status: 400
        }
      });
    }

    const appointmentId = uuidv4();
    await runQuery(
      `INSERT INTO appointments 
       (id, patient_id, appointment_date, type, notes, provider, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, datetime('now'))`,
      [appointmentId, patientId, appointmentDate, type, notes, provider, req.user.id]
    );

    res.status(201).json({
      message: 'Appointment created successfully',
      appointmentId
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to create appointment',
        status: 500
      }
    });
  }
});

// Medical imaging analysis (mock)
router.post('/imaging/analyze', authenticateToken, async (req, res) => {
  try {
    const { imageType, patientId, imageData } = req.body;

    if (!imageType || !patientId) {
      return res.status(400).json({
        error: {
          message: 'Image type and patient ID are required',
          status: 400
        }
      });
    }

    // Mock AI analysis
    const analysis = {
      id: uuidv4(),
      patientId,
      imageType,
      timestamp: new Date().toISOString(),
      findings: {
        abnormalities: imageType === 'xray' ? [
          { type: 'opacity', location: 'right_upper_lobe', confidence: 0.87 },
          { type: 'nodule', location: 'left_lower_lobe', confidence: 0.65 }
        ] : [],
        measurements: {
          lungVolume: '5.2L',
          heartSize: 'normal'
        },
        aiConfidence: 0.92,
        recommendations: [
          'Follow-up CT scan recommended',
          'Consult with pulmonologist'
        ]
      }
    };

    res.json({ analysis });
  } catch (error) {
    console.error('Imaging analysis error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to analyze image',
        status: 500
      }
    });
  }
});

module.exports = router;
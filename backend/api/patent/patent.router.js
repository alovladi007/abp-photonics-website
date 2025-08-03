const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getOne, getAll } = require('../../shared/database');
const { authenticateToken } = require('../auth/auth.middleware');

const router = express.Router();

// Search patents
router.get('/search', async (req, res) => {
  try {
    const { 
      query = '', 
      category, 
      year, 
      status,
      limit = 20, 
      offset = 0,
      sortBy = 'filing_date',
      sortOrder = 'DESC'
    } = req.query;

    let sql = `
      SELECT p.*, 
             GROUP_CONCAT(i.name) as inventors
      FROM patents p
      LEFT JOIN patent_inventors pi ON p.id = pi.patent_id
      LEFT JOIN inventors i ON pi.inventor_id = i.id
      WHERE 1=1
    `;
    const params = [];

    // Add search conditions
    if (query) {
      sql += ` AND (p.title LIKE ? OR p.abstract LIKE ? OR p.claims LIKE ?)`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      sql += ` AND p.category = ?`;
      params.push(category);
    }

    if (year) {
      sql += ` AND strftime('%Y', p.filing_date) = ?`;
      params.push(year);
    }

    if (status) {
      sql += ` AND p.status = ?`;
      params.push(status);
    }

    sql += ` GROUP BY p.id`;
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const patents = await getAll(sql, params);

    // Get total count for pagination
    let countSql = `SELECT COUNT(DISTINCT p.id) as total FROM patents p WHERE 1=1`;
    const countParams = [];

    if (query) {
      countSql += ` AND (p.title LIKE ? OR p.abstract LIKE ? OR p.claims LIKE ?)`;
      const searchTerm = `%${query}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      countSql += ` AND p.category = ?`;
      countParams.push(category);
    }

    if (year) {
      countSql += ` AND strftime('%Y', p.filing_date) = ?`;
      countParams.push(year);
    }

    if (status) {
      countSql += ` AND p.status = ?`;
      countParams.push(status);
    }

    const { total } = await getOne(countSql, countParams);

    res.json({
      patents,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Patent search error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to search patents',
        status: 500
      }
    });
  }
});

// Get patent by ID
router.get('/:id', async (req, res) => {
  try {
    const patent = await getOne('SELECT * FROM patents WHERE id = ?', [req.params.id]);
    
    if (!patent) {
      return res.status(404).json({
        error: {
          message: 'Patent not found',
          status: 404
        }
      });
    }

    // Get inventors
    const inventors = await getAll(`
      SELECT i.* FROM inventors i
      JOIN patent_inventors pi ON i.id = pi.inventor_id
      WHERE pi.patent_id = ?
    `, [req.params.id]);

    // Get citations
    const citations = await getAll(`
      SELECT * FROM patent_citations
      WHERE patent_id = ?
    `, [req.params.id]);

    patent.inventors = inventors;
    patent.citations = citations;

    res.json({ patent });
  } catch (error) {
    console.error('Get patent error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get patent',
        status: 500
      }
    });
  }
});

// Get patent categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await getAll(`
      SELECT category, COUNT(*) as count
      FROM patents
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get categories',
        status: 500
      }
    });
  }
});

// Get patent statistics
router.get('/meta/statistics', async (req, res) => {
  try {
    const stats = await getOne(`
      SELECT 
        COUNT(*) as total_patents,
        COUNT(CASE WHEN status = 'granted' THEN 1 END) as granted,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'filed' THEN 1 END) as filed
      FROM patents
    `);

    const yearlyStats = await getAll(`
      SELECT 
        strftime('%Y', filing_date) as year,
        COUNT(*) as count
      FROM patents
      GROUP BY year
      ORDER BY year DESC
      LIMIT 10
    `);

    res.json({ 
      overview: stats,
      yearly: yearlyStats
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get statistics',
        status: 500
      }
    });
  }
});

// AI Analysis endpoint (mock for now)
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { patentId, analysisType = 'prior-art' } = req.body;

    if (!patentId) {
      return res.status(400).json({
        error: {
          message: 'Patent ID is required',
          status: 400
        }
      });
    }

    // Mock AI analysis
    const analysis = {
      id: uuidv4(),
      patentId,
      analysisType,
      timestamp: new Date().toISOString(),
      results: {
        priorArt: analysisType === 'prior-art' ? {
          similarPatents: [
            { id: 'US9876543B2', similarity: 0.87, title: 'Similar Patent 1' },
            { id: 'US8765432B1', similarity: 0.75, title: 'Similar Patent 2' }
          ],
          recommendation: 'Medium risk of prior art conflict'
        } : null,
        claims: analysisType === 'claims' ? {
          strength: 0.82,
          suggestions: [
            'Consider broadening claim 3 to cover additional embodiments',
            'Claim 7 may be too narrow and limit enforceability'
          ]
        } : null,
        market: analysisType === 'market' ? {
          estimatedValue: '$2.5M - $5M',
          potentialLicensees: ['Company A', 'Company B', 'Company C'],
          marketGrowth: '15% CAGR'
        } : null
      }
    };

    // Store analysis
    await runQuery(
      `INSERT INTO patent_analyses (id, patent_id, user_id, analysis_type, results, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [analysis.id, patentId, req.user.id, analysisType, JSON.stringify(analysis.results)]
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Patent analysis error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to analyze patent',
        status: 500
      }
    });
  }
});

// Get user's saved searches
router.get('/saved-searches', authenticateToken, async (req, res) => {
  try {
    const searches = await getAll(
      'SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ searches });
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get saved searches',
        status: 500
      }
    });
  }
});

// Save a search
router.post('/saved-searches', authenticateToken, async (req, res) => {
  try {
    const { name, query, filters } = req.body;

    if (!name || !query) {
      return res.status(400).json({
        error: {
          message: 'Name and query are required',
          status: 400
        }
      });
    }

    const id = uuidv4();
    await runQuery(
      `INSERT INTO saved_searches (id, user_id, name, query, filters, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [id, req.user.id, name, query, JSON.stringify(filters || {})]
    );

    res.status(201).json({
      message: 'Search saved successfully',
      search: { id, name, query, filters }
    });
  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to save search',
        status: 500
      }
    });
  }
});

module.exports = router;
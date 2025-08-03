require('dotenv').config();
const { db } = require('../shared/database');

const initDatabase = async () => {
  console.log('Initializing database...');

  try {
    // Users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        division TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Patents table
    await db.run(`
      CREATE TABLE IF NOT EXISTS patents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        abstract TEXT,
        claims TEXT,
        filing_date DATE,
        grant_date DATE,
        status TEXT DEFAULT 'pending',
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inventors table
    await db.run(`
      CREATE TABLE IF NOT EXISTS inventors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        organization TEXT
      )
    `);

    // Patent-Inventors junction table
    await db.run(`
      CREATE TABLE IF NOT EXISTS patent_inventors (
        patent_id TEXT,
        inventor_id TEXT,
        PRIMARY KEY (patent_id, inventor_id),
        FOREIGN KEY (patent_id) REFERENCES patents(id),
        FOREIGN KEY (inventor_id) REFERENCES inventors(id)
      )
    `);

    // Patent citations
    await db.run(`
      CREATE TABLE IF NOT EXISTS patent_citations (
        id TEXT PRIMARY KEY,
        patent_id TEXT,
        cited_patent_id TEXT,
        citation_type TEXT,
        FOREIGN KEY (patent_id) REFERENCES patents(id)
      )
    `);

    // Patent analyses
    await db.run(`
      CREATE TABLE IF NOT EXISTS patent_analyses (
        id TEXT PRIMARY KEY,
        patent_id TEXT,
        user_id TEXT,
        analysis_type TEXT,
        results TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patent_id) REFERENCES patents(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Saved searches
    await db.run(`
      CREATE TABLE IF NOT EXISTS saved_searches (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        query TEXT NOT NULL,
        filters TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Patients table
    await db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        patient_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        date_of_birth DATE,
        gender TEXT,
        division TEXT,
        status TEXT DEFAULT 'active',
        medical_record_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Patient vitals
    await db.run(`
      CREATE TABLE IF NOT EXISTS patient_vitals (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        heart_rate INTEGER,
        blood_pressure_systolic INTEGER,
        blood_pressure_diastolic INTEGER,
        temperature REAL,
        oxygen_saturation INTEGER,
        respiratory_rate INTEGER,
        glucose_level REAL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        recorded_by TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (recorded_by) REFERENCES users(id)
      )
    `);

    // Risk assessments
    await db.run(`
      CREATE TABLE IF NOT EXISTS risk_assessments (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        risk_score REAL,
        risk_level TEXT,
        factors TEXT,
        recommendations TEXT,
        assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        assessed_by TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (assessed_by) REFERENCES users(id)
      )
    `);

    // Appointments
    await db.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        appointment_date DATETIME,
        type TEXT,
        notes TEXT,
        provider TEXT,
        status TEXT DEFAULT 'scheduled',
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Security threats
    await db.run(`
      CREATE TABLE IF NOT EXISTS security_threats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        severity TEXT,
        threat_type TEXT,
        source TEXT,
        status TEXT DEFAULT 'active',
        resolution TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        created_by TEXT,
        resolved_by TEXT,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (resolved_by) REFERENCES users(id)
      )
    `);

    // Security events
    await db.run(`
      CREATE TABLE IF NOT EXISTS security_events (
        id TEXT PRIMARY KEY,
        event_type TEXT,
        description TEXT,
        severity TEXT,
        source TEXT,
        threat_id TEXT,
        user_id TEXT,
        occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (threat_id) REFERENCES security_threats(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Vulnerabilities
    await db.run(`
      CREATE TABLE IF NOT EXISTS vulnerabilities (
        id TEXT PRIMARY KEY,
        scan_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        severity TEXT,
        cvss_score REAL,
        affected_system TEXT,
        remediation TEXT,
        status TEXT DEFAULT 'open',
        discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        discovered_by TEXT,
        resolved_by TEXT,
        FOREIGN KEY (discovered_by) REFERENCES users(id),
        FOREIGN KEY (resolved_by) REFERENCES users(id)
      )
    `);

    // Alerts (general)
    await db.run(`
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        type TEXT,
        patient_id TEXT,
        threat_id TEXT,
        title TEXT,
        message TEXT,
        severity TEXT,
        division TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.run('CREATE INDEX IF NOT EXISTS idx_patents_status ON patents(status)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_patents_category ON patents(category)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_patients_division ON patients(division)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_threats_status ON security_threats(status)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_threats_severity ON security_threats(severity)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at)');

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
};

initDatabase();